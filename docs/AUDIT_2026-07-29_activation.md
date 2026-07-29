# Activation audit - 2026-07-29

A record of the skills-library activation audit run today: what two written assessments
claimed, which of their claims survived primary-source verification, what the library's own
working instrument shows instead, a triggerability verdict on all 55 authored entries, the
seven commits that came out of it, and the decisions taken, rejected, and deferred.

Written as the worked example the README points at: how the fire log was read wrong, and
then read right. Every file, commit, and quotation below was verified by reading the file or
running `git log`/`git show` in `/tmp/cs` or `/workspace/PropOS` before it was written down.
Anything that could not be verified is marked "(unverified)" rather than dropped or asserted.

## 1. What the review was asked

Two written assessments of the maintainer's working practice produced findings to act on.
Their headline was **the activation gap**: `FIRE_LOG.jsonl` recording roughly 15 skill
invocations across six days against a library of 62 entries. A library built from four
lessons corpora, apparently dormant.

The sharpest single piece of evidence offered for it was a claim about PropOS PR #242: that
it shipped a client-money guard whose only test sat in a schedule-only, `continue-on-error`
Playwright project, seven days after a lesson taught exactly that failure. If true, that is
the strongest form of the argument. A lesson was written, a skill existed, and the same
mistake shipped anyway within the week.

Both halves of the headline are wrong. Neither is wrong in a way that makes the underlying
question go away.

## 2. The two corrections that reframe it

### (a) PR #242 did not ship with that defect

`git -C /workspace/PropOS show 28c4e97 --no-patch` is a squash of two commits. The first is
the fix. The second is titled:

> test(reconciliation): gated unit coverage for the raw_data shape guard

and it diagnoses, in its own words, precisely the defect the assessment says shipped:

> The guard added by this PR had no coverage that could block a regression.
>
> `financial-reconciliation.spec.ts` is not in playwright.config.ts's DB_ONLY_SPECS, so it
> runs under the `smoke` (UI) project. That project runs only in the `smoke-ui` job, which
> is schedule-only and continue-on-error, so it can never fail a PR. The required gate is
> "Playwright smokes (db)", which never executes that spec at all. So this PR's smokes would
> have gone green without once exercising the classifier.

The remedy is in the same commit:

> `npm run test:unit` runs inside the REQUIRED "Lint, type-check, build, audit" job, so
> pinning the contract here is what makes it gated.

Verified independently: `/workspace/PropOS/app/src/lib/reconciliation/statementShape.test.ts`
exists, and `/workspace/PropOS/.github/workflows/ci.yml` line 25 names the job
`Lint, type-check, build, audit`, with `- name: Unit tests` running `npm run test:unit`
inside it. The commit also proves the tests can fail rather than merely observing them pass:

> - removing the guard (isPerAccountShape always true): 5 tests red
> - first-match-wins instead of every-row: 4 tests red

So the 2026-07-19 lesson fired, by name, in the right week. That lesson is
`/workspace/PropOS/docs/LESSONS_LEARNED.md:2178`, "a spec that cannot run at merge time does
not gate the merge", and the squash landed 2026-07-28. The assessment's "seven days" is its
own figure; the two verified dates are nine days apart by merge date (the PR may have opened
earlier, which is not established here).

The genuine residue in #242 was different and smaller: the lane invariant lived in a React
ternary. That was a stated scope decision, not an oversight. From the same commit body:

> Out of scope here: the unconditional status='matched' stamp (item 03) is design gated on
> canPrepare, and the raw_data unification (item 06) awaits the design session.

It was closed later by migration `00141_bsi_lane_integrity_guard.sql`, in
`228427e fix(reconciliation): 00141 enforces the lane invariant PR #242 left in a ternary (#257)`.

The strongest evidence for the activation gap therefore inverts: it is an instance of the
pipeline working, including the part where a check is mutation-tested before it is trusted.

### (b) The fire log measures one layer of four

`/tmp/cs/hooks/skill-fire-log.mjs` is a `PostToolUse` hook with matcher `Skill`
(`/tmp/cs/hooks/hooks.json`, `PostToolUse` block). It appends one JSONL line per `Skill`
tool call and nothing else. Its own header says so, and it is fail-open by design.

That makes three of the library's four layers structurally invisible to it:

- The six **norms** are text in `~/.claude/CLAUDE.md`, copied from `/tmp/cs/NORMS.md`. They
  are read every turn and never produce a `Skill` call.
