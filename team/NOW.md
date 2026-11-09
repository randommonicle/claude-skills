# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-11-09, after Ben ruled on all seven open questions. Diagnoses are unverified unless marked
topic: the 1 November sweep is built and shipped. 60 skills, and nothing left waiting on a decision
next: no work is queued. The next misses-log sweep has no date set
branches: main; feat/tier1-and-tier2-2026-11-05 (merged 2026-11-09)
ask: none (board declared dead 2026-11-09, DECISIONS 2026-11-09; ASK-0010 and ASK-0011 dropped unanswered, never read by any session)

## Landed

- **60 skills.** All four Tier 1 proposals of the 1 November sweep: `spawn-from-declared-state` (PR #41), then `instrument-reports-itself`, `prove-it-can-pass` and `enumerate-the-set`. Plus the entire Tier 2 table, eighteen skills
- Two Tier 2 rows built rather than written: `*.json text eol=lf` pinned, and the unslop scanner wired over its own three `SKILL.md` files in the `index` job, behind a plant-an-em-dash step that fails if the scanner calls the violation clean
- **`pack-skill.mjs` wrote a wrong CRC-32 into every archive** (`>>> 1` for `>>> 8`): 5 archives, 21 members, all refused by a standard zip reader while the gate called them current. Fixed at source, all re-packed, CRC check and a red case added. LESSONS 47
- LESSONS 48: a `claude`-to-`Codex` rename reached a skill's Provenance section and turned a Claude incident into a Codex one. Instructions translate; records do not
- `prove-it-can-pass` rule 9, after the same throwaway pass-line grep misreported a healthy suite twice in four days. Read the exit code, not the prose
- The updater's empty-config hole, the neighbour of LESSONS 46, closed with two cases that both go red without the fix

## Settled on 2026-11-09, not open (DECISIONS 2026-11-09)

- The Avast moratorium stands, so **CI is the only coverage for the four win32 suites.** The `hooks-windows` job is load-bearing: removing, renaming or softening it stops those four running anywhere
- The Codex port at `~/.agents/skills` stays hand-maintained and unmanaged, permanently. It will drift and nothing will report it. The `claude-api`-to-`Codex-api` rewrites stay in the backup patch, unported
- The em-dash gate stays at the three unslop `SKILL.md` files. The 6 em dashes in `live-state-first` and 8 in `README.md` stay
- The Occam read, if run, asks about the three weeks since the trial, not its second week. No comparable baseline exists for that window: `docs/OCCAM_second-read_2026-11-05.md`
- The live-state-first clock rule is ratified, not a default left standing

## Deferred, with grep anchors

- `session-recon` prints nothing inside a port; unverified cause
- `FORWARD:` naming `team/INBOX/` in `docs/DESIGN_team-loop_2026-10-02.md:512`; unpinned agents

## Traps

- **This is the work machine** (`ASH-HP-241`, `C:\Users\ben`). The home machine is `C:\Users\bengr`. The Antigravity port, both vendor packs and the whole Occam trial are home-machine only, and their absence here is correct, not drift (DECISIONS 2026-11-05). A machine-local fact must name its host, not just its path
- **Do not put `~/.agents/skills` back under `checkouts` or `ports`.** A fast-forward overwrites its hand substitutions. Settled 2026-11-09; its state is backed up at `~/.claude/agents-skills-backup-2026-11-05` and `~/.claude/agents-skills-codex-port-2026-11-06`
- A direct push to main is refused; two PRs that both change the skill count conflict, so stack skills on one branch
- Run hook suites as `node <file>`, never `node --test` (hangs past two minutes locally). Judge them by exit code, never by grepping their last line (`prove-it-can-pass` rule 9)
- Heredocs into an interpreter still eat one backslash level: write files with the Write or Edit tool (`tool-layer-bytes`). The four newest byte layers are in that skill's 2026-11-01 section
- Take clock times from PowerShell `Get-Date`, in the same command that writes them (`live-state-first`, ratified 2026-11-09). UK clocks are GMT since 25 October
