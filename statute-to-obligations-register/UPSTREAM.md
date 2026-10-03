# Provenance: statute-to-obligations-register

- **Forked from:** https://github.com/rohasnagpal/legal-ai-skills
- **Upstream path:** `plugins/rohas-legal-ai/skills/compliance-obligations-mapper/SKILL.md`
- **Upstream commit:** `a5c00ec629146101831ba0404a64109402d77077` (2026-09-02, "Make release
  checksums cross-platform"; cloned 2026-10-03)
- **Plan:** `docs/HANDOVER_legal-fork_2026-09-11.md`

Heavily rewritten into a house-style guardrail; not a verbatim copy. The upstream body was read
in full on 2026-10-03 before distilling (the plan had it as spot-checked only).

## Local changes (not in upstream)

1. De-branded: the upstream opening line naming the source product, which the model was told to
   say verbatim, is removed.
2. Persona workflow converted to an imperative guardrail that leads with a check that can go red:
   no empty cell, every extracted item accounted for, every status read from the page, printed
   as a result line.
3. Added a type classification (duty, prohibition, condition on recovery, power, right of
   another party) so a power or a right is not entered as an obligation.
4. Added a commencement status column and the rule that a pending change becomes a review
   control.
5. Added a worked example from the Landlord and Tenant Act 1985 (ss.20B and 21B), each provision
   read on legislation.gov.uk on 2026-10-03 and cited with its URL and revised-text date.
6. Upstream routes to skills not in this library (an applicability analyst; Indian domain skills)
   removed. Description rewritten for this library's trigger lanes; day counting deferred to
   verified-citations.

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
