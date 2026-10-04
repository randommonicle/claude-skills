# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-04 18:08 BST, a solo session while Ben was away, on his "carry on"
topic: main now takes changes by PR only, after the four CI checks (ruleset 24461308); this branch records it
next: if docs/main-ruleset is not on main yet, Ben's yes to push it and merge (auto-merge waits for the four checks); once it is, nothing is queued here. Separately, a passive income session merges team-loop/pilot-setup, records ASK-0009 (a) in that repo's DECISIONS.md, then deletes the item
branches: main, docs/main-ruleset (local until Ben's yes), integrate/sunday (a local rehearsal)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- main 07af1ca (PR #13): a skipped case prints SKIP, never PASS, in run-seat.test.mjs and in the ubuntu hooks loop; main 01194b4 (PR #3, open since 2026-09-26): commission-the-roster, a gate never runs alongside the step it certifies, merged locally onto main first with index and archives green; main's CI on 01194b4 (run 37219111004) all four jobs green, SKIP labels in the log
- On Ben's yes: allow_auto_merge on; ruleset 24461308 requires index, archives, hooks, hooks-windows on main, no bypass, not strict; nine merged worktrees removed, local branches kept; the live library at 01194b4
- docs/main-ruleset, this commit: DECISIONS.md entry for the two settings, the workflow header and CONTRIBUTING.md say the job names are required checks

## In flight

- Nothing running. ASK-0009's item stays on the board until passive income records the decision

## Deferred, with grep anchors

- `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md section 9
- Unpinned agents: debugger, refactorer (this machine's ~/.claude/agents); PropOS backend, frontend, test
- Accepted Low: a broad but not catch-all test-class glob in gate.json widens TESTS CHANGED (docs/REVIEW_team-loop-fixes_2026-10-04.md, CLAUDE close)

## Verification outstanding

- The ruleset has not yet held a PR: the first PR after it should show "waiting for checks" before auto-merge
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
