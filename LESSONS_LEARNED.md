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
