---
name: statute-to-obligations-register
description: Turn a statute, regulation or code (for example LTA 1985, BSA 2022, a RICS code) into an obligations register read from the current official text: one row per duty, each with its section, owner, trigger, evidence, deadline, control and commencement status. Triggers on "map our obligations under X" or "build a compliance register from this regulation". Does not fire on a contract's own obligations (contract-review) or on citing a statute in prose (verified-citations).
---

# Statute to obligations register

A register row exists only if it cites the provision that creates it, read this session in the
current official text. A row from memory is a guess with a section number attached.

## Why this exists

A register is trusted more than the statute it summarises, because it looks finished. Three
failures recur:

- **The obligation from memory.** A frequency, threshold or deadline that feels right and is
  not in the Act, or sits in an amended or repealed version. This library has recorded a
  non-existent statutory interval and a misattributed legal basis heading for a register
  (see verified-citations).
- **The obligation with no one holding it.** A duty with no owner, trigger or evidence is
  prose. Everyone assumes someone else is doing it.
- **The silent drop.** A conditional or exemption-gated duty left out because it "probably
  does not apply", or a prospective change ignored because it is not yet in force. The
  register then looks complete and is not.

## The rule that does the work

**Every register row has every cell filled, its section cites a provision you read this
session, and its status says what the page shows about commencement.** Run this over the
finished register and print the result line:

`Provisions read: s.18 to s.30 | Extracted 14 | Register 11 | Powers and rights 3 | Dropped 0 | Empty cells 0 | Status unread 0 | Pending changes 2 (2 with review trigger)`

Red output, any of:

- `Empty cells 2: R4 Owner, R7 Evidence`. Fill them or the row is not an obligation yet.
- `Extracted 14 | Register 11 | Powers and rights 2 | Dropped 0`: one extracted item has
  vanished. Every extracted item lands in the register, the powers-and-rights list, or the
  dropped list with a reason.
- `Status unread 1: R9`. Re-open the page and record what it says about commencement.
- `Pending changes 2 (1 with review trigger): R2`. Add the review trigger to R2's Control cell
  (rule 8).

`Section` means Act, section and subsection (`LTA 1985 s.20B(2)`), with the URL and the date you
read it in the source column. A row whose section you cannot cite does not go in the register;
it goes in the verification list.

## Supporting rules

1. **Read the current official text, and record three things from the page.** For UK
   legislation that is the latest revised version on legislation.gov.uk. Record the date you
   read it, every outstanding or prospective change the page lists for the provision, and its
   extent (England, Wales, or both). The date the Act's revised text was last updated is a
   date for the whole Act, not the date this provision came into force; never record it as
   the provision's date. Never map from a summary, a guidance note, or an earlier version.
2. **Read scope, definitions and exemptions before extracting.** Who the provision applies to,
   the defined terms it turns on, and any threshold or phased commencement. A threshold often
   sits in a statutory instrument rather than the Act; cite the instrument that holds it.
3. **Extract everything first, then classify.** List every item the text imposes or confers
   before organising. Classify each one:

   | Type | What it is | Where it goes |
   |---|---|---|
   | Duty | Something the entity must do | Register |
   | Prohibition | Something it must not do | Register |
   | Condition on recovery or enforcement | No breach, but a missed step loses a right (a charge becomes irrecoverable, a remedy unavailable) | Register; it behaves like a deadline |
   | Power | Something the entity may do | Powers and rights list |
   | Right of another party | Something a tenant, regulator or other party may require | Powers and rights list. Any duty it creates for you (to respond, to supply) is extracted as its own item, a Duty, so each item lands in one place and the result line still adds up |
4. **Conditional duties stay in.** State the condition in the Trigger cell and let the user
   decide whether it is met. Never omit a row because it looks inapplicable.
5. **Owner is a proposal.** Write `Proposed: <role>` unless the user has named the owner. Do not
   invent an organisation chart.
6. **Evidence is an artefact.** A served notice with its service date, a filed return, a
   register entry, a dated record. "We have a policy" is not evidence.
7. **Deadlines carry the statute's own words.** Quote the period as the text states it
   (`beginning with`, `after`, `not less than`), then the counting convention you applied.
   verified-citations owns the counting rule; this skill defers to it.
8. **Status records commencement, not your view of it.** `In force`, `In force; prospective
   change pending (<amending provision>)`, `Prospective, not in force`, or `Partly in force`,
   each as the page shows it on the date read. A pending change becomes a control: a review
   trigger on the amending provision's commencement.
9. **Gap assessment only against described practice.** Mark Met, Partly met, Not met or Unclear
   only where the user has described what they do. Otherwise the register carries no status
   column for compliance.

