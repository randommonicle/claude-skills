# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-03 10:00Z, desktop session in Projects\Unslop (operator away all day)
topic: team-loop stage 1, built on a local branch; cross-agent review next
next: open the cross-agent review of the stage 1 commits (exchange/REVIEW_team-loop-s1_2026-10-03.md)
branches: feat/team-loop-stage1 (worktree ~/.claude/skills-wt-team-loop-s1)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## In flight

- Nothing half-edited. WORKLOG.md carries the checklist and the per-commit notes.

## Deferred, with grep anchors

- `FORWARD: cross-agent-review/scripts/run-seat.test.mjs runs nowhere` in .github/workflows/check-index.yml (LESSONS 28)
- `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md section 9

## Verification outstanding

- Ask board item 2: the operator answers from a phone; unverified until an answer row appears
- Effort pins: that a pinned agent actually runs at the pinned effort; unverified (docs only)
- worktree.baseRef "head" against a repo with a remote (design 5.4); unverified

## Traps

- `git -C <clone> worktree add <relative path>` resolves the path against the clone, not the shell's cwd
- A scheduled desktop task runs in the creating session's folder and stalls on a write outside it
- Mobile push is disabled in this app's config: reach the operator by email or the board