- The **hooks** enforce deterministically without one.
- Knowledge applied without loading a skill leaves no line at all.

Reading the fire log as library-wide activation compares a one-layer numerator against a
four-layer denominator. The count in the denominator was also wrong. Reconciled today
against the filesystem:

| Group | Count | How counted |
|---|---|---|
| Authored user-level skills | 39 | 38 directories with a `SKILL.md` in `/tmp/cs` after today's deletion, plus the deleted `lint-after-edit` |
| Authored PropOS project skills | 16 | `/workspace/PropOS/.claude/skills/` |
| **Authored library** | **55** | |
| Anthropic built-ins colocated in `~/.claude/skills/` | 7 | `docx`, `morning`, `pdf`, `pptx`, `session-start-hook`, `skill-creator`, `xlsx` |
| Total entries visible in the two directories | 62 | 55 + 7 |

So "62" was the authored library plus seven shipped built-ins nobody wrote. The library under
review is 55.

The 15-invocations figure could not be verified on the machine this audit ran on:
`~/.claude/skills/FIRE_LOG.jsonl` does not exist here, because the log is gitignored and
machine-local. **(unverified)** It is taken at face value below, which does not matter much,
because the number it should be compared against is not 62 and the instrument does not
measure what the claim needs it to measure.

## 3. What the working instrument shows

The library does have an instrument pointed at the right question, and it is not the fire
log. It is the misses log: the postscript to the norm block in `/tmp/cs/NORMS.md`, adopted in
`1265c27` (dated 2026-07-23), which requires every lessons entry to close with

> skill that should have prevented this: `<name>` / none - new candidate

Its first week is measurable. `/workspace/PropOS/docs/LESSONS_LEARNED.md` carries 10 entries
dated 2026-07-24 or later; 9 of them carry the line (lines 2429, 2445, 2462, 2549, 2565,
2593, 2627, 2651, 2681). The one that does not is the 2026-07-26 seam-join committee review
entry at line 2464. A convention adopted mid-week and honoured 9 times out of 10 is not a
dormant library.

The misses themselves cluster:

| Named skill | Misses |
|---|---|
| prove-it-can-fail | 3 |
| live-state-first | 2 |
| safe-smokes | 1 |
| enforce-invariants-in-build | 1 |
| blast-radius-grep | 1 |
| none, new candidate (`invoker-trigger-callee-grants`) | 1 |

Two things follow, and they set the whole work programme.

**Five of the nine name one of the two always-on norms** (prove-it-can-fail,
live-state-first). These are Layer 1: they are in front of the model on every turn and were
violated anyway. `NORMS.md`'s own governance rule is explicit about what that means: a norm
that never bites demotes to a hub bullet, and "a norm violated anyway promotes to a hook
where mechanisable". The norms were not failing to be read. They were failing to be
actionable at the moment they were needed.

**Three of those five cluster on a single moment**: the instant a file lands in
`supabase/migrations/`. A guard predicate derived from the bug narrative rather than the
write; a migration handed to a production console unexecuted; an environmental premise about
the target never probed. That moment has no trigger vocabulary at all - a bare `.sql` write
mentions nothing about testing, staleness, or verification - but it has a perfect
deterministic signature: the path.

Two leaks in the pipeline were also confirmed today.

**The GitHub Actions minutes exhaustion never entered the pipeline.** It is recorded, with
its arithmetic, in `/tmp/cs/price-the-spend/SKILL.md`:

> A `smoke-ui` nightly on a private repo ran 25m10s a day. GitHub rounds up per job, so it
> billed 26 minutes, about 780 minutes a month, roughly 40% of a 2,000-minute allowance,
> spent before a single commit was pushed. It exhausted the spending limit and the merge
> queue died mid-session.

This is the cross-domain second instance of the 2026-06-09 Supabase preview-branch billing
leak (`LESSONS_LEARNED.md:823`, "Session 34 additions (2026-06-09, Supabase branching
billing leak - orphaned preview branch)"), whose own entry concluded that the Spend Cap does
not cover compute. Same class: unpriced metered recurring spend. It went straight to a skill
plus a hook and never appeared in `LESSONS_LEARNED.md` or `DECISIONS.md` at all - greps for
"Actions minutes", "allowance", "billed minutes", "spending limit", "2,000-minute", and
"smoke-ui nightly" across both files return nothing.

