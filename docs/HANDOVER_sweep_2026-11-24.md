# Handover: the 23 November sweep, and why the skills were not loading

Diagnoses in this note are unverified unless marked. Written 2026-11-24 00:31Z from the home machine (`bengr`). Wrap-up reading: context 52 %, 5-hour plan window 34 % (read with `get_usage` a few minutes before this was written). Ben ended the session; the band was yellow.

## 1. Session goal

Fix the lessons-watch run, then run the sweep it called for, and build what Ben admitted.

## 2. Branch and worktree

Everything built is on `main` at 38ab45f. This note is on `docs/handover-2026-11-24`, from the worktree `~/.claude/skills-wt-sweep-2026-11-23`. `~/.claude/skills` is the live library on the home machine and matches `main` (verified).

## 3. What landed

| Item | State |
|---|---|
| PR #47, lessons-watch, merged as 5135cf2 with a merge commit | verified: c58fe69 is an ancestor of `main` |
| Weekly workflow in the private repository | verified: green on 2026-11-23, 17 sources read, 28 candidates |
| `LESSONS_READ_TOKEN`, set by Ben | Ben reports read-only on all repositories, expires 2027-02-21. Not checked from here |
| Task `lessons-watch mirror`, daily 16:00, from `~/.claude/skills` | verified by hand through Task Scheduler; not yet fired on schedule |
| PR #50, merged as 38ab45f: three skills extended, two descriptions rewritten, `record-time-warn` | verified: four checks green; 53 cases; 21 mutants red on their named cases |
| `skillListingBudgetFraction` 0.03 in the home machine's settings | verified: two fresh sessions, 101 skills, none name-only. Not checked in the desktop app |
| `record-time-warn` wired in the home machine's settings | verified: warned on a stamp ten minutes ahead, quiet on one read from the clock |

## 4. In flight

Nothing is half-built.

## 5. Deferred items

- `FORWARD(description-budget)` in `hooks/check-index.mjs`. The library's descriptions total about 34,500 characters, over the default cap alone (verified 2026-11-24).
- 22 of 24 Tier 2 rows in `docs/SKILL_PROPOSALS_2026-11-23.md`. Built: the regulatory `blast-radius-grep` row and the client-facing `ai-surface-discipline` row.
- The staged delete and rename hook, waiting on the work machine's reading.
- The descriptions of the three norm playbooks, held back from what Ben approved, because the reason for changing them was an error (DECISIONS 2026-11-24).

## 6. Verification still outstanding

- `mirror/STATUS.json` shows a `ranAt` after 2026-11-24 16:00.
- FIRE_LOG about 2026-12-22: do `enumerate-the-set`, `instrument-reports-itself`, `prove-it-can-pass` and `tool-layer-bytes` load now that they are described?
- The same two counts on the work machine (section 8).
- No second seat has read `record-time-warn` or the proposals.

## 7. Blockers and open questions, all Ben's

1. The private `watch.json` baselines. Until they are reset, Monday's count still says a sweep is due. They go to issue #1's "Now" figures; one source stays where it is until its branch merges (recorded in the home machine's memory, not here).
2. Which of the 22 rows to build next. The order proposed is at the end of the proposals document.
3. Two lessons proposed for `LESSONS_LEARNED.md`, section 9. Not written.
4. Deleting the merged leftovers: the two local branches, the worktree and `origin/feat/sweep-2026-11-23-first`.
5. PR #43 (two editable surfaces) has been open and conflicting since 10 November, and one lessons entry already assumes it landed.

## 8. Next actions

1. On the work machine: `git -C ~/.claude/skills pull --ff-only`, then `node ~/.claude/skills/hooks/audit-fires.mjs --repo <each project>`.
2. Same machine: count the skills listed without a description in the session transcripts (the `skill_listing` attachment in `~/.claude/projects/*/*.jsonl`). If it is over the cap, ask Ben before changing its settings.
3. Same machine, on Ben's yes: wire `record-time-warn` from the block in `hooks/HOOKS.md`.
4. Then the Tier 2 rows on skills that do load: `cross-agent-review`, `handover`, `commission-the-roster`.

## 9. Traps, and two lessons proposed

Mistakes made in this session, so the next one can weigh its claims:

- The sweep's headline was written twice before it was right. The first reading called a documented zero a fault; the README and `audit-fires.mjs` both explain it and neither had been read.
- A commit hash was typed into a status line without being read, and corrected in the next message.
- A heredoc carrying backslashes was used again after `byte-layer-warn` had warned about it. The script aborted before writing anything.
- One lessons entry was dismissed as already swept without being read, and three private project names were in a draft for this public repository. An advisor pass caught both before any push.
- Two record stamps made earlier the same day in another repository are one minute later than their commits. The hook passes one minute as rounding.

**Proposed lesson A.** A zero from an instrument was read as a fault before the instrument's own notes on its blind spots. The cause turned out to be one layer down: the thing being counted could not be seen at all. skill that should have prevented this: instrument-reports-itself (rule 8). class: a reading interpreted before the instrument's documented blind spots are read.

**Proposed lesson B.** A library can grow past the space its reader gives it, and nothing reports it. Each new skill made an older one invisible, and the newest were invisible from birth. skill that should have prevented this: none - new candidate (description budget check). class: a fixed-size shared surface that drops entries silently as it fills.
