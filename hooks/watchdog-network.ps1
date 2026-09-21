<#
.SYNOPSIS
  Watch this machine's route to the internet, and try to repair it when it drops.

.DESCRIPTION
  Built 2026-09-18. github.com was unresolvable from this machine at 05:30 on
  2026-09-17, which cost an unattended run its remaining window, and it happened
  again during the 2026-09-18 arming session: a push failed with "Could not resolve
  host: github.com" and the identical command succeeded seconds later. So the
  outage shape here is a SHORT DNS-resolution failure on a working link, not a dead
  adapter, and the remedy that matches it is a DNS cache flush.

  WHAT THIS CAN AND CANNOT DO ON THIS MACHINE, measured 2026-09-18, not assumed:
    Clear-DnsClientCache    WORKS unelevated. This is stage 1 and it is the one
                            that matches the observed failure.
    Restart-NetAdapter      Needs administrator. This account is NOT a local admin
                            (checked: IsInRole(Administrator) false, and the user is
                            not in BUILTIN\Administrators). Stage 2 therefore
                            attempts it and LOGS THE REFUSAL rather than pretending
                            it worked. To make stage 2 real, an administrator must
                            re-register this task with -RunLevel Highest; the exact
                            command is in NETWORK-WATCHDOG.md next to this file.

  DELIBERATELY NOT A RETRY LOOP. The sibling watchdog (watchdog-unattended.ps1) had
  exactly this bug until 2026-09-18: its repeat guard suppressed the repeat EMAIL
  but not the repeat RESTART, so a condition that persisted meant the destructive
  action every 15 minutes indefinitely. The same trap applies harder here, because
  if the outage is upstream (the router, the ISP) then no amount of local flushing
  or adapter bouncing will fix it, and bouncing the adapter every fire is strictly
  worse than leaving it alone. So: remediation is capped per outage, and once the
  cap is reached this only watches and logs until the link returns.

.PARAMETER ForceDown
  Treat the link as down without testing it. Testing only: it is what lets the
  suite prove each stage fires, since a test cannot unplug the network.

.PARAMETER NoRemediate
  Decide and log, but do not flush or restart anything. Used by the tests.

.EXAMPLE
  powershell -File watchdog-network.ps1
  powershell -File watchdog-network.ps1 -ForceDown -NoRemediate -NoAlert
#>
[CmdletBinding()]
param(
  [string[]]$Targets = @('github.com', 'api.github.com'),
  [string]$LogFile = (Join-Path $env:USERPROFILE '.claude\watchdog-network.log'),
  [string]$StateFile = (Join-Path $env:USERPROFILE '.claude\watchdog-network.state'),
  [string]$AdapterName = '',
  [int]$MaxRemediationsPerOutage = 3,
  # Testing only: point at a stub that exits non-zero, to prove a failed delivery does
  # not suppress the retry. Defaults to the real notifier beside this script.
  [string]$Notifier = '',
  # The recipient config. Parameterised for the same reason as $Notifier: it was read
  # straight from $env:USERPROFILE, so the two alert-path cases in the sibling suite
  # silently depended on a file that exists only on the maintainer's machine. They
  # passed there and failed on a hosted runner the first time one ever ran them, which
  # is the defect this whole family of suites was fixed for on 2026-09-21. The default
  # is the previous expression unchanged, so the scheduled task behaves identically.
  [string]$ConfigFile = (Join-Path $env:USERPROFILE '.claude\notify-owner.config.json'),
  [int]$NotifierTimeoutMs = 60000,
  [int]$TimeoutMs = 4000,
  [string]$Now,
  [switch]$ForceDown,
  [switch]$NoRemediate,
  [switch]$NoAlert
)

$ErrorActionPreference = 'Stop'
$nowDt = if ($Now) { [datetime]::Parse($Now) } else { Get-Date }

function Write-Log([string]$level, [string]$msg) {
  $line = "{0}  {1,-9} {2}" -f $nowDt.ToString('yyyy-MM-ddTHH:mm:ss'), $level, $msg
  try { Add-Content -Path $LogFile -Value $line -Encoding utf8 } catch { }
  Write-Output $line
}

# --------------------------------------------------------------- the reachability test
# TWO targets and two different questions, because a single host is not evidence.
# A name that will not resolve AND a socket that will not open is an outage; one of
# the two failing on its own is that host having a bad minute, and bouncing the
# adapter over it would be a self-inflicted outage.
function Test-Reachable {
  if ($ForceDown) { return $false }
  foreach ($t in $Targets) {
    $resolved = $false
    try { $null = Resolve-DnsName -Name $t -QuickTimeout -ErrorAction Stop; $resolved = $true } catch { }
    if (-not $resolved) { continue }
    $client = $null
    try {
      $client = New-Object Net.Sockets.TcpClient
      if ($client.ConnectAsync($t, 443).Wait($TimeoutMs)) { return $true }
    } catch {
    } finally {
      if ($client) { try { $client.Dispose() } catch { } }
    }
  }
  return $false
}

