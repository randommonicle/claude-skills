---
name: guard-the-spend-paths
description: When creating or reviewing any endpoint or control that touches money or shared state, two rules apply together. Every endpoint that spends money (LLM, email, SMS, payment) or writes shared state (bookings, slots) gets a per-IP volume cap the day it is created — anyone can POST directly, bypassing the UI. And any guardrail on that path written to fail open (origin allowlist defaulting to permit, auth that skips on a missing header) is inert until explicitly closed, and its failure is silent — name the real primary defence. Does not fire on internal-only endpoints behind service-role auth with no paid upstream; internal fan-out caps belong to lock-at-the-chokepoint.
---

# Guard the spend paths

From a public-facing AI site: the obvious LLM endpoint was capped, but the booking endpoints
were not — an open invitation to slot-griefing by direct POST. And the controls that looked
like defences were not: the origin allowlist failed open until its env var was set, and the
storage token's auth failed open too, so a misconfiguration was invisible in the UI and
discoverable only in function logs.

## Rule 1 — cap every spend path at creation

Any endpoint that spends money (a paid model call, email, SMS, payment) or writes shared
state (bookings, calendar slots, counters) gets a per-IP volume cap the day it is created,
not when abuse appears. The UI is not a gate: anyone can POST directly in a loop.
Rate-limiting is volume protection layered under auth and validation — it substitutes for
neither.

## Rule 2 — a fail-open guardrail is not a control until closed

For every control with a permissive default — an origin allowlist that permits when unset,
an auth check that skips on a missing header, anything that warns and continues:

- **Name the real primary defence.** Until the fail-open control is closed, something else
  is doing the protecting (or nothing is). Say which, in the code or the config comment.
- **Close it before launch**, explicitly, and verify from the live surface that it now
  rejects (env-change-verification applies — setting the variable is not the control being
  live).
- **Route its failures to logs or alerts.** An inert guardrail looks healthy from the UI;
  only its own telemetry reveals it stopped guarding.

## What this skill does not do

It does not cap internal fan-out (lock-at-the-chokepoint) and does not design auth. It
ensures the money and shared-state surfaces have a working volume gate and that no inert
control is being counted as a defence.

## Why

An uncapped spend path is an open tap on the bill, and a fail-open guardrail is worse than
none because it is counted as protection. Both failure modes are silent until the invoice or
the incident. Evidence: ICC LESSONS_LEARNED L-001, L-006, L-007 (L-007 shared evidence with
honest-failure-surfacing).
