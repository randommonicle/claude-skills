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
- [ ] Wiring: README fork sentence and forks row, NOTICE
- [ ] Gates: check-index (50), check-archives (unchanged 5/17), unslop scan high 0 on each new
      SKILL.md, section 11 trigger-orthogonality grep, hooks/*.test.mjs loop
- [ ] property-reg-reviewer over the four SKILL.md files; Critical/High re-derived and fixed
- [ ] Section 11.5 ride (manual application of contract-review)
- [ ] Close: checklist walk, closing summary

**Known merge conflict, not resolved here:** `feat/team-loop-stage1` also changes the skill
count (to 47). Whichever lands second must reconcile the count in README (two sites),
`plugin.json` and `marketplace.json`; `check-index.mjs` will red until it does.

### Statutory claims verified (read on legislation.gov.uk, 2026-10-03)

Read through the `/data.xml` endpoint of each page (revised text, unapplied effects, extent).
Pending amendments listed are those the page marks prospective, not yet in force.

| Claim used in | Provision | URL | Revised text valid from | Extent | Pending (prospective) |
|---|---|---|---|---|---|
| obligations register | LTA 1985 s.20B (18-month limit) | https://www.legislation.gov.uk/ukpga/1985/70/section/20B | 2026-06-29 | E+W | s.20B(1) words, s.20B(3)-(10): LFRA 2024 ss.53-54 |
| obligations register, notices | LTA 1985 s.21B (summary of rights with demand) | https://www.legislation.gov.uk/ukpga/1985/70/section/21B | 2026-06-29 | E+W | whole section omitted: LFRA 2024 s.55(2)(c) |
| notices | LTA 1987 s.46(1), (1A) (scope of Part VI) | https://www.legislation.gov.uk/ukpga/1987/31/section/46 | 2026-06-29 | E+W | none listed |
| notices | LTA 1987 s.47 (landlord's name and address in demand) | https://www.legislation.gov.uk/ukpga/1987/31/section/47 | 2026-06-29 | E+W | s.47(3A) inserted: LFRA 2024 s.55(4)(a) |
| notices | HA 1996 s.81 (forfeiture for service charge) incl. s.81(4A) | https://www.legislation.gov.uk/ukpga/1996/52/section/81 | 2026-09-01 | E+W | none listed |
| notices | CLRA 2002 s.166 (ground rent notice, 30 to 60 days) | https://www.legislation.gov.uk/ukpga/2002/15/section/166 | 2025-03-03 | E+W | none listed |
| obligations register (description) | Building Safety Act 2022 exists (2022 c.30) | https://www.legislation.gov.uk/ukpga/2022/30/contents | 2026-07-01 | n/a | n/a |

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
