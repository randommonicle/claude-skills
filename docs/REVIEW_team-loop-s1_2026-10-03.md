# Review: team-loop stage 1, as built

- **Target:** the three commits d2c74c7, 1c10fbd, 51ed6ef on branch `feat/team-loop-stage1` (worktree root is your working directory)
- **Mode:** challenger-external: assume it is broken and find where
- **Repo:** claude-skills (READ ONLY during this debate)
- **Date opened:** 2026-10-03
- **Seats in play:** CLAUDE (hub), GPT (codex), GEMPRO (agy)
- **Round cap:** 3 each
- **Stop:** `[[CONVERGED]]` on agreement; a `[[POSITION - <HANDLE>]]` paragraph each at the cap.

Protocol: `exchange/PROTOCOL.md`. Append-only. Cite `path:line`. Concede on evidence.
End every section with `[[END <HANDLE> round N]]` on its own last line.

---

## [CLAUDE round 1]

**Framing.** Stage 1 of `docs/DESIGN_team-loop_2026-10-02.md` (section 4, with section 6's board
boundaries) is now built and committed. An approval is worth nothing here; a reproducible defect
with `path:line` is worth everything. If your area is genuinely clean, say so in one line rather
than manufacture a finding. Keep your section under 3,500 characters: this file is a shared
budget.

**Evidence already gathered.**
- `node hooks/session-recon.test.mjs`: all cases pass; six of the eight new NOW.md cases fail
  against the hook at f7de1a1 (the other two are silence cases).
- `node hooks/check-index.mjs`: "47 skills, all indexed, all named, all three counts agree".
- The Ask board probe, `docs/PROBE_ask-board_2026-10-03.md`: a wrong collection name reads as
  an empty list; the store records no writer; a scheduled desktop session stalled on a write
  outside its folder.

**Provisional verdict.** Sound enough to use for the two-week trial; medium confidence on the
page script, which no test exercises.

**Assignments. Read only the files named; do not search the repo.**

GPT, the code:
1. `hooks/session-recon.mjs:136-190` (`nowLine`) and its call at `:230`. Attack: a NOW.md
   state that yields a false "level with HEAD" or a false "do not exist"; any way an entry
   reaches git as an option or a revision expression; anything that throws past the fail-open
   catch or blocks the hook past its 20 s budget.
2. `hooks/session-recon.test.mjs:387-472`. Attack: a case that cannot go red for the reason
   its name gives.
3. `team-loop/ask-board.html:85-288` (the script). Attack: a state where a failed or partial read renders
   as "No open decisions"; an answer the operator typed that a snapshot wipes; a write the page
   reports "Saved." that did not happen.

GEMPRO, the prose:
1. `team-loop/SKILL.md` (whole) against `docs/DESIGN_team-loop_2026-10-02.md:153-186` and
   `:411-433`. Attack: a design rule or boundary that the skill dropped or weakened, and a
   lifecycle step (ask, read, record, delete) that loses or duplicates an answer.
2. `handover/SKILL.md:64-77`. Attack: a duty of the handover skill that a team-loop project now
   skips, or an end condition that falls between "routine" and "unusual".
3. `team-loop/templates/NOW.md` and `team-loop/templates/ASK.md`. Attack: a line the
   session-recon parser (`hooks/session-recon.mjs:167-185`, the `branches:` and `ask:` regexes)
   will misread when filled in as the template invites.

NEXT: ALL

[[END CLAUDE round 1]]

> **[transport] GEMPRO round 1 did not complete** - a tool permission was auto-denied (RunCommand).
> Tokens spent: in=102431 out=2334 cache_read=138589 thinking=1483. This seat has NOT answered round 1.
<!-- transport-failure: seat: GEMPRO | round: 1 | thread: e207d193-84ce-4cb7-b561-afcd07daab53 | usage: in=102431 out=2334 cache_read=138589 thinking=1483 -->

## [GPT round 1]

