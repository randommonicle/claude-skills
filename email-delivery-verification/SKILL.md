---
name: email-delivery-verification
description: A 2xx from a transactional email API means accepted, not delivered. Verify actual delivery in the provider's dashboard or webhooks, check the account-level suppression list, verify every recipient leg of a multi-recipient flow, and confirm a mailbox exists before pointing a send at it. Triggers when adding or changing any transactional email send or recipient address, and when diagnosing "the email never arrived". The provider-specific child of verify-the-effect. Does not fire on non-email side effects (outbound-side-effect-idempotency) or on the content of the email.
---

# Email delivery verification

Three occurrences across two repos, all the same shape: the API returned success, the team
believed the mail sent, and it silently never arrived. A corporate filter hard-blocked the
whole message over an attachment type; a wrong operator address hard-bounced once and the
provider's account-level suppression list swallowed every subsequent send to it, forever and
silently.

## The rules

- **2xx means queued.** Actual delivery status (delivered / bounced / suppressed) lives in
  the provider's dashboard or webhooks — read it there when a send matters, and after any
  recipient change.
- **Check the suppression list as part of any "never arrived" diagnosis.** One hard bounce
  can suppress an address account-wide; subsequent sends return 2xx and go nowhere.
- **Verify every recipient leg.** Multi-recipient flows fail per-leg: the customer email
  worked while every operator notification was suppressed. Checking one leg proves one leg.
- **Confirm a mailbox exists before addressing it** — the suppression cascade starts with
  one send to a mistyped or unprovisioned address.
- **Corporate filters block whole attachment classes.** `.html` attachments get the entire
  message rejected by M365/Mimecast-class filters: deliver links, attach only tolerated
  formats (a DOCX passes where an HTML file does not). For recipients on a firm's own
  domain, a recipient-side block can only be fixed by their IT allowlisting the sender.
- **A sandbox sender reaches only verified addresses** — verify the sending domain before
  relying on any send in the field.

## What this skill does not do

It does not choose failure semantics for the send-then-record path
(outbound-side-effect-idempotency) and does not govern email content. It is the delivery leg
of verify-the-effect, split out because the mechanics are provider-specific.

## Why

Email is the one side effect whose failure mode is designed to be silent: providers accept
first and fail privately. Every incident in the evidence was discovered by a human noticing
absence, days later. Evidence: ICC LESSONS_LEARNED L-004, L-015; ASH CLAUDE.md DNS/Email
lesson (2026-05-21).
