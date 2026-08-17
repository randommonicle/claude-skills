# Adversarial review — earn-every-line (2026-08-17)

Opus-tier subagent review of the DRAFT skill (pre-fix), preserved verbatim below the
line. Verdict was LAND WITH FIXES (3 CRITICAL / 5 HIGH / 7 MEDIUM / 6 POLISH). The lead
re-derived every CRITICAL and HIGH against the draft and the evidence packs before
acting (findings-are-evidence). All were applied to the landed skill, with two
adjudications recorded: H1 (a quoted vendor sentence absent from the committed evidence
base) was resolved by recording the sentence — the lead had verified it first-hand
against the live page in-session — rather than dropping it, and the research doc
preamble now carries it verbatim; one H4 sub-claim ("YAGNI does not appear in the
description") was factually wrong (it did), but H4's substantive findings (the missing
"simplify"/"keep it simple" vocabulary, the generic-phrase collision with unslop-code)
were real and are fixed. M6 ("Beyond code" section) was compressed to one clause in The
rule rather than deleted outright, because the generalisation was an operator
requirement. M7 (length): the landed file is 176 lines against the draft's 193 with
all fixes added — the duplication the finding named is gone; the remaining size carries
the two halves and the fences the CRITICALs demanded. Line numbers cited below refer to
the draft, not the landed file.

---

# Adversarial review — earn-every-line (draft, 2026-08-17)

Reviewer: adversarial pass, read-only. No file in the repo or the draft was edited.

Evidence read: the draft; README (Conventions, skills table); unslop-code/SKILL.md;
unslop-code/references/tells.md (entries 1 and 10, the over-correction trap, Part C);
unslop-code/references/fitting-the-codebase.md; plan-first/SKILL.md;
rerun-before-verdict/SKILL.md; the frontmatter of honest-failure-surfacing,
no-silent-data-drop, prove-it-can-fail, blast-radius-grep, flag-deferred-items,
verify-the-effect; both scratchpad research packs; and the committed-pack file
docs/RESEARCH_2026-08-17_earn-every-line.md.

Two things clear on the way in, so they are not findings. The **name** collides with
nothing: no skill in the 42 uses "earn", "every line", or the entry/present-need framing
as trigger vocabulary. The **description length** (79 words) sits inside the stated
precedent (rerun-before-verdict is 94).

---

## CRITICAL

### C1. The named-caller test is scoped to writing but its verbs delete existing code, with no blast-radius requirement

> "A helper, wrapper, interface, base class, or parameter with one user is inlined; with
> zero users it is deleted."

against the preamble two paragraphs earlier:

> "This skill governs the write-time decision those numbers point at: what is allowed to
> enter the file."

and the description's "Nothing enters a file without a present need."

Three defects stacked:

1. **Scope mismatch.** The stated jurisdiction is entry. The operative verbs — "is
   inlined", "it is deleted", later "Delete on sight" — act on code that is already there.
   A mid-tier model reading the bullets rather than the preamble has been handed a repo-wide
   deletion licence by a skill that describes itself as a write-time gate.
2. **"Zero users" is undefined and will be established by grep.** Grep misses dynamic
   dispatch, DI containers and registries, string-keyed lookups, reflection, plugin entry
   points, anything exported from a published package, callers in sibling repos, callers on
   unmerged branches, and test-only callers. Every one of those reads as "zero users" to a
   model with ripgrep and no instruction to look further.
3. **The library already owns this and the draft does not route to it.** blast-radius-grep:
   "The unit of change is the action or the fact, never the named list of places someone
   handed you… grep the whole repo — app, tests, seeds, scripts, open branches, and the
   built or rendered output". That is the missing precondition, and it is one sibling away.

**Fix.** Scope the bullet explicitly to code you are about to write. For code already in the
file, require the blast-radius-grep pass by name before any removal, exclude exported or
published API from the "zero users" rule, and state the default in the same breath: cannot
establish zero users → it stays. One added clause and one route.

### C2. "Trust internal code" is stated without a definition of internal, with a boundary list that reads as exhaustive

