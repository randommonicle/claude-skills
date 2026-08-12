---
name: handover
description: Produce a structured handover note when the context window fills or the user asks to wrap up. Run /context first to read the real percentage; never estimate — and where the harness cannot invoke /context, record the gap verbatim rather than inventing a figure. Triggers when the context band reaches amber or red, when the user says "wrap up", "handover", or "hand off", or before deliberately ending a long working session.
---

# Handover note

The global operating rules define context bands: green below 50%, yellow 50 to 65%, amber 65 to 75%, red above 75%. At yellow, mention the reading and keep commits small with explicit scope cuts. At amber, take no new work units. At red, stop and hand over. This skill defines what the handover contains and how to produce it.

## When this applies

- The context band reaches amber or red.
- The user says "wrap up", "handover", "hand off", or similar.
- A long session is ending deliberately and the next session needs to resume cleanly.

## Step 1: measure, never estimate

Run `/context` first and use the real figure. Do not guess or estimate the percentage. Run `/context` and use the figure it returns. The whole point of the bands is that the decision to wrap is made on a real reading, not a feeling.

Where the harness cannot invoke `/context` — a non-interactive orchestrator or headless
session — an honest gap is the reading. Write "no reading — /context unavailable in this
harness" verbatim into the note's wrap-up context, never an invented or estimated
percentage, and make the band decision from the harness's own signals (context-compaction
warnings, summarisation system reminders). Five consecutive sessions on one project
(2026-07-31 to 2026-08-12) wrote that gap into prose and re-declared this rule change due
before the rule caught up with the harness it actually runs in.

## Step 2: the handover note

A fixed shape, so the next session can read it once and resume:

1. **Session goal.** One line: what this session set out to do.
2. **Branch and worktree.** The working branch, and the worktree path if non-standard. The next session starts on `main` by default and otherwise has to rediscover this from `git log`.
3. **What landed.** Commits and PRs with sha and a one-line description each. Mark each as verified or unverified.
4. **In flight.** What is half-done, with exact `file:line` ranges, not bare paths. Enough that the next session can open the file at the right place.
5. **Deferred items.** Every item deferred this session, each with its grep anchor, per the flag-deferred-items skill. The note records where the anchor was planted.
6. **Verification still outstanding.** Migration catalog queries to run, smokes to run, post-rollout checks not yet done.
7. **Blockers and open questions.** Anything waiting on a decision or an external answer.
8. **Next actions.** Ordered and concrete. Each is a single first step, not a theme.
9. **Traps and working agreements.** Project-specific gotchas surfaced this session, plus standing rules that bit or nearly bit (confirm before push, money is pounds not pence, grep the live schema rather than trusting handover docs).

Dates are absolute, not relative. Money is stated in pounds.

Where the project keeps a checkpoint log (per the checkpoint-log skill), synthesise items
3, 4, and 5 from the log rather than from memory; the log is the record, the handover is
the digest.

Every diagnosis and causal claim in the note carries a confidence marker: verified, with
the command or evidence that proved it, or unverified. The note opens with one line:
"diagnoses in this note are unverified unless marked". A recommendation built on an
unverified diagnosis inherits the marker. The incident behind this (2026-07-20): a
second-order claim about a fix, reasoned from structure rather than probed, was written
into a migration header and DECISIONS as fact, and a reader had no way to tell asserted
from proven until a smoke forced the correction.

## Step 3: persist it

Write the note to the project's handover location, or to `DECISIONS.md` / `LESSONS_LEARNED.md` where an item qualifies for those. If no handover location is established, write to `HANDOVER.md` in the project root. Append; do not overwrite. The history of handovers is itself useful, and an overwrite loses the trail. If something this session qualifies as a documented decision or a lesson learned, prompt to record it.

## Step 4: promote before closing

Sweep the note's traps and working agreements before finishing. Anything that would change
how a future session behaves is a lesson, not a handover line: promote it to the project's
LESSONS_LEARNED.md now, with its misses-log line, or plant a grep-able FORWARD anchor at
the landing point (flag-deferred-items). Knowledge that stops in a handover never reaches
the library's admission pipeline. The incident behind this (2026-07-27): five coordination
rules learned the hard way in one session sat in a handover section behind "consider
folding these in later", and were never folded in.

## What this skill does not do

It does not decide to wrap up; the context bands do that. It does not push or commit on its own. It produces the note and persists it, leaving the push gate intact.

## Why

Long sessions fail at the seams: the next session re-discovers what the last one already knew, or misses a deferred item or an unrun verification. A fixed handover shape, produced from a real context reading, makes the seam cheap to cross and keeps deferred and unverified work from falling through it.

## Additions from cross-repo lessons (ratified 2026-07-23)

- **Stamp superseded sections.** A session that makes a prior handover's "next build"
  section stale stamps that section superseded in the same PR — a one-session-stale
  handover cost real rework.
- **Carry-forward items cite a live-state verification or are marked unverified.** A
  "still open" item once rode four consecutive handovers a month after the work was done.
  Re-verifying at write time is cheaper than the duplicate build it prevents (see
  live-state-first).
