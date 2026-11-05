# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-11-05, session end (the build-out session). Diagnoses here are unverified unless marked
topic: the 1 November sweep is fully built. 60 skills, every Tier 1 item and the whole Tier 2 table
next: **nothing is pushed.** `feat/tier1-and-tier2-2026-11-05` is five local commits ahead of `main`, waiting on Ben's push authorisation (`confirm-before-push`). Commands in "To push" below
branches: main (level with origin); feat/tier1-and-tier2-2026-11-05 (local only, never pushed, no worktree)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH - **still unreadable** ("artifact not found") on 2026-11-05. ASK-0010 and ASK-0011 named in the 2026-11-01 note, content never seen. Needs a working link

## Landed since the last NOW.md

- PR #41 merged (`1381f69`): `spawn-from-declared-state`, the updater's absent-config fix, LESSONS 46. verified: `gh pr view 41` MERGED, `git log origin/main`
- Three more skills built, to 60: `instrument-reports-itself` (Tier 1 item 4, eight instances, four repos), `prove-it-can-pass` (item 1, the other half of a gate), `enumerate-the-set` (item 2). All four Tier 1 proposals now exist
- The whole Tier 2 table, eighteen skills, plus two rows acted on rather than written: `*.json text eol=lf` pinned, and the unslop scanner wired over its own three `SKILL.md` files in the `index` job behind a plant-an-em-dash red proof
- **`pack-skill.mjs` wrote a wrong CRC-32 into every archive** (`>>> 1` for `>>> 8`). All 5 archives, all 21 members, refused by Python `zipfile` while the gate said current. Fixed at source, all re-packed, CRC check and a red case added. LESSONS 47. verified: gate exits 2 with the bug restored, `testzip()` None for all five after
- Nineteen em dashes removed: one pre-existing in `unslop-ui/SKILL.md` (library 43's class, live), eighteen written by me today in the three new skills
- The live-state-first clock contradiction resolved for Ben, reversible by one edit (DECISIONS 2026-11-05)

## To push, when Ben authorises it

```
git -C C:/Users/ben/.claude/skills push -u origin feat/tier1-and-tier2-2026-11-05
```
Then open a PR against main and let the four required checks run. Do not merge without a
second, separate authorisation. Re-run `git fetch` and `gh pr list` first: this note is a
snapshot (`parallel-work-recon`).

## Deferred, with grep anchors

- The 1 November sweep is now empty. The next sweep has no date set
- The second Occam read: **not overdue here.** It cannot run on this machine at all. Evidence, commands and the window problem: `docs/OCCAM_second-read_2026-11-05.md`
- `session-recon` prints nothing inside a port; unverified cause
- Earlier: `FORWARD:` naming `team/INBOX/` in `docs/DESIGN_team-loop_2026-10-02.md:512`; unpinned agents

## Open for Ben, not decided

- Should the em-dash gate widen past the three unslop `SKILL.md` files? Six em dashes sit in `live-state-first/SKILL.md` and eight in `README.md`, all predating today. They were left alone rather than rewritten quietly (DECISIONS 2026-11-05)
- The `claude-api`-to-`Codex-api` rewrites from the old mirror are still only in the backup patch, not ported into `ports/`

## Traps

- **Nothing on this branch is pushed.** A direct push to main is refused; two PRs that both change the skill count conflict, so stack skills on one branch
- **The scheduled updater will report `error: no upstream tracking branch` until this branch is pushed or the checkout returns to main.** That is correct, not a fault: this clone is the live install and is sitting on a local-only branch, so there is no upstream to fast-forward from. It was left this way deliberately so the three new skills stay live on this machine while Ben is away. `~/.agents/skills` is still kept current in the same run, independently. verified by `node hooks/update-skills.mjs --dry-run` on 2026-11-05, which also gave the mirror half its first live confirmation: it found `~/.agents/skills` two behind and would fast-forward it to `1381f69`
- **This is the work machine** (`ASH-HP-241`, `C:\Users\ben`). The home machine is `C:\Users\bengr`. The Antigravity port, both vendor packs and the whole Occam trial are home-machine only, and their absence here is correct, not drift (DECISIONS 2026-11-05). A machine-local fact must name its host, not just its path
- Run hook suites as `node <file>`, never `node --test` (hangs past two minutes locally)
- `~/.agents/skills` is current at `ee6554a` and listed in `~/.claude/skills-mirrors.json`. Its pre-reset state is at `~/.claude/agents-skills-backup-2026-11-05` with the diff as `tracked-modifications.patch`
- Heredocs into an interpreter still eat one backslash level: write files with the Write or Edit tool (`tool-layer-bytes`). `sed -i` on this checkout is safe for ASCII prose but warns on `*.json`; the four new byte layers are in that skill's 2026-11-01 section
- Ports and `~/.agents/skills` take committed HEAD only; edit the library, never a port. UK clocks are GMT since 25 October
- Take clock times from PowerShell `Get-Date`, in the same command that writes them (`live-state-first`, resolved 2026-11-05)
