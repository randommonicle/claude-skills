# Review: legal fork, four property-legal guardrail skills

- **Target:** branch `feat/legal-fork` at 6c9845b (9 commits on origin/main f7de1a1), working root = this repo. Four new skills: `contract-review/`, `legal-citation-integrity/`, `legal-notice-handling/`, `statute-to-obligations-register/`, each with `SKILL.md` and `UPSTREAM.md`; `contract-review/references/*.md`; count sites; `NOTICE`; a one-line `verified-citations/SKILL.md` change.
- **Mode:** challenger-external. **Framing: assume it is broken and find where.** An approval is worth nothing; a reproducible defect with `path:line` is worth everything. If you genuinely find nothing in your area, say so rather than manufacture a finding.
- **Repo:** READ ONLY. Run no commands (agy: git and rg only; codex: read-only sandbox).
- **Date opened:** 2026-10-04
- **Seats in play:** CLAUDE (hub), GEMPRO, GPT
- **Round cap:** 2 each, then one attack-the-convergence pass.
- **Stop:** `[[CONVERGED]]` on agreement; a `[[POSITION - <HANDLE>]]` paragraph each at the cap.

Protocol: `exchange/PROTOCOL.md`. Append-only. Cite `path:line`. Concede on evidence. End every section with `[[END <HANDLE> round N]]` on its own last line.

---

## [CLAUDE round 1]

**Framing.** These skills will steer a model drafting or checking leasehold documents for a RICS-regulated managing agent. The failure that matters: a skill that reads as a control but cannot go red, a rule that contradicts another rule, or a worked example a model will copy as law.

**Evidence already gathered (do not re-derive; neither seat can reach legislation.gov.uk, so statutory truth is mine to check):**
- Gates at 6c9845b: `node hooks/check-index.mjs` "ok: 50 skills, all indexed, all named, all three counts agree"; `node hooks/check-archives.mjs` "ok: 5 archives, 17 members".
- A scoped statutory review (2026-10-03) read 15 provisions as legislation.gov.uk `/data.xml`: 0 Critical, 0 High; a Medium (s.48(3)) and a Low (s.167(3)) fixed in 6c9845b.
- Re-read today as `/data.xml`: Leasehold and Freehold Reform Act 2024 ss.53, 55 and 61 are still `Status="Prospective"` (revised text valid 2025-03-03); the only commencement instruments listed are Nos. 1 to 3 (2024 to Feb 2025). LTA 1985 s.20B's pending effects are 2024 Act s.53(3), (4)(d) and s.54, matching R1 at `statute-to-obligations-register/SKILL.md:94`.
- New today: the Building Safety (Wales) Act 2026 s.74 prospectively inserts LTA 1987 **s.47B**, "Building safety information to be contained in demands for rent etc: Wales". `legal-notice-handling/SKILL.md:104-118` cites s.47 and its pending s.47(3A) but not this. My finding C1, Low: fix by naming it.
- The three `contract-review/references/*.md` are verbatim upstream with attribution, said at `contract-review/SKILL.md:109`. Their em dashes and house style are a deliberate exemption, not a finding this round. Their substance is in scope.
- There are no scripts in the fork.

**Provisional verdict.** Statute citations sound; mechanics unproven. I expect defects in the result lines and in how the references bind to the base method.

**GEMPRO: read exactly these four files, fully:** `contract-review/SKILL.md`, `legal-citation-integrity/SKILL.md`, `legal-notice-handling/SKILL.md`, `statute-to-obligations-register/SKILL.md`. Attacks:
1. **Result lines that cannot go red.** For each printed line (`contract-review/SKILL.md:49`, `legal-citation-integrity/SKILL.md:30`, `legal-notice-handling/SKILL.md:32`, `statute-to-obligations-register/SKILL.md:32`), does each number have a source independent of the table it checks? Lead to press: `statute-to-obligations-register/SKILL.md:37-39` sums Extracted = Register + Powers + Dropped, but `:68` sends a right to the powers list AND its duty to the register, so one item lands twice.
2. **Rules that contradict each other**, inside a file or across the four (e.g. `contract-review/SKILL.md:134` "in any section, in any mode" against what the other three ask a model to state).
3. **Worked examples a model will copy instead of re-reading.** `legal-notice-handling/SKILL.md:88-154`: what in the text makes a model re-read rather than rely on these lines? Only `:129-130` says "blocking input".
4. **Trigger and routing lanes.** Descriptions against each other and against `verified-citations/SKILL.md` and `deliverable-integrity/SKILL.md`; every routed skill must exist on disk.

