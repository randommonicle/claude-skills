---
name: blast-radius-grep
description: The unit of change is the action or the fact, never the named list of places someone handed you. Before shipping a gate, constraint, rename, drop, or a correction to any duplicated, mirrored, or denormalised value, grep the whole repo — app, tests, seeds, scripts, open branches, and the built or rendered output — and fix every occurrence in the same pass; back a value copied into a second store with a trigger and a zero-rows drift-check query. Triggers on "change X in A and B" instructions, constraint or gate additions, drops and renames, denormalising a value, and correcting any fact that is not single-sourced. Does not fire on checking references in prose documents — verified-citations owns citation accuracy; this skill owns content duplication.
---

# Blast-radius grep

Converged independently in all three mined repos: the named list of places to change
under-counts, whether the thing changed is a code action or a duplicated fact. A spec named
two receipt-posting sites and the grep found the third; a corrected marketing claim was
fixed in the chat prompt and lived on in two site pages and a trust stat; a new gate's
"low effort" estimate omitted the corpus of existing writes that now failed it.

## The rule

Before shipping the change, enumerate by grep, not by list. Grep the ACTION (the verb on the
table, the dropped column's name, the gated write) or the FACT (the old value and its
paraphrases) across: app code, tests, seeds, scripts, open branches, and the built or
rendered output. Fix every occurrence in the same pass — the corpus is part of the change's
real cost.

## How to apply

- **Grep by the thing changed, not the feature name.** A governed-set migration broke an
  untouched smoke because the sweep searched the feature, not the changed set.
- **Constraints reconcile against fixtures, not only live data.** A new CHECK that live rows
  satisfy can still strand test payloads red for weeks.
- **Drops and renames grep unmerged branches and test payloads too** — the next merge
  re-introduces the name you removed.
- **Facts: grep the rendered output as well as source.** The built site carried a claim the
  source grep missed; "grep the built site, not just chat.js".
- **Then prevent re-divergence.** Leave a single-source anchor (shared config, one exported
  constant). For a value denormalised into a second store, back the copy with a trigger —
  not a convention — and ship a standing "these two must match / zero rows" drift-check
  query, used as both post-change verification and future diagnosis. An insert-time-only
  email sync once mis-routed a client's reports for weeks.

## What this skill does not do

It does not verify references in documents — verified-citations owns whether a cited
file:line or date is accurate; this skill owns whether a duplicated value was fixed
everywhere. It does not decide the change itself (plan-first routes here).

## Why

A named list is a snapshot of someone's memory; the grep is the census. Every under-count in
the evidence shipped as a partial fix that looked complete. Evidence: PropOS LESSONS_LEARNED
Sessions 13, 27, 29, 32, 35, 42, 2026-07-14; ASH LESSONS_LEARNED 2026-05-27 (FK embeds,
shared evidence with db-migration-verification), 2026-06-10; ICC L-009 addenda, L-017.