The `NOW.md` check has a stale-file defect. It reads the current working-tree file at `hooks/session-recon.mjs:149`, but derives its commit and “level with HEAD” result only from `git log` at `:151-165`. If a tracked `team/NOW.md` is edited after its last commit, it can report “level with HEAD” while surfacing uncommitted branches or asks. The test at `hooks/session-recon.test.mjs:429-433` covers only an untracked file, not this tracked-dirty case.

The hook can also exceed the stated 20-second budget. Each `run` may block for six seconds at `hooks/session-recon.mjs:197-200`; `nowLine` can invoke the log, rev-list, and two branch lookups at `:151-176`, while the caller already performs fetch, status, log, and `gh` calls at `:221-230`. There is no aggregate deadline.

The branch argument handling itself appears safe: invalid names fail the `BRANCH` test and all accepted names are prefixed with `refs/heads/` or `refs/remotes/origin/` before being passed as argv, at `hooks/session-recon.mjs:173-176`. However, the test named “never run as an option” does not test that property. It only inspects the resulting warning at `hooks/session-recon.test.mjs:454-460`; it spies neither on subprocess arguments nor on execution. A mutant could still pass while invoking the lookup.

The ask-board draft protection is incomplete. A fresh draft has `editing: false` at `team-loop/ask-board.html:134-136`. If an answer snapshot arrives for that item while the operator is typing, the preservation guard at `:230-231` is skipped because `answer` is now truthy. `buildCard` then renders the stored answer instead of the draft at `:149-162`, replacing the active node at `:225-234`. The operator’s unsaved selection or note disappears from the visible form.

There is also an initialisation failure hole: `await c.use('db')` is outside the `try` at `team-loop/ask-board.html:265-270`. If it rejects, `boot()` terminates without setting `failed` or rendering the explicit unreadable-queue state.

[[END GPT round 1]]

[[END GPT round 1]]
<!-- seat: GPT | thread: 01a10131-e552-7fe3-a4bd-b869b2ec0ef8 | grounding: repo-read | seat_turns: - | file_turns: 1 | usage: in=186004 out=5799 cached_input=150016 -->

## [GEMPRO round 1]

### 1. `team-loop/SKILL.md` vs `docs/DESIGN_team-loop_2026-10-02.md:153-186, 411-433`

**Weakened boundaries and dropped rules:**
- **Ask board edit access:** `docs/DESIGN_team-loop_2026-10-02.md:423-424` established an explicit operational boundary: *"Private, and kept private. Edit access is never shared: anyone who can write rows can write answers."* `team-loop/SKILL.md:58-60` dropped this rule, weakening it to a claim that the db owner rule prevents leaks on mistaken share. It ignores that anyone granted edit access on claude.ai can write answers indistinguishable from the operator (`DESIGN:419-421`, `SKILL.md:77-79`).
- **Dropped agent roster & effort pins:** `DESIGN:179-182` explicitly mandated effort pins on existing agents (`code-reviewer`, `debugger`, `refactorer`, `property-reg-reviewer`, PropOS `backend`, `frontend`, `test`) and required PropOS `backend` to move to the strong tier or split. `SKILL.md:89-95` dropped this concrete roster and PropOS requirement, degrading it to generic guidance ("Reviewers pin `high` or above").
- **Dropped Rule 1 spend constraint:** `DESIGN:417-418` mandated that nothing on the board releases spend and *"the milestone roster's yes (Rule 1) is given in the session"*. `SKILL.md:81-83, 101` omitted the explicit Rule 1 milestone roster gate.

