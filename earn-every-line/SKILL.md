---
name: earn-every-line
description: Nothing enters a file without a present need. Code earns its place by a caller that exists, a comment by saying what the code cannot, flexibility by a stated requirement. Triggers on over-engineered, over-commented, YAGNI, speculative, gold-plating, "just in case", "future-proofing", "flexibility", and on "simplify" / "keep it simple" (both over-correction ditches are fenced); more generally when writing or refactoring code. Does not fire on recognising AI-written code (unslop-code owns the audit), failure-message wording (honest-failure-surfacing), or client-supplied data rules (server-side-authority).
---

# Earn every line

The model's default is to add: the helper the function did not need, the option nobody
passes, the try/except around code that cannot fail, a comment per line saying what the
line says. Anthropic's own docs admit the tendency of its models (the "Overeagerness"
section, written for Opus 4.5/4.6: they "overengineer by creating extra files, adding
unnecessary abstractions, or building in flexibility that wasn't requested"), and this
library's unslop-code catalog corroborates it from complaint data (over-engineering
verified at 7.8% of tell-naming complaints, narrating comments 8.5%). This skill is the
write-time gate those numbers point at. Layer: leaf. Admitted by commission plus
external evidence rather than the misses log — see Provenance — so candidate-tier until
fires accumulate.

## The rule

