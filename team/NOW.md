# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-11-01 23:52 GMT, session end (the Unslop session; context 48%, read with get_usage). Diagnoses in this note are unverified unless marked
topic: unslop-text took humanizer and antislop ideas; the library's other copies are kept current by update-skills (PRs #34, #35, #39)
next: read PR #38 (docs/SKILL_PROPOSALS_2026-11-01.md, the third misses-log sweep), then Ben merges it and picks the first proposal to build
branches: main; docs/skill-proposals-2026-11-01 (~/.claude/skills-wt-proposals-1101, PR #38, its sweep session kept for auto-fix); docs/now-2026-11-01 (this note, PR #40, no worktree)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH (ASK-0010 Occam overdue, ASK-0011 the port-only skills)

## Landed since the last NOW.md

- #34 fc42fe3 Ben's lesson-42 codex flag; resume path proven in the review's round 2 (same thread, file_turns 2). verified: merged, four checks
- #35 99a4a78 unslop-text: Part D entries 22 to 35, rewrite rules, ten low scanner rules, cluster report, 15 Python tests (not in CI); GPT and Gemini review, three rounds, converged. verified: merged, tests and mutations run
- #36 e0a9b14 legal forks pinned to ad5df19, pins only (upstream renamed files, LESSONS 45). verified: merged
- #37 cf0a834 vendor packs: Cloudflare 1a33048 with cf-cli, marketing 88c79f6 (its session also merged PropOS #435). verified: merged
- #39 b524018 update-skills keeps ~/.agents/skills and ports current via ~/.claude/skills-mirrors.json; sync-port.mjs; ports/antigravity/. verified: the scheduled task, run by hand at 23:33 GMT, updated ~/.agents/skills and read the AI domain port current
- Machine: the AI domain Antigravity port refreshed (backup ~/.claude/backups/ash-plugin-2026-11-01); its push gate now asks on `git -C <path> push`. verified: wrapper ride, before and after

## In flight

- PRs #38 and #40 open, unmerged. Legal and vendor sessions archived; merged worktrees and branches removed (verified: git worktree list)
- PropOS, not this session's: branch docs/lesson-commit-email still on origin (merged in #435; deletion left to Ben); local main 279 behind origin; three other sessions' worktrees untouched

## Deferred, with grep anchors

- The second Occam read (DECISIONS 2026-10-09, due 2026-10-16): overdue, still installed; now ASK-0010
- session-recon prints nothing inside a port (true before the refresh too); see "Known gap" in PR #39's body. unverified cause
- Candidates from ICC's 22 October checkpoint 13; unverified whether PR #38 covers them
- Earlier: `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md:512; unpinned agents (debugger, refactorer; PropOS backend, frontend, test)

## Verification outstanding

- The first unattended 06:30 run on the new updater (status file `mirrors` list fresh, no mirror line at session start)
- unslop-text's scanner tests run only by hand: `python unslop-text/scripts/test_unslop_text_scan.py`

## Traps

- A direct push to main is refused; two PRs adding DECISIONS entries at the top conflict, so union them and check the blank line
- A compare's file list counts renames as changes: read status and additions (LESSONS 45)
- An absence test passes when the code never ran: assert the run first (LESSONS 20 recurrence)
- Ports and ~/.agents/skills take committed HEAD only; edit the library, never a port. UK clocks are GMT since 25 October