**Lifecycle defects (duplicated / lost answers):**
- **Build review answers duplicate on crash or fail to delete:** In stage 1, build reviews go *"on the PR"* (`SKILL.md:49-50`). PR comments are GitHub API calls, not local git commits. Yet Step 4 (`SKILL.md:52-53`) mandates: *"Delete only after the commit exists (`verify-the-effect`)"*. Because no commit exists, the item cannot be deleted. If a session crashes after posting to the PR, Step 3 (`SKILL.md:50-51`) says: *"Before writing, grep the repo for the item id"*. Because the PR comment is remote, `grep` finds nothing in the repo, causing the next session to post a **duplicate review comment** to the PR.
- **Operator notes permanently lost:** The board schema defines a `notes` collection (`SKILL.md:66`) and answers include a `note` field (`SKILL.md:65`). But the lifecycle in `SKILL.md:43-54` defines no read, record, or delete steps for `notes`, and Step 3 records only the item ID into `DECISIONS.md`. When Step 4 deletes the answer document, the operator's explanatory notes are **permanently lost**.

### 2. `handover/SKILL.md:64-77`

- **Skipped duties:** `handover/SKILL.md:42-43` requires recording Item 3 (*"What landed. Commits and PRs with sha... Mark each as verified or unverified"*), and `:56-58` requires confidence markers on causal claims. `DESIGN:162` promised *"The handover skill keeps every duty"*. Yet `handover/SKILL.md:68-71` restricts routine `NOW.md` updates to *"items 2, 4, 5, 6 and 8"*. Item 3 is omitted (`templates/NOW.md` has no section for landed work). Git log records shas, but not PR mappings or verified/unverified status. That verification record is permanently dropped. Furthermore, `handover/SKILL.md:70` omits Item 9 (`Traps`), dropping unpromoted session gotchas despite `templates/NOW.md:22-25` reserving a section for them.
- **The Amber Context Paradox:** `handover/SKILL.md:8, 12` dictates: *"At amber, take no new work units. At red, stop and hand over."* Wrapping up at amber is the standard, disciplined end of a working session. Yet `handover/SKILL.md:72-74` classifies *"context in the amber or red band"* as an **unusual end** requiring a dated `HANDOVER_*` file. Under this rule, a disciplined session ending at its amber limit can *never* have a "routine" end updating `NOW.md`, defeating stage 1's goal of replacing dated handovers with `NOW.md`.

### 3. `team-loop/templates/NOW.md`, `ASK.md`, and `hooks/session-recon.mjs:167-185`

- **Parenthetical commas break `branches:` parser:** `templates/NOW.md:7` invites: `branches: <branch> (<worktree path, if not the main checkout>), <branch>`. In `hooks/session-recon.mjs:170`, `branches[1].split(',')` splits naively without paren-matching. If a note contains a comma (e.g. `branches: feat/a (worktree at ../wt, clean), main`), it splits on `,`, yielding `clean)` as a branch name (`:171`). Because `)` fails `BRANCH.test()` (`:142, 174`), `session-recon` falsely warns: `Branches NOW.md names that do not exist here, locally or on origin: clean).` (`:179`).
- **Remote branch false alarms:** If an operator writes `branches: origin/feat-1`, `hooks/session-recon.mjs:175-176` prepends `refs/remotes/origin/`, testing `refs/remotes/origin/origin/feat-1`, falsely reporting a valid remote branch as non-existent.
- **Empty `team/ASK.md` flagged as broken:** `templates/NOW.md:8` invites `ask: <the Ask board link, or team/ASK.md>`. When set to `team/ASK.md`, `hooks/session-recon.mjs:181-185` unconditionally emits: *"never report it empty"*. Under `templates/ASK.md:6`, answered items are deleted once committed, so an up-to-date queue is naturally empty. Conflating the database read-failure guard (`DESIGN:429-431`) with a local file queue instructs the agent to treat an empty `team/ASK.md` as broken and prompt the operator unnecessarily.

[[END GEMPRO round 1]]
<!-- seat: GEMPRO | thread: e96d64f6-30f2-4df3-9295-1e5148e2fc56 | grounding: repo-read | seat_turns: 1 | file_turns: 1 | usage: in=63610 out=39881 cache_read=260911 thinking=37446 -->

## [CLAUDE round 2]

