---
name: fixtures-from-reality
description: A test is only as true as what it feeds the code. Build fixtures from what the real dependency sent on the pinned version, not from its documentation; give a fake the service's failure behaviour (expiry, a lost answer after the effect, what it saves against a key) and its comparison rules; reach a ride's state by the path production takes; feed one half's real output to the other half; and name the runtime, engine or device each claim was proven on, with one run on the deploy one where they differ. Triggers when writing a fixture, fake, stub, test double or seed, recording a provider's response, setting up a ride or sandbox run, or trusting a green suite for code that runs on a different runtime, database engine or device than the tests. Does not fire on whether a check can go red at all (prove-it-can-fail) or on how tests touch shared data (safe-smokes).
---

# Fixtures from reality

A green suite proves the code against the world the tests describe. When that world was
written from documentation, from what the consumer needed, or on a friendlier runtime, the
suite passes and production does something else: a field the pinned API version never sends,
a fake that never forgets a key, a test runtime that accepts an option the edge refuses, an
emulator on last year's Android.

## The rules

1. **Record, do not transcribe.** Build a provider fixture from a response the sandbox or a
   real call returned on the version the account is pinned to. Where only documentation
   exists, cross-check one real response before code relies on a field, and prefer a fact
   your own rows hold over an optional provider field.
2. **A fake carries the failures.** Before trusting a test built on a fake, list what the
   real service does on expiry, on a lost answer after the effect, on a repeat of a failed
   keyed call, and how it compares values (a timestamp in two text forms is one instant to
   Postgres and two strings to a fake). Make the fake do the same, or keep each test to the
   one case the fake models and say so.
3. **Reach the state the way production does.** A ride's or test's setup uses the same keys,
   order and calls production takes to the state under test. A shortcut that lands somewhere
   similar tests something else.
4. **Feed the real output across the seam.** Where one part renders or consumes another
   part's answer, at least one test passes the producer's real answer to the consumer, never
   only a fixture written to suit the consumer.
5. **Name the runtime of every claim.** Note which runtime, database engine, browser or OS
   version each test ran on. Where it differs from the deploy target (Node and an edge
   runtime, an embedded SQLite and the hosted database, an emulator and the users' phones),
   run the new API choice or query shape once on the deploy one, or say the claim is
   unverified there.
6. **Assert what functional tests cannot see.** A property no output shows (a query plan
   that ignores its cursor, a request count, a byte size) gets an assertion of its own.
7. **Do not pin a value a planned step must change.** A test that asserts the placeholder a
   later process step replaces goes red at that step; accept both legitimate states and
   prove each.

## Provenance

ICC L-063 (a Stripe field absent on the pinned API version; a fixture written from the
documentation passed anyway), L-069 and L-070 (fakes more lenient than the service: a key
never forgotten, timestamps compared as strings), L-079 (a ride's setup reached its state by
a path production never takes), L-081 (two halves tested against their own fixtures, never
each other's output), L-119 (Android 17 behaviour the Android 16 emulator never showed); AI
domain L-095 (a query plan no functional test can see), L-139 and L-143 (the Node test
runtime accepted what workerd and D1 refuse), L-140 (a test pinned a value a planned later
step changes). `docs/SKILL_PROPOSALS_2026-10-22.md`, Tier 1 item 3.
