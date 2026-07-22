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
