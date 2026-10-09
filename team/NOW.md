# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-09 19:58 BST, a Rimagent session on Ben's brief to merge the three local branches, then his "yes to all"
topic: the three local branches are on main by PR (#15 to #17); origin and the local clone hold main only
next: on or after 2026-10-16, read the Occam trial again and decide (DECISIONS 2026-10-09, second week). Separately, a passive income session merges team-loop/pilot-setup, records ASK-0009 (a) in that repo's DECISIONS.md, then deletes the item
branches: main; docs/occam-read-lesson-40 until merged
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- main 765c8ae (PR #14): kill-guard, merged 2026-10-09 19:25 BST after its four required checks passed; the live library and ~/.claude/settings.json point at hooks/kill-guard.mjs
- main 6d2bdc8 (PR #15, docs/main-ruleset), 01eda99 (PR #16, integrate/sunday), b8e0214 (PR #17, docs/occam-trial, its lesson renumbered 39): each with main merged in first and all four checks green; #15 showed BLOCKED while a check was pending
- On Ben's yes: the live library at 7e47cd9 (PR #18) via hooks/update-skills.mjs; the three worktrees removed (the Occam one's files had been wiped from Temp, nothing uncommitted); 15 merged branches deleted on origin and 12 locally
- This branch: the Occam trial read into the review; lesson 40, a worktree emptied in a Temp scratchpad

## In flight

- Nothing running. ASK-0009's item stays on the board until passive income records the decision

## Deferred, with grep anchors

- `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md section 9
- Unpinned agents: debugger, refactorer (this machine's ~/.claude/agents); PropOS backend, frontend, test
- Accepted Low: a broad but not catch-all test-class glob in gate.json widens TESTS CHANGED (docs/REVIEW_team-loop-fixes_2026-10-04.md, CLAUDE close)

## Verification outstanding

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
