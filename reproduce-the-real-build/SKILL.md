---
name: reproduce-the-real-build
description: Before pushing anything a CI or release pipeline will compile, run the exact production build command locally — the test runner tolerates syntax and dependency drift the release build rejects. Prove any toolchain fix by reconstructing from tracked manifests alone (npm ci into a clean directory). Triggers before pushing build-config, lockfile, or toolchain changes, and when tests pass but deployment builds fail. Does not fire on test-only changes no release pipeline compiles.
---

# Reproduce the real build

Two incidents, one shape: the environment that proved the change was not the environment
that ships it. A test using ESM-only syntax passed under the test runner and failed the
CommonJS production `tsc`, blocking the deploy. A build-toolchain upgrade left the lockfile
behind and kept working for two months only because both machines' `node_modules` had
drifted ahead of it — the first clean reinstall broke everything.

## The rules

- **Run the exact production build command locally before pushing** anything the pipeline
  compiles — not just the test suite. The test runner tolerates what the release build
  rejects.
- **Prove toolchain fixes from the tracked manifests alone**: `npm ci` into a clean
  directory (never `npm install`, which mutates the lockfile and hides drift). A fix proven
  only on the machine that produced it has not been proven — that machine's `node_modules`
  is part of the experiment.
- **The lockfile describes what ships.** If the build only works because installed
  dependencies drifted ahead of it, the lockfile is silently wrong and the next `npm ci`
  is the outage.

## Why

Build environments drift invisibly toward working, and the drift is per-machine; only a
manifest-only reconstruction tests what CI and the next machine will actually see. Evidence:
ASH CLAUDE.md Railway/Docker tsc lesson (2026-05-20); ASH LESSONS_LEARNED 2026-07-19.
