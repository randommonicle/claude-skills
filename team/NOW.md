# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-11-24 00:31Z, home machine (`bengr`). Diagnoses are unverified unless marked
topic: the 23 November sweep. First items merged (PR #50); 22 of its 24 Tier 2 rows are unbuilt
next: on the work machine (`ASH-HP-241`), run `node hooks/audit-fires.mjs` and count name-only skills in its session listings, before building more rows. Detail: `docs/HANDOVER_sweep_2026-11-24.md`
branches: main 38ab45f; docs/handover-2026-11-24 (this note); PR #43 open, conflicting; PR #49 open
ask: none (board declared dead 2026-11-09, DECISIONS 2026-11-09). Open questions are in the handover, section 7

## Landed since the last NOW.md

- 5135cf2 PR #47, lessons-watch; verified: weekly workflow green twice on 2026-11-23 (runs 45283493186, 45289630547), 0 sources unread
- 38ab45f PR #50, the sweep's first items and `record-time-warn`; verified: four checks green, suites green locally, the hook ridden live on the home machine
- Home machine settings: `skillListingBudgetFraction` 0.03 (verified, 57,870 characters, no name-only skills) and `record-time-warn` wired (verified by two real commits). Both are per machine and neither is on the work machine
- Task `lessons-watch mirror`, daily 16:00, home machine; verified by a fresh `ranAt` on 2026-11-23

## In flight

- nothing half-built. Two local branches and the worktree `~/.claude/skills-wt-sweep-2026-11-23` are left over and merged

## Deferred, with grep anchors

- `FORWARD(description-budget)` in hooks/check-index.mjs: a CI check on the total length of the descriptions
- A hook for staged deletes and renames, and the rest of Tier 2: docs/SKILL_PROPOSALS_2026-11-23.md
- `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md:512; unpinned agents
- `session-recon` prints nothing inside a port; unverified cause. No Rounds re-run recorded for Fable 5.2 (checked 2026-11-14)

## Verification outstanding

- The 16:00 mirror has not yet fired on its own schedule: read `mirror/STATUS.json` `ranAt` after 2026-11-24 16:00
- Whether a wider list makes skills load in real sessions: read FIRE_LOG about 2026-12-22

## Traps

- Two machines: work `ASH-HP-241` (`C:\Users\ben`), home `C:\Users\bengr`. The Antigravity port, both vendor packs and the Occam trial are home only. A machine-local fact names its host
- The Avast moratorium stands, so `hooks-windows` in CI is the only run of the four win32 suites. Never rename it or soften it
- Never put `~/.agents/skills` under `checkouts` or `ports`. Never squash past or rewrite c58fe69: the private weekly workflow pins it
- A direct push to main is refused; stack branches that change the skill count. Run suites as `node <file>`, judged by exit code
- Scripts go to disk with the Write tool, never a heredoc. Clock times are taken in the command that writes them
- This repository is public: three private projects are cited as A, B and C, and counts stay in `randommonicle/lessons-watch`