**Verified and conceded, all ten.** Each claim was re-read against the file and held at least in
part. Fixed in commit 6df27b1; `node hooks/session-recon.test.mjs` all green, and the five new
cases (`hooks/session-recon.test.mjs:478-532`) fail against 1c10fbd.

- GPT 1 (dirty NOW.md read as clean): `git status --porcelain` on it, `hooks/session-recon.mjs:146-172`.
- GPT 2 (budget) and 3 (test name): one `for-each-ref` listing at `:175`, set lookups only, so no
  entry reaches git and the hook makes at most five git calls at 3 s each. Test renamed.
- GPT 4 (draft wiped) and 5 (`use` outside try): `team-loop/ask-board.html:232` and `:271`.
- GEMPRO 1 (edit access, effort roster, Rule 1, PR-comment delete point, notes lost):
  `team-loop/SKILL.md:51-63`, `:68`, `:103-108`. Partial on the roster: the skill states the
  rule, and the outstanding agents (debugger, refactorer, PropOS backend, frontend, test) are
  listed in `team/NOW.md`, since they are pinned through their own machine or project.
- GEMPRO 2 (items 3 and 9 dropped; amber paradox): `handover/SKILL.md:68-76` now writes NOW.md
  at every end and adds the dated note only for unusual ends; amber is routine.
- GEMPRO 3 (parser): notes stripped before the split; `origin/<name>` accepted; a `team/ASK.md`
  queue is counted, never given the board's rule.

**Round 2 assignment: attack the fixes, not the prose around them.** Same files only, no
searching, GEMPRO runs no commands. Under 2,500 characters each.

GPT: `hooks/session-recon.mjs:136-206` and `team-loop/ask-board.html:225-240`. Find a NOW.md
or `ask:` value that now misreports, a path the `ask:` read can be pointed at that it should
not, or a sequence in which the page's `justSaved` flag sticks and freezes a card.

GEMPRO: `team-loop/SKILL.md:14-63` and `handover/SKILL.md:64-77`. Find a lifecycle path that
still loses or duplicates a record, or an end condition that writes neither NOW.md nor the
dated note.

If the fixes hold, say `[[CONVERGED]]` with one line on why.

NEXT: ALL

[[END CLAUDE round 2]]

## [GPT round 2]

Two defects remain. The earlier draft-wipe fix holds for an active unsaved form because `filling` now covers both unanswered and editing states at `team-loop/ask-board.html:230-234`.

The local `ask:` path is not confined to the checkout or `team/`. `ask: ../../outside/ASK.md` is expanded through `join(cwd, ...where.split('/'))` at `hooks/session-recon.mjs:189-200`, so it can read and count headings from outside the repository. Worse, `ask: .` passes `existsSync`, then `readFileSync` attempts to read the checkout directory, throws `EISDIR`, and the outer catch suppresses the entire NOW result at `:204-205`. A direct Node query here returned `EISDIR` for `readFileSync(process.cwd())`.

Parenthesis stripping still creates a false missing-branch warning. The parser removes every parenthesised segment before lookup at `hooks/session-recon.mjs:180-184`. `feat/(legacy)` is a valid Git ref, confirmed by `git check-ref-format 'refs/heads/feat/(legacy)'` returning success, but it is transformed to `feat/` and reported missing.

The aggregate hook timeout is still uncapped. The revised `nowLine` bounds its calls to three seconds at `hooks/session-recon.mjs:144-159, 175`, but the caller can already spend up to eight seconds on fetch, six on status, six on log, and eight on `gh` at `:214-217, 238-247`. There is no whole-hook deadline, so the stated 20-second budget can still be exceeded under slow-command conditions.

`justSaved` can remain set after a successful write if the answers listener delivers no further snapshot: the save sets it and leaves the send button disabled at `team-loop/ask-board.html:198-203`, while the reset at `:234` is bypassed by the unchanged-card early return at `:229`. Input events can re-enable the button, so I count this as stale UI state rather than a permanent freeze.

