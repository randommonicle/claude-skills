---
name: outbound-side-effect-idempotency
description: Code that performs an external side effect (email, SMS, payment, webhook) and then records its status must choose which failure harms the recipient less — lost or duplicated — and design for that. A read-then-write "already sent?" check is not a lock. Triggers when writing any send-then-record path or adding retry logic around an external send. Does not fire on internal batch retry loops with no external recipient — lock-at-the-chokepoint owns those.
---

# Outbound side-effect idempotency

The genuine distributed-systems tradeoff hiding in every send-then-record path: "never lose
it" and "never duplicate it" cannot both be absolute. A review-request sender kept
fail-closed semantics (mark sent only after the provider accepted) and then had to confront
the race that design leaves open: two concurrent passes both reading "not sent", both
sending.

## The rules

- **Decide which failure harms the recipient less, and design for that.** A lost password
  reset is worse than a duplicate; a duplicate payment is worse than a retried one. The
  choice is per-path, explicit, and recorded.
- **Fail-closed for never-lose-it**: mark sent only after the provider's 2xx. A pre-marked
  "sent" that then fails to send is a silent loss with a clean audit trail — the worst
  combination.
- **A read-then-write pre-check is not a lock.** "Is it already sent? No → send" protects
  sequential retries only; concurrent callers both pass. True at-most-once needs an atomic
  claim: a `sending` state transition the row passes through, or a unique constraint the
  second sender violates.
- **When both properties matter and the claim state is deferred, make the residual case
  detectable**: a conditional mark that records the race happened is the honest interim —
  you cannot yet prevent the double-send, but you will know about it instead of finding out
  from the recipient.

## What this skill does not do

It does not govern internal retry loops with no external recipient
(lock-at-the-chokepoint) and does not verify delivery (email-delivery-verification). It
chooses and implements the failure semantics of the send itself.

## Why

Every send-then-record path embodies this tradeoff whether or not its author noticed; the
unexamined default is usually at-least-once with a silent-loss edge, which is the wrong
choice for most recipient-facing sends. Evidence: ICC LESSONS_LEARNED L-021 and the
reviewRequest fail-closed pattern; the same check-then-act race on an internal path in ASH
LESSONS_LEARNED 2026-06-04 (shared evidence with lock-at-the-chokepoint).