**GPT: read exactly these files:** `statute-to-obligations-register/SKILL.md` (its tables at `:62-68` and `:92-95` against its own rules 1-9), `legal-notice-handling/SKILL.md:29-52` and `:80-86`, `contract-review/SKILL.md:99-130`, the three `contract-review/references/*.md`, `README.md`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `NOTICE`, the four `*/UPSTREAM.md`. Attacks:
1. **The worked-example register against its own rules**: every cell filled; Deadline cells quote the statute's words (rule 7, `:75-77`), e.g. R2's "With the demand"; Status in rule 8's forms.
2. **The modes table against the tables and result line** (`legal-notice-handling/SKILL.md:32` always prints Consequences; `:82-86` requires a consequence table only in draft mode).
3. **References bound to the base method.** `contract-review/SKILL.md:109-113` maps three upstream terms. Find every upstream term left unmapped ("structural map", "defined-terms sweep", "boilerplate read", "in place of the base risk-allocation/exit sections") and say whether any lets a lease review skip a check, e.g. the interaction check at `:43-46`.
4. **Provenance and counts**: the MIT notice reproduced intact in each UPSTREAM.md; count sites agree with the skills on disk.

NEXT: ALL

[[END CLAUDE round 1]]

## [GEMPRO round 1]

### 1. Result lines that cannot go red

- **`statute-to-obligations-register/SKILL.md:32`**: Rule `:37-39` asserts `Extracted = Register + Powers and rights + Dropped`. But Rule 3 (`:68`) routes a "Right of another party" to the *Powers and rights list* AND creates an obligation in the *Register*. A single extracted right yields two destination rows (+1 Powers, +1 Register), forcing `Register + Powers + Dropped > Extracted`. This arithmetic defect either produces false-positive red output on compliant registers or forces the model to manufacture phantom extractions. Moreover, the output contract (`:111-121`) omits the raw extraction list, leaving `Extracted` untestable by an auditor.
- **`legal-notice-handling/SKILL.md:32`**: 
  1. The line mandates Deadlines, Consequences, and Allegations together, but `:41`, `:48`, and `:82-86` make consequences draft-only and allegations reply/analyse-only. In Draft mode, `Allegations` has no source; in Reply/Analyse, `Consequences` has no source.
  2. Consequences cannot fail: Rule 2 (`:47`) states a failing consequence "is cut, not softened." Cutting non-compliant items leaves only compliant rows; if 1 of 2 fails, it is deleted and the line prints `Consequences 1 (1 confirmed...)`—self-healing to green.
- **`contract-review/SKILL.md:49`**: Denominators in `clause 14/14` and `interaction 5/5` derive entirely from the issues table, not the contract. If a model skips an indemnity, the denominator silently drops to 4/4. Additionally, Rule 2 (`:40-42`) automatically moves unretrieved law markers to the verification list; once moved, `law 0 moved` is printed (`:49`). The red output in `:42` is an intermediate drafting state that vanishes from the final line.
- **`legal-citation-integrity/SKILL.md:30`**: Rule `:41-42` allows discarding non-citation hits, but the output contract (`:80-89`) requires no discarded list. An agent can drop citations during filtering and match `Extracted` to `Table rows` trivially.

### 2. Rules that contradict each other

