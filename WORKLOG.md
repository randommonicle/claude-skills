# Work log

## Legal-skills fork (feat/legal-fork, opened 2026-10-03)

**Goal:** fork four property-legal guardrails from rohasnagpal/legal-ai-skills (MIT, commit
a5c00ec) into this library as house-style skills, per `docs/HANDOVER_legal-fork_2026-09-11.md`
sections 4 to 11, taking the skill count from 46 to 50. Local branch only: nothing pushed, no PR,
no merge into main (Ben, 2026-10-03 12:47 BST: "re-clone and build").

**Checklist**

- [x] Worktree `C:/Users/bengr/.claude/skills-wt-legal-fork` on `feat/legal-fork` from
      origin/main f7de1a1; upstream tracking unset so a bare push has no target
- [x] Source re-cloned with long paths at a5c00ec; the four "spot-checked only" bodies read in
      full (compliance-obligations-mapper, demand-notice-drafter, notice-reply-drafter,
      legal-notice-analyser); security grep over them clean
- [x] `contract-review` (SKILL.md, UPSTREAM.md, three verbatim references), count 47
- [x] `legal-citation-integrity` + `verified-citations` Routes bullet, count 48
- [x] `statute-to-obligations-register`, count 49
- [x] `legal-notice-handling` (three modes), count 50
- [x] Wiring: README fork sentence, NOTICE (forks row left as is, see entry)
- [x] Gates: check-index (50), check-archives (unchanged 5/17), unslop scan high 0 on each new
      SKILL.md, section 11 trigger-orthogonality grep, hooks/*.test.mjs loop
- [x] property-reg-reviewer over the four SKILL.md files; Critical/High re-derived and fixed
- [x] Section 11.5 ride (manual application of contract-review), partial: synthetic excerpt
- [x] Close: checklist walk, closing summary

**Known merge conflict, not resolved here:** `feat/team-loop-stage1` also changes the skill
count (to 47). Whichever lands second must reconcile the count in README (two sites),
`plugin.json` and `marketplace.json`; `check-index.mjs` will red until it does.

### Statutory claims verified (read on legislation.gov.uk, 2026-10-03)

Read through the `/data.xml` endpoint of each page (latest revised text, unapplied effects,
extent) with `scratchpad/leg.py`. Pending amendments listed are those the page marks
prospective, not yet in force. Correction, made after the reviewer pass: the first version of
this table and of the skills gave a "revised text valid from" date per provision. Those dates
were the Act-level `<Body>` dates, not the provision's; they are removed, and the skills now say
not to record that date as the provision's.

| Used in | Provision | URL | Words read (excerpt) | Extent | Pending (prospective) |
|---|---|---|---|---|---|
| register, notices | LTA 1985 s.20B(1)-(2) | https://www.legislation.gov.uk/ukpga/1985/70/section/20B | "incurred more than 18 months before a demand ... is served"; "within the period of 18 months beginning with the date when the relevant costs in question were incurred" | E+W | s.20B(1) words, s.20B(3)-(10): LFRA 2024 ss.53-54 |
| register, notices | LTA 1985 s.21B(1)-(4) | https://www.legislation.gov.uk/ukpga/1985/70/section/21B | "must be accompanied by a summary of the rights and obligations"; "may withhold payment" | E+W | whole section omitted: LFRA 2024 s.55(2)(c); new s.21C inserted: s.55(3) |
| notices | LTA 1987 s.46(1), (1A) | https://www.legislation.gov.uk/ukpga/1987/31/section/46 | "premises which consist of or include a dwelling and are not held under a tenancy to which Part II of the Landlord and Tenant Act 1954 applies"; Wales occupation-contract exclusion | E+W | none listed |
| notices | LTA 1987 s.47(1)-(4) | https://www.legislation.gov.uk/ukpga/1987/31/section/47 | "the name and address of the landlord"; "treated for all purposes as not being due" | E+W | s.47(3A) inserted: LFRA 2024 s.55(4)(a) |
| notices | LTA 1987 s.48(1)-(3) | https://www.legislation.gov.uk/ukpga/1987/31/section/48 | "an address in England and Wales at which notices ... may be served"; rent, service charge or administration charge "treated for all purposes as not being due" | E+W | none listed |
| notices | HA 1996 s.81(1)-(4A) | https://www.legislation.gov.uk/ukpga/1996/52/section/81 | "finally determined ... that the amount ... is payable by him"; "14 days beginning with the day after"; s.81(3), (3A) meaning of finally determined; "(4A) ... include the service of a notice under section 146(1)" | E+W | none listed |
| notices | CLRA 2002 s.166(1)-(7) | https://www.legislation.gov.uk/ukpga/2002/15/section/166 | "either less than 30 days or more than 60 days after the day on which the notice is given"; "must be in the prescribed form" | E+W | none listed |
| notices | CLRA 2002 s.167(1)-(3) | https://www.legislation.gov.uk/ukpga/2002/15/section/167 | "exceeds the prescribed sum"; "must not exceed £500"; default charge deducted | E+W | s.167(1), (5) words: LFRA 2024 s.53(11) |
| notices | CLRA 2002 s.168(1)-(3) | https://www.legislation.gov.uk/ukpga/2002/15/section/168 | "may not serve a notice under section 146(1)"; "finally determined"; "14 days beginning with the day after" | E+W | none listed |
| notices | CLRA 2002 Sch.11 para 4 | https://www.legislation.gov.uk/ukpga/2002/15/schedule/11/paragraph/4 | "A demand for the payment of an administration charge must be accompanied by a summary"; "may withhold" | E+W | para 4 omitted: LFRA 2024 s.61(a) |
| register | SI 2007/1257 (England) and SI 2007/3160 (Wales), titles and preambles | https://www.legislation.gov.uk/uksi/2007/1257 and https://www.legislation.gov.uk/wsi/2007/3160 | both preambles: "in exercise of the powers conferred by section 21B of the Landlord and Tenant Act 1985" (Wales: conferred on the Secretary of State and "now vested in" the Welsh Ministers) | n/a | not checked; content not relied on |
| register (description) | Building Safety Act 2022 (2022 c.30), title only | https://www.legislation.gov.uk/ukpga/2022/30/contents | "Building Safety Act 2022" | n/a | n/a |

LFRA 2024 = Leasehold and Freehold Reform Act 2024 (2024 c.22), title read at
https://www.legislation.gov.uk/ukpga/2024/22/contents.

### Entries

**contract-review.** Distilled the 174-line upstream reviewer to the verified-citations shape:
a three-part self-check (clause, law, interaction) that prints a result line, then supporting
rules, modes, output contract, Do not, Routes. Dropped the CUAD 41-parameter sweep and every
route to an upstream skill that does not exist here. The three references are byte-identical
copies (`cmp`); their upstream artefacts (em dashes, `contract-reviewer` name,
"leave-and-licence") are listed in UPSTREAM.md rather than patched, so an upstream sync stays a
plain diff. No statutory claims in this skill. Description trimmed from the handover draft to
about 70 words against the ~60 soft cap.

**legal-citation-integrity.** The red check is a count match (extracted citations against table
rows) plus a Confirmed-with-retrieval count, printed as one result line. Extraction is a search
list, so a plausible fabrication cannot be skipped by eye. Routed from verified-citations (Routes
bullet plus the README hub row). Deviation from the plan: adding the bullet made
`check-archives` red, because `verified-citations` ships a `.skill` archive the handover did not
mention; repacked it with `node hooks/pack-skill.mjs verified-citations` (still 5 archives, 17
members). No statutory claims in this skill.

**statute-to-obligations-register.** Red check: no empty cell, extracted count equals register
plus powers-and-rights plus dropped-with-reason, and every status read from the page. Added a
type table so a power or a right never enters the register as a duty, and a commencement status
column. The worked example uses LTA 1985 ss.20B and 21B because both carry prospective changes
from the Leasehold and Freehold Reform Act 2024, which shows why the status column exists; both
read on legislation.gov.uk today (table above). Dropped a planned s.21 example: WebFetch's
summary of that page named the amending Act wrongly, and the page itself shows a layered
substitution history too involved for a worked example. Lesson for the rest of the unit: read
statute text through the page's `/data.xml`, not a summarising fetch. The first draft scanned
high: 4 (bold lead-in labels in a list); rewritten as a table, now high: 0.

**legal-notice-handling.** Three upstream skills (demand drafter, reply drafter, notice
analyser) consolidated into one with a mode table, because they share a trigger vocabulary. Red
checks: deadline table (every deadline a calendar date with arithmetic and margin), consequence
table (confirmed by the client and available in law now, else cut), allegation table (count
match, and fact and legal characterisation in separate columns). Worked examples are the
residential leasehold notices Ben handles: s.166 ground rent window, s.47 name and address,
s.21B summary, and s.81 as the empty-threat case (forfeiture or a s.146 notice over an
undetermined, unadmitted service charge). Every provision read via `/data.xml` today; s.81(2)
quoted rather than paraphrased after a first draft shortened its 14-day wording.

**Wiring.** README fork sentence now names the four legal forks; NOTICE carries the
legal-ai-skills attribution beside the vibecoded-design-tells one (NOTICE was not in the plan's
section 9; it lists derived skills, so it is a blast-radius site). The shared unslop forks row at
the foot of the README table is left alone: each legal skill has its own row ending "Fork, see
its UPSTREAM.md", and adding four more names to a slash row would muddle the index gate's
reading of it. Section 11.4 orthogonality grep: outside the four new skills, the only matches
are engineering uses of "citation" (blast-radius-grep, cross-agent-review,
deliverable-integrity, substantiate-outward-claims, trace-one-record), each already deferring
to verified-citations, and "release" in reproduce-the-real-build matching `lease`. Lanes clean.
`hooks/*.test.mjs` loop: no failures.

**Reviewer fixes.** property-reg-reviewer returned 0 Critical, 4 High, 3 Medium, 7 Low. Each High
re-derived from the page before editing:
H1 (s.81(3)-(3A) "finally determined" omitted, so an agent could start the 14 days on the
decision date) confirmed and fixed. H2 (CLRA 2002 s.167 small-arrears bar and s.168 no s.146
notice before determination missing from the forfeiture example) confirmed by reading both
sections; added, without stating the prescribed sum, which sits in regulations not read. H3
(`Available now?` had no red output, so a quoted lease forfeiture clause passed) confirmed and
fixed: a third red output, and a line that a lease clause is a basis but not availability. H4
("valid from" dates were Act-level, not section-level) confirmed in the XML: the dates sat on
`<Body>`; the `P1group` dates differ and are themselves unreliable as commencement dates
(s.167's shows 2002-07-26, the same date as on LTA 1985 s.21B, so it is not a reliable
commencement date for either), so all such dates are removed and the register and
citation skills now say not to record the Act's revision date as the provision's. This was my
error from the first pass. Mediums fixed: M1 (s.48, Sch.11 para 4, s.20B added to the demand
example as blocking inputs), M2 (s.21C insertion and review triggers on R1 and R2; the result
line now counts pending changes with a review trigger), M3 (law-check markers widened, including
statements of legal effect). Lows fixed: L1 (both s.20B limbs quoted), L2 (s.47(3A) flagged), L3
(s.166(6), (7)), L4 ("payable by him" restored), L5 (posting rule no longer asserted), L6 (more
deadline search terms), L7 (England and Wales summary regulations named, titles read). The
reviewer's remaining note, that a retrieval is self-reported in legal-citation-integrity, is
narrowed by requiring quoted words in every retrieval; it cannot be closed by prose.

**Ride (section 11.5), partial.** No real lease is reachable without reading another repository,
which this unit forbids, so the contract-review method was applied by hand to a seven-clause
synthetic lease excerpt written for the purpose (kept in the session scratchpad as
`ride-contract-review.md`, not committed). Result: four graded rows, each clause-cited with
quoted words; the cap row read with its carve-out, the insurance covenant and the
Unreviewable Schedule 3; the law check fired on a first-draft "barred by statute" in the
re-entry row and moved it to the verification list. Self-check line:
`4 rows; clause 4/4; law 1 moved; interaction 2/2`. Auto-load was not tested: a user-level
skill is only listed in a fresh session, and this worktree is not the live library.

**Closing walk.** Worktree and branch: done, upstream unset, nothing pushed. Source: re-cloned
at a5c00ec, the four spot-checked bodies read in full. Four skills: SKILL.md and UPSTREAM.md
each, contract-review with its three references (git blobs identical to upstream). Wiring:
README table rows (4), counts at README lines "lists all" and "skills coexist", plugin.json,
marketplace.json, verified-citations Routes bullet and README hub row, verified-citations.skill
repacked, README licence paragraph, NOTICE. Gates: check-index ok at 50; check-archives ok at
5 archives, 17 members; unslop high 0 on all four; orthogonality grep clean; hooks tests loop
clean. Reviewer: all four High fixed after source checks, Mediums and Lows fixed. Deferred-item
anchor: the handover's section 10 list is the anchor and is unchanged. Not done, by
instruction: DECISIONS.md (Ben lands the handover section 12 draft), LESSONS_LEARNED.md, push.

**Closing summary.** Built four guardrails from rohasnagpal/legal-ai-skills, 46 to 50 skills,
seven commits on feat/legal-fork. Deviations from the plan: verified-citations.skill repacked
(the plan missed the archive); NOTICE extended (not in the plan's edit sites); the shared unslop
forks row left alone; descriptions trimmed to about 70 words, still above the ~60 soft cap;
contract-review drops the upstream CUAD sweep; the ride used a synthetic excerpt. One error of my
own, caught by the reviewer and fixed: Act-level revision dates were first recorded as
provisions' "valid from" dates. Lesson candidate for Ben: read statute text from the page's
`/data.xml`, never a summarising fetch, and never take the page's top-level date as the
provision's.

**Tidy after the closing advisor pass.** Removed an unverified label ("Royal Assent") from the
reviewer-fixes entry; read the preambles of SI 2007/1257 and SI 2007/3160, both made under LTA
1985 s.21B, and updated the table row; flagged the pending LFRA 2024 s.53(11) change on s.167 in
legal-notice-handling, matching the s.47(3A) flag. The reviewer read the pre-fix text, so the
wording added in the fix commit (s.48, ss.167-168, Sch.11 para 4, s.21C, s.166(6)-(7)) has been
checked against the XML by me only; a scoped re-review is Ben's call.

**Scoped re-review, evening 2026-10-03 (headless continuation, 17:20 BST start).** Gates rerun
before any change: check-index "ok: 50 skills, all indexed, all named, all three counts agree";
check-archives "ok: 5 archives, 17 members, all match their skill directories"; unslop high 0
medium 0 low 0 on all four new SKILL.md files. property-reg-reviewer, scoped to
`git diff 3fc169c..6452578 -- '*/SKILL.md'`, read 15 sources as `/data.xml`: 0 Critical, 0 High,
1 Medium, 1 Low; every "prospectively" flag matches an unapplied effect. Both fixed after I read
the XML myself. Medium: s.48 "treated as not due" lacked the receiver or manager exception in
s.48(3) ("shall not be so treated in relation to any time when ... there is in force an
appointment of a receiver or manager"); added. Low: s.167(3) reduces the unpaid amount by a
default charge "for the purposes of subsection (1)(a)" only, so "left out of the count" now reads
"left out when testing the sum (not the period)". Not checked: whether LFRA 2024 commencement
regulations made after the XML snapshot have brought s.53, s.55 or s.61 into force.