[[END GPT round 2]]

[[END GPT round 2]]
<!-- seat: GPT | thread: 01a10131-e552-7fe3-a4bd-b869b2ec0ef8 | grounding: repo-read | seat_turns: - | file_turns: 2 | usage: in=482053 out=11727 cached_input=429056 -->

## [GEMPRO round 2]

### 1. Lifecycle defects: duplicate and lost records (`team-loop/SKILL.md:51-61`)

- **Free notes duplicate on crash:** Step 3's idempotency guard (`SKILL.md:55-57`) states: *"Before writing, look for the item id where the record would land... so a crash between record and delete costs a delete next time, never a second entry."* But free notes are explicitly *"not tied to an item"* (`SKILL.md:75`) and have no item ID. If a session records a note to `DECISIONS.md` or `NOW.md` (`SKILL.md:53-54`) and crashes before Step 4 deletes it (`SKILL.md:60-61`), the resuming session has no item ID to search for, finds nothing, and writes a **duplicate record**.
- **Actioned free notes trapped or lost:** Step 3 permits a note to be *"acted on or recorded where it belongs"* (`SKILL.md:53-54`), but Step 4 permits deletion only *"once it is recorded"* (`SKILL.md:60-61`). If an operator note gives an instruction (e.g. drop a branch, re-run smokes) that is *acted on* without being written to a file, Step 4 provides no deletion gate. If deleted without a recorded commit and the session crashes mid-action, the instruction is **permanently lost**; if left undeleted, it re-executes on every resume.
- **Uncommitted deletion of reviews in `team/ASK.md`:** For build reviews in regulated projects (`SKILL.md:41`), the record is a remote PR comment (`SKILL.md:52-53`). In Step 4 (`SKILL.md:58-61`), the lead deletes the item's section in `team/ASK.md` after reading back the PR comment. Unlike decisions (which require a commit), Step 4 mandates no commit for `team/ASK.md`. The deletion remains dirty in the working tree and reverts on stash, reset, or fresh checkout.

### 2. End conditions writing neither `NOW.md` nor dated note (`handover/SKILL.md:10-15, 68-76`, `team-loop/SKILL.md:21-25, 47-48`)

- **Parking on an Ask item in green/yellow context:** In `team-loop/SKILL.md:47-48`, Step 1 dictates: *"Then park the work it blocks. The lead never builds past an open decision."* When work blocks early in a session, the lead halts. `team-loop/SKILL.md:21` delegates writing `NOW.md` entirely to handover (*"The handover skill writes it at every session end"*). But `handover/SKILL.md:10-15` triggers *only* when context reaches amber/red, the user explicitly says "wrap up", or a "long session is ending deliberately". Halting mid-task to park work on an Ask item meets none of these triggers. Handover never fires, `team-loop` has no independent write, and the session halts with **neither `NOW.md` updated nor a dated note written**.

[[END GEMPRO round 2]]
<!-- seat: GEMPRO | thread: e96d64f6-30f2-4df3-9295-1e5148e2fc56 | grounding: repo-read | seat_turns: 2 | file_turns: 2 | usage: in=327245 out=56268 cache_read=260911 thinking=52924 -->

## [CLAUDE round 3]

**Round 2: verified and conceded, all eight.** Fixed in b83344e; three new cases fail against
6df27b1. `ask:` file paths must match a relative `.md` pattern with no `..` segment and are read
in their own try (`hooks/session-recon.mjs:144-215`); only a note after whitespace is stripped,
so `feat/(legacy)` is found; per-call timeout 1.5 s. The hook's older fetch, status, log and
`gh` calls can still exceed 20 s together under slow conditions: pre-existing, recorded, not
fixed in this unit. Page: the form closes by a forced refresh after a confirmed write, no flag
(`team-loop/ask-board.html:199-212`, `:229-233`). Skill: notes recorded by id, ASK.md deletions
committed, a park writes NOW.md (`team-loop/SKILL.md:45-66`).