> "**Defence belongs at trust boundaries.** The vendor's counter-prompt says it exactly:
> 'Trust internal code and framework guarantees. Only validate at system boundaries (user
> input, external APIs).' A check for a state that cannot occur is not safety, it is a
> second place the real logic has to be maintained."

The parenthetical "(user input, external APIs)" is the only definition of a boundary the
skill offers, and it is presented as the vendor's own exact words, which makes it hard to
argue with. Applied literally by a junior model, everything not obviously a form field or an
HTTP client is "internal": a database row, a queue message, a webhook payload, a file on
disk, a cache entry, deserialised session state, another service's response, a model's own
output, and anything crossing a tenant or privilege line. Several of those are the exact
surfaces two siblings exist to defend — server-side-authority ("Never trust a
client-supplied storage path or object id — derive it server-side from the row the caller
owns") and ai-surface-discipline — and neither is named anywhere in the draft.

The second half compounds it. "A check for a state that cannot occur" gives the model the
verdict but not the test, and deciding a state cannot occur is the whole difficulty. Nothing
in the skill asks what enforces the impossibility.

(The quoted sentence also has a citation problem — see H1. Fixing the citation does not fix
the misfire; both need doing.)

**Fix.** Replace the enumerated parenthetical with a positive, explicitly non-exhaustive
test: anything that crossed a process, network, storage, tenant, or privilege line, or came
out of a model, is external no matter which repo wrote it. Add the default in the same
bullet: if you cannot name the constraint, type, or invariant that makes the state
impossible, the check stays. Name server-side-authority and ai-surface-discipline in the
"does not fire on" line so the routing exists.

### C3. The over-correction fencing arrives after the licences and offers a category, not a test

Structural order in the draft: the trust-boundary bullet (l.61) and "Delete on sight" (l.85)
come first; the counterweight ("this is not a no-comments doctrine", l.96) and "The other
ditch" (l.122) come last. A skimmer — the reader this fencing exists for — reads the
permissions and stops before the limits.

And the limits, when reached, are a list of categories to recognise after the fact:

> "As 'fixes', these are forbidden: removing validation at a trust boundary, deleting a
> comment that carries a why, golfing for line count, and citing YAGNI to skip tests or
> refactoring".

Recognising that a comment "carries a why" is precisely the judgement the model just failed
in the section above; being told the outcome is banned does not supply the discriminator.
The skill gives additions a crisp procedural test (name the caller, the reader, or the
requirement — by name) and gives deletions no test at all. That asymmetry is the misfire
surface.

**Fix.** Two moves, both cheap. Put the two-way ban into "## The rule", above every deletion
licence, so it cannot be skimmed past. And give deletion the mirror of the entry test: name
what is lost if this line goes — the caller, the reader, or the requirement it serves — and
if you can name one, it stays. The skill's own sentence structure already supports it.

---

## HIGH

### H1. A quoted vendor sentence is absent from the committed evidence base

> "'Trust internal code and framework guarantees. Only validate at system boundaries (user
> input, external APIs).'"

The first sentence is attested: research pack §1, "Blanket defensive try/except" —
"Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust
internal code and framework guarantees." The second sentence is not. `grep -n "system
boundaries"` over `docs/RESEARCH_2026-08-17_earn-every-line.md` returns nothing, and the
pack's fuller Overeagerness excerpt (§3) does not contain it either. The Provenance's
blanket cover — "the Anthropic Overeagerness text re-verified first-hand by the lead" —
does not record this string, and the committed pack's own header records a different
first-hand correction (the Opus 4.5/4.6 scoping) while saying nothing about this one.

This is the most load-bearing quotation in the skill: it is the sentence C2 turns on.

**Fix.** Re-fetch the Overeagerness section and either add the sentence verbatim to the
research doc with its anchor, or drop it and keep only the pack-attested first sentence.

### H2. Provenance states as present a fact that is currently false

> "both research packs are committed verbatim at docs/RESEARCH_2026-08-17_earn-every-line.md."

`git status --porcelain` reports `?? docs/RESEARCH_2026-08-17_earn-every-line.md` — the file
exists on disk and is untracked. Nothing is committed. This is the exact class
verified-citations guards ("a claim a reader would act on without re-deriving"), inside the
skill's own provenance block. Secondary wording point: "both research packs" resolving to
one path reads as an error until the file is opened; they are Part 1 and Part 2 inside it.

