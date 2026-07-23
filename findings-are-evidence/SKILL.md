---
name: findings-are-evidence
description: A subagent, reviewer, or scout report is evidence, not findings — and so is your own first-hand defect analysis. Re-derive every Critical or High claim, everything touching a regulatory anchor, and the reasoning about the fix from the primary source before acting or writing it into a durable artifact. Triggers when consuming any agent or reviewer output and when recording a defect or fix analysis. Does not fire on low-severity suggestions with no gating or regulatory consequence — sample those rather than re-deriving them all.
---

# Findings are evidence

Ten incidents across two repos of acting on an overstated, stale, or simply wrong claim that
arrived wearing a severity label: a "critical" shared-phone exploit refuted by reading the
installed dependency's source; a reviewer's suggested correction that was itself wrong on
the statute; a scout asserting a directory did not exist when it did; a verifier "blessing"
a wrong claim because the brief it was handed contained the error. Layer: one of the six
always-on norms; this file is the playbook.

## The rule

Reports are inputs to verification, not outputs of it. Before a claim gates a merge, enters
a durable artifact, or triggers work: re-derive it from the primary source if it is rated
Critical or High, touches a regulatory anchor, or is your own analysis of a defect or fix.

## How to apply

- **A severity label is a hypothesis.** Before gating anything on a "Blocker", refute it
  against ground truth — the installed `node_modules` source, the live catalog, the actual
  runtime — not against the reporter's confidence.
- **The brief handed to a verifier is itself a claim.** A verification pass inherits its
  brief's errors; a specialist contradicting the brief earns a primary-source check, not an
  override.
- **Your own conclusions qualify.** Verify the claim you make about the FIX, not just the
  claim you were given — the remedy's reasoning earns its own verification pass.
- **A failure message is a symptom, not a diagnosis** ("not recognized" is not "not
  installed"). This is the canonical home of that rule; verified-citations cross-references
  it.
- **A convenience tool that mirrors a first-party CLI must be diffed against the CLI**
  before its output is committed — an MCP typegen once emitted a 483-line-short file that
  passed every gate. Prefer the path the project's own scripts drive.
- **A wrong exploit can still sit on a real smell.** Fix what is real; drop the inflated
  severity. Refutation is not exoneration.

## What this skill does not do

It does not organise multi-reviewer processes (committee-review) and does not govern
citation formatting (verified-citations). It governs the epistemic status of claims,
whoever produced them.

## Why

Agents and reviewers are rewarded for finding things, so their output skews confident; and
self-produced analysis carries the same bias with less scrutiny. Every incident in the
evidence was cheaper to re-derive than to act on wrongly. Evidence: PropOS LESSONS_LEARNED
Sessions 12, 15, 16, 22, 35, 42, 43, 2026-07-07, 2026-07-20; ASH LESSONS_LEARNED 2026-07-09.
