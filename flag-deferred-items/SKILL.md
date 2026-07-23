---
name: flag-deferred-items
description: When proposing anything as deferred, out of scope, or "for a later phase", plant a grep-able flag at the place where the deferred work will land. Triggers whenever the words "deferred", "out of scope", "later commit", "later phase", "future work", or similar appear in plans, commits, or design discussions.
---

# Flag deferred items at the anchor

When proposing anything as deferred, do not record it only in a session-specific document and move on. Plant a grep-able flag at the place where the deferred work will actually land.

## When this applies

This skill fires whenever a plan, commit, or design discussion contains language like:

- "deferred"
- "out of scope"
- "later commit" / "later phase"
- "future work"
- "future enhancement"
- "Phase N+" / "post-launch" / "post-MVP"
- "not in this PR"
- "follow-up"

Any of those phrases is the trigger. The skill applies regardless of whether the deferral is forced by scope, time, dependency, or design choice.

## How to apply

For each deferred item, plant flags at as many of these locations as apply:

1. **Code-level anchor.** Add a comment at the file, function, or migration the deferred work will touch when it lands. Use a grep-able prefix the project agrees on (commonly `FORWARD:`, `TODO:`, or a project-specific tag). The comment names the deferred item and points at where it was decided.

   Example: `// FORWARD: spend-cap director-approval queue, see DECISIONS 2026-05-10`

2. **Migration-level anchor.** If a future schema change is anticipated, add a comment in the most recent migration affecting the relevant table family, pointing forward to the expected change.

3. **Decision-log entry.** Record the deferral in the project's decisions log with a "When this lands, also do X" line so re-reading the entry surfaces secondary work.

4. **Handover-note entry.** If a handover note is being produced, list deferred items in a dedicated section so the next session sees them on read.

The same item often deserves anchors at multiple locations. A migration deferral typically needs both a comment in the current migration (so the next migration on that table sees it) and a decision-log entry (so re-reading the decision surfaces it).

## What "grep-able" means

The anchor must use a literal token consistent enough that `grep -rn "<token>"` across the codebase returns every deferred item. Inconsistent tokens (`TODO` in one place, `FIXME` in another, plain prose in a third) defeat the purpose.

If the project uses multiple tokens for different deferral types (e.g. `FORWARD:` for next-phase, `PROD-GATE:` for production-blocking), use the right token for the right item. The project-level memory or CLAUDE.md will define the taxonomy.

## What this skill does not do

This skill does not decide whether to defer. The decision to defer is part of the plan-first gate. This skill only fires once the decision has been made, to ensure the deferral is anchored.

This skill does not promise the deferred work will be done. The anchor's job is to surface the item when the relevant area is next touched, so the decision to do or re-defer can be made then.

## Why

Out-of-scope items recorded only in a session-specific document decay. By the time the relevant phase or area is touched again, the document may not be the most recently read, and the deferred item gets forgotten or rediscovered the hard way (rework, missed regulatory requirement, or worse). Anchoring at the future landing point means the reminder is visible from multiple angles when the work happens.

## Additions from cross-repo lessons (ratified 2026-07-23)

- **Expected-breakage tests carry the anchor in `.fixme()`**, never `.skip()` or deletion —
  a fixme stays visible in every run's output; a skip disappears into green.
- **FORWARD anchors are the milestone checklist.** Before scoping a milestone,
  `grep -rn "FORWARD(<milestone>)"` and treat every hit as a checklist item; the
  predecessor migration's header records the contract a handover summarised away.
- **Dormant controls say so everywhere.** A gate that bites nothing yet states its dormancy
  in the migration, the smoke, the decision log, and to the user — otherwise its first bite
  is diagnosed as a new bug.
