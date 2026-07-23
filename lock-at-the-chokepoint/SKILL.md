---
name: lock-at-the-chokepoint
description: Serialise shared operations at the single module-level chokepoint every caller passes through, never in per-instance state — and cap fan-out there too. A check-then-act idempotency guard protects sequential retries but loses the race under concurrency. Triggers when adding a lock, in-flight guard, dedupe check, or rate cap where multiple callers, component instances, or loops can invoke the same shared operation, and when writing any internal retry or resume loop over a batch. Does not fire on recording the status of an external send — outbound-side-effect-idempotency owns send-then-record.
---

# Lock at the chokepoint

Three incidents that cost real money: a per-hook `syncing` ref plus per-screen network
listeners produced overlapping sync passes and every photo was analysed twice at doubled AI
cost; ~30 concurrent vision calls fired unawaited and blew the provider's per-minute org
limit; the server-side "already analysed?" check lost the race against its twin.

## The rules

1. **Serialise at the shared module-level function every caller passes through** — a
   module-level in-flight promise, not per-instance state. Guards in hooks, screens, or
   components multiply with their instances and each copy believes it is alone.
2. **A check-then-act guard is not a lock.** Read-then-write ("is it already done? no →
   do it") protects sequential retries only; two simultaneous callers both pass the check.
   Prevent the duplicate at the source, or use an atomic claim (see
   outbound-side-effect-idempotency for the external-send variant).
3. **Cap fan-out at the single upstream chokepoint** rather than trusting callers not to
   burst. One concurrency gate in the shared client wrapper throttles the whole app under a
   provider limit; per-call politeness does not survive a loop.
4. **Retry and resume loops**: skip items already completed; classify failures transient
   (retry N, then give up) versus permanent (give up now); and give an unrecoverable item an
   escape hatch so it cannot wedge the queue — surfacing it as given up per
   honest-failure-surfacing, never retrying silently forever. A photo whose local file was
   gone once blocked an entire inspection's sync indefinitely.

## What this skill does not do

It does not govern external send-then-record paths (outbound-side-effect-idempotency) or
per-IP abuse caps on public endpoints (guard-the-spend-paths). It governs internal
concurrency and fan-out.

## Why

Concurrency bugs of this class bill you twice and rate-limit you once, and they are
invisible in sequential testing — the duplicate cost only appears when two instances run at
once. Evidence: ASH LESSONS_LEARNED 2026-06-04 (evening and later entries), 2026-05-27, and
the CLAUDE.md Opus rate-limit lesson.
