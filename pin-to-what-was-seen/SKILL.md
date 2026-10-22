---
name: pin-to-what-was-seen
description: An action a person takes on state a screen showed carries that state with the request, and the server refuses it, doing nothing, when the state no longer holds. Send the value or version the screen drew; compare-and-set on it under the row lock (409 on a mismatch); on a 409 or an answer in doubt close the editor and redraw from a fresh read; make a confirm name the state it confirms; and when an answer sends the user to another action, decide both from one predicate. Triggers when writing a mutation behind a button, form, editor or confirm dialog that acts on displayed state (a role change, an edit of a stored text, a resend, a decision on a request, a payment action), and when writing a retry or idempotency check around one. Does not fire on webhook and queue status writes (unordered-events owns those) or on serialising concurrent callers of one operation (lock-at-the-chokepoint owns that).
---

# Pin to what was seen

A screen is a snapshot. Between drawing it and the tap, another admin, another device, a
webhook or a scheduled job may have changed the row. A request that says only "do it"
(`resend: true`, `role: "manager"`, the new text alone) acts on whatever the row is now, so
the person approves one state and the server acts on another: a customer emailed twice, a
role changed from one nobody saw, an edit overwriting a change the editor never read.

## The rules

1. **Send what the screen drew.** Every mutation from a screen carries the value, version or
   timestamp it was drawn from (`from: "operative"`, `seen_emailed_at`, the notes shown, the
   row's `revision`). Make it required: a request without it is a 400, never a silent
   unpinned write.
2. **Compare-and-set on it, under the lock.** The server checks the pin in the same atomic
   write that changes the row (`... where id = $1 and role = $from`), or after taking the
   row's lock, never in a read before it. A mismatch changes nothing and answers 409 with a
   reason the screen can say ("it changed since you opened it").
3. **Read the ledger after the lock.** An idempotency or replay ledger is read after the row
   lock is taken, so a second send of the same operation waits for the first and finds its
   stored outcome instead of a conflict.
4. **A 409 or an answer in doubt closes the editor.** On a refusal, a timeout or an
   unreadable answer, close the form and redraw from a fresh read before anything can be sent
   again. Say an answer in doubt as "may not have happened: check", never as failure, and
   never resend it from the stale form.
5. **A confirm names its state.** The confirm text says what it acts on ("Resend the email
   last attempted at 14:02?") and the request carries that same state, so a confirm given for
   one attempt cannot act on another.
6. **Two remedies, one predicate.** When an answer tells the user to take another action
   ("Finish recording instead"), that action's refusal is decided by the same predicate the
   answer consulted, and a test walks the round trip: the answer, then the action it names.
   Otherwise the two answers can point at each other forever.

## Test it

- Change the row between the read and the write (a second session or a direct update) and
  assert the 409 and that nothing changed.
- Mutate the pin away (drop it from the request, or from the server's where-clause) and see
  the test go red (prove-it-can-fail).
- Drive the screen: a 409 and a lost answer each close the editor and redraw.

## Provenance

ICC L-025 (an operation authorised by a rotatable token binds its write to the hash it
verified), L-058 (an idempotency ledger is read after the row lock, not before), L-066 (two
remedies that point at each other loop unless one predicate decides both), L-076 (a
confirmation must carry the state it was given for), and the "from" pins of 22 October 2026:
GPT's review R7 (a role change needs the role the admin saw), and R11 and R12 (the
access-notes editor pinned to the notes shown, closed on a 409 or an answer in doubt).
`docs/SKILL_PROPOSALS_2026-10-22.md`, Tier 1 item 4.
