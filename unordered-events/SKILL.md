---
name: unordered-events
description: Webhooks, queues and retries do not arrive in the order the work happened, and a guard written for the state a handler expects lets the neighbouring states through. Write each handler's state machine down, guard every status write with the set of states it may move FROM, test every (event, current state) pair including each event arriving before the one it logically follows, and answer an event whose prerequisite has not landed retryably instead of acknowledging it. Triggers when writing or reviewing a webhook handler (Stripe, payment, email, calendar), a queue consumer, an event-sourced status column, or any handler that moves a row's status on an external signal. Does not fire on in-process calls made in a known order, or on the send-then-record half of an outbound call (outbound-side-effect-idempotency owns that).
---

# Unordered events

A provider that delivers at least once and in no promised order (Stripe says so of its
webhooks) will, given enough traffic, deliver the refund before the payment, the finalised
invoice after the paid one, and the dispute before the deposit's own paid event. Each handler
then reads a row in a state its author never pictured, and either writes over a later state or
acknowledges an event it could not apply, which the provider never sends again.

## The rules

1. **Write the state machine down** beside the handler: the row's states, which event moves
   which state to which. A handler whose machine is not written cannot be reviewed.
2. **Guard the FROM set, not the expected state.** A status write is a compare-and-set naming
   every state it may move from (`... where status in ('draft', 'open')`), never only the one
   the author expected; a neighbouring state slipping through is the common defect.
3. **Test the pairs.** For each event, a test per current state, including the states a later
   event would have produced and the state before the event's own prerequisite. A test of the
   happy order alone proves nothing about the unordered one.
4. **A missing prerequisite is retryable.** When an event names something that has not landed
   yet (the payment it disputes, the invoice it pays), answer the provider with a retryable
   status (5xx) so it re-delivers, or look the link up from the provider's own record before
   acknowledging. A 200 for an event that changed nothing is final: the provider will not try
   again.
5. **Stamp from the event, not the clock.** A time written from a re-delivered event takes
   the event's own creation time, so a late delivery lands in the period the money moved.
6. **One writer per field, or an ordering rule.** A field that two event types write needs a
   rule for which wins (a later state never moved back by an earlier event).

## Provenance

ICC L-059 (a compare-and-set on one row does not serialise a write to another), L-062 (Stripe
does not order webhook deliveries), L-065 (a guard for one status let the neighbouring status
through), L-082 (an event guarded to move drafts only was overtaken by an event for a later
state), and GPT's review R11 of 22 October 2026 (a card dispute delivered before its deposit's
paid event was acknowledged without the photo hold it should have placed).
`docs/SKILL_PROPOSALS_2026-10-22.md`, Tier 1 item 2.
