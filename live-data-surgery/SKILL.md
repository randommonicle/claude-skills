---
name: live-data-surgery
description: Any ad-hoc destructive operation against a shared or production-adjacent database outside a test harness — bulk delete, cleanup sweep, re-baseline — follows a fixed protocol: read-only inventory first, BEGIN-ROLLBACK dry run, complement-count proof with NULL-collapsed predicates, a self-check that re-runs every predicate, confirmation the markers sit on disposable rows, and explicit gating of anything that resets tamper-evidence. Triggers on any DELETE, TRUNCATE, or bulk UPDATE aimed at shared or live data outside a test. Does not fire inside test harnesses (safe-smokes governs tests) or on throwaway local databases.
---

# Live-data surgery

Six incidents around ad-hoc destructive operations: a sweep whose self-check under-claimed,
a committed cleanup that would have deleted the demo data because "Smoke" was its name, over
a thousand leaked rows from an earlier partial pass, and a bulk delete rolled back wholesale
by one surviving RESTRICT child. safe-smokes governs tests; this skill governs the one-off
surgery — same danger, different trigger surface. A warn-and-log hook
(hooks/sql-surgery-warn.mjs) backstops this skill by logging destructive SQL it sees.

## The protocol, in order

1. **Read-only inventory first.** Count, sample, and walk the FK graph of what the predicate
   matches — as a result grid you read, not NOTICEs that scroll away.
2. **Check the markers sit on disposable rows.** A name is not a disposability proof:
   "Smoke" turned out to be the demo dataset. Verify by content, not label.
3. **BEGIN … ROLLBACK dry run.** The transaction still returns the report rows, so you see
   exactly what would happen at zero risk. Script version: dry-run by default, mutate only
   under an explicit `--apply`.
4. **Complement-count proof with NULL-collapsed predicates.** Three-valued SQL makes
   `NOT (x = y)` lie on NULLs; prove kept + deleted = total with predicates that collapse
   NULL explicitly.
5. **Self-check re-runs EVERY predicate.** A sweep's final assertion must re-run each seed
   predicate individually — a combined check once under-claimed and left residue attributed
   to success.
6. **FK order and atomicity.** Delete children before parents; know that one surviving
   RESTRICT child rolls back an entire atomic bulk delete — which is a feature, if you watch
   for it.
7. **Gate tamper-evidence resets.** Anything that resets audit trails, sequence baselines,
   or tamper-evidence gets its own explicit confirmation, never rides along.

## What this skill does not do

It does not apply inside test harnesses — safe-smokes owns test hygiene, including
flip-and-restore and teardown assertions. It does not authorise the surgery; it assumes the
decision is made and makes the execution provable.

## Why

Ad-hoc surgery is where the worst class of loss lives: no harness, no teardown, real data,
and a plausible-looking predicate. The protocol converts "I'm fairly sure" into a result
grid. Evidence: PropOS LESSONS_LEARNED Sessions 12, 46, 53, 2026-07-02, 2026-07-06,
2026-07-20.
