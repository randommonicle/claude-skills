# Provenance: unslop-text

- **Forked from:** https://github.com/JCarterJohnson/vibecoded-design-tells
- **Upstream path:** `unslop-ai-text/skill/`
- **Upstream commit:** `f7c4aefc2c79` (cloned 2026-06-25)
- **Last checked:** 2026-10-11, upstream head identical to the pin

## Local patches (not in upstream)

`scripts/unslop_text_scan.py`:

1. **UTF-8 stdout.** Added `sys.stdout.reconfigure(encoding="utf-8")` after the imports, so the report doesn't crash with `UnicodeEncodeError` on emoji snippets on Windows cp1252 consoles.

When updating from upstream, re-apply.

Local patch 2026-07-23: appended "Banned-character gate scope" section to SKILL.md
(per-project convention scope, from PropOS Sessions 14/16/18; committee item R-39).
Re-apply after any upstream sync.

Local patch 2026-10-11, `references/tells.md`: every `**Quote.**` paragraph became a
`**What people say.**` paraphrase with its subreddit kept, the opening line says so, and one
quoted fragment in entry 3's Evidence line was paraphrased too. See Licence below for why.
Re-apply after any upstream sync: an upstream copy brings the verbatim quotes back.

## Licence

The upstream is MIT-licensed. Its notice is reproduced in full in `LICENSE` beside this file,
which is bundled into `unslop-text.skill` (this file is not).

The same LICENSE says the MIT grant covers the upstream's code and not "the harvested Reddit
text in the data files", and points to a `DATA_NOTE.md` that did not exist upstream on
2026-10-11. The upstream's own skill text quoted Reddit posts verbatim, so this fork removed
the verbatim text rather than rely on a grant that may not reach it (Ben, 2026-10-11).
