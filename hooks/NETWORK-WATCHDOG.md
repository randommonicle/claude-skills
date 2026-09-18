# The network watchdog

`watchdog-network.ps1`, built 2026-09-18. It watches this machine's route to the internet and
tries to repair it, so an unattended run does not lose its window to a dead link.

## Why it exists

Two real incidents, not a hypothetical:

- **2026-09-17, 05:30.** `github.com` was unresolvable from this machine. The overnight run could
  not fetch, push or use `gh` for the rest of its window.
- **2026-09-18, ~09:55.** During the arming session a `git push` failed with `Could not resolve
  host: github.com`, and the identical command succeeded seconds later.

Both are **DNS resolution failing on a link that is otherwise up**, which is why stage 1 is a
resolver cache flush and not something heavier.

## What it can actually do on this machine

Measured on 2026-09-18 on this account, not assumed:

| remedy | status |
|---|---|
| `Clear-DnsClientCache` | **Works unelevated.** This is stage 1, and it matches the observed failure |
| `Restart-NetAdapter` | **Needs administrator.** This account is not a local admin (`IsInRole(Administrator)` false, not in `BUILTIN\Administrators`) |

So stage 2 will almost certainly log `NOPERM` rather than restarting anything. **That is deliberate
and it is logged plainly**, so nobody reads the log later and believes an adapter reset was
protecting the run when it never ran. The script is honest about the difference between "tried and
failed" and "was never permitted to try".

### To make stage 2 real

An administrator must re-register the task so it runs elevated. From an **elevated** PowerShell:

```powershell
$a = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Users\ben\.claude\skills\hooks\watchdog-network.ps1"'
$t = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Minutes 5)
$p = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\ben" -LogonType Interactive -RunLevel Highest
$s = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName 'PropOS network watchdog' -Action $a -Trigger $t -Principal $p -Settings $s -Force
```

**`-LogonType Interactive` matters and must not be changed to `S4U` or `Password`.** The alert route
is Outlook COM (`notify-owner.ps1`), which attaches to Outlook in the user's own desktop session. A
task set to "run whether user is logged on or not" executes in session 0 and cannot reach it, so the
alert would fail silently.

This is a corporate machine and the account is deliberately not an administrator. If IT policy is
the reason, **that is a reason to leave stage 2 unavailable**, not to route around it. Stage 1 plus
detection and logging already addresses the failure that has actually occurred here twice.

## How it escalates, and why it is capped

Per outage, not per fire:

1. **Fire 1** — `FLUSH`: clear the resolver cache, re-test, and stop there (`WAIT`).
2. **Fire 2** — `RESTART`: bounce the physical adapter, or log `NOPERM`.
3. **Fire 3** — one more.
4. **Fire 4 onwards** — `CAPPED`: watch and log only. Nothing is touched again until the link
   returns.

`RECOVERED` clears the outage and the budget, so a link that drops again later gets a fresh three.

**The cap is the point.** The sibling `watchdog-unattended.ps1` shipped with a repeat guard that
suppressed the repeat *email* but not the repeat *restart*, so a condition that persisted meant the
destructive action every 15 minutes indefinitely (fixed 2026-09-18). The same trap is worse here: if
the fault is upstream at the router or the ISP, no amount of local flushing or adapter bouncing will
fix it, and bouncing the link every fire is strictly worse than leaving it alone.

`watchdog-network.test.mjs` asserts the cap directly, and the assertion was proved able to go red by
disabling the cap and watching fire 4 come back `RESTART,FLUSH,DOWN`.

## Reading it

- Log: `~/.claude/watchdog-network.log`
- State: `~/.claude/watchdog-network.state` (JSON: outage start, remediations used, alerted)
- Levels: `OK`, `DOWN`, `FLUSH`, `WAIT`, `RESTART`, `NOPERM`, `CAPPED`, `RECOVERED`, `ALERT`, `FAULT`

It emails the owner **once per outage**, after the local remedies are spent. If the link is still
down the mail waits in Outlook's outbox and leaves when the link returns. Late, but it is the
difference between knowing and not knowing.

## Relationship to the other watchdog

They are independent and must stay that way. `watchdog-unattended.ps1` watches the *run's heartbeat*
and restarts the *app*; this one watches the *link*. A frozen run on a healthy network and a healthy
run on a dead network are different faults with different remedies, and one script doing both would
restart the app over a router problem.
