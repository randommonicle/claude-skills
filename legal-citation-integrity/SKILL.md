---
name: legal-citation-integrity
description: Audit every citation in a finished or received legal document (statute, regulation, case, quoted authority, internal cross-reference) before anyone relies on it. A citation is Confirmed only with a retrieval behind it; every citation in the document appears in the audit table. Triggers on "check every citation in this opinion", "are these cases real", "does this quote say that". Does not fire on code or commit citations, or on statutes you cite while writing; verified-citations owns both.
---

# Legal citation integrity

A citation is Confirmed only when you opened the source this session and the table shows what
you read. Everything else is unverified, and the output says so.

## Why this exists

A fabricated legal citation is formatted to look right, which is why it survives. Two failures
follow from that, and both are invisible from inside the pass that commits them:

- **The checker that only reports what looks wrong.** A confident fabrication looks plausible,
  so a pass that lists only the suspicious citations misses exactly the one it exists to catch.
- **The checklist that reads as a confirmation.** A table of citations with a "what to verify"
  column, delivered without any retrieval, is read downstream as "the citations were checked".

## The rule that does the work

**Count, then match.** Extract every citation first, number it with its location, and print the
count. The audit table then has exactly one row per extracted citation, and every row marked
`Confirmed` names its retrieval: the source, the date read, and the words read there that match
the attribution. A retrieval with no quoted words counts as no retrieval, because the quoted
words are what lets a reviewer re-open the source and compare. Print the result line before the
table:

`Extracted 23 | Table rows 23 | Confirmed 9 (9 with retrieval) | Contradicted 1 | Could not confirm 4 | Not attempted 9`

Red output, any of:

- `Extracted 23 | Table rows 21`: two citations are missing from the audit. Find them.
- `Confirmed 9 (8 with retrieval)`: one row claims a check that did not happen. Downgrade it.

Extraction is mechanical, not by eye. Search the text for: `Act`, `section`, `s.`, `ss.`,
`Sch.`, `para`, `reg.`, `Regulations`, `Order`, `SI`, `r.` and `Part` followed by a number; a
year in square brackets or round brackets followed by a report abbreviation; ` v ` and `Re `;
quotation marks; and internal references (`clause`, `paragraph`, `above`, `below`,
`Appendix`, `Schedule`). Record every hit, then discard only the ones that are not citations,
with a word on why.

## Supporting rules

1. **What to check depends on the type.** Record the checks required in the row, and mark
   Confirmed only when all of them are done; otherwise the result is Could not confirm, naming
   the check that is outstanding.
   - Statute or statutory instrument: it exists; the section says what the document attributes
     to it; it was in force on the date that matters to the document; its territorial extent
     covers the facts; it has no amendment, repeal or prospective change that alters the point.
   - Case: the citation resolves to that case; the passage says what is attributed; the pin
     cite is right; subsequent treatment (overruled, distinguished, reversed). Without a citator,
     write `subsequent treatment not checked` and the row cannot be Confirmed.
   - Quotation: the words match the source exactly, and the excerpt does not reverse its sense
     in context.
   - Internal cross-reference: the target exists in this document and says what the reference
     implies.
2. **Read primary sources, not summaries.** For UK legislation read the revised text on
   legislation.gov.uk and note the date you read it, any outstanding or prospective changes the
   page lists for that provision, and the extent. The date the Act's revised text was last
   updated belongs to the whole Act; it is not the date the provision came into force. A
   point-in-time version is needed when the document concerns an earlier date. For a judgment read the judgment
   itself (for example on the National Archives' Find Case Law service or BAILII), not a
   headnote, blog or AI summary.
3. **Four results, never blurred.** Confirmed, Contradicted, Could not confirm, Not attempted.
   With no retrieval tool available the whole table is Not attempted and the header says, in
   these words, `No citation in this table has been verified.`
4. **Flag fabrication tells even when you cannot verify.** A generic case name, a citation
   format unlike the rest of the document, a pin cite beyond the length of the source, a section
   number outside the range of the Act, a quotation in a register the source would not use.
   These go in the suspicious list whatever the result column says.
5. **Report; do not repair.** Never edit the document or silently substitute a corrected
   citation. A wrong citation is reported with what the source actually says, and the
   correction is the drafter's.
6. **Rank by weight.** Mark each row `load-bearing` or `background` according to whether a
   conclusion in the document depends on it, and verify the load-bearing rows first.

## Output contract

1. **Header.** Document audited (name and version), mode (live retrieval or checklist only),
   tools used, date of audit.
2. **Result line** from the rule above.
3. **Audit table.**
   `# | Location | Citation as written | Type | Weight | Checks required | Retrieval (source, date read, words read) | Result | Note`.
   `Retrieval` is empty only when `Result` is Not attempted.
4. **Suspicious citations.** Row numbers and the tell for each.
5. **Priority list.** Load-bearing rows not yet Confirmed, in the order to verify them.

## Do not

- Do not mark a row Confirmed because the citation is well formatted or familiar.
- Do not leave a citation out because it looks obviously right.
- Do not write a summary sentence saying the citations were checked; the table is the evidence.
- Do not fix the document.
- Do not state from memory what a statute or case says in the Note column; if you did not read
  it this session, the row is Could not confirm or Not attempted.

## Routes and scope

- Citations you make while writing (a statute in a handover, a file:line in a plan, a commit
  date) → **verified-citations**, which owns author-time citation discipline.
- A whole-contract risk review in which a citation check is one part → **contract-review**.
- Building a register from a statute's text → **statute-to-obligations-register**.

Does not fire on code, schema, migration, PR or commit citations in engineering documents.
Provenance: forked from rohasnagpal/legal-ai-skills, see [UPSTREAM.md](UPSTREAM.md).
