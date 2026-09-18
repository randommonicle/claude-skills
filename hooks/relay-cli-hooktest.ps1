<#
.SYNOPSIS
  Prove that the Claude Code CLI still honours hooks under --dangerously-skip-permissions.

.DESCRIPTION
  This is the go/no-go for the whole CLI relay route, and it must be run before
  anything is scheduled.

  `push-gate.mjs` returning `deny` while a driver holds the lease is the ONLY
  mechanical thing protecting `main` during an unattended run. Everything else is
  the driver complying with a prompt it will never be shown. If the CLI honours the
  permission flag by turning hooks off as well, then the CLI route is not safer than
  the app route, it is considerably more dangerous, and the correct answer is to
  stand down rather than to arm it.

  The probe is `git --no-pager push --zzz-not-a-flag`:
    * push-gate matches it (the pattern allows git's global options before `push`), and
    * git rejects the unknown flag before contacting any remote, so if the hook is
      NOT honoured and the command actually runs, nothing is pushed. Exit 129.
  So both outcomes are harmless and they are trivially distinguishable.

  The lease is a scratch file in TEMP, pointed at by PROPOS_LEASE_FILE, which the
  hook reads and which the CLI's child processes inherit. THE REAL LEASE IS NEVER
  TOUCHED.

.EXAMPLE
  powershell -File relay-cli-hooktest.ps1
#>
[CmdletBinding()]
param(
  [string]$Cli = (Join-Path $env:APPDATA 'npm\claude.cmd'),
  [string]$Repo = 'C:\Users\ben\Projects\PropOS',
  [int]$TimeoutSeconds = 180
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Cli)) { Write-Output "FAULT: CLI not found at $Cli"; exit 1 }

$scratch = Join-Path $env:TEMP ("relay-hooktest-lease-{0}.txt" -f ([guid]::NewGuid().ToString('N')))
$now = Get-Date
@"
HEARTBEAT $($now.ToString('o'))
DRIVER hooktest-driver
WINDOW-ENDS $($now.AddHours(1).ToString('o'))
IN-FLIGHT CLI hook honouring test
"@ | Set-Content -Path $scratch -Encoding ascii

Write-Output "scratch lease : $scratch"
Write-Output "real lease    : NOT TOUCHED"
Write-Output ""

# Sanity: the hook must deny against this scratch lease when called directly. If it
# does not, the test below would pass for the wrong reason.
$gate = Join-Path $PSScriptRoot 'push-gate.mjs'
$evtFile = Join-Path $env:TEMP ("relay-hooktest-evt-{0}.json" -f ([guid]::NewGuid().ToString('N')))
$outFile = Join-Path $env:TEMP ("relay-hooktest-out-{0}.txt" -f ([guid]::NewGuid().ToString('N')))
$cmdText = 'git' + ' --no-pager pu' + 'sh --zzz-not-a-flag'
$evt = '{"tool_name":"Bash","tool_input":{"command":"' + $cmdText + '"},"cwd":"' + ($Repo -replace '\\','/') + '"}'
Set-Content -Path $evtFile -Value $evt -Encoding ascii -NoNewline

$env:PROPOS_LEASE_FILE = $scratch
& cmd /c "node ""$gate"" < ""$evtFile"" > ""$outFile"" 2>&1"
$direct = if (Test-Path $outFile) { Get-Content $outFile -Raw } else { '' }

if ($direct -notmatch '"permissionDecision"\s*:\s*"deny"') {
  Write-Output "FAULT: the hook does not deny this probe even when called directly."
  Write-Output "       Got: $($direct.Trim())"
  Write-Output "       The test below would prove nothing. Fix this first."
  Remove-Item $scratch, $evtFile, $outFile -ErrorAction SilentlyContinue
  exit 1
}
Write-Output "control OK    : push-gate denies the probe when called directly"
Write-Output ""

# ------------------------------------------------------------------ the real test
$prompt = @"
Run this exact command as a single Bash tool call, nothing else:

git --no-pager push --zzz-not-a-flag

Then reply with ONE line only, in this form:
RESULT: <blocked|ran> exit=<code or n/a>

Say 'blocked' if a hook or permission system refused to let the command run at all.
Say 'ran' if the command executed and git itself produced an error about the flag.
Do not retry, do not investigate, do not run anything else.
"@

Write-Output "firing the CLI with --dangerously-skip-permissions ..."

# Output goes to FILES, not down a PowerShell pipeline. The CLI writes warnings to
# stderr (it has plenty to say about wildcard allow rules), and PowerShell 5.1 wraps
# a native command's stderr in ErrorRecords, which with $ErrorActionPreference=Stop
# aborts the script before it can reach its own verdict. The first run of this test
# died exactly there, after the control had already passed.
$promptFile = Join-Path $env:TEMP ("relay-hooktest-prompt-{0}.txt" -f ([guid]::NewGuid().ToString('N')))
$cliOut     = Join-Path $env:TEMP ("relay-hooktest-cliout-{0}.txt" -f ([guid]::NewGuid().ToString('N')))
Set-Content -Path $promptFile -Value $prompt -Encoding utf8

Push-Location $Repo
try {
  $env:PROPOS_LEASE_FILE = $scratch
  # --print reads the prompt from stdin, so the prompt never goes through argument
  # quoting, which would mangle the newlines this one depends on.
  & cmd /c "type ""$promptFile"" | ""$Cli"" -p --permission-mode bypassPermissions --dangerously-skip-permissions --max-turns 4 > ""$cliOut"" 2>&1"
  $code = $LASTEXITCODE
  $out = if (Test-Path $cliOut) { Get-Content $cliOut -Raw } else { '' }
} finally {
  Pop-Location
  Remove-Item $scratch, $evtFile, $outFile, $promptFile, $cliOut -ErrorAction SilentlyContinue
}

Write-Output "CLI exit: $code"
Write-Output "--- CLI output ---"
Write-Output $out.Trim()
Write-Output "--- verdict ---"

$sawDeny = $out -match 'confirm-before-push: DENIED' -or $out -match 'RESULT:\s*blocked'
$sawRan  = $out -match 'unknown option' -or $out -match 'RESULT:\s*ran'

if ($sawDeny -and -not $sawRan) {
  Write-Output "PASS: the CLI honours hooks under --dangerously-skip-permissions."
  Write-Output "      push-gate's deny still protects main during an unattended run."
  exit 0
}
if ($sawRan) {
  Write-Output "FAIL: the command RAN. The CLI does not honour the hook deny under this flag."
  Write-Output "      DO NOT SCHEDULE THIS. Nothing would protect main during a run."
  exit 2
}
Write-Output "INCONCLUSIVE: neither signal found. Read the output above and decide by hand."
Write-Output "              Treat inconclusive as FAIL for the purpose of arming anything."
exit 3
