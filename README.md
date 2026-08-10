# claude-skills

Personal, version-controlled [Claude Code](https://claude.com/claude-code) skills, synced to `~/.claude/skills/`. Installed at the **user level**, so they apply to every project on this machine automatically (no per-project setup).

**If you have arrived here from outside:** these are engineering guardrails, not prompts or personas. Each skill is a short playbook that loads when Claude is about to do the specific thing it guards, and almost every one exists because a real defect shipped without it. They were distilled from the lessons-learned corpora of four production repos, one of them a regulated UK property-management platform, so the examples are concrete and some are domain-specific. You are welcome to install the lot, fork it, or read a few and steal the ideas. Start with [`verify-the-effect`](verify-the-effect/SKILL.md) and [`prove-it-can-fail`](prove-it-can-fail/SKILL.md), which are the two that change the most behaviour for the least reading. **No licence file is present yet**, so formally all rights are reserved; open an issue if you want explicit terms. The three `unslop-*` skills are forks and carry their upstream's terms, recorded in their own `UPSTREAM.md`.

The library is organised as a four-layer architecture (hooks / always-on norms / lifecycle hubs / narrow leaves) so 42 skills coexist without diluting description-trigger matching. Design and rationale: [docs/SKILL_PROPOSALS_2026-07-23.md](docs/SKILL_PROPOSALS_2026-07-23.md); the three-lens committee review that ratified it: [docs/REVIEW_2026-07-23_skill_proposals.md](docs/REVIEW_2026-07-23_skill_proposals.md). Most skills were distilled from the lessons-learned corpora of four real repos; recurrence across repos is the admission criterion.

## Layers

- **Hooks** ([hooks/HOOKS.md](hooks/HOOKS.md)) — deterministic enforcement in `~/.claude/settings.json`, per machine: push gate (with a live freshness block in the ask), surgery gate (destructive SQL asks, carrying the target script's own header), skill fire log, session recon, and the warn family that fires where descriptions cannot: schedule-cost, migration-write, test-write, lint-after-edit.
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
| **rerun-before-verdict** | leaf | No verdict from one uncontrolled run: fixes re-run the failing case, deadness needs with/without, good news needs three datapoints or a controlled diff. |
| **live-data-surgery** | leaf | Fixed protocol for ad-hoc destructive operations on shared data outside tests. |
| **email-delivery-verification** | leaf | 2xx means accepted, not delivered; suppression lists, every recipient leg, attachment-class blocks. |
| **guard-the-spend-paths** | leaf | Per-IP caps on every money/shared-state endpoint from day one; a fail-open guardrail is inert until closed. |
| **price-the-spend** | leaf | Price recurring spend before it ships (billed unit x frequency x month, as a % of the allowance); report per-action burn after it runs. |
| **commission-the-roster** | leaf (commission moment) | Publish a roster (role / model tier / budget / scope / single artifact) for approval before spawning a fleet; tier by decision class; brief pre-verified facts, not questions. |
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
| **checkpoint-log** | leaf | Per-commit checkpoint notes in a committed WORKLOG.md for multi-commit units; close with an explicit checklist walk, wiring steps included. |
| **handover** | leaf | Structured handover from a real /context reading; supersession stamps; carry-forwards cite live state. |
| **committee-review** | process | Three-lens review with shared evidence, attribution-stripped consolidation, and voting. |
| **cross-agent-review** | process | Adversarially review a scoped change/design/finding by debating a second independent AI agent (e.g. Gemini Antigravity) over a shared file relay, grounded in live read-only evidence; converge or two positions. |
| **skill-library-builder** | process | Turn a repo into a project-specific skill library; skills encode mechanical steps, not awareness. |
| **ai-surface-discipline / unslop-ui / unslop-text / unslop-code** | see rows above / forks | The three **unslop-\*** skills are forks of [JCarterJohnson/vibecoded-design-tells](https://github.com/JCarterJohnson/vibecoded-design-tells) with local patches — see each skill's `UPSTREAM.md`. |

## The rating system

Tier and layer assignments are measured, not declared: the fire-log hook records every skill invocation to `FIRE_LOG.jsonl` (gitignored, machine-local); every new LESSONS_LEARNED entry in any repo ends with "skill that should have prevented this: X / none — new candidate" (the misses log, plus a "class:" line when a first instance is plainly broader than itself); a prune pass runs when a skill is added. Promotion ladder: hub bullet → leaf → norm → hook. Norm-backed, hub-routed, and rare-event-high-consequence skills are exempt from zero-fires demotion. `hooks/audit-fires.mjs` turns both halves of the measurement into one report (`node hooks/audit-fires.mjs --repo <path>...`): fires per skill, never-fired skills tagged with the layer that explains the zero, and misses per skill. The fire log cannot see the norms, the hooks, or knowledge applied without loading a skill, so a zero there is a question, not a verdict; the 2026-07-29 activation audit (docs/AUDIT_2026-07-29_activation.md) is the worked example of reading it wrong and then right.

## The index gate

One fact, the skill count, was stated in four places (the README table, the README prose, `plugin.json`, `marketplace.json`) with nothing asserting any of them, and it drifted: `1d780cb` deleted a skill on promotion to a hook and updated the table row only, so both manifests shipped wrong by one until a later addition made them accidentally right. `hooks/check-index.mjs` closes it, run by `.github/workflows/check-index.yml` on every push and PR (free, this repo is public):

```bash
node hooks/check-index.mjs
```

It asserts the **set** in both directions, which is the load-bearing half, plus each skill's frontmatter `name` against its directory, a non-empty description, and all three stated counts. It is a CI gate rather than a hook because the drift was caused by a **deletion**, which no Write or Edit hook can see. `hooks/check-index.test.mjs` proves it can go red: fourteen cases, each mutating one thing and pinning the substring that identifies its own defect, including a regression case named for `1d780cb`. Run against real history the gate reds with three problems at `1d780cb` and two at `385755d`, tracking the partial fix exactly.

The same workflow's second job runs **every** hook suite (`hooks/*.test.mjs`) on ubuntu, and that job is why it is worth having. `lint-after-edit.test.mjs` builds `#!/bin/sh` linter stubs, so its six "fires" cases cannot execute on the Windows machine this library is maintained from, and before the job existed they were not executed on Linux either. Six cases guarding nothing look identical to six cases passing. Every suite runs even after one fails, so a red run reports the whole picture rather than the first fault.

## The archive gate

Each `*/*.skill` file is a committed zip of its skill directory (`SKILL.md`, `references/*`, `scripts/*`; `README.md`, `UPSTREAM.md` and `.gitkeep` are deliberately not bundled). Nothing regenerated one on edit and nothing diffed one against the tree, so the two drifted silently: LESSONS_LEARNED entry 9 records three archives shipping a scanner their own `UPSTREAM.md` said was patched, because a stale package has no reader until something installs it, and then it installs the past. `hooks/check-archives.mjs` closes it, run by the same workflow on every push and PR:

```bash
node hooks/check-archives.mjs
```

It reads each archive's members with a stdlib-only zip reader (no dependencies) and asserts the **set** against the directory in both directions — every bundled file present in the archive, every archive member still on disk — plus each shared file's content, normalising CRLF so a checkout's line endings are never mistaken for drift. It reds naming every stale, missing or orphaned member. Like the index gate it is a whole-tree gate, not a Write/Edit hook, because an archive going stale is a non-edit to a second file the edit never touched. `hooks/check-archives.test.mjs` proves it can go red: ten cases each mutating one thing and pinning its own substring, including one in the shape of entry 9's incident (a script patched on disk but not repacked). When it reds, `node hooks/pack-skill.mjs <skill-dir>` (or `--all`) rebuilds the archive deterministically, so the fix is one command.

[LESSONS_LEARNED.md](LESSONS_LEARNED.md) holds field notes from applying these skills on real jobs: what broke, what the skills caught, and what only a human pass caught.

## Install on a new machine

**Prerequisites.** Claude Code, `git`, and **`node` on PATH** (every hook is a node script). The
session-recon and push-gate hooks also shell out to `git` and `gh`, so install the
[GitHub CLI](https://cli.github.com/) and run `gh auth login` if you want their live repo state.
Everything degrades quietly rather than breaking: a missing `node` or `gh` means the affected hook
produces nothing, which looks identical to nothing being wrong. If a hook seems inert, check the
prerequisite first.

**What installing changes about your sessions**, stated plainly because none of it is obvious
afterwards and one item can interrupt you:

- **Eight hooks are wired**, listed in [hooks/HOOKS.md](hooks/HOOKS.md). Two are gates that ask
  for confirmation rather than warn: `push-gate` intercepts every `git push`, `gh pr merge` and
  remote branch deletion, and `sql-surgery-warn` intercepts destructive SQL in an execution
  context. If you do not want a confirmation prompt on every push, do not install the plugin
  mode; take the skills only.
- **A SessionStart hook runs `git fetch` and `gh pr list`** in your repo at the start of every
  session, and injects the result as context. That is network activity in your repo, on your
  credentials, without a prompt.
- **`skill-fire-log.mjs` appends the skill name, its arguments and your cwd** to
  `~/.claude/skills/FIRE_LOG.jsonl` every time a skill loads. It is local-only and gitignored,
  nothing is transmitted anywhere, and no hook in this library makes a network call. Delete the
  file or remove the hook if you would rather not keep it.
- **The six norms are injected into every session** as instructions, per [NORMS.md](NORMS.md).

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
counts as a new version). The repo is public, so no credentials are needed to read it.

**Check it worked**, rather than assuming:

```bash
node ~/.claude/skills/hooks/check-index.mjs
```

That prints `ok: N skills, all indexed, ...` and exits 0. In a session, `/plugin` lists the
installed plugin, and asking Claude to do something a skill guards (say, write a test) should
visibly load the relevant skill. If skills are present but nothing ever fires, the hooks are the
part that did not install.

**To remove it:** `/plugin uninstall ash@ash-skills`, then delete
`~/.claude/skills/FIRE_LOG.jsonl` and `SURGERY_LOG.jsonl` if you want the local logs gone.

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
