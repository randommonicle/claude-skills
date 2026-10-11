# Provenance: unslop-code

- **Forked from:** https://github.com/JCarterJohnson/vibecoded-design-tells
- **Upstream path:** `unslop-ai-code/skill/`
- **Upstream commit:** `f7c4aefc2c79` (cloned 2026-06-25)
- **Last checked:** 2026-10-11, upstream head identical to the pin

## Local patches (not in upstream)

`scripts/unslop_code_scan.py`:

1. **UTF-8 stdout.** Added `sys.stdout.reconfigure(encoding="utf-8")` after the imports, so the report doesn't crash with `UnicodeEncodeError` on emoji snippets on Windows cp1252 consoles.

`references/tells.md`:

2. **Route to earn-every-line (2026-08-17).** One sentence appended to entry 10 (over-engineering)'s Fix line, pointing at the in-house earn-every-line skill for the write-time discipline. Re-apply after an upstream refresh of the catalog, then repack (`node hooks/pack-skill.mjs unslop-code`).
3. **Reddit quotes paraphrased (2026-10-11).** Every `**Quote.**` paragraph became a
   `**What people say.**` paraphrase with its subreddit kept, and the opening line says so. See
   Licence below for why. Re-apply after any upstream refresh of the catalog: an upstream
   copy brings the verbatim quotes back.

When updating from upstream, re-apply.

## Licence

The upstream is MIT-licensed. Its notice is reproduced in full in `LICENSE` beside this file,
which is bundled into `unslop-code.skill` (this file is not).

The same LICENSE says the MIT grant covers the upstream's code and not "the harvested Reddit
text in the data files", and points to a `DATA_NOTE.md` that did not exist upstream on
2026-10-11. The upstream's own skill text quoted Reddit posts verbatim, so this fork removed
the verbatim text rather than rely on a grant that may not reach it (Ben, 2026-10-11).