**Round 3 is an attack on the convergence.** The position all three seats now hold is:
"stage 1 at b83344e is sound enough for a two-week trial". Assume that is wrong and find the
one thing that makes it wrong in practice: the first real session that resumes from a NOW.md,
or records a board answer, or ends on a park. A reproducible defect with `path:line`, or say
`[[CONVERGED]]` with one line on why. Same files as before, no searching, GEMPRO runs no
commands. Under 2,000 characters each. This is the last round.

NEXT: ALL

[[END CLAUDE round 3]]

> **[transport] GPT round 3 did not complete** - the CLI reported a failure: You’ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at 3:42 PM.
> Tokens spent: in=? out=?. This seat has NOT answered round 3.
<!-- transport-failure: seat: GPT | round: 3 | thread: 01a10131-e552-7fe3-a4bd-b869b2ec0ef8 | usage: in=? out=? -->

## [GEMPRO round 3]

The fixes in `b83344e` hold across all three examined paths:

1. **Park-and-stop lifecycle:** `team-loop/SKILL.md:48-50` closes the green-band parked gap by mandating that parking on an open item overwrites `NOW.md` with `next:` referencing the open item ID before halting, treating a park as a standard session end.
2. **Free note deduplication & record:** `team-loop/SKILL.md:55-64` closes both the duplication and dangling-note holes by citing the note's document ID, requiring persistent recording in `DECISIONS.md`, `NOW.md`, or the worklog, and gating deletion behind verification of the recording commit.
3. **Regulated review deletion:** `team-loop/SKILL.md:63-65` explicitly requires `team/ASK.md` item deletions to be committed, preventing uncommitted deletions from reverting across checkouts.
4. **Handover duty parity:** `team-loop/templates/NOW.md:10-12` adds `## Landed since the last NOW.md` with explicit verification status, and `handover/SKILL.md:68-76` cleanly maps all nine handover items without dropping verification markers or session traps.

Stage 1 is sound for the two-week trial.

[[CONVERGED]]

[[POSITION - GEMPRO]]
The prose layer across `team-loop/SKILL.md`, `handover/SKILL.md`, and `team-loop/templates/NOW.md` now completely specifies an idempotent, lossless state lifecycle: every session end (routine, parked, or amber) updates `NOW.md`, all nine handover duties are accounted for without data loss, and all Ask queue operations (decisions, build reviews, and operator notes) require verified commits or remote reads before item removal.

[[END GEMPRO round 3]]
<!-- seat: GEMPRO | thread: e96d64f6-30f2-4df3-9295-1e5148e2fc56 | grounding: repo-read | seat_turns: 3 | file_turns: 3 | usage: in=363744 out=59734 cache_read=691767 thinking=55698 -->

## [STANDIN round 3]

Recorded by the hub. GPT's seat was over its codex usage limit (it named 3:42 PM), so round 3's
attack on the convergence was run by the library's `code-reviewer` agent as a stand-in:
**sonnet, the same vendor as the hub**, so less independent than GPT would have been. GPT's
own round 3 is still owed and is scheduled after its reset. Verdict: block. Five findings,
each re-derived by the hub and fixed in 041959a with tests red against c22724b:

1. `team-loop/ask-board.html`: the store's echo of a pending write rebuilt the card as
   "Answered" when focus was outside the card (a phone tap does not focus a button), and a
   rejected write's message went to a detached node. Reproduced on a stub DOM.
2. `team-loop/ask-board.html`: an empty read with no `meta/status` showed "No open decisions",
   against the skill's own sentinel rule.
3. `hooks/session-recon.mjs`: a failed `git log` (null) read as "not committed".
4. `hooks/session-recon.mjs`: `%(refname:short)` gives `heads/v1` beside a tag `v1`; a failed
   fetch was reported as fact about origin.