- **Memory ban vs verification list**: `contract-review/SKILL.md:134` forbids naming a statute/case from memory "in any section, in any mode". Yet `:34` exempts the verification list from the law check, and `:125-128` requires listing unverified statutes under "Where to verify". Naming an unretrieved statute there violates `:134`. Further, `:112-113` subjects verification points to the law check, contradicting `:34`.
- **Blocking side check**: `contract-review/SKILL.md:54` commands: "Side first, and it blocks. Ask which party you act for and produce nothing until you have the answer." Yet `:3` triggers on `"review this lease from the tenant's side"`. Read strictly, the model must halt and ask who it acts for even when stated in the prompt.
- **Blocking inputs**: `legal-notice-handling/SKILL.md:84` omits statutes from Draft blocking inputs, whereas `:129-130` labels them blocking inputs but immediately unblocks them with "or list it as open".
- **Status taxonomies**: `contract-review/SKILL.md:126` enforces `Status (Open / Retrieved...)`, but when routing to `legal-citation-integrity` (`:149-150`), `legal-citation-integrity/SKILL.md:66` accepts only `Confirmed, Contradicted, Could not confirm, Not attempted`. `Open` is rejected.

### 3. Worked examples that suppress retrieval

- `legal-notice-handling/SKILL.md:88-154` provides exact URLs, sections, and deadlines, marked `read 2026-10-03` (`:90`). Since Rule 2 (`:42`) accepts "statute read this session with URL and date", a model can copy these URLs without calling any retrieval tool.
- Only `:129-130` links an example to execution, and only for s.21B. The remaining four bullets (`:94-118`, `:131-154`) have no operational binding.
- Grounding hazard: CLRA 2002 s.167 (`:146`) recites the primary ceiling ("prescribed sum may not exceed £500"), but secondary legislation (SI 2004/3096) sets the operative threshold at £350. An agent copying line 146 will misadvise on forfeiture thresholds.

### 4. Trigger and routing lanes

- **Missing routes**: `legal-notice-handling/SKILL.md:60` defers inclusive day-counting to `verified-citations`, but omits it from `Routes and scope` (`:166-173`).
- **Hidden legal scope**: `verified-citations/SKILL.md:3` scopes itself strictly to code, schemas, and PRs ("files, line numbers, migrations..."). Frontmatter routing will never dispatch statutory citations or day-counting to `verified-citations`, despite references in `legal-citation-integrity/SKILL.md:3` and `statute-to-obligations-register/SKILL.md:3, 77`.
- **Scope discrepancy**: `contract-review/SKILL.md:154` disclaims "an obligations extraction on its own", but this exclusion is omitted from frontmatter description `:3-4`.
- All 8 routed skills exist on disk; no broken file paths found.

[[END GEMPRO round 1]]
<!-- seat: GEMPRO | thread: aa69c103-5f83-4b73-be8c-fae53e2c6d14 | grounding: repo-read | seat_turns: 1 | file_turns: 1 | usage: in=122131 out=27501 cache_read=330530 thinking=25381 -->

## [GPT round 1]

The worked register is not compliant with its own deadline rule.

- Rule 7 requires the statute’s words and the counting convention applied (`statute-to-obligations-register/SKILL.md:75-77`). R2’s deadline is merely “With the demand”, with no quoted operative wording or counting convention (`statute-to-obligations-register/SKILL.md:92-95`). R1 quotes the 18-month wording, but also omits the counting convention (`statute-to-obligations-register/SKILL.md:94`). The cells are populated, and the source footnote exists, but the worked pattern teaches incomplete deadline recording (`statute-to-obligations-register/SKILL.md:97-105`, `statute-to-obligations-register/SKILL.md:115-116`).

- The notice result contract conflicts with its modes. The rule requires a consequence table before prose, and the result line always reports consequences and allegations (`legal-notice-handling/SKILL.md:29-32`). However, the consequence table is explicitly marked “drafting”, while reply and analysis modes require only deadline and allegation tables (`legal-notice-handling/SKILL.md:41-52`, `legal-notice-handling/SKILL.md:80-86`). A reply or analysis therefore has no defined consequence-table input but is still required to print consequence results. The fixed line also looks like literal output rather than a mode-sensitive template (`legal-notice-handling/SKILL.md:32`).

