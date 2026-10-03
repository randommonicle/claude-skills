# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-03 11:00Z, desktop session in Projects\Unslop (operator away all day)
topic: team-loop stages 1 and 2 built locally; GPT review rounds owed after 14:42Z
next: at 15:51 BST run GPT on exchange/REVIEW_team-loop-s1 (round 3) and -s2 (round 1), in their worktrees
branches: feat/team-loop-stage1 (~/.claude/skills-wt-team-loop-s1), feat/team-loop-stage2 (~/.claude/skills-wt-team-loop-s2), fix/run-seat-double-end (~/.claude/skills-wt-run-seat-end)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- stage 1: d2c74c7..c22724b (8 commits); verified by the suites, every new case red on its parent
- stage 2: a2ab11a..2ef86fc (6 commits); 33 gate cases, each check mutated off goes red
- fix/run-seat-double-end 28d5dac; two cases red on main

## In flight

- Stage 1 stand-in review (code-reviewer subagent, same model family as the hub) still running
- Open board items: ASK-0006 (pilot setup timing), ASK-0007 (gate form), ASK-0008 (next unit)

## Deferred, with grep anchors

- `FORWARD: cross-agent-review/scripts/run-seat.test.mjs runs nowhere` in .github/workflows/check-index.yml
- `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md section 9
- Unpinned agents: debugger, refactorer (this machine's ~/.claude/agents); PropOS backend, frontend, test

## Verification outstanding

- The gate suite as a CI step on the runner: not run, nothing pushed today
- The board page script: no test exercises it; its fixes are unverified in a browser
- worktree.baseRef "head" against a repo with a remote (design 5.4); unverified

## Traps

- `git -C <clone> worktree add <relative path>` resolves the path against the clone
- A scheduled desktop task runs in the creating session's folder and stalls on a write outside it
- Mobile push is disabled in this app's config: reach the operator by email or the board
- agy seats: forbid every command in the ask, or one denied command ends the turn empty
- Heredocs and node -e eat backslashes in regexes: use the Edit tool for those edits
