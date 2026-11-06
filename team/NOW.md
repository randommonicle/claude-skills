# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-11-06 09:30 GMT. Diagnoses here are unverified unless marked
topic: the 1 November sweep is fully built (60 skills). Overnight: the branch was pushed by someone other than this session, and the mirror turned out to be a Codex port
next: **the branch is on origin at `50e0a74` and has no PR, so none of the four required checks has ever run on this work.** Opening the PR is Ben's: `allow_auto_merge` is on (DECISIONS 2026-10-04), so a PR here is the merge trigger, not a step before it
branches: main (level with origin at `1381f69`); feat/tier1-and-tier2-2026-11-05 (on origin at `50e0a74`, pushed 2026-11-06 09:24 from this clone, not by this session)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH - **still unreadable** ("artifact not found") on 2026-11-05. ASK-0010 and ASK-0011 named in the 2026-11-01 note, content never seen. Needs a working link

## Landed since the last NOW.md

- PR #41 merged (`1381f69`): `spawn-from-declared-state`, the updater's absent-config fix, LESSONS 46. verified: `gh pr view 41` MERGED, `git log origin/main`
- Three more skills built, to 60: `instrument-reports-itself` (Tier 1 item 4, eight instances, four repos), `prove-it-can-pass` (item 1, the other half of a gate), `enumerate-the-set` (item 2). All four Tier 1 proposals now exist
- The whole Tier 2 table, eighteen skills, plus two rows acted on rather than written: `*.json text eol=lf` pinned, and the unslop scanner wired over its own three `SKILL.md` files in the `index` job behind a plant-an-em-dash red proof
- **`pack-skill.mjs` wrote a wrong CRC-32 into every archive** (`>>> 1` for `>>> 8`). All 5 archives, all 21 members, refused by Python `zipfile` while the gate said current. Fixed at source, all re-packed, CRC check and a red case added. LESSONS 47. verified: gate exits 2 with the bug restored, `testzip()` None for all five after
- Nineteen em dashes removed: one pre-existing in `unslop-ui/SKILL.md` (library 43's class, live), eighteen written by me today in the three new skills
- The live-state-first clock contradiction resolved for Ben, reversible by one edit (DECISIONS 2026-11-05)

## Overnight, 2026-11-05 evening to 2026-11-06 morning

- **The branch was pushed at 09:24 GMT on 2026-11-06, from this clone, not by this session.** `git reflog show origin/feat/tier1-and-tier2-2026-11-05` reads "update by push" at that time; this session ended at 17:34 the day before with `ls-remote` showing nothing. Ben or another session in this working copy. **No PR exists and no CI run exists for the branch**: the workflow fires on `pull_request` and on push to `main` only, so a feature-branch push triggers nothing. verified: `gh pr list --state all`, `gh run list --branch`
- The library's "no upstream tracking branch" error has therefore stopped by itself: the branch has an upstream now and the updater reads `current`
- **`~/.agents/skills` is a Codex port, not a checkout.** The 05:30 run failed on four untracked skill directories copied in at 21:32 on 2026-11-05; the fourth carries `claude`-to-`Codex` and `CLAUDE.md`-to-`AGENTS.md` substitutions. It is out of `checkouts` with the reason in the config's `note`, backed up at `~/.claude/agents-skills-codex-port-2026-11-06`. DECISIONS 2026-11-06, needs Ben's ruling
- The rewrite reached the skill's Provenance section and turned a Claude incident into a Codex one. LESSONS 48
- The updater's empty-config hole, the neighbour of LESSONS 46, is closed with two cases that both go red without the fix

## To open the PR, when Ben chooses to

```
gh pr create --repo randommonicle/claude-skills --base main --head feat/tier1-and-tier2-2026-11-05 --fill
```
That arms auto-merge, so it is the merge decision. Re-run `git fetch` and `gh pr list` first:
this note is a snapshot (`parallel-work-recon`).

## Deferred, with grep anchors

- The 1 November sweep is now empty. The next sweep has no date set
- The second Occam read: **not overdue here.** It cannot run on this machine at all. Evidence, commands and the window problem: `docs/OCCAM_second-read_2026-11-05.md`
- `session-recon` prints nothing inside a port; unverified cause
- Earlier: `FORWARD:` naming `team/INBOX/` in `docs/DESIGN_team-loop_2026-10-02.md:512`; unpinned agents

## Open for Ben, not decided

- Should the em-dash gate widen past the three unslop `SKILL.md` files? Six em dashes sit in `live-state-first/SKILL.md` and eight in `README.md`, all predating today. They were left alone rather than rewritten quietly (DECISIONS 2026-11-05)
- The `claude-api`-to-`Codex-api` rewrites from the old mirror are still only in the backup patch, not ported into `ports/`

## Traps

- **The branch is pushed but has no PR, so nothing has been CI-checked.** A direct push to main is refused; two PRs that both change the skill count conflict, so stack skills on one branch
- **`~/.agents/skills` is maintained by hand as a Codex port.** Do not put it back under `checkouts` in `skills-mirrors.json` without reading DECISIONS 2026-11-06: a fast-forward overwrites the substitutions. A transform step, if one is ever built, must exempt Provenance and any other section that reports what happened (LESSONS 48)
- Superseded 2026-11-06, kept for the reasoning: **the updater reported `error: no upstream tracking branch` while the branch had no upstream.** That is correct, not a fault: this clone is the live install and is sitting on a local-only branch, so there is no upstream to fast-forward from. It was left this way deliberately so the three new skills stay live on this machine while Ben is away. `~/.agents/skills` is still kept current in the same run, independently. verified by `node hooks/update-skills.mjs --dry-run` on 2026-11-05, which also gave the mirror half its first live confirmation: it found `~/.agents/skills` two behind and would fast-forward it to `1381f69`. **The cost of that choice, stated so it is not mistaken for a fault:** while this branch is checked out, anything merged to `main` by another session or machine does not reach the live install here. A session arriving mid-gap should read the updater's error as this branch, not as a new defect and not as the 2026-11-01 mirror bug returning (that one is fixed and is reporting; LESSONS 46). Pushing the branch, or returning the checkout to `main`, closes the gap
- **This is the work machine** (`ASH-HP-241`, `C:\Users\ben`). The home machine is `C:\Users\bengr`. The Antigravity port, both vendor packs and the whole Occam trial are home-machine only, and their absence here is correct, not drift (DECISIONS 2026-11-05). A machine-local fact must name its host, not just its path
- Run hook suites as `node <file>`, never `node --test` (hangs past two minutes locally)
- `~/.agents/skills` is current at `ee6554a` and listed in `~/.claude/skills-mirrors.json`. Its pre-reset state is at `~/.claude/agents-skills-backup-2026-11-05` with the diff as `tracked-modifications.patch`
- Heredocs into an interpreter still eat one backslash level: write files with the Write or Edit tool (`tool-layer-bytes`). `sed -i` on this checkout is safe for ASCII prose but warns on `*.json`; the four new byte layers are in that skill's 2026-11-01 section
- Ports and `~/.agents/skills` take committed HEAD only; edit the library, never a port. UK clocks are GMT since 25 October
- Take clock times from PowerShell `Get-Date`, in the same command that writes them (`live-state-first`, resolved 2026-11-05)
