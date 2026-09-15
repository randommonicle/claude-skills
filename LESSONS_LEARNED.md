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

## 9. The packaged copies of the skills shipped the bug their own patch log said was fixed

**What happened.** An integration touching unslop-ui checked whether its bundled
`.skill` archive was current before regenerating it, and then checked the other
two. All three were stale against their source directories. `unslop-ui.skill`
still carried the pre-patch `devibe_scan.py`, so the packaged copy shipped the
exact Windows `UnicodeEncodeError` crash that `unslop-ui/UPSTREAM.md` records as
locally fixed; both other archives carried stale scanners, and
`unslop-text.skill` a stale SKILL.md. Nothing regenerates an archive on edit and
nothing diffs archives against the tree, so the drift had no symptom on any
machine reading the directories — a stale package has no reader at all until the
day something installs it, and then it installs the past, patches reversed. The
same review also found the machine's own `~/.claude/skills` checkout two skills
behind the remote: the second instance of entry 8's distribution-channel
staleness class, caught this time by a deliberate repo-versus-install diff
rather than by a bounced push.

**The lesson.** An archive built from a directory is a derived store, and a
derived store without a gate drifts exactly like entry 6's duplicated count.
"Regenerate on edit" is a discipline, not a control. Entry 6 already established
that an invariant broken by absence needs a gate that runs on the whole tree; an
archive member is invisible to write-triggered warns for the same reason a
deleted directory is.

**How to apply.** Every packaged or derived artefact committed alongside its
source — archives, bundles, vendored copies — gets a deterministic check that
walks the artefact's members against the tree and fails naming each stale,
missing or extra member. All three archives were regenerated (f16cecc, 0e2cac7);
the gate itself is in flight as a separately commissioned task, and until it
lands a `.skill` file is unverified by default.

**Postscript, same day.** The commissioned gate landed (`hooks/check-archives.mjs`,
merged 6a1244e) and its first sweep found the library's other two archives —
`skill-library-builder.skill` and `verified-citations.skill` — stale as well:
five of five. The hand check above stopped at the three archives it knew about,
which is the difference between a check and a gate in miniature. Run against the
pre-fix tree, the gate reproduced the manual findings member for member before
naming the two the hand check missed; it now runs on every push and PR, and
`node hooks/pack-skill.mjs <skill-dir>` makes the fix one command.
skill that should have prevented this: enforce-invariants-in-build — "archive
mirrors directory" was an invariant nothing asserted; blast-radius-grep names
the fix, backing a value copied into a second store with a drift check.
class: derived-artefact staleness, a committed copy built from source with no
gate diffing it against that source. Sibling of entry 8's distribution-channel
staleness (the copy a machine installs) and entry 6's duplicated fact (the copy
a reader trusts). First instance as a package; entry 8's class recurred in the
same review.

## 10. The restore step of a kill-test reverted the fix under test

**What happened.** Proving that a new gate assertion could actually fail
(2026-08-10, the VENDOR exclusion work, 632062a), a session mutated
`hooks/check-index.mjs` in place with sed, removing one name from the new set,
and watched both new checks go red for the right named reasons. It then
"restored" the file with `git checkout -- hooks/check-index.mjs`. The VENDOR
change itself was still uncommitted, so the checkout restored HEAD and
discarded the fix along with the sabotage. The rerun stayed red with the same
"2 cases failed" count, and only reading the file rather than the count
revealed that the cause had changed: the set was no longer one name short, it
was gone entirely. The edit was re-applied and the committed result verified.

**The lesson.** `git checkout --` does not mean "undo my last change". It means
"restore the committed state", and on a file carrying uncommitted work those
are different operations with different blast radii. A kill-test that mutates
the real file puts the fix and the sabotage in the same working copy, which
makes the restore step destructive by construction. And two red runs printing
the same summary count are not the same failure; the count matched, the cause
did not.

**How to apply.** Kill-test on a copy, or reverse the mutation by hand, or
commit the fix first and sabotage after. Never `git checkout --` a file whose
current state is not yet committed. When a suite reds on both sides of a
restore step, compare the failure reasons, not the counts. The recovery here
was the new guard doing its job on day one: the rerun stayed red instead of
passing quietly with the fix gone.

