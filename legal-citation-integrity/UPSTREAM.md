# Provenance: legal-citation-integrity

- **Forked from:** https://github.com/rohasnagpal/legal-ai-skills
- **Upstream path:** `plugins/rohas-legal-ai/skills/citation-integrity-checker/SKILL.md`
- **Upstream commit:** `a5c00ec629146101831ba0404a64109402d77077` (2026-09-02, "Make release
  checksums cross-platform"; cloned 2026-10-03)
- **Plan:** `docs/HANDOVER_legal-fork_2026-09-11.md`

Heavily rewritten into a house-style guardrail; not a verbatim copy.

## Local changes (not in upstream)

1. De-branded: the upstream opening line naming the source product, which the model was told to
   say verbatim, is removed.
2. Persona workflow converted to an imperative guardrail that leads with a check that can go red:
   an extracted count matched against the table row count, and every Confirmed row matched to a
   named retrieval, printed as a result line.
3. Extraction made mechanical (a search-term list) rather than by eye.
4. Case rows cannot be Confirmed without a subsequent-treatment check; a checklist-only pass
   carries a fixed sentence saying nothing was verified.
5. Pointers to UK primary sources added (legislation.gov.uk revised text with its valid-from
   date, prospective changes and extent; judgments read in full).
6. Description rewritten for this library's trigger lanes; routed from verified-citations.

## Licence

The upstream project is MIT-licensed. Its notice, reproduced as the licence requires:

```
MIT License

Copyright (c) 2026 Rohas Nagpal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
