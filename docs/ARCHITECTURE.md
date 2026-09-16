# Architecture: how the library measures and gates itself

Moved off the README on 2026-09-16. Two independent reviewers reading it as a front page both
named these three sections as belonging elsewhere: they are maintainer mechanics, and they sat
between a stranger and the reason to care. The text is unchanged.

Companion documents: [hooks/HOOKS.md](../hooks/HOOKS.md) for what each hook does and how to
install it, [DECISIONS.md](../DECISIONS.md) for standing choices, and
[LESSONS_LEARNED.md](../LESSONS_LEARNED.md) for the incidents behind them.

## The rating system

Tier and layer assignments are measured, not declared: the fire-log hook records every skill invocation to `FIRE_LOG.jsonl` (gitignored, machine-local); every new LESSONS_LEARNED entry in any repo ends with "skill that should have prevented this: X / none — new candidate" (the misses log, plus a "class:" line when a first instance is plainly broader than itself); a prune pass runs when a skill is added. Promotion ladder: hub bullet → leaf → norm → hook. Norm-backed, hub-routed, and rare-event-high-consequence skills are exempt from zero-fires demotion. `hooks/audit-fires.mjs` turns both halves of the measurement into one report (`node hooks/audit-fires.mjs --repo <path>...`): fires per skill, never-fired skills tagged with the layer that explains the zero, and misses per skill. The fire log cannot see the norms, the hooks, or knowledge applied without loading a skill, so a zero there is a question, not a verdict; the 2026-07-29 activation audit (docs/AUDIT_2026-07-29_activation.md) is the worked example of reading it wrong and then right.

## The index gate

One fact, the skill count, was stated in four places (the README table, the README prose, `plugin.json`, `marketplace.json`) with nothing asserting any of them, and it drifted: `1d780cb` deleted a skill on promotion to a hook and updated the table row only, so both manifests shipped wrong by one until a later addition made them accidentally right. `hooks/check-index.mjs` closes it, run by `.github/workflows/check-index.yml` on every push and PR (free, this repo is public):

```bash
node hooks/check-index.mjs
```

It asserts the **set** in both directions, which is the load-bearing half, plus each skill's frontmatter `name` against its directory, a non-empty description, and all three stated counts. It is a CI gate rather than a hook because the drift was caused by a **deletion**, which no Write or Edit hook can see. `hooks/check-index.test.mjs` proves it can go red: fourteen cases, each mutating one thing and pinning the substring that identifies its own defect, including a regression case named for `1d780cb`. Run against real history the gate reds with three problems at `1d780cb` and two at `385755d`, tracking the partial fix exactly.

The same workflow's second job runs **every** hook suite (`hooks/*.test.mjs`) on ubuntu, and that job is why it is worth having. `lint-after-edit.test.mjs` built `#!/bin/sh` linter stubs until 2026-09-15, so its six "fires" cases could not execute on the Windows machine this library is maintained from, and before the job existed they were not executed on Linux either. Six cases guarding nothing look identical to six cases passing, and here they hid a hook that was silent on every Windows project; the stubs are node scripts now and the suite runs on both platforms. Every suite runs even after one fails, so a red run reports the whole picture rather than the first fault.

## The archive gate

Each `*/*.skill` file is a committed zip of its skill directory (`SKILL.md`, `references/*`, `scripts/*`; `README.md`, `UPSTREAM.md` and `.gitkeep` are deliberately not bundled). Nothing regenerated one on edit and nothing diffed one against the tree, so the two drifted silently: LESSONS_LEARNED entry 9 records three archives shipping a scanner their own `UPSTREAM.md` said was patched, because a stale package has no reader until something installs it, and then it installs the past. `hooks/check-archives.mjs` closes it, run by the same workflow on every push and PR:

```bash
node hooks/check-archives.mjs
```

It reads each archive's members with a stdlib-only zip reader (no dependencies) and asserts the **set** against the directory in both directions — every bundled file present in the archive, every archive member still on disk — plus each shared file's content, normalising CRLF so a checkout's line endings are never mistaken for drift. It reds naming every stale, missing or orphaned member. Like the index gate it is a whole-tree gate, not a Write/Edit hook, because an archive going stale is a non-edit to a second file the edit never touched. `hooks/check-archives.test.mjs` proves it can go red: ten cases each mutating one thing and pinning its own substring, including one in the shape of entry 9's incident (a script patched on disk but not repacked). When it reds, `node hooks/pack-skill.mjs <skill-dir>` (or `--all`) rebuilds the archive deterministically, so the fix is one command.

Domain skill packs do not live here (DECISIONS.md, 2026-09-14). `hooks/install-marketing-pack.mjs <target-repo>` installs a stripped, pinned subset of `coreyhaines31/marketingskills` into a repo's own `.claude/skills/` with an `UPSTREAM.md` listing every cut, and refuses to overwrite a same-named skill it did not install; `hooks/install-marketing-pack.test.mjs` proves each cut and each refusal against a fixture pack.

[LESSONS_LEARNED.md](LESSONS_LEARNED.md) holds field notes from applying these skills on real jobs: what broke, what the skills caught, and what only a human pass caught.
