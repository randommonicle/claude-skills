---
name: legal-notice-handling
description: Draft, reply to, or analyse a legal notice (rent or service-charge demand, forfeiture or breach notice, statutory notice, letter before action). Every deadline is a calendar date with its arithmetic; every threatened consequence is confirmed and lawfully available; an admitted fact never concedes a legal conclusion. Triggers on "draft a demand", "reply to this notice". Does not fire on a whole-contract review (contract-review) or the output file's integrity (deliverable-integrity).
---

# Legal notice handling

A notice is evidence of what was demanded and by when. Every date in it is a calendar date,
every consequence is one the sender will carry out and is allowed to, and every admission is of
fact only.

## Why this exists

Notices fail on the details a reader checks later, usually in front of a tribunal:

- **The soft deadline.** "Within 14 days" or "promptly" leaves the recipient to choose the
  start date and the counting rule, and a statutory notice with a date outside its permitted
  window can be invalid.
- **The empty threat.** A consequence the client will not pursue, or cannot lawfully pursue
  yet, weakens the notice and can be used against the sender. In residential leasehold this is
  common: forfeiture threatened over a service charge that has been neither determined nor
  admitted (see the worked examples).
- **The careless concession.** "Yes, the payment was late" written so it also reads as "we are
  in breach". The fact can be conceded; the legal conclusion the other side draws from it is a
  separate question.

## The rule that does the work

**Build the tables the mode requires (see Modes) before writing prose. Print the result line
with a part for each of those tables and no other; any failure is red.**

- Draft: `Deadlines 3 (3 with calendar date and arithmetic) | Consequences 2 (2 confirmed, 2 with basis, 2 available now; 1 cut, reported to the client)`
- Reply or analysis: `Deadlines 2 (2 with calendar date and arithmetic) | Allegations 6 in notice, 6 answered (0 admissions without a characterisation entry)`

Count `in notice` from the notice itself, not from your table, and count `cut` from the
consequences the client asked for, so a dropped row shows as a gap rather than vanishing.

1. **Deadline table.** `Deadline | Source of the period (notice, lease clause, or statute, with the
   words quoted) | Start event and its date | Counting convention | Calendar date | Margin`.
   Every deadline in a notice you draft, and every deadline found in a notice received, gets a
   row. Red output: `Deadline 2 ("within 21 days"): no calendar date`. Search your draft for
   `within`, `days`, `weeks`, `months`, `promptly`, `forthwith`, `immediately`, `reasonable`,
   `on demand`, `by return`, `without delay` and `as soon as`; each hit maps to a row or is
   rewritten.
2. **Consequence table** (drafting). `Stated consequence | Client confirmed they will pursue it
   (who, when) | Basis (lease clause quoted, or statute read this session with URL and date) |
   Available now? (yes, with the provisions checked, or the step that must come first)`. Red
   output: `Consequence 1 ("we will forfeit the lease"): not confirmed`, `basis not retrieved`,
   or `Available now? not established`. A lease clause giving the right is a basis; it does not
   answer `Available now?`, which needs the statutory restrictions on that step read this
   session. A consequence that fails any of the three is cut, not softened, and the cut is
   reported to the client with the cell that failed, since they asked for it.
3. **Allegation table** (replying or analysing). Count the allegations in the notice and
   number them in the notice's own order. `No. | Allegation as stated | Fact: admitted / denied
   with the client's account / not known / admitted in part | Legal characterisation: not
   admitted / denied / conceded on instruction | Client's own words (source)`. Red output:
   `Allegations 6 in notice, 5 answered` or `Allegation 3: fact admitted, characterisation blank`.

## Supporting rules

1. **Choose the date with margin.** Where a statute or lease sets a window, pick a date that is
   valid under any plausible counting convention and any plausible date of giving. When a
   posted notice counts as given depends on the lease's notice clause or the statute's service
   provision; read it, or treat the date as uncertain and widen the margin. State the convention
   you used. verified-citations owns the inclusive-counting rule.
2. **Facts are particularised from the user, never supplied.** Who, what, when, with dates and
   document references. No invented fact, legal basis, clause or statute. If no legal basis was
   given, draft on the facts and say no basis is named.
3. **Money is shown with its arithmetic.** Principal, each charge, any interest with its rate and
   the clause or provision it rests on, and the sum.
