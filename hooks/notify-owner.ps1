<#
.SYNOPSIS
  Send one short alert to the owner via their own Outlook, for unattended runs.

.DESCRIPTION
  Built 2026-09-17 after an overnight run froze at 19:11 on an unanswerable
  permission prompt and nothing anywhere noticed for fourteen hours. There was no
  route to the owner at all: the Outlook MCP server has no send, PushNotification
  reaches only a desktop nobody is sitting at, and curl on this machine cannot
  reach ntfy.sh or even api.github.com. Outlook COM can send, so this is the route.

  WHAT THIS IS FOR, AND WHAT IT IS NOT
  It is a morning inbox, not an emergency line. The owner is asleep. An unattended
  run must never block waiting for a reply to one of these. Send only for: a run
  that has stopped and cannot continue, anything that looks like it touched a
  protected branch, and one line at the end of the run. Nothing routine.

  CONTENT RULE, and it is not optional.
  The recipient may be a personal address outside the corporate estate. Bodies
  carry operational facts only - a timestamp, a state, a machine name. NEVER put
  client names, property addresses, leaseholder details, financial figures, file
  contents or anything else from the firm's data in here. If the alert cannot be
  written without such a detail, say "see the queue file" and leave the detail on
  the machine.

  RUNS ONLY IN AN INTERACTIVE LOGGED-ON SESSION. Outlook COM attaches to the
  running Outlook in the user's own desktop session. A Task Scheduler job set to
  "run whether user is logged on or not" executes in session 0 and CANNOT reach it.
  Any scheduled caller must be configured "run only when user is logged on".

.PARAMETER To
  Recipient. Deliberately a parameter with no default: this script lives in a git
  repo that syncs to a shared remote, and the owner's personal address must not be
  committed there. Callers read it from the local, untracked config file
  $env:USERPROFILE\.claude\notify-owner.config.json  ({ "to": "someone@example.com" }).

.EXAMPLE
  powershell -File notify-owner.ps1 -To me@example.com -Subject "PropOS run stalled" -Body "19:11. No heartbeat for 47 min."
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)][string]$To,
  [Parameter(Mandatory = $true)][string]$Subject,
  [Parameter(Mandatory = $true)][string]$Body,
  [switch]$WhatIfSend   # build the item and report, but do not send
)

$ErrorActionPreference = 'Stop'

# Recipient: parameter wins, else the local untracked config, else fail loudly.
if (-not $To) {
  $cfgPath = Join-Path $env:USERPROFILE '.claude\notify-owner.config.json'
  if (Test-Path $cfgPath) {
    try { $To = (Get-Content $cfgPath -Raw | ConvertFrom-Json).to } catch { }
  }
}
if (-not $To) {
  Write-Output "FAIL: no recipient. Pass -To, or create $env:USERPROFILE\.claude\notify-owner.config.json with { `"to`": `"...`" }"
  exit 2
}

# Keep the body small and boring. A truncated alert is still an alert; a huge one
# is a way to leak something by accident.
if ($Body.Length -gt 800) { $Body = $Body.Substring(0, 800) + " [truncated]" }
$stamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ssK'
$full = "$Body`r`n`r`n-- `r`nSent by notify-owner.ps1 on $env:COMPUTERNAME at $stamp`r`nThis is an automated alert from an unattended run. Operational facts only by design."

try {
  $ol = New-Object -ComObject Outlook.Application
  $mail = $ol.CreateItem(0)
  $mail.To = $To
  $mail.Subject = $Subject
  $mail.Body = $full
  if ($WhatIfSend) {
    Write-Output "DRY RUN: would send to $To"
    Write-Output "  Subject: $Subject"
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($mail) | Out-Null
    exit 0
  }
  $mail.Send()
  Write-Output "SENT to $To at $stamp"
  exit 0
} catch {
  # A failure here is itself worth seeing: it usually means Outlook's own
  # "a program is trying to send email on your behalf" guard, which no unattended
  # run can dismiss. Report it rather than swallowing it.
  Write-Output "FAIL: $($_.Exception.Message)"
  exit 1
}