skill that should have prevented this: rerun-before-verdict (the second red
reads as the first's echo until the reasons are compared) / none - new
candidate (kill-test-on-a-copy: prove-it-can-fail demands the demonstration
but says nothing about doing it safely on a live working copy).
class: destructive restore of uncommitted work, an undo whose scope is wider
than the change it meant to undo.

## 11. The fire log recorded 'unknown' for a month and nothing could tell

**What happened.** `skill-fire-log.mjs` read the skill name from
`evt.tool_input.skill` and, when that was empty, wrote the sentinel `'unknown'`.
From 2026-08-10 to 09-13 every one of 508 lines was `'unknown'`, with `args`
null and all carrying a single project's cwd, so `audit-fires.mjs` scored every
skill as never-fired. The hook is fail-open and had no test, so a payload it
could not read looked identical to a healthy one, and the rating system the
tiering ladder rests on was blind for a month. Found 2026-09-12 only because a
review read the log rather than trusting that it worked. The names were not lost
everywhere: the session transcripts under `~/.claude/projects` still carried
about 199 explicit `Skill` tool_uses with their names, enough to reconstruct a
partial history from a different source. The 508 lines themselves were never
skill fires at all (see the postscript): they are Antigravity `view_file`
events, and the 199 is the whole recoverable Claude Code history.

**The lesson.** A fail-open instrument whose default sentinel is
indistinguishable from a valid reading cannot report its own failure, so it
fails in the one way nobody looks at. `'unknown'` is a value, and a stream of it
reads as data, not as breakage. A second defect compounded the first: on the
Claude Code side the hook was never wired on this machine at all, so the 74-odd
real `Skill` calls in that window produced nothing, and no gate asserted that
the measurement arm was itself running.

**How to apply.** When a check cannot read what it needs, make it capture the
shape of what it got, keys only and never the payload body (here the loaded
skill text), so an unreadable input becomes a recorded question rather than a
silent default. Give every fail-open instrument a test that feeds it a shape it
cannot read and asserts the loud path fires, not the sentinel. And treat "is the
instrument wired and firing where it claims to measure" as its own gate: a
measurement that runs in one project and nowhere else is not measuring the
library.

skill that should have prevented this: prove-it-can-fail (ask what the log
prints when the name cannot be read; the answer "unknown, silently, forever" is
the tell) / none - new candidate (instrument-liveness: prove-it-can-fail demands
a check be able to go red, but says nothing about asserting the check is wired
and running where it claims to measure).
class: a fail-open instrument whose default sentinel is indistinguishable from a
valid reading, so its own failure is invisible to whatever consumes it. Sibling
of entry 10's count-not-cause, a summary that reads the same whether or not the
underlying state moved.

**Postscript, 2026-09-14.** The first diagnosis was wrong, and it went into the
fix's own comments and into this entry. It read the 503 nameless lines as an
unknown "auto-activation" event class whose payload key could only be learned
by wiring the hook and waiting. Two days later the log had grown by five while
nothing was wired on the Claude Code side, which forced a search of the one
project's tree rather than `~/.claude`: `.agents/plugins/ash/hooks.json`, a
hand-made Antigravity port of the plugin from 10 August, wires
`skill-fire-log.mjs` to Antigravity's `view_file` tool through a wrapper that
passes `{cwd, tool_input: {}}`. Every file view in that project was one
`'unknown'` line; piping that exact shape into the original hook reproduces a
log line field for field, all 508 lines carry the wrapper's lowercase `c:/`
drive prefix and none carry Claude Code's uppercase one, and the log begins
eighteen minutes after the port was written. There was no key to discover. The
hook now writes a fire line only for a `Skill` tool event and captures any other
shape, and the test's red case is the wrapper payload rather than a synthetic
one. The miss is findings-are-evidence again: the primary source was on disk
the whole time, in `.agents/` beside the `.claude/` that was searched, and a
diagnosis with an unfalsifiable step ("wire it and wait for the shape") should
have been the tell that the evidence had not been found yet.

## 12. The push gate did not match the push command the library tells you to use

**What happened.** `push-gate.mjs` gated on `/\bgit\s+push\b/`. Any git global
option between the two words walked past it: `git -C <path> push`,
`git --git-dir=<p> push`, `git -c k=v push`. `parallel-work-recon`, in the same
library, tells every session in a worktree to use `git -C` exclusively, and the
fire-log handover's own commands used it. The gate had a test suite, green, that
fed it only the bare form. Found 2026-09-14 within an hour of the hook being
wired for the first time on this machine, and only because the verification
ride happened to run `git -C ... push --dry-run` through the PowerShell tool:
the plain-form Bash call minutes earlier had left a `hook_success` record in
the session transcript, the `-C` form left nothing. In a bypass-permissions
session the gate's "ask" is auto-approved and never shown, so that transcript
record was the only place the difference could be seen. A second, smaller
miss on the way to the fix: the first new test case, `--git-dir=<unquoted
path>/.git push`, passed on the old pattern too, because the path ended in
`.git` and `.git push` matched `\bgit\s+push\b` by accident. Quoting the path
made the case honest.

**The lesson.** A control is only as wide as the forms it was tested against,
and its author tests the form they picture. When another rule in the same
library steers everyone to a different form, the control's green suite proves
it works on the command nobody is told to run. The two skills were written
weeks apart, each correct alone, and nothing joined them. The proof surface
matters too: where a permission mode swallows the prompt, "I pushed and nothing
asked" is not evidence the gate is absent, and "it asked" is not available at
all; only the harness's own record of the hook running is.

**How to apply.** When a skill mandates an idiom, grep the gates for the verb
that idiom carries and add the mandated form to each gate's test suite, in the
same commit as the mandate. When proving a gate, prove it with the form the
library recommends, not the simplest form, and read the result where the
harness records it, not where the UI shows it. When adding a positive test
case to a pattern, run it against the old pattern first; a case that passes
before the fix is a decoration, and a path that happens to end in the very
token the pattern wants is the kind of accident that makes one.

skill that should have prevented this: prove-it-can-fail (each new positive
case was run against the committed original before the fix landed, which is
what caught the `.git push` accident; the same discipline applied when
`parallel-work-recon` was written would have asked what the gate prints for
`git -C x push`) / none - new candidate (cross-rule consistency: when one skill
mandates a form, the gates other skills rely on are tested with that form).
class: a control tested only against the form its author pictured, while a
sibling rule in the same library steers everyone to a different one. Sibling of
entry 11's unwired instrument: there the measurement never ran where it claimed
to; here the gate ran, on the wrong shape.

## 13. The skill was installed, unusable, and invisible at the same time

**Correction, 2026-09-14 late evening (entry 14 has the evidence).** The two
icc-site sessions were not "already open when the pack was installed". Both
launched 44 minutes after the pack landed, in a stub folder with no
`.claude/skills/` (`C:\Users\bengr\OneDrive\Desktop\icc-site`), switched to the
real repo with `change_directory` mid-session, and were refused before and
after the switch. The refusals are explained by the launch directory; nothing in
them tests "install, then start a new session", and a later session showed a
skill directory appearing at the launch directory mid-session being loaded. The
fire-log half of this entry stands as written. The paragraph below is left as it
was, because the misreading is the subject of entry 14.

**What happened.** Fourteen marketing skills were installed into three repos on
2026-09-14 and six test sessions were run against them. Four were fresh sessions
and loaded the skills normally. Two were sessions already open on icc-site, and
in those the Skill tool refused six times: `Unknown skill: seo-audit`,
`Unknown skill: schema`, `Unknown skill: copy-editing` three times. A session's
skill listing is settled when it starts; files appearing on disk afterwards are
not in it. Both sessions recovered by reading the SKILL.md files directly and
produced good documents, so from the operator's side the test looked like a pass.
The fire log tells the same misleading story from the other end: the hook writes
a line only for a Skill call that succeeds, so six real attempts to use the pack
left no trace at all, and `audit-fires.mjs` would score those five skills exactly
as it scores a skill nobody ever wanted. Two separate nulls, the refusal and the
silence, and neither is visible in the artifact the work produced.

**The lesson.** Sibling of entry 11, one layer up. There the instrument was not
wired; here it is wired, running, and structurally unable to record the event
that matters, because a failed load is not a load. Any counter that increments on
success is blind to demand that was refused, and demand that was refused is
exactly the signal worth having: it says someone reached for the skill and could
not get it. A model that routes around the refusal, reading the file by hand,
hides the fault at the same time as it does the work.

**How to apply.** Launch the session in the directory whose `.claude/skills/`
you need; the opening listing is built from the launch directory, and
`change_directory` did not rebuild it in either observed case (the first
sentence of this paragraph
read "install skills, then start a new session; never install into a repo whose
session is already open", which the correction above withdraws as a rule and
keeps as practice). When a skill is newly installed, the check is a Skill call
in a fresh session launched in that directory, not the presence of the files or
the quality of a document produced without it. For the fire log:
a refused Skill call is worth a line of its own, so that "wanted but unavailable"
stops being indistinguishable from "never wanted"; until then, read failures out
of the session transcripts (`is_error` on the tool_result), which is where this
one was found. More generally, when a test's subject can be bypassed by the thing
under test, state up front what the artifact would look like if the subject never
worked, and check for that shape rather than for quality.

skill that should have prevented this: one-real-ride (the ride was run, but on a
session that predated the change; a ride proves nothing about a seam the session
was constructed before) / none - new candidate (success-only counters cannot see
refused demand).
class: an instrument that records successes only, so a refusal and an absence of
interest produce identical data. Sibling of entry 11's unwired instrument and
entry 10's count-not-cause.

## 14. Two corrections in one evening, both from lines read without their state

**What happened.** The marketing pack went into `society/.claude/skills/` on
2026-09-14. Sessions for that project launch from the non-git folder one level
up, so a directory junction was created at 19:16Z to put the pack in the launch
directory. Six test sessions ran between 20:02Z and 20:23Z. Reading their
transcripts afterwards, the session that had done the install drew two
conclusions and wrote them into DECISIONS, this file, two CLAUDE.md files, a
lesson in the icc-site repo and another in the 1f916 folder, and pushed three of
them, all within the hour.

First: a listing of all fourteen skills as `society:ai-seo`, `society:pricing`
and so on, plus one successful call to `society:content-strategy`, was read as
"the harness reaches a subdirectory by path scope, the junction was never
needed", and the junction was removed at 20:56Z. The listing was real. It was a
`dynamic_skill` event at 20:13:18Z, in the second after a `Write` under
`society/`, ten minutes into the session, with the junction in place. The same
session's opening listing, a hundred lines earlier in the same file, carried
the pack unscoped through the junction, and so did the twin session's, which
made the same kind of `Write` and got no event. The first fresh session without
the junction listed no pack and was refused `Unknown skill`.

Second: the two icc-site sessions had been refused six times, and because the
pack had gone into that repo the same evening, the refusals were read as "a
session's listing is settled when it starts; install, then start a new
session", entry 13 above. Both sessions had launched 44 minutes after the pack
landed, in a stub folder on the OneDrive desktop with no `.claude/skills/` at
all. They noticed, switched to the real repo mid-session, and were refused
again after the switch. The launch directory explains every refusal; nothing in
them tested a mid-session install, and a later session showed one being picked
up.

Each conclusion was drawn from a line that said exactly what was claimed of it.
Neither was checked against the state the line was captured in: the session's
`environment` attachment (working directory, git or not), the timestamp
relative to the junction's creation and removal, the event immediately before
it. The environment attachment sits near the top of the transcript (line 4 in
every transcript read that night; older ones put it later); the junction
times were in the correcting session's own history.

**The lesson.** A transcript line is evidence of what the line says. A claim
about loading is a claim about state, when in the session, what happened just
before, what was on disk and where the session was launched, and the line does
not carry its state. Provenance for a transcript citation is timestamp and
preconditions, the way provenance for a commit citation is `git log` and not
the commit message. A correction is a claim like any other, and it is the more
dangerous kind: it arrives with the word "corrected" attached, it is trusted
for that, and it propagates into every document that quoted the original,
which is where the cost of a wrong one is paid.

**How to apply.** Before citing a transcript line as evidence about the harness,
write three things beside it: the timestamp, the event that immediately
preceded it, and the state the claim depends on, starting with the session's
launch directory from its `environment` attachment. Say whether the line is an
opening listing or a mid-session one. Look for the same line in a second
session before generalising; one session in two producing an event is a
finding, and a different one. When a recorded decision is being reversed, keep
the machinery in place until a fresh session, launched cold in the real
directory, proves the reversed claim; a ride taken before the machinery is
removed rides the old seam. And when an account of a failure fits the
narrative of the evening a little too neatly (the pack went in tonight, the
sessions were open tonight, therefore), check the timestamps before writing
the rule.

skill that should have prevented this: verified-citations (the citation
carried its quoted line, as the skill asks; it did not carry the line's
timestamp or the state it was captured in, which the skill does not yet ask
for) / one-real-ride (the ride that "proved" the correction ran with the
junction in place, and the junction was then removed on its strength).
class: evidence read without its provenance, one layer up from entry 13. There
the instrument could not see a refusal; here it saw two real events and the
reader attached each to the wrong cause. Same genus as verified-citations'
"provenance is the highest-risk class", extended from commits to transcripts.

## 15. Three probes, each valid for its own question, each answering a different one

**What happened.** On 2026-09-15 a design note for driving Antigravity and GPT
as headless CLI seats needed two facts: what a turn costs, and whether a seat
works at all. Both were measured, twice, with a cheap probe, and the number was
carried to a question the probe had not asked.

First, cost. `agy -p "Reply with exactly: hello from gemini"` returned 13,102
input tokens; the codex equivalent, 21,425. These went into
`docs/DESIGN_agent-bus_2026-09-15.md` as "a ~21k input-token floor per turn",
and a three-seat three-round thread was costed from them at roughly 180k. Both
figures came from a prompt that used no tools. A codex seat taking a real review
turn — read the file, run a probe, cite two lines — cost **71,288**; an agy turn
that read files and timed out cost **195,056**. The committed figure was out by
three to nine times for any turn that does work, and the correction (`fbef00e`)
had to say so in a document another machine was going to cost a session from.

Second, viability. After three fixes, `agy -p "Read the file X. Reply with only
the token."` completed in 40 seconds for 27,320 tokens. That was reported as
"agy works now", the seat was configured, and the commit said "Working as of
2026-09-15". An hour later the same seat was ridden through `run-seat.mjs` on a
real review turn and was **still in progress at the 150s print-timeout after
73,030 input tokens**, producing no section. Corrected in `faca163`, relabelling
the seat configured-not-proven.

*Correction, the same evening (entry 16): that was not a review turn. The
script had handed agy the literal string `{prompt}`; the 73,030 tokens were
spent on eight characters. The relabelling was right and the evidence for it
was wrong, which is this entry's own lesson applied to this entry.*

Third, and the same shape one layer down: every one of the transport's thirteen
tests passed `process.execPath` as the command — an absolute path, which skips
PATH resolution entirely. The suite was green while two consecutive real rides
failed `ENOENT`, because an npm CLI on Windows PATH is a `.cmd` shim sitting
beside an extensionless POSIX sibling that `spawnSync` cannot execute. The
fixture differed from the real thing in the exact dimension the code branched on.

**The lesson.** Each probe was well chosen for the question it was actually
asking. "Does the CLI respond?" is answered by hello. "Can it read a file?" is
answered by one file and a token. "Does the append logic work?" is answered by
any spawnable binary. The failure was not a bad measurement; it was carrying a
good measurement across to a question with a different shape — what does a turn
cost, can this seat do the job, will this run against the real CLI — where the
probe was silent by construction.

This is the cheapest possible error to make, because a probe is chosen to be
cheap, and cheap means stripped of exactly the properties the real case has. The
smaller and more decisive the probe, the further its number travels before
anyone notices it has left its own question behind.

**How to apply.** When a measurement is about to be written into a durable
artifact or built on, state in one line what the probe did **not** exercise, and
whether the real case differs on that axis. For a cost figure: did the probe use
tools, and does the real turn? For a viability claim: did the probe do the actual
job, or a proxy for it? For a fixture: does it differ from production on the
dimension the code under test branches on — and if so, the suite is green for a
reason unrelated to correctness.

Write the qualifier into the artifact at the same moment as the number, not as a
later correction. Both corrections above were made the same day by the same
session, which is the good case; the bad case is the other machine reading the
uncorrected figure first. "Measured on X" costs six words and makes the number
falsifiable; "a ~21k floor per turn" does not.

skill that should have prevented this: one-real-ride (it caught all three, and
caught every one of them **after** the claim was already committed — its trigger
is "declaring done", and all three were intermediate facts written mid-session,
so the ride came second) / none - new candidate (a measurement carried from the
probe that produced it to a question that probe does not answer).
class: a probe valid for its own question and silent on the one its number gets
used for. Sibling of entry 14 one axis over — there a real line was read without
the state it was captured in; here a real number is read without the question it
was captured for.

## 16. The failure matched the prior, so nobody asked what the seat had received

**What happened.** On 2026-09-15 the agy seat of the cross-agent-review CLI
transport was ridden through `run-seat.mjs` on a review turn. It was still in
progress at the 150s print-timeout after 73,030 input tokens and produced no
section. The transport did its job: a visible failure note, the round left
open. That result was accepted as a measurement of the seat, slow but alive,
and written into four places the same day: the seat template, the settings
README, the handover, and entry 15 above as evidence.

The same evening, on the other machine, an echo seat (a thirty-line fake that
returns its own argv and stdin as its reply) was driven through the unchanged
script. The CLI had received `["-p","{prompt}","--output-format","json",
"--new-project"]` and nothing on stdin. The script substituted `{thread}`,
`{replyFile}`, `{cwd}` and `{sandbox}` into a seat's argv template and never
`{prompt}`. The seat had not been asked anything. Seventy-three thousand tokens
was agy trying to work out what eight characters meant.

The suite was green at 17 cases (the handover said 20; nobody had counted)
because the one envelope-shaped fixture said `promptVia: 'stdin'` while listing
`{prompt}` on argv, so the argv branch never ran under test. Fixed in `64871d5`
with three cases that were red first. After the fix a real review turn
completed in 2m25s for 78,198 tokens, every citation correct, and its own first
finding was two more gaps in the guard that had just fixed it (`738c872`).

**The lesson.** A failure that looks like the failure you expected is the most
dangerous evidence there is, because it asks no question. The prior was "agy is
slow"; a slow-looking timeout confirmed it; the mechanism was never checked.
The transport's honesty made it worse: it recorded faithfully THAT the seat did
not answer, and the reader supplied WHY from the prior. Entry 15 is about a
good number carried to the wrong question. This is a number from a run that
never happened, accepted as a measurement because the run failed the way the
prior said it would.

The cheapest check in the whole chain was the one not run. An echo seat costs
nothing, takes a minute to write, and settles "what did the seat receive" in
one run. It was written only after a reviewer asked the question the failure
had not.

**How to apply.** When a ride through a harness fails, the first question is
"what did the thing under test actually receive", not "why did it fail". Answer
it with an echo before attributing anything. For any transport that composes
input for another process, keep an echo seat beside the fakes and run it first.
When a fixture's config shape differs from the shipped one (stdin here, argv in
production), the suite is green about a different program. And when a failure
matches your prior, treat the match as the reason to check, never as the reason
to stop.

skill that should have prevented this: findings-are-evidence (its norm covers
"your own first-hand defect analysis", and the diagnosis of the timeout was
exactly that, written into durable artifacts without re-derivation) /
prove-it-can-fail (the envelope case could not fail on the argv path; asked
"what does this print if the argv branch is broken", the answer was "PASS").
one-real-ride ran and caught the failure, then the failure was misread, which
is outside what that skill checks.
class: a failure attributed to the component under test when the harness never
delivered the input; the failure matched the prior, so its mechanism went
unexamined. Sibling of 15 one axis over.
