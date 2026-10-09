# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-04 17:48 BST, a solo session while Ben was away, on his "carry on"
topic: run-seat.test.mjs printed PASS for a case it had skipped (seen in PR #12's Linux log); fixed on branch fix/run-seat-skip-not-pass
next: Ben's yes to push fix/run-seat-skip-not-pass and open its PR. Separately, a passive income session merges team-loop/pilot-setup, records ASK-0009 (a) in that repo's DECISIONS.md, then deletes the item
branches: main, fix/run-seat-skip-not-pass (local, unpushed), integrate/sunday (a local rehearsal)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- main b5371b4 (PR #12, on Ben's "merge when green"): run-seat.test.mjs and ask-board.test.mjs run in CI; all four checks green, the new steps' output read in run 37217896929 (Linux: board 6 of 6, transport all cases; Windows: the shim case PASS)
- The gate suite ran on the runner: main run 37192547536, "all cases passed"
- The live library (~/.claude/skills) at b5371b4 via hooks/update-skills.mjs, 17:46 BST
- fix/run-seat-skip-not-pass, this commit: a case returns { skip: reason }, the runner prints SKIP and counts it apart, and the summary off win32 reads "all run cases passed; 1 skipped, not run here"; checked as Linux (41 PASS, 1 SKIP) and on win32 (42 PASS); the ubuntu hooks loop now labels the four @win32-only suites SKIP, not PASS

## In flight

- Nothing running. ASK-0009's item stays on the board until passive income records the decision; a passive income session was live at 17:32 BST, so that repo was left alone

## Deferred, with grep anchors

- `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md section 9
- Unpinned agents: debugger, refactorer (this machine's ~/.claude/agents); PropOS backend, frontend, test
- Accepted Low: a broad but not catch-all test-class glob in gate.json widens TESTS CHANGED (docs/REVIEW_team-loop-fixes_2026-10-04.md, CLAUDE close)

## Verification outstanding

- The board page in a real browser since its fixes: stub-DOM tests only; the built-in browser stops at claude.ai's sign-in page, so this needs Ben's own browser
- MT5 compile or Tester commands as JUDGED BY lines; harness worktree isolation for a spawned tl-builder; worktree.baseRef "head" against a repo with a remote (design 5.4)

## Traps

- `git -C <clone> worktree add <relative path>` resolves the path against the clone
- A scheduled desktop task runs in the creating session's folder and stalls on a write outside it
- Mobile push is disabled in this app's config: reach the operator by email or the board
- agy seats: forbid every command in the ask, git included, or one denied command ends the turn empty (it happened again on 2026-10-04)
- Heredocs and node -e eat backslashes in regexes: use the Edit tool for those edits
- A failing gate run deletes that package's tested ref, even a probe run under its id: re-gate before merging
- Take clock times from PowerShell Get-Date at the moment of writing, never from an estimate
