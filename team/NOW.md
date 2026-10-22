# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-22 18:42 BST, session end (an ICC session that finished the misses-log sweep; context about 45%). Diagnoses in this note are unverified unless marked
topic: the misses-log sweep of 22 October 2026, finished (PRs #24, #25, #27, #28)
next: the marketing pack's pin (coreyhaines31/marketingskills is 799 commits past 5b2c000), then the library's second Occam read (DECISIONS 2026-10-09); two ICC lesson candidates of 22 October (below) may become upgrades once Ben rules on them
branches: main only
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- main (PR #27): pin-to-what-was-seen, fixtures-from-reality, measure-per-route (Tier 1 items 4, 3 and 5), each from its source lessons read in full, with a Provenance section. Counts 56. verified: merged, four checks green
- main (PR #28): the fourteen Tier 2 upgrades as an "Additions from the misses-log sweep (2026-10-22)" section in fifteen skills, each line naming its lesson; hooks/preflight-unattended.mjs prints three leave-checks a replayed corpus cannot see (ICC L-078, L-080; AI domain L-136), seen printing on a one-command corpus. verified: merged, four checks green
- Machine: the byte-layer-warn line installed in ~/.claude/settings.json on Ben's yes; it fired on live commands that session, once on a heredoc append that did leave an LF line in a CRLF file (a true positive). ~/.claude/skills and ~/.agents/skills at 7ca2036 (verified, git log)
- Earlier the same day: PR #24 (the sweep, docs/SKILL_PROPOSALS_2026-10-22.md) and PR #25 (tool-layer-bytes with its hook; unordered-events)

## In flight

- Nothing running

## Deferred, with grep anchors

- The marketing pack pin (5b2c000, 4 September 2026): hooks/install-marketing-pack.mjs and ICC's .claude/skills/UPSTREAM.md
- The second Occam read (DECISIONS 2026-10-09), due on or after 2026-10-16
- Candidates from ICC's 22 October checkpoint 13, awaiting Ben's word: a safety trigger that also blocks a test's own clean-up (the database keeps its last active owner); and the honest-failure-surfacing micro-skill option the sweep left open was taken as an upgrade instead
- Earlier: `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md section 9; unpinned agents (debugger, refactorer; PropOS backend, frontend, test)

## Verification outstanding

- The three new skills have not yet fired on a real task outside the session that wrote them (pin-to-what-was-seen and fixtures-from-reality loaded as skills during ICC's Job now build the same evening)

## Traps

- A direct push to main is refused; the four checks gate every PR. Two PRs that both change the skill count conflict: stack skills on one branch
- Running every hooks/*.test.mjs with `node --test` locally hung past two minutes; CI runs them as `node <file>`, so run them that way or rely on the PR's checks
- Heredocs and node -e eat backslashes, and Python's default read turns CRLF to LF: write files with the Write or Edit tool (tool-layer-bytes)
- `git -C <clone> worktree add <relative path>` resolves against the clone; worktrees live at ~/.claude/skills-wt-<name>
- Take clock times from PowerShell Get-Date, never an estimate
