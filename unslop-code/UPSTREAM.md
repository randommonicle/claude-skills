# Provenance — unslop-code

- **Forked from:** https://github.com/JCarterJohnson/vibecoded-design-tells
- **Upstream path:** `unslop-ai-code/skill/`
- **Upstream commit:** `f7c4aefc2c79` (cloned 2026-06-25)

## Local patches (not in upstream)

`scripts/unslop_code_scan.py`:

1. **UTF-8 stdout.** Added `sys.stdout.reconfigure(encoding="utf-8")` after the imports, so the report doesn't crash with `UnicodeEncodeError` on emoji snippets on Windows cp1252 consoles.

`references/tells.md`:

2. **Route to earn-every-line (2026-08-17).** One sentence appended to entry 10 (over-engineering)'s Fix line, pointing at the in-house earn-every-line skill for the write-time discipline. Re-apply after an upstream refresh of the catalog, then repack (`node hooks/pack-skill.mjs unslop-code`).

When updating from upstream, re-apply.
