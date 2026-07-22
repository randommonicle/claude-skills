---
name: plan-first
description: State the file list, test list, and out-of-scope items before writing code on any non-trivial commit. Triggers on requests to implement a feature, add a schema-touching change, build a new module, or perform a multi-file refactor. Skip on trivial one-line fixes and doc typo corrections.
---

# Plan before code

On any non-trivial commit, state the plan explicitly before writing any code. Wait for the user's confirmation before touching files.

## When this applies

This skill fires on:

- New features
- Schema-touching changes (migrations, type definitions)
- Multi-file refactors
- Any work that creates new files or modifies more than two existing files
- Work where the right shape is not yet obvious from the user's request

This skill does not fire on:

- One-line bug fixes
- Doc typo corrections
- Trivial config tweaks where the change is fully specified by the user's request

If unsure whether a commit qualifies, treat it as non-trivial and produce the plan. The cost of a plan-first gate on a small commit is one round-trip; the cost of skipping it on a large one is rework.

## What the plan must contain

1. **New files.** Every file that will be created, with its purpose in one line.
2. **Modified files.** Every existing file that will be touched, with what changes.
3. **Out-of-scope items.** Anything the user might reasonably expect to be in this commit but is deliberately deferred. Each deferred item should be flagged per the flag-deferred-items skill (plant a grep-able anchor at the future landing point).
4. **Test list.** Concrete test names with one-line descriptions per test. Not categories; named tests.
5. **Decisions or rules to record.** Any design call that should land in a DECISIONS file or equivalent. Cite the project's convention.

## How to apply

After producing the plan, stop. Wait for explicit go-ahead before writing code.

If the project has additional plan-first requirements (migration verification queries, competitor-parity audits, UX rule enumeration, etc.), the project-level CLAUDE.md or project memory will name them. Read those before producing the plan so the plan contains everything the project requires.

If the user proceeds without explicit confirmation language but with substantive feedback on the plan, treat that feedback as the go-ahead conditional on the changes they named.

## Why

Drift in long sessions is a dominant failure mode. Stating the plan upfront forces alignment before the cost of writing code is sunk, and lets the user redirect cheaply. The pattern compounds: a plan-first gate at commit boundaries also surfaces deferred items, naming conventions, and test shape before they get baked into code that has to be unpicked later.