- The specialist references are only partly bound to the local base method. The local mapping defines “base method”, “issues list”, “grading scale”, “risk-allocation prose”, and verification-list routing, but does not define or map “structural map”, “defined-terms sweep”, or “boilerplate read” (`contract-review/SKILL.md:109-113`). The base file does require whole-document and cross-reference reading, and catches undefined or duplicated terms, but that is not an explicit complete defined-terms sweep or structural/boilerplate procedure (`contract-review/SKILL.md:62-64`). A model can therefore treat those upstream phrases as optional or interpret them inconsistently.

- The lease reference directly conflicts with the base binding rule. The base says references apply “on top of this file, never in place of it” (`contract-review/SKILL.md:99-107`), while the lease reference says its method applies “in place of the base risk-allocation/exit sections where they do not fit” (`contract-review/references/leases.md:1-3`). That wording leaves “base risk-allocation/exit sections” undefined and can be read to displace the universal interaction check for termination, break, forfeiture and re-entry (`contract-review/SKILL.md:43-46`). The lease reference’s exit checklist does not expressly preserve the required `Read with` evidence (`contract-review/references/leases.md:16-21`).

Provenance and advertised counts show no finding: NOTICE names all four forked skills (`NOTICE:8-11`), each UPSTREAM file contains the complete MIT notice (`contract-review/UPSTREAM.md:49-70`, `legal-citation-integrity/UPSTREAM.md:30-50`, `legal-notice-handling/UPSTREAM.md:35-55`, `statute-to-obligations-register/UPSTREAM.md:34-54`), and the README and both plugin manifests consistently state 50 skills (`README.md:19`, `.claude-plugin/plugin.json:3`, `.claude-plugin/marketplace.json:10`).

[[END GPT round 1]]
<!-- seat: GPT | thread: 01a104c0-87eb-7b80-80d7-18b5e8a65734 | grounding: repo-read | seat_turns: - | file_turns: 1 | usage: in=271335 out=6247 cached_input=193792 -->

## [CLAUDE round 2]

Every point re-derived against the files; the statutory ones against legislation.gov.uk `/data.xml`. Fixes are in commit **33237c1** (`git show 33237c1`, four SKILL.md files and WORKLOG.md).

**Conceded and fixed:**
- GEMPRO 1a (register arithmetic): a right's derived duty is now its own extracted item (`statute-to-obligations-register/SKILL.md:68`), and the output carries a numbered extraction list (`:115-117`).
- GEMPRO 1b and GPT 2 (notice result line vs modes): one line per mode, parts only for the mode's tables; `in notice` counted from the notice, `cut` from what the client asked for, and a cut is reported to the client (`legal-notice-handling/SKILL.md:29-38`, `:52-53`).
- GEMPRO 1d (citation discards): `Search hits | Discarded (listed)` added to the line and a discarded-hits output section (`legal-citation-integrity/SKILL.md:30-37`, `:90`).
- GEMPRO 2a: `contract-review/SKILL.md:140-142` now bans stating law from memory, with unretrieved points only as open questions in the verification list; the reference paragraph no longer says the verification list is subject to the law check.
- GEMPRO 2b, 2c, 4a, 4c: side-first asks only when the request names no party; "blocking input" replaced by a verification-list row; route to verified-citations added; "obligations extraction" added to the description.
- GEMPRO 3a/3b: both worked-example blocks now say they are no retrieval and a copied line fails the table (`legal-notice-handling/SKILL.md:96-100`, `statute-to-obligations-register/SKILL.md:88-91`).
- GEMPRO 3c: right figure, wrong number. The regulations are **SI 2004/3086** (England) and **SI 2005/1352** (Wales), both reg 2: £350 and three years. Both now named, read 2026-10-04.
- GPT 1: R2's cell quotes s.21B(1) "must be accompanied by a summary"; R1 states its counting convention.
- GPT 3 and 4: the paragraph at `contract-review/SKILL.md:109-119` maps "structural map", "defined-terms sweep", "boilerplate read" and "output sections", and says "in place of" replaces a section's topics only, never the three checks or the output contract.
- C1: s.47B (Wales) named as prospective.

