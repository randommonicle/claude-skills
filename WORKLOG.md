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
