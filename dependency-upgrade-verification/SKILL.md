---
name: dependency-upgrade-verification
description: When a dependency major-bump could silently change on-disk formats or behaviour and runtime data cannot distinguish success from failure, answer the question from the dependency's own source: npm pack both versions and diff the file that decides the behaviour, offline, before hunting for a device repro. Triggers on major version bumps of storage, crypto, or serialisation dependencies. Does not fire on minor or patch bumps, or majors with no storage/serialisation surface.
---

# Dependency-upgrade verification

A SQLite plugin jumped two majors and the question was whether existing on-device databases
would survive. Inspecting runtime data could not answer it: an idempotent initialiser makes
a fresh database indistinguishable from a correctly-upgraded one. The data could not
distinguish the hypotheses, so no amount of device testing would.

## The rule

When runtime evidence cannot distinguish "upgrade handled correctly" from "silently started
fresh" (or any two hypotheses about a major bump), move upstream to something the failure
cannot forge — the dependency's own published source:

```bash
npm pack package@old package@new
# unpack both, diff the file that decides the behaviour
```

Diff the specific file that implements the concern (the storage layer, the migration
handler, the serialisation format), offline, before hunting for a device repro. The tarballs
are free, authoritative, and available without a device.

## Why

Published tarballs are a first-class diagnostic that answers in minutes what black-box
testing cannot answer at all when the observable states are identical. Evidence: ASH
LESSONS_LEARNED 2026-07-20 (SQLite plugin 6 to 8).
