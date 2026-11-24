---
name: blast-radius-grep
description: The unit of change is the action or the fact, never the list of places someone handed you. Load BEFORE editing when a change reaches code or text it does not name: deleting, moving or renaming anything; rewording a message or label; changing what a status, total or column means; narrowing a grant; adding a constraint, gate or new kind; a lookup on an email, reference or name; fixing one instance of a bug; working from a spec's list of affected places; correcting a duplicated fact; or concluding from a sweep that errored or was truncated. Grep the whole repo and fix every occurrence in one pass. Not for citations in prose (verified-citations).
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

## Completion gate: a sweep that did not finish found nothing

The rule above is about grepping widely enough. This is about believing the result, and it is a
separate failure. A sweep can be correctly scoped, correctly written, run against the right tree,
and still support a false conclusion.

**1. A sweep that errored is not a sweep.** If the run raised an exception, was killed, hit a
pager, or stopped at a `head` limit, it produced no result. Re-run it before drawing any
conclusion. Never describe a blast radius as contained on the strength of a partial run. A run
that died partway through and printed some matches looks exactly like a run that finished and
found few.

**2. Do not truncate a matched line below the match.** Printing `line[:N]`, or any fixed-width
slice, can hide the very substring the search matched. The search worked, the evidence was
found, and then your own display threw it away, leaving a visible fragment that reads as
something else entirely. This is the one that actually bit: a repository-wide sweep for a
withdrawn figure matched the right line in a second issued document and printed a 168-character
slice that stopped just before the figure. The fragment read as an unrelated point, the
conclusion written was "blast radius is contained: only one document carries it", and that
conclusion went into a client-facing correction that would have fixed one document and left the
same wrong figure standing in another.

Print the whole line, or a window centred on the match, or at minimum assert that the search term
appears in what you display. A general hazard for any agent that greps and then summarises its own
grep output, which is most of them.

**3. Assert the count, not the appearance.** State how many hits you expect before running, and
reconcile against it. Without a prior, "fewer results than expected" arrives as relief rather than
as a signal, and zero results are indistinguishable from a broken pattern. `grep -c` first, then
read.

These three are why **no-silent-data-drop** and this skill meet here: a truncated display and an
aborted run both drop content while leaving a result that looks complete.

## What this skill does not do

It does not verify references in documents — verified-citations owns whether a cited
file:line or date is accurate; this skill owns whether a duplicated value was fixed
everywhere. It does not decide the change itself (plan-first routes here).

## Why

A named list is a snapshot of someone's memory; the grep is the census. Every under-count in
the evidence shipped as a partial fix that looked complete. Evidence: PropOS LESSONS_LEARNED
Sessions 13, 27, 29, 32, 35, 42, 2026-07-14; ASH LESSONS_LEARNED 2026-05-27 (FK embeds,
shared evidence with db-migration-verification), 2026-06-10; ICC L-009 addenda, L-017.

## Additions from the misses-log sweep (2026-10-22)

- **A fact recorded twice drifts.** When a decision record or doc states a fact another record already holds (an address, a figure, a name), link to the first record instead of restating it, or check in the same change that both agree. (ICC L-088.)

## Additions from the misses-log sweep (2026-11-23)

- **One identity, one way of matching it.** Before writing a lookup on an identity column (an
  email, a reference, a name), grep for every other place that matches the same column, in SQL
  and in code, and use the same normalisation, or call the one function that owns it. Where the
  column is not normalised on write, say so beside the lookup, and test the two layers against
  each other with a value stored in mixed case. Two layers that answer "is this the same
  person?" differently are each right alone, and neither can report that they disagreed. This
  matters most where the answer decides whose data is served, changed or erased. (PropOS
  2026-11-11c.)
