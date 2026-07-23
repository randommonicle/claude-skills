---
name: no-silent-data-drop
description: Playbook for the always-on norm "filters and gates hide empty things; they never drop content". Load when adding any filter, gate, continue, catch, or fallback to a rendering or export path, when parsing model output that carries content, or when two renderers must produce the same content. Does not fire on error-message wording or telemetry levels (honest-failure-surfacing) or on filters over data the user never receives.
---

# No silent data drop

The ASH 2026-06-04 cluster: user and model content silently vanishing from delivered reports
through render gates, model-assigned routing keys, and JSON parse failures — discovered by
the recipient, never by the pipeline. Layer: norm + playbook — the one-line norm in the
global CLAUDE.md is the everyday trigger; this file is the depth.

## The rule

Wherever code can discard data — a filter, a gate, a `continue`, a `catch`, a `?? fallback`
— ask: what happens to the non-matching data? A gate may hide an empty section; it must
never drop content. Anything holding content still renders somewhere, and a safe default
bucket always beats a drop.

## How to apply

- **Gates hide empty things only.** A property-flag render gate once dropped mis-classified
  photos from delivered reports for weeks; the fix routes non-matching content to a visible
  default section instead.
- **A parse failure never discards content.** A truncated model JSON threw in `JSON.parse`
  and five report sections vanished silently. Salvage what can be salvaged, log the stop
  reason, surface the failure.
- **Model-emitted enums, keys, and ids used for routing are untrusted input.** Clamp to the
  canonical vocabulary where the value enters AND again at render (stored rows may hold
  unclamped values), defaulting unknowns to a visible bucket.
- **Two renderers share the grouping function.** Hand-synced twins drift, and the divergence
  masks the loss — one representation kept all photos while the other dropped them, so the
  audit trail looked complete.
- **Verify the delivered artifact** (count sections, count photos), and be suspicious of any
  test that asserts content IS dropped — a passing test once encoded the bug.

## What this skill does not do

It does not govern how failures are messaged to the user — that is honest-failure-surfacing.
It does not apply to filters over data the user never receives (internal telemetry,
debug output).

## Why

Dropped content is the worst failure class in a document pipeline because the artifact still
ships: everything looks successful, and only the recipient can notice the hole. Evidence:
ASH LESSONS_LEARNED 2026-06-04 (all entries) and the CLAUDE.md max_tokens truncation lesson;
ICC L-008.
