---
name: enforce-invariants-in-build
description: A rule, prerequisite, permission or expiry that exists only in prose is a comment, not a control. Load when writing or meeting "must", "never", "single source of truth" or "these must match" in a comment or doc; noting that something has to be running, present or set before a run or release; accepting a known cost or side effect; writing "until launch" or "for now" into a file sessions load; or provisioning what idles or expires. Not for deferral markers (flag-deferred-items) or rules a test, constraint or trigger already carries.
---

# Enforce invariants in the build

Three-repo convergence. A file declaring itself "the ONLY place model names appear" had zero
importers and pinned stale model ids — dead code that looked authoritative. A safety
carve-out ("never auto-N/A the lifts section") was enforced only by the absence of a line
and regressed silently for five weeks. A design guarantee ("only field X crosses the
boundary") had no code behind it. The counter-example that proves the pattern: a config kept
honest by a byte-identical unit test never drifted.

## The rule

When prose asserts an invariant, ask: can a violation exist without failing the build? If
yes, back the invariant with a mechanism — a test, a constraint, a trigger, a lint rule — or
delete the assertion. A documented lesson is not a control; only a mechanical step prevents
recurrence.

## How to apply

- **Grep any file that declares its own authority.** "The single source of truth for X" is
  verified by counting its importers; zero importers means the claim is not just false but
  misleading — dead code that pins external identifiers is worse than ordinary dead code.
- **A deliberate duplicate needs a byte-identical test** so divergence is a red build, not a
  discovery.
- **A safety carve-out needs a named, tested rule.** Encode "never auto-X" as a function
  (`autoNaCandidates()` style) plus a test asserting the unsafe state cannot occur — never
  as the absence of a line someone can helpfully add back.
- **"These must match" needs a drift check** — a zero-rows query, a checksum, a CI
  comparison — per blast-radius-grep's denormalisation rule.
- On finding an unenforced invariant in existing code, add the mechanism in the same change
  or flag it per flag-deferred-items; do not add another sentence of prose.

## What this skill does not do

It does not track deferred work (flag-deferred-items) and does not write the tests
themselves (prove-it-can-fail governs their integrity). It converts assertions into
mechanisms.

## Why

Prose invariants rot precisely because they look official: the next reader assumes the rule
is enforced somewhere and edits accordingly. Every incident in the evidence survived weeks
of competent review. Evidence: ASH LESSONS_LEARNED 2026-06-10 (lifts carve-out), 2026-07-19
(models.ts); PropOS Session 17 ("a lesson is not a control"); ICC L-020.

## Additions from the misses-log sweep (2026-11-01)

- **A skill that ships a scanner has the scanner run over its own text.** The anti-em-dash
  skill shipped an em dash inside its own rule about em dashes and it sat in the archive and
  in every installed copy for three months, because the rule was prose and nobody thought to
  point the tool at the tool. Where a skill, linter or convention ships an executable check,
  wire that check over the skill's own files in CI. Library 43's own conclusion is the line
  to keep: "write carefully" failed three times where a grep would not have. (Library 43;
  wired for this repository in `.github/workflows/check-index.yml` on 2026-11-05, with a
  deliberate violation proving the step can go red.)

## Additions from the misses-log sweep (2026-11-23)

The rule above asks whether a violation can exist without failing the build. The same question
applies to a running system and to a statement with an end date, where no build is looking.

- **A stated prerequisite gets a check in the commit that states it.** "X must be running",
  "the file must be present", "the PC must be on" is a check in the preflight, the build or the
  release script, able to go red, or it is not a control. A show that depended on a program being
  open had that written down, passed its preflight with the program closed, and never went on
  air. A release built in a fresh checkout lacked a git-ignored input that a doc said to check by
  hand, and the feature was silently absent for seventeen days. (Rimagent 2026-11-10; ICC L-139;
  passive income L-111.)
- **A known cost or side effect gets a guard or a named owner.** Recorded as a consequence and
  left there, it lands. (Rimagent 2026-11-12, where a documented side effect destroyed the thing
  it was documented to touch.)
- **A permission or status with an end names the event that ends it, and that event's checklist
  gets the removal item in the same commit.** "Until launch" in a file every session loads
  outlived the launch by two months, because the ending condition lived only in the sentence that
  granted the relaxation. When the event is ticked off, grep the session-start files for the old
  state by name. (ICC L-146.)
- **Anything provisioned ahead of its consumer records when it lapses.** Read the provider's idle,
  expiry and quota rules at creation, then arm a keep-alive or write the date where a session will
  see it. (One private project, 2026-09-27: a free-tier database paused before its consumer
  existed.)
