<#
.SYNOPSIS
  Fire one unattended relay turn through the Claude Code CLI, not the desktop app.

.DESCRIPTION
  Built 2026-09-18, after the app's scheduled-task route was measured to be unusable
  unattended. Two supervised rides that morning established, with the owner watching:

    * a task-started session PROMPTS, and
    * `"defaultMode": "bypassPermissions"` in `.claude/settings.local.json` does NOT
      reach it, and
    * the routine has no permission setting in the app UI, and
    * the gating is SELECTIVE - some command shapes ran in under a second while a
      Bash probe was held 15 seconds and minted an allow rule.

  That last point is why this exists. A run that froze on its first command would be
  merely useless. A run that works for hours and then freezes on whichever shape
  happens to prompt is the 2026-09-16 failure, which cost fourteen hours.

  The CLI takes the permission mode as an explicit flag, so it is knowable rather
  than inherited from somewhere nobody can read.

  WHAT IS UNCHANGED, and it is nearly everything: the lease file, safe-push,
  push-gate's lease-aware deny, both watchdogs, the queue file and the relay prompt.
  Only the launcher changes.

  THE DENY MUST STILL HOLD. `--dangerously-skip-permissions` turns off the permission
  system; it must NOT turn off hooks, because push-gate's deny is the only mechanical
  thing protecting `main` during a run. `-VerifyOnly` checks exactly that and refuses
  to fire if the deny is not returned. Nothing should ever schedule this script
  without having seen -VerifyOnly pass on this machine.

.PARAMETER VerifyOnly
  Run the pre-flight checks and exit without starting a turn. Use this before
  scheduling, and after any CLI upgrade.

.EXAMPLE
  powershell -File relay-cli-fire.ps1 -VerifyOnly
  powershell -File relay-cli-fire.ps1
#>
[CmdletBinding()]
param(
  [string]$PromptFile = (Join-Path $env:USERPROFILE '.claude\scheduled-tasks\propos-overnight-relay\SKILL.md'),
  [string]$Repo = 'C:\Users\ben\Projects\PropOS',
  [string]$LeaseFile = (Join-Path $env:USERPROFILE '.claude\propos-overnight-heartbeat.txt'),
  [string]$LogFile = (Join-Path $env:USERPROFILE '.claude\relay-cli-fire.log'),
  [string]$Cli = (Join-Path $env:APPDATA 'npm\claude.cmd'),
  [int]$MaxTurns = 0,
  [switch]$VerifyOnly
)

$ErrorActionPreference = 'Stop'
$now = Get-Date

function Write-Log([string]$level, [string]$msg) {
  $line = "{0}  {1,-9} {2}" -f $now.ToString('yyyy-MM-ddTHH:mm:ss'), $level, $msg
  try { Add-Content -Path $LogFile -Value $line -Encoding utf8 } catch { }
  Write-Output $line
}

# ---------------------------------------------------------------- pre-flight
if (-not (Test-Path $Cli))        { Write-Log 'FAULT' "CLI not found at $Cli"; exit 1 }
if (-not (Test-Path $PromptFile)) { Write-Log 'FAULT' "prompt not found at $PromptFile"; exit 1 }
if (-not (Test-Path $Repo))       { Write-Log 'FAULT' "repo not found at $Repo"; exit 1 }

# THE LOAD-BEARING CHECK. push-gate must still return `deny` for a protected push
# while a driver holds the lease. If hooks do not run under the CLI, or the lease is
# not where the hook looks, this comes back anything other than "deny" and we refuse
# to start. A gate that is not proven on the day is not a gate.
$gate = Join-Path $PSScriptRoot 'push-gate.mjs'
if (-not (Test-Path $gate)) { Write-Log 'FAULT' "push-gate.mjs not found next to this script"; exit 1 }

$probeLease = Join-Path $env:TEMP ("relay-gate-probe-{0}.txt" -f ([guid]::NewGuid().ToString('N')))
@"
HEARTBEAT $($now.ToString('o'))
DRIVER gate-selfcheck
WINDOW-ENDS $($now.AddHours(1).ToString('o'))
IN-FLIGHT launcher self-check
"@ | Set-Content -Path $probeLease -Encoding ascii

