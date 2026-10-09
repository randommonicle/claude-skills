# Handover: the team-lead loop design and the run-seat usage-limit fix, 2026-10-02

Diagnoses in this note are unverified unless marked.

Context at wrap-up: **48%** of the window (desktop app `get_usage`, 2026-10-02 21:33Z), green.
Plan: the 5-hour window at 81% (resets 2026-10-03 00:30Z), the weekly window at 12%.

## 1. Session goal

Review a Reddit post describing an "agent teams" workflow against this library, design our own,
and put the design through cross-agent review. Two additions on the operator's word during the
session: fold claude.ai artifacts into the design, and fix `run-seat.mjs`, which had recorded the
GPT seat's usage limit as an empty reply.

## 2. Branches and worktrees

| Branch | Worktree | Base | Holds | Pushed |
|---|---|---|---|---|
| `docs/team-loop-design` | `~/.claude/skills-wt-team-loop` | `origin/main` ba7ef3e | the design (revision 4), the review record, this note | no |
| `fix/run-seat-cli-error` | `~/.claude/skills-wt-run-seat` | `origin/main` ba7ef3e | the fix, LESSONS 27 and 28, a CI FORWARD anchor | no |

The live clone `~/.claude/skills` stays on `main` at ba7ef3e. Its untracked copy of the design was
removed once this branch held it. `exchange/REVIEW_team-loop_2026-10-02.md` stays there as the
machine-local relay copy (gitignored); `docs/REVIEW_team-loop_2026-10-02.md` on this branch is the
committed one.

## 3. What landed (local commits only)

- `9302344` fix(run-seat): name the CLI's own failure instead of "empty reply". **verified**: the
  three new cases and the extended exit-code case were red against the old code, all 40 cases
  green after, and a ride against the real codex seat, still over its limit, recorded the CLI's
  own message and reset time.
- `97a8a7c` docs(lessons): entries 27 and 28, plus a FORWARD anchor in `check-index.yml`.
  **verified**: the workflow parses (`yaml.safe_load`), the suite and `check-index` are green.
- This branch's commit: `docs/DESIGN_team-loop_2026-10-02.md` revision 4,
  `docs/REVIEW_team-loop_2026-10-02.md`, and this note.

## 4. In flight

Nothing half-edited. The design is a proposal awaiting the operator's review; its decisions are in
`docs/DESIGN_team-loop_2026-10-02.md` section 10. Stage 1 has not been started.

## 5. Deferred items, with their anchors

- Adding `run-seat.test.mjs` to CI: `# FORWARD: cross-agent-review/scripts/run-seat.test.mjs runs
  nowhere` in `.github/workflows/check-index.yml`, on `fix/run-seat-cli-error` (LESSONS 28).
- Cross-project inboxes: the `FORWARD:` line naming `team/INBOX/` in the design's section 9.
- The later hooks, workflow and artifact pages: the design's section 5.5, "Later, only if the pilot
  earns them".
- agy's usage-limit signal: still unobserved. The dated UPDATE note in
  `docs/DESIGN_agent-bus_2026-09-15.md` section 10, on the fix branch, says so.

## 6. Verification still outstanding

- The Ask board probe (design section 6, step 0). Nothing about the board has been run.
- `worktree.baseRef: "head"` against a repo with a remote: from the docs only. The worktree probe
  used a repo with no remote.
- Per project: whether the test runner collects `.claude/worktrees/`, and whether a builder stopped
  by `maxTurns` keeps its worktree on resume (design section 5.4).
- The run-seat fix's success path on the real seat after the limit reset (22:55 BST): not ridden.
  The suite covers it, and that code path did not change. **unverified** on the real CLI.
- The gate's `TESTS CHANGED` line was added after the review converged; no seat has reviewed it.

## 7. Blockers and open questions, all the operator's

1. Stage 1: yes or no.
2. The Ask board for unregulated projects, or `team/ASK.md` everywhere. PropOS uses `team/ASK.md`
   either way.
3. Which project pilots stage 2.
4. Whether to push both branches and open PRs. Each push is a separate yes.
5. If the design is accepted, four decision-log candidates: subagents rather than agent teams; the
   Ask board as steering-only, with regulated projects kept off cloud pages; a `maxTurns` line in
   `commission-the-roster`; PropOS `backend`, which is `model: sonnet` for migrations and RLS on
   PropOS `origin/main` e883ca3.

## 8. Next actions, in order

1. Read the design's sections 0 and 10 in `~/.claude/skills-wt-team-loop/docs/`, and answer
   section 10.
2. Before any push, recon: `git -C ~/.claude/skills fetch` and `gh pr list`. Open PR
   randommonicle/claude-skills#3 adds seven lines to `commission-the-roster`, which shifts line
   numbers the design cites.
3. On a yes for each: push `fix/run-seat-cli-error` and open its PR; push `docs/team-loop-design`
   and open its PR.
4. If stage 1 is a yes: run the Ask board probe before writing the skill.
5. Once both PRs are merged: remove the two worktrees with `git worktree remove` and delete the
   local branches.

## 9. Traps and working agreements

- Git Bash rewrites a `rev:path` argument such as `origin/main:.claude/agents/backend.md` into a
  Windows path. Prefix the command with `MSYS_NO_PATHCONV=1`. **verified** 2026-10-02.
- `WebFetch` on a code.claude.com page sometimes returns the whole page, over 10k tokens, whatever
  the prompt asks. Seen three times this session; once it summarised properly.
- The exchange file is a shared budget: the GEMPRO seat takes the file on argv and is refused above
  30,000 characters. This review closed at 27,240.
- An agy turn's cost follows what it reads: GEMPRO's round 3 ran 389,938 input tokens, on Google's
  quota.
- OPUS, a Claude subagent, shares the hub's model family. When it stands in for an external seat,
  say so in the record, as this one does.
- Push and PR stay per-action under `confirm-before-push`. Nothing was pushed this session.
- The run-seat chip reported "already started" when dismissed. The operator had started it into
  this session; `git worktree list` showed no other run-seat branch.

## 10. Promoted before closing

- LESSONS 27 (a failure distinction no fixture produced) and 28 (a suite outside the CI glob),
  on `fix/run-seat-cli-error`, each with its misses-log and class lines.
- The Git Bash trap is in the machine's auto-memory, since it is a local tooling fact.
- Not promoted: the `WebFetch` whole-page behaviour. Three sightings in one session, one
  counter-example, no controlled comparison.
