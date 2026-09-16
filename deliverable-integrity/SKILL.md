---
name: deliverable-integrity
description: Three gates for AI-rewritten claims, owner-only facts, and machine-parsed output in any generated document, plus the structural assertions a text diff cannot see, such as a document that opens on a blank page. Claims: diff an AI rewrite claim by claim against the source — the original wins unless the owner confirms. Gaps: facts the generator does not hold render as loud allowlisted placeholder tokens, never plausible guesses. Parsing: re-extract the document's text and assert required strings present, banned glyphs absent. Does not fire on code citations in engineering docs (verified-citations) or on style-level AI-tell removal (unslop-text).
---

# Deliverable integrity

Three gates distilled from this library's own field notes (LESSONS_LEARNED lessons 1, 2, 5),
all found on one real job: a CV whose star glyph rendered perfectly and parsed as garbage, a
rewrite that quietly promoted "supported investigations" into "conducted investigations" and
invented a job title, and date facts only the document's owner could resolve.

## Gate 1 — claims: diff the rewrite claim by claim

The dangerous failure of an AI rewrite is not that it sounds like AI; it is that the claims
move. Diff against the source claim by claim, not sentence by sentence. Where the rewrite
says more than the original, the original wins unless the owner confirms the stronger claim
in writing. Keep a record of reverted inflations so they cannot creep back in a later edit.

## Gate 2 — gaps: loud placeholders, never plausible guesses

Facts the generator does not hold render as unmissable tokens — `[[TOKEN: question for the
owner]]` — collected once into questions the owner can actually answer. Gate the build on an
allowlisted token set so an unresolved gap is a build failure, not a shipped guess. A
contradiction in owner-supplied facts holds the slot open; never resolve it by picking the
convenient side.

## Gate 3 — parsing: re-extract and assert

Rendering and parsing are different code paths, and a machine reader uses the one you did
not look at. Any document destined for machine consumption gets verified by re-extracting
its text and asserting: required strings present, banned strings absent, no glyphs outside
the expected range — fail the build otherwise. The manual version: select all, copy, paste
into Notepad. What Notepad shows is what the parser sees.

### Structure counts as parsing, not just text

Re-extracting the text catches a wrong word. It does not catch a document that is structurally
wrong while every word in it is right, and the reader sees the structure first.

The worked case: a generator emitted a page break before the first paragraph, so **every**
document it produced opened on a blank page. Nothing in the text was wrong. A recipient sees an
apparently empty document, and for a client-facing report that is the whole first impression.

```bash
python deliverable-integrity/scripts/check_docx_leading_break.py out/*.docx
```

Exit 0 when every file opens on content, 1 when any opens on a break, and it names which of the
two causes it found because they need different fixes upstream.

**The check that was contributed could not catch half its own subject, and that is the reusable
lesson.** It tested for a page-break run (`w:type="page"`) and not for `<w:pageBreakBefore/>`,
which is what a paragraph style with "page break before" sets and is at least as common. Measured
against fixtures on 2026-09-16, it passed a document that opens blank. When you inherit a
verification script, put a known-bad artefact through it before you trust a green run: a check
written from one instance of a bug tends to detect that instance and not the class
(**prove-it-can-fail**).

Generalise past `.docx`. For any generated artefact, assert the structural properties a reader
meets before the words: a PDF's page count against what the content implies, a spreadsheet's
first populated row, an email's first rendered line, a CSV's header row surviving the writer.
These are cheap to assert and invisible to a text diff.

## What this skill does not do

It does not verify code or history citations (verified-citations), police prose style
(unslop-text), or substantiate marketing claims (substantiate-outward-claims). It keeps a
generated document's factual content honest and its text layer machine-readable.

## Why

A generated deliverable fails in ways a human proofread structurally misses: the page looks
right while the claims drifted, the gaps got papered, and the text layer is junk to the
parser that actually reads it. Evidence: this repo's LESSONS_LEARNED lessons 1, 2, and 5.