# ------------------------------------------------------------------------ outage state
# outageStart keeps the remediation budget tied to ONE outage: a link that recovers
# and drops again an hour later gets a fresh budget, which is right, while a link
# that never comes back does not get an unbounded number of adapter bounces.
$state = [ordered]@{ outageStart = ''; remediations = 0; alerted = $false }
if (Test-Path $StateFile) {
  try {
    $raw = Get-Content $StateFile -Raw | ConvertFrom-Json
    if ($raw.outageStart) { $state.outageStart = [string]$raw.outageStart }
    if ($null -ne $raw.remediations) { $state.remediations = [int]$raw.remediations }
    if ($null -ne $raw.alerted) { $state.alerted = [bool]$raw.alerted }
  } catch { }
}
# WITHOUT a byte order mark. PowerShell 5.1's `Set-Content -Encoding utf8` writes
# one, and a leading U+FEFF makes this file unreadable to JSON.parse, so anything
# other than PowerShell that inspects the state (the test suite, a later diagnostic)
# fails on a file that looks perfectly fine in an editor.
function Save-State {
  try {
    [IO.File]::WriteAllText($StateFile, ($state | ConvertTo-Json -Compress), (New-Object Text.UTF8Encoding $false))
  } catch { }
}

# ----------------------------------------------------------------------------- healthy
if (Test-Reachable) {
  if ($state.outageStart) {
    $mins = [int][math]::Round(($nowDt - [datetime]::Parse($state.outageStart)).TotalMinutes)
    Write-Log 'RECOVERED' "link is back after ${mins}m (remediations attempted this outage: $($state.remediations))"
    $state.outageStart = ''; $state.remediations = 0; $state.alerted = $false
    Save-State
  } else {
    Write-Log 'OK' "reachable: $($Targets -join ', ')"
  }
  exit 0
}

# ------------------------------------------------------------------------------- down
if (-not $state.outageStart) {
  $state.outageStart = $nowDt.ToString('o')
  Save-State
}
$downMin = [int][math]::Round(($nowDt - [datetime]::Parse($state.outageStart)).TotalMinutes)
Write-Log 'DOWN' "no route to $($Targets -join ' or ') (down ${downMin}m, remediations so far: $($state.remediations))"

if ($state.remediations -ge $MaxRemediationsPerOutage) {
  # The cap is the whole point. Past here the fault is almost certainly upstream,
  # and the honest thing is to keep watching so RECOVERED still gets logged.
  Write-Log 'CAPPED' "already tried $($state.remediations) remediation(s) this outage; watching only, not touching the adapter again"
  exit 0
}

$state.remediations++
Save-State

# --------------------------------------------------------- stage 1: flush the resolver
if ($NoRemediate) {
  Write-Log 'FLUSH' "(suppressed by -NoRemediate) would clear the DNS client cache"
} else {
  try {
    Clear-DnsClientCache -ErrorAction Stop
    Write-Log 'FLUSH' 'cleared the DNS client cache'
  } catch {
    Write-Log 'FAULT' "could not clear the DNS cache: $($_.Exception.Message)"
  }
  Start-Sleep -Seconds 3
  if (Test-Reachable) {
    Write-Log 'RECOVERED' 'link returned after the DNS flush'
    $state.outageStart = ''; $state.remediations = 0; $state.alerted = $false
    Save-State
    exit 0
  }
}

# ------------------------------------------------- stage 2: bounce the adapter, if allowed
# Only from the second remediation of an outage. One flush is cheap and fixes the
# failure actually seen on this machine; bouncing the link is not, and doing it on
# the first fire would drop a connection that a flush alone would have fixed.
if ($state.remediations -lt 2) {
  Write-Log 'WAIT' 'flush did not fix it; leaving the adapter alone until the next fire'
  exit 0
}

$adapter = $AdapterName
if (-not $adapter) {
  try {
    # Physical only: the Hyper-V "Default Switch" is always Up and is not the route out.
    $adapter = (Get-NetAdapter -Physical -ErrorAction Stop |
                Where-Object Status -eq 'Up' |
                Sort-Object -Property LinkSpeed -Descending |
                Select-Object -First 1 -ExpandProperty Name)
  } catch { }
}
if (-not $adapter) {
  Write-Log 'FAULT' 'no physical adapter is Up, so there is nothing to restart'
  exit 0
}