5. `hooks/session-recon.mjs`: `ask:` dressing refused; a deleted-then-recreated NOW.md read as
   committed.

Non-blocking, also fixed: cards rendered before answers were definitive. Not fixed: the
hook's older calls can near its 20 s limit on a slow machine (comment corrected).

[[END STANDIN round 3]]
<!-- seat: STANDIN (code-reviewer subagent, sonnet) | usage: subagent_tokens=78175 tool_uses=21 duration_ms=2651589 -->

## [GPT round 3]

Not converged. The sentinel fix still has a pending-read hole. `meta` starts as `'unread'` at `team-loop/ask-board.html:93-95`, but `renderState()` treats every state other than `'absent'` as permission to say “No open decisions” once both collections are definitive at `:132-145`. Therefore, if authoritative empty `items` and `answers` snapshots arrive before `meta/status`, the page reports an empty queue while the sentinel is still unread. If the status read fails, its error callback is deliberately empty at `:308-315`, producing the same result. This is precisely a partial or failed read misreported as empty.

There is also a confirmed-answer display defect. After changing an existing answer, `saved()` only updates `answers` when the item is absent at `team-loop/ask-board.html:217-221`. Since an existing answer is present, the forced refresh renders the old answer through `buildCard`’s `answer && !d.editing` branch at `:162-175`. The store write may succeed and the page has no error, yet the operator sees the previous choice.

Finally, the page permits concurrent writes. The in-flight handler sets `d.saving` and disables the button at `team-loop/ask-board.html:211-218`, but any textarea or radio change calls `sync()`, which unconditionally re-enables it at `:187, 197, 203-207`. The click handler has no `d.saving` guard at `:208-224`. Two rapid writes can therefore race, while the first forced refresh may close the form before the second completes.

[[END GPT round 3]]

[[END GPT round 3]]
<!-- seat: GPT | thread: 01a10131-e552-7fe3-a4bd-b869b2ec0ef8 | grounding: repo-read | seat_turns: - | file_turns: 3 | usage: in=917422 out=16323 cached_input=790016 -->

## [CLAUDE close]

Written 17:38 BST by a headless continuation of the hub session. GPT's own round 3 (above)
answered at about 17:20 BST; the stand-in's round 3 stays on the record as the less independent
of the two.

**All three of GPT's round 3 findings verified and conceded**, each reproduced on a stub DOM
before fixing, fixed in 9839abb on `feat/team-loop-stage1`:
1. `team-loop/ask-board.html`: empty items and answers arriving before `meta/status`, or with
   its read failed, said "No open decisions". The empty state now waits while the sentinel is
   unread and names a failed status read.
2. A changed answer confirmed without a store echo showed the old choice: `saved()` now always
   records the confirmed write.
3. An edit mid-write re-armed Send and the click had no in-flight guard: Send stays disabled
   while saving and the click returns early.
New `team-loop/ask-board.test.mjs` (5 cases): 4 red against the parent page, the control case
green; all 5 green after. It runs nowhere in CI yet (a `FORWARD:` line in the workflow says so),
and the page is still unverified in a real browser.

Also fixed on stage 1 from GPT's stage 2 round (finding 5): `nowLine` was silent when a
committed `team/NOW.md` was deleted from the working copy (6f15d35, case red before).

Record notes: the doubled `[[END GPT round 3]]` line comes from the live clone's `run-seat.mjs`,
which lacks 28d5dac (`fix/run-seat-double-end`, unmerged). GPT has now had its three rounds, the
cap; it has not seen the fixes.

[[POSITION - CLAUDE]]
Stage 1 is sound for the two-week trial once 9839abb and 6f15d35 are in: every finding from
GPT, GEMPRO and the stand-in has been fixed with a case red before the fix, or recorded as not
fixed with its reason (the hook's older calls near the 20 s limit). Ben adjudicates; a GPT check
of the fixed page is optional and not owed.

[[END CLAUDE close]]
