---
name: enforce-invariants-in-build
description: A rule asserted only in prose — "single source of truth", "never auto-X", "these must match" — is a comment, not a control; if a violation can exist without failing the build, one eventually will and it will look official. Triggers when writing or encountering any comment, doc, or convention that asserts an invariant nothing enforces. Does not fire on deferral markers (flag-deferred-items) or on rules already carried by a test, constraint, or trigger.
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
