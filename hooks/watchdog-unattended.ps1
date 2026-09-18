<#
.SYNOPSIS
  Watch an unattended run's heartbeat from OUTSIDE the app, and escalate if it dies.

.DESCRIPTION
  Built 2026-09-17. On 2026-09-16 an overnight run froze at 19:11 on a permission
  prompt nobody could answer, and nothing anywhere noticed until 09:27 the next
  morning. There WAS a heartbeat file. Nothing ever read it. The only reader was
  the relay itself, and the relay could not start, because the thing that blocked
  the driver also blocked its replacement. A heartbeat nobody reads is not a
  heartbeat.

  This runs under Windows Task Scheduler, so it does not care whether the Claude
  app is running, responsive, or sitting on a modal dialog.

  TWO STAGES, deliberately. The same night, the driver's heartbeat slipped to 33
  minutes while it was perfectly healthy, just absorbed in a long PR sequence. A
  single-stage watchdog on a 30 minute threshold would have killed a working run.
    Stage 1, default 45 min stale: log and email. Nothing is touched.
    Stage 2, default 90 min stale: restart the app, so the scheduled task's
             catch-up fire starts a fresh session that can take the stale lease.
  Restart is genuinely destructive - it ends every Claude session on the machine -
  so it is the second stage, not the first, and it defers while git is mid-write.

.PARAMETER Now
  Override the clock. Testing only: it is what lets the test suite prove each
  stage actually fires rather than asserting the code looks right.

.PARAMETER NoRestart
  Decide and log the restart, but do not perform it. Used by the tests, and
  sensible for the first few nights until the restart path has been watched.

.EXAMPLE
  powershell -File watchdog-unattended.ps1
  powershell -File watchdog-unattended.ps1 -Now "2026-09-16T22:00:00" -NoRestart
#>
[CmdletBinding()]
param(
  [string]$LeaseFile = (Join-Path $env:USERPROFILE '.claude\propos-overnight-heartbeat.txt'),
  [string]$LogFile = (Join-Path $env:USERPROFILE '.claude\watchdog-unattended.log'),
  [string]$StateFile = (Join-Path $env:USERPROFILE '.claude\watchdog-unattended.state'),
  [string]$RestartStateFile = (Join-Path $env:USERPROFILE '.claude\watchdog-unattended.restart-state'),
  [string[]]$GitRoots = @('C:\Users\ben\Projects\PropOS'),
  [int]$AlertAfterMinutes = 45,
  [int]$RestartAfterMinutes = 90,
  [string]$Aumid = 'Claude_pzs8sxrjxfjjc!Claude',
  [string]$Now,
  [switch]$NoRestart,
  [int]$NotifierTimeoutMs = 60000,
  [switch]$NoAlert
)

$ErrorActionPreference = 'Stop'
$nowDt = if ($Now) { [datetime]::Parse($Now) } else { Get-Date }

function Write-Log([string]$level, [string]$msg) {
  $line = "{0}  {1,-7} {2}" -f $nowDt.ToString('yyyy-MM-ddTHH:mm:ss'), $level, $msg
  try { Add-Content -Path $LogFile -Value $line -Encoding utf8 } catch { }
  Write-Output $line
}

# ---------------------------------------------------------------- read the lease
if (-not (Test-Path $LeaseFile)) {
  Write-Log 'IDLE' "no lease file at $LeaseFile; nothing to watch"
  exit 0
}
$lease = Get-Content $LeaseFile -Raw
$hb = [regex]::Match($lease, '(?m)^HEARTBEAT\s+(\S+)')
$drv = [regex]::Match($lease, '(?m)^DRIVER\s+(\S+)')
$inflight = [regex]::Match($lease, '(?m)^IN-FLIGHT\s+(.*)$')

