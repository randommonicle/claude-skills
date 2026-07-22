---
name: safe-smokes
description: Never run destructive operations against shared or live data in tests, smokes, or seeds. Flip-and-restore with try/finally instead of delete; seed in beforeAll and tear down in afterAll; restore shared state exactly as found. Triggers when writing or editing any test, smoke, or seed script that connects to a shared or live database, Supabase or otherwise. Does not trigger on tests that run only against mocks, fixtures, or an in-memory database.
---

# Safe smokes against shared data

A smoke must leave shared state exactly as it found it. On 2026-05-18, before this discipline was written, a smoke deleted ASH's real provider row. The rules below exist so that never recurs.

## When this applies

Any test, smoke, or seed that connects to a shared or live database. In PropOS this is the Supabase `smoke-db` project running against real firm data. The risk is highest for the regulated `c1-*` smokes and anything touching firm, provider, ledger, demand, or transaction rows.

## Confirm the target before you run

Two Supabase projects exist (PropOS and the Inspection App), and the active credentials or the Dashboard can point at the wrong one. Before running any smoke that can write, confirm which project the run targets and that it is the one you intend (PropOS is `tmngfuonanizxyffrsjy`). The 2026-05-18 incident combined a destructive delete with an unconfirmed target: flip-and-restore removes the first risk, and confirming the target removes the second.

## Core rules

1. **Never `.delete()` shared real-firm state.** Capture the current value, mutate it, assert, then restore. The test owns only the rows it created.
2. **Flip-and-restore in `try/finally`.** The restore runs in `finally` so it happens even when the assertion throws. A restore that only runs on the happy path is not a restore.
3. **Seed in `beforeAll`, tear down in `afterAll`.** Set-up creates the test's own rows; tear-down removes exactly those and nothing else.
4. **NULL foreign keys before deleting parents.** For example, NULL `invoices.transaction_id` before deleting transactions, and widen the capture to the direct FK (`payment_authorisations.transaction_id`) so nothing is orphaned or blocked.
5. **Union-of-anchors tear-down.** Delete by the union of every anchor a test could have created, not just the happy-path id. A test that branches creates different rows on different paths.
6. **Idempotent and self-cleaning.** Do not assume a clean database. Clean up after yourself; never truncate or reset shared tables to force a known state.

## Why flip-and-restore, not transaction rollback

App-level smokes open their own client connections. A `BEGIN ... ROLLBACK` in the test process does not wrap the connection the application code uses, so it does not isolate the writes. Rollback isolation only works when the test and the code under test share the same database connection and transaction, as with in-database pgTAP tests. For live Supabase smokes, flip-and-restore is the correct pattern, not a workaround.

If an assertion can be expressed as SQL-level RLS checks, prefer pgTAP with `BEGIN ... ROLLBACK`: it leaves zero residue by construction. Use flip-and-restore for everything that must run through the app's client.

## Concurrent runs

Flip-and-restore is not safe under parallel runs that touch the same shared row: two runs can interleave so one restores the other's value, not the original. Serialise smokes that mutate shared rows, or give each run its own row keyed to the run, so no two runs flip the same state at once.

## Service-role smokes

The regulated `c1-*` smokes need `SUPABASE_SERVICE_ROLE_KEY` in `app/.env.local`. Absent the key, they SKIP rather than fail. State the skip explicitly in the run summary. Never let a skip read as a pass: a skipped regulated smoke is unverified, not green.

## Windows

Use `localhost`, not `127.0.0.1`. Do not background a curl-poll loop to wait for the dev server; grep the server's own ready signal in its log instead.

## What this skill does not do

It does not replace catalog verification, which proves the schema, and it does not choose the test framework. It governs how any test touches shared data, so a passing suite never costs real firm state.

## Why

Shared-database tests run against data other people rely on. One `.delete()` on the wrong row is a regulatory and trust incident, and it has happened once. Flip-and-restore makes the destructive path impossible to take by accident: the test never holds a delete on state it did not create.
