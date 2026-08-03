# Lessons learned in the field

Notes from applying these skills on real jobs. Identifying details removed; the
lessons survive anonymisation, which is rather the point of a lesson.

## 1. A document can render perfectly and parse as garbage

**What happened.** An AI-rewritten CV displayed "5★" hygiene ratings flawlessly
on screen, but the star glyph fell back to a Type3 font and the extracted text
came out with the star detached and reordered, so the token a recruiter's search
needed did not exist in the file. The replacement pipeline then did the same
thing a different way: Word's built-in List Bullet style leaked U+F0B7, a Private
Use Area codepoint from the Symbol font, into the PDF text layer. Invisible on
the page, junk to a parser.

**The lesson.** Rendering and parsing are different code paths. Looking at a
document verifies only one of them, and the one a machine reader uses is the
other.

**How to apply.** Any document destined for machine consumption gets verified by
re-extracting its text and asserting on the result: required strings present,
banned strings absent, no glyphs outside the expected character range, fail the
build otherwise. The manual version is select-all, copy, paste into Notepad.
What Notepad shows is what the parser sees.

## 2. AI rewrites drift on claims, not just style

**What happened.** An AI rewrite of a CV quietly upgraded a bullet about
supporting workplace investigations in a notetaking capacity into one about
conducting the investigations, and invented a headline job title the candidate
had never held, four lines above the real title that contradicted it. Nobody
asked it to inflate anything. Inflation is what filling gaps with plausible text
looks like.

**The lesson.** The dangerous failure mode of an AI rewrite is not that it
sounds like AI. It is that the claims move. Style drift is embarrassing; claim
drift is an integrity problem that surfaces at interview or reference check.

**How to apply.** When AI has rewritten anything that makes factual claims, diff
it against the source claim by claim, not sentence by sentence. Where the
rewrite says more than the original, the original wins unless the author
confirms the stronger claim in writing. Keep a record of reverted inflations in
the project so they cannot creep back in a later edit.

## 3. Lexical scanners pass obvious slop; structure is where detection lives

**What happened.** Two CVs both scanned "mostly clean" on the unslop-text
lexical pass while one was unmistakably machine-written to any human reader. The
giveaway was structural: every bullet ran power-verb, object, trailing "-ing"
clause, on an identical metre. No wordlist catches a metre.

**The lesson.** A clean scan means the lexical layer is clean, nothing more. The
tells that make a human reader certain something is machine-written are rhythm,
emptiness and uniformity, and they need a human pass, reading aloud. This is
exactly what unslop-text's own guidance says, and it proved true on contact.

**How to apply.** Treat the scanner as a floor, not a verdict. After a clean
scan, check the Part B structural tells by ear. And run your own checks on your
own deliverables before shipping: the audit report in this very job initially
failed its own scanner, five em dashes and all.

## 4. Chase vendor documentation, not folklore

