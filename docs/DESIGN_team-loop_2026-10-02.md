# Design note: a team-lead loop for Claude Code, built from what this library already has

Status: **proposal, revision 4, not built; the review converged on it.** Written 2026-10-02 in
response to a Reddit post describing an "agent teams" workflow (product owner, orchestrator,
pinned sub-agents, all state in files). Revisions 2 to 4 follow review rounds 1 to 3; section 11
lists what changed and why. Section 6, artifacts as the operator's surface, was added at the
operator's request.

Review record: `docs/REVIEW_team-loop_2026-10-02.md`, copied from the gitignored exchange file when
this note was committed. Handover: `docs/HANDOVER_team-loop_2026-10-02.md`. Seats: GEMPRO (Gemini
through `agy`) and OPUS (a Claude Opus subagent). GPT was
planned and hit its usage limit before its first turn; OPUS replaced it on the operator's
instruction. OPUS shares the hub's model family, so that seat is less independent than GPT would
have been.

Plan-first close: this is a design document, so no code, no tests and no new dependencies.
Line citations into `commission-the-roster` are to `main` at ba7ef3e; open PR
randommonicle/claude-skills#3 adds seven lines to that file and will shift some of them.

---

## 0. The answer

- **Build our own, in two stages.** Most of the post's discipline already exists here, and in
  three places it is stronger: review by an independent model family, gates enforced by hooks, and
  measured cost data. What this library lacks is the operating layer: a standing per-project state
  layout, a defined loop with named gates, and role agents pinned to model and effort.
