---
name: trace-one-record
description: Before combining two figures into a derived total, or asserting that one set of amounts sits outside another, trace a single record end to end through both sources to establish what each actually contains. Triggers on any total owed, due, outstanding, exposed or net; on adding, subtracting or netting figures from different reports, systems or dates; on the phrases "sits outside", "excludes", "in addition to", "the two therefore add"; and on any reconciliation between two sources. Does not fire on arithmetic within a single report, on a figure quoted from one source with no combination, or on citations of files and commits in prose, which belong to verified-citations.
---

# Trace one record

A subscriptions report totalling annual contract value was added to a one-off payments report to
give total revenue. The subscriptions report already annualised the one-off payments. Both figures
were individually correct, both were checked against their own source, the addition was right, and
the total was wrong by the whole of the second number.

The same shape, from a UK property-management matter in September 2026: a cash forecast issued to
a client board added an overdue-balances figure to an unpaid levy figure. The overdue report
already contained the levy. The total was overstated by 71% of the true figure and was labelled
in the document as the figure to use. A client director found it the next morning.

Two proofs were available before either document issued, each about two minutes' work. One
account traced through both sources showed a brought-forward balance appearing in full in the
report assumed to exclude it. And an earlier internal figure, minus the payments banked since,
reconciled to the arrears total exactly, which meant the author's own arrears number had always
contained the levy.

## Why per-figure checking cannot catch this

The defect lives **in the relationship between two correct figures**. That is the whole difficulty
and the reason this needs a named rule rather than general care.

The two things a careful reviewer does by reflex both pass:

- **Internal consistency.** The arithmetic is right. Writing `a + b = c ✓` in your working is not
  a check on whether `a` and `b` should be added, and the tick makes it feel like one.
- **Per-figure source validation.** Each number traces cleanly to its own report. Neither report
  is wrong. Nothing you can ask *about a single figure* will surface it.

What is never asked is the composition question: **what is in this report that I have not looked
at?**

## The rules

**1. Name what each source contains before you combine them.** Not what it is called, not what
its filter says, not what its date scope implies. What is in it. An "overdue this year" report
that carries balances brought forward is not restricted to this year, whatever its title says.

**2. Prove it on one record, end to end.** Pick a single account, unit, order or customer and
trace every component of its balance through both sources. One traced record falsifies an assumed
separation faster than any amount of reasoning about what the reports ought to hold.

**3. A stated check is not a performed check.** "A demand was pulled and checked", "verified
against the ledger", "confirmed with accounts", sitting inside the artefact you are auditing, is a
claim of exactly the same standing as the figure it supports. Re-derive it or drop it. In the
property case the stated check was *true and irrelevant*: a demand had been pulled and did carry
no levy line, which shows the levy was not demanded again, not that unpaid levy sits outside the
account balance. A true premise supporting a false inference is the hardest kind to catch, because
checking the premise confirms it.

**4. Where a second independent route to the same total exists, take it.** Two sources agreeing
is evidence. One source plus an inference is not. The property case had one: an earlier figure
less subsequent receipts, which reconciled exactly and settled the question without argument.

**5. Correct addition is not evidence of a correct total.** See above. If your working contains a
ticked sum and no note of what each input contains, you have checked the arithmetic and nothing
else.

**6. One reconciliation tying does not prove an extraction is complete.** Cross-check on a
different axis from the one you aggregated on: if you totalled by month, check by unit; if by
customer, check by period. A window that ties may simply contain none of the rows you are dropping.
In the same matter, a case-sensitive match on `'Payment received'` silently dropped every row
written `'Payment Received'`, and a *different* reconciliation tying to the penny was taken as
proof the extraction was sound. It was not; that window happened to hold none of the affected
rows. The error surfaced by accident, from a per-unit analysis run for an unrelated question.
Cross-checking on a second axis finds this. More precision on the first axis never will.

## The question that does the work

> **What is in this report that I have not looked at?**

and its sharper form, when a document asserts two sets are disjoint:

> **Show me one record where I can see the boundary.**

## The shape, so you recognise it outside finance

Two correct figures, an assumed disjointness, an internally consistent total, and no single record
traced through both:

- Summing a subscriptions report and a one-off payments report when the first already annualises
  the second.
- Adding open tickets to escalated tickets when escalated is a status, not a separate queue.
- Netting a deferred-revenue balance against an unbilled balance when one system posts both.
- Adding headcount from an HR export to contractor count from a finance export when contractors
  appear in both.
- Any "total exposure" assembled from two dashboards.

## Routes

- The claim you are about to trust came from a subagent, a reviewer or your own defect analysis:
  **findings-are-evidence**. Rule 3 above is its sibling for claims embedded in the artefact under
  audit rather than in a review of it.
- The figure appears in more than one issued document and you are correcting it:
  **blast-radius-grep**, and read its completion gate before trusting the sweep.
- You are about to state the corrected figure in something a client or tribunal will read:
  **verified-citations**, then **deliverable-integrity**.
- The extraction you are cross-checking is a test fixture or a seed rather than a report:
  **prove-it-can-fail**.

## What this skill does not do

It does not check arithmetic within a single report, and it does not fire on a figure quoted from
one source with no combination. It has nothing to say about estimates and forward assumptions,
which belong to the document's own caveats, or about citations of files, migrations and commits,
which are **verified-citations**. It is only about what happens when two amounts meet.

## Why

The failure is invisible to both reflexes a careful reviewer has. The arithmetic checks out, every
figure traces to its own source, and the total is still wrong, sometimes by most of itself. It
survives review precisely because reviewing it the obvious way confirms it, and it is usually
found by the reader the document was written for, which is the worst possible discovery route.
Tracing one record costs about two minutes and is the only check that reaches the defect.

## Provenance and maintenance

Date stamp: 2026-09-16. Raised as a written proposal by a separate session working a live UK
property-management matter, after four misses recorded by that session in its own review: a ticked
sum accepted as a check, a stated check accepted as a performed one, a conclusion drawn from
truncated search output, and a case-sensitive extraction validated by a reconciliation that tied
for unrelated reasons.

The client matter's own figures, names and identifiers are deliberately absent from this file;
this repository is public. The incident is described structurally, and the opening example is a
non-property case of the same shape. The matter's full record lives in that engagement's own
handover and lessons log.

Misses 3 and 4 of that proposal are not owned here: miss 3 belongs to **blast-radius-grep**, whose
completion gate was added in the same commit as this skill, and miss 4's extraction-completeness
half is rule 6 above with a route to **prove-it-can-fail**.
