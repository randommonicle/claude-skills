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

The three **unslop-\*** skills are **forks** of [JCarterJohnson/vibecoded-design-tells](https://github.com/JCarterJohnson/vibecoded-design-tells) with local patches applied for our workflow — see each skill's `UPSTREAM.md` for the exact source commit and what we changed. `skill-library-builder` and `verified-citations` are ours, written in-house.

## Install on a new machine

```bash
git clone <this-repo-url> ~/.claude/skills
```

Claude Code discovers user-level skills automatically; they trigger on their descriptions.

## Conventions

- A forked/edited skill carries an `UPSTREAM.md` recording its source repo, source commit, and our local patches. **When pulling an upstream update, re-apply the patches listed there** so our fixes are not lost.
- Our own original skills don't need an `UPSTREAM.md`.
