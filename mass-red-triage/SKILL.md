---
name: mass-red-triage
description: When a test suite goes from green to broadly red, classify before debugging. Find the first root failure (cascades multiply one fault), check for rate-limit walls, truncated runs, and environment defects, and bound the change's blast radius via the lockfile and diff before attributing blame. Triggers whenever a suite or CI run turns broadly red, or a run's failure count looks implausible in either direction. Does not fire on a single failing test or on suites already red for known, recorded reasons.
---

# Mass-red triage

Seven incidents where the correct first move was classification, not debugging: 105 reds
that were throttling, ~80 reds off 3 real failures, "0 failed" beside an abnormal exit that
was a truncated run, and every-spec-fails-in-seconds environment defects. Hours were lost
debugging code for infrastructure artefacts — and the inverse error, trusting a truncated
green, is worse.

## The triage, in order

1. **Find the FIRST root failure.** Worker-restart cascades multiply one fault into dozens;
   the timestamps and the first stack tell you which red is causal.
2. **Check for a rate-limit wall.** A provider throttle masks the one real red behind it —
   always re-run to completion once the wall is identified.
3. **Check for truncation.** "0 failed" beside an abnormal exit code or a short duration is
   not a pass; grep the counted summary lines, never trust the tail of the output.
4. **Check for an environment defect.** Every spec failing in seconds at the same module
   line is one broken import or service, not many bugs.
5. **Bound the blast radius by evidence**: the lockfile diff and the change diff say what
   could have broken; a red outside that bound is infrastructure until proven otherwise.
6. **Run the suite twice** to split flake from regression, and update a lagging branch
   before judging its reds — a shared-state smoke fails on whatever PR is in flight.
7. **Instrument opaque failures**: one `console.error(skipReason)` beats reasoning in
   circles about why a spec is being skipped.

## What this skill does not do

It does not make checks honest (prove-it-can-fail governs whether a check can fail
truthfully) and does not fix the root cause — it gets you to the right root cause without
burning hours on artefacts.

## Why

Mass reds are usually one fault wearing many costumes, and the costumes are expensive to
debug individually. Classification first converts a day of whack-a-mole into minutes of
attribution. Evidence: PropOS LESSONS_LEARNED Sessions 29, 35 (two entries), 37, 40, 42,
48, 49.
