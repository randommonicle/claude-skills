# Provenance: contract-review

- **Forked from:** https://github.com/rohasnagpal/legal-ai-skills
- **Upstream path:** `plugins/rohas-legal-ai/skills/contract-reviewer/` (`SKILL.md` and
  `references/{leases,licensing-agreements,loan-and-facility-agreements}.md`)
- **Upstream commit:** `a5c00ec629146101831ba0404a64109402d77077` (2026-09-02, "Make release
  checksums cross-platform"; cloned 2026-10-03)
- **Plan:** `docs/HANDOVER_legal-fork_2026-09-11.md`

`SKILL.md` is heavily rewritten into a house-style guardrail; it is not a verbatim copy. The three
files under `references/` are verbatim copies.

## Local changes (not in upstream)

`SKILL.md`:

1. De-branded: the upstream opening line naming the source product, which the model was told to
   say verbatim, is removed.
2. Persona workflow converted to an imperative guardrail that leads with a check that can go red
   (clause check, law check, interaction check, printed as a self-check line).
3. Description rewritten for this library's trigger lanes, with a "does not fire on" line.
4. Routes to upstream skills that do not exist in this library (clause comparison, obligations
   extraction, indemnity analysis, redline drafting, and the shareholder, government and
   data-processing reviewers) removed; routes now point only at skills on disk.
5. The 41-parameter coverage sweep (drawn from the CUAD dataset) removed; full-audit mode keeps
   an obligations ledger and a risk-allocation statement instead.
6. Issues table gains `Quoted words` and `Read with` columns so the red checks are mechanical.

## Known upstream artefacts in `references/`, deliberately unpatched

The references are kept verbatim so an upstream sync is a plain diff. Read them with these in
mind:

- They contain em dashes, which this library's own prose avoids.
- They name the upstream skill, `contract-reviewer`, and its "base method"; `SKILL.md` maps those
  terms onto this skill in its "Agreement-type references" section.
- `leases.md` uses the "leave-and-licence" idiom, which is Indian usage. For England and Wales,
  read it as a licence to occupy.
- They mention upstream output sections (a coverage sweep, a risk-allocation section) that this
  skill only produces in full-audit mode.

When updating from upstream, re-copy the references verbatim and re-check this list.

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
