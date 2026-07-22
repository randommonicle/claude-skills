# claude-skills

Personal, version-controlled [Claude Code](https://claude.com/claude-code) skills, synced to `~/.claude/skills/`. Installed at the **user level**, so they apply to every project on this machine automatically (no per-project setup).

## Skills

| Skill | What it does |
|-------|--------------|
| **unslop-ui** | Strips the design "tells" that make a web UI read as AI-generated. Scanner + build/audit guidance. |
| **unslop-text** | Strips the tells that make prose read as AI-generated (reports, copy, chat). |
| **unslop-code** | Strips the surface tells that make source code read as AI-generated. |
| **skill-library-builder** | Turns a real repo into a project-specific skill library that preserves operating knowledge. Project-agnostic; moved here from the PropOS repo 2026-07-20. |
| **verified-citations** | Stops fabricated and drifted `file:line` / PR / date references in docs that cite code. Requires every citation to carry the quoted line, so it cannot be produced from recall. |
| **committee-review** | Three-lens committee review (positive, adversarial, neutral chair) of a whole project: one shared evidence pass, attribution-stripped consolidation, item-by-item voting with recorded dissents and amendments. Written from the PropOS 2026-07-22 first run. |
| **ai-surface-discipline** | Input minimisation, output discipline, and a human-in-the-loop gate on every path that sends data to an LLM, for regulated contexts. |
| **confirm-before-push** | Per-action authorisation before any push, merge, or protected-branch fast-forward. No standing approvals. |
| **db-migration-verification** | Every migration ships with a post-apply verification query that reads catalog state directly. |
| **flag-deferred-items** | Plants grep-able `FORWARD()` anchors at the code site where deferred work will land. |
| **handover** | Structured handover note when context runs low or a session wraps; reads the real `/context` figure, never an estimate. |
| **lint-after-edit** | Runs the project's linter on each edited JS/TS file and reports without blocking. |
| **plan-first** | File list, test list, and out-of-scope stated before code on any non-trivial commit. |
| **safe-smokes** | Never destructive against shared or live data in tests, smokes, or seeds; flip-and-restore with try/finally. |

The three **unslop-\*** skills are **forks** of [JCarterJohnson/vibecoded-design-tells](https://github.com/JCarterJohnson/vibecoded-design-tells) with local patches applied for our workflow — see each skill's `UPSTREAM.md` for the exact source commit and what we changed. Every other skill is ours, written in-house; most were distilled from PropOS working practice and are project-agnostic.

[LESSONS_LEARNED.md](LESSONS_LEARNED.md) holds field notes from applying these skills on real jobs: what broke, what the skills caught, and what only a human pass caught.

## Install on a new machine

```bash
git clone <this-repo-url> ~/.claude/skills
```

Claude Code discovers user-level skills automatically; they trigger on their descriptions.

## Conventions

- A forked/edited skill carries an `UPSTREAM.md` recording its source repo, source commit, and our local patches. **When pulling an upstream update, re-apply the patches listed there** so our fixes are not lost.
- Our own original skills don't need an `UPSTREAM.md`.
