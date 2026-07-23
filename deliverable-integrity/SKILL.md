---
name: deliverable-integrity
description: Three gates for AI-rewritten claims, owner-only facts, and machine-parsed output in any generated document. Claims: diff an AI rewrite claim by claim against the source — the original wins unless the owner confirms. Gaps: facts the generator does not hold render as loud allowlisted placeholder tokens, never plausible guesses. Parsing: re-extract the document's text and assert required strings present, banned glyphs absent. Does not fire on code citations in engineering docs (verified-citations) or on style-level AI-tell removal (unslop-text).
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

## What this skill does not do

It does not verify code or history citations (verified-citations), police prose style
(unslop-text), or substantiate marketing claims (substantiate-outward-claims). It keeps a
generated document's factual content honest and its text layer machine-readable.

## Why

A generated deliverable fails in ways a human proofread structurally misses: the page looks
right while the claims drifted, the gaps got papered, and the text layer is junk to the
parser that actually reads it. Evidence: this repo's LESSONS_LEARNED lessons 1, 2, and 5.
