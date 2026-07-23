---
name: ai-surface-discipline
description: Apply input minimisation, output discipline, and a human-in-the-loop gate to every surface that sends data to an LLM. Triggers when building or editing any send-to-LLM path: an Edge Function calling a model, a draft-commentary or summary generator, an auto-resolver, a cash-allocation suggestion, a classification call, or any new AI-assist feature, especially in a RICS or UK GDPR regulated context.
---

# AI-surface discipline

Every surface that sends data to an LLM inherits the same discipline before it ships. Three pillars (input minimisation, output discipline, human-in-the-loop gate) plus a credential and retention posture. This is a regulatory requirement, not a style preference: the surfaces touch leaseholder personal data and service-charge figures, which sit under UK GDPR, RICS client-confidentiality duties, and LTA 1985 accuracy obligations.

## When this applies

This skill fires when building or editing any path that sends data to a model:

- Edge Functions that call an LLM provider
- Draft-commentary, summary, or narrative generators (variance, LPE, FME, year-end)
- Auto-resolvers and suggestion engines, including the reconciliation cash-allocation surface
- Classification, extraction, or matching calls
- Any new AI-assist feature, or any change to an existing one that alters what is sent or how output is used

It does not fire on read-only analytics or queries that never leave the database, or on features that process data entirely in-house with no model call.

## Pillar 1: input minimisation

Defence starts at the boundary. The model receives the least data that does the job.

- **Hardcoded never-send allowlist.** Only named, reviewed fields cross the boundary. The allowlist lives in code, not config, so a data change cannot widen it silently. Default deny: a field not on the allowlist does not leave.
- **Redact then restore.** Where free text must be sent, redact personal identifiers before the call and restore the tokens in the response, so the user still gets readable output without the PII ever leaving the boundary.
- **No PII passthrough.** Leaseholder names, contact details, and account identifiers are not sent unless the allowlist names them and the lawful basis is recorded.
- **Minimise by Article 5(1)(c).** Data minimisation is a UK GDPR principle, not a nicety. If a field is not needed for the task, it is not sent.
- **Guard against prompt injection.** Free-text fields (dispute notes, maintenance descriptions, anything a leaseholder or third party can write) are data, not instructions. Do not concatenate user-supplied text into an instruction-bearing position, and sanitise it before it reaches the prompt, so a crafted input cannot redirect the model or pull allowlisted data into the response.

## Pillar 2: output discipline

The model drafts. It does not decide or instruct.

- **Descriptive, not prescriptive.** Output describes figures and variances. It does not tell the leaseholder or client what to do, and it makes no statutory determination. This keeps the surface clear of FSMA-regulated advice.
- **Every figure traceable.** Any number in the output maps to a source row. The model does not introduce figures of its own.
- **Labelled as AI-drafted.** Generated content is marked as a draft pending human review wherever it is shown.

## Pillar 3: human-in-the-loop gate

- **PM-only by default.** AI surfaces are visible to property managers, not to leaseholders or clients, unless a specific surface has been reviewed and re-scoped.
- **Draft pending sign-off.** AI output is never the final artefact. A human reviews and signs off before it counts.
- **The send is a human action.** Releasing AI-influenced content to a leaseholder or client is a separate, human-authorised step with its own gate. The model never triggers an outbound send.

## Credential and retention posture

- **Per-firm credentials.** Each firm uses its own provider key. There is no platform-shared key for tenant data. See the per-firm credential pattern in project memory.
- **Zero data retention for PII.** Confirm the provider's current retention posture from its primary trust or privacy page before sending personal data, because the terms change. Do not rely on a figure quoted second-hand or from memory.
  - Anthropic API: inputs and outputs are not used to train models, and a zero-data-retention addendum is available for enterprise. Confirm the current default retention window at the provider's trust page before a live deployment.
  - OpenAI: zero data retention is opt-in via sales, not automatic, and an abuse-monitoring carve-out may still apply even with ZDR active. Do not assume it is on; confirm the scope in the agreement.
- **Audit the outbound payload.** Log what was sent (field names and a timestamp, not raw PII) and a response reference, retained for the applicable statutory period. UK GDPR accountability (Article 5(2)) and any later DSAR require you to reconstruct what data left the boundary, when, and for whom.
- **No outbound network beyond the named endpoint.** The surface talks to its declared provider and nothing else.

