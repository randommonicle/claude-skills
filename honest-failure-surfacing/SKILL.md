---
name: honest-failure-surfacing
description: Playbook for the always-on norm "one message per failure mode; error level is for terminal states only". Load when writing a catch block, a user-facing error string, a disabled control, a progress indicator, or choosing telemetry levels. Does not fire on content loss through filters (no-silent-data-drop) or on test skip semantics (prove-it-can-fail).
---

# Honest failure surfacing

Three field incidents where the surface lied about what failed, plus a storage failure that
stayed invisible for hours behind a swallowing loop and a cosmetic progress bar. Layer:
norm + playbook — the one-line norm in the global CLAUDE.md is the everyday trigger; this
file is the depth.

## The rule

Every distinct failure mode gets its own user-facing message; never collapse them into one
reassuring string. A surface that cannot say what failed sends the user (and the developer)
to fix the wrong thing.

## How to apply

- **Classify before wording.** A catch block once painted every transcription failure as
  "No connection" while the real cause was a malformed-JWT 401 — costing hours of a field
  inspection. Distinguish at minimum: auth, offline, server, and input failures.
- **A disabled control cannot explain itself.** A `disabled` button swallows the tap, and
  the handler holding the explanation never runs. If a control can legitimately fail a
  precondition, let it be pressed and have it say why.
- **Per-item failures in a loop surface to the user**, not just to a log. A sync loop that
  swallowed per-photo upload errors showed a fake "Uploading…" pulse forever; nothing was
  uploading. Progress UI reflects real progress or it is a lie.
- **A permanently-failed item is surfaced as given up**, not silently retried forever — and
  never allowed to wedge the rest of the queue.
- **Error level is for terminal states.** Self-healing retries logged at `error` drowned the
  one terminal give-up that mattered. Retries log at warning; the give-up logs at error.

## What this skill does not do

It does not decide what happens to the data on a failing path — no-silent-data-drop owns
content preservation. It does not define skip semantics in tests — prove-it-can-fail owns
check integrity.

## Why

A wrong error message is worse than none: it actively redirects diagnosis. Every incident in
the evidence cost hours specifically because the surface asserted a cause it had not
established. Evidence: ASH LESSONS_LEARNED 2026-05-28, 2026-06-18, 2026-07-14 (offline), and
the CLAUDE.md storage-RLS upsert lesson; ICC L-007 (shared evidence with
guard-the-spend-paths).
