---
name: prove-it-can-fail
description: Every test, seed, verification script, CI gate, or check must demonstrably be able to fail when the thing it guards is broken. Ask of each check "what does this print if the thing is broken?" Triggers when writing or reviewing any test, smoke, seed, verification file, or CI job, when marking a test skipped, and when arming a new gate. Does not fire on triaging an already-red suite (mass-red-triage) or on how tests touch shared data (safe-smokes).
---

# Prove it can fail

A green board proves nothing unless every light on it can go red. This skill exists because
nine-plus separate incidents produced green signals with no assertion behind them — including
a statutory control that had never been asserted on any run, ever, and verification files
that printed pass on any error. Layer: hub for test-and-check integrity (this is one of the
six always-on norms; the norm line is the everyday trigger, this file is the playbook).

## The question that does the work

For every check you write or review, ask: **what does this output if the thing it guards is
broken?** If the honest answer is "still green", "a skip", or "nothing", the check is
theatre. Answer it by demonstration where cheap: break the guarded thing once, watch the
check go red, revert.

## Rules

1. **A server reply is never a skip.** Skips are for transport failures only — could not
   connect, no credentials. A catch-all `catch { skip }` hid both a never-passable gate test
   and a would-be-green total outage. A skipped regulated check is unverified, not green;
   say so in the run summary.
2. **Seeds get assertions.** Fire-and-forget seeding let an RLS isolation test pass for the
   wrong reason (nothing was seeded, so nothing leaked). Assert the seed landed before
   asserting the behaviour.
3. **Negative assertions need a positive control.** "User B sees nothing" is only meaningful
   next to "User A sees the row". Without the positive control, an empty database passes.
4. **Only the specific expected error proves a control fired.** "It threw" is not "the gate
   caught it" — assert the error identity (a stable code, not the human-readable message).
5. **A check whose two operands share a source is theatre.** A "reconciliation check" that
   compared a value against its own definition could never fail. Trace both operands to
   independent sources.
6. **Watch a newly-armed gate's first run to completion** — a nightly-gated spec once merged
   having never executed. And after fixing a pipeline's first red step, watch the whole run
   go green: a second failure can be queued invisibly behind the first.
7. **Test every mutation shape the app performs** against a guard — set, swap, and null are
   three different attacks; a guard proven against one is unproven against the others.
8. **Assert on the subject, not a document-wide pattern.** A broad "no X anywhere in the
   output" assertion is a hidden dependency on everything else and breaks on innocent code.
9. **A passing test can encode the bug.** When fixing a bug, check whether a green test pins
   the wrong behaviour — two tests once codified drop-this-content as correct.

Mechanics note: a CI check that reads a snapshotted event payload (e.g. a PR body) cannot be
re-run into a pass after the source is edited — close/reopen refreshes the payload.

## Routes

- Test, smoke, or seed touches a shared or live database → load **safe-smokes** before writing it.
- A suite has gone broadly red and you are tempted to debug → load **mass-red-triage** first.

## What this skill does not do

It does not triage failures (mass-red-triage) and does not govern shared-data hygiene
(safe-smokes). It governs whether a check is capable of telling you the truth.

## Why

Green signals with no assertion behind them are worse than no check: they convert "unknown"
into "verified" in every reader's head. Evidence: PropOS LESSONS_LEARNED 2026-07-14 (two
entries), 2026-07-19 (two entries), 2026-07-15, Sessions 16, 18, 30, 33; ASH LESSONS_LEARNED
2026-06-09 and 2026-06-04.
