# WORKLOG

Checkpoint log per the `checkpoint-log` skill: one `##` heading per work unit, one entry per
commit, append-only.

## Team-loop stage 1 (branch `feat/team-loop-stage1`, opened 2026-10-03)

Goal: ship stage 1 of `docs/DESIGN_team-loop_2026-10-02.md` (section 4): the state layer, the
operator's Ask board, and effort pins, on a local branch. Nothing pushed, nothing merged to
`main`, on the operator's instruction of 2026-10-03 ("keep everything local, use checkpoints").

Authority: the operator said "lets move on" after the team-loop handover, read as yes to section
10 item 1 (stage 1). Items 2 to 5 are on the Ask board as ASK-0002 to ASK-0005, with the
design's recommendations as defaults where the work cannot wait.

Checklist:

- [x] Worktree `~/.claude/skills-wt-team-loop-s1` on `feat/team-loop-stage1` from `origin/main` f7de1a1
- [x] Ask board probe (design section 6, step 0): page published, items seeded, reads and writes observed, the operator answered all five from the page
- [x] Probe record `docs/PROBE_ask-board_2026-10-03.md`
- [x] `team-loop/SKILL.md`, `team-loop/templates/NOW.md`, `team-loop/templates/ASK.md`, `team-loop/ask-board.html`
- [x] `handover/SKILL.md`: routine notes land in `team/NOW.md`; dated file kept for unusual ends
- [x] `hooks/session-recon.mjs`: NOW.md check, with tests in `hooks/session-recon.test.mjs` that go red on a missing branch
- [x] Effort pins on `agents/code-reviewer.md` and `agents/property-reg-reviewer.md`
- [x] Index: README table row and the three count sites (`hooks/check-index.mjs` green)
- [x] `team/NOW.md` for this repo (dogfood)
- [ ] Cross-agent review of the stage 1 commits (GPT via codex on the code, GEMPRO via agy on the prose), then an attack-the-convergence pass
- [ ] Closing walk

### 2026-10-03 09:50Z: worktree and probe

The worktree first landed inside the live clone because `git -C <clone> worktree add <relative
path>` resolves the path against the `-C` directory; moved out with `git worktree move` before
any commit. The Ask board went up first because it is also the operator's channel for the day:
the operator is away, and phone push is disabled in this app's config ("Push not sent: mobile push is
disabled in /config"), so the board link went by email instead.

### Commit 1: the team-loop skill, its templates, the board page and the probe record

The skill carries design section 4 and the section 6 boundaries, rewritten around what the
probe found: a wrong collection name reads as an empty queue, so every read starts with the
`meta/status` sentinel; the store records no writer, so an answer stays steering only; and the
owner-only access rule replaces the design's "edit access is never shared" prose as the privacy
control. Admitted as a candidate leaf, since it comes from design review rather than the misses
log. README row and the three count sites moved to 47; `check-index` green.

### Commit 2: session-recon reads team/NOW.md

`nowLine` runs inside the existing repo branch of the hook, after the fetch, so remote branches
are current when it checks the `branches:` line. One message per state: not committed, level
with HEAD, N commits behind, or a count that failed. Branch names are checked with
`refs/heads/` and `refs/remotes/origin/` prefixes, so an entry such as `--all` can never reach
git as an option, and anything outside a plain branch-name pattern is reported missing. Eight
new cases; six went red against the hook at f7de1a1, and the two silence cases red against a
version that reports every branch. First draft of the junk-entry case expected `$(whoami)`
whole, but the parser cuts at `(` by design (for `name (worktree ...)`), so the fixture changed,
not the code.

### Commit 3: handover routes routine ends to NOW.md; effort pins; this repo's NOW.md

The handover skill keeps every step; Step 3 gains a paragraph for team-loop projects: a
routine end overwrites `team/NOW.md`, an unusual end (amber or red band, crash, machine move,
a scheduled run stopped by a usage limit) still writes the dated file. Both library agents pin
`effort: high` (field confirmed in the sub-agents documentation, 2026-10-03); `debugger` and
`refactorer` exist only in `~/.claude/agents` on this machine and were left alone, since that
directory is live for other sessions today. This repo's own `team/NOW.md` is the dogfood copy.

### Commit 4: cross-agent review round 1 fixes

