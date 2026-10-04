# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-04 04:30 BST, overnight continuation; its update is the last section of the handover
topic: team-loop stages 1 and 2 and the legal fork, reviewed, ridden and rehearsed for Sunday's merges
next: read docs/HANDOVER_team-loop-build_2026-10-03.md, "Update, overnight 2026-10-04"; Ben decides pushes and PRs, and answers ASK-0009
branches: feat/team-loop-stage1 (~/.claude/skills-wt-team-loop-s1), feat/team-loop-stage2 (~/.claude/skills-wt-team-loop-s2), fix/run-seat-double-end (~/.claude/skills-wt-run-seat-end), feat/legal-fork (~/.claude/skills-wt-legal-fork), integrate/sunday (~/.claude/skills-wt-integrate-sunday)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- legal fork 33237c1, 43430a3, 384c936, 9ffb4ae, fa3dd5e: cross-family review (GEMPRO, GPT, a fresh GPT on the converged position) and two property-reg-reviewer passes, 0 Critical 0 High; record in that branch's docs/
- stage 1 517a654: cached board sentinel, a directory at team/NOW.md; each case red first
- stage 2 59f797e (merge of stage 1), 1a98f9d, 5258a12: gate fixes from GPT's second turn, and a7ecf0d's team/ rule no longer refuses the pilot's team/checks/**; each case red first; 05f4c03 review record
- stage 2 fad74d1: ride 4 (two packages at once, the pilot's gate.json, Ask steps 2 and 9 in the file form); Concurrency now says to re-gate after the milestone moves
- integrate/sunday: all branches merged on origin/main, count 51, all 26 suites green; docs/INTEGRATION_sunday_2026-10-04.md there
- ASK-0009 posted: the passive income pilot's first-milestone topic

## In flight

- Nothing running. ASK-0009 is open on the board and blocks only the pilot's step 0.

## Deferred, with grep anchors

- `FORWARD: cross-agent-review/scripts/run-seat.test.mjs runs nowhere` in .github/workflows/check-index.yml
- `FORWARD: team-loop/ask-board.test.mjs runs nowhere either` in the same workflow
- `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md section 9
- Unpinned agents: debugger, refactorer (this machine's ~/.claude/agents); PropOS backend, frontend, test
- Accepted Low: a broad but not catch-all test-class glob in gate.json widens TESTS CHANGED (docs/REVIEW_team-loop-fixes_2026-10-04.md, CLAUDE close)

## Verification outstanding

- The gate suite as a CI step on the runner: not run, nothing pushed
- The board page in a real browser since its fixes: stub-DOM tests only
- MT5 compile or Tester commands as JUDGED BY lines; harness worktree isolation for a spawned tl-builder
- worktree.baseRef "head" against a repo with a remote (design 5.4)

## Traps

- `git -C <clone> worktree add <relative path>` resolves the path against the clone
- A scheduled desktop task runs in the creating session's folder and stalls on a write outside it
- Mobile push is disabled in this app's config: reach the operator by email or the board
- agy seats: forbid every command in the ask, git included, or one denied command ends the turn empty (it happened again on 2026-10-04)
- Heredocs and node -e eat backslashes in regexes: use the Edit tool for those edits
- A failing gate run deletes that package's tested ref, even a probe run under its id: re-gate before merging
- Take clock times from PowerShell Get-Date at the moment of writing, never from an estimate