if ($NoRemediate) {
  # Falls THROUGH to the alert rather than exiting. -NoRemediate means "decide and log,
  # do not act", and the alert is a decision. Exiting here made the alert path
  # unreachable in the suite, which is how the notifier's delivery result went
  # unchecked until 2026-09-18: the one branch that mattered had no test that could
  # reach it.
  Write-Log 'RESTART' "(suppressed by -NoRemediate) would restart adapter '$adapter'"
} else {

try {
  Restart-NetAdapter -Name $adapter -Confirm:$false -ErrorAction Stop
  Write-Log 'RESTART' "restarted adapter '$adapter'"
  Start-Sleep -Seconds 15
  if (Test-Reachable) {
    Write-Log 'RECOVERED' "link returned after restarting '$adapter'"
    $state.outageStart = ''; $state.remediations = 0; $state.alerted = $false
    Save-State
    exit 0
  }
  Write-Log 'DOWN' "still no route after restarting '$adapter'"
} catch {
  # The expected outcome on this machine. Said plainly so nobody reads the log and
  # believes an adapter reset is protecting the run when it never ran.
  Write-Log 'NOPERM' "cannot restart '$adapter' from this account: $($_.Exception.Message). An administrator must re-register this task with -RunLevel Highest; see NETWORK-WATCHDOG.md"
}

}

# --------------------------------------------------------------------------- tell someone
# Once per outage, and only after the local remedies are exhausted. If the link is
# still down the mail sits in Outlook's outbox and leaves when the link returns,
# which is late but is still the difference between knowing and not knowing.
if (-not $state.alerted -and -not $NoAlert) {
  $delivered = $false
  $notifier = if ($Notifier) { $Notifier } else { Join-Path $PSScriptRoot 'notify-owner.ps1' }
  $configPath = $ConfigFile
  if ((Test-Path $notifier) -and (Test-Path $configPath)) {
    try {
      $to = (Get-Content $configPath -Raw | ConvertFrom-Json).to
      # Operational facts only: this may reach an address outside the corporate estate.
      #
      # THE RESULT IS CHECKED. Until 2026-09-18 this discarded the notifier's output to
      # $null, logged "notified the owner" unconditionally, and set alerted = true, so a
      # failed send was recorded as delivered and never retried. Worse than the sibling
      # watchdog's version of the same bug, which at least logged what the notifier said.
      # Found by an independent reviewer, not by the author.
      # Bounded, because a blocked COM call or an Outlook security prompt would
      # otherwise hang this watchdog indefinitely with neither success nor failure
      # recorded, which is the quietest failure in the whole chain.
      $body = "Machine: $env:COMPUTERNAME`r`nDown since: $($state.outageStart)`r`nLocal remedies attempted: $($state.remediations)`r`nAdapter restart: see the log for whether this account was permitted to.`r`n`r`nAn unattended run cannot push or fetch while this lasts. Details in watchdog-network.log on the machine."
      $p = Start-Process -FilePath 'powershell' -PassThru -WindowStyle Hidden -ArgumentList @(
        '-NoProfile', '-File', $notifier, '-To', $to,
        '-Subject', 'PropOS: this machine has lost its route to the internet',
        '-Body', $body)
      $null = $p.Handle
      if (-not $p.WaitForExit($NotifierTimeoutMs)) {
        try { $p.Kill() } catch { }
        Write-Log 'FAULT' "NOT SENT, the notifier did not return within $([int]($NotifierTimeoutMs/1000))s and was killed. Will retry at the next sweep."
      } elseif ($p.ExitCode -eq 0) {
        # DELIBERATE WORDING. Exit 0 means Outlook ACCEPTED the item, not that it
        # reached the owner: the message can sit in an outbox, bounce, or be rejected
        # later, and this has no way to know. Saying "notified" would be the same class
        # of lie as the bug this replaced.
        Write-Log 'ALERT' 'queued with Outlook (once per outage). Acceptance, not delivery.'
        $delivered = $true
      } else {
        Write-Log 'FAULT' "NOT SENT, notifier exited $($p.ExitCode). Will retry at the next sweep."
      }
    } catch {
      Write-Log 'FAULT' "NOT DELIVERED, notifier threw: $($_.Exception.Message). Will retry at the next sweep."
    }
  } else {
    Write-Log 'FAULT' 'notifier or its config is missing, so nobody was told'
  }
  # Only a delivery that actually happened suppresses the retry. An outage during which
  # the owner could not be reached must keep trying, not go quiet.
  if ($delivered) {
    $state.alerted = $true
    Save-State
  }
}

exit 0