Round 1 (GPT on the code, GEMPRO on the prose; GEMPRO's first turn ended empty on an
auto-denied command and was re-run with every command forbidden) returned ten claims. All ten
were re-derived against the files and held at least in part. Code: a dirty NOW.md read as
clean; up to 2N branch lookups at 6 s each could overrun the hook's 20 s budget, now one
`for-each-ref` listing so no entry reaches git; the template's own `branches:` placeholder
holds a comma inside parentheses, which split the entry; `origin/<name>` read as missing; and
a `team/ASK.md` queue was told "never report it empty", which is wrong for a file that is
empty when current. Page: a snapshot could wipe a form being filled in when another view
answered, and a rejected `use('db')` would leave the page silent. Prose: edit access must
still never be shared (an Editor can republish looser rules); the lifecycle lost the
operator's notes and had no delete point for a PR-comment record; the handover edit dropped
items 3 and 9, and its "amber is unusual" line meant a disciplined wrap-up would never update
NOW.md, so NOW.md is now written at every end and the dated file is the extra for unusual
ends. Five new hook cases, all red against 1c10fbd.

### Commit 5: cross-agent review round 2 fixes

Eight claims, all re-derived and held. Hook: `ask: .` passed `existsSync`, then
`readFileSync` threw `EISDIR` and the outer catch silenced the whole NOW report; a file queue
is now a relative `.md` path with no `..` segment, read in its own try. `feat/(legacy)` is a
valid branch name (`git check-ref-format` accepts it) that the note-stripping mangled; only a
note after whitespace is stripped now. Per-call git timeout down to 1.5 s, four calls, so the
NOW check adds at most 6 s; the hook's older fetch, status, log and `gh` calls are unchanged
and can still exceed 20 s together under slow conditions, noted, not fixed here. Page: the
`justSaved` flag could stick if no snapshot followed the save; replaced by a forced refresh
once the store confirms the write. Skill: a free note is always recorded (by its document id)
before deletion, an ASK.md deletion is committed, and a park with nothing unblocked writes
NOW.md before stopping. Three new hook cases, red against 6df27b1.

### Commit 6: the first Ask board answers, recorded

The operator answered ASK-0001 to ASK-0005 from the page at 09:58-09:59Z, which closes probe
item 2. ASK-0001 ("team-loop", note: "This one is correct") was steering, so it is recorded
here and not in DECISIONS.md. ASK-0002 to ASK-0005 are in DECISIONS.md under one dated entry
naming each item id. The board rows are deleted after this commit, per the skill's step 4.
This is the lifecycle's first real run.

### Commit 7: HOOKS.md describes the NOW.md check

A wiring step the first three commits missed: `hooks/HOOKS.md` is the hook catalogue and its
`session-recon` row did not mention the NOW.md check. Found while adding stage 2's shadowing
check, which needs the same row.

### Commit 8: round 3 stand-in findings (code-reviewer subagent)

GPT's seat was over its usage limit, so round 3's attack on the convergence ran as the
library's `code-reviewer` agent: sonnet, the hub's own vendor, so less independent than GPT,
and recorded as such. It blocked the convergence with five findings, all re-derived and held.
Page: a phone tap does not focus the button, so the store's echo of the pending write rebuilt
the card as "Answered" and a later rejection wrote its error to a detached node; in-flight
saves now hold the card, the error lives on the draft, and the strip does not count a pending
write. The empty state now checks the `meta/status` sentinel the skill already demanded, and
nothing renders until both items and answers are definitive. Hook: a failed git call read as
"not committed"; `%(refname:short)` turned branch `v1` into `heads/v1` beside a tag `v1`; a
failed fetch was reported as fact about origin; a NOW.md deleted and recreated read as
committed (now checked with `ls-tree HEAD`); and `ask:` dressing was refused. Six new hook
cases, all red against c22724b; the stand-in's stub-DOM repros (scratchpad `s1`, `s2`, `s2b`,
`s3`, `s4`) re-run green on the fixed page. Not fixed: the hook's older calls can still near
the 20 s limit on a slow machine; the comment no longer claims otherwise.

### Commit 9: GPT's round 3, three page findings (evening 2026-10-03)

