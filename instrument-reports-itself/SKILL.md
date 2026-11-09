---
name: instrument-reports-itself
description: A broken instrument reads as a healthy one unless its failure is a distinct value and that value reaches a person in time. Record a failure as a failure rather than as a default, a zero, a sentinel or a silence; give every terminal failure on an unattended path one message to a human, sent before it is marked handled; run a check at least as often as the thing it watches can fail; and alarm on the absence of a result, not only on a bad one. Triggers when writing or reading any counter, metric, cost or usage field, log line, fire log, audit tally, progress indicator, health check, status file, dashboard panel or scheduled and unattended job; when choosing a default or sentinel for a value that could not be obtained; when a measurement looks surprisingly clean, cheap, empty or fast; and when deciding how often a monitor runs. Does not fire on the wording and severity of a message a user will read (honest-failure-surfacing), on asserting that the thing under test ran (prove-it-can-fail rule 10), or on content dropped by a filter (no-silent-data-drop).
---

# An instrument reports itself

Every instrument in this corpus failed the same way. It kept producing readings. The fire
log wrote `'unknown'` 508 times and `audit-fires.mjs` scored every skill as never fired. An
updater wrote `"current"` and exited 0 for four days with its new half switched off. Forty-six
steps that failed authentication were booked at `$0.00` and read as a pricing win. A ride's
clock ran on a paused game and reported the wait as progress. None of them went quiet. Quiet
is the easy case: somebody notices quiet. These stayed fluent, and fluency is what bought
them the month, the four days, the three days.

The two halves below are separable and both are needed. An instrument that cannot *say* it is
broken will not be believed when it is read. One that can say it, to a log nobody opens, has
said nothing.

## The rules

1. **A failure is a value, distinct from every reading.** Not a default, not a sentinel
   borrowed from the value space, not zero, and not an omitted key. `'unknown'` is
   indistinguishable from a skill genuinely named unknown; `$0.00` is indistinguishable from
   a free step; an absent `mirrors` key is indistinguishable from a machine with no mirrors.
   Where a reading could not be taken, the record says *could not be taken*, and says why.
2. **Never let an absence reach the success path through a default.** `(x ?? []).every(...)`
   is vacuously true; `count || 0` turns a failed count into a real-looking zero; `if (!cfg)
   return null` turns an unconfigured feature into a silent one. A capability that is switched
   off is legible as off, in the record, with a reason, and never indistinguishable from one
   that ran. This is the shape of library 46 and it reached a success path three layers deep.
3. **A step that did no work is summed as failed, not as zero.** Aggregates are where the
   distinction gets thrown away: a mean over readings that include failures-as-zero is lower
   than the truth and still looks like a number. Count attempts, successes and failures
   separately, and put the failure count next to the aggregate everywhere the aggregate is
   shown.
4. **A success-only counter cannot see refused demand.** Anything that measures use measures
   the use that got through. Record the refusals, the unknown-skill errors, the rejected
   requests and the ones that never started, or the instrument will report healthy adoption of
   a thing nobody can reach.
5. **Every terminal failure on an unattended path tells a person, once, on the failure's own
   path.** Not on the next success, not on the next scheduled summary, not in a status row the
   failure itself writes and nobody reads. The notification is part of the failure handler, and
   the failure is marked handled only *after* the message has gone. If the notify step throws,
   the item is still outstanding. Once, not every cycle: a failure that re-notifies hourly is
   muted within a day, and a muted channel is a silent one.
6. **A check runs at least as often as the thing it watches can fail.** A weekly check over a
   daily job gives a week of undetected failure and will, often enough, run the day before the
   first one. Derive the interval from the failure's own clock and from how long the damage is
   allowed to run, never from convenience.
7. **The absence of a result is its own alarm.** A cancelled required check posts no
   conclusion, and a merge waits forever while looking merely slow; a run that dies before its
   first write leaves no row at all. Watch for *no conclusion after N minutes* and for *no
   heartbeat since T* as first-class conditions, because the failures that matter most are the
   ones that remove the thing that would have reported them.
8. **Read an instrument against reality before trusting it, and treat a clean number as a
   question.** The fire log was found because a review read the log instead of assuming it
   worked. Surprisingly cheap, surprisingly empty, surprisingly fast and surprisingly clean
   are all the same signal: check one reading end to end against the thing it claims to
   measure (`trace-one-record`), and prefer a second, independent source. The transcripts that
   survived the fire log's month are the example.
9. **An instrument needs the same can-fail proof as a check.** Break the thing being measured
   on purpose and confirm the instrument says so, and that the saying arrives. An alerting path
   that has never fired is an untested code path on the day it matters
   (`prove-it-can-fail`; `preflight-unattended` proves the channel before a run, which is not
   the same as proving a failure uses it).

## Why these and not "add monitoring"

Monitoring was present in most of these. The fire log was a log. The updater wrote a status
file read by `session-recon` at every session start. The cost field was on a dashboard. ICC's
three failed posts each had their own row. What was missing in every case was a value that
*differed* when the thing broke, and a path that carried that difference to somebody before
the damage finished. Adding another panel to a system that reports success for a failure adds
another panel reporting success.

## Provenance

Library 11 (`skill-fire-log.mjs` wrote the sentinel `'unknown'` for 508 lines over a month, so
`audit-fires.mjs` scored every skill as never fired; found only because a review read the log),
library 13 (a success-only counter cannot see refused demand: a skill installed, unusable and
invisible at once), library 46 (the updater reported `"current"` and exited 0 for four days
with its mirror half switched off, an absent config reaching the success path through a
default). Rimagent 2026-10-26 (46 steps that failed authentication were booked at `$0.00` and
read as a pricing bug while a colonist starved on stream), 2026-10-22 (an unattended ride ran
its clock on a paused game and reported the wait as progress). ICC L-128 (three scheduled posts
failed terminally and the failure sat in its own row for three days), L-129 (the only check ran
weekly, the day before the first failure). PropOS 2026-07-31 (a cancelled required check posts
no conclusion, so a merge waits forever and looks merely slow).
`docs/SKILL_PROPOSALS_2026-11-01.md`, Tier 1 item 4, admitted by Ben 2026-11-05. Library 46 is
the instance that landed after the sweep was written and is the reason this item was built
first.

Adjacent, and deliberately not duplicated: `honest-failure-surfacing` owns the wording and the
severity level of a message a person reads (`honest-failure-surfacing/SKILL.md:13`);
`prove-it-can-fail` rule 10 owns asserting that the subject of a test actually ran
(`prove-it-can-fail/SKILL.md:46`); `guard-the-spend-paths` carries the same idea for one
surface, a guardrail routing its own failures (`guard-the-spend-paths/SKILL.md:32`);
`no-silent-data-drop` owns content lost to a filter. None of them covers an instrument whose
reading is wrong while the instrument looks well.
