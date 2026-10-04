# Integration rehearsal for Sunday's merges, 2026-10-04

A local branch, `integrate/sunday`, built from `origin/main` (f7de1a1) in the worktree
`~/.claude/skills-wt-integrate-sunday`, merging the four open branches in the order the
team-loop handover sets (section 7.1). Its purpose is to make Ben's PR merges mechanical: every
conflict below is the one GitHub will show, with its resolution. Nothing here is pushed; `main`
is untouched; the branch has no upstream.

## Merges, in order

| # | Merged | At | Result |
|---|---|---|---|
| 1 | `fix/run-seat-double-end` | 28d5dac | clean (2e67386) |
| 2 | `feat/team-loop-stage2`, which carries `feat/team-loop-stage1` | 05f4c03 (stage 1 at 517a654) | clean (e02c279) |
| 5 | `feat/team-loop-stage2` again, for the overnight close | 7e72460 | the same WORKLOG conflict, resolved the same way (a94fb92); all 26 suites rerun at a94fb92 by exit code: none failed. No code file changed between 7044485 and a94fb92, only prose |
| 4 | `feat/team-loop-stage2` again, for the ride 4 record | fad74d1 | one WORKLOG conflict (stage 2's new entry against the legal fork section that follows it here): stage 2's entry kept at the end of its own section; my first resolution's duplicate `# Work log` title removed |
| 3 | `feat/legal-fork` | fa3dd5e | four conflicts, resolved below (7044485) |

Predicted with `git merge-tree` before the run, and confirmed by it: stage 1 alone applies
cleanly to main plus the run-seat fix, and so does the legal fork alone. Only whichever of the
two lands second conflicts, and the conflict is the same either way.

## The conflicts at merge 3, and their resolution

Every one is the skill count. Stage 1 and 2 add `team-loop` (46 to 47); the legal fork adds four
skills (46 to 50); together they make **51**. `node hooks/check-index.mjs` checks all three
count sites against the skill directories, so it is the proof of the resolution.

| File | Blocks | Ours (team-loop) | Theirs (legal fork) | Resolution |
|---|---|---|---|---|
| `.claude-plugin/marketplace.json` | 1 | "47 guardrail skills" | "50 guardrail skills" | either side, number set to `51 guardrail skills` |
| `.claude-plugin/plugin.json` | 1 | "47 guardrail skills" | "50 guardrail skills" | the same |
| `README.md` | 2 | "lists all 47." and "so 47 skills coexist" | "all 50." and "so 50 skills" | the same: `lists all 51.` and `so 51 skills coexist` |
| `WORKLOG.md` | 1 (add/add) | stage 1 and stage 2 sections, under the title `# WORKLOG` | the legal fork section, under its own title `# Work log` | keep both: team-loop sections first, legal fork after; drop the legal fork side's `# Work log` title line, since main has no WORKLOG.md and each branch created one |

The two sides of each count-site block differ only in the number (checked by diffing the
sides). The README skill table, the rows for `team-loop` and the four legal skills, merged
without conflict.

## Checks on the merged tree

- `node hooks/check-index.mjs`: "ok: 51 skills, all indexed, all named, all three counts agree"
- `node hooks/check-archives.mjs`: "ok: 5 archives, 17 members, all match their skill directories"
- Every `hooks/*.test.mjs` suite (23), `team-loop/scripts/gate.test.mjs`,
  `team-loop/ask-board.test.mjs` and `cross-agent-review/scripts/run-seat.test.mjs`: all green,
  run on the resolved tree before the merge commit was made.

The resolution was done with a small script that keeps one side of each conflict block
(scratchpad, not committed), then the count strings were edited to 51; `git checkout --theirs`
was not used, because it would have taken the whole file from the legal fork and dropped the
README rows stage 2 merged in cleanly.

## For Sunday

Two ways to land it; both need Ben's yes per push (`confirm-before-push`).

**A. Four PRs, in the handover's order.** Merge commits, not squash: stage 2 is stacked on
stage 1, and a squashed stage 1 would make stage 2's PR replay stage 1's changes as conflicts.
The repository's earlier PRs used merge commits.
1. `fix/run-seat-double-end`: clean.
2. `feat/team-loop-stage1`: clean.
3. `feat/team-loop-stage2`: clean once stage 1 is in.
4. `feat/legal-fork`: conflicts exactly as above. Bring the branch up to date and resolve
   locally, then push the branch (its own yes):

   ```bash
   git -C ~/.claude/skills-wt-legal-fork merge origin/main
   ```

   Resolve the four files as in the table, then run `node hooks/check-index.mjs` in that
   worktree and expect 51 before committing.

**B. One PR from `integrate/sunday`.** The branch is the resolved tree, with the checks above;
its tip at the end of the night is the commit carrying this line, on top of a94fb92.
Its history keeps each branch's own commits under three merge commits.

Not covered here: the CI run on the runner (nothing pushed); `team-loop/ask-board.test.mjs` and
`cross-agent-review/scripts/run-seat.test.mjs` run nowhere in CI (both carry a `FORWARD:` line
in `.github/workflows/check-index.yml`).
