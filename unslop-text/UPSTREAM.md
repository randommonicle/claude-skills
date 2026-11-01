# Provenance: unslop-text

- **Forked from:** https://github.com/JCarterJohnson/vibecoded-design-tells
- **Upstream path:** `unslop-ai-text/skill/`
- **Upstream commit:** `f7c4aefc2c79` (cloned 2026-06-25)
- **Last checked:** 2026-11-01, upstream head identical to the pin

## Pattern sources (ideas adapted, no text copied)

Two further skills were cross-referenced on 2026-11-01. Neither is a fork base: nothing is
synced from them, and no sentence or example of theirs is in this skill.

- **humanizer**, https://github.com/blader/humanizer, `SKILL.md`, commit `0ef9fe5bc357`
  (2026-10-28, v3.1.0). Its patterns come from Wikipedia's "Signs of AI writing" page, and
  most of its before/after examples are rewrites of Wikipedia article text. That text is
  CC BY-SA, which humanizer's MIT notice cannot relicense, so the same rule as the Reddit
  quotes below applies: the ideas were taken, the examples were written fresh.
- **antislop**, https://github.com/SalZaki/antislop, `skills/remove-ai-slop/`, commit
  `b9c5b74dab49` (2026-06-13).

What came from them: the rewrite rules in SKILL.md (edit, do not obey; keep every fact; the
mark, draft, check, final procedure; file mode; scope), Part D of `references/tells.md`
(entries 22 to 35), and the scanner rules added the same day (see Local patches). What was
seen and not adopted is listed in Part C of `references/tells.md`, so a later sync does not
re-argue it. To check for new ideas, compare their heads against these commits; there is no
merge to re-apply.

## Local patches (not in upstream)

`scripts/unslop_text_scan.py`:

1. **UTF-8 stdout.** Added `sys.stdout.reconfigure(encoding="utf-8")` after the imports, so the report doesn't crash with `UnicodeEncodeError` on emoji snippets on Windows cp1252 consoles.

2. **Rules added 2026-11-01.** `staged-runup`, `closer-line`, `inflated-significance`,
   `knowledge-gap`, `deep-saying`, `strawman-defence`, `ing-rider`, `copula-avoidance`,
   `borrowed-authority` and `title-case-heading`, more patterns in `not-just-x-y` and
   `hype-marketing`, and a paragraph cluster report (two or more distinct rules in one
   paragraph). Tests in `scripts/test_unslop_text_scan.py`.

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
which is bundled into `unslop-text.skill` (this file is not). The two pattern sources above
are MIT too; their copyright lines are appended to the same `LICENSE` as credit.

The same LICENSE says the MIT grant covers the upstream's code and not "the harvested Reddit
text in the data files", and points to a `DATA_NOTE.md` that did not exist upstream on
2026-10-11. The upstream's own skill text quoted Reddit posts verbatim, so this fork removed
the verbatim text rather than rely on a grant that may not reach it (Ben, 2026-10-11).