**The 2026-07-27 handover's coordination rules never entered it either.**
`/workspace/PropOS/docs/HANDOVER_2026-07-27_audit_gate_react19_and_00092.md:240` opens a
section headed "**The rules that make this work, learned the hard way twice today:**" and
lists five, beginning:

> 1. **One PR at a time. Never batch.** `smoke.yml` uses a global single-slot concurrency
>    group `smokes-shared-supabase` because those smokes write to the shared live database.
>    A second queued run is superseded and CANCELLED. Ten branches were updated at once this
>    session and nine runs died.

Grepping `LESSONS_LEARNED.md` for `smokes-shared-supabase` returns zero hits. Five hard-won
operational rules stopped in a handover section.

The pipeline is: handover, to lessons, to misses log, to skill or hook. The misses log works.
The first arrow leaks.

## 4. The triggerability triage

One pass over all 55 authored entries, as they stood at review time (39 user-level, including
`price-the-spend` and the then-extant `lint-after-edit`, plus the 16 PropOS project skills).
The question asked of each is narrow: **can anything the model or harness sees actually reach
this skill at the moment it is needed?** Layer labels follow the library's own taxonomy in
`/tmp/cs/README.md`.

| Skill | Layer | Verdict | Reason |
|---|---|---|---|
| verify-the-effect | norm + playbook | KEEP | Norm-backed: in `CLAUDE.md` every turn, so a fire-log zero is expected by design. |
| live-state-first | norm + playbook | KEEP | Norm-backed; also the most-named miss after prove-it-can-fail, now hook-nudged at the migration write. |
| no-silent-data-drop | norm + playbook | KEEP | Norm-backed; never produces a `Skill` call. |
| honest-failure-surfacing | norm + playbook | KEEP | Norm-backed; playbook loads only when routed. |
| prove-it-can-fail | norm + hub | KEEP | Norm-backed and hub-routing; 3 misses, now hook-nudged at test and migration writes. |
| findings-are-evidence | norm + playbook | KEEP | Norm-backed; consumed continuously without loading. |
| one-real-ride | hub (done gate) | KEEP | Owns "done", "shipped", "live": real vocabulary a prompt actually uses. |
| parallel-work-recon | hub (session boundary) | KEEP | Working vocabulary; its pre-push half is now mechanised in `push-gate`. |
| plan-first | hub (plan gate) | KEEP | "Implement", "add", "refactor" all reach it. |
| db-migration-verification | hub (schema work) | KEEP | Migration vocabulary works; the write moment that had none is now hook-nudged. |
| ai-surface-discipline | hub (LLM surfaces) | KEEP | LLM and AI-surface vocabulary is explicit in the prompt. |
| verified-citations | hub (citing docs) | KEEP | Handover, audit, decision-log vocabulary reaches it. |
| blast-radius-grep | leaf | KEEP | "Change X in A and B", rename, drop: all stated out loud. 1 miss, judgement-shaped. |
| env-change-verification | leaf | KEEP | Env var, secret, config edits are named in the request. |
| enforce-invariants-in-build | leaf | KEEP | Invariant prose is content, greppable; migration comments now hook-nudged. |
| lock-at-the-chokepoint | leaf | KEEP | Lock, dedupe, rate cap, in-flight guard are all said aloud. |
| mass-red-triage | leaf | KEEP | A broadly-red suite is a stated symptom. |
| live-data-surgery | leaf | KEEP | Now sits behind the promoted surgery gate, which asks and carries the protocol. |
| email-delivery-verification | leaf | KEEP | "The email never arrived" is unmistakable vocabulary. |
| guard-the-spend-paths | leaf | KEEP | Endpoint, cap, rate-limit vocabulary works. |
| price-the-spend | leaf | KEEP | The leaf-plus-hook exemplar: `schedule-cost-warn` fires where the description cannot. |
| outbound-side-effect-idempotency | leaf | KEEP | Send-then-record and retry vocabulary works. |
| substantiate-outward-claims | leaf | KEEP | Customer-facing copy is a stated task. |
| deliverable-integrity | leaf | KEEP | Generated-document tasks name themselves. |
| server-side-authority | leaf | KEEP | RLS, route, admin-surface vocabulary works. |
| safe-smokes | leaf (routed) | KEEP | 1 miss; "write me a smoke" is not a request for safety advice, so now hook-nudged on test writes. |
| flag-deferred-items | leaf | KEEP | "Deferred", "out of scope", "later phase" are literal trigger words. |
| handover | leaf | KEEP | Upgraded this audit: confidence markers, plus Step 4 promote-before-closing. |
| committee-review | process | KEEP | Explicitly opt-in and named by the user. |
| skill-library-builder | process | KEEP | Named by the request that needs it. |
| unslop-code | leaf (fork) | KEEP | "Looks AI-generated" and code-review vocabulary works. |
| unslop-text | leaf (fork) | KEEP | Prose-writing and de-slop vocabulary works. |
| unslop-ui | leaf (fork) | KEEP | UI, Tailwind, shadcn, landing-page vocabulary works. |
| reproduce-the-real-build | leaf (micro) | KEEP | Build-config and lockfile changes are named. |
| constant-time-secret-compare | leaf (micro) | KEEP | Rare-event micro-leaf, exempt from zero-fires demotion per the README. |
| date-parse-utc-safe | leaf (micro) | KEEP | Rare-event micro-leaf, same exemption; high consequence when it fires. |
| dependency-upgrade-verification | leaf (micro) | KEEP | Rare-event micro-leaf, same exemption; major bumps are infrequent by nature. |
| confirm-before-push | policy behind a hook | KEEP | Documentation for the `push-gate` hook that does the actual enforcing. |
| lint-after-edit | leaf | **PROMOTED TO HOOK AND DELETED** | Structurally untriggerable: the moment is the edit, and nobody says "lint". |
| propos-architecture-contract | project (onboard route) | RECLASSIFIED | "Load FIRST in any fresh session" cannot description-match a session start; now loaded deterministically by `/onboard`. |
| propos-failure-archaeology | project (onboard route) | RECLASSIFIED | "Feels familiar" is a feeling; no matcher sees it. Now last in the `/onboard` load order. |
| propos-change-control | project | KEEP with a note | Broad "before any change" description overlaps `plan-first`; already in the `/onboard` load order, so harmless. |
| propos-build-and-env | project | KEEP | Build and env symptoms are stated. |
| propos-debugging-playbook | project | KEEP | Live-failure symptoms are stated. |
| propos-validation-and-qa | project | KEEP | Test and QA vocabulary works. |
| propos-run-and-operate | project | KEEP | Apply and deploy vocabulary works. |
| propos-diagnostics-and-tooling | project | KEEP | Tooling requests name themselves. |
| propos-config-and-flags | project | KEEP | Flag and config vocabulary works. |
| propos-docs-and-writing | project | KEEP | Doc-writing tasks are explicit. |
| propos-evidence-bar | project | KEEP | Evidence and proof vocabulary works. |
| propos-external-positioning | project | KEEP | Outward-facing content is a stated task. |
| propos-keyset-pagination-campaign | project | KEEP | Pagination is specific content vocabulary. |
| propos-proof-and-analysis-toolkit | project | KEEP | Analysis requests name themselves. |
| propos-research-frontier | project | KEEP | Research framing is explicit. |
| uk-property-compliance-reference | project | KEEP | LTA, RICS, TPI, BSA and statutory vocabulary is unmistakable. |