if (-not $hb.Success) {
  # Unparseable is NOT healthy. Treat it as a fault rather than exiting quietly,
  # which is how a watchdog silently stops watching.
  Write-Log 'FAULT' "lease file present but no HEARTBEAT line could be parsed"
  exit 1
}
$driver = if ($drv.Success) { $drv.Groups[1].Value } else { '(unknown)' }
if ($driver -eq 'none') {
  Write-Log 'DONE' "DRIVER none: the run ended cleanly, nothing to watch"
  exit 0
}
# `pending` is ARMED BUT UNCLAIMED: the operator has written the lease, no driver has
# taken it yet. Without this state there is no lease value that both hands a run to the
# relay and leaves this watchdog quiet. A fresh HEARTBEAT makes the relay stand down; a
# stale one lands here as a false ALERT; a missing one lands below as a FAULT. So the
# arming lease says `pending`, and nothing is being watched until a driver claims it.
if ($driver -eq 'pending') {
  Write-Log 'ARMED' "DRIVER pending: armed but unclaimed, no driver to watch yet"
  exit 0
}

try { $beat = [datetime]::Parse($hb.Groups[1].Value) } catch {
  Write-Log 'FAULT' "HEARTBEAT '$($hb.Groups[1].Value)' is not a parseable timestamp"
  exit 1
}
$ageMin = [int][math]::Round(($nowDt - $beat).TotalMinutes)
$what = if ($inflight.Success) { $inflight.Groups[1].Value.Trim() } else { '(no IN-FLIGHT line)' }

# --------------------------------------------------------------- healthy? done.
if ($ageMin -lt $AlertAfterMinutes) {
  Write-Log 'OK' "driver=$driver age=${ageMin}m (alert at ${AlertAfterMinutes}m)"
  exit 0
}

# ------------------------------------------- escalate, but only once per level
$prevLevel = ''
if (Test-Path $StateFile) { try { $prevLevel = (Get-Content $StateFile -Raw).Trim() } catch { } }
$level = if ($ageMin -ge $RestartAfterMinutes) { 'RESTART' } else { 'ALERT' }
$key = "$level|$($hb.Groups[1].Value)"

# Sets $script:alertDelivered. It does NOT return a value, because Write-Log writes to
# the output stream, so anything this function "returned" would arrive at the caller
# mixed in with log lines.
#
# WHY THE DELIVERY RESULT IS NOW CHECKED. Until 2026-09-18 this captured the notifier's
# output, logged it, and told the caller nothing. The caller then wrote the state key
# that suppresses repeats REGARDLESS. So Outlook COM could fail at 2am, no mail would
# arrive, the run would record the alert as delivered, and it would never try again.
# The alert is the entire safety net for an unattended weekend; a safety net that
# reports success when it has failed is worse than none, because it is trusted.
# Found by an independent reviewer on 2026-09-18, not by the author.
function Send-Alert([string]$subject, [string]$body) {
  $script:alertDelivered = $false
  if ($NoAlert) { Write-Log 'ALERT' "(suppressed by -NoAlert) $subject"; $script:alertDelivered = $true; return }
  $notifier = Join-Path $PSScriptRoot 'notify-owner.ps1'
  if (-not (Test-Path $notifier)) { Write-Log 'FAULT' "notifier missing at $notifier"; return }
  try {
    # Bounded: a blocked COM call or an Outlook security prompt would otherwise hang
    # this watchdog with neither success nor failure recorded.
    $p = Start-Process -FilePath 'powershell' -PassThru -WindowStyle Hidden -ArgumentList @(
      '-NoProfile', '-File', $notifier, '-Subject', $subject, '-Body', $body)
    $null = $p.Handle
    if (-not $p.WaitForExit($NotifierTimeoutMs)) {
      try { $p.Kill() } catch { }
      Write-Log 'FAULT' "NOT SENT, the notifier did not return within $([int]($NotifierTimeoutMs/1000))s and was killed. Will retry at the next sweep."
    } elseif ($p.ExitCode -eq 0) {
      # "Queued", not "delivered": exit 0 means Outlook accepted the item. It can still
      # sit in an outbox or bounce, and this has no way to know.
      Write-Log 'ALERT' 'queued with Outlook. Acceptance, not delivery.'
      $script:alertDelivered = $true
    } else {
      Write-Log 'FAULT' "NOT SENT, notifier exited $($p.ExitCode). Will retry at the next sweep."
    }
  } catch {
    Write-Log 'FAULT' "NOT SENT, notifier threw: $($_.Exception.Message). Will retry at the next sweep."
  }
}

