---
name: one-real-ride
description: Before declaring any deployed or user-facing change done, shipped, or closed out, run one real end-to-end invocation through the real seams — the deployed function, a real login and JWT, the real model call, the real browser or device. Green CI, green smokes, and a clean typecheck prove the layers; only the ride proves the seams. Triggers on "done", "shipped", "live", closing out a feature, and after any migration that existing code reads. Does not fire mid-implementation on individual command results (verify-the-effect's norm covers per-signal checks), nor on changes with no deployed or user-facing surface.
---

# One real ride

Seven incidents where every automated gate was green and the feature was broken in
production or the UI, plus a schema change that broke every report for five days while tsc
and the whole test suite stayed green. The pattern is always the same: each layer was proven
alone, and the defect lived in a seam between them. Layer: the done-gate hub.

## The rule

Before "done": one real end-to-end invocation of the changed path, through the real seams —
the deployed function (not the local one), a real authenticated session (not a service-role
shortcut), the real model call, the real browser or the real device. The smoke proves the
layer; the ride proves the seams.

## What counts as a seam

- Deployed runtime vs local: a deployed Edge Function 500'd on a dropped column CI could not see.
- Auth: a function's own role pre-check was wrong in a way its smoke structurally could not catch.
- Type-check vs render: "tsc green is not a working UI" — twice, including a Rules-of-Hooks blank page.
- Build vs dev server: they run different code paths; a green production build does not prove the dev server boots, and vice versa.
- Merge vs ship: know the deploy path per change type — a server merge may be live in minutes while an app merge reaches nobody until the next signed build. A merge is never a device test; the device test is the gate for device- or WebView-specific code.
- Inherited guards and configs: anything borrowed from a sibling surface was calibrated for its original inputs — the first real invocation is what catches the mis-calibration three reviews missed.
- Schema: after any migration existing code reads, ride the highest-value path once (generate the report, make the request). It is the only check that catches what synthetic-data tests cannot.

## Routes

- Interpreting any individual success signal during the ride → **verify-the-effect** (the norm; its playbook holds the diagnostics discipline).
- The change sends transactional email → **email-delivery-verification**.
- The change involved env vars, CI secrets, or hosted config → **env-change-verification**.
- The change touched build config, lockfiles, or toolchain → **reproduce-the-real-build**.

## What this skill does not do

It does not replace tests, smokes, or catalog verification — it is the last gate after them,
not a substitute. It does not fire on library-internal changes with no deployed surface.

## Why

Integration bugs live only in the seams, and every seam incident in the corpus was
discovered by a user or a first real invocation — never by the green board. Evidence: PropOS
LESSONS_LEARNED Sessions 13, 19, 23, 27, 43, 2026-07-05, 2026-07-11; ASH LESSONS_LEARNED
2026-05-27, 2026-07-11.
