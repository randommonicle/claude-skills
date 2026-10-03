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
