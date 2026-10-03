---
name: team-loop
description: Keep a project's resume state in team/NOW.md, overwritten at every session end and checked against git at each start, and keep the operator's open decisions in one queue, the Ask board (a private claude.ai artifact, unregulated projects) or team/ASK.md (regulated projects), never both. In a project that runs stage 2 it also drives the loop: research, decision round, spec revision, roster, tests first, build, review, the gate script and the merge, with the tl- role agents. Triggers when a session starts or resumes in a repo that has team/NOW.md, when work needs an operator decision that cannot be had in the session, when recording an answered Ask item, when a session ends, and when a project runs a team-loop milestone. Does not fire on the dated note for an unusual end (handover owns that), and never replaces the roster approval commission-the-roster requires.
---

# Team loop

Two files and one page give a project a standing operating layer that survives the session:
`team/NOW.md` says where the work is, the Ask queue holds what only the operator can decide,
and effort pins keep each agent on the model and effort its job needs. It works with or
without agents. Stage 2, below, adds the loop: role agents, a board of work packages, a
living spec, a ledger and a gate script, for a project that opts in.

## team/NOW.md: the resume board

- **Overwritten, never appended, at most 40 lines,** from `templates/NOW.md`. It holds the
  current topic, the single next action, in-flight work with exact `file:line` ranges,
  deferred items with their grep anchors, verification still outstanding, and three lines
  that `session-recon` reads: `branches:` (comma-separated, a parenthesised note after a name
  is allowed), `ask:` (the queue's location) and `template:`.
- **The handover skill writes it at every session end,** and the commit that carries the
  session's last change carries it too. An unusual end (the red band, a crash or forced stop,
  a move to another machine, a scheduled run stopped by a usage limit) also gets a dated
  `docs/HANDOVER_*` file in the full handover shape. An amber-band wrap-up is a routine end.
  The history lives in git, so nothing is lost by overwriting.
- **It is described state.** `session-recon` prints how many commits HEAD has moved since
  NOW.md was committed, flags an uncommitted NOW.md or uncommitted edits to it, names any
  branch on its `branches:` line that exists neither locally nor on origin, and counts the
  open items in a `team/ASK.md` queue. Read the print, then check NOW.md against `git log`
  before acting on it (`live-state-first`).

## The Ask queue: one per project

An item is a decision or a build review that only the operator can give. Its shape is the
same in both forms: an id (`ASK-0001` upward, never reused), the project, the kind
(`decision` or `review`), the question, short context, the options with keys, the
recommendation if there is one, an evidence path in the repo, and what it blocks.

**Which form.** An unregulated project uses the Ask board, one board shared by all of them,
each item tagged with its project, so the operator has one link to check from a phone. A
regulated project, PropOS included, uses `team/ASK.md` from `templates/ASK.md`, because
board data sits on claude.ai and a content rule enforced only by care is prose. One form per
project, never both, and NOW.md's `ask:` line says which.

**The lifecycle, the same in both forms:**