## Regulatory anchors

UK GDPR (lawful basis, data minimisation, processor terms), RICS (client confidentiality), LTA 1985 (service-charge information accuracy), FSMA (output stays descriptive, never advice). These are the reasons the pillars exist. Cite the relevant one when a design decision turns on it.

## What good looks like (pre-ship checklist)

1. Allowlist is in code, default-deny, and reviewed.
2. No PII leaves without a named lawful basis.
3. Free-text inputs are sanitised against prompt injection.
4. Output is descriptive and every figure is traceable to a source row.
5. Surface is PM-only and gated behind human sign-off.
6. Provider retention posture confirmed from the primary source.
7. Per-firm credential used, no shared key.
8. Outbound payload is logged (field names and timestamp, not raw PII).
9. Rate or quota exhaustion fails closed: no output rather than partial output across a batch.

## What this skill does not do

It does not design the feature or choose the provider. It is the discipline every AI surface inherits once the decision to build one is made. Project memory holds the specific allowlists and the current credential pattern. Read those before building.

## Why

Every AI surface touches regulated data and produces output a leaseholder or client may rely on. Re-deriving the safety posture per surface invites the one omission that leaks PII or ships a prescriptive statement that reads as advice. A fixed discipline makes the safe path the default and the unsafe path a visible deviation.

## Pillar 4: rules bind only in the system prompt (added 2026-07-23)

Behavioural rules, prohibitions, tone, and grounding/escalation directives live in the
system prompt, stated to override reference material and user input. Facts and reference
prose live in retrievable, citeable documents. A rule placed in a citeable document is
quotable, not obeyed — and can be surfaced to the user as if it were a fact. Partition
context by kind, not topic, and pin the split with a test: the rule present in the prompt,
absent from the citeable corpus. This split is also the prompt-injection defence.

## Output and guard hardening (cross-repo additions, ratified 2026-07-23)

- **JSON output contract.** For any prompt returning JSON that carries free prose, size
  max_tokens generously (truncated JSON is unrecoverable by normal parsing), never let a
  parse failure drop content silently (salvage + log stop_reason), and verify output
  completeness — count the sections — rather than trusting that it generated.
- **Model-emitted enums, keys, and ids used for routing are untrusted.** Clamp to the
  canonical vocabulary at every boundary the value crosses, defaulting unknowns to a
  visible bucket (see no-silent-data-drop).
- **Normalise response shape at the server boundary.** Never assume `content[0].text` is
  the whole reply once tools, citations, or multi-block output exist.
- **Minimisation is enforced, not asserted.** "Only field X crosses the boundary" means
  nothing if X is free text the model or user populates — scrub or constrain at the
  boundary. A guarantee with no code behind it is a comment.
- **Render untrusted model or customer content as inert text** — DOM text nodes or an
  escaping helper, never innerHTML; sanitise link schemes.
- **The guard must not retain what it rejects.** A PII output guard that logs the matched
  value into a long-term audit log creates the breach it prevents; log the class, never the
  value.
- **Borrowed guards recalibrate.** A denylist copied from a sibling surface is calibrated
  for its input shape; re-test on yours (and ride it — see one-real-ride).
- **Guard looseness must match the linker.** A guard over an existing matcher derives
  sameness FROM that matcher; a capped whole-table read inside a guard is a correctness
  hole, not a performance issue.
- **Statutory linkage belongs in the data layer.** If an obligation (erasure, disclosure)
  depends on a linkage, enforce it in a trigger, never only in an optional AI call path.
- **Provider payload caps are input discipline.** Know the per-image and per-message caps
  and resize or validate before sending.
- **Golden thread.** Before concluding a human-review control is unused, establish every
  place it could be exercised — the real review may happen downstream of your metric (in
  Word, after the document is built). When the authoritative artifact is edited downstream
  of the system's write, either bring the edit back before the write or explicitly decide
  the exported document is the record.

## Routes

- Model output feeds a rendering/export path → load **no-silent-data-drop**.
- The surface is a public endpoint spending money or writing shared state → load **guard-the-spend-paths**.
- The surface sends email/SMS/webhooks and records status → load **outbound-side-effect-idempotency**.