**Rebutted, press if you disagree with evidence:**
- GEMPRO 1c: the interaction check's denominator is the issues table by design; quick review is the 10-15 most material rows (`contract-review/SKILL.md:89-90`), so coverage is the mode's choice, not the check's. "law 0 moved" counts moves made; it does not hide one.
- GEMPRO 2d: the two status vocabularies belong to different tables (a verification list vs a citation audit); nothing routes one into the other.
- GEMPRO 4b: verified-citations owns statutory facts and inclusive counting in its body (`verified-citations/SKILL.md:109-117`); the legal skills route to it by name, which does not depend on its description.

**Round 2 ask, both seats:** attack 33237c1. Did a fix open a new hole or a new contradiction (GEMPRO: the four SKILL.md files; GPT: the tables, the mapping paragraph, the result lines)? Concede, or press with `path:line`. End with `[[CONVERGED]]` if nothing load-bearing remains, else a `[[POSITION - <HANDLE>]]` paragraph.

NEXT: ALL

[[END CLAUDE round 2]]

> **[transport] GEMPRO round 2 did not complete** - a tool permission was auto-denied (RunCommand).
> Tokens spent: in=203424 out=27789 cache_read=330530 thinking=25579. This seat has NOT answered round 2.
<!-- transport-failure: seat: GEMPRO | round: 2 | thread: aa69c103-5f83-4b73-be8c-fae53e2c6d14 | usage: in=203424 out=27789 cache_read=330530 thinking=25579 -->

## [GEMPRO round 2]

### 1. Concessions on CLAUDE round 2 rebuttals

- **GEMPRO 1c (`contract-review/SKILL.md:49`)**: Conceded. Quick review mode is explicitly scoped to the 10–15 most material issues (`:89-90`). The self-check line (`:49`) is designed as an internal consistency check on the delivered table rather than a full-contract extraction audit.
- **GEMPRO 2d (Status vocabularies)**: Conceded. The verification list (`contract-review/SKILL.md:125-128`) tracks open substantive inquiries for the transaction, whereas `legal-citation-integrity/SKILL.md:66-68` governs an audit of citations within an opinion. They operate on distinct tables.
- **GEMPRO 4b (Routing to `verified-citations`)**: Conceded. Direct programmatic loading (`load verified-citations`) relies on directory and skill names rather than description-matching heuristics.

### 2. Audit of fixes in 33237c1

The fixes in 33237c1 resolve the round 1 defects across all four files without introducing new contradictions:

- **`statute-to-obligations-register/SKILL.md`**:
  - The conservation arithmetic defect is resolved at `:68`: derived duties are now extracted as distinct `Duty` items, ensuring each item lands in exactly one destination and `Extracted = Register + Powers and rights + Dropped` holds.
  - The extraction count is made auditable by adding a mandatory numbered extraction list to the output contract (`:115-117`).
  - Rule 7 compliance in the worked example is restored: R1 quotes statutory wording with explicit inclusive day-counting margin (`:95`), and R2 quotes s.21B(1) operative wording (`:96`).
  - Copying worked examples as fake session retrievals is explicitly barred (`:90-91`).
- **`legal-notice-handling/SKILL.md`**:
  - Mode-specific result lines (`:29-34`) eliminate the mode contradiction: Draft reports Deadlines and Consequences; Reply/Analysis reports Deadlines and Allegations.
  - Consequence tracking is made auditable: cut consequences are tracked against instructions and reported to the client with the failing cell (`:32`, `:35-36`, `:51-52`), preventing silent self-healing.
  - Worked examples are disclaimed as session retrievals (`:97-99`).
  - Statutory thresholds are grounded to secondary legislation: SI 2004/3086 (England) and SI 2005/1352 (Wales) are correctly cited with the operative £350 / 3-year threshold (`:158-163`).
  - Prospective Welsh rent demand requirements under Building Safety (Wales) Act 2026 s.74 (inserting LTA 1987 s.47B) are properly integrated (`:118-121`).
  - Route to `verified-citations` for inclusive day-counting is established (`:185`).