Every line serves someone who exists. Code serves a caller that exists; a comment
serves a reader who learns something the code cannot tell them; flexibility serves a
requirement someone actually stated. Name the caller, the reader, or the requirement —
by name, not by category ("a future maintainer" is a category; "the retry loop in
sync.ts" is a name). Cannot name one → it does not go in. The test is positional, so it
travels: the check that is rigour at a system edge is noise three calls deep, a public
API owes the docstring a module-private helper does not, and a report section or plan
phase answers the same question — who needs this now?

Deletion gets the mirror test, and it outranks every licence below: name what is lost
if this line goes — the caller, the reader, or the requirement it serves. Can name
one → it stays. Concretely banned as "fixes": stripping validation at a trust boundary,
deleting a comment that carries a why, golfing for line count, and citing YAGNI to skip
tests or refactoring — Fowler's own exclusion: yagni "does not apply to effort to make
the software easier to modify" and "is not a justification for neglecting the health of
your code base."

At diff level, the same rule: make the change that was asked or is clearly necessary to
it. Reformatting neighbours, renaming things you passed, upgrading patterns you
dislike — unrequested improvements are speculation in the change dimension, and they
turn a 50-line reviewable diff into a 500-line unreviewable one.

## The structure half

The phrase YAGNI came out of a Beck–Hendrickson exchange on the C3 project (Fowler's
account); the canonical sentence is Jeffries', 1998: "Always implement things when you
actually need them, never when you just foresee that you need them." The tests:

- **The named-caller test, at write time.** A helper, wrapper, interface, base class,
  or parameter you are about to add for one caller: inline it. For no caller: do not
  write it. Removing code that already exists is a different act with a different bar:
  run blast-radius-grep first (a plain grep misses dynamic dispatch, registries,
  reflection, test-only callers, open branches, and published surface — an export never
  counts as zero-callers from inside one repo), and where zero users cannot be
  established, it stays.
- **Abstract on the third occurrence, not the first.** Refactoring (1999) records Don
  Roberts' guideline: the first time, just do it; the second time, wince and duplicate
  anyway; the third time, refactor. Until then, "duplication is far cheaper than the
  wrong abstraction" (Metz, 2016) — and the wrong abstraction does not sit still:
  "existing code exerts a powerful influence. Its very presence argues that it is both
  correct and necessary." The retrospective is always the same shape: "My code traded
  the ability to change requirements for reduced duplication, and it was not a good
  trade" (Abramov, Goodbye, Clean Code, 2020).
- **Flexibility is a cost until a stated requirement redeems it.** An option with one
  call site passing one value, a config nobody sets, a plugin point with no second
  plugin. Fowler prices the presumptive feature four ways — build, delay, carry,
  repair — and carry compounds: every later reader parses the flexibility to learn that
  nothing uses it.
- **Defence belongs at trust boundaries, and the boundary list is never exhaustive.**
  The vendor's counter-prompt: "Trust internal code and framework guarantees. Only
  validate at system boundaries (user input, external APIs)" — and read those two
  examples as a floor, not the list. Anything that crossed a process, network, storage,
  tenant, or privilege line, or came out of a model, is external no matter which repo
  wrote it (server-side-authority and ai-surface-discipline own those surfaces). Inside
  the boundary, "cannot occur" must be named: point at the constraint, type, or
  invariant that makes the state unreachable, or the check stays. And a fallback that
  manufactures a value when code you control fails does not handle the failure, it
  hides it (no-silent-data-drop owns that rule).
- **Edit in place.** No `_v2` / `_new` / `enhanced_` forks; git owns history. No
  backwards-compatibility shim when every caller is in the same diff — and a caller
  outside this repo means it is not the same diff.

## The comment half

One test per comment: does the reader learn something here that the code below cannot
tell them? No → do not write it. Yes → it is almost always a why: the constraint that
forced this shape, the unit or invariant, the external gotcha, the source of a magic
value. The doctrine is institutional, not AI-era: "It is often better for comments to
explain why something is done, not what the code is doing" (Google's Go style guide).

On the lines you are writing or changing, do not write: the restatement
(`// increment i`); the narration (`# First, we...`, `// Step 3:`) — chat voice
serialised into the file; the changelog (`// changed to fix bug`) — a commit message in
the wrong place, stale on arrival; the reviewer-directed justification (`// this
ensures correctness`) — noise to every reader after merge; the essay docstring on a
function whose signature says everything. Sweeping comments out of code you were not
asked to touch is an unrequested improvement under the diff rule: a de-slop pass over a
file is a job someone asks for, not a standing licence.

And the counterweight, which is half the point: **this is not a no-comments doctrine.**
Ousterhout's A Philosophy of Software Design argues comments exist to carry what the
code cannot express — intent, units, the semantics a signature cannot hold (nothing in
`substring(start, end)` says whether `end` is inclusive) — and that self-documenting
code is, on inspection, a myth. The failure is reported in both directions: models bury
code in restatements, and one HN reviewer describes the reverse, the agent replacing a
reasoned why-comment with "Add one to index". A why-comment is load-bearing; deleting
one to look terse is narrating in reverse. The test is information delta, never
length — and the target is volume and placement, not accuracy: the one study on AI
comment accuracy (GPT-3.5, 415 Java elements) rated them equal or better than the human
original most of the time.

## The other ditch

Told to simplify, the model does not become judicious; it swings: stripped validation,
deleted why-comments, four behaviours in one clever expression. The swing has a
measured analogue — Giskard's Phare benchmark found "be concise" system prompts degrade
factual reliability, with hallucination resistance dropping up to ~20% in the worst
case (chat factuality, not coding; an analogue, not a proof) — and nobody posts the
coding war story, because a stripped check does not fail at the demo; it fails
silently, later, to someone else. The thin incident record is the failure mode working,
not evidence of safety. When the instruction is "simplify", the deletion mirror test in
The rule is the whole job.

## What this skill does not do

It does not audit whether code reads as AI-written — unslop-code owns recognition, and
its over-engineering tell (catalog entry 10) routes here for the write-time fix. Where
surrounding code exists, unslop-code's fitting-the-codebase method anchors relative
(match the neighbours' level; on greenfield, make one deliberate convention and write
it down); this skill supplies the absolute test those decisions use — the present need.
It does not design failure messages (honest-failure-surfacing), govern what fallbacks
may do to content (no-silent-data-drop), judge tests (prove-it-can-fail), or own
plan-level scope lists (plan-first) and deferred-work anchors (flag-deferred-items) —
it is the deletion pressure inside them. It does not forbid abstraction, comments, or
defence; it prices each against a present need. And it ships no scanner, deliberately:
these tells need a call graph and judgment, and the one regex-able form (narrating
comments) is already in unslop-code's scanner. A second scanner would be a helper with
one caller.

## Why

A speculative line is never neutral: it is read on every pass, carried through every
refactor, and it is surface for bugs to hide in ("every extra layer is more surface for
a bug to hide in" — the unslop-code catalog). Generation amplified the old failure, and
the ecosystem numbers moved: GitClear's Jan-2026 report measures duplicated blocks up
81% since 2023, refactoring down to under 4% of changed lines, and error-masking
constructs up 47% — vendor-published, but the only longitudinal series anyone has.
Restraint is no longer a senior taste; it is the explicit counterweight to the tool's
default, and its cheapest form is one word: "best weapon against complexity spirit
demon is magic word: 'no'" (grugbrain.dev).

## Provenance

Commissioned by the operator, 2026-08-17, against over-engineering and diary-comments
in AI-assisted work; no in-house lessons entry yet, so admitted by commission plus
external evidence, following rerun-before-verdict's precedent. Quoted sources were
verified by direct fetch on 2026-08-17, in-session or by the commissioned research
agents, statuses per the committed packs: Anthropic's prompting best-practices
(platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices,
"Overeagerness"), Fowler's Yagni bliki (2015), Jeffries' You're NOT Gonna Need It
(1998), Metz's The Wrong Abstraction (2016), Abramov's Goodbye, Clean Code (2020),
Google's Go style guide, grugbrain.dev, Giskard's Phare study. Paraphrased with
attribution and deliberately never quoted, because the relevant primary text stayed
unopened: Don Roberts' rule of three as recorded in Refactoring (1999); Ousterhout
(2018) — his free extract was read first-hand on 2026-08-17 but carries chapters 6 and
21 only, not the comment chapters (research doc, Part 3).
Figures: GitClear's Jan-2026 maintainability report (its separate 2025 report is not
the source of any figure here); Guelman et al., arXiv:2408.14007 (comment accuracy);
Gloaguen et al., arXiv:2602.11988 — the one controlled test of repository instruction
files: LLM-authored files cut task success 2–3%, human-written gained ~4%, both raised
cost 20%+, mechanism named as over-instruction and over-reliance. This skill is itself
LLM-drafted — the population in that study's negative arm — which is why it was
operator-commissioned, adversarially reviewed against its own evidence packs, and kept
deliberately small. Both research packs are preserved verbatim as Part 1 and Part 2 of
docs/RESEARCH_2026-08-17_earn-every-line.md, committed alongside this skill; the
in-house shares (7.8% / 8.5%) are unslop-code/references/tells.md entries 10 and 1.
Fowler, Metz, and the Anthropic defensive-coding bullet were re-verified first-hand by
the lead.
