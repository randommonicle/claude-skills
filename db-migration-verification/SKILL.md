---
name: db-migration-verification
description: Every database migration plan ships with a post-apply verification query that reads catalog state directly, separate from any runtime tests. Triggers on any work involving a database migration, schema change, RLS policy change, trigger change, or constraint change.
---

# Migration plans include catalog verification

Every database migration produced under a plan-first gate must ship its SQL alongside a post-apply verification query that reads catalog state directly. The user applies the migration, runs the verification query, then pastes the result back. Spot-check before any code is written against the new schema.

## When this applies

This skill fires on any work involving:

- New migrations (CREATE TABLE, ALTER TABLE, CREATE TYPE)
- RLS policy changes (CREATE POLICY, DROP POLICY, policy sweeps)
- Trigger changes (CREATE TRIGGER, function changes)
- Constraint changes (CHECK, UNIQUE, FOREIGN KEY adds or drops)
- Column adds, drops, or type changes
- Index changes when correctness depends on them

## What a verification query looks like

The query reads catalog tables directly, not application tables. The shape varies by what's being verified.

For RLS policy sweeps, query `pg_policy`:

```sql
SELECT polname, polcmd,
       polqual IS NOT NULL AS has_using,
       polwithcheck IS NOT NULL AS has_with_check
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
WHERE c.relname IN ('<affected_tables>');
```

For CHECK or UNIQUE constraint adds, query `pg_constraint`:

```sql
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.<table>'::regclass;
```

For trigger changes, query `pg_trigger`:

```sql
SELECT tgname, pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgrelid = 'public.<table>'::regclass
  AND NOT tgisinternal;
```

For column changes, `\d+ public.<table>` in psql or its `information_schema.columns` equivalent works.

For function or trigger function changes, `pg_get_functiondef('<schema>.<function>'::regproc)`.

The principle: read what the catalog actually contains, not what the application assumes is there.

## What "good" looks like

The plan must spell out the expected result of the verification query in concrete terms before the migration is applied.

Examples:

- "Expecting `has_with_check = true` on all 29 recreated FOR ALL policies. If any are NULL, flag and pause."
- "Expecting the new `payment_auth_action_type` constraint to enumerate exactly `('payment', 'close_bank_account', 'toggle_rics_designation')`. Any other set means a prior migration moved the baseline."
- "Expecting one new trigger named `enforce_admin_charge_summary_of_rights`. Any other trigger count on this table means the migration partially failed or another migration ran in parallel."

Vague success criteria defeat the purpose. The verification must be a yes/no judgement based on a concrete expected output.

## Order of operations

1. Plan-first gate produces the migration SQL plus the verification query plus the expected result.
2. User applies the migration via the project's standard mechanism (Dashboard SQL Editor, migration runner, CLI tool; project-level memory defines which).
3. User runs the verification query and pastes the result back.
4. Compare the result to the expected output.
5. If matched, proceed to writing code that depends on the new schema.
6. If mismatched, stop. Investigate before writing any code against the new schema.

Smokes and integration tests run after step 5. They test runtime behaviour. They do not test catalog state, and they will not catch a policy that was dropped without recreation, a constraint added with the wrong predicate, or a stray policy from an earlier migration shadowing the new one.

## What this skill does not do

This skill does not replace integration tests or smoke runs. Catalog verification proves the migration created what the SQL said it created. Smokes prove the application behaves correctly against the new schema. Both are needed.

This skill does not decide which catalog query to use. The query is part of the migration plan and must be chosen based on what the migration actually changes. A multi-aspect migration (new table + new policy + new trigger) needs verification queries covering each aspect.

## Why

Smokes test runtime behaviour. They do not tell you whether 30 RLS policies were correctly recreated, whether a CHECK constraint was added with the predicate you intended, or whether a policy from an earlier migration is now shadowing the new one. The cost of one extra round-trip to verify is small. The cost of writing application code against a schema you assumed was in place but isn't is substantial.