Net: **10 of 55 were structurally untriggerable where it counted** - the six norm-backed
entries the fire log cannot see, the two propos skills whose descriptions asked a matcher to
detect a session start and a feeling, `lint-after-edit`, and `safe-smokes` at the one moment
that matters (the test write). One deletion. The "library too large, descriptions competing"
hypothesis is not supported once the fire log's blindness and the exemption classes are
accounted for. The problem was never breadth. It was that the highest-consequence moments
carry no vocabulary for a description to match.

## 5. What was built

Seven commits in `/tmp/cs`, verified with `git -C /tmp/cs log --oneline`:

| SHA | Commit | What it does |
|---|---|---|
| `6aeec15` | `feat(norms,handover): class line for first-instance lessons; confidence markers and promote-before-closing` | `NORMS.md` gains a `class:` line for first-of-a-kind incidents whose class is broader than the instance, so the second instance reads as recurrence; marker stamp bumped to `v2026-07-29`. `handover` gains verified-or-unverified confidence markers and a new Step 4. |
| `779375f` | `feat(hooks): migration-write-warn, so migration discipline fires on the .sql write itself` | `PreToolUse` on `Write\|Edit`: a `.sql` payload under a `migrations` path segment gets the discipline reminder, plus the enforce-invariants clause when the payload asserts an invariant in comment prose. |
| `2d11b02` | `feat(hooks): test-write-warn, so smoke safety fires when the test is written` | Fires on a test-shaped path whose payload carries a DB-context delete, a service-role credential, or an error-existence-only assertion. |
| `6589266` | `feat(hooks): push-gate carries a live freshness block in the ask` | Bounded fetch, fetched ref movements, and `status -sb` appended to the existing ask, inside its own try/catch so a throwing probe still emits the original reason verbatim. |
| `4a16709` | `feat(hooks): sql-surgery-warn promoted to ask, along the path its row reserved` | Warn-and-log promoted to `permissionDecision: "ask"`, carrying the matched statement, the surgery protocol in one line, and the target `.sql` script's own header comments. |
| `0a85c04` | `feat(hooks): audit-fires, the rating system scorecard` | Hand-run CLI, not an event hook: fires per skill, never-fired skills tagged with the layer that explains the zero, and misses per skill parsed from each repo's misses-log lines. |
| `1d780cb` | `feat(hooks): lint-after-edit promoted to hook; the skill is deleted` | `PostToolUse` on `Write\|Edit`, per-project linter detection, binary strictly from that project's `node_modules/.bin`, 15s cap. The skill is gone. |