**What happened.** The feared mechanism in the CV-screening domain ("the ATS
auto-rejects 75% of CVs") traced back to a dead company's 2012 marketing with no
study behind it, endlessly requoted. The real mechanisms were sitting in primary
sources the whole time: the parser vendor's published severity codes
(multi-column layout: fatal; PDF format: major) and the knockout questions
employers configure on application forms.

**The lesson.** In a vendor-dominated domain, the SEO layer repeats numbers with
no methodology while the vendors publish the actual behaviour in technical
documentation. The folklore and the documentation frequently point in opposite
directions.

**How to apply.** Before optimising against a claimed mechanism, find the
primary source that documents the mechanism. A number with no traceable
methodology is fabricated until shown otherwise. In research output, label every
claim as well-evidenced, weakly evidenced, or myth, and say which.

## 5. Unfillable facts get loud placeholders, never plausible guesses

**What happened.** A generated document needed facts only its subject knew.
Instead of inventing or silently omitting, every gap rendered as a visible
`[[TOKEN: question for the owner]]` in the output, and the build verifier failed
on any token outside an expected allowlist. The mechanism caught a genuine
contradiction between two dates the subject had supplied, both of which could
not be true, and held the slot open rather than papering over it with the more
convenient one.

**The lesson.** A deliverable that cannot be completed honestly should be
impossible to ship accidentally. Visible placeholders turn missing facts into
questions for the person who owns the answer, and an allowlisted token set turns
any regression into a build failure.

**How to apply.** For generated documents with facts the generator does not
hold: render gaps as unmissable tokens, collect the questions once in a form the
owner can actually answer, gate the build on the token set, and never resolve a
factual contradiction by picking a side.

## 6. The library shipped the defect its own skills describe

**What happened.** One fact, the skill count, lived in four places: the README
table, the README prose, `plugin.json` and `marketplace.json`. Nothing asserted
any of them. `1d780cb` deleted a skill on promoting it to a hook and updated the
README table row only, leaving the prose and both manifests at 39 against 38 on
disk. `385755d` then corrected the prose and left the manifests, so the two
published descriptions shipped wrong by one for two commits, and a later
addition took the disk back to 39 and made them accidentally right rather than
maintained. It surfaced only because adding a skill meant reading the count, and
reading it meant counting the directories.

**The lesson.** `blast-radius-grep` and `enforce-invariants-in-build` both name
this exactly, and neither fired, because the moment that needed them was a
deletion rather than a write. That is also why the fix could not be a hook: the
warn family in `hooks/` observes Write and Edit, and a removed directory is
neither. A skill's description can only match a moment somebody is having, so an
invariant broken by absence needs a gate that runs on the whole tree.

**How to apply.** When one fact appears in more than one file, either
single-source it or gate it, and pick the layer by asking what change breaks it:
a write-triggered warn cannot see a deletion, and a manual report is only as
good as the last time somebody ran it. Assert the set, not the count, because
the count is a lossy proxy for the invariant that matters. Then prove the gate
against real history rather than only against fixtures, which here meant
`git archive` at the two offending commits and watching the failure count fall
from three to two as the partial fix landed.

## 7. The agents' own accounts of the wave were the least reliable thing in it

**What happened.** The first wave run to `commission-the-roster`'s own rules was
four agents on a regulated repo: an adversarial review of a client-money pull
request, a strategic ruling on sequencing, a docs pass, and a build. The work
was good. Three confirmed HIGH findings came back, one of them a double-post
onto a client ledger, and the strategic reviewer overruled the lead on three
counts and was right on all three.

The unreliable part was what the agents said about themselves. One reported
having "used roughly half the ~150k budget" while its metadata read 310,017
tokens, an error of four times with no dishonesty in it, because an agent has no
instrument for measuring its own consumption. Another cited a code location for
a real defect that was off by forty lines, correct about the mechanism and wrong
about the address. A third stepped outside its stated scope to edit five files
including the repository's always-on instruction file, with sound reasoning and
correct edits, and reported it afterwards rather than asking first. Separately,
the lead's own brief contained the worst error of the wave: it named a diff base
that rendered another branch's merged work as if the branch under review had
reverted it, which would have produced a Critical finding out of nothing.

**The lesson.** Two skills asserted a version of this and both were too weak.
`price-the-spend` said to read real usage numbers rather than reconstructing an
estimate, which guards against the reader guessing but not against the reader
believing a subject's guess about itself. `commission-the-roster` said a budget
line without a stop instruction is decoration, when the measurement shows it is
decoration with one too. In both cases the skill was written from the outside
looking in, and running the thing produced a sharper claim than reasoning about
it did.

There is a pattern in which of the wave's outputs held up. Substance survived
scrutiny at a much higher rate than addresses, counts and self-measurements did.
Every mechanism an agent described was real. Almost every number and citation
attached to those mechanisms needed checking, and roughly a third were wrong.

**How to apply.** Take spend from the harness's metadata and treat an agent's
account of its own budget as colour. Re-derive the file, line, count or date on
any finding before it enters a durable artifact, while accepting the finding's
mechanism on a lighter touch. Give agents an explicit route to refuse a fact and
to escalate work outside their scope, because the reasoning for stepping outside
is sound most of the time and the once it is not, nobody was asked. And check the
brief itself hardest of all: it is the only artifact in a commission that every
agent inherits and no agent audits.
skill that should have prevented this: findings-are-evidence caught the citation
drift and the false self-report, both by re-derivation. price-the-spend and
commission-the-roster each stated a weaker version of the spend rule and were
corrected by this wave rather than preventing it.
class: a subject reporting on itself, where the report is generated by the thing
whose accuracy is in question. Second instance in this library, the first being
entry 6's marker written by the code under test.

## 8. The guardrail library's own checkout was the stale state

**What happened.** A session on one of the library's machines reviewed an
external governance system, extracted two patterns worth keeping, authored them
as skills, and committed against that machine's checkout of this library, which
turned out to be roughly sixty commits stale: it predated the four-layer
architecture, the hooks, the index gate, and over twenty of the current skills.
The push bounced on git's fetch-first rule. The staleness was material, not
cosmetic. Two of the four kernels planned for one new skill were already owned
by findings-are-evidence, verify-the-effect and prove-it-can-fail, all richer
and incident-anchored, so the planned skill would have shipped as a duplicate
trigger surface; and the README edits targeted a table structure that no longer
existed and would have failed the index gate. Everything was re-authored from
the remote tip and the original commit discarded as superseded.

**The lesson.** parallel-work-recon names the mechanism exactly: knowledge of a
repo's state is a snapshot with a short half-life. The part worth a new entry is
the recursion. The skill that should have fired was absent from the machine
because of the very staleness it guards against; the checkout predated the
skill's own admission to the library. A guardrail library distributed as a
checkout is itself parallel-worked repo state, and the machine with the stalest
copy is precisely the machine least equipped to know it. The guard that did
fire was git's fetch-first rejection: deterministic, and entirely independent
of what the session knew.

**How to apply.** On a checkout-mode machine, `git pull` in `~/.claude/skills`
at session start, or move the machine to plugin mode, which refreshes itself.
Before authoring a new skill, check the proposal against the remote's live
table rather than the local one; an overlap review against a stale index
approves duplicates. And when a push bounces on fetch-first, treat the incoming
diff as review input rather than an obstacle to clear: here the sixty incoming
commits reversed the verdict on half the planned work, and the re-author cost
well under an hour against the open-ended cost of two skills whose triggers
fought three existing ones.
skill that should have prevented this: parallel-work-recon, present on the
remote, absent from the stale checkout that needed it.
class: distribution-channel staleness, where the enforcement layer is itself
versioned state and a machine's copy of the guardrails goes stale in exactly
the way the guardrails warn about. First instance.
