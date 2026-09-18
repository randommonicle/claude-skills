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
  thing protecting `main` during a run.

  WHAT -VerifyOnly ACTUALLY CHECKS, corrected 2026-09-18 after a reviewer read the
  code rather than this comment. It invokes push-gate.mjs DIRECTLY and asserts the
  deny. That proves the hook still denies; it does NOT prove the CLI honours hooks,
  because the CLI is not involved in the check at all. The integration question is
  answered by `relay-cli-hooktest.ps1`, which drives a real CLI turn and reads
  push-gate's own DENIED text out of the stream-json tool result. Run THAT after any
  CLI upgrade or permission-model change; this per-fire check cannot detect such a
  regression.

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
  # Where the running driver's process-tree root is recorded, so a later fire can kill
  # it. Beside the lease, not in TEMP, because it must outlive a reboot's temp sweep.
  [string]$PidFile = (Join-Path $env:USERPROFILE '.claude\propos-overnight-driver.pid'),
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

# ------------------------------------------------- terminating a driver that hung
# WHY THIS EXISTS, measured rather than assumed. A reviewer challenged the claim that
# a hung driver is bounded by the scheduled task's ExecutionTimeLimit. A controlled
# probe on 2026-09-18 settled it against that claim: a task with a one-minute limit
# spawned a child, the limit expired, the task returned to Ready, and THE CHILD WAS
# STILL RUNNING. Task Scheduler terminates the registered process, not the tree.
#
# So the launcher's own `cmd.exe` dies at the limit while the CLI and its node
# descendants survive as orphans, the scheduler admits the next fire, and a
# replacement driver starts ALONGSIDE the hung one. Nothing else on this machine kills
# it: the heartbeat watchdog is alert-only, and even armed it targets `claude`, the
# desktop app.
#
# Hence: record the tree root, and kill it before starting a replacement.
#
# PID REUSE IS GUARDED. Windows recycles process ids, so the start time is recorded
# alongside and must match to the second before anything is killed. Without that, a
# stale file could name a pid now belonging to something else entirely.
function Save-DriverPid([int]$processId) {
  try {
    $p = Get-Process -Id $processId -ErrorAction Stop
    $payload = '{0}|{1}' -f $processId, $p.StartTime.ToString('o')
    [IO.File]::WriteAllText($PidFile, $payload, (New-Object Text.UTF8Encoding $false))
  } catch { }
}

function Clear-DriverPid {
  try { if (Test-Path $PidFile) { Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue } } catch { }
}

