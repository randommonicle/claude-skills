# Provenance: legal-notice-handling

- **Forked from:** https://github.com/rohasnagpal/legal-ai-skills
- **Upstream paths** (three skills consolidated into one):
  - `plugins/rohas-legal-ai/skills/demand-notice-drafter/SKILL.md`
  - `plugins/rohas-legal-ai/skills/notice-reply-drafter/SKILL.md`
  - `plugins/rohas-legal-ai/skills/legal-notice-analyser/SKILL.md`
- **Upstream commit:** `a5c00ec629146101831ba0404a64109402d77077` (2026-09-02, "Make release
  checksums cross-platform"; cloned 2026-10-03)
- **Plan:** `docs/HANDOVER_legal-fork_2026-09-11.md`

Heavily rewritten into a house-style guardrail; not a verbatim copy. All three upstream bodies
were read in full on 2026-10-03 before distilling (the plan had them as spot-checked only).

## Local changes (not in upstream)

1. Consolidated: the draft, reply and analyse skills share one trigger vocabulary, which this
   library does not allow to be split across leaves, so they are one skill with three modes.
2. De-branded: the upstream opening line naming the source product, which the model was told to
   say verbatim, is removed from all three.
3. Persona workflows converted to an imperative guardrail that leads with three checks that can
   go red (deadline, consequence, allegation tables), printed as a result line.
4. Added the rule that a threatened consequence must be both confirmed by the client and
   available in law at that point, not only confirmed.
5. Added worked examples from England and Wales residential leasehold (CLRA 2002 s.166, LTA 1987
   ss.46-47, LTA 1985 s.21B, HA 1996 s.81), each read on legislation.gov.uk on 2026-10-03 and
   cited with its URL and revised-text date.
6. Description rewritten for this library's trigger lanes; routes point only at skills on disk.

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