- **`legal-citation-integrity/SKILL.md`**:
  - The discard filtering step is made leak-proof by tracking `Search hits` and `Discarded (listed)` in the result line (`:30`, `:35-36`) and requiring a dedicated Discarded hits section in the output contract (`:89`).
- **`contract-review/SKILL.md`**:
  - Memory ban vs open verification points is harmonized (`:140-142`).
  - Side-first requirement permits pre-specified parties without blocking (`:54`).
  - Upstream specialist references (`leases.md`) are unambiguously bound to base rules and output checks (`:109-120`).

No load-bearing defects remain.

[[CONVERGED]]

[[END GEMPRO round 2]]
<!-- seat: GEMPRO | thread: aa69c103-5f83-4b73-be8c-fae53e2c6d14 | grounding: repo-read | seat_turns: 3 | file_turns: 2 | usage: in=314310 out=36356 cache_read=693730 thinking=32954 -->
> **[transport] GEMPRO round 2 recorded with a warning** - the CLI reports 3 turns on this thread but this file holds 2 sections for GEMPRO. A turn happened that this record never received, and a resume carries it. Reset the thread or read on knowing that.

## [GPT round 2]

I concede the register arithmetic repair: derived duties are now separate extracted items, and the extraction list makes the total auditable (`statute-to-obligations-register/SKILL.md:68`, `statute-to-obligations-register/SKILL.md:115-117`). I also concede the mode-specific notice result lines and explicit cut accounting (`legal-notice-handling/SKILL.md:29-36`), and the mapping now expressly binds the upstream terms while preserving the three checks and output contract (`contract-review/SKILL.md:109-119`).

One load-bearing worked-example hole remains. The notice warning says a copied line fails the consequence table only where it is used as a basis cell (`legal-notice-handling/SKILL.md:95-99`). The separate deadline-table rule requires a quoted source period and calendar arithmetic (`legal-notice-handling/SKILL.md:38-44`), while the example supplies an apparently ready-to-copy statutory period and URL for CLRA 2002 s.166 (`legal-notice-handling/SKILL.md:101-110`). Nothing says that copying this example into a deadline row fails, or that the provision must be retrieved in-session for that use. A model can therefore reuse the “30 to 60 days” rule in a live notice without the new guardrail forcing retrieval. The statute-register example has the stronger prohibition that any copied row fails rule 1 (`statute-to-obligations-register/SKILL.md:88-91`); the notice examples do not.

The fixed result-line syntax also remains presented as concrete counts rather than explicitly marked placeholders (`legal-notice-handling/SKILL.md:32-36`, `statute-to-obligations-register/SKILL.md:30-42`), but I treat that as secondary to the retrieval hole.

[[POSITION - GPT]] 33237c1 repairs the previously conceded arithmetic, mode, citation-discard and mapping defects, but the legal-notice worked examples can still be copied into deadline tables without an explicit session-retrieval failure. That remains load-bearing for a drafting guardrail.

[[END GPT round 2]]
<!-- seat: GPT | thread: 01a104c0-87eb-7b80-80d7-18b5e8a65734 | grounding: repo-read | seat_turns: - | file_turns: 2 | usage: in=596437 out=10592 cached_input=494592 -->

## [CLAUDE round 3]

GPT's round 2 point conceded and fixed in **43430a3**: the deadline table's source column now requires a statute "read this session with URL and date" (`legal-notice-handling/SKILL.md:40-41`), and the examples' warning covers deadline rows as well as basis cells (`:100-103`). property-reg-reviewer read every changed statutory line as `/data.xml`: 0 Critical, 0 High, 4 Low, all fixed in 43430a3 (counting cell, open rows above a draft, s.47B's limb quoted, `asked | kept | cut`).

**The converged position, for the attack pass.** The four skills at 43430a3 are fit to merge: every result line adds up from lists the output carries; no worked example can stand in for a session retrieval; the references cannot displace the base checks; statutory statements match legislation.gov.uk as read 2026-10-03/04 (LFRA 2024 ss.53, 55, 61 prospective; £350 and three years under SI 2004/3086 and SI 2005/1352; s.47B Wales prospective).

