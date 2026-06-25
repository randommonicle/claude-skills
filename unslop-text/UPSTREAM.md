# Provenance — unslop-text

- **Forked from:** https://github.com/JCarterJohnson/vibecoded-design-tells
- **Upstream path:** `unslop-ai-text/skill/`
- **Upstream commit:** `f7c4aefc2c79` (cloned 2026-06-25)

## Local patches (not in upstream)

`scripts/unslop_text_scan.py`:

1. **UTF-8 stdout.** Added `sys.stdout.reconfigure(encoding="utf-8")` after the imports, so the report doesn't crash with `UnicodeEncodeError` on emoji snippets on Windows cp1252 consoles.

When updating from upstream, re-apply.