This skill is the catalog-state counterpart to the plan-first skill's test list. Plan-first ensures the runtime behaviour is named before code; this skill ensures the schema state is named and verified before code.

## Additions from cross-repo lessons (ratified 2026-07-23)

### A foreign key breaks embeds elsewhere

A migration adding a FK to an already-referenced table breaks every PostgREST-style embed of
that table ("more than one relationship found"). Grep every `.select()` embed of the
now-doubly-referenced table and pin the FK (`users!inspector_id(...)`) — including queries
introduced by concurrently-merged branches, not just the files the current change touched.
It bit twice in one repo. And a feature flag gates code, not schema: the migration is live
on apply regardless of the flag, so follow any migration with one real end-to-end run of the
highest-value path (see one-real-ride) — the only check invisible neither to tsc nor to
synthetic-data tests.

### Work from the live definition

Before any `CREATE OR REPLACE` (or edit to any DB object), dump the live definition
(`pg_get_functiondef`, catalog views) and diff the replacement against it. Hand-applied
migrations drift from the repo in both directions, and a replacement authored from an old
migration file reverts every fix applied since — live, on apply.

### Out-of-band applies

Applying DDL via a management API or SQL editor bypasses the migration-history table, so the
migration tool will later re-apply it. Use idempotent SQL for out-of-band applies and
reconcile history afterwards (`migration repair --status applied`), then catalog-verify.

### Multi-statement tools show only the last result

A verification block pasted into a SQL editor is not verified if you only saw its last
query's result — and the most important check is rarely last. Run load-bearing verification
queries individually.

### Upsert needs UPDATE

Any table or storage bucket written with upsert takes the `ON CONFLICT DO UPDATE` branch on
re-runs, which Postgres evaluates against an UPDATE policy. INSERT + SELECT policies alone
deny every re-run. Test the re-run path, not just the first write.

### Numbering under parallel work

Claim migration numbers by scanning ALL refs including remote, at merge time — two branches
once shipped colliding five-migration sets and git flagged nothing (see
parallel-work-recon).

### Verify the delta, not the regression grid

A clean apply plus a green regression grid does not prove the NEW deltas landed. Read each
delta directly from the catalog. Where live data cannot exercise the change, a disposable
dry-run database (Docker) with negative controls is the gate, run pre-apply.

### Verbatim re-issues get a mechanical diff

Any "re-issued verbatim / same body plus one line" migration gets a normalised diff or
checksum fidelity gate against the original — a dropped `::int` in a hand-retyped body once
shipped a nightly time bomb. Never retype a regulated body.

### Read back privileges after CREATE

Platform default grants re-open every new function and view, and `REVOKE FROM PUBLIC` does
not strip named role grants. Prove the ACL with `has_function_privilege` /
`information_schema.role_table_grants` as a standard verification block — this recurred four
times, the fourth as a live privilege-escalation hole.

### Eyeball real values

The verification query is also a units and semantics check: reading actual row values caught
a 100x money bug that types could not.

### Trap checklist

Unset-GUC `current_setting` returns NULL and kills combined booleans — audit each use-site.
A BEFORE-UPDATE gate leaves the INSERT vector open. Triggers on trigger-maintained columns
need `pg_trigger_depth()`. Self-referential deletes need a fixpoint loop.

### Phased RLS-axis rollouts

When a JWT claim becomes an RLS axis: register the hook, force re-login, decode a fresh
token and confirm the claims, and only then flip RLS — creating the hook function is not
activating it, and a pre-hook token means "all my data is gone". A nullable RLS-axis column
is a latent lockout: enforce NOT NULL before the column becomes the axis.

## Routes

- Ad-hoc destructive SQL outside a test harness → load **live-data-surgery**.
- The change drops, renames, or gates anything existing code writes → load **blast-radius-grep**.