GPT's own round 3, owed since the stand-in, ran at 17:2x BST (headless continuation). It held
the convergence open with three findings in `team-loop/ask-board.html`, each reproduced on a
stub DOM before fixing. An empty read arriving before `meta/status` said "No open decisions",
and a failed `meta/status` read did the same (its error callback was empty): the empty state
now waits while the sentinel is unread and says the status could not be read when it fails. A
changed answer, confirmed with no echo from the store, showed the old choice because `saved()`
only wrote the answer when none was held: the confirmed write is now always the shown answer.
Any edit mid-write re-enabled Send and the click had no in-flight guard, so two writes could
race: `sync()` keeps Send disabled while saving and the click returns early. New
`team-loop/ask-board.test.mjs` (stub DOM, stdlib only): 4 of 5 cases red against the parent
page, the control case green; all 5 green after. It runs nowhere in CI yet, a `FORWARD:` line
beside the run-seat one says so. Still unverified in a real browser.

### Commit 10: nowLine speaks when a committed NOW.md is deleted

GPT's first round on stage 2 (finding 5) reached stage 1 code: `nowLine` returned at once when
`team/NOW.md` was absent, so a resume board that HEAD tracks but the working copy had deleted
produced no line. It now asks `git ls-tree HEAD` and, when HEAD has the file, says it is
missing from the working copy and to restore it; a git failure stays silent (fail-open). New
case in `hooks/session-recon.test.mjs`, red before the fix; every `hooks/*.test.mjs` suite
green after.

### Commit 11: the review record, closed and copied to docs/

