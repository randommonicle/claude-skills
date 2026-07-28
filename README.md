# claude-skills

Personal, version-controlled [Claude Code](https://claude.com/claude-code) skills, synced to `~/.claude/skills/`. Installed at the **user level**, so they apply to every project on this machine automatically (no per-project setup).

The library is organised as a four-layer architecture (hooks / always-on norms / lifecycle hubs / narrow leaves) so 39 skills coexist without diluting description-trigger matching. Design and rationale: [docs/SKILL_PROPOSALS_2026-07-23.md](docs/SKILL_PROPOSALS_2026-07-23.md); the three-lens committee review that ratified it: [docs/REVIEW_2026-07-23_skill_proposals.md](docs/REVIEW_2026-07-23_skill_proposals.md). Most skills were distilled from the lessons-learned corpora of four real repos; recurrence across repos is the admission criterion.

## Layers

- **Hooks** ([hooks/HOOKS.md](hooks/HOOKS.md)) — deterministic enforcement in `~/.claude/settings.json`, per machine: push gate, skill fire log, destructive-SQL warn, session recon.
- **Norms** ([NORMS.md](NORMS.md)) — six always-on one-liners copied into the global `~/.claude/CLAUDE.md`; each points at its skill playbook.
- **Hubs** — skills owning a workflow moment, each with a routing table to leaves.
- **Leaves** — narrow triggers, orthogonal vocabulary, one "does not fire on" line each.

## Skills

| Skill | Layer / role | What it does |
|-------|--------------|--------------|
| **verify-the-effect** | norm + playbook | Never conclude success from a proxy signal; assert the actual effect or artifact. |
| **live-state-first** | norm + playbook | Probe live state before building from any described state; the catalog settles disagreements. |
| **no-silent-data-drop** | norm + playbook | Filters and gates hide empty things, never drop content; clamp model-emitted routing keys. |
| **honest-failure-surfacing** | norm + playbook | One message per failure mode; pressable controls that explain; error level for terminal states only. |
| **prove-it-can-fail** | norm + hub (tests/checks) | Every test, seed, gate, or check must demonstrably be able to fail. Routes: safe-smokes, mass-red-triage. |
| **findings-are-evidence** | norm + playbook | Agent/reviewer reports are evidence, not findings; re-derive Critical/High and regulatory claims. |
| **one-real-ride** | hub (done gate) | One real end-to-end invocation through the real seams before "done". Routes: verify-the-effect, email-delivery-verification, env-change-verification, reproduce-the-real-build. |
| **parallel-work-recon** | hub (session boundary) | Fetch/PR/log recon at session start AND pre-commit; identifier claims scan all refs; worktree path discipline. |
| **plan-first** | hub (plan gate) | File list, test list, out-of-scope before code; plan step zero is a grep. Routes: blast-radius-grep, enforce-invariants-in-build, flag-deferred-items. |
| **db-migration-verification** | hub (schema work) | Post-apply catalog verification plus the full cross-repo trap bundle (FK embeds, live definitions, privileges read-back, verbatim re-issues). Routes: live-data-surgery, blast-radius-grep. |
| **ai-surface-discipline** | hub (LLM surfaces) | Input minimisation, output discipline, human gate, rules-bind-in-the-prompt pillar, guard hardening. Routes: no-silent-data-drop, guard-the-spend-paths, outbound-side-effect-idempotency. |
| **verified-citations** | hub (citing docs) | Quoted-line citations, provenance by command, statutory facts against primary sources. Routes: deliverable-integrity, substantiate-outward-claims, handover. |
| **blast-radius-grep** | leaf (Tier 1) | The unit of change is the action or fact; grep app, tests, seeds, branches, and built output; drift-check denormalised copies. |
| **env-change-verification** | leaf (Tier 1) | An env change is not live until the reading artifact is rebuilt/redeployed; validate the value, not its presence. |
| **enforce-invariants-in-build** | leaf (Tier 1) | A rule asserted only in prose is a comment; back invariants with a test, constraint, or trigger. |
| **lock-at-the-chokepoint** | leaf | Serialise shared ops at the module-level chokepoint; check-then-act is not a lock; bounded resumable retry loops. |
| **mass-red-triage** | leaf | Classify a broadly-red suite before debugging: root failure, rate-limit walls, truncated runs, environment defects. |
| **live-data-surgery** | leaf | Fixed protocol for ad-hoc destructive operations on shared data outside tests. |
| **email-delivery-verification** | leaf | 2xx means accepted, not delivered; suppression lists, every recipient leg, attachment-class blocks. |
| **guard-the-spend-paths** | leaf | Per-IP caps on every money/shared-state endpoint from day one; a fail-open guardrail is inert until closed. |
| **price-the-spend** | leaf | Price recurring spend before it ships (billed unit x frequency x month, as a % of the allowance); report per-action burn after it runs. |
| **outbound-side-effect-idempotency** | leaf | Choose which failure harms the recipient less; claim states, not read-then-write pre-checks. |
| **substantiate-outward-claims** | leaf | Customer-facing certification/statistic claims need a primary source or explicit attribution. |
| **deliverable-integrity** | leaf | Generated documents: claim-by-claim rewrite diff, loud placeholders for owner-only facts, re-extract-and-assert for parsers. |
| **server-side-authority** | leaf | Derive paths/ids server-side; column-scope RLS self-updates; RLS-or-revoke every table; escape admin output. |
| **reproduce-the-real-build** | leaf (micro) | Run the exact production build locally; prove toolchain fixes from tracked manifests alone. |
| **date-parse-utc-safe** | leaf (micro) | Parse date-only strings as explicit local components; UTC runtimes render the previous day. |
| **constant-time-secret-compare** | leaf (micro) | Hash then timingSafeEqual for any secret comparison. |
| **dependency-upgrade-verification** | leaf (micro) | npm pack both versions and diff the deciding file when runtime data can't distinguish success from failure. |
| **safe-smokes** | leaf (routed by prove-it-can-fail) | Never destructive against shared data in tests; flip-and-restore; teardown asserts its row counts. |
| **confirm-before-push** | policy behind the push-gate hook | Per-action authorisation for pushes, merges, and remote branch deletion, with the deletion preflight. |
| **flag-deferred-items** | leaf | Grep-able anchors at the deferred work's landing site; .fixme() carries the anchor; dormant controls say so. |
| **handover** | leaf | Structured handover from a real /context reading; supersession stamps; carry-forwards cite live state. |
| **committee-review** | process | Three-lens review with shared evidence, attribution-stripped consolidation, and voting. |
| **skill-library-builder** | process | Turn a repo into a project-specific skill library; skills encode mechanical steps, not awareness. |
| **lint-after-edit** | leaf | Run the project's linter on each edited JS/TS file; report without blocking. |
| **ai-surface-discipline / unslop-ui / unslop-text / unslop-code** | see rows above / forks | The three **unslop-\*** skills are forks of [JCarterJohnson/vibecoded-design-tells](https://github.com/JCarterJohnson/vibecoded-design-tells) with local patches — see each skill's `UPSTREAM.md`. |

## The rating system

Tier and layer assignments are measured, not declared: the fire-log hook records every skill invocation to `FIRE_LOG.jsonl` (gitignored, machine-local); every new LESSONS_LEARNED entry in any repo ends with "skill that should have prevented this: X / none — new candidate" (the misses log); a prune pass runs when a skill is added. Promotion ladder: hub bullet → leaf → norm → hook. Norm-backed, hub-routed, and rare-event-high-consequence skills are exempt from zero-fires demotion.

[LESSONS_LEARNED.md](LESSONS_LEARNED.md) holds field notes from applying these skills on real jobs: what broke, what the skills caught, and what only a human pass caught.

## Install on a new machine

Two modes — pick ONE per machine (both at once double-registers every skill and double-fires
every hook):

**Plugin (recommended — skills + hooks + norms in one step, auto-updates on every push):**

```
/plugin marketplace add randommonicle/claude-skills
/plugin install ash@ash-skills
```

The repo doubles as a plugin marketplace (`.claude-plugin/marketplace.json`). The plugin
serves the skills from the repo root (`"skills": "./"` in plugin.json), wires all Layer 0
hooks via `hooks/hooks.json`, and injects the NORMS.md block at every session start
(`hooks/norms-inject.mjs`) — no manual CLAUDE.md or settings.json editing. Updates arrive
when the machine refreshes the marketplace (no version field is set, so every push to main
counts as a new version). Private-repo note: the machine needs git credentials that can read
this repo (`gh auth login` or a credential manager).

**Direct clone (the maintainer's dev machine only):**

```bash
git clone <this-repo-url> ~/.claude/skills
```

Then copy the NORMS.md block into `~/.claude/CLAUDE.md` and install the hooks per
[hooks/HOOKS.md](hooks/HOOKS.md). This mode is for editing the skills; a machine on this
mode must NOT also install the plugin.

## Conventions

- A forked/edited skill carries an `UPSTREAM.md` recording its source repo, source commit, and our local patches. **When pulling an upstream update, re-apply the patches listed there** so our fixes are not lost.
- Our own original skills don't need an `UPSTREAM.md`.
- Every leaf description carries a "does not fire on" line; no two leaves share their primary trigger vocabulary; soft cap ~60 words per description.
- Adding a leaf updates its hub's routing table in the same commit.
