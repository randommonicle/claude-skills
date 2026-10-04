# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-04 17:38 BST, a solo session while Ben was away; local commits only
topic: the two suites that ran nowhere (run-seat, ask-board) wired into CI on branch ci/wire-unrun-suites
next: Ben's yes to push ci/wire-unrun-suites and open its PR; that run is the first runner run of both suites, so a red there is fixed on the branch. Separately, a passive income session merges team-loop/pilot-setup, records ASK-0009 (a) in that repo's DECISIONS.md, then deletes the item
branches: main, ci/wire-unrun-suites (local, unpushed), integrate/sunday (a local rehearsal)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- main 2043d43 (PR #11): LESSONS 29 to 38, cross-agent-review's seat wording, verified-citations' counting line; main's CI green on it
- The gate suite ran on the runner: main run 37192547536, step "the team-loop gate suite", "all cases passed"
- The live library (~/.claude/skills) fast-forwarded f7de1a1 to 2043d43 by hooks/update-skills.mjs at 17:33 BST; the 06:30 task ran before the merges; check-index ok, 51
- ci/wire-unrun-suites, this commit: run-seat.test.mjs and ask-board.test.mjs as named steps in the hooks job, each if: always(); run-seat again in hooks-windows for its one win32-only case (the PATHEXT shim); each suite exits 1 against a broken copy of its target, 0 against the real one

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