if ($prevLevel -eq $key) {
  Write-Log $level "already escalated for this heartbeat (age=${ageMin}m); not repeating"
} else {
  Write-Log $level "driver=$driver age=${ageMin}m last-known-work: $what"
  # Operational facts only. No client, property, financial or file content here:
  # the recipient may be an address outside the corporate estate.
  Send-Alert "PropOS unattended run: no heartbeat for ${ageMin}m" `
    ("Machine: $env:COMPUTERNAME`r`nDriver: $driver`r`nHeartbeat age: ${ageMin} minutes`r`nStage: $level`r`n`r`nLast IN-FLIGHT line:`r`n$what`r`n`r`nThe run has stopped making progress. Details are in the queue file on the machine.")
  # The state key is what suppresses the repeat. Write it ONLY on a delivery that
  # actually succeeded, so a failed send is retried at the next sweep instead of being
  # silently marked done.
  if ($script:alertDelivered) {
    try { Set-Content -Path $StateFile -Value $key -Encoding utf8 } catch { }
  } else {
    Write-Log 'FAULT' 'escalation NOT recorded because the alert did not reach the owner; it will be attempted again'
  }
}

if ($level -ne 'RESTART') { exit 0 }

# ---------------------------------------------------------------- stage 2: restart
# ONE SHOT PER HEARTBEAT VALUE. The $key guard above suppresses the repeat EMAIL
# only; until 2026-09-18 the restart itself ran on every fire. A lease that stays
# stale because no relay fire picks it up (the network is down, or under the old
# evening-only cron any stall between 07:00 and 17:00) therefore meant killing and
# relaunching the app every 15 minutes, indefinitely, including any session the
# owner had started. Invisible on a single night; over a weekend it is dozens.
# A successful restart is recorded against the heartbeat that provoked it, so a
# fresh stall later gets a fresh restart, and a DEFER or a failed relaunch writes
# nothing and is retried at the next fire.
$prevRestart = ''
if (Test-Path $RestartStateFile) { try { $prevRestart = (Get-Content $RestartStateFile -Raw).Trim() } catch { } }
if ($prevRestart -eq $hb.Groups[1].Value) {
  Write-Log 'RESTART' "already restarted for this heartbeat (age=${ageMin}m); not restarting again"
  exit 0
}

# Never interrupt a git write. A half-finished index is a worse state to wake to
# than a stalled run, and index.lock is the cheap, reliable signal for it.
$locks = @()
foreach ($root in $GitRoots) {
  if (-not (Test-Path $root)) { continue }
  $locks += Get-ChildItem -Path $root -Recurse -Force -Filter 'index.lock' -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty FullName
}
if ($locks.Count -gt 0) {
  Write-Log 'DEFER' "git index.lock present, not restarting: $($locks -join '; ')"
  exit 0
}

if ($NoRestart) {
  Write-Log 'RESTART' "(suppressed by -NoRestart) would kill claude processes and relaunch $Aumid"
  exit 0
}

$procs = @(Get-Process -Name 'claude' -ErrorAction SilentlyContinue)
Write-Log 'RESTART' "stopping $($procs.Count) claude process(es)"
foreach ($p in $procs) { try { Stop-Process -Id $p.Id -Force -ErrorAction Stop } catch { } }
Start-Sleep -Seconds 5
try {
  Start-Process 'explorer.exe' -ArgumentList "shell:AppsFolder\$Aumid"
  # Only now, after a relaunch that did not throw: a marker written earlier would
  # turn a failed restart into a permanent one-shot that never retries.
  try { Set-Content -Path $RestartStateFile -Value $hb.Groups[1].Value -Encoding utf8 } catch { }
  Write-Log 'RESTART' "relaunched $Aumid; the scheduled task's catch-up fire should take the stale lease"
} catch {
  Write-Log 'FAULT' "relaunch failed: $($_.Exception.Message)"
  exit 1
}
exit 0
