# Committee review record — SKILL_PROPOSALS_2026-07-23.md

Reviewed 2026-07-23. Scaled committee per the committee-review skill: one positive Fable
reviewer, one adversarial Fable reviewer, neutral chair (main session). Integrity caveat,
disclosed up front: the chair authored the document under review. Mitigations used: chair
findings and the chair's ballot were written to files before reading any reviewer output or
ballot; the adversarial brief explicitly instructed not to defer to the document's framing;
both reviewers spot-checked the doc's claims against the primary lessons files, not against
the chair's summaries.

## Scope and method

Document under review: docs/SKILL_PROPOSALS_2026-07-23.md (23 proposed skills, upgrade
bundles for 11 of 14 existing skills, four-layer orchestration architecture with a
promotion/demotion rating system). Evidence base staged in the session scratchpad
(evidence/): the three verbatim source-mining reports, the fourth corpus (chair's skills-repo
pass, staged post-hoc per R-16), the existing 14 SKILL.md files, and the primary lessons
files. Both reviewers verified claims against primaries: 10 of 10 adversarial spot-checks and
5 of 5 positive spot-checks confirmed. Reviews ran in parallel; proposals were consolidated
attribution-stripped into 39 ballot items; all three parties voted (chair ballot on file
first). Tally rule: 2 of 3 adopts, 3 of 3 marks priority, lone votes recorded as dissent.

## Overall verdict

The document survives adversarial challenge on its substance: consolidation was found honest
(no fabricated evidence; recurrence counts match the miners; all primary spot-checks
verified), the tiering method and the demotion calls were ratified, and the orchestration
architecture's core diagnosis was ratified as a working hypothesis. The overclaiming
concentrated in four areas, all now corrected by ratified amendments: inflated cross-repo
framing on the headline skill, uncomputed aggregate numbers, harness mechanics asserted as
fact without verification, and self-exemption from the document's own description rules
(zero of 23 stubs carried the mandated "does not fire on" line). One genuine design
contradiction was found and fixed: the zero-fires demotion rule would have retired exactly
the norm-backed skills the architecture calls most important.

## Outcome summary

- 38 of 39 items adopted (35 unanimous; 3 adopted with merged amendments).
- 1 item rejected: R-33 (2 of 3 against; chair dissent recorded below).
- Choice item R-37 resolved (a) by 2 to 1: build the security skill; dissent recorded below.

## Adopted items (by group, with adopted amendments)

Strength ratifications (R-01..R-10), all adopted, R-01..R-08 and R-10 effectively unanimous:
the Tier 1 convergence set; the recurrence-driven ranking method; the sprawl-control
demotions; branch-deletion-preflight as confirm-before-push extension plus hook (census
fixed); the live-data-surgery/safe-smokes boundary sentence; email-delivery-verification
standalone; the three cross-corpus merges; the Layer 0 assignments and framing; the
promotion/demotion ladder and fire-log (amended: fire-log protection is conditional on the
R-15 spike passing — if PostToolUse cannot observe Skill invocations, the ladder keeps only
its miss-driven inputs); the honesty devices and dilution paragraph (amended: the dilution
analysis is protected as a stated working hypothesis, not a verified harness fact).

Evidence and number corrections (R-11..R-16), all unanimous: verify-the-effect's preamble
corrected (two ICC incidents, not three; PropOS Session 13 belongs to one-real-ride; the #1
rank stands on the ASH recurrence alone); evidence reuse across proposals marked and excluded
from aggregates; the "two-thirds of recurrences" claim softened to a majority (independent
reviewer recounts landed roughly 55% and 60%); the dilution-reduction claim tied to the R-17
narrowing actually shipping; every harness-mechanics claim marked
verified/believed/must-spike, with the fire-log hook and hub chaining spiked before Layer 0
or the rating system is built; the fourth corpus staged as evidence.

Architecture amendments (R-17..R-28), all adopted: the four broad Tier 1 rules ship as
norm + playbook with deliberately narrowed skill descriptions (R-17, the review's most
consequential amendment); one-real-ride exclusively owns the completion trigger and
verify-the-effect loses completion vocabulary (R-18); Layer 1 capped with a norm-demotion
rule (R-19); NORMS.md is the canonical norm source with the global CLAUDE.md block copied
from it plus a drift check (R-20); every hook declares fail-open/fail-closed, warn-and-log
default, only the push gate blocks (R-21); a SessionStart hook row added for
parallel-work-recon's session-start half, amended onto the must-spike list (R-22); norm-backed,
hub-routed, and rare-event-high-consequence skills exempt from zero-fires demotion, "fire"
redefined to include hub routing (R-23); the scorecard reduced to an event-driven minimal
loop, dropping "incidents prevented" (R-24); hub routing tables updated in the same commit as
any new leaf, an orphan-leaf check added, per-hub description/routing edits added to the
upgrade bundles, amended so safe-smokes stays directly triggerable — subordination adds a hub
route, it does not narrow the leaf's own trigger (R-25); soft ~60-word leaf description cap
and an explicit token-cost criterion (R-26); the done-gate hub is named one-real-ride,
"definition-of-done" deleted (R-27); build order decoupled from evidence tiers — norms and
hubs first, amended so hooks that pass their spike may build first as the cheapest verified
wins (R-28).