1. **Ask once.** Write the item and never edit it afterwards; a changed question is a new
   item. Then park the work it blocks. The lead never builds past an open decision. If
   nothing else is unblocked, overwrite NOW.md (`next:` waiting on the item's id) before
   stopping: a park is a session end like any other.
2. **Read at every start and resume.** Read the answers, and on the board the operator's
   free notes, before starting work.
3. **Record, with the operator's words verbatim.** A decision goes into `DECISIONS.md` with
   the item id in the entry. A build review is not a decision: its answer goes on the PR as a
   comment naming the item id, or on the package's ledger line in stage 2. A free note is
   always recorded, even when it is simply acted on: in DECISIONS.md if it decides something,
   otherwise one line in NOW.md or the WORKLOG saying what was done, either way citing the
   note's document id. Before writing, look for the item or note id where the record would
   land (grep the repo, or read the PR's comments), so a crash between record and delete
   costs a delete next time, never a second entry.
4. **Delete only after the record exists** (`verify-the-effect`): after the commit for a
   decision or a note, after reading the posted comment back for a review. Then delete the
   item and its answer, or the note, on the board; in `team/ASK.md`, delete the item's
   section in a commit, since an uncommitted deletion is undone by the next checkout.

## Reading and writing the board

The board is `team-loop/ask-board.html`, published once as a private artifact with
`capabilities: {"db": {"rules": [{"path": "", "read": "owner", "write": "owner"}]}, "user": {}}`.
The owner-only rule is the privacy control: a read at any lower level sees nothing, so a
mistaken share leaks no rows. **Edit access is still never shared**, because an Editor can
publish a new version of the page with looser rules and then write answers. Its collections:

| Collection | Written by | Holds |
|---|---|---|
| `items` | the lead | one document per open item, id `ASK-nnnn` |
| `answers` | the page | `{item, choice, note, answeredAt, by, via}`, id equal to the item's |
| `notes` | the page | free notes from the operator not tied to an item |
| `meta`, doc `status` | the lead | one line for the operator's phone: what the lead is on, overwritten at each checkpoint |

Rules the probe of 2026-10-03 set (`docs/PROBE_ask-board_2026-10-03.md`):

- **Read `meta/status` first, every time.** A wrong artifact link fails with
  `invalid_argument`, but a wrong collection name on the right board reads as an empty list,
  indistinguishable from no open items. The sentinel document tells the two apart.
- **An unreadable board is not an empty board.** If the read fails, say the queue could not
  be read and ask in the session. Never report "no open decisions", and never fall back to a
  file, which would make two queues.
- **The store records no writer.** A document carries only `version` and `updatedAt`, and
  the page's `by` field is written by the page, so an answer Claude wrote cannot be told from
  one the operator wrote. Hence the next rule.
- **An answer is steering, not authority.** It picks which option gets written up and which
  topic comes next. A push, a merge, a release, a spend or anything outward still needs the
  operator's yes inside the session (`confirm-before-push`), and so does a roster's release of
  spend (`commission-the-roster` Rule 1). A review answer authorises recording the review,
  nothing more.
- **Nothing regulated on the board.** Questions and repo paths only; the evidence field is a
  path, never content.
- **Pin writes.** Pass the version you read as `if_version` on every write to an existing
  document.

## Effort pins

Every agent definition the loop uses pins `model` and `effort` in its frontmatter (`effort`:
`low`, `medium`, `high`, `xhigh` or `max`, per the sub-agents documentation). An unpinned
agent inherits the session's effort, so a reviewer spawned from a low-effort session reviews
at low effort. Reviewers pin `high` or above. An agent that builds regulated work
(migrations, access policies, money, leaseholder-facing output) pins the strong tier
(`commission-the-roster` Rule 2), or is split from its unregulated twin. The library's own
agents are pinned; agents that live only on one machine or in one project are pinned there,
through that project's own change control, and NOW.md lists any still unpinned.

## Stage 2: the loop, for a project that opts in

The loop is for topics. A one-commit fix runs as it does today.

**Roles.** The main session is the lead: strategy, briefs, gates, line review of unregulated
diffs, milestone summaries. It reads briefs, findings, diffs and the gate's output, not the
repository. The others are agents shipped in `agents/`, each pinned to model, effort and
`maxTurns` in its frontmatter, none with the `Agent` tool, so none can sub-delegate:

| Agent | Model, effort | Isolation | Used for |
|---|---|---|---|
| `tl-researcher` | sonnet, medium | none | one topic, one `team/research/<topic>/FINDINGS.md`; at most two at once |
| `tl-builder` | sonnet, medium | worktree | an unregulated package: tests first in their own commit, stops, builds when resumed |
| `tl-test-writer` | sonnet, medium | worktree | a regulated package's tests, from the spec, independently of the builder |
| `tl-builder-regulated` | opus, high | worktree | a regulated package, merging the test writer's commit first |

Regulated packages are also reviewed by `code-reviewer`, `property-reg-reviewer` and a
`cross-agent-review` seat; they return findings and the lead writes the verdict file,
`team/packages/WP-nnn.verdict.md`, one finding per line marked `[open]` or `[closed]` with its
severity, committed to the milestone branch. A reviewer that runs tests does so in its own
worktree detached at the package head (`git worktree add --detach <dir> <head>`), so the main
checkout never leaves the milestone branch.
Unregulated packages get no spawned reviewer: the lead line-reviews the diff and the gate is
mechanical. The `maxTurns` values are provisional until the first ledger. A model departure is
a spawn-time override stated in the roster; an effort departure is a separately named agent.

**Where the agents load from.** Under a plugin install they load from the plugin, and a
project or user agent named `tl-*` would silently replace one, which `session-recon` reports.
On a direct clone of this library they are copied into the user's agents directory like the
library's other agents, which `session-recon`'s agent check asks for. Both checks are right
for their layout.

**Project state under `team/`:** `NOW.md` (stage 1; once BOARD.md exists its `branches:` line
names only the milestone branch), `BOARD.md` (every package's status and gate columns, from
`templates/BOARD.md`), `SPEC.md` (the living design with a revision number, from
`templates/SPEC.md`; a project with a spec family points at it), `LEDGER.jsonl` (one line per
finished package), `packages/WP-nnn.md` (one brief each, from `templates/WP.md`),
`research/<topic>/FINDINGS.md`, `archive/<milestone>.md`, and `gate.json` (the gate's
project config, from `templates/gate.json`).

**The loop:**

| # | Step | Who | Gate to pass |
|---|---|---|---|
| 0 | Pick a topic | operator, on the Ask board or in chat | |
| 1 | Research | `tl-researcher`, at most two | |
| 2 | Decision round | lead asks on the Ask queue, operator answers | the answer, recorded in DECISIONS.md |
| 3 | Spec revision and briefs, **committed to the milestone branch** before anyone spawns | lead | |
| 4 | Milestone roster: package, role, model, budget, scope, artifact | lead publishes, operator approves | the operator's yes **in the session** (`commission-the-roster` Rule 1), never from the board |
| 5 | Tests first: the builder (stops after its tests commit) or `tl-test-writer` | agent | the lead reads the tests and pins T from the tool result |
| 6 | Build: `tl-builder` resumed, or `tl-builder-regulated` | agent | |
| 7 | Review against the spec, regulated packages only | reviewers, cross-agent seats | the lead's verdict file: no open Critical or High |
| 8 | Gate and merge | lead, by `scripts/gate.mjs` | the gate passes, and for a deployed surface `one-real-ride` has been ridden; then `git merge --ff-only refs/team-loop/tested/WP-nnn`, a ledger line, the worktree and branch removed |
| 9 | Build to review | operator, on the Ask queue (a `review` item saying how to run it) | the answer, on the ledger line |
| 10 | Release | operator, in the session | `push-gate` asks per action |

**The gate** (`node team-loop/scripts/gate.mjs --wp WP-nnn --t <T> --head <branch> --milestone
<branch>`) decides from git and from the package's checks, never from the builder's report. It
reads the brief, `team/gate.json` and the verdict file from the milestone branch's committed
tree, so a builder cannot edit what judges it. Each brief's `JUDGED BY` lines are
`- <id>: <command>`: a command exits non-zero while its check fails and zero once it passes,
which fits a test suite (one command per test file) and a project whose proofs are scripts.
The brief must also say `regulated: yes` or `no` and list `SCOPE` globs; the gate refuses to
run without them rather than default. It checks that T is an ancestor of the head; that every
check fails at T (a check that already passes is hollow or skipped); that since the package
base no test or fixture file changed except those T added, no test config changed, no existing
`package.json` test script changed and no pre or post hook was added, unless `TESTS CHANGED`
names the path; that every other change sits inside `SCOPE`; that every check and the full
suite pass on the committed merge into the milestone tip; and, for a regulated package, that
the verdict file has no `[open]` line naming Critical or High. Only then does it keep the
tested merge at `refs/team-loop/tested/WP-nnn`, deleting any earlier one first. It writes T, B,
the tested merge, the red and green ids and the result onto the package's BOARD row. Run it
only after the builder has finished and committed: a gate run alongside the step it certifies
sees an unfinished state.

**A ledger line** is one JSON object: `{"wp", "milestone", "date", "agents": [{"agent",
"model", "effort", "tokens", "turns"}], "wall_minutes", "gate": "pass" | "fail", "tested",
"build_review"}`, with tokens from the Agent tool's own usage report, never estimated.

**Concurrency.** At most two builders at once, and only when their `SCOPE` globs are disjoint
and they share no stateful resource (a local database, a fixed port, shared fixtures).

**Per-project setup, once, on its own branch:** `"worktree": {"baseRef": "head"}` in the
project's `.claude/settings.json`, so builders branch from the milestone branch rather than the
remote default (worktrees documentation); `.claude/worktrees/` in `.gitignore`, and the test runner excludes it; `.worktreeinclude` copies no
secrets; the build and test commands are pre-approved (on Windows an approval given inside a
worktree stays with that worktree); and `team/gate.json` names the setup, suite, test and
test-config globs.

**Rounds.** Every third milestone close, an optimisation round over `LEDGER.jsonl`
(`price-the-spend`), proposals filed on the Ask queue. When a new model ships, re-run two
archived packages on it: their checks are the oracle and their ledger lines the baseline.

## What this skill does not do

It does not decide when to wrap up (the context bands do) or what a dated handover contains
(`handover`). It does not spawn agents or price a wave (`commission-the-roster`,
`price-the-spend`). It never pushes, merges or spends on a board answer.

## Provenance

Designed in `docs/DESIGN_team-loop_2026-10-02.md` (revision 4, converged under
cross-agent review, record in `docs/REVIEW_team-loop_2026-10-02.md`), prompted by a Reddit
post describing an "agent teams" workflow. Stage 1 built 2026-10-03; the Ask board rules come
from the probe recorded in `docs/PROBE_ask-board_2026-10-03.md`. Candidate tier: admitted by
design review, not by the misses log.
