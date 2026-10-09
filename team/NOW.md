# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-09 19:40 BST, a Rimagent session on Ben's brief to merge the three local branches
topic: docs/main-ruleset, integrate/sunday and docs/occam-trial reach main by PR, one at a time, each re-merged with main first
next: whichever of integrate/sunday and docs/occam-trial is not on main yet, Ben's yes to push it and merge it once the four checks pass. Separately, a passive income session merges team-loop/pilot-setup, records ASK-0009 (a) in that repo's DECISIONS.md, then deletes the item
branches: main; integrate/sunday and docs/occam-trial until merged; origin keeps the merged branches of PRs 1 to 14 until Ben says to delete them
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- main 765c8ae (PR #14): kill-guard, merged 2026-10-09 19:25 BST after its four required checks passed; the live library and ~/.claude/settings.json point at hooks/kill-guard.mjs
- docs/main-ruleset: DECISIONS.md entry for the ruleset and auto-merge, the workflow header and CONTRIBUTING.md say the job names are required checks; main merged in, DECISIONS.md kept newest first

## In flight

- Nothing running. ASK-0009's item stays on the board until passive income records the decision

## Deferred, with grep anchors

- `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md section 9
- Unpinned agents: debugger, refactorer (this machine's ~/.claude/agents); PropOS backend, frontend, test
- Accepted Low: a broad but not catch-all test-class glob in gate.json widens TESTS CHANGED (docs/REVIEW_team-loop-fixes_2026-10-04.md, CLAUDE close)

## Verification outstanding

- The ruleset held PR #14 (four checks passed before the merge); a merge refused while checks ran has not been seen
- The board page in a real browser since its fixes: stub-DOM tests only; the built-in browser stops at claude.ai's sign-in page, so this needs Ben's own browser. MT5 compile or Tester commands as JUDGED BY lines; harness worktree isolation for a spawned tl-builder; worktree.baseRef "head" against a repo with a remote (design 5.4)

## Traps

- A direct push to main is refused now; write NOW.md's next line so it stays true after the merge
- `git -C <clone> worktree add <relative path>` resolves the path against the clone
- A scheduled desktop task runs in the creating session's folder and stalls on a write outside it
- Mobile push is disabled in this app's config: reach the operator by email or the board
- agy seats: forbid every command in the ask, git included, or one denied command ends the turn empty
- Heredocs and node -e eat backslashes in regexes: use the Edit tool for those edits
- A failing gate run deletes that package's tested ref, even a probe run under its id: re-gate before merging
- Take clock times from PowerShell Get-Date at the moment of writing, never from an estimate
