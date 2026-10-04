# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-04 09:43 BST, merge session on Ben's in-session "Yes to all"
topic: team-loop stages 1 and 2, the run-seat fix and the legal fork merged to main as four PRs (#7, #8, #9, and the legal fork's, which carries this file); 51 skills
next: the passive income pilot: ASK-0009 answered (a), recorded on the board and in that repo's pilot branch; a passive income session merges the branch, records ASK-0009 in its DECISIONS.md and deletes the item; LESSONS candidates in the handover's last two sections wait for Ben
branches: main only; the merged feature branches remain on origin, and integrate/sunday stays a local, unpushed rehearsal
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- main: #7 run-seat fix (220d8cf), #8 stage 1 (5bf2ed7), #9 stage 2 (cd50e14), then the legal fork's PR after main merged into it (4e4b30c), resolved as rehearsed in docs/INTEGRATION_sunday_2026-10-04.md (on the local integrate/sunday branch, plus DECISIONS.md: both entries kept, team loop first); check-index 51, all 26 suites green before the push
- legal fork 469ba82: its DECISIONS.md entry, landed on Ben's yes
- legal fork 33237c1, 43430a3, 384c936, 9ffb4ae, fa3dd5e: cross-family review (GEMPRO, GPT, a fresh GPT on the converged position) and two property-reg-reviewer passes, 0 Critical 0 High; record in that branch's docs/
- stage 1 517a654: cached board sentinel, a directory at team/NOW.md; each case red first
- stage 2 59f797e (merge of stage 1), 1a98f9d, 5258a12: gate fixes from GPT's second turn, and a7ecf0d's team/ rule no longer refuses the pilot's team/checks/**; each case red first; 05f4c03 review record
- stage 2 fad74d1: ride 4 (two packages at once, the pilot's gate.json, Ask steps 2 and 9 in the file form); Concurrency now says to re-gate after the milestone moves
- integrate/sunday: all branches merged on origin/main, count 51, all 26 suites green; docs/INTEGRATION_sunday_2026-10-04.md there
- ASK-0009 posted: the passive income pilot's first-milestone topic

## In flight

- Nothing running. ASK-0009's item and answer stay on the board until passive income records the decision.

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