Two commits in PropOS, verified with `git -C /workspace/PropOS log --oneline -2`:

| SHA | Commit | What it does |
|---|---|---|
| `e54bf50` | `docs(skills): /onboard becomes the load route for the two untriggerable propos skills` | `/onboard` now ends its ordered load with `propos-failure-archaeology`; both descriptions state the deterministic route while keeping the content vocabulary that does work. |
| `2830edf` | `feat(hooks): warn when a push or merge would supersede a queued Smokes run` | Project-level `PreToolUse` hook, never blocks. Supersedes-queued semantics verified against `smoke.yml` lines 71-73: `concurrency: group: smokes-shared-supabase`, `cancel-in-progress: false`, so a *queued* run is the one that dies, not the running one. |

Three notes on how the hooks were built, because they are the reason to trust them.

**Every hook ships a sibling test suite, and every suite passes.** Re-run by the coordinator
today from `/tmp/cs/hooks`: `audit-fires` 30 cases, `lint-after-edit` 15, `migration-write-warn`
13, `push-gate` 8, `schedule-cost-warn` 10, `sql-surgery-warn` 16, `test-write-warn` 17. All
report `ALL PASS`, exit 0. PropOS's `smokes-in-flight-warn.test.mjs` reports 14/14, exit 0.

**Several were mutation-tested by their builders**, not merely observed passing. Recorded in
the commit bodies: `migration-write-warn`'s harness was itself mutated, which surfaced that
the original case list passed a hook with no comment scoping at all; `audit-fires` went red
under a doubled miss increment, a blinded slash split, and dropped layer tags;
`sql-surgery-warn` proves four mechanisms by mutation; `push-gate`'s freshness try/catch is
proven by mutation; `lint-after-edit` proves every guard falsifiable and adds one real ride
against a live repo.

**`4a16709` also fixed a latent bug the promotion surfaced.** From its body: the old
DESTRUCTIVE regex "required a word boundary after `\w`, so TRUNCATE with any
multi-character table name never matched and the log under-recorded it for the hook's life."
The gate that was supposed to be watching destructive SQL had been blind to every real
`TRUNCATE` since it was written.

## 6. Decisions taken, deferred, and corrected

**Taken, with sign-off.**

