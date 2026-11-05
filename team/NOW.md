# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-11-05 15:12 GMT, session end (the maintenance session: git hygiene, the mirror, spawn-from-declared-state). Diagnoses in this note are unverified unless marked
topic: PR #40 merged and the branch list cleared; the mirror feature was found switched off and is now on; Tier 1 item 3 built
next: Ben picks the next Tier 1 proposal (prove-it-can-pass, enumerate-the-set, instrument-reports-itself); the Ask board could not be read this session and needs a working link
branches: main; feat/spawn-from-declared-state (this session's PR, no worktree)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH — **could not be read on 2026-11-05** ("artifact not found"). ASK-0010 and ASK-0011 are named in the 2026-11-01 note but their content and any answers were not visible to this session

## Landed since the last NOW.md

- PR #40 merged (`ee6554a`): the 2026-11-01 note and LESSONS 45, open four days, green the whole time. verified: `gh pr view 40` MERGED, `git ls-remote`
- 13 merged remote branches deleted; only `origin/main` remains and no PRs are open. verified: `git branch -r`, `gh pr list`
- Upstream forks checked: `rohasnagpal/legal-ai-skills` at `ad5df1934e98` and `JCarterJohnson/vibecoded-design-tells` at `f7c4aefc2c79`, both **identical to their pins**. No updates to adopt. All seven `UPSTREAM.md` files record the 2026-11-05 check. verified: `gh api .../commits/HEAD`, bytes re-grepped after the scripted edit
- This session's PR: `spawn-from-declared-state` (Tier 1 item 3), the updater's absent-config fix with two tests, LESSONS 46, counts to 57

## In flight

- This session's PR only. Nothing else running

## Deferred, with grep anchors

- Three Tier 1 proposals unbuilt: `prove-it-can-pass`, `enumerate-the-set`, `instrument-reports-itself` (`docs/SKILL_PROPOSALS_2026-11-01.md`). The 1 November Tier 2 upgrades are also unbuilt
- The second Occam read (DECISIONS 2026-10-09): still overdue, was ASK-0010
- `session-recon` prints nothing inside a port; unverified cause
- Earlier: `FORWARD:` naming `team/INBOX/` in `docs/DESIGN_team-loop_2026-10-02.md:512`; unpinned agents

## Verification outstanding

- **The Antigravity port could not be located.** `~/.claude/backups/ash-plugin-2026-11-01` does not exist and no `plugin.json` was found under `~/Projects` or `~/.claude` outside the library. Two roots searched, not the whole disk. `skills-mirrors.json` therefore lists `ports: []`, so `sync-port.mjs` runs against nothing
- **The Cloudflare vendor packs are absent from both roots.** DECISIONS 2026-11-01 records them installed into `~/.claude/skills` and `~/.agents/skills` at `1a33048`; neither root holds `cloudflare/`, `wrangler/` or `cf-cli/` today. verified by `ls`. Cause unknown — not investigated this session
- `relay-cli-takeover.test.mjs` was not run locally (the 2026-09-21 Avast moratorium, never formally lifted). CI covers it

## Traps

- A direct push to main is refused; two PRs that both change the skill count conflict, so stack skills on one branch
- Run hook suites as `node <file>`, never `node --test` (hangs past two minutes locally)
- **`~/.agents/skills` was three months stale behind a silently-disabled feature.** It is now at `ee6554a`, clean, and listed in `~/.claude/skills-mirrors.json`. Its pre-reset state, including nineteen hand edits and three `claude-api`-to-`Codex-api` rewrites, is at `~/.claude/agents-skills-backup-2026-11-05` with the diff as `tracked-modifications.patch`. If a Codex port is wanted, port it into `ports/` — do not re-edit the mirror
- Heredocs into an interpreter still eat one backslash level: write files with the Write or Edit tool (tool-layer-bytes). A `perl -0pi` substitution silently matched nothing this session and the only tell was a count that did not change
- Ports and `~/.agents/skills` take committed HEAD only; edit the library, never a port. UK clocks are GMT since 25 October
- Take clock times from PowerShell `Get-Date`, never an estimate
