---
name: server-side-authority
description: Four server-side authority rules for any client-facing backend. Never trust a client-supplied storage path or object id — derive it server-side from the row the caller owns. An RLS self-update policy must scope columns, not just rows, or a user can promote their own role. Every exposed table gets RLS enabled or its grants revoked — a code comment is not a control. Escape all dynamic output in admin surfaces. Triggers when adding or reviewing a route that accepts client-supplied paths/ids, an RLS self-update policy, a new public-schema table, or an admin dashboard render. Does not fire on general security review (the security-review command) or client-side validation UX.
---

# Server-side authority

Four rules from an independent security audit's transferable findings, including a
role-escalation the audit called its most urgent single change and an IDOR pattern that
recurs across repos. Added by committee decision (2-1, dissent recorded in the review
record) as one narrow skill rather than four broad ones.

## Rule 1 — derive paths and ids server-side from the owned row

Never download, mutate, or serve whatever path or id the client sent, even after checking
the caller owns a related record. A photo-analysis route once verified the caller owned the
photo row, then downloaded whatever `storage_path` the request carried — an access-confusion
hole. The owned row already knows its own path; read it from there.

## Rule 2 — RLS self-update policies scope columns, not just rows

`UPDATE ... WHERE auth.uid() = id` with no column restriction lets a user set their own
`role` to admin. Restrict the writable columns — a trigger rejecting privileged-column
changes, or a column-level REVOKE — not only the row. Row-scoping answers "which records";
it says nothing about "which fields".

## Rule 3 — every exposed table: RLS enabled, or grants revoked

A public-schema table is reachable through the API layer regardless of what the code
comments assert. "The anon key never touches this table" is a comment, not a control
(enforce-invariants-in-build applies). Either enable RLS with real policies or revoke the
role grants — and verify from the catalog, not the comment.

## Rule 4 — escape all dynamic output in admin surfaces

Escaping only the fields you consider user-supplied leaves the rest as a stored-XSS path
into the most privileged session in the system. Names, emails, job titles, and addresses
are attacker-writable too. Escape everything dynamic, uniformly, at the render boundary.

## What this skill does not do

It does not replace a full security review (the security-review command exists for that),
govern client-side validation, or cover the wider audit programme (backups, transfers,
seed-data hygiene stay project-side). Four rules, checked at the moments named in the
trigger.

## Why

All four are authority confusions: the server letting the client, the row, the comment, or
the "trusted" field carry an authority decision the server itself must make. Each was found
live in a production audit. Evidence: ASH CLAUDE.md independent-audit section (2026-05-22);
ICC LESSONS_LEARNED L-003 for the output-escaping class.
