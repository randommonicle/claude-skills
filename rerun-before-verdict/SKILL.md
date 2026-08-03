---
name: rerun-before-verdict
description: No verdict from a single uncontrolled run. A fix is proven by re-running the case that failed; a component's deadness or value is proven by a with/without comparison on the current system; a surprisingly good result stays a candidate until three consistent datapoints or a controlled before/after diff back it. Triggers when about to declare a fix proven, code dead, a component worthless, an approach impossible, or a result a breakthrough. Does not fire on interpreting a single success signal (verify-the-effect), on check integrity (prove-it-can-fail), or on the epistemic status of second-hand claims (findings-are-evidence).
---

# Rerun before verdict

A single run tells you where to look, never what is true. This skill governs the moment an
observation is about to become a verdict — fixed, dead, worthless, impossible,
breakthrough — and requires the controlled re-run that separates the two. Layer: leaf.
Admitted by review rather than by the misses log — see Provenance — so candidate-tier
until fires accumulate.

## The rule

Observations are diagnostic-grade; verdicts need a re-run that isolates the claim. Good
news gets the same discipline as bad.

## How to apply

- **A fix is proven by re-running the case that failed**, not by the edit looking right.
  Diagnose, fix, re-run is one loop; acting on the diagnosis alone ships the theory, not
  the fix.
- **Deadness and value are with/without questions.** Run the current system with and
  without the component before declaring it dead, redundant, or worthless. Apparently dead
  code can be load-bearing, and an apparent inefficiency can be the price of a correct
  result — removal on inspection alone is how both get discovered in production.
- **A suspiciously good result is a bug until ruled out.** Assume measurement error, data
  leakage, or coincidence first. A finding stays a candidate until at least three
  consistent datapoints, or one controlled before/after comparison, back it. Celebrating
  first and checking second is the expensive order.
- **"Impossible" is a verdict too.** It earns one only after the plausible alternatives
  have been enumerated and actually tried, not after one failed attempt.

## What this skill does not do

It does not interpret individual success signals — verify-the-effect owns proxy-vs-effect
for a single operation. It does not judge whether a check is capable of failing
(prove-it-can-fail), does not govern claims that arrive from agents or reviewers
(findings-are-evidence governs those; this skill governs the run-count behind your own
verdict), and does not gate "done" on shipped changes (one-real-ride).

## Why

The single-run verdict is the cheapest place for a wrong conclusion to enter the record:
once "fixed", "dead", or "10x faster" is written down, everything downstream inherits it
without re-checking, and the with/without or before/after evidence that would have caught
it becomes progressively more expensive to reconstruct.

## Provenance

Distilled from two methodology kernels ("implausibly good is probably broken",
"observations are not prescriptions") in
[Project Architect 2.0](https://github.com/Druthulu/ProjectArchitect) (source-available;
reviewed 2026-08-03). The other two kernels reviewed that day were already owned by
findings-are-evidence, verify-the-effect, and prove-it-can-fail, and were not duplicated.
Text written in-house; no upstream text copied.
