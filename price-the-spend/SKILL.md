---
name: price-the-spend
description: Price anything that recurs BEFORE it ships, and report what an action actually cost AFTER it runs. Triggers when adding or reviewing a cron job, scheduled workflow, nightly build, keep-warm ping, polling loop, always-on container, log retention or storage growth, a paid tier or subscription upgrade, or a runner or instance size; and after any subagent batch, agent workflow, LLM API call, or one-off cloud job. Also when a metered allowance, spending limit, or quota is exhausted. Does not fire on capping or rate-limiting an endpoint, which is guard-the-spend-paths.
---

# Price the spend

A `smoke-ui` nightly on a private repo ran 25m10s a day. GitHub rounds up per job, so it billed
26 minutes, about 780 minutes a month, roughly 40% of a 2,000-minute allowance, spent before a
single commit was pushed. It exhausted the spending limit and the merge queue died mid-session.
The job was `continue-on-error: true` and schedule-only, so it could not fail a PR or its own
workflow. Its own header called it "never a trusted gate". Nobody had ever priced it. For scale,
the entire remaining four-PR merge queue was costed at about 226 billed minutes, one third of
what the nightly burned doing nothing.

## The two halves, and the one everybody forgets

**Per-action spend** is the half people think about: a subagent batch, a workflow run, an LLM
API call, a one-off cloud job. It is visible, attributable, and it ends.

**Recurring spend** is the half that actually eats budgets: anything on a schedule or a
subscription. It is invisible precisely because it is working. Nobody reviews a job that has not
failed. If you only ever price actions, you will be surprised by a bill you authorised months
ago and never saw again.

Both halves feed the same question: what does this thing cost per month, and against what
allowance.

## Rule 1: price recurring spend before it ships

For anything on a schedule, a timer, a poll, or a subscription, state the arithmetic out loud
before it merges:

```
billed units per run  x  runs per month  =  monthly cost
                                         then  as a % of the allowance
```

- **Bill the unit the vendor bills, not the unit you observe.** A 25m10s run is 26 billed
  minutes. Read the rounding rule before doing the multiplication.
- **State it as a percentage of the allowance**, not just an absolute. "780 minutes" sounds
  small; "40% of the monthly allowance" is a decision.
- **The allowance is shared.** Standing spend crowds out the interactive spend you actually
  need. The nightly did not just cost money, it stopped merges.
- **Re-price when runtime or volume grows.** A job priced at 8 minutes that drifts to 25 is a
  new decision that nobody made. Re-price on any runtime, matrix, dataset, or frequency change.
- **A free tier is a bill with a threshold.** Know the threshold, know where you sit, and know
  what the first paid unit costs. One project needed a second sender domain and the free tier
  allowed one, which silently converted into a paid plan.
- **Frequency is the cheapest lever.** Nightly to weekly is a 7x cut with no loss of coverage
  for a safety net. Take that before cutting the check itself.

Anything on this list is recurring spend even when it feels like plumbing: cron jobs, nightly or
scheduled builds, scheduled scrapes and syncs, keep-warm and health pings, polling loops,
always-on containers and idle compute, log retention windows, storage and backup growth,
per-seat and per-domain subscriptions, monitoring and alerting tiers.

## Rule 2: report per-action spend after it runs, unprompted