4. **Formal requirements are a verification list, not an assertion.** Prescribed form, required
   content, method of service, minimum periods: cite what you read this session, or list it as
   open. Never state that a notice satisfies a statutory requirement you did not read.
5. **Service note on every drafted notice.** How it is to be served, to which address, and what
   to keep as proof of the date and method.
6. **Global points first in a reply.** A defective notice, wrong party, limitation, or a missing
   pre-condition can dispose of several allegations at once. State it before the
   allegation-by-allegation answers, as a point to raise rather than a settled defence.
7. **Silence is a decision.** If the client wants an allegation left unanswered, flag the risk
   that silence may be read as acceptance and record the client's instruction.
8. **Analysis does not draft.** In analysis mode, produce the tables, the evidence needed per
   allegation, the admissions to avoid, and the urgency (does any deadline need a holding reply
   first). Draft the reply only when asked.

## Modes

| Mode | Blocking inputs | Tables required | Output adds |
|---|---|---|---|
| Draft a demand or notice | The facts, the exact sum or action demanded, the client's instruction on consequences, the governing law | Deadline, consequence | The notice, a service note, a verification list |
| Reply to a notice received | The notice in full, the client's position on each allegation | Deadline, allegation | Global points, numbered answers, the client's own position, reservation of rights, verification list |
| Analyse a notice received | The notice in full, which side you advise | Deadline, allegation | Evidence per allegation, admissions to avoid, procedural points to consider, recommended posture pending instructions |

## Worked examples: England and Wales residential leasehold

Each provision below was read on legislation.gov.uk on 2026-10-03 (latest available revised
text). Several carry prospective changes; re-read before relying on any of them. They show what
the tables catch; they are not advice on a file, and they are not a retrieval for one: a basis
cell needs the provision read in your session, with your own URL and date, and a line copied
from here fails the consequence table.