function Stop-StaleDriver {
  if (-not (Test-Path $PidFile)) { Write-Log 'TAKEOVER' 'no recorded driver process to stop'; return }
  $raw = ''
  try { $raw = (Get-Content $PidFile -Raw).Trim() } catch { }
  $parts = $raw -split '\|'
  if ($parts.Count -ne 2) { Write-Log 'FAULT' "driver pid file is malformed ('$raw'); not killing anything"; Clear-DriverPid; return }

  $oldPid = 0
  if (-not [int]::TryParse($parts[0], [ref]$oldPid)) { Write-Log 'FAULT' "driver pid '$($parts[0])' is not a number"; Clear-DriverPid; return }

  $proc = $null
  try { $proc = Get-Process -Id $oldPid -ErrorAction Stop } catch { }
  if (-not $proc) { Write-Log 'TAKEOVER' "recorded driver pid $oldPid is already gone"; Clear-DriverPid; return }

  # The identity check. A pid that exists but started at a different moment is a
  # DIFFERENT process that happens to have inherited the number.
  $want = $parts[1]
  $got = ''
  try { $got = $proc.StartTime.ToString('o') } catch { }
  if ($got -ne $want) {
    Write-Log 'FAULT' "pid $oldPid exists but started $got, not $want; it is a different process and will NOT be killed"
    Clear-DriverPid
    return
  }

  # /T for the tree, because the thing that actually hangs is a node descendant.
  try {
    $null = & taskkill /T /F /PID $oldPid 2>&1
    Write-Log 'TAKEOVER' "killed the stale driver process tree at pid $oldPid"
  } catch {
    Write-Log 'FAULT' "could not kill stale driver pid ${oldPid}: $($_.Exception.Message)"
  }
  Clear-DriverPid
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

  # Past the window, do not spend a turn. safe-push already refuses to publish once
  # WINDOW-ENDS has passed, but until 2026-09-18 nothing stopped the LAUNCHER firing,
  # so a lease left armed after the window would keep paying for turns that could
  # commit and never publish. The scheduled task's repetition duration currently
  # expires at the same moment, which made this close to moot; that is a coincidence
  # of today's arming, not a guarantee, and a second bound costs nothing.
  $endsRaw = (Select-String -Path $LeaseFile -Pattern '^WINDOW-ENDS\s+(\S+)' |
              Select-Object -First 1).Matches.Groups[1].Value
  if ($endsRaw) {
    try {
      $endsAt = [datetime]::Parse($endsRaw)
      if ($now -ge $endsAt) {
        Write-Log 'CLOSED' "the window closed at $endsRaw; not firing"
        exit 0
      }
    } catch {
      Write-Log 'FAULT' "WINDOW-ENDS '$endsRaw' is not a parseable timestamp; not firing"
      exit 1
    }
  } else {
    Write-Log 'FAULT' 'lease has no WINDOW-ENDS line, so no window is open; not firing'
    exit 1
  }
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
      Stop-StaleDriver
    } catch {
      Write-Log 'TAKEOVER' "heartbeat unparseable, firing a replacement"
      Stop-StaleDriver
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

# Streams are redirected by Start-Process directly; there is no cmd wrapper and no
# pipeline. The first attempt wrapped `type prompt | claude -p ...` in a .cmd and
# launched that, which works under `& cmd /c` but NOT under Start-Process: the CLI
# returned "Input must be provided either through stdin or as a prompt argument when
# using --print", so the prompt never reached it. Start-Process is required for the pid,
# so the pipeline had to go instead.
$cliErr = Join-Path $env:TEMP ("relay-cli-err-{0}.txt" -f ([guid]::NewGuid().ToString('N')))
$cliArgs = @('-p', '--permission-mode', 'bypassPermissions', '--dangerously-skip-permissions')
if ($MaxTurns -gt 0) { $cliArgs += @('--max-turns', "$MaxTurns") }

try {
  $proc = Start-Process -FilePath $Cli -ArgumentList $cliArgs `
                        -RedirectStandardInput $PromptFile `
                        -RedirectStandardOutput $cliOut `
                        -RedirectStandardError $cliErr `
                        -PassThru -WindowStyle Hidden -WorkingDirectory $Repo
  # Touching .Handle caches it, WITHOUT which .ExitCode comes back empty after
  # WaitForExit and every fire logs "CLI exited ," with no code. Caught by the first
  # smoke of this path: the run had succeeded and the launcher could not say so.
  $null = $proc.Handle
  Save-DriverPid $proc.Id
  Write-Log 'FIRE' "driver process tree root is pid $($proc.Id)"
  $proc.WaitForExit()
  $code = $proc.ExitCode
  if ($null -eq $code) { $code = -1; Write-Log 'FAULT' 'the CLI exit code could not be read; treating as failure' }
  $out = ''
  if (Test-Path $cliOut) { $out += Get-Content $cliOut -Raw }
  if (Test-Path $cliErr) { $out += "`n" + (Get-Content $cliErr -Raw) }
} finally {
  # Cleared on ANY exit from here, so a later fire does not try to kill a pid that
  # finished normally and whose number has since been recycled.
  Clear-DriverPid
  try { Remove-Item -LiteralPath $cliErr -Force -ErrorAction SilentlyContinue } catch { }
}

Write-Log 'END' "CLI exited $code, $($out.Length) chars of output"
# The session transcript is the real record; keep a tail here so the log alone is
# enough to see whether a fire did anything.
$tail = ($out -split "`n" | Where-Object { $_ -notmatch 'Permission allow rule' -and $_.Trim() } | Select-Object -Last 10) -join "`n"
try { Add-Content -Path $LogFile -Value $tail -Encoding utf8 } catch { }
try { Remove-Item -LiteralPath $cliOut -ErrorAction SilentlyContinue } catch { }
exit $code