**GPTX (fresh seat): attack that position, not the old findings.** Read the four `*/SKILL.md` files at HEAD and `git show 33237c1 43430a3`. Where did the fixes make a rule unworkable for a real leasehold file, contradict each other, or create a result line a model can still satisfy while doing the wrong thing? A position that survives is worth acting on; one that does not was never evidence. Cite `path:line`. Under 3,500 characters; end with `[[CONVERGED]]` or `[[POSITION - GPTX]]`.

NEXT: GPTX

[[END CLAUDE round 3]]

## [GPTX round 1]

I concede the arithmetic, mode-specific notice line, retrieval warning, and reference mapping repairs, with the cited changes at `statute-to-obligations-register/SKILL.md:68,115-117`, `legal-notice-handling/SKILL.md:29-36,100-103`, and `contract-review/SKILL.md:109-119`.

One result-line hole remains in `legal-citation-integrity`. The four status counts are printed, but the red checks only test extraction/table-row equality, search-hit disposal, and retrieval behind `Confirmed` rows (`legal-citation-integrity/SKILL.md:30-37`). Neither the rule nor output contract requires `Confirmed + Contradicted + Could not confirm + Not attempted = Table rows` (`legal-citation-integrity/SKILL.md:68-70,85-91`). A table containing two `Not attempted` rows can therefore print `Table rows 2 ... Not attempted 0` while satisfying every listed red condition. That can present an unverified audit as clean.

A second mode ambiguity remains for leases. The lease reference requires findings to be folded into “risk-allocation prose” (`contract-review/references/leases.md:19-21`), but the base skill adds that prose only in Full audit, which applies only when an exhaustive review is requested (`contract-review/SKILL.md:89-97`). The binding paragraph identifies that phrase specifically as the full-audit statement (`contract-review/SKILL.md:109-115`). A default quick lease review therefore has to omit a reference-required output or silently widen the requested mode.

[[POSITION - GPTX]] 43430a3 fixes the earlier defects, but the citation-integrity result line still permits inconsistent status counts, and lease reviews retain an unresolved specialist-output versus review-mode contradiction.

[[END GPTX round 1]]
<!-- seat: GPTX | thread: 01a104ce-e215-7ea0-b0ed-6773b92252cd | grounding: repo-read | seat_turns: - | file_turns: 1 | usage: in=527284 out=9124 cached_input=475392 -->

## [CLAUDE close]

Written 04:09 BST by the overnight continuation. Rounds used: GEMPRO 2, GPT 2, GPTX (a fresh GPT seat, config in the gitignored `exchange/seats-x.jsonc`) 1 on the converged position.

**GPTX, re-derived, both real, fixed in 384c936:** the four citation results must add up to the table rows (a red line for the sum); the lease reference's "risk-allocation prose" goes to the issues table outside a full audit, so a quick lease review neither drops it nor widens its mode.

**Statutory review:** property-reg-reviewer twice, each reading the changed lines as legislation.gov.uk `/data.xml`: 33237c1, 0 Critical, 0 High, 4 Low; 33237c1..384c936, 0 Critical, 0 High, 0 Medium, 3 Low. All seven Lows fixed (43430a3, 9ffb4ae).

**Record notes.** GEMPRO's first round 2 turn was lost to a denied `git show` that my ask had allowed; its rerun carries the `seat_turns 3 != file_turns 2` warning for that lost turn. My round 2 cites `legal-citation-integrity/SKILL.md:90` for the discarded-hits section; it was at `:89`.

[[POSITION - CLAUDE]]
The four skills at 9ffb4ae are fit to merge. GEMPRO converged; GPT's one held point and GPTX's two were fixed after their turns and not re-reviewed by a seat; the statutory wording has had two scoped regulatory passes. Not checked: the Welsh Act's definition of "regulated building"; whether a Welsh commencement order for s.74 exists that legislation.gov.uk has not recorded (record last updated 2026-06-22).

[[END CLAUDE close]]
