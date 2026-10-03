# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-03 10:25Z, desktop session in Projects\Unslop (operator away all day)
topic: team-loop stage 1, built on a local branch; cross-agent review round 2 next
next: run round 2 of exchange/REVIEW_team-loop-s1_2026-10-03.md (both seats check the fixes)
branches: feat/team-loop-stage1 (worktree ~/.claude/skills-wt-team-loop-s1)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- d2c74c7 team-loop skill, templates, board page, probe record; verified by check-index
- 1c10fbd session-recon NOW.md check; verified by the suite, six cases red on f7de1a1
- 51ed6ef handover routing, effort pins, this file; unverified that pins change effort
- review round 1 fixes (next commit); verified by the suite, five new cases red on 1c10fbd

## In flight

- Nothing half-edited. WORKLOG.md carries the checklist and the per-commit notes.

## Deferred, with grep anchors

- `FORWARD: cross-agent-review/scripts/run-seat.test.mjs runs nowhere` in .github/workflows/check-index.yml
- `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md section 9
- Unpinned agents: debugger, refactorer (this machine's ~/.claude/agents); PropOS backend, frontend, test

## Verification outstanding

- Ask board: the operator answers from a phone; unverified until an answer row appears
- The board page's draft guard and save path: no test exercises the script; unverified
- worktree.baseRef "head" against a repo with a remote (design 5.4); unverified

## Traps

- `git -C <clone> worktree add <relative path>` resolves the path against the clone
- A scheduled desktop task runs in the creating session's folder and stalls on a write outside it
- Mobile push is disabled in this app's config: reach the operator by email or the board
- agy seats: forbid every command in the ask, or one denied command ends the turn empty
