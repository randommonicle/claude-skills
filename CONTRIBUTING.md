# Contributing

Rules for changing this library. Moved off the README on 2026-09-16: they bind a maintainer, not
a reader.

## Conventions

- A forked/edited skill carries an `UPSTREAM.md` recording its source repo, source commit, and our local patches. **When pulling an upstream update, re-apply the patches listed there** so our fixes are not lost.
- Our own original skills don't need an `UPSTREAM.md`.
- Every leaf description carries a "does not fire on" line; no two leaves share their primary trigger vocabulary; soft cap ~60 words per description.
- Adding a leaf updates its hub's routing table in the same commit.

## Before you commit

```bash
node hooks/check-index.mjs
```

```bash
node hooks/check-archives.mjs
```

```bash
for t in hooks/*.test.mjs; do node "$t" || echo "FAILED: $t"; done
```

The index gate asserts the skill set in both directions, each skill's frontmatter `name` against
its directory, a non-empty description, the wiring of the two command gates, and the three stated
skill counts. The archive gate asserts each committed `.skill` zip against its directory. Both run
in CI on every push and PR.

How they work, and the drift that caused each: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Adding a skill

1. Write `<name>/SKILL.md`. The `name` must match the directory, be lowercase with hyphens, and
   avoid the reserved words `anthropic` and `claude`. The `description` is what makes it fire, and
   it is loaded in every session whether the skill fires or not, so keep it specific and short.
2. Add a row to the README table and update the count in `README.md`, `.claude-plugin/plugin.json`
   and `.claude-plugin/marketplace.json`. `check-index.mjs` reds if you miss one.
3. Run `node hooks/pack-skill.mjs <skill-dir>` if the skill ships a `.skill` archive.
4. State the "does not fire on" line against the nearest existing skill, not in the abstract.
