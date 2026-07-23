# Global skill proposals — 2026-07-23

Proposals for new global skills and upgrades to the existing fourteen, mined from every
lessons-learned file on the work machine. Written to be actioned: each proposed skill has a
draft frontmatter stub ready to grow into a SKILL.md.

Revised 2026-07-23 after a three-lens committee review (positive Fable, adversarial Fable,
neutral chair). 38 of 39 ballot items adopted and applied below; the full tally, dissents,
and the process's own disclosed errors are in REVIEW_2026-07-23_skill_proposals.md. Notable
revisions: two skills promoted to Tier 1, one security skill added to Tier 2 (24 proposed
skills total), the four broadest rules re-shaped as norm + playbook, every stub given a
"does not fire on" line, the aggregate numbers corrected, and all harness-mechanics claims
marked with a verification status.

## Method and sources

Four reviewers over four corpora, 2026-07-23:

| Reviewer | Corpus |
|---|---|
| Fable subagent | `PropOS/docs/LESSONS_LEARNED.md` (2,393 lines) + PropOS CLAUDE.md |
| Opus subagent | `ash-inspection-app/LESSONS_LEARNED.md` (939 lines) + its CLAUDE.md gotcha/known-issues sections |
| Opus subagent | `icc-site/LESSONS_LEARNED.md` + icc-site CLAUDE.md |
| Main session (Fable) | This repo's own `LESSONS_LEARNED.md`, README, and all 14 SKILL.md files (coverage map; staged as the fourth evidence report per review item R-16) |

The old `ASH App - POC` repo contains no markdown docs and contributed nothing.

Each reviewer tagged every generalizable lesson as covered / upgrade / new-skill candidate and
counted recurrence (the same failure recurring across dates or repos). Recurrence and
cross-repo convergence drive the ranking below: a lesson that fired independently in two or
three repos is the strongest possible signal a global skill is needed.

Evidence-reuse note (R-12): where one incident is cited under two proposals (for example ICC
L-007 under both honest-failure-surfacing and guard-the-spend-paths, or ASH 2026-05-25 under
both live-state-first and the db-migration-verification bundle), the reuse is deliberate and
marked "(shared evidence)". Aggregate counts exclude reuse.

Provenance note: evidence pointers below cite dated entries and section headings in the four
lessons files, as extracted by the reviewer passes. They are entry-level pointers, not
line-verified quotes; re-verify against the file before quoting any of them onward. During
the committee review, 15 of 15 primary-source spot-checks across both reviewers verified.

## How to read this

- Tier 1: build first. Highest recurrence, cross-repo convergence, cleanest generalization.
  Now ten skills — findings-are-evidence and enforce-invariants-in-build were promoted by the
  committee on the doc's own criteria (R-35, R-36).
- Tier 2: build next. Strong single-repo evidence or slightly narrower trigger. Now ten,
  including the committee-added server-side-authority (R-37a).
- Tier 3: micro-skills. One crisp rule each; cheap to write, low urgency.
- Upgrades: lessons that belong inside an existing skill rather than a near-duplicate new one.
- Folded: candidates a reviewer proposed that were merged into another proposal, with the reason.
- Norm + playbook (R-17): four Tier 1 rules are marked this way. Their everyday trigger is a
  one-line norm in the global CLAUDE.md (see Layer 1); their SKILL.md keeps the full playbook
  body but its description is deliberately narrowed to routing and name-invocation duty, so it
  does not compete broadly in the description listing.

---

## Tier 1 — build first (10 skills)

### 1. verify-the-effect — norm + playbook

The most recurrent failure on the machine: roughly nine ASH incidents plus two ICC
(shared-evidence family with email-delivery-verification). A green CI step that signed
nothing; a report that "generated and emailed" while silently missing five sections; an HTTP
200 password change that never changed the password; "accepted by Resend" masking a bounce; a
served Content-Type differing from the uploaded one. The #1 rank stands on the ASH recurrence
alone.

```markdown
---
name: verify-the-effect
description: Never conclude an operation succeeded from a proxy signal — a green CI step, an HTTP 200, "accepted", a clean exit code, a completed progress bar. Identify the real intended effect (file signed, row written, email delivered, section rendered, password actually changed) and assert that, at the moment of interpreting any status signal. Does not fire on interpreting a test suite's own results (prove-it-can-fail) or on declaring a whole feature done (one-real-ride owns that moment). Ships as a Layer 1 norm; this description is deliberately narrow — the norm is the everyday trigger.
---
```

Rule core:
- A success indicator that can be true while the effect is absent proves nothing. Find the artifact.
- Steps whose whole job is a side effect (signing, uploading, sending) must assert the side effect landed: list the signature, HEAD the URL, read the delivery status.
- Verify the artifact the user receives: count its sections, count its photos, open the download link, check the served header rather than the uploaded one.
- For sensitive mutations, verify by using the result (sign in with the new password), never by reading the response code.
- Diagnose from ground truth before theorising: server and auth logs, breadcrumbs, CI step durations, the running database, live object definitions (restored per R-34; ASH A28).
- Provider acceptance is not delivery (see email-delivery-verification, Tier 2 — the provider-specific child of this rule).

Evidence: ASH LL 2026-07-14 (Codemagic signing step green, signed nothing), 2026-05-21
(max_tokens truncation dropped 5 report sections; WebView updateUser 200 no-op; Resend
accepted-vs-bounced), 2026-06-09 (served `text/plain`), 2026-06-04/07 clusters; ICC L-004,
L-015 (shared evidence with email-delivery-verification).

### 2. one-real-ride

The macro companion to verify-the-effect: seven PropOS incidents plus the ASH FK outage where
every automated gate was green and the feature was broken at the seams. Owns the
completion-declaration trigger exclusively (R-18).

```markdown
---
name: one-real-ride
description: Before declaring any deployed or user-facing change done, shipped, or closed out, run one real end-to-end invocation through the real seams — the deployed function, a real login and JWT, the real model call, the real browser or device. Green CI, green smokes, and a clean typecheck prove the layers; only the ride proves the seams. Triggers on "done", "shipped", "live", closing out a feature, and after any migration that existing code reads. Does not fire mid-implementation on individual command results (verify-the-effect's norm covers per-signal checks), nor on changes with no deployed or user-facing surface.
---
```

Rule core:
- The smoke proves the layer; the ride proves the seams.
- Merged is not shipped: know the deploy path per change type (server auto-deploy vs client build), and a device test is the gate for device- or WebView-specific code, not the merge.
- Ride inherited guards and configs too — they were calibrated for their original context.
- After any schema change, one real end-to-end run of the highest-value path (a report, a request) is the only check that catches what tsc and synthetic-data tests structurally cannot.