## Worked example (read on legislation.gov.uk, 2026-10-03)

Two rows from the Landlord and Tenant Act 1985, as a pattern for the cells, not as advice. Both
provisions extend to England and Wales; re-read both before relying on them, because both carry
prospective changes. These rows are not a reading for your register: rule 1 needs the provision
read in your session, with your own date, and a row copied from here fails it.

| Ref | Section | Type | Obligation | Trigger | Deadline (statute's words) | Owner | Evidence | Control | Status |
|---|---|---|---|---|---|---|---|---|---|
| R1 | LTA 1985 s.20B(1)-(2) | Condition on recovery | Serve the demand for each relevant cost, or notify the tenant in writing that the cost was incurred and that they will be required under the lease to contribute to it by a service charge, within the period in the next cell | Each relevant cost incurred | Demand limb: costs "incurred more than 18 months before a demand for payment of the service charge is served" are not payable (s.20B(1)). Notice limb: "within the period of 18 months beginning with the date when the relevant costs in question were incurred" (s.20B(2)). Counting applied: inclusive, verified-citations' rule, so the period includes the day the cost was incurred; the control works to 15 months for margin | Proposed: service-charge accountant | Dated demand or s.20B(2) notice, with proof of service | Monthly list of costs incurred over 15 months ago and not yet demanded or notified; review trigger on commencement of Leasehold and Freehold Reform Act 2024 ss.53-54 | In force; prospective changes pending (Leasehold and Freehold Reform Act 2024 ss.53-54) |
| R2 | LTA 1985 s.21B(1), (3)-(4) | Duty | Accompany every service-charge demand with the summary of tenants' rights and obligations | Each service-charge demand | "must be accompanied by a summary" (s.21B(1)); no period, so no counting convention | Proposed: credit control | Copy of each demand as sent, with the summary attached | Demand template cannot be issued without the summary; review trigger on commencement of Leasehold and Freehold Reform Act 2024 s.55 | In force; whole section prospectively omitted (Leasehold and Freehold Reform Act 2024 s.55(2)(c)); s.55(3) prospectively inserts a new s.21C |

Sources, latest revised text, read 2026-10-03:
[s.20B](https://www.legislation.gov.uk/ukpga/1985/70/section/20B) and
[s.21B](https://www.legislation.gov.uk/ukpga/1985/70/section/21B). The
consequence for R2 is in s.21B(3) and (4): the tenant may withhold, and the lease's late-payment
provisions do not bite while they do. The form and content of the summary are for regulations
under s.21B(2), and England and Wales each have their own: the Service Charges (Summary of
Rights and Obligations, and Transitional Provision) (England) Regulations 2007 (SI 2007/1257)
and the Welsh equivalent (SI 2007/3160). Read the one for the dwelling's nation before mapping
the content. When s.55 commences, R2 is re-mapped from the new s.21C, read then.

Verification list for these rows: when a cost counts as "incurred" for s.20B is a question for
an authority, not for the register's author; settle it before setting R1's clock.

## Output contract

1. **Header.** Instrument mapped (full title and year), provisions read, URL, date read,
   extent, entity described, date of mapping.
2. **Result line** from the rule above, then the extraction list, which numbers every
   extracted item with its provision and the register ref, powers-list entry or dropped entry
   it became. Without it `Extracted` cannot be checked by anyone but the author.
3. **Register.** `Ref | Section | Type | Obligation | Trigger | Deadline (statute's words) |
   Owner | Evidence | Control | Status`, plus a source column or footnote with URL and date read.
4. **Powers and rights list**, and the **dropped list** with a reason per item.
5. **Gap assessment**, only where practice was described.
6. **Verification list.** Currency, commencement, extent, any threshold resting on facts not
   yet confirmed, any term needing an authority.

## Do not

- Do not state an obligation, frequency, threshold or deadline from memory, even one you are
  sure of.
- Do not cite a section without the subsection that carries the duty.
- Do not treat a prospective provision as in force, or ignore a pending change because it is
  not yet in force.
- Do not drop a conditional duty, a power or a right silently; every extracted item is
  accounted for in the result line.
- Do not assert a compliance status where no practice was described.

## Routes and scope

- A contract's or lease's own obligations → **contract-review** (its full-audit ledger).
- Citing a statute in a handover, plan or decision log, and statutory day counting →
  **verified-citations**.
- Auditing the citations in someone else's register or opinion → **legal-citation-integrity**.
- Turning a register row into a notice to serve → **legal-notice-handling**.

Provenance: forked from rohasnagpal/legal-ai-skills, see [UPSTREAM.md](UPSTREAM.md).
