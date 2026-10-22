# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-22 17:22 BST, session end (an ICC session that ran the misses-log sweep; context about 74%, amber). Diagnoses in this note are unverified unless marked
topic: the misses-log sweep of 22 October 2026, and its first two skills (PRs #24 and #25)
next: install the byte-layer-warn hook line from hooks/HOOKS.md into ~/.claude/settings.json on Ben's yes; then Tier 1 items 3 to 5 of docs/SKILL_PROPOSALS_2026-10-22.md (fixtures-from-reality, pin-to-what-was-seen, measure-per-route), reading each item's source lessons in full first
branches: main only
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- main (PR #24): docs/SKILL_PROPOSALS_2026-10-22.md, 80 "none - new candidate" lessons from seven repositories grouped by class: five new skills, fourteen upgrades, the rest project-level or covered. verified: merged, four checks green
- main baadb3d (PR #25): tool-layer-bytes (skill, and hooks/byte-layer-warn.mjs, warn-only, 17 cases, a red mutation run) and unordered-events (skill). Counts 53, check-index green. verified: merged, four checks green
- Machine: ~/.claude/skills and ~/.agents/skills fast-forwarded to baadb3d (verified, git log); the two working worktrees removed

## In flight

- Nothing running. The hook is on disk but not in ~/.claude/settings.json (Ben not yet asked to yes it)

## Deferred, with grep anchors

- Tier 1 items 3 to 5 and the fourteen Tier 2 upgrades: docs/SKILL_PROPOSALS_2026-10-22.md, sections "Tier 1" and "Tier 2"
- The marketing pack pin (5b2c000, 4 September 2026): coreyhaines31/marketingskills is 799 commits ahead; hooks/install-marketing-pack.mjs and ICC's .claude/skills/UPSTREAM.md
- The second Occam read (DECISIONS 2026-10-09), due on or after 2026-10-16, not taken this session
- Earlier: `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md section 9; unpinned agents (debugger, refactorer; PropOS backend, frontend, test)

## Verification outstanding

- byte-layer-warn on a live session once installed (does it fire on a real heredoc with a backslash, and stay quiet on git commit heredocs)
- The sweep grouped lessons from headings and class lines; each built skill reads its lessons in full

## Traps

- A direct push to main is refused; the four checks gate every PR. Two PRs that both change the skill count conflict: stack skills on one branch
- Heredocs and node -e eat backslashes, and Python's default read turns CRLF to LF: write files with the Write or Edit tool (now the tool-layer-bytes skill)
- `git -C <clone> worktree add <relative path>` resolves against the clone; worktrees live at ~/.claude/skills-wt-<name>
- Take clock times from PowerShell Get-Date, never an estimate
