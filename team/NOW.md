# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-03 17:45 BST, headless continuation of the desktop session; evening update in the handover
topic: team-loop stages 1 and 2 built, ridden and reviewed by GEMPRO and GPT; legal fork re-reviewed and fixed
next: read docs/HANDOVER_team-loop-build_2026-10-03.md, "Update, evening 2026-10-03"; Ben decides pushes and PRs per branch
branches: feat/team-loop-stage1 (~/.claude/skills-wt-team-loop-s1), feat/team-loop-stage2 (~/.claude/skills-wt-team-loop-s2), fix/run-seat-double-end (~/.claude/skills-wt-run-seat-end), feat/legal-fork (~/.claude/skills-wt-legal-fork)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- stage 1: d2c74c7..c22724b (8 commits); verified by the suites, every new case red on its parent
- stage 2: a2ab11a..2ef86fc (6 commits); 33 gate cases, each check mutated off goes red
- fix/run-seat-double-end 28d5dac; two cases red on main
- stage 1 041959a: round 3 stand-in fixes (page pending writes, sentinel, hook git failures); merged into stage 2 as 57af583
- stage 2 370c2b7: the ride (docs/RIDE_team-loop-stage2_2026-10-03.md), real builder + gate, passed and refused a weakened copy
- stage 1 9839abb, 6f15d35, 462d3c7: GPT round 3 page fixes (ask-board.test.mjs, 4 of 5 red on parent), nowLine on a deleted NOW.md, review record in docs/
- stage 2 a7ecf0d: GPT's six findings (five here, one on stage 1), each with a case red first; b4aa01c review record in docs/
- legal fork 6c9845b: scoped statutory re-review, 0 Critical 0 High, Medium and Low fixed

## In flight

- Nothing running. ASK-0006 and ASK-0007 were answered in the session (8036bad); the board's answers collection was empty at 17:25 BST. Pushes and PRs wait for Ben.

## Deferred, with grep anchors

- `FORWARD: cross-agent-review/scripts/run-seat.test.mjs runs nowhere` in .github/workflows/check-index.yml
- `FORWARD: team-loop/ask-board.test.mjs runs nowhere either` in the same workflow
- `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md section 9
- Unpinned agents: debugger, refactorer (this machine's ~/.claude/agents); PropOS backend, frontend, test

## Verification outstanding

- The gate suite as a CI step on the runner: not run, nothing pushed today
- The board page script: stub-DOM repros only (scratchpad s1-s4); the built-in browser is not signed in to claude.ai, so unverified in a real browser since Ben's 09:58Z answers
- worktree.baseRef "head" against a repo with a remote (design 5.4); unverified

## Traps

- `git -C <clone> worktree add <relative path>` resolves the path against the clone
- A scheduled desktop task runs in the creating session's folder and stalls on a write outside it
- Mobile push is disabled in this app's config: reach the operator by email or the board
- agy seats: forbid every command in the ask, or one denied command ends the turn empty
- Heredocs and node -e eat backslashes in regexes: use the Edit tool for those edits
