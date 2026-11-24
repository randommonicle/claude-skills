# claude-skills

## What this is

A set of guardrails for [Claude Code](https://claude.com/claude-code), the AI coding tool. Each
one is a short rule that Claude loads by itself, at the moment it is about to do the thing that
rule covers. Almost every one exists because that mistake already shipped on a real project.

Each rule came from the lessons-learned records of four production codebases. One of them is a
regulated UK property-management platform, so the examples are concrete and a few are specific to
that field. Install the lot, fork it, or read two and borrow the ideas.

If you only read two, read [`verify-the-effect`](verify-the-effect/SKILL.md) and
[`prove-it-can-fail`](prove-it-can-fail/SKILL.md). The first says a command that exits without an
error has not proved anything worked. The second says a test that can never fail is not testing
anything.

Four kinds of thing live here.

- Skills are short playbooks Claude reads at the right moment. The table below lists all 60.
- Hooks are small scripts that run automatically around what Claude does. One stops and asks you
  before Claude uploads any code to GitHub. One checks a file Claude has just edited, using
  whatever checker that project already has. One tells Claude what has changed in your project
  since you last worked on it, so it starts from an up-to-date picture.
- Norms are six one-line rules that apply in every session, listed in [NORMS.md](NORMS.md).
- Agents are reviewers Claude can hand a change to for a second opinion, listed under
  [Agents](#agents).

It installs once per machine and applies to every project on it. Day to day, it runs by itself.
The only parts you run by hand are the learning loop tools, covered in
[Keep it learning](#keep-it-learning-run-your-own-loop).

## Install

About five minutes.

1. Install Claude Code, [git](https://git-scm.com/) and [Node.js](https://nodejs.org/). For the
   checks that read your project's state, also install the [GitHub CLI](https://cli.github.com/)
   and run `gh auth login`.
2. In a Claude Code session, run `/plugin marketplace add randommonicle/claude-skills`, then
   `/plugin install ash@ash-skills`.
3. Check it worked. `/plugin` should list the plugin. Then ask Claude to do something a skill
   guards, such as writing a test. You should see it load that skill.
4. Optional: the two-model code review (`cross-agent-review`, where Claude has Gemini and GPT
   argue over a change) needs the `agy` and `codex` command-line tools and one settings file.
   The steps are in [cross-agent-review/SKILL.md](cross-agent-review/SKILL.md).

Before you install, read [What installing changes](#what-installing-changes). One hook asks for
confirmation on every push, and you may not want that.

Afterwards you will notice:

- a confirmation prompt before Claude pushes anything;
- a short note about your project's state at the start of each session;
- a report when Claude edits a JavaScript or TypeScript file in a project with a checker set up;
- Claude loading a named rule before it writes a test, changes a database or calls an AI model.

Where to find things:

- the skills: the table below;
- the agents: [agents/](agents/);
- what each hook does: [hooks/HOOKS.md](hooks/HOOKS.md);
- what went wrong on real jobs: [LESSONS_LEARNED.md](LESSONS_LEARNED.md);
- standing choices and why: [DECISIONS.md](DECISIONS.md);
- how the library checks itself: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md);
- house rules for changing it: [CONTRIBUTING.md](CONTRIBUTING.md).

## Keep it learning: run your own loop

The skills here are a snapshot of what went wrong on our projects. Your projects will go wrong in
their own ways. This library is built to learn from that, and you can run the same loop on your
own work.

The loop has four steps.

1. **Record what loads.** A hook logs every skill Claude loads. This happens by itself.
2. **Record what went wrong.** When a mistake ships, you write it up in your project's lessons log
   and name the skill that should have caught it.
3. **Compare the two.** A script lines up what loaded against what was missed.
4. **Sweep.** Every few weeks, Claude reads the misses and proposes fixes. You decide what goes
   in.

### Step 1: the fire log

Nothing to set up. Every time a skill loads, `skill-fire-log.mjs` adds a line to
`~/.claude/skills/FIRE_LOG.jsonl`. It works the same in plugin and direct-clone installs. The file
stays on your machine.

The log has blind spots. The six norms are always on, so they never "load". The hooks act without
loading anything. A skill Claude applies from what it already knows leaves no line either. So a
skill with no fires has not necessarily gone unused. Treat a zero as a question to look into.

### Step 2: a lessons log in each project

In each project, keep a file at `docs/LESSONS_LEARNED.md`. Add an entry whenever something ships
broken, or nearly does. End every entry with one line in this exact form:

```markdown
## 12. The invoice total was right on screen and wrong in the export

**What happened.** ...

**The lesson.** ...

**How to apply.** ...

skill that should have prevented this: trace-one-record
```

That last line is what the script reads. It accepts three shapes:

- one skill: `skill that should have prevented this: trace-one-record`
- several, split by a slash: `skill that should have prevented this: plan-first / blast-radius-grep`
- none fits: `skill that should have prevented this: none, new candidate (invoice-export-check)`

Put a short note in brackets after a skill name if it helps; the script ignores it. In the "none"
shape, the name in brackets becomes the proposed name for a new skill.

Write the entry the day it happens. A week later the detail has gone.

### Step 3: compare loads against misses

The comparison script is `hooks/audit-fires.mjs`. Plugin installs keep their copy in Claude Code's
plugin cache, so the simplest way to run it is from a clone kept anywhere:

```bash
git clone https://github.com/randommonicle/claude-skills.git ~/claude-skills
node ~/claude-skills/hooks/audit-fires.mjs --repo ~/projects/app-one --repo ~/projects/app-two
```

Pass one `--repo` for each project with a lessons log. The script reads
`docs/LESSONS_LEARNED.md`, or `LESSONS_LEARNED.md` at the project root if there is no `docs/`
copy. On a direct-clone install, use
`~/.claude/skills/hooks/audit-fires.mjs` instead. The script changes nothing. It prints four
sections:

1. how often each skill loaded;
2. skills that never loaded, each tagged with any reason a zero is expected;
3. misses per skill, plus the new candidates;
4. a summary, including the skills that appear in both logs.

How to read it:

- If a skill loaded often and was still missed, its rule is too weak. Strengthen it.
- If a skill was missed and never loaded, the rule may be right but it never reaches Claude at
  the right moment. Fix its description so it triggers, or back it with a hook.
- If the same new candidate turns up in two or more projects, that is a strong case for a new
  skill.
- If a skill never loaded and was never missed, consider pruning it, unless its tag explains the
  zero.

### Step 4: the sweep

Open Claude Code in your copy of the library and ask for a sweep. For example:

> Run a misses-log sweep. Read every lessons log entry written since the last sweep in these
> repos: (list them). Read each entry in full. For each miss, grep every SKILL.md and hooks/ to
> check whether a rule already covers it. Group what is left into new skills, upgrades to existing
> skills, and project-only rules. Write the proposals to docs/SKILL_PROPOSALS_(date).md. Build
> nothing yet.

[docs/SKILL_PROPOSALS_2026-11-01.md](docs/SKILL_PROPOSALS_2026-11-01.md) is a real sweep to copy
the shape from. It ranks proposals in three tiers, and lists what it rejected and why.

Then you choose. Build each accepted proposal on its own branch, with its tests, and run
`node hooks/check-index.mjs` before you merge. A new skill also needs a row in the table below
and the skill count updated in three places; the check tells you if one is missing.

Two rules keep the loop honest:

- **You make the decision.** Claude proposes; a person admits each change. A skill is an
  instruction Claude will follow in every project, so nothing goes in unread.
- **Lessons specific to one project stay in that project.** Put them in the project's own
  `.claude/skills/` folder. The [`skill-library-builder`](skill-library-builder/SKILL.md) skill
  covers how.

### Making the library your own

To change skills for yourself, fork this repository and install from your fork:

```
/plugin marketplace add <your-github-name>/claude-skills
/plugin install ash@ash-skills
```

Install from your fork or from this repository, not both. Pull changes from here into your fork
when you want them.

To keep a plugin install up to date, run `/plugin marketplace update ash-skills`. A direct clone
can update itself on a schedule with `hooks/update-skills.mjs`; the setup is in
[hooks/HOOKS.md](hooks/HOOKS.md).

## Skills

The library is split into four layers so 60 skills coexist without Claude confusing one for
another:

- Hooks ([hooks/HOOKS.md](hooks/HOOKS.md)) are scripts that enforce a rule every time, with no
  judgement involved. They include the push gate, the destructive-SQL gate, a guard that blocks
  commands which would print a secret, a guard that blocks killing processes by name, the fire
  log, the session-start check, and warnings for moments a skill cannot spot by itself, such as
  adding a scheduled job or writing a migration.
- Norms ([NORMS.md](NORMS.md)) are six one-line rules loaded into every session. Each points at
  the skill that explains it.
- Hubs are skills that own a moment in the work, such as planning, testing or calling something
  done. Each has a table pointing to the narrower skills it relies on.
- Leaves are narrow skills with their own trigger words. Each states what it does not cover.

The design and its review are in
[docs/SKILL_PROPOSALS_2026-07-23.md](docs/SKILL_PROPOSALS_2026-07-23.md) and
[docs/REVIEW_2026-07-23_skill_proposals.md](docs/REVIEW_2026-07-23_skill_proposals.md). A lesson
becomes a skill when the same mistake turns up in more than one project.

| Skill | Layer / role | What it does |
|-------|--------------|--------------|
| **verify-the-effect** | norm + playbook | Never conclude success from a proxy signal; assert the actual effect or artifact. |
| **live-state-first** | norm + playbook | Probe live state before building from any described state; the catalog settles disagreements. |
| **no-silent-data-drop** | norm + playbook | Filters and gates hide empty things, never drop content; clamp model-emitted routing keys. |
| **honest-failure-surfacing** | norm + playbook | One message per failure mode; pressable controls that explain; error level for terminal states only. |
| **prove-it-can-fail** | norm + hub (tests/checks) | Every test, seed, gate, or check must demonstrably be able to fail. Routes: safe-smokes, mass-red-triage, prove-it-can-pass. |
| **prove-it-can-pass** | leaf (routed by prove-it-can-fail) | The other half of a gate: prove it lets real innocent input through and catches the violating forms nobody pictured. Real corpora not invented ones, your own mandated command shapes, the domain's ordinary vocabulary, recoverable refusals, and a curated list checked for omissions. |
| **findings-are-evidence** | norm + playbook | Agent/reviewer reports are evidence, not findings; re-derive Critical/High and regulatory claims. |
| **one-real-ride** | hub (done gate) | One real end-to-end invocation through the real seams before "done". Routes: verify-the-effect, email-delivery-verification, env-change-verification, reproduce-the-real-build. |
| **parallel-work-recon** | hub (session boundary) | Fetch/PR/log recon at session start AND pre-commit; identifier claims scan all refs; worktree path discipline. |
| **plan-first** | hub (plan gate) | File list, test list, out-of-scope before code; plan step zero is a grep. Routes: blast-radius-grep, enforce-invariants-in-build, flag-deferred-items. |
| **db-migration-verification** | hub (schema work) | Post-apply catalog verification plus the full cross-repo trap bundle (FK embeds, live definitions, privileges read-back, verbatim re-issues). Routes: live-data-surgery, blast-radius-grep. |
| **ai-surface-discipline** | hub (LLM surfaces) | Input minimisation, output discipline, human gate, rules-bind-in-the-prompt pillar, guard hardening. Routes: no-silent-data-drop, guard-the-spend-paths, outbound-side-effect-idempotency. |
| **verified-citations** | hub (citing docs) | Quoted-line citations, provenance by command, statutory facts against primary sources. Routes: deliverable-integrity, substantiate-outward-claims, handover, legal-citation-integrity. |
| **blast-radius-grep** | leaf (Tier 1) | The unit of change is the action or fact; grep app, tests, seeds, branches, and built output; drift-check denormalised copies. Completion gate: an errored sweep found nothing, and never truncate a matched line below the match. |
| **enumerate-the-set** | leaf (Tier 1) | Blast-radius-grep's twin: it enumerates the places a fact lives, this enumerates the members a change must decide. List fields, kinds, statuses, legs, exit paths and anchors from their source, decide each one in code and in a test, give every start an end, and ask a reviewer which member is uncovered. |
| **trace-one-record** | leaf | Two correct figures can make a wrong total: name what each source contains and trace one record end to end through both before combining them; a stated check is not a performed check. |
| **env-change-verification** | leaf (Tier 1) | An env change is not live until the reading artifact is rebuilt/redeployed; validate the value, not its presence. |
| **enforce-invariants-in-build** | leaf (Tier 1) | A rule, prerequisite, permission or expiry that exists only in prose is a comment; back it with a test, constraint, trigger, preflight check or dated owner. |
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
| **unordered-events** | leaf | Webhooks and queues arrive in any order: guard each status write by the states it may move from, test every (event, state) pair, and answer a missing prerequisite retryably. |
| **pin-to-what-was-seen** | leaf | An action on displayed state sends that state; the server compares-and-sets on it (409 on a change); a 409 or an answer in doubt closes the editor and redraws; two remedies share one predicate. |
| **fixtures-from-reality** | leaf | Fixtures recorded from the pinned provider version, fakes that carry the service's failures, setups by production's path, real output fed across seams, and each claim's runtime named. |
| **measure-per-route** | leaf | A measured platform fact holds for the route, build, timing and machine it was measured on; measure again elsewhere, compare whole ranges, subtract the environment, prove a stop by its effect. |
| **spawn-from-declared-state** | leaf | A spawned child inherits settings, CLAUDE.md, auto-memory, tokens and its parent's lifetime unless the launch declares otherwise; check what it loaded before its output reaches anyone. |
| **instrument-reports-itself** | leaf (routed by honest-failure-surfacing) | A broken instrument keeps producing readings: make failure a distinct value, never a sentinel, zero or an absent key; one message per terminal unattended failure, sent before it is marked handled; check as often as the thing can fail; alarm on no result at all. |
| **tool-layer-bytes** | leaf (with a hook) | Code with backslashes goes to disk through the Write tool, never a heredoc or `-e`/`-c` string; no `sed -i` on CRLF checkouts; prove the bytes after any scripted edit. |
| **date-parse-utc-safe** | leaf (micro) | Parse date-only strings as explicit local components; UTC runtimes render the previous day. |
| **constant-time-secret-compare** | leaf (micro) | Hash then timingSafeEqual for any secret comparison. |
| **secrets-in-output** | leaf + hook (`secret-echo-guard.mjs`) | Nothing that can carry a secret value reaches a tool result: presence and length only, names not values, .env by its keys, provider status and API responses captured and allowlisted; the hook denies the command shapes that print one. |
| **dependency-upgrade-verification** | leaf (micro) | npm pack both versions and diff the deciding file when runtime data can't distinguish success from failure. |
| **safe-smokes** | leaf (routed by prove-it-can-fail) | Never destructive against shared data in tests; flip-and-restore; teardown asserts its row counts. |
| **confirm-before-push** | policy behind the push-gate hook | Per-action authorisation for pushes, merges, and remote branch deletion, with the deletion preflight. |
| **flag-deferred-items** | leaf | Grep-able anchors at the deferred work's landing site; .fixme() carries the anchor; dormant controls say so. |
| **checkpoint-log** | leaf | Per-commit checkpoint notes in a committed WORKLOG.md for multi-commit units; close with an explicit checklist walk, wiring steps included. |
| **handover** | leaf | Structured handover from a real context reading (/context, or the desktop app's get_usage tool), or an honestly recorded gap where neither exists; supersession stamps; carry-forwards cite live state. |
| **team-loop** | leaf (candidate) | The team-lead loop. Stage 1: team/NOW.md as an overwritten resume board that session-recon checks against git, one Ask queue per project (a private claude.ai board for unregulated projects, team/ASK.md for regulated ones) read at every start, and effort pins on agents. Stage 2, per project: the tl- role agents, a board of work packages, a living spec, a ledger, and a gate script that decides a merge from git and the package's own checks. |
| **committee-review** | process | Three-lens review with shared evidence, attribution-stripped consolidation, and voting. |
| **cross-agent-review** | process | Adversarially review a scoped change/design/finding by debating one or more independent AI agents (Gemini via the agy CLI or GPT via the codex CLI, driven by Claude itself with no pasting; or a chat you drive; several seats at once) over a shared file relay, grounded in live read-only evidence; converge or two positions. |
| **skill-library-builder** | process | Turn a repo into a project-specific skill library; skills encode mechanical steps, not awareness. |
| **contract-review** | leaf (domain) | Review a contract or lease for one named party; every graded finding quotes its clause, caps and exits are read with their interacting clauses, and statutory points go to a verification list unless retrieved. Fork, see its `UPSTREAM.md`. |
| **legal-citation-integrity** | leaf (routed by verified-citations) | Audit every citation in a finished or received legal document; extracted count must equal table rows, and Confirmed needs a named retrieval. Fork, see its `UPSTREAM.md`. |
| **statute-to-obligations-register** | leaf (domain) | Turn a statute, regulation or code into an obligations register read from the current official text; no empty cell, every extracted item accounted for, commencement status from the page. Fork, see its `UPSTREAM.md`. |
| **legal-notice-handling** | leaf (domain) | Draft, reply to, or analyse a legal notice; every deadline a calendar date with its arithmetic, every threatened consequence confirmed and lawfully available, every admission of fact kept apart from the legal conclusion. Fork, see its `UPSTREAM.md`. |
| **ai-surface-discipline / unslop-ui / unslop-text / unslop-code** | see rows above / forks | The three **unslop-\*** skills are forks of [JCarterJohnson/vibecoded-design-tells](https://github.com/JCarterJohnson/vibecoded-design-tells) with local patches. See each skill's `UPSTREAM.md`. |

## Agents

Reviewers in [agents/](agents/) that Claude can hand a named change to for a second opinion.
Each returns a verdict and findings ranked by severity, with `file:line` evidence. They recommend
changes and never make them. With the plugin installed they sit under its name, so you can call
one directly, for example `@agent-ash:property-reg-reviewer`.

| Agent | What it reviews |
|-------|-----------------|
| [code-reviewer](agents/code-reviewer.md) | A specific diff or file, as an independent second opinion on correctness, security, failure modes and test adequacy. |
| [property-reg-reviewer](agents/property-reg-reviewer.md) | A change touching service-charge maths, demands, client money, leaseholder-facing output, retention or erasure, or AI surfaces, against LTA 1985, the RICS Service Charge Code, TPI, BSA 2022 and UK GDPR. Run it as well as code-reviewer on regulated changes. |

Stage 2 of the **team-loop** skill adds four role agents. These four build and
research. Each is pinned to a model, an effort level and a turn limit, and none can start agents of
its own.

| Agent | What it does |
|-------|--------------|
| [tl-researcher](agents/tl-researcher.md) | One topic, one `team/research/<topic>/FINDINGS.md`, with sources and options. |
| [tl-builder](agents/tl-builder.md) | An unregulated work package in its own worktree: tests first in their own commit, then the build when resumed. |
| [tl-test-writer](agents/tl-test-writer.md) | A regulated package's tests, from the spec, independently of the builder. |
| [tl-builder-regulated](agents/tl-builder-regulated.md) | A regulated package, built on top of the test writer's commit. |

## Lessons watch: knowing when a sweep is due

The skills here came from sweeps of the misses log: the `none - new candidate` lines that close
lessons entries no skill covered. Nothing said when the next sweep was due. The
[lessons-watch](lessons-watch/) tooling counts those lines across your repositories once a
week on GitHub Actions and keeps one issue current in a private repository of your own, so the
number reaches you with your computer off. It involves no model and installs nothing by itself:
you opt in by creating the private repository and following
[lessons-watch/README.md](lessons-watch/README.md). An optional local step copies lessons
files that are not on GitHub into that private repository; it is off until you write its config.

## Install on a new machine

**Prerequisites.** Claude Code, `git`, and `node` on your PATH, since every hook is a Node
script. The session-start check and the push gate also use `git` and `gh`, so install the
[GitHub CLI](https://cli.github.com/) and run `gh auth login` if you want live repo state.

If a prerequisite is missing, the hook that needs it stays silent. That looks exactly like nothing
being wrong. If a hook seems to do nothing, check its prerequisite first.

### What installing changes

None of this is obvious once it is running, and the first item can interrupt you.

- **Thirteen hook scripts are wired**, listed in [hooks/HOOKS.md](hooks/HOOKS.md).
  - Two ask before acting. `push-gate` stops `git push`, `gh pr merge` and remote branch deletion
    for your confirmation. `sql-surgery-warn` does the same for destructive SQL. If you do not
    want a prompt on every push, skip the plugin and take the skills only.
  - Two refuse outright. `secret-echo-guard` blocks a command that would print a secret value.
    `kill-guard` blocks killing a process by name or pattern, such as `pkill` or
    `Stop-Process -Name`. Killing by process ID still works.
  - The rest only warn or report.
- **At the start of every session, a hook runs `git fetch` and `gh pr list`** in your repo and
  passes the result to Claude. That is network activity on your own credentials, with no prompt.
  It is the only network activity any hook performs.
- **The fire log records each skill that loads**, with its arguments and your working folder, in
  `~/.claude/skills/FIRE_LOG.jsonl`. Event shapes it does not recognise go to
  `FIRE_LOG_DEBUG.jsonl` beside it. Both stay on your machine and are never sent anywhere. Delete
  them, or remove the hook, if you would rather not keep them.
- **The six norms are added to every session** as instructions, per [NORMS.md](NORMS.md).
- **Nothing in [lessons-watch](lessons-watch/) runs unless you set it up.** It is not a hook.
  Its optional `mirror.mjs` is the one script in this library that sends file content off the
  machine (the lessons files you name, to the private repository you name), and with no config
  file it does nothing and says so.

### Two ways to install

Pick one per machine. Using both registers every skill twice and fires every hook twice.

**Plugin (recommended).** Skills, hooks, norms and agents in one step:

```
/plugin marketplace add randommonicle/claude-skills
/plugin install ash@ash-skills
```

The repository doubles as a plugin marketplace (`.claude-plugin/marketplace.json`). The plugin
serves the skills from the repo root, loads the agents from `agents/`, wires the hooks through
`hooks/hooks.json`, and adds the norms at each session start through `hooks/norms-inject.mjs`.
You do not edit `CLAUDE.md` or `settings.json` by hand. The repository is public, so no
credentials are needed.

To check it worked, run `/plugin` in a session and confirm the plugin is listed. Then ask Claude
to write a test and watch for it loading a skill. If skills load but you never see a push prompt
or a session-start note, the hooks are the part that did not install.

To remove it, run `/plugin uninstall ash@ash-skills`. Then delete `FIRE_LOG.jsonl`,
`FIRE_LOG_DEBUG.jsonl` and `SURGERY_LOG.jsonl` from `~/.claude/skills/` if you want the local
logs gone.

**Direct clone.** For editing the library itself:

```bash
git clone https://github.com/randommonicle/claude-skills.git ~/.claude/skills
```

Then:

1. Copy the block in [NORMS.md](NORMS.md) into `~/.claude/CLAUDE.md`.
2. Install the hooks as set out in [hooks/HOOKS.md](hooks/HOOKS.md).
3. Copy the agents to where Claude Code reads them, which is outside the clone:

   ```bash
   mkdir -p ~/.claude/agents && cp ~/.claude/skills/agents/*.md ~/.claude/agents/
   ```

Copy the agents again after pulling a change to one. The session-start check names any copy
that is missing or out of date.

To check a direct clone, run:

```bash
node ~/.claude/skills/hooks/check-index.mjs
```

It should print `ok: 60 skills, all indexed, ...` and exit with code 0.

## Licence

This repository is licensed under Apache-2.0 (see `LICENSE`). Seven skills are forks and keep
their upstream's terms, recorded in each one's `UPSTREAM.md`: the three `unslop-*` skills and the
four legal skills (`contract-review`, `legal-citation-integrity`,
`statute-to-obligations-register`, `legal-notice-handling`). The unslop skills also carry a
`LICENSE` file, which goes into their `.skill` archives. `hooks/check-licences.mjs` fails the
build if a fork loses its notice.