- *The surgery gate blocks.* `sql-surgery-warn` promoted from warn-and-log to `ask`. R-21
  ("every hook declares fail-open/fail-closed, warn-and-log default, only the push gate
  blocks", `docs/REVIEW_2026-07-23_skill_proposals.md`) is amended by decision to: the push
  and surgery gates block, everything else warns. The evidence is the incident the row's own
  promotion clause reserved: a destructive live-data delete pre-authorised without the
  authoriser reading the two constraints written in the script being authorised. Destructive
  SQL in a Bash command is rare, so the ask cannot train bypass. The two comments that called
  `push-gate` the only fail-closed gate were updated in the same pass.
- *The `class:` line lives inside the `NORMS.md` marker block.* Consequence, stated plainly:
  plugin machines pick it up via `norms-inject`, but the direct-clone dev machine needs the
  block between `<!-- BEGIN CLAUDE-SKILLS NORMS v2026-07-29 -->` and its `END` marker
  re-pasted into `~/.claude/CLAUDE.md` by hand. Until that happens, that machine is running
  the `v2026-07-23` norms.

**Considered and rejected.** A commit-time freshness warn, alongside the push-time one. Push
is the irreversible boundary; a fetch on every commit adds latency to the most frequent
operation in the session for information that is only actionable at the push. One mechanics
correction belongs on the record, because the first version of this reasoning was wrong:
`PreToolUse` **can** warn non-blockingly, via `systemMessage`, and three shipped hooks do
exactly that (`schedule-cost-warn`, `migration-write-warn`, `test-write-warn`, all
`PreToolUse` / `Write|Edit`, all warn-only). The rejection rests on noise and latency, not on
a harness limitation.

**Recommended next, not taken.** Both are ratification decisions, deliberately left for
sign-off rather than shipped inside an audit:

- Widening the surgery vocabulary to `supabase db reset --linked`, which is destructive and
  currently silent.
- A per-repo backfill of `class:` lines onto existing lessons entries.

**Corrections to the assessments' claims, recorded for honesty.**

- The PR #242 headline, above. The assessment's strongest evidence describes a defect the PR
  diagnosed and fixed in its own second commit.
- The "`--admin` bypass recommendation" attributed to the 2026-07-27 handover was one of
  three options in an explicitly open judgement call. Verified at
  `HANDOVER_2026-07-27_audit_gate_react19_and_00092.md:261-262`: "Either give it a trivial
  touch that matches the paths filter, or merge it with `--admin`, or widen the filter.
  **That is a judgement call, deliberately left open.**"
- Two further claims the assessments made about that handover could not be located in it at
  all. **(unverified)** They are neither confirmed nor refuted here.
- The Actions minutes incident is absent from both PropOS corpora but present in
  `price-the-spend`, which is the pipeline leak described in section 3, not a missing lesson.

## 7. The honest answer to "how do I stop missing these things"

Split the surface in two, and be blunt about which half automation reaches.

**Mechanisable, because a path or diff signature exists.** Migration writes. Test writes
touching shared data. Pushes into a stale remote or a live smoke queue. Destructive SQL
authorisation. Schedule creation. Lint on edit. That is the whole list, and as of today it is
the whole covered surface: `migration-write-warn`, `test-write-warn`, `push-gate` with its
freshness block, `smokes-in-flight-warn`, `sql-surgery-warn` as an ask, `schedule-cost-warn`,
`lint-after-edit`. It is a small list, and that is the point. The moments where a
deterministic signature exists are few, and they were the moments carrying three of the five
norm misses.

**Not mechanisable, said plainly.**

- *"This feels familiar."* There is no trigger for a feeling. The fix is not a better
  description but a deterministic load route, which is why `propos-failure-archaeology` now
  sits in `/onboard`'s ordered load rather than waiting to be matched.
- *"The class is broader than the instance."* Recognising that an orphaned Supabase preview
  branch and an unpriced GitHub Actions nightly are the same failure is inductive judgement.
  The `class:` line gives that judgement a slot to be written down in, so the second instance
  reads as recurrence. It does not make the judgement.
- *"Does the predicate match the harm?"* A hook can put the question in front of the author
  at the migration write. Only the author can answer it.
- *One session per working copy.* A working agreement, not a control. Both sessions hold
  write access to the same clone and no check can arbitrate between them.

The largest single fix is upstream of all of it. `handover`'s new Step 4, promote before
closing: sweep the note's traps and working agreements into `LESSONS_LEARNED.md` with their
misses-log line, or plant a `FORWARD:` anchor, before the note is finished. Knowledge that
stops in a handover never reaches the admission pipeline, so it never becomes a norm, a leaf,
or a hook, however good the rest of the machinery is. Two of today's confirmed leaks - five
coordination rules and one billing incident - are that failure, not a failure of triggering.

## Follow-ups

1. **Run `audit-fires` on the dev machine**, against the real `FIRE_LOG.jsonl` and both
   corpora: `node hooks/audit-fires.mjs --repo /path/to/PropOS --repo /path/to/ash-inspection-app`.
   Prune only on that evidence. Nothing in this audit justifies a demotion on its own.
2. **Re-paste the `NORMS.md` marker block into `~/.claude/CLAUDE.md`** on the direct-clone dev
   machine. It is on `v2026-07-23` until someone does, so the `class:` line is not live there.
3. **Consider the surgery-vocabulary widening** to `supabase db reset --linked`, as a
   ratification decision.
4. **Backfill `class:` lines opportunistically**, when an entry is being edited anyway rather
   than as a sweep.
