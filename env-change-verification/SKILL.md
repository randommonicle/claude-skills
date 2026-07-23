---
name: env-change-verification
description: An environment variable change is not live until the artifact that reads it is rebuilt, redeployed, or re-reads it — and a wrong-but-present value fails silently. Know for each variable whether it is baked at build time or read at request time. Triggers when adding or editing any env var, CI secret, or hosted config value, and when a CI or cloud build consumes build-time env. Does not fire on database schema changes (db-migration-verification) or on code-only changes with no config surface.
---

# Env-change verification

Cross-repo: an entire iOS build track silently talked to the wrong Supabase backend because
the cloud build could not see `.env.local` and nobody diffed the CI variables; a Railway
value stored as `KEY=value` served a malformed URL; Netlify functions read old values until
the next deploy.

## The rule

Setting a variable and the running artifact using it are two separate steps, and presence is
not correctness. After any env change: know the variable's read time, complete the step that
makes it live, and verify from the live surface.

## How to apply

- **Know the read time per variable.** Build-time-baked (`VITE_*`, `import.meta.env`,
  anything bundled) needs a rebuild; deploy-baked (serverless env) needs a redeploy;
  request-time-read needs nothing — the proposal's own flag conventions depend on knowing
  which is which.
- **CI and cloud builds never see `.env.local`.** Whenever a build consumes build-time vars,
  diff the CI variable set against the canonical local env — name by name AND value by
  value.
- **Validate the value, not its presence**: the right project ref (not the sibling
  project's), no `KEY=` prefix pasted into a value field, a URL that parses. A
  wrong-but-present value fails silently; a missing one at least crashes.
- **Verify from the live surface** — hit the endpoint, open the built app — never from the
  dashboard that shows what you just typed.
- **Adding a secret can activate a previously-skipped CI job** that needs more than that one
  secret; watch the next run.
- **Module-load env reads make pure code un-importable** (a CI red at import, before any
  test body, is the signature) and crash the process on a missing var — prefer lazy
  initialisation of external clients.

## What this skill does not do

It does not cover schema changes (db-migration-verification) or feature-flag semantics
beyond their read-time. It does not replace one-real-ride — a ride after an env change is
still the final gate.

## Why

Config is the only layer where a change can be "successfully saved" and have no effect at
all, indefinitely, with no error anywhere. Evidence: ASH LESSONS_LEARNED 2026-05-27
(evening), 2026-06-04 (night), and the CLAUDE.md Railway section; ICC L-018 and its
CLAUDE.md review-requests note.