**Fix.** Land the research doc in the same commit as the skill — a landing-checklist item,
not a wording change — and word it "preserved verbatim as Part 1 and Part 2 of docs/…".

### H3. "Delete on sight" contradicts the skill's own diff-level rule

> "only make the change that was asked or is clearly necessary to it. Reformatting
> neighbours, renaming things you passed, upgrading patterns you dislike — unrequested
> improvements are speculation in the change dimension, and they turn a 50-line reviewable
> diff into a 500-line unreviewable one."

> "Delete on sight, because the code already says it or git already remembers it: …"

Deleting comments in code you were not asked to touch is an unrequested improvement, and it
inflates exactly the diff the first rule protects. It also inverts the vendor instruction
the skill leans on elsewhere ("Don't add docstrings, comments, or type annotations to code
you didn't change") whose symmetric form is that you do not remove them either. A model
following both rules literally will delete a hundred comments and then quote the diff rule
in its summary.

**Fix.** Scope the comment half to comments on the lines you are already writing or
changing. Make comment removal beyond that an explicitly requested job, not a standing
licence.

### H4. The primary trigger vocabulary is the broadest in the library and collides head-on with unslop-code

Draft: "Triggers when writing or refactoring code…"
unslop-code: "Use whenever writing, generating, reviewing, refactoring, or auditing code".

README convention: "no two leaves share their primary trigger vocabulary". The draft's
"does not fire on" line resolves the *topic* split (audit vs write) but not the *match*: both
descriptions contain the same everyday phrase, and description matching happens before
either body is read.

Worse, the words a user actually types are missing:

- **"YAGNI" does not appear in the description at all.** It is a body heading, which is not
  matched. A user who says "YAGNI this" gets nothing.
- **"simplify" / "keep it simple" do not appear.** This is the sharpest gap: the skill's
  most valuable half is "The other ditch", and the moment it exists for is a user saying
  "simplify this". At that moment this description does not fire, and unslop-code and the
  `/simplify` command — neither of which carries the two-way ban — do.
- "over-engineered", "over-commented", "flexibility", "future-proofing", "best practice"
  are present and good.

**Fix.** Lead the trigger clause with the distinctive vocabulary — YAGNI, over-engineered,
over-commented, "just in case", speculative, "simplify"/"keep it simple", "future-proofing",
"flexibility" — and demote the generic "writing or refactoring code" to a subordinate
clause. Word budget allows it: 79 used, ~90 precedented.

### H5. The skill asserts a cross-file route that will not exist when it lands

> "its over-engineering tell (catalog entry 10) routes here for the write-time fix"

Present tense, and false at merge: the unslop-code patch lands separately, and
`unslop-code/references/tells.md` entry 10 (l.265) currently carries no pointer here.
Same class as H2 — a stated fact about another file that a reader would not re-derive.

Related landing-checklist gap, flagged not litigated: the README convention "Adding a leaf
updates its hub's routing table in the same commit" cannot be met as things stand. No hub in
the table routes to earn-every-line, and the only planned inbound route is from a fork,
arriving later. The draft does not name a hub.

**Fix.** State it as intent — "unslop-code's over-engineering tell, catalog entry 10, is the
recognition side; the route from it lands with that fork's local patch" — and either name
the hub that will carry the routing row (plan-first is the plausible one, at the moment
structure is proposed) or record the exception explicitly so the convention gap is
deliberate rather than missed.

---

## MEDIUM

### M6 is the one that reads worst against the skill's own rule; the rest are citation drift.

### M1. "The measured failure runs in both directions" — the second direction is not measured

> "The measured failure runs in both directions: models bury code in restatements, and
> models also replace a reasoned why-comment with a trivial one ('the agent will come
> through and replace that reasoned comment with "Add one to index"')."

Pack §2, "AI replacing a meaningful comment with a trivial one": one HN comment, user lolc,
thread 45624429, consensus **moderate**, explicitly "one strong corroborated source". That
is an anecdote, not a measurement. The quote is also reproduced verbatim with no
attribution — the only unattributed direct quotation in the skill.

**Fix.** "reported in both directions", and attribute the quote to an HN commenter or
paraphrase it out of quotation marks.

### M2. The AGENTS.md study is cited for a claim it did not test

> "the one controlled study of CLAUDE.md-style instruction files found LLM-written ones
> actively hurt task success ('agents, like humans, can be over-instructed'), which is why
> this skill is a handful of tests and not forty commandments."

The first half is accurate (pack §3/§4: LLM-generated files −2–3%, human-written +4%, cost
+20%). The inference is not: the paper's measured variable was **authorship**, not rule
count. "Fewer rules is better" does not follow from "LLM-written rule files did worse". The
finding that actually bites here is the one the draft does not draw — this is an LLM-drafted
instruction file, and the study's negative arm is exactly that population.

**Fix.** Cite it for what it measured, and either drop the "handful of tests" inference or
ground it in the paper's named over-reliance mechanism, stated as the mechanism.

### M3. The "~20%" figure is unnamed in the body, unlisted in Provenance, and swaps metrics

> "a multi-model benchmark found 'be concise' system prompts degrade factual reliability,
> worst case ~20%"

Source is Giskard's Phare benchmark (research doc l.211). Two drifts: the 20% is a drop in
**hallucination resistance**, not in factual reliability — the pack's sentence uses both
terms and the draft has fused them; and the benchmark is general chat factuality on Claude
3.7 Sonnet / GPT-4o / Mistral Large, not coding, which the pack flags and recommends be
presented as analogy. **Giskard appears nowhere in the draft's Provenance list**, so the only
quantified figure in the anti-goal section has no named source anywhere in the skill.

**Fix.** Name Giskard/Phare, state the metric it measured, keep the "general case" hedge
that is already there, and add it to Provenance.

### M4. "so accuracy is not the problem to fix" over-reads one narrow study

Guelman et al. is GPT-3.5 Turbo against 415 Java code elements (pack §4); the pack's own
verb is "suggests". The draft converts that into a closed question about present-day models.
The direction is right and worth keeping — the target is volume and placement — but the
certainty is borrowed.

**Fix.** "one study, on an older model and a Java sample, rated AI comments equal or better
most of the time — so the target is volume and placement, not correctness."

### M5. YAGNI attribution is one clause away from the conflation the brief warned about

> "The canonical statement is Jeffries', from the XP practice notes, 1998"

Strictly accurate (pack §1b: VERIFIED, the sentence really is Jeffries', 1998). But the
skill never mentions that Fowler traces the phrase's origin to a Beck/Hendrickson
conversation on C3, while citing Fowler's Yagni bliki four times in the same section. The
takeaway a reader forms is "YAGNI is Jeffries'", which pack §1a exists specifically to
correct: "Do not have the skill say 'Fowler traces YAGNI to Jeffries'". The draft does not
say it, but it does not prevent it either.

**Fix.** One clause: the phrase came out of a Beck/Hendrickson conversation on C3 (Fowler);
the canonical sentence is Jeffries', 1998.

### M6. "Beyond code" is a section with no caller under the skill's own trigger, and it reaches into three siblings' territory

The frontmatter fires on code. A session writing a report, a plan, or a process document
will never load this skill and never read this section — so its named caller does not exist.
That is the skill's own test, failed by the skill, in the section arguing the test
generalises.

It also claims owned ground the "does not fire on" line does not fence:

- "a plan phase for a future nobody scheduled" — plan-first owns the out-of-scope list;
  flag-deferred-items owns the anchor for anything deferred.
- "a report section no reader will act on" — deliverable-integrity and unslop-text.
- "an option in a config nobody will set" is fine; it is the code case restated.

**Fix.** Delete the section, or compress it to one sentence inside "## The rule" and add the
prose/plan siblings to the "does not fire on" line. Deleting it is the move the skill would
recommend to someone else.

### M7. The skill preaching restraint is four times the size of its cohort

1,991 words and 193 lines. rerun-before-verdict — the exemplar it explicitly follows — is
505 words and 57 lines. Every other leaf checked is 47–66 lines
(flag-deferred-items 66, prove-it-can-fail 65, blast-radius-grep 49, live-state-first 49,
no-silent-data-drop 48, honest-failure-surfacing 47).

Concrete duplication, by the skill's own named-caller test:

- **"Where the bar sits"** restates the trust-boundary bullet ("Boundary validation is
  mandatory at the system edge and noise three calls deep") and the over-correction anchor.
  Its only new content is the greenfield differentiator, which belongs in "What this skill
  does not do".
- **The 47% GitClear figure is cited twice** (l.66 and l.172) — a value with one caller,
  passed twice.
- **"Why"** restates Fowler's cost of carry and Metz's influence argument, both already
  stated in full in the YAGNI bullets, then adds a third citation stack.

**Fix.** Cut to the cohort shape — rule / how to apply / what it does not do / why /
provenance — and let each citation appear once. Target the 60–70 line band the other leaves
occupy.

---

## POLISH

**P1. The greenfield differentiator misstates the sibling.** "This skill's anchor is
absolute… which is what still works on greenfield, where there are no neighbours to match."
fitting-the-codebase.md:26–29 handles greenfield directly: "If there is genuinely no
precedent in the repo (a brand new project), make one deliberate decision and write it
down". The differentiator survives; the reason given does not. (The pointer itself is
correct — the anchor line is at fitting-the-codebase.md:71.)

**P2. "verifies it independently" should be "corroborates".** Complaint-frequency data
cannot verify a vendor's statement about its own models. The figures themselves check out:
tells.md entry 1 (over-commenting/narrating) verified 8.5%, entry 10 (over-engineering)
verified 7.8%, and "every extra layer is more surface for a bug to hide in" is verbatim at
tells.md:267–268.

**P3. Provenance credits two GitClear reports; only one supplied figures.** All three
numbers used (81%, under 4%, 47%) are from the Jan-2026 report. The pack warns the two
reports "use different methodologies/date ranges and should be cited as two separate
anchors, not combined". Listing both implies the 2025 report backs something in the text.

**P4. Anthropic docs are cited by section name with no URL** ("Overeagerness", "Reduce file
creation", and at l.129 an unnamed Opus 5 over-verification page), in a library whose
verified-citations hub exists for this. The research doc holds all three URLs.

**P5. The shim fence is silent on the case that bites.** "no backwards-compatibility shim
for a function whose every caller is in the same diff" is a good fence, but a model cannot
see callers outside the repo and silence reads as permission. One clause: if any caller is
outside this repo, it is not the same diff.

**P6. The rule section is the only one in the library carrying an external citation.** Every
other leaf's "## The rule" is a short, unadorned paragraph; this one runs two paragraphs and
imports the grugbrain line. The quote is verified and good — it just belongs in "Why".

---

## Out-of-scope work noticed (flagged, not done)

- `docs/RESEARCH_2026-08-17_earn-every-line.md` is untracked (H2). Committing it is part of
  the landing commit, not a draft edit.
- The routing-table convention gap (H5) needs an owner decision, not a wording change.
- I did not edit the draft, any repository file, or the research packs.

---

## VERDICT: LAND WITH FIXES

The substance is sound, the boundary section is mostly right, the name is clear, and most
citations hold up against the packs. But two of the three CRITICALs are live damage paths
that a mid-tier model reading literally will walk down, and they are cheap to close.

**The three fixes that matter most:**

1. **Bound the deletion licence (C1).** Scope the named-caller test to code being written;
   for existing code require blast-radius-grep by name, exclude exported/published API, and
   default to "cannot establish zero users → it stays".
2. **Fix the trust-boundary bullet (C2 + H1).** Replace the exhaustive-reading parenthetical
   with a non-exhaustive positional test, add "if you cannot name what makes the state
   impossible, the check stays", name server-side-authority and ai-surface-discipline, and
   either verify the "Only validate at system boundaries" sentence into the research doc or
   drop it.
3. **Move the two-way ban above the licences and give deletion a test (C3).** Put it in
   "## The rule", and mirror the entry test: name what is lost if this line goes, or it
   stays.
