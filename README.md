# claude-skills

## What this is

A set of guardrails for [Claude Code](https://claude.com/claude-code), the AI coding tool. Each
one is a short rule that Claude loads by itself, at the moment it is about to do the thing that
rule covers. Almost every one exists because that mistake already shipped on a real project.

They are not prompts or personas. They came out of the lessons-learned records of four production
codebases, one of them a regulated UK property-management platform, so the examples are concrete
and a few are specific to that domain. Install the lot, fork it, or read two and steal the ideas.
The two that change the most behaviour for the least reading are
[`verify-the-effect`](verify-the-effect/SKILL.md), which says never call something done because a
command exited without error, and [`prove-it-can-fail`](prove-it-can-fail/SKILL.md), which says a
test that cannot go red is not a test.

**Three kinds of thing live here.**

- **Skills**: short playbooks Claude reads at the right moment. The table below lists all 46.
- **Hooks**: small scripts that run automatically around what Claude does. One stops and asks you
  before Claude uploads any code to GitHub. One checks a file Claude has just edited for mistakes,
  using whatever checker that project already uses. One looks up what has changed in your project
  since you last worked on it, so Claude is not working from an out-of-date picture.
- **Norms**: six one-line rules that apply in every session, listed in [NORMS.md](NORMS.md).

It installs once per machine and applies to every project on it. You never run any of it by hand.

**This repository is licensed under Apache-2.0** (see the `LICENSE` file). The three `unslop-*`
skills are forks and carry their upstream's terms, recorded in their own `UPSTREAM.md`.

## Install

About five minutes.

1. Install Claude Code, [git](https://git-scm.com/) and [Node.js](https://nodejs.org/). For the
   checks that read your project's state, also the [GitHub CLI](https://cli.github.com/), then
   run `gh auth login`.
2. In a Claude Code session, run `/plugin marketplace add randommonicle/claude-skills`, then
   `/plugin install ash@ash-skills`.
3. Check it worked: `/plugin` should list the installed plugin, and asking Claude to do something
   a skill guards (say, write a test) should visibly load that skill.
4. Optional, for the two-model code review (`cross-agent-review`, where Claude has Gemini and GPT
   argue over a change): install the `agy` and `codex` command-line tools and copy one settings
   file. Steps in [cross-agent-review/SKILL.md](cross-agent-review/SKILL.md).

The manual route, what each hook does, and what to know before installing are in
[Install on a new machine](#install-on-a-new-machine) further down.

**What changes afterwards**: a confirmation prompt before Claude uploads anything; a note about
your project's state at the start of each session; a report when Claude edits a JavaScript or
TypeScript file in a project that has a checker configured; and Claude visibly loading a named
rule before it writes a test, changes a database, or calls an AI model.

**Where things are**: the skills in the table below; what each hook does in
[hooks/HOOKS.md](hooks/HOOKS.md); what went wrong on real jobs in
[LESSONS_LEARNED.md](LESSONS_LEARNED.md); standing choices in [DECISIONS.md](DECISIONS.md); how
the library gates itself in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); house rules for changing
it in [CONTRIBUTING.md](CONTRIBUTING.md).

Skills are installed at the **user level**, so they apply to every project on the machine with no
per-project setup.

The library is organised as a four-layer architecture (hooks / always-on norms / lifecycle hubs / narrow leaves) so 46 skills coexist without diluting description-trigger matching. Design and rationale: [docs/SKILL_PROPOSALS_2026-07-23.md](docs/SKILL_PROPOSALS_2026-07-23.md); the three-lens committee review that ratified it: [docs/REVIEW_2026-07-23_skill_proposals.md](docs/REVIEW_2026-07-23_skill_proposals.md). Most skills were distilled from the lessons-learned corpora of four real repos; recurrence across repos is the admission criterion.

## Layers

- **Hooks** ([hooks/HOOKS.md](hooks/HOOKS.md)) — deterministic enforcement in `~/.claude/settings.json`, per machine: push gate (with a live freshness block in the ask), surgery gate (destructive SQL asks, carrying the target script's own header), secret-echo guard (a command that would print a secret value is denied with the safe form in the reason), skill fire log, session recon, and the warn family that fires where descriptions cannot: schedule-cost, migration-write, test-write, lint-after-edit.
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
| **blast-radius-grep** | leaf (Tier 1) | The unit of change is the action or fact; grep app, tests, seeds, branches, and built output; drift-check denormalised copies. Completion gate: an errored sweep found nothing, and never truncate a matched line below the match. |
| **trace-one-record** | leaf | Two correct figures can make a wrong total: name what each source contains and trace one record end to end through both before combining them; a stated check is not a performed check. |
| **env-change-verification** | leaf (Tier 1) | An env change is not live until the reading artifact is rebuilt/redeployed; validate the value, not its presence. |
| **enforce-invariants-in-build** | leaf (Tier 1) | A rule asserted only in prose is a comment; back invariants with a test, constraint, or trigger. |
| **lock-at-the-chokepoint** | leaf | Serialise shared ops at the module-level chokepoint; check-then-act is not a lock; bounded resumable retry loops. |
| **mass-red-triage** | leaf | Classify a broadly-red suite before debugging: root failure, rate-limit walls, truncated runs, environment defects. |
| **rerun-before-verdict** | leaf | No verdict from one uncontrolled run: fixes re-run the failing case, deadness needs with/without, good news needs three datapoints or a controlled diff. |
| **earn-every-line** | leaf | Nothing enters a file without a present need: code needs a present caller, comments carry what code cannot, flexibility needs a stated requirement; both over-correction ditches fenced. |
| **live-data-surgery** | leaf | Fixed protocol for ad-hoc destructive operations on shared data outside tests. |
| **email-delivery-verification** | leaf | 2xx means accepted, not delivered; suppression lists, every recipient leg, attachment-class blocks. |
| **guard-the-spend-paths** | leaf | Per-IP caps on every money/shared-state endpoint from day one; a fail-open guardrail is inert until closed. |
| **price-the-spend** | leaf | Price recurring spend before it ships (billed unit x frequency x month, as a % of the allowance); report per-action burn after it runs. |
| **commission-the-roster** | leaf (commission moment) | Publish a roster (role / model tier / budget / scope / single artifact) for approval before spawning a fleet; tier by decision class; brief pre-verified facts, not questions. |
| **context-economy** | hub (context window) | Every token in the window is re-sent on every later turn: read slices not files, cap output before it lands, keep the cache prefix stable, clear rather than compact between unrelated tasks. Provider mechanics in its `references/`. |
| **outbound-side-effect-idempotency** | leaf | Choose which failure harms the recipient less; claim states, not read-then-write pre-checks. |
| **substantiate-outward-claims** | leaf | Customer-facing certification/statistic claims need a primary source or explicit attribution. |
| **deliverable-integrity** | leaf | Generated documents: claim-by-claim rewrite diff, loud placeholders for owner-only facts, re-extract-and-assert for parsers, and structural assertions a text diff cannot see (ships a .docx leading-blank-page checker). |
| **server-side-authority** | leaf | Derive paths/ids server-side; column-scope RLS self-updates; RLS-or-revoke every table; escape admin output. |
| **reproduce-the-real-build** | leaf (micro) | Run the exact production build locally; prove toolchain fixes from tracked manifests alone. |
| **date-parse-utc-safe** | leaf (micro) | Parse date-only strings as explicit local components; UTC runtimes render the previous day. |
| **constant-time-secret-compare** | leaf (micro) | Hash then timingSafeEqual for any secret comparison. |
| **secrets-in-output** | leaf + hook (`secret-echo-guard.mjs`) | Nothing that can carry a secret value reaches a tool result: presence and length only, names not values, .env by its keys, provider status and API responses captured and allowlisted; the hook denies the command shapes that print one. |
| **dependency-upgrade-verification** | leaf (micro) | npm pack both versions and diff the deciding file when runtime data can't distinguish success from failure. |
| **safe-smokes** | leaf (routed by prove-it-can-fail) | Never destructive against shared data in tests; flip-and-restore; teardown asserts its row counts. |
| **confirm-before-push** | policy behind the push-gate hook | Per-action authorisation for pushes, merges, and remote branch deletion, with the deletion preflight. |
| **flag-deferred-items** | leaf | Grep-able anchors at the deferred work's landing site; .fixme() carries the anchor; dormant controls say so. |
| **checkpoint-log** | leaf | Per-commit checkpoint notes in a committed WORKLOG.md for multi-commit units; close with an explicit checklist walk, wiring steps included. |
| **handover** | leaf | Structured handover from a real /context reading, or an honestly recorded gap where the harness cannot take one; supersession stamps; carry-forwards cite live state. |
| **committee-review** | process | Three-lens review with shared evidence, attribution-stripped consolidation, and voting. |
| **cross-agent-review** | process | Adversarially review a scoped change/design/finding by debating one or more independent AI agents (Gemini via the agy CLI or GPT via the codex CLI, driven by Claude itself with no pasting; or a chat you drive; several seats at once) over a shared file relay, grounded in live read-only evidence; converge or two positions. |
| **skill-library-builder** | process | Turn a repo into a project-specific skill library; skills encode mechanical steps, not awareness. |
| **ai-surface-discipline / unslop-ui / unslop-text / unslop-code** | see rows above / forks | The three **unslop-\*** skills are forks of [JCarterJohnson/vibecoded-design-tells](https://github.com/JCarterJohnson/vibecoded-design-tells) with local patches — see each skill's `UPSTREAM.md`. |

## Install on a new machine

**Prerequisites.** Claude Code, `git`, and **`node` on PATH** (every hook is a node script). The
session-recon and push-gate hooks also shell out to `git` and `gh`, so install the
[GitHub CLI](https://cli.github.com/) and run `gh auth login` if you want their live repo state.
Everything degrades quietly rather than breaking: a missing `node` or `gh` means the affected hook
produces nothing, which looks identical to nothing being wrong. If a hook seems inert, check the
prerequisite first.

**What installing changes about your sessions**, stated plainly because none of it is obvious
afterwards and one item can interrupt you:

- **Nine command hooks are wired**, listed in [hooks/HOOKS.md](hooks/HOOKS.md). Two are gates that
  ask for confirmation rather than warn: `push-gate` intercepts `git push`, `gh pr merge` and
  remote branch deletion, and `sql-surgery-warn` intercepts destructive SQL in an execution
  context. Both match the `Bash` and `PowerShell` tools, which is load-bearing on Windows desktop:
  a `Bash`-only matcher leaves both gates absent on the PowerShell path, and shipped that way
  until 2026-09-16. If you do not want a confirmation prompt on every push, do not install the plugin
  mode; take the skills only.
- **A SessionStart hook runs `git fetch` and `gh pr list`** in your repo at the start of every
  session, and injects the result as context. That is network activity in your repo, on your
  credentials, without a prompt.
- **`skill-fire-log.mjs` appends the skill name, its arguments and your cwd** to
  `~/.claude/skills/FIRE_LOG.jsonl` every time a skill loads, and unrecognised event shapes to
  `FIRE_LOG_DEBUG.jsonl` beside it. Both are local-only and gitignored, and nothing in them is
  transmitted anywhere. The only network activity any hook performs is the `git fetch` and
  `gh pr list` named above, on your own credentials. Delete the files or remove the hook if you
  would rather not keep them.
- **The six norms are injected into every session** as instructions, per [NORMS.md](NORMS.md).

Two modes — pick ONE per machine (both at once double-registers every skill and double-fires
every hook):

**Plugin (recommended — skills, hooks and norms in one step):**

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

**To remove it:** `/plugin uninstall ash@ash-skills`, then delete `FIRE_LOG.jsonl`,
`FIRE_LOG_DEBUG.jsonl` and `SURGERY_LOG.jsonl` from `~/.claude/skills/` if you want the local
logs gone.

**Direct clone (the maintainer's dev machine only):**

```bash
git clone https://github.com/randommonicle/claude-skills.git ~/.claude/skills
```

Then copy the NORMS.md block into `~/.claude/CLAUDE.md` and install the hooks per
[hooks/HOOKS.md](hooks/HOOKS.md). This mode is for editing the skills; a machine on this
mode must NOT also install the plugin.