- **Stage 1 is the state layer and the operator's surface:** `team/NOW.md`, a resume board the
  handover skill overwrites; an **Ask board**, a private claude.ai artifact holding the operator's
  decision queue for unregulated projects, answerable from a phone (a regulated project keeps its
  queue in `team/ASK.md`, inside the repo's own boundary); and effort pins on the agents that
  already exist.
- **Stage 2 is the loop:** four role agents, a board, briefs, a ledger and a gate script, piloted
  for one milestone on one non-regulated project, and kept only if the ledger and the operator's
  time say it paid.
- **Contracts ship centrally, state stays local.** Rules and role agents ship in the plugin. Each
  project holds its state under `team/`. The Ask board is the one piece of state outside the repo,
  and it holds only open questions; every answer is recorded in the repo.
- **Mechanism: subagents with `isolation: worktree`**, driven by the main session as lead. Not the
  experimental agent-teams feature, for the four reasons in section 5.4.
- **At most two builders at once**, and only when they share no files and no stateful resource
  such as a local database.

## 1. What the post describes

The human is product owner: picks topics, answers decision rounds, reviews builds, releases.
No design, no code. Each project has a team lead (orchestrator, Opus at high effort) that
researches, designs, plans, writes briefs, gates and merges, keeps every record, and never grades
its own work. Team members are sub-agents pinned to a model and effort (test writer, implementer,
reviewer, researcher, cleanup), one work package each, each in its own git worktree, at most four
at once, never touching main.

All state lives in the repository: a design document with numbered revisions and its decision
history, one research folder per topic, milestones and briefs with a kanban board as files, a
resume board so "continue" works in a new session, and a to-do file holding only the human's
decisions and reviews. The loop for every topic is: pick, research, decide, revise the design,
write tests then code, review against the design, gate and merge, human review, release. Review
notes seed the next round. Every few milestones an optimisation round looks at spend; a new model
triggers a comparison round.

A separate process-template team maintains a versioned skeleton (structure, agent definitions,
process contracts, install and upgrade docs). Projects install and upgrade from it; project
changes that generalise are ported back after cross-validation and the human's decision. Teams
hand work to each other through inbox folders.

## 2. The post: what holds, what does not

**What holds, and is worth taking:**

1. **Research, then a decision round, before any build.** It puts the human's judgement at the
   cheapest point, before tokens are spent on the wrong thing.
2. **A resume board that is overwritten.** "Continue" reads one short file. PropOS today has 147
   `HANDOVER_*` files on `origin/main` (e883ca3, 400 docs in total): the history is kept and the
   current state has to be reconstructed each time.
3. **Archive the history, keep the decision.** The same 147 files are the cost of not doing this.
4. **Scheduled optimisation and comparison rounds.** This library prices spend (`price-the-spend`)
   only when something triggers it. Nothing schedules it.
5. **Briefs carrying facts, owned files and how the work is judged, paired with effort pins.** The
   brief matches `commission-the-roster` Rule 3. On this library's data the brief is the larger
   lever: a mid-tier agent told to derive things itself cost 2.1x a strong-tier agent handed
   verified facts (commission-the-roster/SKILL.md:151). Nothing here pins effort, so on the smaller
   lever the post is ahead.
6. **A cap of four members at once.** It is compatible with this library's tighter rule of at most
   two builders producing mergeable changes (commission-the-roster/SKILL.md:175); the other two
   slots can research or review.

**What does not hold, on this library's evidence:**

1. **Same-family review.** The post's reviewer is another Opus. `cross-agent-review` exists
   because independent families find different things, and its own text warns that agreement
   between models is often a shared blind spot (cross-agent-review/SKILL.md:195). Regulated gates
   need a second family.
2. **The numbers.** "90k input, 25m output, 7.1b cache reads" omits cache writes, so it cannot be
   priced or compared with anything here. Read it as anecdote. The robust signal is the ratio,
   about 280 tokens re-read for every token written: context re-sent turn after turn, across every
   agent. That is the multiplier `commission-the-roster` calls context per agent turn, and it
   argues for small contexts everywhere, the lead's included.
3. **The orchestrator merges.** In a regulated repo, merging to `main` and pushing stay the
   operator's per-action call (`confirm-before-push`, enforced by `push-gate`). The lead merges
   only into a local milestone branch.

**A constraint here, rather than a flaw there:** 33 decision rounds and 25 build reviews in seven
days is about eight operator touchpoints a day. Whether that fits alongside a day job is the
operator's call, so the design assumes nothing: decisions are queued and answered in batches, from
a phone if need be (section 6), and a topic with an open decision is parked while other work
continues.

**Outside evidence, checked 2026-10-02.** Two findings bear directly on this design:

- A study of 724 interrupted coding-agent tasks found that handoffs carrying context cut the
  successor's median actions by 20 to 59% and its prompt tokens by 42 to 63%, against taking over
  from repository state alone ("Handoff Debt", arXiv 2606.02875, revised 2026-08-30). That is the
  case for a resume board, measured.
- Claude Code's costs page puts agent teams at about 7x the tokens of a standard session when
  teammates run in plan mode, and recommends Sonnet for teammates.

**Comparable published methods** (licences and releases from the GitHub API, 2026-10-02):

- **Superpowers** (`obra/superpowers`, MIT, v6.4.2): design doc, plan, a fresh implementer per
  task, review per task and at the end, in a worktree. The closest match to the post's loop, and
  worth reading before stage 2 for its per-task review mechanics.
- **oh-my-claudecode** (MIT, v5.6.0): a plan, execute, verify and fix pipeline with a model pinned
  per agent file.
- **Spec Kit** (`github/spec-kit`, MIT, v1.1.0): constitution, spec, plan, tasks, implement, with
  versioned releases and an upgrade command. The closest to the post's template with an upgrade
  path.
- **BMAD Method** (v6.12.0; the API reports no licence identifier): role agents and workflows as
  skills.

None documents the post's port-back loop, which this library already runs. None is worth adopting
whole: each brings its own state layout and conventions, and the value here is in the gates and
the evidence behind them. The Reddit thread itself could not be reached, so its comments are not
reflected here.

## 3. What exists here already, and the gaps

| Post element | Existing here | Gap |
|---|---|---|
| Lead never grades its own work | `findings-are-evidence` norm; `code-reviewer`, `property-reg-reviewer`; `cross-agent-review` | No standing gate tying review to merge |
| Briefs: facts, owned files, how judged | `commission-the-roster` Rule 3 brief (FACTS, RE-DERIVE ANYWAY, BUDGET, DELIVERABLE, OUT OF SCOPE) | No path-glob scope and no "judged by" line |
| Members pinned to model and effort | `~/.claude/agents` and PropOS agents pin `model` only | No effort pins. PropOS `backend` (migrations, RLS, triggers) is `model: sonnet` on `origin/main`, against Rule 2's strong tier for regulated build |
| Own worktree, never touch main | `parallel-work-recon`; `push-gate`; cap of two builders | None |
| Design doc with numbered revisions | `DESIGN_*`, `SPEC_*`, `DECISIONS.md` | No single living spec with a revision number |
| Plan, board, briefs as files | `PLAN_*`, `checkpoint-log` WORKLOG | No board holding work-package status |
| Resume board | `handover` skill, `session-recon` hook, auto-memory | Handovers accumulate; nothing is overwritten |
| Human's to-do: decisions only | Questions asked in chat; "prompt me to update DECISIONS.md" | No persistent queue; an unanswered question dies with the session |
| Time and token tracking | `price-the-spend` after each action | No per-package ledger |
| Optimisation and comparison rounds | `price-the-spend`, `context-economy` | Not scheduled; no comparison round at all |
| Process template, versioned | The plugin; `NORMS.md` versioned block (NORMS.md:11); drift check in `session-recon` | Ships rules, not a project skeleton |
| Port changes back after cross-validation | LESSONS entries with a misses line; "recurrence across repos is the admission criterion" (README.md:65); `committee-review` | None. This is the post's loop, already formal |
| Inboxes between teams | `exchange/` relay for reviews | No cross-project inbox (deferred, section 9) |

## 4. Stage 1: the state layer

It works in any project, with or without agents.

**`team/NOW.md`, written by the handover skill.** Overwritten, never appended, at most 40 lines:
the current milestone or topic, the next action, in-flight work with exact `file:line` ranges,
deferred items with their grep anchors, verification still outstanding, the Ask board's link, the
branches in play (until stage 2 moves them to BOARD.md), and a `template:` version line.

- **The handover skill keeps every duty.** It still fires when a long session ends deliberately
  (handover/SKILL.md:14), and it still sweeps traps into `LESSONS_LEARNED.md` before finishing
  (handover/SKILL.md:76). What changes is where a routine note lands: in NOW.md, overwritten,
  instead of a new dated file. A dated `HANDOVER_*` file is kept for an unusual end: context in
  the amber or red band, a crash, a move to another machine. Stage 1 therefore edits the handover
  skill.
- **NOW.md is described state.** Under `live-state-first`, a session that reads it checks it
  against git first. `session-recon` can do that mechanically: NOW.md's age in commits, and
  whether each branch it names still exists.

**The Ask board.** The operator's queue of decisions and build reviews, held in a private artifact
and specified in section 6. A decision, once answered, is recorded in `DECISIONS.md`. A build
review is not a decision and never goes there: its answer goes on the package's ledger line in
stage 2, or on the PR in stage 1. A regulated project, PropOS included, keeps the queue in
`team/ASK.md` with the same item shape: on a board, regulated content would sit in a new place
guarded only by a prose rule (round 3). One or the other per project, never both.

**Effort pins** on the agents that already exist: `code-reviewer`, `debugger`, `refactorer`,
`property-reg-reviewer`, and PropOS `backend`, `frontend`, `test`. PropOS `backend` also moves to
the strong tier for regulated work, or splits into a regulated and an unregulated agent.

**What stage 1 ships:** the `team-loop` skill (name provisional) holding this section, a NOW.md
template, the handover skill edit, the NOW.md check in `session-recon` (the only code), and the Ask
board page. A resume board that can go stale without anyone noticing is exactly the failure
`live-state-first` exists for, hence the check.

## 5. Stage 2: the loop

### 5.1 Roles

| Role | Agent | Model | Effort | Tools | Isolation | Used for |
|---|---|---|---|---|---|---|
| Lead | main session | Opus 5.5 | high (session) | all | none | strategy, briefs, gates, line review of unregulated diffs, milestone summaries |
| Researcher | `tl-researcher` | sonnet | medium | Read, Grep, Glob, WebSearch, WebFetch, Write | none | one topic, at most two at once |
| Builder | `tl-builder` | sonnet | medium | Read, Edit, Write, Glob, Grep, Bash | worktree | an unregulated package; writes the tests first in their own commit, stops for the lead's review, builds when resumed |
| Test writer | `tl-test-writer` | sonnet | medium | as builder | worktree | regulated packages only: tests derived from the spec, independently of the builder |
| Regulated builder | `tl-builder-regulated` | opus | high | as builder | worktree | a regulated package |
| Reviewers | `code-reviewer`, `property-reg-reviewer`; `cross-agent-review` seats | as defined | | Read, Glob, Grep, Bash | worktree, detached at the package head | regulated packages only; they return findings and the lead writes the verdict file |

The post's cleanup role is dropped: a cleanup item becomes an ordinary package with a builder, so
it passes the same gate and cannot reach a regulated path unreviewed.

Six rules make the table enforceable:

- **No role lists `Agent` in its tools.** Subagents can otherwise spawn their own, up to three
  levels deep (sub-agents doc). Removing the tool makes "no sub-delegation"
  (commission-the-roster/SKILL.md:56) structural.
- **Every role sets `maxTurns`.** The harness stops the agent and returns its output marked
  partial (sub-agents doc). The roster skill says the only real ceilings are one the harness
  enforces or a scope too small to overrun (commission-the-roster/SKILL.md:245). `maxTurns` is the
  first kind, and the skill does not yet name it.
- **Names carry a `tl-` prefix, and a new check reports shadowing.** Definitions resolve by name:
  project over user over plugin (sub-agents doc). The existing agent check in `session-recon`
  returns nothing under a plugin install (hooks/session-recon.mjs:61), which is where the loop
  runs, so it cannot be extended for this. A new check reports any project or user agent named
  `tl-*`, since either would silently replace the plugin's copy.
- **One source for model and effort: the agent's frontmatter.** The milestone roster restates them
  for approval. A model departure is a spawn-time override, stated in the roster and recorded in
  the ledger. Effort has no spawn-time override, so an effort departure is a separately named
  agent, never an edited copy.
- **The lead does not read the repository.** It reads briefs, findings, diffs and the gate
  script's output. Its context is billed at the highest rate and re-sent on every turn.
- **Unregulated packages get no spawned reviewer.** The lead line-reviews the diff and the gate is
  mechanical, as Rule 2 directs (commission-the-roster/SKILL.md:73-74). Milestone summaries are
  collation, which Rule 4 makes a lead turn (commission-the-roster/SKILL.md:165).

One rule stays prose until the later hooks exist: the researcher's `Write` is for its own findings
file only, and a tool allowlist cannot scope a path.

### 5.2 Project state

```
team/
  NOW.md              stage 1, as above.
  BOARD.md            every package: status, role, worktree branch, T, B, tested merge, test IDs, gate result.
  SPEC.md             the living design: one-line summary, revision number, revision log.
  LEDGER.jsonl        one line per finished package: roles, models, efforts, tokens, wall time, gate result, build review.
  packages/           WP-nnn.md, one brief per package.
  research/           <topic>/FINDINGS.md, one folder per topic.
  archive/            <milestone>.md, one summary per closed milestone.
```

Once BOARD.md exists, NOW.md stops listing branches and points at BOARD.md, so no fact lives in two
files. A project with a spec family already (PropOS has 24 `SPEC_*` files) points `SPEC.md` at it.
Each brief is the Rule 3 brief plus two lines: `SCOPE`, as path globs, and `JUDGED BY`, naming the
test IDs that decide it. **The lead commits SPEC.md and the briefs to the milestone branch before
spawning anyone**, because a worktree branches from the committed HEAD, not the working tree. At
milestone close the lead collapses briefs, findings and handovers into one archive summary;
decisions survive in `DECISIONS.md`; the rest leaves the tree (git keeps it).

### 5.3 The loop and its gates

| # | Step | Who | Artifact | Gate to pass |
|---|---|---|---|---|
| 0 | Pick a topic | operator | Ask board item, or chat | |
| 1 | Research | `tl-researcher`, at most two | `research/<topic>/FINDINGS.md` | |
| 2 | Decision round | lead asks, operator answers | Ask board item, then DECISIONS.md | operator's answer |
| 3 | Spec revision and plan | lead | SPEC.md rev n+1 and briefs, committed | |
| 4 | Milestone roster | lead publishes, operator approves | the roster table: package, role, model, budget, scope, artifact | operator's yes in the session (Rule 1), never from the board |
| 5 | Tests first | regulated: `tl-test-writer`; unregulated: the builder, which stops after its tests commit | a commit of failing tests, pinned as T on the BOARD row by the lead from the tool result | the lead line-reviews the tests before any build starts |
| 6 | Build | `tl-builder` (resumed after step 5) or `tl-builder-regulated` | worktree branch; a regulated builder merges T first | |
| 7 | Review against the spec | regulated packages only: reviewers and cross-agent seats | verdict file, written by the lead | no open Critical or High |
| 8 | Gate and merge | lead, by script | gate result on the BOARD row; merge into the local milestone branch; ledger line; worktree and branch removed | below |
| 9 | Build to review | operator | Ask board item saying how to run it | operator's answer, recorded on the ledger line |
| 10 | Release | operator, in the session | push or PR merge | `push-gate` asks per action |

**The step 8 gate is a script the lead runs, never a reading of the builder's report.** A builder
with Bash can reset, rewrite and recommit, so nothing it reports about its own history proves
anything. T, the tests commit, is therefore pinned by the lead at step 5, from the tool result
that produced it (the test writer's, or the unregulated builder's before it is resumed), after the
lead has read the tests. Reading them is what catches a hollow test: one named for the hard case
that passes on any stub. Let B be the package base, `git merge-base <milestone> <head>`.

1. T is an ancestor of the package head (`git merge-base --is-ancestor T <head>`).
2. **Red at T:** every `JUDGED BY` test ID exists and fails. A test the brief names but nobody
   wrote fails this check, so the hard case cannot be left out.
3. **The tests were not weakened:** T's own test files are unchanged from T to the head
   (`git diff --quiet T <head> -- <T's test files>`); test config, fixtures and existing tests
   are unchanged from B, so a weakening made at or before T shows too; and the test-related
   `scripts` entries in `package.json` match B's, compared by key so a dependency bump is not a
   failure. A change that legitimately alters an existing test is named in the brief as
   `TESTS CHANGED`, approved by the lead at step 5 with the new tests, and exempted by exact
   path. Without that list, such a package could only pass by the lead overriding the gate.
4. **Green on the merge that will be committed:** in a scratch worktree, the package is merged into
   the milestone branch and that merge is committed; every `JUDGED BY` ID passes there, none is
   skipped, IDs are compared rather than counts, and the full suite passes. The lead then moves the
   milestone branch to exactly that commit (`git merge --ff-only <tested sha>`). If the milestone
   moved in the meantime the fast-forward refuses and the gate runs again, so no untested merge is
   ever committed.
5. For a regulated package, no open Critical or High in the verdict file. For a deployed surface,
   `one-real-ride` has been ridden.

The script writes T, B, the tested merge, the red and green test IDs and the result onto the
package's BOARD row. The gate starts only after the builder has finished and committed: a gate run alongside
the step it certifies sees an unfinished state, which is the rule open PR #3 adds to
`commission-the-roster`.

**Standing roles, approved roster.** The role table fixes model, effort and tools once per
project. The operator still approves each milestone's roster as one table, as Rule 1 requires; the
standing table makes that table formulaic, which is what makes it a ten-second approval.

**Concurrency.** Two packages run at once only when their `SCOPE` globs are disjoint and they share
no stateful resource: a local database, a fixed port, shared fixtures. A package that resets or
migrates a local database runs alone, since shared-database smokes serialise
(commission-the-roster/SKILL.md:176).

**Skip rule.** The loop is for topics. A one-commit fix runs as it does today.

**Rounds.** At every third milestone close, an optimisation round: `price-the-spend` over
`LEDGER.jsonl`, proposals filed on the Ask board. When a new model ships, a comparison round:
re-run two archived packages on the new model or effort; their tests are the oracle, and the
ledger lines from the first run are the baseline.

### 5.4 Mechanism, verified

**Subagents in worktrees work on this machine.** Probe, 2026-10-02, Claude Code 2.1.281, a
throwaway repository: a subagent spawned with `isolation: worktree` committed a file; the Agent
tool returned `worktreePath` (`.claude\worktrees\agent-<id>`) and `worktreeBranch`
(`worktree-agent-<id>`); the worktree and its commit stayed on disk afterwards. So the lead learns
the branch from the tool result. Per the worktrees doc, an unchanged worktree is removed
automatically and a changed one is kept until a periodic sweep can remove it without losing work;
isolation also blocks a subagent from editing or running git against the main checkout.

**Settings and habits the design depends on** (worktrees doc unless marked):

- **`worktree.baseRef: "head"` in each project's settings.** The default, `"fresh"`, branches
  every subagent worktree from the remote's default branch, so builders would never see the
  milestone branch's unpushed merges. With `"head"`, they branch from the lead's checkout, which
  sits on the milestone branch while it spawns. The probe had no remote, so this point is from the
  docs, not observed.
- **The test runner in the main checkout excludes `.claude/worktrees/`.** Otherwise a suite run in
  the main checkout collects every live worktree's copy of the tests. **Unverified per project:**
  check with the runner's list command before the pilot.
- **`.worktreeinclude` copies no secrets by default.** It can copy `.env` into every worktree,
  which multiplies where secrets sit (`secrets-in-output`). Tests run against non-secret config.
- **A worktree is a fresh checkout.** Each needs a dependency install before tests run. On Windows
  that costs minutes and disk per builder, and deep `node_modules` paths can exceed the path limit
  (`git -c core.longpaths=true`).
- **Windows-specific:** a "don't ask again" approval granted inside a worktree stays with that
  worktree on Windows, so builders prompt again. Pre-approve the build and test commands in the
  project's settings.
- **Reviewers that run tests do so in their own worktree,** detached at the package head
  (`git checkout --detach <branch>`), so the main checkout never leaves the milestone branch.
- **Unverified:** whether a builder stopped by `maxTurns` and then resumed keeps its worktree.

**Why not the experimental agent-teams feature** (agent-teams doc):

1. Teammates inherit the lead's effort, so per-role effort pins do not hold.
2. In-process teammates are not restored after a resume, and a session has one team. The loop
   depends on "continue" working in a fresh session.
3. Teammates message each other directly. `cross-agent-review` routes every spoke through the hub
   to stop bot-to-bot loops and runaway burn (cross-agent-review/SKILL.md:134).
4. The docs say it uses significantly more tokens, and a definition's `skills` field is not
   applied to a teammate.

Revisit if it leaves experimental status and gains per-teammate effort and resume.

**The Workflow tool comes later.** Plugins can ship `workflows/*.js` (plugin components doc).
Once steps 5 to 8 have run the same way for a milestone, they are a candidate for one saved
workflow, still run only on the operator's opt-in.

### 5.5 What ships where

**Stage 1, in the plugin:** the `team-loop` skill with section 4, the NOW.md template, the handover
skill edit, the NOW.md check in `session-recon`, and the Ask board page. **In each project:**
`team/NOW.md` and effort pins on its existing agents.

**Stage 2, in the plugin:** the loop section of the skill, the four `tl-` agents, the BOARD, SPEC
and LEDGER templates, the gate script, and the new shadowing check. **In each project:** the rest
of `team/`, `worktree.baseRef: "head"`, and the test runner's worktree exclusion.

**Later, only if the pilot earns them:** a scope guard (a PreToolUse hook denying an Edit or Write
outside the package's `SCOPE` globs), a SubagentStop check that the package's artifact exists, a
saved workflow for steps 5 to 8, a scaffold script once more than one project runs stage 2, and
the two later artifact pages in section 6. A subagent's own `hooks` frontmatter is ignored for
plugin agents (sub-agents doc), so both hooks would be global and keyed on the agent type.
**Unverified:** that the hook input carries the agent type reliably enough to key on.

**Upgrades.** Contracts live in the plugin, so most upgrades arrive without touching a project.
Port-back needs nothing new: the LESSONS misses line and the recurrence rule already do it.

## 6. Artifacts: the operator's surface

The loop's bottleneck is the operator's attention, and most touchpoints are short: pick an option,
approve a build, read a summary. A private claude.ai artifact puts those on any device, a phone
included, without opening a coding session. On this account (artifact runtime contract 0.2.66) a
page can hold a shared database that Claude seeds and reads (`db`, through the ArtifactData tool),
carry comment threads Claude can read and answer (`comments`, through ArtifactComments), save new
versions of itself (`artifact`), and tell who is viewing (`user`).

**Three uses, in order of value:**

1. **The Ask board (stage 1, unregulated projects).** One private page whose database holds every
   open item across those projects, each row tagged with its project: the question, the options, a
   recommendation, the evidence path, and what it blocks. The lead writes an item once and never
   edits it; a changed question is a new row. The operator answers on the page, in batches. The
   lead reads the answers when a session starts or resumes, records each in the repo with the
   row's id in the entry, and deletes the row once that commit exists. Recording is idempotent:
   before writing, the lead looks for the row id in the repo, so a crash between the commit and the
   delete costs a delete next time, never a second entry. Open items live only on the board,
   answered ones only in the repo, and NOW.md holds the board's link.
2. **Spec review with comments (stage 2, unregulated projects, for the same reason as the
   board).** Each SPEC revision is published as a private page with
   comments. The operator comments from a phone against the paragraph in question, and the lead
   reads the threads and turns each into an Ask item or a revision. This is the post's "review
   notes become the next round", with each note anchored to what it is about.
3. **Milestone dashboard (stage 2, only if wanted).** BOARD and LEDGER as a read-only page,
   republished at milestone close for the optimisation round.

**Boundaries:**

- **An answer on the board is data, not a command.** It steers which option gets written up and
  which topic comes next. A push, a merge, a release or anything else outward still needs the
  operator's yes inside the session itself (`confirm-before-push`; `push-gate` asks there). Step
  10 never runs from the board, and a build-review answer there authorises recording the review,
  nothing more. Nor does anything that releases spend: the milestone roster's yes (Rule 1) is
  given in the session.
- **The board is a convenience, not an authenticated channel.** ArtifactData writes as the person
  (Artifact tool description), so an answer Claude wrote may be indistinguishable from one the
  operator wrote. Only low-consequence steering is taken from it, whose effect lands visibly in
  the repo; the probe checks whether a row records its writer at all.
- **Private, and kept private.** Edit access is never shared: anyone who can write rows can write
  answers.
- **Nothing regulated on a page.** Board data lives on claude.ai. Regulated projects, PropOS
  included, stay off the board entirely and use `team/ASK.md`, because a content rule enforced
  only by the lead's care is prose. On the board, the evidence field is a repo path, never
  content: the exchange relay's rule, applied here.
- **An unreadable board is not an empty board.** If ArtifactData fails, the lead says the queue
  could not be read and asks in the session. It never reports "no open decisions", which would be
  the "never asked" and "nothing to add" confusion again.
- **Recorded means committed.** A row is deleted only after the commit that records it exists
  (`verify-the-effect`).

**Step 0 before building it**, one probe like the worktree probe, each item observed rather than
assumed:

- publish a minimal board with `db`, write one row with ArtifactData, answer it from a phone, and
  read the answer back from a fresh session;
- repeat the read in every environment the lead runs in: the desktop app's Code tab, the CLI in a
  terminal, and a headless `claude -p` run;
- two sessions write different rows at once, and both rows survive;
- whether a row shows who wrote a field: have Claude write an answer and look for any difference
  from the operator's;
- the failure path: point the lead at a wrong board link and confirm it reports that the queue
  could not be read;
- whether an answer reaches a live session. A page that saves a new version of itself notifies a
  session watching it (Artifact tool description); a database write is not a new version, so the
  expectation is that the lead reads the board on "continue". If waking matters, a page that saves
  itself on each answer (`artifact`) is the alternative, at the cost of reading state back out of
  HTML.

**Unverified until the probe runs.**

**Cost:** a handful of ArtifactData calls a session and one publish per milestone, negligible
against a single builder segment.

## 7. Cost model, from this library's measurements

| Measured | Figure | Source |
|---|---|---|
| Orientation per fresh agent, poor briefs | 60k to 120k tokens | commission-the-roster/SKILL.md:19 |
| Average run-segment, unmitigated wave of 2026-07-31 | 290k tokens | commission-the-roster/SKILL.md:10 |
| Agents briefed with verified facts, 2026-08-03 | 44k and 144k; a derive-it-yourself brief in the same wave, 310k | commission-the-roster/SKILL.md:147-149 |
| A CLI review seat's tool-using turn | 3 to 9 times the no-tool floor of 13k to 21k | DESIGN_agent-bus_2026-09-15.md:303 |

**Unregulated:** one builder a package, roughly 50k to 150k tokens on the fact-briefed range, plus
the lead's line review and the gate script's output. A five-package milestone, research included,
roughly 0.5M to 1.5M.

**Regulated:** a test writer, a strong-tier builder and a reviewer, roughly 300k to 450k a package,
so a five-package regulated milestone is roughly 1.5M to 2.5M before the cross-agent seats, which
bill other vendors' quotas.

**Unmeasured, and the likeliest place this is wrong:** a builder that installs dependencies and
runs a test suite repeatedly. Test output lands in its context, so it may sit well above the
fact-briefed range (`context-economy`: cap output before it lands). The first ledger replaces
every figure in this section.

How fast a usage window empties is the separate dial, concurrency, and the cap of two builders is
what holds it.

## 8. Risks

- **State files drift from reality.** The NOW.md check at session start, and status in one file.
- **The queue backs up.** The board stalls by design. The lead parks; it never builds past an open
  decision.
- **The artifact service is down, or the board is unreadable.** The lead says so and asks in the
  session; answers given there are recorded the same way. It does not fall back to a file, which
  would make two queues.
- **The board is not an authenticated channel.** Only low-consequence steering is taken from it;
  spend and outward actions are approved in the session.
- **Same-model blind spots.** Regulated gates use a second family through `cross-agent-review`,
  then attack the convergence.
- **Worktree sprawl and disk.** Step 8 removes each worktree and branch after merging; the sweep
  is a backstop.
- **Over-process.** Staging, the skip rule, and an optimisation round that is allowed to delete
  steps.

## 9. Plan

- **Stage 1 (one short session):** the Ask board probe first; then the `team-loop` skill with the
  state layer, the NOW.md template, the handover skill edit, the `session-recon` NOW.md check, the
  Ask board page, and effort pins on the existing agents. The PropOS `backend` change goes through
  PropOS's own change control. Use it for two weeks wherever work is active.
- **Stage 2 (one session to build, one milestone to run):** the role agents, the loop, BOARD, SPEC
  and LEDGER, and the gate script. Pilot one milestone on one non-regulated project with no shared
  database, read the ledger, then keep, trim or drop.
- **Stage 3:** PropOS, with `tl-test-writer`, `tl-builder-regulated`, `property-reg-reviewer` and
  `cross-agent-review` mandatory on regulated packages.
- **Deferred:** the hooks, workflow and pages listed as later in 5.5; cross-project inboxes, which
  earn their place when two project teams are active at once and need to hand work over. FORWARD:
  `team/INBOX/`.

## 10. Decisions for the operator

1. **Stage 1 now: yes or no.** Recommended yes. It is small and useful without agents.
2. **The Ask board for unregulated projects, or `team/ASK.md` everywhere.** Recommended: the
   board, one for all unregulated projects, so there is one link to check from a phone. PropOS
   uses `team/ASK.md` either way.
3. **Which project pilots stage 2.** A non-regulated project with no shared database is
   recommended. PropOS is the long-term target, and its local checkout is 157 commits behind
   `origin/main`.
4. Names: `team-loop` and `team/`. Default as written.
5. Two follow-ups for the decision log: add `maxTurns` to `commission-the-roster` as a
   harness-enforced ceiling; move PropOS `backend` to the strong tier for regulated work, or split
   it.

## 11. Changes after review

Every point below was checked against the cited lines before acting on it.

**Round 1 (GEMPRO):**

- **Staged build** (conceded): the first draft shipped a hub skill, five role agents and a scaffold
  script at once. The state layer alone fixes the three frictions the note names, so it ships first.
- **Section 2 reworded** (conceded): briefs and effort pins are complementary; the cache-read ratio
  is not pinned on the lead; the cadence is not called full-time work. Found by Claude on
  re-reading the post: its cap of four counts every member, so it does not conflict with the
  two-builder rule.
- **Cost model revised** (conceded): the first draft multiplied the unmitigated wave's 290k average
  by four agents, one of them a reviewer Rule 2 does not spawn on unregulated diffs.
- **Reviewers on regulated packages only; milestone roster approved per Rule 1; separate test
  writer on regulated packages only** (conceded).
- **Standing roles as Rule 4 habits** (not conceded; GEMPRO conceded it in round 2). Rule 4 names
  watchers, collators and coordinators (commission-the-roster/SKILL.md:163-167), agents with no
  single artifact; every loop role names one. The first draft's cleanup agent did collate, so that
  job moved to the lead.

**Round 2 (GEMPRO and OPUS):**

- **NOW.md bypassed the handover skill** (GEMPRO, conceded): a routine end would have skipped the
  trap sweep and the deferred anchors. NOW.md is now where the handover skill writes, with every
  duty kept.
- **Build reviews would have polluted DECISIONS.md** (GEMPRO, conceded): they now go on the ledger
  line or the PR.
- **No regulated cost bracket** (GEMPRO, conceded): added.
- **The gate tested the package, not the merge** (OPUS, conceded): two packages that each passed
  alone could merge red. The gate now tests the uncommitted merge, full suite included.
- **The test-diff baseline was wrong for a regulated package** (OPUS, conceded): another package's
  merge could show up as the builder's change. The baseline is now T, the commit where the tests
  entered, with an ancestry check.
- **Briefs were not committed before spawning** (OPUS, conceded): a worktree branches from the
  committed HEAD, so the test writer would have read the previous spec.
- **Disjoint globs are not enough for concurrency** (OPUS, conceded): a shared local database
  serialises (commission-the-roster/SKILL.md:176).
- **The gate trusted the builder's own account** (OPUS, conceded): it is now a script the lead
  runs; every `JUDGED BY` ID must fail red and pass green; the full suite runs; `package.json` is
  compared by its test scripts, not as a whole file.
- **The shadowing check could not be an extension of the existing one** (OPUS, conceded): that
  check returns nothing under a plugin install (hooks/session-recon.mjs:61). A new check covers
  project and user copies.
- **Reviewers could move the main checkout's HEAD** (OPUS, conceded): they now run in worktrees,
  detached at the package head.
- **`tl-cleanup` had no gate** (OPUS, conceded): the role is dropped.
- **Model and effort had three sources** (OPUS, conceded): frontmatter is now the only one.
- **Two points OPUS left unverified** are recorded as such in 5.4: test runners collecting
  worktree copies, and a resumed `maxTurns`-stopped builder's worktree.

**Round 3 (GEMPRO and OPUS), both closing with a conditional position; revision 4 meets every
condition:**

- **Answered rows kept on the board were a second copy, and a crash between commit and close could
  record a decision twice** (GEMPRO, conceded): rows are frozen once written, deleted after the
  recording commit, and recording is idempotent by row id.
- **One board for all projects put PropOS content behind a prose rule** (GEMPRO, conceded):
  regulated projects use `team/ASK.md`.
- **The probe tested the easy risks** (GEMPRO and OPUS, conceded): it now covers every environment
  the lead runs in, concurrent writes, who wrote a field, and the failure path. Not conceded:
  falling back to `team/ASK.md` when the board fails, which would make two queues; the fallback is
  asking in the session.
- **A builder could weaken tests at or before T** (OPUS, conceded): T is pinned by the lead from
  the tool result, and config, fixtures and existing tests are diffed from the package base.
- **Two gates could each pass on a merge nobody committed** (OPUS, conceded): the tested merge is
  committed in the scratch worktree and fast-forwarded, or the gate runs again.
- **A test named for the hard case could be hollow** (OPUS, conceded): the lead reads the tests at
  step 5, before any build starts.
- **A roster yes from the board was not a Rule 1 yes** (OPUS, conceded): ArtifactData writes as
  the person, so the board is steering-only and the roster is approved in the session.

**After convergence (found by the hub, not a seat):** the round 3 rule "existing tests unchanged
from B" failed every package that legitimately changes an existing test, leaving only a lead
override. The brief now names such tests as `TESTS CHANGED`, approved at step 5 and exempted by
exact path. No seat has reviewed this line.

## 12. Sources

- Subagents: https://code.claude.com/docs/en/sub-agents.md (frontmatter fields, name precedence, spawn depth, `maxTurns`, plugin hooks ignored)
- Agent teams: https://code.claude.com/docs/en/agent-teams.md (experimental flag, effort inheritance, limitations, token use)
- Worktrees: https://code.claude.com/docs/en/worktrees.md (`baseRef`, `.worktreeinclude`, cleanup, Windows approvals)
- Plugin components: https://code.claude.com/docs/en/plugins/components.md (`workflows/` in plugins)
- Costs: https://code.claude.com/docs/en/costs.md (agent teams about 7x in plan mode)
- Handoff Debt: https://arxiv.org/abs/2606.02875 (revised 2026-08-30)
- Artifact capabilities: the `artifact-capabilities` skill's live roster for this account, runtime contract 0.2.66, read 2026-10-02

The Claude Code pages were fetched on 2026-10-02; none shows a page date.

| Claim | Path | Line | Quoted text | How verified |
|---|---|---|---|---|
| 290k per segment | commission-the-roster/SKILL.md | 10 | "16 agent-run-segments, averaging 290k a segment" | `grep -n` |
| Orientation tax | commission-the-roster/SKILL.md | 19 | "line. Call it 60k to 120k each." | `grep -n` |
| No sub-delegation | commission-the-roster/SKILL.md | 56 | "comes back to the lead, and the lead comes back to the operator, because sub-delegation is" | `grep -n` |
| Strong tier for regulated build | commission-the-roster/SKILL.md | 68 | "- **Regulated build** (migration, RLS policy, trigger, money column, audit chain, statutory" | `grep -n` |
| Reviewers on regulated diffs only | commission-the-roster/SKILL.md | 73-74 | "strong tier, on regulated diffs only. On an unregulated diff, name the" | `sed -n` |
| Fact-briefed agent costs | commission-the-roster/SKILL.md | 147-149 | "**310,017**", "144,467", "**44,305**" | `sed -n` |
| Cheap tier cost 2.1x | commission-the-roster/SKILL.md | 151 | "The cheap tier cost 2.1x the strong one" | `grep -n` |
| Rule 4's three habits | commission-the-roster/SKILL.md | 163-167 | "- **Watchers and sitters.**", "- **Collators.**", "- **Coordinators.**" | `sed -n` |
| Collation is a lead turn | commission-the-roster/SKILL.md | 165 | "Collation is a lead turn, not a spawn." | `grep -n` |
| Cap of two builders | commission-the-roster/SKILL.md | 175 | "Cap the agents producing a mergeable change at **two**" | `grep -n` |
| Shared databases serialise | commission-the-roster/SKILL.md | 176 | "the merge pipeline rather than from the token budget: shared-database smokes serialise" | `sed -n` |
| Only real ceilings | commission-the-roster/SKILL.md | 245 | "The only real ceilings are one the harness" | `grep -n` |
| The rules-compliant wave | commission-the-roster/SKILL.md | 276 | "Then PropOS again, 2026-08-03, where a four-agent wave run to this skill's own" | `grep -n` |
| Hub and spoke | cross-agent-review/SKILL.md | 134 | "Spokes answer the hub (and the human), never each" | `grep -n` |
| Attack the convergence | cross-agent-review/SKILL.md | 195 | "**Then attack the convergence.**" | `grep -n` |
| Handover trigger | handover/SKILL.md | 14 | "- A long session is ending deliberately and the next session needs to resume cleanly." | `sed -n` |
| Trap sweep | handover/SKILL.md | 76 | "Sweep the note's traps and working agreements before finishing." | `sed -n` |
| Agent check skips plugins | hooks/session-recon.mjs | 61 | "if (process.env.CLAUDE_PLUGIN_ROOT) return null;" | `sed -n` |
| No-tool floors understate | docs/DESIGN_agent-bus_2026-09-15.md | 303 | "the floors below are NO-TOOL floors and understate" | `grep -n` |
| Admission criterion | README.md | 65 | "recurrence across repos is the admission criterion" | `grep -n` |
| Versioned norms block | NORMS.md | 11 | "<!-- BEGIN CLAUDE-SKILLS NORMS v2026-07-29 -->" | `grep -n` |
| PropOS backend on sonnet | PropOS `.claude/agents/backend.md` at `origin/main` e883ca3 | 5 | "model: sonnet" | `git show origin/main:...` after `git fetch` |
| PropOS doc counts | PropOS `docs/` at `origin/main` e883ca3 | | 147 `HANDOVER`, 24 `SPEC`, 400 files | `git ls-tree` |
| PR #3 adds the "never alongside" rule | randommonicle/claude-skills#3, open | | "**A gate is never "alongside".**" | `gh pr diff 3` |
| Worktree probe | throwaway repo in the scratchpad, deleted after | | `worktreeBranch` `worktree-agent-<id>`; commit kept | real run; `git worktree list`; `git branch -a` |