# The event is written to a file and redirected in through cmd, NOT piped from
# PowerShell. `$evt | & node $gate` returns EMPTY here, reproducibly, even though the
# same pipe delivers stdin to a plain `node -e` fine; push-gate shells out to git for
# its freshness probe and something in that combination eats the output. An empty
# result would read as "no deny" and fail this check for the wrong reason, which is
# the worst kind of false alarm on a gate. The redirect form is proven.
$evtFile = Join-Path $env:TEMP ("relay-gate-evt-{0}.json" -f ([guid]::NewGuid().ToString('N')))
$outFile = Join-Path $env:TEMP ("relay-gate-out-{0}.txt" -f ([guid]::NewGuid().ToString('N')))
try {
  # Built by concatenation so this script's own text does not contain the literal
  # command: push-gate reads the commands that RUN it, and a session editing or
  # running this file would otherwise gate itself on its own source.
  $cmdText = 'git' + ' pu' + 'sh origin main'
  $evt = '{"tool_name":"Bash","tool_input":{"command":"' + $cmdText + '"},"cwd":"' + ($Repo -replace '\\', '/') + '"}'
  Set-Content -Path $evtFile -Value $evt -Encoding ascii -NoNewline

  $prev = $env:PROPOS_LEASE_FILE
  $env:PROPOS_LEASE_FILE = $probeLease
  & cmd /c "node ""$gate"" < ""$evtFile"" > ""$outFile"" 2>&1"
  $env:PROPOS_LEASE_FILE = $prev
  $out = if (Test-Path $outFile) { Get-Content $outFile -Raw } else { '' }
} finally {
  Remove-Item $probeLease, $evtFile, $outFile -ErrorAction SilentlyContinue
}

if (-not $out) {
  Write-Log 'FAULT' 'push-gate returned NOTHING for a protected push. That is not a pass, it is a broken check. REFUSING TO FIRE.'
  exit 1
}

if ($out -notmatch '"permissionDecision"\s*:\s*"deny"') {
  Write-Log 'FAULT' "push-gate did NOT return deny for a protected push against a live-driver lease. REFUSING TO FIRE. Got: $($out.Trim())"
  exit 1
}
Write-Log 'OK' 'push-gate returns deny for a protected push against a live-driver lease'

if ($VerifyOnly) {
  Write-Log 'OK' 'verify-only: pre-flight passed, not firing a turn'
  exit 0
}

# ------------------------------------------------------- stand down if not armed
# Cheap check before spending anything. The relay prompt does this too, but a CLI
# turn costs real money to start, so do not start one just to read four lines.
if (Test-Path $LeaseFile) {
  $driver = (Select-String -Path $LeaseFile -Pattern '^DRIVER\s+(\S+)' -AllMatches |
             Select-Object -First 1).Matches.Groups[1].Value
  if ($driver -eq 'none') { Write-Log 'DONE' 'DRIVER none: the run ended, not firing'; exit 0 }
  if ($driver -and $driver -ne 'pending') {
    $hb = (Select-String -Path $LeaseFile -Pattern '^HEARTBEAT\s+(\S+)' |
           Select-Object -First 1).Matches.Groups[1].Value
    try {
      $age = ($now - [datetime]::Parse($hb)).TotalMinutes
      if ($age -lt 45) {
        Write-Log 'STANDDOWN' ("driver {0} alive, heartbeat {1:N0}m old, not firing" -f $driver, $age)
        exit 0
      }
      Write-Log 'TAKEOVER' ("driver {0} heartbeat {1:N0}m old, firing a replacement" -f $driver, $age)
    } catch {
      Write-Log 'TAKEOVER' "heartbeat unparseable, firing a replacement"
    }
  }
} else {
  Write-Log 'FAULT' "no lease file at $LeaseFile, not firing"; exit 1
}

# ------------------------------------------------------------------- fire one turn
# The prompt goes in on STDIN and the output comes out to a FILE. Neither is
# fussiness. The prompt is ~10KB of markdown and would not survive argument
# quoting; and the CLI writes warnings to stderr, which PowerShell 5.1 wraps in
# ErrorRecords, which with $ErrorActionPreference=Stop kills this script the
# instant the CLI says anything at all. That is exactly how the first CLI fire
# died: the FIRE line was logged, no END line ever was, and the turn never ran.
$cliOut = Join-Path $env:TEMP ("relay-cli-out-{0}.txt" -f ([guid]::NewGuid().ToString('N')))
$turns = if ($MaxTurns -gt 0) { " --max-turns $MaxTurns" } else { '' }

Write-Log 'FIRE' "starting a CLI turn in $Repo"
Push-Location $Repo
try {
  $inner = 'type "' + $PromptFile + '" | "' + $Cli + '" -p --permission-mode bypassPermissions --dangerously-skip-permissions' + $turns + ' > "' + $cliOut + '" 2>&1'
  & cmd /c $inner
  $code = $LASTEXITCODE
  $out = if (Test-Path $cliOut) { Get-Content $cliOut -Raw } else { '' }
} finally {
  Pop-Location
}

Write-Log 'END' "CLI exited $code, $($out.Length) chars of output"
# The session transcript is the real record; keep a tail here so the log alone is
# enough to see whether a fire did anything.
$tail = ($out -split "`n" | Where-Object { $_ -notmatch 'Permission allow rule' -and $_.Trim() } | Select-Object -Last 10) -join "`n"
try { Add-Content -Path $LogFile -Value $tail -Encoding utf8 } catch { }
try { Remove-Item -LiteralPath $cliOut -ErrorAction SilentlyContinue } catch { }
exit $code