The stage 1 review closed at the round cap with a CLAUDE close section and a CLAUDE position
(GPT's three rounds used; every finding fixed or recorded). The record is copied from the
machine-local `exchange/` to `docs/REVIEW_team-loop-s1_2026-10-03.md` so it travels. Correction
to commit 9's entry: GPT's round 3 answered at about 17:20 BST, not "17:2x".

### Commit 12: a second GPT turn on the fixes (2026-10-04, overnight continuation)

A fresh GPT seat was told to assume the fixes 9839abb, 6f15d35 and (on stage 2) a7ecf0d were
broken (`exchange/REVIEW_team-loop-fixes_2026-10-04.md` in the stage 2 worktree). Two of its
five points are stage 1 code, both real, both fixed here with a case red first:
- The page set `meta = 'present'` from a cached snapshot, so empty server snapshots of items and
  answers read "No open decisions" on the strength of a cache. The sentinel now counts only from
  the server. `ask-board.test.mjs`'s stub takes `fromCache`; the new case was red on the parent.
- `nowLine` treated a directory at `team/NOW.md` as a file; `readFileSync` threw into the silent
  catch. A non-file now reads as missing. My first assertion matched the recon header's git
  status listing and passed on the unfixed code; tightened to the nowLine message, then red.
Every `hooks/*.test.mjs` suite and `ask-board.test.mjs` green after.

## Team-loop stage 2, plugin pieces (branch `feat/team-loop-stage2`, opened 2026-10-03)

Goal: the plugin side of `docs/DESIGN_team-loop_2026-10-02.md` section 5, inert until a project
opts in, on the operator's answer ASK-0003 ("build-now"). Stacked on `feat/team-loop-stage1`.
No project is touched: the pilot (ASK-0004, passive income) has live sessions and its setup is
ASK-0006.

Checklist:

- [x] Four `tl-` agents: `tools` without `Agent`, `model`, `effort`, `maxTurns`, `isolation: worktree` for builders
- [x] `maxTurns` paragraph in `commission-the-roster` (ASK-0005 item 3), placed in Traps, clear of open PR #3's hunk
- [x] Templates: `WP.md`, `BOARD.md`, `SPEC.md`, `gate.json`
- [x] `team-loop/scripts/gate.mjs` and `gate.test.mjs`; the suite added to CI
- [x] `session-recon` shadowing check, plugin layout only, with tests
- [x] The skill's stage 2 section, README rows, HOOKS.md
- [ ] Cross-agent review of the stage 2 commits
- [ ] Closing walk

### Commits 1 to 3: agents, templates and skill; the gate; the shadowing check

**Deviation from the design, pending ASK-0007:** `JUDGED BY` lines are commands judged by exit
code, not per-test ids read from JUnit results. The pilot repo has no per-test suite (its
proofs are Python evidence scripts and MT5 Tester runs, read-only survey 2026-10-03), and the
command form fits both. The design's "none skipped" check is carried by red-at-T instead: a
skipped check passes at T and fails check 2, and T's files cannot change afterwards (check 3).
The gate reads the brief, `gate.json` and the verdict file from the milestone branch's
committed tree, so a builder cannot edit what judges it, and keeps the tested merge at
`refs/team-loop/tested/<wp>` so it survives the scratch worktree's removal. All 17 gate cases
green on the first run, so each check was mutated off in turn: every mutation turned its case
red (check 1's case then failed at check 3, still red). The shadowing check reads the agent's
frontmatter `name`, not its file name, and runs only under `CLAUDE_PLUGIN_ROOT`, because on a
direct clone the tl- agents belong in the user's agents directory. The gate suite lives outside
the CI loop's `hooks/*.test.mjs` glob, so it is a named CI step (LESSONS 28); not yet run on
the runner, since nothing is pushed today.

### Commit 4: stage 2 review round 1 fixes (GEMPRO)

Eleven claims, all re-derived against the code and held. The three that mattered most: a
passing run's `refs/team-loop/tested/<wp>` survived a later failing run, so a lead could
fast-forward onto stale code (the ref is now deleted at the start of every run and written
only after check 5, which also closes a gap of my own: it was written before check 5); a
bold `**Regulated:** yes` read as unregulated and silently skipped the verdict check (a
missing or unreadable `regulated:` line now stops the gate); and SCOPE was never enforced
(every change outside the test, fixture and config globs must now match SCOPE). Also: tests
or fixtures added after T are refused, fixtures are a config key, only changed or removed
test scripts and added pre/post hooks are flagged, the verdict match tolerates bold and
tables, the scratch merge does not sign, and the brief parser accepts headings, bold and
bulleted lists and reports a malformed JUDGED BY line instead of dropping it. Skill text now
carries one-real-ride at step 8, the verdict file format and reviewer worktree isolation.
Ten new gate cases; nine red against f2140f9 (the pretest case cannot red against a gate that
flagged every key).

### Commit 5: stage 2 review round 2 fixes (GEMPRO)

Three claims, all held. A file T adds (a helper, a proof script outside the test globs) is now
exempt from SCOPE, since the lead reads T at step 5 and T's files are frozen afterwards;
without this the passive income pilot's proof scripts would fail an honest package. Field
detection requires the name, an optional parenthesised note, then a colon or line end, so a
heading such as "Scope of work" is no longer taken for SCOPE. A new script in `package.json`
still needs `package.json` in SCOPE: kept strict on purpose, and the builder is now told to
stop and ask. Two new cases, both red against aa43910.

### Commit 6: stage 2 review round 3 (GEMPRO, attack on the convergence)

Two claims. Held: the gate's scratch worktrees carry only committed files, so a check needing
gitignored local state (a venv, a data file) fails there; `gate.json` gains `copy`, a list of
repo-relative paths copied from the lead's checkout before setup, refusing any path that leaves
the repo. Partly held: a GUI program or a log-only compiler run through `cmd.exe` may return 0
at once; the gate already refuses that as hollow at T (safe), so the fix is documentation, a
command contract in the skill, not code. Not verified on this machine which way `cmd /c`
treats a GUI executable; the contract covers both. Three new cases, two red against f4fc1b6.
GPT's seat (codex) is over its usage limit until 14:42Z, so stage 2 has had one external
model; its round is owed.

### 2026-10-03 11:15Z: the stage 2 ride, opened

One real ride of the loop (`one-real-ride`) before any pilot: a throwaway local repo in the
session scratchpad, `ride-repo`, milestone branch `milestone/ride`, spec rev 1 and brief WP-001
(an unregulated `apportion()` in pence) committed before any spawn. The legal-skills fork was
the operator-recommended next unit but needs its upstream repo downloaded again (the 09-11
scratchpad clone is corrupt), and a download needs the operator's yes in a session, so it is
not started; ASK-0008 withdrawn, operator emailed.

Roster:

| # | Role | Model | Effort | maxTurns | Budget | Scope | Artifact | Fresh/resume |
|---|---|---|---|---|---|---|---|---|
| 1 | tl-builder contract, run as a general-purpose subagent | sonnet | the session's (no spawn-time effort) | none (not settable on a spawn) | ~60k | src/apportion.mjs | T, then the build | fresh, then resume |

Deviation, stated: the agent definition is not installed for this session (the library's
`agents/` on a local branch is not loaded), so the contract is handed over as a file to read
and the worktree is created by the agent with `git worktree add`, since this session's
directory is not a git repo and `isolation: worktree` needs one. The ride therefore proves the
contract and the gate, not the frontmatter loading or harness isolation (that was probed
2026-10-02, design 5.4).

### Commit 9: the ride, recorded; the tested merge gets a readable title

The ride passed end to end: a real sonnet builder kept to the contract (tests first, stop,
build on top of T, SCOPE only), the gate passed it and refused a copy with a weakened test,
and the fast-forward landed with the milestone suite green. Record:
`docs/RIDE_team-loop-stage2_2026-10-03.md`. One change from it: the gate's merge in a
detached scratch worktree was titled "Merge commit '<sha>' into HEAD"; it now names the
package, branch, sha and milestone, asserted in the honest-package case.

### Commit 10: ride 2 recorded; the gate prints why each check was red

Ride 2 (Python checks, `copy`, no package.json) passed honest and failed each negative at the
named check; the hub reran the honest gate and matched. Its one surprise: checks red at T for
an environmental reason satisfy check 2. The gate cannot judge reasons, so the command line now
prints each red check's reason for the lead; one new case, red against 370c2b7.

### Commit 11: ride 3's friction folded in

Ride 3 (regulated package, opus builder, property-reg-reviewer) passed first time; its friction
list is in the ride record. Changed: the red-reason line, the check 5 severity match, step 7
(the lead fixes their own spec), step 8 (fast-forward before committing the board), the two
builder contracts (no unstated behaviour) and the test writer's (throwaway mutants allowed
outside the repo). Two test expectations tightened, both red against 5b8454d. The answers to
ASK-0006 and ASK-0007 came in the session at 12:47 BST and are in DECISIONS.md (8036bad).

### Commit 12: GPT's first round on stage 2 (evening 2026-10-03)

GPT joined at CLAUDE round 4 (its section is headed "GPT round 1", its first turn) with six
findings, each re-derived against the code before fixing. Finding 5 was stage 1 code and landed
there (6f15d35, merged in as 8cf0d85). The other five, here, each with a case red before the fix:
1. An empty T passed when an older test was already red at T: check 2 alone held, and an empty
   T froze nothing. GPT called it Critical; re-derived as Medium, because the lead reads T at
   step 5. Check 3 now refuses a T that changes no files.
2. With a wide SCOPE a package could change `team/` (the brief, `gate.json`, a verdict). The run
   that judges it reads the milestone's copies, so the harm is to the next run once merged.
   Check 3 now refuses any `team/` change, and TESTS CHANGED cannot exempt one.
3. TESTS CHANGED exempted any path, production code included. The brief is the lead's, so this is
   a brief error rather than a builder bypass (GPT said High; re-derived as Low). The gate now
   stops as unrunnable on a TESTS CHANGED path that is no test, test config or fixture file.
4. `regulated (domain): yes` was found by the field rule but read as null, so the gate refused a
   valid brief (fails safe). The value now drops the optional note.
6. A quoted frontmatter name (`name: "tl-builder"`) evaded `shadowLine`. Quotes are now stripped.
Gate suite: the four new gate cases red with the parent `gate.mjs`, all cases green after; the
recon suite's new case red before, all green after. `agents/tl-builder.md`, the skill's gate
paragraph and the gate's header now name the `team/` rule and the TESTS CHANGED limit.

### Commit 13: the stage 2 review record, closed and copied to docs/

GPT's round and the CLAUDE close (with a CLAUDE position) appended to the machine-local record,
which is copied to `docs/REVIEW_team-loop-s2_2026-10-03.md`. Stage 1's closed record arrives by
the merge (462d3c7).

### Commit 14: a second GPT turn on the fixes (2026-10-04, overnight continuation)

A fresh GPT seat attacked a7ecf0d, 9839abb and 6f15d35 (`exchange/REVIEW_team-loop-fixes_2026-10-04.md`).
Five points, all real after re-derivation; the two on stage 1 code were fixed there (517a654)
and merged in (59f797e). The three on the gate, each with a case red before its fix:
- A T that changed only a README passed when an older test was already red at T. T must now
  change a test or fixture file, or a file a JUDGED BY command names.
- `git diff --name-status` C-quotes unusual names (`core.quotePath`), so a quoted
  `"team/\303\251t\303\251.md"` slipped past the `team/` prefix test. Every path git hands the
  gate is now read with `-z`.
- A catch-all glob in `gate.json` (`fixtures: ["**"]`) let TESTS CHANGED name production code.
  A glob matching a probe path no project has now stops the gate as unrunnable.
Rebutted: a `Team/` case variant. On a case-insensitive checkout git keeps the existing
directory's case; on a case-sensitive one `Team/` is not the lead's directory.

**Found while updating the doc sites, not by the seat:** a7ecf0d's `team/` rule refused the
pilot's own checks, since the passive income `team/gate.json` (4713ff9) puts tests in
`team/checks/**`; every pilot package would have failed check 3. Ride 2 used the pilot's shape
but ran before a7ecf0d. A pilot-shaped case was red; a check T adds under `team/` that a tests or
fixture glob matches is now allowed, never `team/gate.json` or `team/packages/`. That guard was
mutated off once and its case went red. Gate, recon and board suites green; check-index 47.

### Commit 15: GPT's round 2 on 1a98f9d

Two of its three open points were real and are fixed, each case red first: the JUDGED BY word
match counted any word, so a T adding a file literally named `node` passed as a tests commit;
and `./proofs/check.mjs` in a command did not match the git path `proofs/check.mjs`, falsely
refusing a real proof script. Only path-like words (a slash or an extension) count now, with a
leading `./` dropped. Its third point, a broad but not catch-all glob such as
`testConfig: ["src/**"]` letting TESTS CHANGED name production code, stands as an accepted
Low: it needs the lead to write both the glob and the brief line, and the gate cannot tell a
wrong glob from a right one. GPT conceded the `team/` exception, the `-z` parsing and both
stage 1 fixes. Gate suite green.

### Commit 17: ride 4, two packages at once on the pilot's own gate.json (2026-10-04)

Recorded in `docs/RIDE_team-loop-stage2_2026-10-03.md`, "Ride 4". Two builders on sonnet ran at
once with disjoint SCOPE in a throwaway repo carrying the pilot's `team/gate.json` byte for byte;
Ask steps 2 and 9 ran in the file form with stand-in answers. a7ecf0d's gate refused the first
package on the pilot shape ("team/checks/wp001_spread.py (A)"), confirming the regression fixed
in 1a98f9d; the current gate passed both. The second package's stale fast-forward was refused
after the first merged, and a re-gate on the moved milestone fixed it. The skill's Concurrency
paragraph now says so, and that an empty `suite` leaves the first package's checks un-run on
the combined tree.

### Commit 18: overnight close (2026-10-04)

ASK-0009 written to the board (`items/ASK-0009`, version 1) and read back: three candidate
first-milestone topics for the passive income pilot, drawn read-only from that repo's
`team/NOW.md` on `team-loop/pilot-setup` and its HANDOVER.md section of 2026-10-04. ASK-0008
was used and withdrawn on 2026-10-03, so 0009. The handover's "Update, overnight 2026-10-04"
and `team/NOW.md` record the night; `node hooks/session-recon.test.mjs` and check-index green.

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

**Cross-family review, 2026-10-04 (overnight continuation, from 03:26 BST).** Exchange record
`exchange/REVIEW_legal-fork_2026-10-04.md` (gitignored; copied to `docs/` on close). Seats run
with `run-seat.mjs` from `fix/run-seat-double-end` (28d5dac), `--cwd` this worktree: GEMPRO
(agy) on the four SKILL.md files, GPT (codex) on the tables, the three references, the count
sites, NOTICE and the UPSTREAM files. There are no scripts in the fork, so GPT's "scripts" share
of the brief was empty. Grounding read first as `/data.xml`: LFRA 2024 ss.53, 55, 61 still
`Status="Prospective"`, and the only commencement instruments listed are Nos. 1 to 3 (to
Feb 2025), which closes the evening note's open question for now; the Building Safety (Wales)
Act 2026 s.74 prospectively inserts LTA 1987 s.47B (demand content, Wales), not named before.

Round 1: GEMPRO 12 points, GPT 4 (provenance and counts clean). Each re-derived against the
files; statutory ones against the XML. Accepted and fixed here: the register's result line
could not add up when a right's derived duty also went to the register (the duty is now its
own extracted item, and the output carries the extraction list); the notice result line
printed parts its mode has no table for, and a cut consequence vanished from it; the citation
audit's discards were unlisted, so "Extracted = Table rows" held trivially; the worked
examples did not say they are no retrieval; s.167's £500 ceiling read as the test, so the
operative £350 and three years are named from SI 2004/3086 reg 2 and SI 2005/1352 reg 2 (GEMPRO
cited "SI 2004/3096"; the figure was right, the number wrong); "blocking input" with an escape
clause; a missing route to verified-citations; R2's deadline cell did not quote s.21B(1), R1's
lacked its counting convention; three upstream terms were unmapped and the lease reference's
"in place of" could be read to displace the interaction check; "from memory" in contract-review
clashed with its own verification list; side-first now asks only when the request names no
party; s.47B named. Rebutted: the interaction check's denominator comes from the table by
design (quick review covers the 10 to 15 most material rows, so coverage is the mode's choice);
"law 0 moved" is a count of moves, not a state that hides one; the two status vocabularies
belong to different tables; verified-citations already owns statutory day counting in its body
(`verified-citations/SKILL.md:109-117`) and the legal skills route to it by name.

Gates after: check-index "ok: 50 skills, all indexed, all named, all three counts agree";
check-archives "ok: 5 archives, 17 members". The unslop scan does not reproduce the evening
note's "high 0 medium 0 low 0": at 6c9845b, before any change today, it reports medium hits in
three of the four files, every one a route arrow read as an emoji (the library's route style).
The one new hit my edits added (a bold lead-in) is removed.

Round 2 (33237c1 under attack). GEMPRO's first round 2 turn ended empty: my ask allowed `git
show`, agy denied it, and the turn was lost (the recorded trap: forbid every command). Rerun with
no commands; it conceded the three rebuttals and wrote `[[CONVERGED]]`. GPT conceded the
arithmetic, mode and mapping fixes and held one point: the notice examples were barred only from
basis cells, so a statutory period could still be copied into a deadline row. Real; the
deadline table's source column and the examples' warning now both require the provision read
this session. property-reg-reviewer on the round 1 diff read every changed statutory line as
`/data.xml`: 0 Critical, 0 High, 4 Low, all taken: R1's counting cell names the convention
applied rather than stating law; open verification rows go above a draft demand; s.47B quoted
with its limb ("premises in Wales which consist of or include a dwelling in a regulated
building", read from asc/2026/5 s.74 myself); the draft result line prints `asked | kept | cut`
so a dropped consequence cannot leave it green. Its note outside the diff, for Ben:
`verified-citations/SKILL.md:116` states inclusive counting without an authority. Gates green
after; scan medium hits are route arrows only.

Attack on the convergence (GPTX, a fresh GPT seat briefed with the converged position). It
conceded the earlier fixes and broke two points, both real: the citation audit's four result
counts were never required to add up to the table rows, so a table with unresolved rows could
print clean; and the lease reference's "risk-allocation prose" exists only in a full audit, so
a default quick lease review had to drop it or widen its mode. A red line for the sum, and the
mapping now sends those findings to the issues table outside a full audit. No statutory text
changed. Gates green after.

Second property-reg-reviewer pass, scoped to `33237c1..384c936`: approve, 0 Critical, 0 High,
0 Medium; s.47B's limb re-read exact from asc/2026/5 s.74. Three Lows, all taken: "open rows
above the draft" moves into supporting rule 4 so it covers every formal requirement, not only
the service-charge bullet; the draft consequence part uses commas, so the line keeps one part
per table; the examples' header says "unless another date is given", since s.74 was read
2026-10-04. Not checked by the reviewer or me: the Welsh Act's definition of "regulated
building". Gates green.

**Merged to main, 2026-10-04 (Ben's in-session "Yes to all", then his picks: four PRs, merged
in order once CI is green).** #7 run-seat fix (220d8cf), #8 stage 1 (5bf2ed7), #9 stage 2
(cd50e14), each with archives, hooks, hooks-windows and index passing. origin/main then merged
into this branch (4e4b30c): the rehearsed four conflicts plus DECISIONS.md (this branch's entry
against stage 2's two; both kept, team loop first), WORKLOG titled once. check-index "ok: 51
skills"; check-archives ok; all 26 suites green. `team/NOW.md` updated for main.
