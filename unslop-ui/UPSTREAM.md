# Provenance — unslop-ui

- **Forked from:** https://github.com/JCarterJohnson/vibecoded-design-tells
- **Upstream path:** `skill/`
- **Upstream commit:** `f7c4aefc2c79` (cloned 2026-06-25)

## Local patches (not in upstream)

`scripts/devibe_scan.py`:

1. **UTF-8 stdout.** Added `sys.stdout.reconfigure(encoding="utf-8")` after the imports. Without it the scanner crashes with `UnicodeEncodeError` whenever a finding's snippet contains an emoji, on Windows cp1252 consoles.
2. **Broadened the emoji rule.** Replaced the hand-picked ~14-emoji list with full Unicode ranges (the `EMOJI` constant), so the `emoji-as-icons` rule detects any emoji, not just the handful that were hardcoded. (The text/code scanners already did this upstream.)

When updating from upstream, re-apply both.