Description quality (R-29..R-32), all unanimous: a "does not fire on" line required on every
stub as a gate on the SKILL.md writing phase (R-29); the three mushy merges fixed by
restoring the folded skills' trigger nouns (R-30); deliverable-integrity compressed to lead
with its three concrete trigger nouns (R-31); the boundary edits between
outbound-side-effect-idempotency/lock-at-the-chokepoint, live-state-first/parallel-work-recon,
and blast-radius-grep/verified-citations (R-32).

Content restorations and tier fixes (R-34..R-36, R-38, R-39), all adopted: ASH A28
diagnostics and A9 golden-thread restored, the Folded ledger made exhaustive (R-34);
enforce-invariants-in-build promoted to Tier 1 on three-repo convergence (R-35);
findings-are-evidence promoted to Tier 1 and the symptom-not-diagnosis rule single-homed
there with a verified-citations cross-reference (R-36); a passed-controls section added
(R-38); the banned-character gate scoped per-project by convention rather than by an
outward/internal split, because the mined incidents bit on internal test headers (R-39 —
adopted with the adversarial amendment; the chair's original outward-only amendment was
withdrawn on that evidence).

## Rejected item

R-33 (move the lazy-initialisation bullet from env-change-verification to unslop-code):
REJECTED 2 to 1. The reviewers converged on rejection from different angles — unslop-code's
scope is AI-generation tells, not initialisation patterns, and the lesson's failure mode
(module-load env read crashes; pure code un-importable in CI) sits squarely in
env-change-verification's baked-vs-request-time core. The bullet stays where it is. Chair
dissent recorded: the chair judged the bullet off the skill's trigger; the majority held the
trigger reads on env consumption timing, which the bullet is.

## Choice item

R-37 (the ASH security-audit rules): option (a) adopted 2 to 1 — build a Tier 2 skill
(working name server-side-authority) covering: derive storage paths and ids server-side from
the owned row; column-scope RLS self-update policies; RLS-or-revoke on every exposed table;
escape all admin-surface output. Majority rationale: the class includes a live-exploited role
escalation the ASH audit called its most urgent single change, and the IDOR pattern recurs
across repos; an anchor records a debt, a skill pays it. Dissent (positive reviewer): the
recurrence evidence is one audit event rather than cross-repo, and security descriptions risk
competing for the same vocabulary; a FORWARD anchor would be the doc's own honest deferral
mechanism. The dissent's design constraint was folded into the adopted outcome: one narrow
skill, not four, with a strict does-not-fire line.

## Passed controls (recorded, not voted)

- Consolidation honesty: 15 of 15 primary-source spot-checks across both reviewers verified.
- No encoding corruption in the document (full non-ASCII inventory ran clean apart from the
  em-dash count addressed by R-39).
- The provenance note, the reasoned Folded ledger, and the uncommitted status worked as
  designed — they are what made the review checkable.
- PropOS's provenance-drift lesson validates verified-citations as-is; the skills repo's own
  lesson 3 validates unslop-text's scanner-is-a-floor guidance as-is.

## Review incidents (the process's own errors, disclosed)

- The chair authored the document and its errors: the inflated "three ICC, several PropOS"
  preamble, two uncomputed aggregate numbers, harness mechanics stated as fact, five pairs of
  double-counted evidence, three silent drops outside the Folded ledger, one item folded and
  simultaneously listed as a leaf, and zero "does not fire on" lines against the doc's own
  mandate. All were caught by the reviewers, none by the chair's own pre-vote pass in full —
  the chair's findings caught the numbers, the mechanics, and one vocabulary collision, but
  not the evidence inflation, the double-counting, or the missing does-not-fire lines.
- The chair's R-39 amendment was wrong on the evidence and was withdrawn in the tally when
  the adversarial reviewer showed the mined incidents contradicted it.
- The fourth evidence corpus was not staged until the adversarial reviewer flagged it (R-16),
  which had forced the positive reviewer to work around it during spot-checks.
- Both reviewers' review-round reports were verbose relative to ballot needs; the vote round
  itself ran clean with no new investigation.

## Where things stand

The ratified amendments have been applied to docs/SKILL_PROPOSALS_2026-07-23.md (same
commit-unit as this record; both uncommitted). Build sequence per R-15/R-28: spike the three
harness mechanics first (fire-log hook, hub chaining, SessionStart hook), then norms + hubs,
then leaves, with the does-not-fire gate on every SKILL.md written.
