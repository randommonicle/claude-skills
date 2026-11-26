# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-11-26 12:03Z, home machine (`bengr`). Diagnoses are unverified unless marked
topic: the 23 November sweep. First items merged (PR #50); three more rows and half a fourth merged (PR #53)
next: on the work machine (`ASH-HP-241`), run `node hooks/audit-fires.mjs` and count name-only skills in its session listings, before building rows on skills that do not load. Detail: `docs/HANDOVER_sweep_2026-11-24.md`
branches: main 473a780; docs/updater-noon-trigger (this note); PR #43 open, conflicting; PR #49 open
ask: none (board declared dead 2026-11-09, DECISIONS 2026-11-09). Open questions are in the handover, section 7

## Landed since the last NOW.md

- 8fdfe00 PR #53, the rows above; verified: four checks green on the merge commit
- 6d94307 PR #51, the handover for the sweep; 7bde76f PR #52, `session-recon` dates the mirror line and drops one that has cleared. Verified: four checks green on each merge commit, #52 ridden on the home machine's real record
- Home machine settings: `skillListingBudgetFraction` 0.03 (verified, 57,870 characters, no name-only skills) and `record-time-warn` wired (verified by two real commits). Both are per machine and neither is on the work machine
- Task `lessons-watch mirror`, daily 16:00, home machine; verified on its own schedule, `ranAt` 2026-11-25 16:00Z
- 473a780 PR #54, a DeepSeek `NO_ARTIFACT` note no longer fails the next turn
- Task `claude-skills update`, home machine: trigger moved from 05:30 to 12:00 GMT on 2026-11-26, because the 05:30 run fell in the nightly sleep and the catch-up skipped 25 and 26 November. Verified on its own schedule: `LastRunTime` 2026-11-26 12:00:00, result 0, record `at` 12:00:02Z. The work machine's task is unchanged and unchecked

## In flight

- this branch: `hooks/HOOKS.md` records the 12:00 trigger and why. Worktree `~/.claude/skills-wt-sweep-2026-11-23` removed 2026-11-26 (clean, merged; branch kept)

## Deferred, with grep anchors

- `FORWARD(description-budget)` in hooks/check-index.mjs: a CI check on the total length of the descriptions
- A hook for staged deletes and renames, and the rest of Tier 2: docs/SKILL_PROPOSALS_2026-11-23.md
- `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md:512; unpinned agents
- `session-recon` prints nothing inside a port; unverified cause. No Rounds re-run recorded for Fable 5.2 (checked 2026-11-14)

## Verification outstanding

- Whether a wider list makes skills load in real sessions: read FIRE_LOG about 2026-12-22

## Traps

- The watch's baselines were reset to the 23 November figures on 2026-11-25 (private repo `96601a1`); a local run then read 3 against a threshold of 10. Read the newest sweep handover before calling a sweep due
- Two machines: work `ASH-HP-241` (`C:\Users\ben`), home `C:\Users\bengr`. The Antigravity port, both vendor packs and the Occam trial are home only. A machine-local fact names its host
- The Avast moratorium stands, so `hooks-windows` in CI is the only run of the four win32 suites. Never rename it or soften it
- Never put `~/.agents/skills` under `checkouts` or `ports`. Never squash past or rewrite c58fe69: the private weekly workflow pins it
- A direct push to main is refused; stack branches that change the skill count. Run suites as `node <file>`, judged by exit code
- Scripts go to disk with the Write tool, never a heredoc. Clock times are taken in the command that writes them
- This repository is public: three private projects are cited as A, B and C, and counts stay in `randommonicle/lessons-watch`