After a subagent batch, an agent workflow, a paid model call, or a one-off cloud job, report
what it actually cost without being asked: per unit and total, with a cost estimate. Read the
real usage numbers (the token counts in each agent's result, the per-agent usage in the workflow
transcript, the run's own billing timing endpoint), never an estimate reconstructed from what
you think you did.

**An agent's own account of its spend is not a usage number.** A result carries two different
things and only one of them is measured: the harness's usage metadata, which is real, and the
agent's prose claim about how much of its budget it used, which is a guess it has no instrument
to make. Measured 2026-08-03: an agent briefed at roughly 150k reported "used roughly half the
~150k budget" while its metadata read 310,017, an error of four times, with no dishonesty
involved. Take the number from the metadata and treat the self-report as colour. Load
**commission-the-roster** if you are about to set a budget on the strength of one, because the
same fact means a briefed budget is not a control. The point is to let the operator weigh the value against the spend
deliberately, per task, so use actuals.

## Where the prices live, because they change

**Never invent a rate, and never quote one from memory.** Rates, allowances, and free tiers move.
Look them up, cite where you looked, and say when you looked. What follows is the structure of
the billing, which is stable, plus where to read the current numbers.

**GitHub Actions.** Billed **per job, rounded up to the whole minute**, so many small parallel
jobs are dearer than their total runtime suggests: a 12-way matrix of 20-second jobs bills 12
minutes, not 4. Private repos draw on a metered included allowance and then bill; public repos
are free on standard runners. Runner OS carries a multiplier, with Linux the cheapest tier,
Windows a small multiple of it, and macOS roughly ten times Linux, so runner choice is usually
the largest single lever after frequency. Larger runners are billed separately from the included
allowance. Read the current numbers here:

```bash
gh api repos/OWNER/REPO/actions/runs/RUN_ID/timing
```

That returns billable milliseconds per OS with the per-job rounding already applied, which makes
it the primary source for "what did this run actually cost". For the allowance itself, the
account's Settings > Billing page is the authority; `gh api /users/USER/settings/billing/actions`
(or the `/orgs/ORG/` equivalent) reports minutes used against minutes included on accounts that
still serve those endpoints. Multipliers and included minutes live in GitHub's Actions billing
docs, per plan.

**LLM and model APIs.** Load the **claude-api** skill for current Claude model ids and prices
rather than restating them here. Input, output, cache write, and cache read are priced
differently and the ratios matter more than the absolute numbers when you are choosing a shape.

**Hosted platforms and cloud.** The provider's own usage page is the authority, and it is
usually more granular than the pricing page: compute hours, invocations, egress, log retention,
storage growth, seats. Egress and log retention are the two that grow without anyone deciding
to grow them.

## The traps this skill exists to carry

- **A job that cannot fail anything must justify its cost some other way, or run less often.**
  `continue-on-error: true`, or not being a required check, means its red result is designed to
  be ignored. On the morning it exhausted the limit, the nightly had failed, at full runtime,
  and the run still reported green. Load **prove-it-can-fail**: a check that cannot go red is
  not a check, and here it was also the single largest line on the bill.
- **Cancelled runs still bill for the minutes they ran.** Batching ten branch updates into a
  single-slot concurrency group so that nine runs supersede each other is a direct spend, not
  just a queueing tidy-up. Cancel early or do not start.
- **Never economise by adding a paths filter to a workflow whose jobs are REQUIRED status
  checks.** A required check that is skipped by a paths filter sits permanently in "Expected"
  and can never be satisfied, so nothing merges. Renaming a job carries the identical hazard,
  because the ruleset names the check. Verify first:

  ```bash
  gh api repos/OWNER/REPO/rulesets/RULESET_ID
  ```

- **Self-hosted runners cost zero Actions minutes**, and are the standard fix for a private solo
  repo with a spare always-on machine. The fork-PR security objection to self-hosted runners
  applies to PUBLIC repos, where untrusted forks can propose workflow code; it does not apply to
  a private single-author repo.
- **A run that duplicates itself per merge is a known cost, not a bug.** A smoke that runs on
  the PR and again on the push to main bills twice per merge. That can be worth paying for, but
  price it deliberately.

## When the budget is already gone: the diagnostic tell

Jobs failing in **2 to 10 seconds with zero steps executed, no runner assigned**, and
`gh run view --log-failed` returning "log not found". There are no logs because the job never
started. This is never your code, and nothing in the repo can produce it.

The reason lives in exactly one place, the check-run **annotation**. Not the run, not the job,
not the logs:

```bash
gh api repos/OWNER/REPO/check-runs/JOB_ID/annotations
```

## Mechanics

A cron job never mentions cost, so this skill's description cannot match the moment that
matters. `hooks/schedule-cost-warn.mjs` covers that moment mechanically: any Write or Edit
landing a schedule into a workflow or a scheduling config prints the pricing reminder. It is
warn-only and never blocks. If the reminder appears, do the arithmetic in the same turn rather
than noting it for later.

## Routes

- The recurring thing is a CI job that cannot go red, or you are arming a new gate, load
  **prove-it-can-fail**.
- The spend is an endpoint anyone can POST to in a loop, load **guard-the-spend-paths**; that
  skill caps the tap, this one prices the bill.
- You are producing a plan for work that adds anything recurring, put the monthly cost in the
  plan itself, see **plan-first**.
- The spend is a Claude or Anthropic API call, load **claude-api** for current model prices.
- The spend is a multi-agent commission you are about to appoint, load **commission-the-roster**
  before the first spawn; that skill shapes the spend, this one reports it.

## What this skill does not do

It does not cap or rate-limit anything (guard-the-spend-paths), and it does not decide whether a
check is capable of failing (prove-it-can-fail). It ensures the cost is known, stated, and
attached to a decision, before it recurs and after it runs.

## Why

Spend is the one failure mode that gets quieter as it gets worse. A job that works is never
reviewed, so a standing bill compounds silently until it hits a hard limit, and then it does not
degrade gracefully: it stops all work at once, with a diagnostic tell that looks nothing like a
billing problem. Pricing takes one line of arithmetic and converts an invisible recurring
liability into a decision somebody actually made. Evidence: PropOS LESSONS_LEARNED 2026-07-28
(the exhausted Actions allowance and the dead merge queue) and Phase 2, 2026-05-09 (the free
sender-domain limit that converted into a paid plan).