- **Ground rent on a long lease of a dwelling.** The tenant is not liable to pay unless the
  landlord has given a notice, and the payment date in it must be neither less than 30 days nor
  more than 60 days "after the day on which the notice is given", nor earlier than the date the
  lease itself makes it payable
  ([CLRA 2002 s.166(1), (3)](https://www.legislation.gov.uk/ukpga/2002/15/section/166)). The
  notice must be in the prescribed form (s.166(5)(a)); read the regulations before drafting. A
  posted notice goes to the dwelling unless the tenant has notified another address in England
  and Wales in writing (s.166(6)). "Rent" here excludes service charges and administration
  charges (s.166(7)). Deadline table: the start event is the day the notice is given, so the
  margin column matters.
- **Any written demand for rent or other sums under a tenancy.** It must contain the landlord's
  name and address, and an address in England and Wales for notices if the landlord's address is
  elsewhere; without that, the service-charge or administration-charge part is treated as not
  due until the information is given by notice
  ([LTA 1987 s.47(1)-(2)](https://www.legislation.gov.uk/ukpga/1987/31/section/47), with an
  exception in s.47(3) while a tribunal- or court-appointed receiver or manager collects those
  charges; a new s.47(3A) is prospectively inserted by the Leasehold and Freehold Reform Act
  2024 s.55(4)(a)). For premises in Wales, a new s.47B, "Building safety information to be
  contained in demands for rent etc: Wales", is prospectively inserted by the
  [Building Safety (Wales) Act 2026 s.74](https://www.legislation.gov.uk/asc/2026/5/section/74)
  (read 2026-10-04). Separately, until the landlord has given notice of an address in England and
  Wales for service, rent, service charges and administration charges are treated as not due
  ([s.48(1)-(2)](https://www.legislation.gov.uk/ukpga/1987/31/section/48)), again except while a
  court- or tribunal-appointed receiver or manager collects them (s.48(3)). Part VI applies to
  premises consisting of or including a dwelling, not held on a business tenancy under Part II of
  the Landlord and Tenant Act 1954, and not to a dwelling in Wales subject to an occupation
  contract ([s.46(1), (1A)](https://www.legislation.gov.uk/ukpga/1987/31/section/46)).
  Consequence table: interest or a late-payment charge running on a sum not yet due has no basis.
- **A service-charge or administration-charge demand.** A service-charge demand must be
  accompanied by the summary of tenants' rights and obligations, or the tenant may withhold and
  the lease's late-payment provisions do not apply for that period
  ([LTA 1985 s.21B(1), (3)-(4)](https://www.legislation.gov.uk/ukpga/1985/70/section/21B); the
  whole section is prospectively omitted by the Leasehold and Freehold Reform Act 2024
  s.55(2)(c)). An administration-charge demand needs its own summary, with the same right to
  withhold ([CLRA 2002 Sch.11 para 4](https://www.legislation.gov.uk/ukpga/2002/15/schedule/11/paragraph/4);
  prospectively omitted by the 2024 Act s.61(a)). Costs incurred more than 18 months before the
  demand is served are irrecoverable unless the tenant was notified in writing within the period
  in [LTA 1985 s.20B(2)](https://www.legislation.gov.uk/ukpga/1985/70/section/20B) (see
  statute-to-obligations-register for that row). In draft mode each of these is a row on the
  verification list: read this session and checked against the demand, or marked open, so the
  client sees which were not checked before the demand goes out.
- **Threatening forfeiture over service charges.** For premises let as a dwelling, a landlord
  may not exercise a right of re-entry or forfeiture for failure to pay a service charge or
  administration charge unless it is finally determined by a tribunal, court or post-dispute
  arbitral tribunal that the amount is payable by the tenant, or the tenant has admitted that it
  is so payable ([HA 1996 s.81(1)](https://www.legislation.gov.uk/ukpga/1996/52/section/81)).
  "Finally determined" has its own meaning: only once the time for an appeal or other challenge
  has run out, or any appeal or challenge has been disposed of (s.81(3), (3A)). Even then, not
  "until after the end of the period of 14 days beginning with the day after that on which the
  final determination is made" (s.81(2)). Serving a notice under section 146(1) of the Law of
  Property Act 1925 counts as exercising that right (s.81(4A)). Business tenancies under Part II
  of the 1954 Act, agricultural holdings and farm business tenancies are outside it (s.81(4)).
- **Threatening forfeiture on a long lease of a dwelling for small or recent arrears, or for
  another breach.** A landlord may not forfeit for unpaid rent, service charges or
  administration charges (or a mix) unless the unpaid amount exceeds the prescribed sum or
  includes an amount payable for more than the prescribed period; the prescribed sum may not
  exceed £500, and a default charge is left out when testing the sum (not the period)
  ([CLRA 2002 s.167(1)-(3)](https://www.legislation.gov.uk/ukpga/2002/15/section/167)). £500 is
  the ceiling, not the test: the sum and period are set by regulations, which on 2026-10-04
  prescribed £350 and three years in England
  ([SI 2004/3086 reg 2](https://www.legislation.gov.uk/uksi/2004/3086/regulation/2)) and in
  Wales ([SI 2005/1352 reg 2](https://www.legislation.gov.uk/wsi/2005/1352/regulation/2)); read
  the one for the dwelling's nation (words in s.167(1) and
  (5) are prospectively substituted by the Leasehold and Freehold Reform Act 2024 s.53(11)). For a breach of a
  covenant or condition in the lease, no section 146 notice may be served until the breach is
  finally determined or admitted, and after a determination not until the 14-day period in
  s.168(3) has ended ([s.168(1)-(3)](https://www.legislation.gov.uk/ukpga/2002/15/section/168)).
  Consequence table: a threat of forfeiture, or of a section 146 notice, not checked against
  s.81, s.167 and s.168 fails `Available now? not established` and is cut.

## Do not

- Do not write a deadline as a period without its calendar date.
- Do not threaten a step the client has not confirmed, or one the law does not allow yet.
- Do not let an admission of fact carry a legal conclusion; fill both columns.
- Do not invent a fact, a defence, a clause or a statute to fill a gap in instructions.
- Do not assert that a notice meets a statutory form, content or service requirement you did
  not read this session.
- Do not soften a firm demand into a negotiable one, or harden it beyond instructions.

## Routes and scope

- Reviewing the lease or contract the notice arises under → **contract-review**.
- Mapping every duty a statute imposes, as a register → **statute-to-obligations-register**.
- Counting a statutory period inclusively ("beginning with") → **verified-citations**.
- Checking the citations in a notice received → **legal-citation-integrity**.
- The generated document's own integrity (placeholders, re-extraction) → **deliverable-integrity**.
- Sending the notice by email and proving delivery → **email-delivery-verification**.

Provenance: forked from rohasnagpal/legal-ai-skills (three upstream skills consolidated), see
[UPSTREAM.md](UPSTREAM.md).
