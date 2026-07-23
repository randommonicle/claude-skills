---
name: verify-the-effect
description: Playbook for the always-on norm "never report success from a proxy signal — assert the actual effect or artifact". Load when a status signal (green CI step, HTTP 200, "accepted", exit 0, progress bar) is about to be read as success, when a step's entire output is a side effect, or when routed here from the one-real-ride done gate. Does not fire on test-suite results (prove-it-can-fail) or on declaring a whole feature done (one-real-ride owns that moment).
---

# Verify the effect

The most recurrent failure in the lessons corpus (~nine ASH incidents plus the ICC email
family): a success indicator that was true while the effect was absent. A green CI signing
step that signed nothing. A report that "generated and emailed" while silently missing five
sections. An HTTP 200 password change that never changed the password. "Accepted by Resend"
masking a bounce. A served Content-Type differing from the uploaded one. Layer: norm +
playbook — the one-line norm in the global CLAUDE.md is the everyday trigger; this file is
the depth behind it.

## The rule

A success indicator that can be true while the effect is absent proves nothing. Identify the
real intended effect of the operation — the file signed, the row written, the email
delivered, the section rendered, the password actually changed — and assert that.

## How to apply

- **Side-effect steps assert the side effect.** Any step whose entire job is a side effect
  (signing, uploading, sending, publishing) gets an explicit post-step assertion: list the
  signature, HEAD the URL, read the delivery status. "The step was green" is not evidence —
  a Codemagic signing step once succeeded having signed nothing.
- **Verify the artifact the user receives**, not the pipeline's account of it: count its
  sections, count its photos, open the download link, check the served header rather than
  the uploaded one. A report can generate, email, and be missing half its content.
- **Sensitive mutations are verified by using the result** — sign in with the new password,
  read back the changed row — never by the response code. A WebView once returned 200 for a
  password change that silently no-opped.
- **Diagnose from ground truth before theorising**: server and auth logs, breadcrumbs, CI
  step durations (a two-second step that must call a remote API didn't call it), the running
  database, live object definitions. A working login proves only that one backend is
  reachable.
- **Acceptance is not delivery.** A provider 2xx means queued. For transactional email,
  load email-delivery-verification — the provider-specific child of this rule.

## What this skill does not do

It does not gate feature completion — one-real-ride owns the "done/shipped" moment and
routes here. It does not judge test results — prove-it-can-fail owns check integrity.

## Why

Every proxy signal exists because it is cheaper than the real assertion, and each incident
in the corpus was invisible precisely as long as the proxy was trusted. Evidence: ASH
LESSONS_LEARNED 2026-05-21 (three incidents), 2026-06-04, 2026-06-07, 2026-06-09,
2026-07-14; ICC L-004/L-015 (shared evidence with email-delivery-verification).