Evidence: PropOS Sessions 13, 23, 27, 43, 2026-07-11, 2026-07-05, Session 19; ASH LL
2026-05-27 (FK broke every report ~5 days, invisible to all tests), 2026-07-11 ("the device
test is the gate, not the merge").

### 3. prove-it-can-fail

Nine-plus PropOS incidents of green boards that structurally could not go red, including a
statutory control with no assertion behind it on any run ever, and verification files that
printed pass on any error.

```markdown
---
name: prove-it-can-fail
description: Every test, seed, verification script, CI gate, or check must demonstrably be able to fail when the thing it guards is broken. Ask of each check "what does this print if the thing is broken?" Triggers when writing or reviewing any test, smoke, seed, verification file, or CI job, when marking a test skipped, and when arming a new gate. Does not fire on triaging an already-red suite (mass-red-triage) or on how tests touch shared data (safe-smokes).
---
```

Rule core:
- A server reply is never a skip. Skips are for transport failures only; a catch-all `catch { skip }` hides a total outage as amber.
- Seeds get assertions. Fire-and-forget seeding lets a negative test (an RLS isolation check) pass for the wrong reason; negative assertions need a positive control.
- Only the specific expected error proves a control fired. "It threw" is not "the gate caught it".
- A check whose two operands share a source is theatre — trace both to independent sources.
- Watch a newly-armed gate's first run to completion, and the whole pipeline after fixing its first red step — a second failure can queue behind the first (folded: PropOS fail-fast lesson).
- Test every mutation shape the app performs (set, swap, null) against a guard (folded: PropOS Session 12).
- Assert on the subject, not a document-wide pattern: a broad "no X anywhere in the output" assertion is a hidden dependency on everything else and breaks on innocent code.
- When fixing a bug, check whether a green test pins the wrong behaviour — a passing test can encode the bug.
- Mechanics note: a CI check that reads a snapshotted event payload cannot be re-run into a pass after editing the source (close/reopen refreshes it) (folded: PropOS 2026-07-20).

Evidence: PropOS 2026-07-14 (both entries), 2026-07-19 (×2), 2026-07-15, Sessions 16, 18, 30,
33; ASH LL 2026-06-09 (base64 absence assertion), 2026-06-04 ("a passing test can encode the bug").

### 4. live-state-first — norm + playbook

The single most-repeated lesson in the PropOS file: twelve-plus recurrences of building
against a world that no longer exists.

```markdown
---
name: live-state-first
description: Probe the live source before building from any described state — a handover, memory note, README, audit tracker, code comment, or another doc's claim. The latest migration, policy, or config is the truth; every document claim is a claim to verify with one cheap probe (catalog query, deployed-surface check) before it becomes an input. Does not fire on repo/PR/branch state at session start (parallel-work-recon owns repo probes) or on state you observed yourself this session. Ships as a Layer 1 norm; this description is deliberately narrow — the norm is the everyday trigger.
---
```

Rule core:
- When two documents disagree, the catalog settles it.
- The live database routinely runs ahead of main (raw-applied unmerged migrations) and behind the repo (comments and fixes never applied). A migration file is not the live object, in either direction.
- Query the live distribution, not just the schema, before building on a data assumption — residue rows can make a correct feature ship looking broken.
- Structured data needs a parser, not a grep with context lines; scope schema greps to the block they describe.
- "Still open" items carried across handovers are the most likely claims to be stale; so are a repo's own path hints and self-descriptions.

Evidence: PropOS Sessions 9, 11, 12, 41, 54, 22, 52; PropOS 2026-07-08, 2026-07-09,
2026-07-19, 2026-07-06, 2026-07-20; ASH LL 2026-05-25, 2026-07-10 (shared evidence with the
db-migration-verification bundle).

### 5. blast-radius-grep

Converged independently in all three repos: the named list of places to change under-counts,
whether the thing changed is a code action or a duplicated fact.

```markdown
---
name: blast-radius-grep
description: The unit of change is the action or the fact, never the named list of places someone handed you. Before shipping a gate, constraint, rename, drop, or a correction to any duplicated, mirrored, or denormalised value, grep the whole repo — app, tests, seeds, scripts, open branches, and the built or rendered output — and fix every occurrence in the same pass; back any value copied into a second store with a trigger and a zero-rows drift-check query. Triggers on "change X in A and B" instructions, constraint or gate additions, drops and renames, denormalising a value, and correcting any fact that is not single-sourced. Does not fire on checking references in prose documents — verified-citations owns citation accuracy; this skill owns content duplication.
---
```

Rule core:
- Specs, handovers, and audits name call sites; the grep finds the ones they missed. Grep by the thing changed, not the feature name — a governed-set migration breaks an untouched smoke.
- A new constraint or gate must be reconciled against fixtures and test payloads, not only live data; fixing the corpus is part of the change's real cost, in the same commit.
- A drop or rename greps unmerged branches and test payloads too.
- After correcting a fact, grep the rendered or built output as well as source, and leave a single-source anchor so it cannot re-diverge. For a value denormalised into a second store, back the copy with a trigger and ship a standing "these two must match / zero rows" drift-check query used as both post-change verification and future diagnosis.

Evidence: PropOS Sessions 32, 35, 13, 27, 29, 42, 2026-07-14; ASH LL 2026-05-27 (both entries,
FK embeds — shared evidence with the db-migration-verification bundle), 2026-06-10 (email
drift between auth.users and public.users); ICC L-009 addenda ("grep the built site"), L-017.

### 6. no-silent-data-drop — norm + playbook

The ASH 2026-06-04 cluster: user and model content silently vanishing from delivered reports
through render gates, enum routing, and JSON parse failures.

```markdown
---
name: no-silent-data-drop
description: A filter, gate, continue, catch, or fallback on a path that routes user or model content into an output must hide empty things, never drop content. Wherever code can discard data, ask what happens to the non-matching data. Triggers when adding any filter, gate, or fallback to a rendering or export path, when parsing model output, and when two renderers must produce the same content. Does not fire on error-message wording or telemetry levels (honest-failure-surfacing) or on filters over data the user never receives. Ships as a Layer 1 norm; this description is deliberately narrow — the norm is the everyday trigger.
---
```

Rule core:
- Gates hide only empty things. Anything holding content still renders somewhere — a safe default bucket beats a drop.
- A JSON parse failure must never discard content silently: salvage what can be salvaged, log the stop reason, and surface the failure.
- Model-emitted enums, keys, and ids used for routing are untrusted input. Clamp to the canonical vocabulary where the value enters and again at render, defaulting unknowns to a visible bucket.
- When two renderers must agree, share the grouping function; hand-synced twins drift and the divergence masks the loss.
- Verify by inspecting the delivered artifact, and be suspicious of any test that asserts content is dropped.

Evidence: ASH LL 2026-06-04 (all entries), CLAUDE.md max_tokens truncation lesson; ICC L-008.

### 7. honest-failure-surfacing — norm + playbook

Three ASH field incidents where the surface lied about what failed, plus the storage-RLS
failure that stayed invisible for hours behind a swallowing sync loop.

```markdown
---
name: honest-failure-surfacing
description: Every distinct failure mode gets its own user-facing message; never collapse them into one reassuring string. A disabled control cannot explain itself — let it be pressed and have it say why. Reserve error-level telemetry for terminal states; recoverable retries log as warnings. Triggers when writing a catch block, an error message, a disabled control, a progress indicator, or choosing telemetry levels. Does not fire on content loss through filters (no-silent-data-drop) or on test skip semantics (prove-it-can-fail). Ships as a Layer 1 norm; this description is deliberately narrow — the norm is the everyday trigger.
---
```

Rule core:
- Classify failures (auth vs offline vs server) before wording the message; a wrong "No connection" costs hours in the field while the real cause is a 401.
- Per-item failures in a loop must surface to the user, not just to a log; a swallowed per-photo error plus a cosmetic progress bar reads as "working" forever.
- A permanently-failed item is surfaced as given up, not silently retried.
- Log self-healing retries at warning; if retries log at error, the terminal give-up drowns.

Evidence: ASH LL 2026-05-28, 2026-07-14 (offline), 2026-06-18; ASH CLAUDE.md storage-RLS
upsert lesson; ICC L-007 (shared evidence with guard-the-spend-paths).

### 8. env-change-verification

Cross-repo: an entire iOS track silently built against the wrong Supabase project; Railway
values stored as `KEY=value`; Netlify functions reading old values until redeploy.

```markdown
---
name: env-change-verification
description: An environment variable change is not live until the artifact that reads it is rebuilt, redeployed, or re-reads it — and a wrong-but-present value fails silently. Know for each variable whether it is baked at build time or read at request time. Triggers when adding or editing any env var, CI secret, or hosted config value, and when a CI or cloud build consumes build-time env. Does not fire on database schema changes (db-migration-verification) or on code-only changes with no config surface.
---
```

Rule core:
- CI and cloud builds never see `.env.local`. Diff the CI variable set against the canonical local env whenever build-time vars are involved.
- Validate the value, not its presence: the right project ref, no `KEY=` prefix pasted into a value field, a URL that parses.
- After editing, verify from the live surface (the endpoint, the built app), not the dashboard.
- Adding a secret can activate a previously-skipped CI job that needs more than that one secret.
- Module-load env reads crash the process on a missing var and make pure code un-importable in tests; prefer lazy initialisation of external clients. (The committee voted to keep this bullet here — R-33 rejected moving it; env-consumption timing is this skill's core.)

Evidence: ASH LL 2026-06-04 (night), 2026-05-27 (evening); ASH CLAUDE.md Railway section;
ICC L-018 + CLAUDE.md review-requests note.

### 9. findings-are-evidence — promoted by committee (R-36)

Ten incidents across two repos — above several sitting Tier 1 members. Canonical home of the
"a failure message is a symptom, not a diagnosis" rule (verified-citations cross-references
it rather than restating it).

```markdown
---
name: findings-are-evidence
description: A subagent, reviewer, or scout report is evidence, not findings — and so is your own first-hand defect analysis. Re-derive every Critical or High claim, everything touching a regulatory anchor, and the reasoning about the fix from the primary source before acting or writing it into a durable artifact. Triggers when consuming any agent or reviewer output and when recording a defect or fix analysis. Does not fire on low-severity suggestions with no gating or regulatory consequence — sample those rather than re-deriving them all.
---
```

Rule core: severity labels are hypotheses — refute a blocking claim against the installed
dependency's source before gating a merge on it; the brief handed to a verifier is itself a
claim; a reviewer's suggested correction can be wrong in the same direction; a convenience
tool that mirrors a first-party CLI must be diffed against the CLI before its output is
committed; a failure message is a symptom, not a diagnosis (canonical statement — this skill
owns it).

Evidence: PropOS nine-plus incidents (Sessions 12, 15, 16, 22, 35, 42, 43; 2026-07-07,
2026-07-20); ASH LL 2026-07-09 (crypto reviewer's "critical" refuted from auth-js source —
shared evidence with the committee-review upgrade).

### 10. enforce-invariants-in-build — promoted by committee (R-35)

Three-repo convergence: a rule asserted only in prose eventually gets violated, and the
violation looks official.

```markdown
---
name: enforce-invariants-in-build
description: A rule asserted only in prose — "single source of truth", "never auto-X", "these must match" — is a comment, not a control; if a violation can exist without failing the build, one eventually will and it will look official. Triggers when writing or encountering any comment, doc, or convention that asserts an invariant nothing enforces. Does not fire on deferral markers (flag-deferred-items) or on rules already carried by a test, constraint, or trigger.
---
```

Rule core: grep any file that declares its own authority (a "the ONLY place model names
appear" file had zero importers and pinned stale ids); a deliberate duplicate needs a
byte-identical test; a safety carve-out enforced only by the absence of a line regresses
silently — encode it as a named function plus a test asserting the unsafe state cannot occur;
a documented lesson recurred anyway — only a mechanical step prevents recurrence.

Evidence: ASH LL 2026-07-19, 2026-06-10 (lifts carve-out); PropOS Session 17 ("a lesson is
not a control"); ICC L-020 kernel ("a guarantee with no code behind it is a comment").

---

## Tier 2 — build next (10 skills)

### 11. lock-at-the-chokepoint

```markdown
---
name: lock-at-the-chokepoint
description: Serialise shared operations at the single module-level chokepoint every caller passes through, never in per-instance state — and cap fan-out there too. A check-then-act idempotency guard protects sequential retries but loses the race under concurrency. Triggers when adding a lock, in-flight guard, dedupe check, or rate cap where multiple callers, component instances, or loops can invoke the same shared operation, and when writing any internal retry or resume loop over a batch. Does not fire on recording the status of an external send — outbound-side-effect-idempotency owns send-then-record.
---
```

Rule core: per-hook and per-screen guards multiply with their instances (every photo analysed
twice, at doubled cost); a burst of unawaited calls blows provider rate limits — bound
concurrency at the one upstream chokepoint rather than trusting callers; retry loops skip
already-completed items, classify transient vs permanent, and give an unrecoverable item an
escape hatch so it cannot wedge the queue while being surfaced as given up.

Evidence: ASH LL 2026-06-04 (evening, later), 2026-05-27; ASH CLAUDE.md Opus rate-limit lesson.

### 12. parallel-work-recon

```markdown
---
name: parallel-work-recon
description: On any repo worked from multiple machines, sessions, or agents, your knowledge of its state is a snapshot with a short half-life. Run git fetch, gh pr list, and git log --all at session start AND again immediately before committing; claim sequential identifiers (migration numbers, versions) by scanning all refs including remote; keep one session per working copy; and whenever operating in a git worktree — including mid-session, and in any prompt handed to a subagent — use git -C exclusively and verify which checkout an edit actually landed in. Does not fire on single-machine single-session repos with no open branches, and not for probing non-repo state (live-state-first owns catalogs and deployed surfaces).
---
```

Rule core: the pre-commit re-run is the sharp edge — the session-start check is a snapshot,
not a lease; migration-number collisions are silent to git and routine under parallel work;
handovers go stale within a session — verify before rebuilding anything they call open. In a
worktree, a `cd` between calls silently lands elsewhere; audit the paths in an agent's report
to confirm which checkout it edited; a stale dev server serves the old tree. The
session-start half is also hook-shaped — see the SessionStart row in Layer 0 (must-spike).

Evidence: PropOS eight incidents (Sessions 26, 31, 33, 38, 45; 2026-07-16, 2026-07-19,
2026-05-22) plus five worktree incidents (Sessions 5, 6, 44; 2026-07-05, 2026-07-07).

### 13. mass-red-triage

```markdown
---
name: mass-red-triage
description: When a test suite goes from green to broadly red, classify before debugging. Find the first root failure (cascades multiply one fault), check for rate-limit walls, truncated runs, and environment defects, and bound the change's blast radius via the lockfile and diff before attributing blame. Triggers whenever a suite or CI run turns broadly red, or a run's failure count looks implausible in either direction. Does not fire on a single failing test or on suites already red for known, recorded reasons.
---
```

Rule core: "0 failed" beside an abnormal exit is not a pass; a rate-limit wall masks the one
real red — always re-run to completion; every spec failing in seconds at the same module line
is an environment defect, not many bugs; run the suite twice to split flake from regression;
one `console.error(skipReason)` beats reasoning in circles; a shared-state smoke fails on
whatever PR is in flight — update a lagging branch before judging its red.

Evidence: PropOS seven incidents (Sessions 29, 35, 37, 40, 42, 48, 49).

### 14. live-data-surgery

```markdown
---
name: live-data-surgery
description: Any ad-hoc destructive operation against a shared or production-adjacent database outside a test harness — bulk delete, cleanup sweep, re-baseline — follows a fixed protocol: read-only inventory first, BEGIN-ROLLBACK dry run, complement-count proof with NULL-collapsed predicates, a self-check that re-runs every predicate, confirmation the markers sit on disposable rows, and explicit gating of anything that resets tamper-evidence. Triggers on any DELETE, TRUNCATE, or bulk UPDATE aimed at shared or live data outside a test. Does not fire inside test harnesses (safe-smokes governs tests) or on throwaway local databases.
---
```

Rule core: walk the FK graph and return a result grid, not NOTICEs; a dry run still returns
the report rows; three-valued SQL makes complement counts lie unless NULLs are collapsed; the
sweep's self-check must re-run every seed predicate or it under-claims; "Smoke" can be the
demo data — check what a name actually holds before deleting by name; scripts default to
dry-run and require `--apply`. Sibling of safe-smokes: that skill governs tests; this governs
the one-off surgery (boundary sentence ratified — carry it into both SKILL.md files).

Evidence: PropOS six incidents (Sessions 12, 46, 53; 2026-07-02, 2026-07-06, 2026-07-20).

### 15. email-delivery-verification

```markdown
---
name: email-delivery-verification
description: A 2xx from a transactional email API means accepted, not delivered. Verify actual delivery in the provider's dashboard or webhooks, check the account-level suppression list, verify every recipient leg of a multi-recipient flow, and confirm a mailbox exists before pointing a send at it. Triggers when adding or changing any transactional email send or recipient address, and when diagnosing "the email never arrived". The provider-specific child of verify-the-effect. Does not fire on non-email side effects (outbound-side-effect-idempotency) or on the content of the email.
---
```

Rule core: one hard bounce can add the address to an account-level suppression list that
silently swallows every later send; corporate filters hard-block whole attachment classes
(.html) and reject the entire message — deliver links, attach only tolerated formats; check
the operator/BCC leg, not just the customer leg; a sandbox sender only reaches verified
addresses.

Evidence: ICC L-004, L-015; ASH CLAUDE.md DNS/Email lesson (Resend bounce) — three
occurrences across two repos (this family is the shared evidence behind verify-the-effect's
ICC citations).

### 16. guard-the-spend-paths

```markdown
---
name: guard-the-spend-paths
description: When creating or reviewing any endpoint or control that touches money or shared state, two rules apply together. Every endpoint that spends money (LLM, email, SMS, payment) or writes shared state (bookings, slots) gets a per-IP volume cap the day it is created — anyone can POST directly, bypassing the UI. And any guardrail on that path written to fail open (origin allowlist defaulting to permit, auth that skips on a missing header) is inert until explicitly closed, and its failure is silent — name the real primary defence. Does not fire on internal-only endpoints behind service-role auth with no paid upstream; internal fan-out caps belong to lock-at-the-chokepoint.
---
```

Rule core: rate-limiting is volume protection layered under auth and validation, not a
substitute for either; for every fail-open control, name the real primary defence, close the
control before launch, and route its failures to logs or alerts because the UI will look
healthy while it is inert.

Evidence: ICC L-001, L-006, L-007 (L-007 shared evidence with honest-failure-surfacing).

### 17. outbound-side-effect-idempotency

```markdown
---
name: outbound-side-effect-idempotency
description: Code that performs an external side effect (email, SMS, payment, webhook) and then records its status must choose which failure harms the recipient less — lost or duplicated — and design for that. A read-then-write "already sent?" check is not a lock. Triggers when writing any send-then-record path or adding retry logic around an external send. Does not fire on internal batch retry loops with no external recipient — lock-at-the-chokepoint owns those.
---
```

Rule core: mark sent only after the provider's 2xx (fail closed, never lose it); true
at-most-once needs a claim state transition (a `sending` row or a unique constraint), because
a pre-check races under concurrency; when the two goals conflict, make the residual failure
case detectable even if it cannot yet be eliminated.

Evidence: ICC L-021 + reviewRequest fail-closed pattern; ASH check-then-act race (2026-06-04
evening — shared evidence with lock-at-the-chokepoint) is the same mechanism on an internal path.

### 18. substantiate-outward-claims

```markdown
---
name: substantiate-outward-claims
description: Any certification, award, statistic, or third-party performance claim shown to a customer needs a primary or independent source, or explicit attribution ("the manufacturer states…") — never asserted as fact, and never trusted from an AI summary, which blends marketing with real product names. Triggers when writing customer-facing copy, marketing pages, or an assistant's knowledge base entries that assert such claims. Does not fire on internal docs citing code or history — verified-citations owns those.
---
```

Rule core: an in-house assessment ("safe for wool") is not an independent certification
("WoolSafe approved"); a number with no traceable methodology is fabricated until shown
otherwise — chase the vendor's own documentation, not the SEO folklore; label claims
well-evidenced, weakly evidenced, or myth.

Evidence: ICC L-009 (with two addenda); this repo's LESSONS_LEARNED.md lesson 4 (vendor
documentation vs folklore).

### 19. deliverable-integrity

Consolidates the three field lessons from this skills repo's own LESSONS_LEARNED.md into one
skill for generated documents. Description compressed per R-31.

```markdown
---
name: deliverable-integrity
description: Three gates for AI-rewritten claims, owner-only facts, and machine-parsed output in any generated document. Claims: diff an AI rewrite claim by claim against the source — the original wins unless the owner confirms. Gaps: facts the generator does not hold render as loud allowlisted placeholder tokens, never plausible guesses. Parsing: re-extract the document's text and assert required strings present, banned glyphs absent. Does not fire on code citations in engineering docs (verified-citations) or on style-level AI-tell removal (unslop-text).
---
```

Rule core: rendering and parsing are different code paths — what Notepad shows after
select-all-copy is what the parser sees; claim drift, not style drift, is the dangerous AI
rewrite failure; a deliverable that cannot be completed honestly should be impossible to ship
accidentally (gate the build on the token allowlist); a contradiction in supplied facts holds
the slot open rather than picking a side.

Evidence: this repo's LESSONS_LEARNED.md lessons 1, 2, and 5.

### 20. server-side-authority — added by committee (R-37a, adopted 2-1; dissent recorded in the review record)

One narrow skill, not four, per the dissent's design constraint. Sourced from the ASH
independent audit's transferable security findings, including a live-exploited role
escalation ("the most urgent single change") and an IDOR pattern that recurs cross-repo.

```markdown
---
name: server-side-authority
description: Four server-side authority rules for any client-facing backend. Never trust a client-supplied storage path or object id — derive it server-side from the row the caller owns. An RLS self-update policy must scope columns, not just rows, or a user can promote their own role. Every exposed table gets RLS enabled or its grants revoked — a code comment is not a control. Escape all dynamic output in admin surfaces. Triggers when adding or reviewing a route that accepts client-supplied paths/ids, an RLS self-update policy, a new public-schema table, or an admin dashboard render. Does not fire on general security review (the security-review command) or client-side validation UX.
---
```

Evidence: ASH CLAUDE.md independent-audit section (role-escalation via unscoped
users_update_own; api_usage_log RLS off; analyse-photo IDOR; admin stored-XSS); ICC L-003
(inert-text rendering, the same output-escaping class).

---

## Tier 3 — micro-skills (4)

Each is one crisp rule with a clean trigger; write when convenient.

### 21. reproduce-the-real-build

```markdown
---
name: reproduce-the-real-build
description: Before pushing anything a CI or release pipeline will compile, run the exact production build command locally — the test runner tolerates syntax and dependency drift the release build rejects. Prove any toolchain fix by reconstructing from tracked manifests alone (npm ci into a clean directory): a fix proven only on the machine that produced it has not been proven. Triggers before pushing build-config, lockfile, or toolchain changes, and when tests pass but deployment builds fail. Does not fire on test-only changes no release pipeline compiles.
---
```

Evidence: ASH CLAUDE.md tsc/ESM Docker lesson; ASH LL 2026-07-19 (Capacitor/AGP lockfile drift).

### 22. date-parse-utc-safe

```markdown
---
name: date-parse-utc-safe
description: In a UTC server or serverless runtime, new Date("YYYY-MM-DD") is UTC midnight and renders as the previous day in western timezones. Parse date-only strings into explicit local components (new Date(y, m-1, d)) anywhere a date becomes a display string or a day-of-week. Triggers when parsing a date-only string server-side or computing a printed day from one. Does not fire on full ISO timestamps carrying explicit timezones.
---
```

Evidence: ICC L-005.

### 23. constant-time-secret-compare

```markdown
---
name: constant-time-secret-compare
description: Compare bearer tokens, API secrets, signatures, and password-equivalents with a constant-time comparison (hash both sides, then crypto.timingSafeEqual) — never == or short-circuiting string equality. Triggers when writing any code that checks a secret against a stored or expected value. Does not fire on comparing non-secret identifiers.
---
```

Evidence: ICC CLAUDE.md known-issues (admin token compare).

### 24. dependency-upgrade-verification

```markdown
---
name: dependency-upgrade-verification
description: When a dependency major-bump could silently change on-disk formats or behaviour and runtime data cannot distinguish success from failure, answer the question from the dependency's own source: npm pack both versions and diff the file that decides the behaviour, offline, before hunting for a device repro. Triggers on major version bumps of storage, crypto, or serialisation dependencies. Does not fire on minor or patch bumps, or majors with no storage/serialisation surface.
---
```

Evidence: ASH LL 2026-07-20 (SQLite plugin 6→8 tarball diff).

---

## Upgrades to existing skills

Lessons that belong inside a skill already in the library. Each bullet is a concrete addition.

### db-migration-verification (the largest bundle — from all three repos)

- A migration adding a foreign key must grep every `.select()` embed of the now-doubly-referenced table and pin `!fk_column`. Include queries introduced by concurrently-merged branches, not just files the hotfix touched. (ASH 2026-05-27, bit twice — shared evidence with blast-radius-grep.)
- A feature flag gates code, not schema: the migration is live on apply regardless of the flag. Follow any migration with one real end-to-end run of the highest-value path. (ASH 2026-05-27.)
- Before any `CREATE OR REPLACE` (or editing any DB object), dump the live definition (`pg_get_functiondef`, catalog views) and diff the replacement against it — the earliest migration file is not the live object, and a replacement is live on apply. (ASH 2026-07-10; PropOS 2026-07-01, Session 38 — shared evidence with live-state-first.)
- Out-of-band applies (management API, SQL editor) bypass migration history: use idempotent SQL and reconcile history afterwards (`migration repair --status applied`). (ICC L-019.)
- A multi-statement SQL tool shows only the last statement's result; run load-bearing verification queries individually. (ASH 2026-05-25 — shared evidence with live-state-first.)
- Any storage or table written with upsert needs an UPDATE policy, not just INSERT — test the re-run path, not just the first write. (ASH CLAUDE.md 2026-05-20.)
- Claim migration numbers by scanning all refs including remote at merge time; parallel sessions collide silently. (PropOS Sessions 31, 33 — shared evidence with parallel-work-recon.)
- Verify the delta, not the regression grid: a clean apply plus green regressions does not prove the new deltas landed — read each delta from the catalog; where live data cannot exercise the change, a Docker dry-run with negative controls is the gate, run pre-apply. (PropOS Sessions 16, 21, 39.)
- Any "re-issued verbatim / same body plus one line" migration gets a mechanical normalised diff or checksum fidelity gate; never retype a regulated body. (PropOS Sessions 20, 26, 30; 2026-07-14, 2026-07-20.)
- Read back privileges after every CREATE: platform default grants re-open new functions and views, and `REVOKE FROM PUBLIC` does not strip named role grants — prove with `has_function_privilege` / `role_table_grants`. (PropOS Sessions 36, 51, 52, 56 — a live escalation hole the fourth time.)
- Verification queries double as units and semantics checks: eyeball real values, they catch the 100x money bug types cannot. (PropOS Session 12.)
- Trap checklist: unset-GUC `current_setting` NULLs kill combined booleans; a BEFORE-UPDATE gate leaves the INSERT vector open; triggers on trigger-maintained columns need `pg_trigger_depth()`; self-referential deletes need a fixpoint loop. (PropOS Sessions 4, 18, 20, 29, 30.)
- Phased rollout for RLS-axis / JWT-claim changes: register the hook, force re-login, decode a fresh token, and only then flip RLS; a nullable RLS-axis column is a latent lockout. (ASH/PropOS 2026-05-31.)

### safe-smokes

Note (R-25 amendment): safe-smokes keeps its own direct trigger — its existing description is
among the library's best. The prove-it-can-fail hub adds a route to it; subordination never
narrows the leaf's own trigger.

- A `.delete()` under RLS returns success with zero rows: assert teardown row counts; use service-role teardown for no-DELETE tables, and never "fix" the no-op by adding a DELETE policy to an audit table. When one instance is found, grep the whole tree for the verb-on-table — the same bug sat in 12 files. (PropOS six incidents.)
- Never assert a global or firm-wide exact count on a shared DB: floor globals, exact-match only rows the test owns; a read-only money smoke needs a stability gate. (PropOS Sessions 40, 51.)
- Converting a smoke to throwaway-fixture isolation is not mechanical: check how each written table is made append-only (RLS-deny is teardown-able by service role; a trigger is not), what gates a fresh fixture trips, FK-ordered teardown, and self-cleaning on partial seed failure. (PropOS Sessions 47, 48, 50, 54, 56.)
- When a test exploits a gap to build fixtures, that gap is a security finding, not a convenience. (PropOS Session 35.)
- Prove zero residue with a prefix-scoped post-run count. (PropOS Session 53.)

### ai-surface-discipline

- Output contract for JSON-carrying prompts: size max_tokens generously for prose-carrying JSON, never let a parse failure drop content silently (salvage + log stop_reason), and verify completeness of the output rather than trusting that it generated. (ASH 2026-05-21; ICC L-008.)
- Model-emitted enums, keys, and ids used for routing are untrusted: clamp to the canonical set at every boundary. (ASH 2026-06-04 — shared evidence with no-silent-data-drop.)
- Normalise response shape at the server boundary: never assume `content[0].text` is the whole reply once tools, citations, or multi-block output exist. (ICC L-014.)
- Minimisation is enforced, not asserted: "only field X crosses the boundary" means nothing if X is free text the model or user populates — scrub or constrain at the boundary. (ICC L-020.)
- Render untrusted model or customer content as inert text (DOM text nodes or escaping helper, never innerHTML); sanitise link schemes. (ICC L-003, L-014; ASH audit stored-XSS finding — shared evidence with server-side-authority.)
- A PII output guard must not retain what it rejects: log the class of the match, never the matched value. (PropOS Session 18.)
- Borrowed guards recalibrate: a denylist copied from a sibling surface is calibrated for its input shape — re-test on yours. (PropOS 2026-07-11.)
- A guard over an existing matcher derives its looseness from that matcher; a capped whole-table read inside a guard is a correctness hole, not a perf issue. (PropOS 2026-07-14.)
- Statutory or compliance-critical linkage belongs in the data layer (a trigger), never only in an optional AI call path. (PropOS 2026-07-14.)
- Provider payload caps are input discipline too: know the per-image and per-message caps and resize or validate before sending. (ASH CLAUDE.md image sizing.)
- Golden-thread (restored per R-34): before concluding a human-review control is unused, establish every place it could be exercised — the real review may happen downstream of your metric (in Word, after the DOCX is built); when the authoritative artifact is edited downstream of the system's write, either bring the edit back before the write or explicitly decide the exported document is the record. (ASH 2026-07-20.)
- New pillar candidate — rules bind only in the system prompt: behavioural rules, prohibitions, and tone go in the system prompt (stated to override reference and user input); facts go in retrievable, citeable documents. A rule placed in a citeable document is quotable, not obeyed, and can leak to the user as if it were a fact. Pin the split with a test. (ICC L-016, L-020. Alternative: standalone skill `guardrails-in-the-prompt` if this pillar makes the skill too broad.)

### verified-citations

- Extend beyond code and history to statutory, legal, and domain facts: verify Act, year, and Part against the primary source (legislation.gov.uk); inclusive day-counting ("beginning with the day X"); data that encodes a real-world obligation (statutory frequencies, legal bases) is verified against primary sources and the source cited in the artifact — model memory produced two confident wrong "facts" headed for a statutory register. (PropOS 2026-07-07, Session 58; ASH 2026-05-31.)
- A specialist reviewer contradicting the brief on law earns a primary-source check, not an override — the brief itself is a claim. (PropOS 2026-07-07.)
- Single-homing (R-36): the "a failure message is a symptom, not a diagnosis" rule now lives canonically in findings-are-evidence; this skill cross-references it rather than restating it.

### confirm-before-push

- Extend the gate to remote branch deletion, with a mechanical preflight: `gh pr list --head <branch> --state all`, `gh pr list --base <branch>`, and `git log main..<branch>` before any delete or `--delete-branch` merge. Deleting a branch an open PR points at closes the PR unrecoverably; in a squash-merge repo "merged" is a PR fact, never an ancestry fact, so judge a stale branch by the diff it would apply to main today. Redundancy means content-on-main AND no open PR — never a name or someone's say-so. (PropOS Session 6, 2026-07-19, 2026-07-21 — real damage twice.)
- Diff a branch with `git diff $(git merge-base main branch) branch`, not `main..branch` — the symmetric diff misleads for branches forked before a main-side hotfix; after merging onto a hotfixed base, grep the queries the branch introduced. (ASH 2026-05-27 evening.)
- `gh pr merge` from a worktree can error locally while the remote merge succeeded: verify with `gh pr view --json state,mergedAt`, sync main separately. (PropOS Sessions 7, 10, 27.)

### flag-deferred-items

- Expected-breakage tests carry the anchor in `.fixme()`, never `.skip()` or deletion. (PropOS Session 5.)
- `grep -rn "FORWARD(<milestone>)"` is the milestone-scoping checklist; the predecessor migration's header records the contract a handover summarised away. (PropOS Session 24.)
- A dormant control (a gate that bites nothing yet) states its dormancy in the migration, the smoke, the decision log, and to the user. (PropOS Session 57.)

### plan-first

- Plan step zero is a grep: does the thing about to be designed already exist? A schema grep killed a full migration; a planned Edge Function was already-live RLS. (PropOS Sessions 8, 9, 56.)
- When an estimate exceeds a session, propose two or three concrete split strategies, not "should I split?". (PropOS Session 10.)
- When implementation reveals the spec's premise is shaky, stop and put the fork to the user; do not silently build around it. (PropOS Sessions 15, 43, 44.)

### handover

- A session that makes a prior handover's section stale stamps that section superseded in the same PR. (PropOS 2026-07-16.)
- Carry-forward items must cite a live-state verification or be marked unverified — a "still open" item rode four handovers a month after it was done. (PropOS 2026-07-08.)

### committee-review

- A reviewer's severity label is a hypothesis: before gating a merge on a Critical/Blocker, refute it against the installed dependency's actual source. A wrong exploit can still sit on a real smell — fix what is real, drop the inflated severity. (ASH 2026-07-09 — shared evidence with findings-are-evidence, which owns the general rule.)
- Diverse lenses beat N identical reviewers: two reviewers with distinct lenses independently found different real blockers; convergence on the same defect is the signal it is real. Run reviewers pre-apply for append-only writes. (PropOS Sessions 15, 16, 39.)

### skill-library-builder

- A lesson is not a control: skills must encode mechanical steps (grep this, run that), not awareness — a documented trap recurred anyway until the procedure was fixed mechanically. (PropOS Session 17.)

### unslop-text

- The banned-character grep gate applies to every generated deliverable in scope — and scope is set per project by convention, not by an outward/internal split: the mined incidents bit on internal test headers and code comments (PropOS Sessions 14, 16, 18), so each project's CLAUDE.md states which artifact classes its gate covers. "Write carefully" failed three times where a grep would not have. (R-39, adopted with the adversarial amendment.)

### Hub conversions (R-25): description and routing-table edits for existing skills

The Layer 2 architecture makes several existing skills hubs. Their upgrade work therefore
includes, beyond the bullets above: a short if-then routing table in the body, and a
description touch-up where hub duty changes the trigger surface. Applies to: plan-first
(routes to blast-radius-grep, enforce-invariants-in-build, flag-deferred-items),
db-migration-verification (routes to live-data-surgery, blast-radius-grep),
ai-surface-discipline (routes to no-silent-data-drop, guard-the-spend-paths,
outbound-side-effect-idempotency), verified-citations (routes to deliverable-integrity,
substantiate-outward-claims, handover), prove-it-can-fail (routes to safe-smokes,
mass-red-triage), one-real-ride (routes to verify-the-effect's playbook,
email-delivery-verification, env-change-verification, reproduce-the-real-build). Adding a
leaf later updates its hub's routing table in the same commit.

---

## Folded and rejected

Candidates proposed by a reviewer and merged elsewhere:

- `fix-all-occurrences` (ICC) → folded into blast-radius-grep (the fact variant of the same rule).
- `keep-duplicated-facts-honest` (ASH) → folded into blast-radius-grep (denormalisation trigger nouns now in its description per R-30).
- `close-fail-open-guardrails` (ICC) → folded into guard-the-spend-paths.
- `resumable-loops` (ASH) → folded into lock-at-the-chokepoint.
- `scope-test-assertions` (ASH) → folded into prove-it-can-fail.
- `worktree-path-discipline` (PropOS) → folded into parallel-work-recon (mid-session worktree moment now in its description per R-30).
- `guardrails-in-the-prompt` (ICC) → recommended as a new ai-surface-discipline pillar; standalone if that skill gets too broad.
- `branch-deletion-preflight` (PropOS) → confirm-before-push extension plus Layer 0 hook (dual coverage, R-04); it is NOT a Layer 3 leaf — an earlier draft listed it in both places; the census is corrected.
- `redeploy-after-env-change` (ICC) → folded into env-change-verification.
- `machine-consumable-docs`, `claim-drift-diff`, `loud-placeholders` (this repo's field notes) → consolidated into deliverable-integrity.
- `mcp-mirror-tools-are-not-the-cli` (PropOS) → folded into findings-are-evidence.
- `fail-fast-pipeline-hides-the-queue` (PropOS) → folded into prove-it-can-fail (watch the whole run go green). Recorded per R-34.
- GitHub Actions payload-replay mechanics (PropOS 2026-07-20) → folded into prove-it-can-fail as a mechanics note. Recorded per R-34.
- `test-every-mutation-shape` (PropOS Session 12) → folded into prove-it-can-fail. Recorded per R-34.
- `db-row-before-external-blob` (PropOS Session 12) → noted as ordering guidance; single incident, revisit if it recurs. Recorded per R-34.
- `surface-your-own-damage-immediately` (PropOS Session 8) → conduct norm already covered by standing behaviour rules, not a code guardrail. Recorded per R-34.
- ICC WCAG contrast sub-lesson (L-010) → candidate unslop-ui accessibility addendum; the palette itself is project-bound. Recorded per R-34.
- ASH security-audit rules → now built as the Tier 2 server-side-authority skill (R-37a); the remaining audit items (backup automation, third-country transfers, seed-data hygiene) stay project-side.
- REJECTED by committee (R-33): moving the lazy-initialisation bullet out of env-change-verification — the bullet stays; env-consumption timing is that skill's core. Chair dissent recorded in the review record.

Considered and left project-specific (full lists in each reviewer's section-C output, retained
in the session transcripts): Capacitor/Gradle/WebView mechanics, Apple/Codemagic signing,
docx/weather/DNS vendor APIs, Supabase platform internals, Netlify plan mechanics, Windows/
OneDrive environment repair, pgTAP argument order, domain statutes (the habits were extracted;
the statutes stay project-side).

## Passed controls (R-38 — lessons that validate existing skills as-is)

Recorded so future reviews do not re-flag settled ground:

- PropOS 2026-07-02 (provenance drift with clean technical facts, five instances) is the
  exact failure mode verified-citations was written against — the entry validates the skill.
- This repo's LESSONS_LEARNED lesson 3 (lexical scanners pass structural slop) validates
  unslop-text's own scanner-is-a-floor guidance on contact.
- PropOS Sessions 7, 10, 27: the gh-merge-from-worktree recipe "held exactly" across three
  uses — the documented mechanics are correct as written.

---

## Library-management notes

- Counts: 14 existing skills; 24 proposed new (10 + 10 + 4); upgrade bundles for 11 of the existing 14 plus routing-table additions for the hub conversions.
- Sprawl risk is real: skills trigger on their descriptions, and ~38 competing descriptions would dilute matching. If building a subset, build Tier 1 first and watch which descriptions fire. If building all of them, use the orchestration architecture below.
- Coverage: the Tier 1 set plus the db-migration-verification and safe-smokes upgrade bundles cover the majority of recurrences counted across the four corpora (independent recounts during the committee review landed at roughly 55% and 60%; the exact figure depends on the counting rule for shared evidence).
- Naming keeps to the library's convention: kebab-case verb-first imperatives naming the behaviour, not the incident.
- Writing-phase gate (R-29): every SKILL.md written from these stubs must carry its "does not fire on" line — all 24 stubs above now have one; keep them through drafting.
- Build order (R-28): decoupled from evidence tiers. Sequence: (1) spike the harness mechanics (below); (2) hooks that pass their spike — the cheapest verified deterministic wins; (3) NORMS.md + the global CLAUDE.md norm block; (4) hub skills and hub conversions of existing skills; (5) leaves; (6) the hooks doc for per-machine installation. A Tier 2 skill that is a hub builds before a Tier 1 leaf.
- Next steps once the shortlist is approved: write each SKILL.md in this repo, one commit per skill, then a README table update; nothing here has been committed or pushed.

---

## Orchestration architecture — building all of them without dilution

Added 2026-07-23 after the question "can we give global skills a tier, weight or rating
system?"; amended the same day by committee review. The honest mechanics first: Claude Code
has no native weight, tier, or priority field for skills. The name-plus-description listing
is the only ranking signal the model sees, and unknown frontmatter keys are ignored
(believed-unverified — see the verification-status block below). So a tier system has to be
built from the mechanisms that do exist: hooks (deterministic), the global CLAUDE.md (always
in context), description-triggered skills, and skill-to-skill chaining (a skill body can
instruct loading another skill by name). Weight is which layer a rule lives in, and promotion
or demotion between layers is the rating system acting on evidence.

Working hypothesis (R-10): what actually dilutes is not the raw count of skills; it is the
number of broad, overlapping descriptions competing for the same task vocabulary. Narrow
leaves with orthogonal vocabulary barely compete. This is the architecture's load-bearing
assumption — plausible, consistent with observed behaviour, but not a verified harness fact;
the fire-log will test it. The architecture pushes rules that must always hold out of the
description-matching game entirely, consolidates the workflow-moment rules into a few hubs
with disjoint triggers, and lets genuinely narrow skills stay narrow.

### Mechanics verification status (R-15) — spiked 2026-07-23 against code.claude.com/docs

| Claim | Status |
|---|---|
| No native tier/weight frontmatter field | VERIFIED — the frontmatter reference enumerates name, description, disable-model-invocation, user-invocable, allowed-tools, disallowed-tools, arguments, context/agent; no priority field exists. Malformed YAML loads the body with empty metadata. |
| A PreToolUse hook can match shell commands (git push etc.) | VERIFIED — matchers match tool names; hook scripts receive tool_input JSON (the command string) on stdin; an `if` field accepts permission-rule syntax like `Bash(git push*)`; blocking via exit code 2 or `permissionDecision: "deny"/"ask"`. |
| A PostToolUse hook can observe Skill-tool invocations (the fire log) | VERIFIED — PostToolUse matchers match any tool by name, including `Skill`. |
| A SessionStart hook event exists for the recon row | VERIFIED — SessionStart fires on start/resume/clear/compact and can return `additionalContext`, so the recon results can be injected directly into the session's context. |
| Hub-to-leaf chaining (a skill body instructing a named Skill load) | Mechanism VERIFIED (the Skill tool loads skills programmatically; an invoked skill's content persists for the session). Whether the model reliably follows a routing instruction is behavioural — monitor via the fire log. |
| Norm + playbook narrowing (R-17) | VERIFIED as the right mechanism — `disable-model-invocation: true` would remove the description from context but also blocks Claude loading the skill (breaking hub routes); keeping skills model-invocable with narrowed descriptions is the correct shape. |

### Layer 0 — hooks: deterministic, zero dilution

Rules that must never depend on model discretion become settings.json hooks. Each rule moved
here leaves the attention competition entirely. This is the library's own lesson applied to
itself: a lesson is not a control — a hook is a control, a description is a hope.

| Rule | Hook | Failure mode (R-21) |
|---|---|---|
| confirm-before-push (incl. branch deletion) | PreToolUse on shell commands matching `git push` / `gh pr merge` / branch deletion — prompt for confirmation | fail-closed (this is the one blocking gate) |
| lint-after-edit | PostToolUse on Edit/Write to `*.ts/tsx/js/jsx` — run the linter, report | fail-open, warn-and-log |
| live-data-surgery backstop | PreToolUse flagging `DELETE FROM` / `TRUNCATE` / `DROP TABLE` in shell or SQL-runner commands — warn before execution | fail-open, warn-and-log |
| banned-character gate | Pre-commit or PostToolUse grep on the artifact classes the project's convention names (R-39: per-project scope — the mined incidents bit on internal test headers, so no global outward/internal split) | fail-open, warn-and-log |
| parallel-work-recon, session-start half | SessionStart hook running fetch + pr list + log --all (R-22; must-spike) | fail-open, warn-and-log |

Hook design constraints (R-21): each hook declares fail-open or fail-closed; the default is
warn-and-log, and only the push gate blocks — an over-firing blocking hook trains bypass
habits, which is the failure the fail-open-guardrail lessons document from the other side.
Every hook failure is logged so an inert hook is visible.

The skill files stay as the policy documents the hooks point at; the hook is the enforcement.
Hook configuration is per-machine (settings.json is not in this repo), so record the hook
definitions in a `hooks/` doc here and install them on each machine.

### Layer 1 — always-on norms: the global ~/.claude/CLAUDE.md

The cross-cutting judgement rules are not workflow skills; they should bias every turn. Each
gets one line in the global CLAUDE.md plus a pointer to the full skill, so firing never
depends on description matching.

Canonical home and drift control (R-20): the norm block lives in this repo as NORMS.md; the
global CLAUDE.md section is copied from it verbatim; the review loop includes a drift check
between the two. The library obeys its own duplicated-fact rule.

Cap and demotion (R-19): at most six day-one norms, and the ladder runs in both directions —
a norm that never bites demotes to a hub bullet; a norm that keeps being violated promotes to
a hook where mechanisable. Day-one norms:

- verify-the-effect — never report success from a proxy signal; assert the artifact
- live-state-first — probe live state before building from any described state
- no-silent-data-drop — gates hide empty things, never drop content
- honest-failure-surfacing — one message per failure mode; error level for terminal states only
- prove-it-can-fail — a check that cannot go red is not a check
- findings-are-evidence — reviewer and agent claims are re-derived before acted on

Norm + playbook shape (R-17): the four broadest of these (verify-the-effect,
live-state-first, no-silent-data-drop, honest-failure-surfacing) keep full SKILL.md playbooks,
but their descriptions are deliberately narrowed to routing and name-invocation duty (see
their Tier 1 stubs). The norm line is the everyday trigger; the narrowed description stops
them competing in the listing. This narrowing is also what makes the dilution-reduction claim
below true rather than aspirational (R-14).

### Layer 2 — lifecycle hubs: five to seven fat, disjoint triggers

Most of the library maps onto workflow moments that are naturally mutually exclusive, so hub
descriptions do not compete with each other. Each hub carries its own compact rules plus a
routing table of leaves to load by name when the specifics apply.

| Hub (skill) | Moment | Routes to |
|---|---|---|
| parallel-work-recon | session start; before commit/merge | (self-contained) |
| plan-first (existing) | before non-trivial code | blast-radius-grep, enforce-invariants-in-build, flag-deferred-items |
| prove-it-can-fail | writing tests/checks/gates | safe-smokes, mass-red-triage |
| db-migration-verification (existing) | any schema/RLS/trigger work | live-data-surgery, blast-radius-grep |
| ai-surface-discipline (existing) | building any send-to-LLM path | no-silent-data-drop, guard-the-spend-paths, outbound-side-effect-idempotency |
| one-real-ride | declaring work done/shipped | verify-the-effect, email-delivery-verification, env-change-verification, reproduce-the-real-build |
| verified-citations (existing) | writing docs that cite | deliverable-integrity, substantiate-outward-claims, handover |

(R-27: the done-gate hub is one-real-ride; the earlier "definition-of-done" alias is deleted.
R-25: a route is not a demotion — routed leaves like safe-smokes keep their own direct
triggers. Adding a leaf later updates its hub's routing table in the same commit, and the
review loop includes an orphan-leaf check: a leaf reachable from no hub whose own description
never fires is dead weight.)

Chaining is behavioural, not mechanical: the hub's body says "if this change touches
transactional email, load email-delivery-verification before proceeding". This has worked in
this library's use but is on the must-spike list above — one success is not verification.

### Layer 3 — narrow leaves: safe at any count, within a budget

date-parse-utc-safe, constant-time-secret-compare, dependency-upgrade-verification,
lock-at-the-chokepoint and similar have orthogonal vocabulary — "timingSafeEqual" does not
compete with "migration" — so they add near-zero matching dilution. Discipline that keeps
them safe:

- Discriminating nouns in the first sentence of the description.
- An explicit "does not fire on…" line in every leaf description (now present in all 24 stubs; a gate on the writing phase, R-29).
- No two leaves sharing their primary trigger vocabulary; if they start to, merge them or move one behind a hub route only.
- Soft cap ~60 words per leaf description, and the always-in-context token cost of the full listing (roughly 2-4k tokens at draft lengths) is a stated criterion in build/don't-build decisions for Tier 2 and 3 (R-26).

### The rating system: measured, not declared

A tier assigned by intuition drifts. Make promotion and demotion evidence-driven — but sized
for a solo maintainer (R-24), and only after the fire-log spike (R-15):

1. **Fire log** (post-spike). A PostToolUse hook on the Skill tool appends skill name,
   timestamp, and project to a log file. Passive, zero effort.
2. **Misses, logged at the source.** Every new LESSONS_LEARNED entry (any repo) ends with one
   line: "skill that should have prevented this: X / none — new candidate". The scorecard
   cross-reference becomes a grep. No separate bookkeeping.
3. **Event-driven prune, not calendar-driven.** The tier review runs when a new skill is
   added (or at most quarterly): zero fires AND zero misses over the period → demote to a hub
   bullet or retire; a hub bullet that keeps biting → promote to a leaf; a leaf that keeps
   biting → promote its one-liner to Layer 1; a Layer 1 norm violated anyway → promote to a
   hook where mechanisable.
4. **Exemptions (R-23):** norm-backed and hub-routed skills log few direct fires by design —
   "fire" includes being loaded via a hub route, and Layer 1-backed skills are judged by
   misses, not fires. Rare-event high-consequence leaves (constant-time-secret-compare,
   live-data-surgery) are exempt from zero-fires demotion: they retire only by being absorbed
   into a hub or hook, never for infrequency alone.
5. **Record tier in two visible places:** a Tier column in the README table, and the layer
   stated in each SKILL.md body (not frontmatter — the harness ignores custom keys per the
   verification-status table, so the README and the body are where humans and reviews read it).

"Incidents prevented" was dropped as a metric: it has no observable.

### Per-project re-weighting

A project's own CLAUDE.md names the load-bearing subset for that repo ("this repo's critical
skills: db-migration-verification, safe-smokes, ai-surface-discipline"). That locally boosts
the skills that matter most for that codebase without touching the global library, and it is
the right home for project-specific trigger vocabulary (table names, provider names) that a
global description should not carry — and for the banned-character gate's per-project scope
(R-39).

### Net effect on the numbers (corrected per R-13/R-14)

Of the 38 (14 existing + 24 proposed): five rules gain hook rows (one must-spike), six get
always-on norm lines, seven act as hubs, and the rest sit as narrow leaves. All 38
descriptions remain in the listing — the reduction in competition comes from the R-17
narrowing of the norm-backed skills' descriptions, the leaf boundary discipline, and the
disjoint hub moments. The "roughly a dozen broad descriptions in genuine competition" figure
is therefore a design target, achieved only if the narrowing ships; it is not a property of
the layer assignment alone. Coverage of mined recurrences by Tier 1 plus the two big upgrade
bundles: a majority (independent recounts ~55% and ~60%, sensitive to the shared-evidence
counting rule).
