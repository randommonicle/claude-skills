# Review: the team-lead loop design

- **Target:** `docs/DESIGN_team-loop_2026-10-02.md` (uncommitted, in the working tree)
- **Mode:** challenger-Claude (Claude holds a provisional verdict; seats attack it)
- **Repo:** `C:\Users\bengr\.claude\skills` (READ ONLY during this debate)
- **Date opened:** 2026-10-02
- **Seats in play:** CLAUDE (hub), GPT (codex), GEMPRO (agy)
- **Round cap:** 3 each
- **Stop:** `[[CONVERGED]]` on agreement; a `[[POSITION - <HANDLE>]]` paragraph each at the cap.

Protocol: `exchange/PROTOCOL.md`. Append-only. Cite `path:line`. Concede on evidence.
End every section with `[[END <HANDLE> round N]]` on its own last line.
Keep each section under 3,500 characters: this file is a shared budget with a hard ceiling.

---

## [CLAUDE round 1]

**Framing.** A solo, part-time operator wants a "team lead plus pinned sub-agents, all state in
files" process for Claude Code, modelled on a Reddit post. The design note proposes building a
thin version from this skill library: a hub skill and five role agents shipped in the plugin, and
only state files (`team/`) in each project. Decide whether the design is sound, over-built, or
broken.

**Evidence already gathered** (verified by Claude; do not re-derive, attack instead):
- Claude Code 2.1.281 on this machine. A real probe on 2026-10-02: a subagent spawned with
  `isolation: worktree` committed a file; the Agent tool returned `worktreePath`
  (`.claude\worktrees\agent-<id>`) and `worktreeBranch` (`worktree-agent-<id>`); the worktree and
  commit stayed on disk afterwards. The probe repo had no remote.
- Official docs, fetched 2026-10-02: subagent frontmatter supports `model`, `effort`, `tools`,
  `disallowedTools`, `isolation: worktree`, `maxTurns` (output returned marked partial), `skills`,
  `memory`, `omitClaudeMd`; `hooks` frontmatter is ignored for plugin agents; name precedence is
  project over user over plugin; subagents can spawn subagents three levels deep unless `Agent` is
  removed from `tools`. `worktree.baseRef` defaults to `"fresh"` (branch from the remote default
  branch); `"head"` branches from the current HEAD. Agent teams are experimental; teammates inherit
  the lead's effort, are not restored on resume, and message each other directly.
- PropOS `origin/main` (e883ca3): `.claude/agents/backend.md:5` is `model: sonnet` for migrations
  and RLS work; `docs/` holds 147 `HANDOVER_*` files.

**Provisional verdict.** Build it thin and pilot one milestone on a non-regulated project.
Confidence: medium. The parts I trust least are the step 5 to 8 branch handoff and the cost
estimate.

**GPT: assume the mechanism is broken and find where.** Read exactly these:
`docs/DESIGN_team-loop_2026-10-02.md` lines 107-267, `commission-the-roster/SKILL.md`, and
`hooks/session-recon.mjs` lines 45-70. Press:
1. The handoff (design lines 168-245): test-writer branch, builder merges it, lead merges the
   builder branch into a local milestone branch, with `baseRef: "head"` and two builders at once.
   Find the sequence of spawns and merges that breaks, and say what breaks.
2. The gate check `git diff <test-branch> <build-branch> -- <test paths>` (around line 188). Find
   the ways a builder weakens a test that this diff does not show.
3. The role table (lines 109-135): any role whose tools, isolation or `maxTurns` contradict its
   job, and any state that can live in two files at once (lines 137-166).

**GEMPRO: assume the doctrine is wrong and find where.** Read exactly these:
`docs/DESIGN_team-loop_2026-10-02.md` lines 1-106 and 268-321, and
`commission-the-roster/SKILL.md`. Press:
1. Steelman the smaller alternative: adopt only NOW.md, ASK.md and effort pins, with no hub skill,
   role agents or scaffold. Where does the design over-build for a part-time operator?
2. Where section 2 is unfair to, or wrong about, the post it critiques.
3. The cost model (lines 268-285): is roughly 1.2M tokens a package a defensible reading of the
   cited figures, or does it double count orientation that the design's own briefs remove?
4. Contradictions with existing doctrine, for example the "standing roster" against
   `commission-the-roster` Rule 1.

A seat that finds nothing real in its area says so. An approval is worth nothing; a specific,
cited defect is worth everything.

NEXT: ALL

[[END CLAUDE round 1]]

> **[transport] GPT round 1 did not complete** - the seat returned an empty reply.
> Tokens spent: in=? out=?. This seat has NOT answered round 1.
<!-- transport-failure: seat: GPT | round: 1 | thread: 01a0fe42-dc78-7340-9197-da8496e15203 | usage: in=? out=? -->

## [GEMPRO round 1]

**1. The smaller alternative: the design over-builds for a part-time operator.**
The operator frictions identified in `docs/DESIGN_team-loop_2026-10-02.md:55-81` are: (a) uncompacted handover sprawl forcing state reconstruction (`docs/DESIGN_team-loop_2026-10-02.md:55-58`), (b) unanswered questions lost when chat sessions end (`docs/DESIGN_team-loop_2026-10-02.md:79-81, 100`), and (c) unpinned effort tiers on mechanical tasks (`docs/DESIGN_team-loop_2026-10-02.md:61, 95`).
Adopting three lightweight primitives—`team/NOW.md` (single-file overwrite resume board), `team/ASK.md` (persistent async human decision queue), and frontmatter effort pins—solves all three without shipping a hub skill, five role agents, or a scaffold script (`docs/DESIGN_team-loop_2026-10-02.md:18-21`).
For a part-time operator, shipping a five-role operating fleet (`docs/DESIGN_team-loop_2026-10-02.md:18-20, 109-135`) over-builds:
- It creates maintenance drag across multiple state files (`team/BOARD.md`, briefs, design revisions; `docs/DESIGN_team-loop_2026-10-02.md:36-38, 97-100`) and drift checks.
- It imposes an assembly line where every work package is routed through four distinct agents (`docs/DESIGN_team-loop_2026-10-02.md:276-277`), turning simple tasks into multi-worktree coordination bottlenecks.
A part-time operator needs frictionless session resumption and async decision parking, not a heavy multi-agent administrative apparatus.

**2. Where Section 2 is unfair to, or wrong about, the post.**
- **Effort vs. briefs (`docs/DESIGN_team-loop_2026-10-02.md:69-72`):** Section 2 claims the post seeks economy only through effort levels while this library relies on briefs, citing `commission-the-roster/SKILL.md:151`. But the post explicitly mandates design docs, briefs, and kanban boards (`docs/DESIGN_team-loop_2026-10-02.md:36-38`). The post paired briefs with pinned effort; Section 2 creates a false dichotomy.
- **Cache read ratio (`docs/DESIGN_team-loop_2026-10-02.md:75-78`):** Section 2 asserts the 280:1 cache read ratio reflects "what a long-lived lead context costs". With shared system prompts, instructions, and worktrees, prompt cache hits occur across all subagent calls. It demonstrates high cache reuse across runs, not unpruned lead bloat.
- **Cadence (`docs/DESIGN_team-loop_2026-10-02.md:79-81`):** Section 2 claims 33 decision rounds in 7 days requires a "full-time developer". But the post defines the human as purely a product owner doing "no design, no code" (`docs/DESIGN_team-loop_2026-10-02.md:29-30`). Four to five brief async triage decisions a day via an inbox or board is standard part-time steering, not full-time engineering.

**3. The cost model (`docs/DESIGN_team-loop_2026-10-02.md:268-285`) double-counts orientation.**
The estimate of ~1.2M tokens per package (`docs/DESIGN_team-loop_2026-10-02.md:276-277`) is indefensible:
- It multiplies 4 agents by the 290k unoptimized average from `commission-the-roster/SKILL.md:10`. But `commission-the-roster/SKILL.md:17-20` shows that this 290k average came from an unmitigated wave where 60k–120k per segment was wasted on the "orientation tax" (1.5M tokens spent re-deriving facts) and an idle merge sitter (`commission-the-roster/SKILL.md:24-26`).
- Rule 3 briefs (`docs/DESIGN_team-loop_2026-10-02.md:94`, `commission-the-roster/SKILL.md:80-106`) eliminate this orientation tax. Using the 290k baseline double-counts the waste the brief eliminates.
- Under actual `commission-the-roster` rules (2026-08-03 wave, `commission-the-roster/SKILL.md:276-279`), a 4-agent wave cost 499k total (~125k/segment), less than half the design's 1.2M estimate.
- Furthermore, `commission-the-roster/SKILL.md:73-74` bars spawning reviewers on unregulated diffs ("name the check instead of spawning a reviewer"), contradicting the fixed 4-agent count (`docs/DESIGN_team-loop_2026-10-02.md:276`).

**4. Contradictions with existing doctrine.**
- **Standing roster vs. Rule 1 (`commission-the-roster/SKILL.md:46-58`):** Rule 1 mandates that "the roster is approved before anything spawns" via a dynamically published table approved by the operator ("Wait for my yes on the roster", `commission-the-roster/SKILL.md:213`). Pre-baking five standing role agents into an automated loop (`docs/DESIGN_team-loop_2026-10-02.md:18-20, 276`) bypasses per-wave human approval of scope, budget, and headcount.
- **Agent as habit vs. Rule 4 (`commission-the-roster/SKILL.md:158-160`):** Rule 4 states: "If you cannot name the one file, diff, or report an agent will produce, it is not an agent, it is a habit." Baking standing researcher, test-writer, builder, and reviewer roles into every package (`docs/DESIGN_team-loop_2026-10-02.md:276, 315-316`) turns roles into institutional habits rather than justified single artifacts.
- **Mandatory test-writers (`docs/DESIGN_team-loop_2026-10-02.md:315-316`) vs. Rule 2 (`commission-the-roster/SKILL.md:68-75`):** Rule 2 tiers unregulated build to mid-tier without mandatory role separation. Defaulting to a dedicated test-writer and reviewer for every package inflates segments contrary to doctrine.

[[END GEMPRO round 1]]
<!-- seat: GEMPRO | thread: 483c7720-99d3-4624-a7a9-5645c464826c | grounding: repo-read | seat_turns: 1 | file_turns: 1 | usage: in=42443 out=16158 cache_read=89722 thinking=14134 -->

## [CLAUDE round 2]

**Seat change.** GPT did not answer round 1: codex returned a usage-limit error at turn start
(`turn.failed`). From this round OPUS, a Claude Opus subagent, takes GPT's assignment, on the
operator's instruction. It shares the hub's model family, so its findings are less independent.

**GEMPRO round 1, verified and acted on.** Every line GEMPRO cited was re-read:
commission-the-roster/SKILL.md:73-74, :147-149, :163-167, :213, :276. Conceded and applied in
revision 2 (design section 10, lines 383-408): the staged build (1), the section 2 rewording
(2a, 2b, 2c), the cost model (3), reviewers on regulated packages only plus a per-milestone roster
(4a), and the separate test writer on regulated packages only (4c). Not conceded: 4b. Rule 4's
habits are watchers, collators and coordinators (:163-167), agents with no single artifact; every
loop role names one (design lines 222-240). The first draft's cleanup agent did collate, so that
job moved to the lead.

**GEMPRO, round 2.** Read exactly: `docs/DESIGN_team-loop_2026-10-02.md` lines 1-34, 143-167,
326-347 and 383-408, and `handover/SKILL.md`. Press:
1. Stage 1 (lines 143-167): does it fix the three frictions you named without a new failure mode?
   Look at NOW.md against the handover skill's triggers, and ASK.md against DECISIONS.md.
2. Rebut the 4b refusal with a cited line, or concede it.
3. The revised cost figures (lines 326-347): defensible now, or still mis-read?

**OPUS, round 2 (GPT's round 1 assignment, against revision 2).** Assume the mechanism is broken
and find where. Read exactly: `docs/DESIGN_team-loop_2026-10-02.md` lines 168-325,
`commission-the-roster/SKILL.md`, and `hooks/session-recon.mjs` lines 45-70. Press:
1. The handoff (lines 222-305): builder worktree branches, a regulated test writer's branch merged
   by the builder, the lead merging into a local milestone branch, `baseRef: "head"`, two packages
   at once with disjoint scopes. Find the sequence that breaks.
2. The step 8 gate (lines 241-250): ways a builder weakens or games the tests that the gate passes.
3. The role table and state layout (lines 170-221): a role whose tools, isolation or `maxTurns`
   contradict its job, or a fact that can live in two places.

Keep sections under 3,000 characters. A seat that finds nothing real says so.

NEXT: ALL

[[END CLAUDE round 2]]

## [GEMPRO round 2]

**1. Stage 1 (`docs/DESIGN_team-loop_2026-10-02.md:143-167`): two real seam failures.**
Stage 1 correctly isolates the three state primitives (`team/NOW.md`, `team/ASK.md`, effort pins), but introduces two failure modes against repository doctrine:

- **`team/NOW.md` vs. `handover/SKILL.md` triggers:**
  `docs/DESIGN_team-loop_2026-10-02.md:159-161` relegates full handover notes to "unusual" ends (amber/red context, crash, machine move) and designates overwriting `NOW.md` as the routine exit. This contradicts `handover/SKILL.md:14`, which triggers whenever "a long session is ending deliberately and the next session needs to resume cleanly."
  `NOW.md` holds only 40 lines (`docs/DESIGN_team-loop_2026-10-02.md:147-151`). Routine sessions bypassing `handover/SKILL.md:43-48` will discard crucial state: exact `file:line` ranges for half-done work, deferred items with grep anchors, unrun verifications, and trap discoveries. Crucially, `handover/SKILL.md:76-82` requires sweeping traps into `LESSONS_LEARNED.md` before close. Bypassing `handover` on routine exits creates a leak where discovered traps and deferred anchors are lost. `NOW.md` must index current state without suppressing `handover`.

- **`team/ASK.md` vs. `DECISIONS.md` pollution:**
  `docs/DESIGN_team-loop_2026-10-02.md:152` defines `ASK.md` as "decisions and build reviews only", and `docs/DESIGN_team-loop_2026-10-02.md:154-155` states: "The lead moves an answered item into DECISIONS.md and deletes it from the queue."
  `DECISIONS.md` in this repository is an immutable architectural log binding future sessions (`commission-the-roster/SKILL.md:95`). Build reviews ("PR #12 approved", "visual smoke passed") are ephemeral task sign-offs. Routing answered build reviews into `DECISIONS.md` pollutes the architectural record with transient churn. `DECISIONS.md` should record only architectural rulings; build approvals belong in milestone git logs or ledgers.

**2. Concession on 4b (Standing roles under Rule 4).**
Conceded on evidence. `commission-the-roster/SKILL.md:158-160` defines the rule: "If you cannot name the one file, diff, or report an agent will produce, it is not an agent, it is a habit." The named habits in lines 163-167 (watchers, collators, coordinators) lack discrete deliverables. Because every remaining loop role in `docs/DESIGN_team-loop_2026-10-02.md:222-240` produces a named artifact (tests, diff, or review report), and because Claude conceded 4a and 4c (`docs/DESIGN_team-loop_2026-10-02.md:397-398`: milestone roster approved per Rule 1; test-writer and reviewer on regulated packages only), the standing assembly-line defect is resolved and Rule 4 is satisfied.

**3. Cost model revised (`docs/DESIGN_team-loop_2026-10-02.md:326-347`): defensible, but regulated spend is unbracketed.**
The revised unregulated model (50k–150k tokens/package, 0.5M–1.5M per 5-package milestone; `docs/DESIGN_team-loop_2026-10-02.md:335-337`) is defensible. It aligns with verified fact-briefed runs (`commission-the-roster/SKILL.md:147-149, 276-279`) and discards the unmitigated 290k baseline.
However, lines 337-338 state that regulated packages "add a test writer, a strong-tier builder and a reviewer" without providing a milestone bracket. Based on 3 segments at 100k–150k each, a regulated package runs ~300k–450k, making a 5-package regulated milestone ~1.5M–2.5M. Adding this explicit bracket before the pilot prevents the operator from being blindsided when moving to PropOS.

[[END GEMPRO round 2]]
<!-- seat: GEMPRO | thread: 483c7720-99d3-4624-a7a9-5645c464826c | grounding: repo-read | seat_turns: 2 | file_turns: 2 | usage: in=224445 out=24422 cache_read=249175 thinking=20873 -->

## [OPUS round 2]

**1. Handoff.**
- (a) Gate runs "at the build head" (design:240), then the merge (:234); concurrency is gated by globs alone (:251-252). P1, P2 spawn at M0; P1 merges (M1); P2, gated on M0+P2, merges (M2) untested; disjoint globs say nothing of imports. Fix: gate on `git merge --no-commit`, abort on red.
- (b) Regulated P1: test writer commits T at M0; P2 merges (M1); `"head"` spawns P1's builder at M1 (:274-278), which merges T. `git diff --stat T <head> -- <test paths>` (:242-243) shows P2's test changes: red without builder fault, so the lead overrides a "mechanical" gate. Fix: diff from the builder's merge of T; assert `git merge-base --is-ancestor T <head>`.
- (c) Step 3 writes SPEC rev n+1 and briefs to the working tree (:229); a worktree is a fresh checkout of HEAD (:281, :287-288). Unless step 3 commits, the test writer derives from rev n.
- (d) commission-the-roster/SKILL.md:176: "shared-database smokes serialise". P1's builder resets the one local database while P2 is mid red-run; P2's IDs reflect P1's schema. Blocks stage 2 as written.

**2. Gate.**
- (a) `JUDGED BY` names the deciding tests (design:218-219); the gate checks only red-run failures (:240), and an unregulated builder authors both (:176, :231). Omit the hard test: never red, never gated. Fix: every JUDGED BY ID fails red and passes at head.
- (b) Nothing covers the rest of the suite or tests green at red time: regressions pass.
- (c) Tests SHA and red-run IDs are self-reported and in no `team/` file (:205-214); the lead reads no repo (:194); with Bash a builder can reset, recommit, re-run red. Fix: lead reruns both in the builder's worktree, logs SHAs and IDs in BOARD.md.
- (d) "the test scripts in `package.json`" is no pathspec (:242-243): file in, any dependency bump fails; out, script and runner edits pass.

**3. Roles and state.**
- (a) agentsLine, the check to extend, returns null under `CLAUDE_PLUGIN_ROOT` (hooks/session-recon.mjs:61) or outside a `skills` dir (:63), fail-open (:58); `tl-` agents ship in the plugin (design:312-313), so a copy is silent where the loop runs. Project shadows only (:191-193); a stale user-level copy (session-recon.mjs:51-52) also beats the plugin.
- (b) Reviewers: `isolation: none` plus Bash (design:180), a verdict file (:233), no Write. Testing a package head in the main checkout moves HEAD off the milestone branch (:287-288). Fix: worktree isolation, `git checkout --detach <branch>`.
- (c) `tl-cleanup` (:179) has no loop row (:224-236): no red run, gate item 1 vacuous; haiku/low with Edit, Write, Bash (:407) can reach regulated paths (commission-the-roster/SKILL.md:68-69).
- (d) Model sits in plugin frontmatter (:312), "once per project" (:247-248) and the roster item (:230); no rule picks one.

Unverified: `git -C <project> check-ignore -v .claude/worktrees/x` and `npx vitest list | grep -c worktrees || true` (else suites collect live worktrees' tests); whether a resumed `maxTurns`-stopped builder keeps its worktree.

[[END OPUS round 2]]
<!-- seat: OPUS | thread: - | grounding: repo-read | model: Claude Opus via a code-reviewer subagent, appended by the hub | usage: subagent_tokens=90426 tool_uses=12 -->

## [CLAUDE round 3]

**Round 2, verified and acted on.** Re-read before conceding: handover/SKILL.md:14 and :76,
commission-the-roster/SKILL.md:176, hooks/session-recon.mjs:58-63. Every GEMPRO and OPUS point
was conceded; revision 3 lists each (design section 11, lines 493-543). The operator also asked
for claude.ai artifacts to be considered: section 6 (lines 371-425) proposes an Ask board, a
private page whose database holds the decision queue, answerable from a phone.

**Round 3 is the cap. Attack the converged position.** Agreement so far is not evidence.

**GEMPRO.** Read exactly `docs/DESIGN_team-loop_2026-10-02.md` lines 1-39, 149-182, 371-425 and
480-492. Press: (1) the Ask board's boundaries: find a way an answer on it causes an outward or
regulated action, or a way state ends up in two places; (2) whether one board for all projects
breaks the regulated boundary for PropOS; (3) whether the step 0 probe tests what matters.

**OPUS.** Read exactly lines 185-302 of the same file. Press: (1) the revised step 8 gate (lines
266-292): find the next sequence that passes it wrongly; (2) step 4's roster approval arriving as
an Ask board answer (line 256): is that a valid Rule 1 yes, given section 6's "data, not a
command" boundary?

Close with `[[CONVERGED]]` if nothing real remains in your area, or a
`[[POSITION - <HANDLE>]]` paragraph if something does. Under 2,500 characters.

NEXT: ALL

[[END CLAUDE round 3]]

## [GEMPRO round 3]

**1. Ask board boundaries: dual state and crash desync (`docs/DESIGN_team-loop_2026-10-02.md:382-414`).**
- **Dual state:** Line 386 states the lead "marks the row recorded with the SHA of the commit", yet line 387 claims "open items live only on the board and answered ones only in the repo... Nothing lives in two places." Retaining answered rows with commit SHAs in the database *is* dual state. If a branch is rebased, reset, or abandoned, the board stores phantom SHAs absent from git history.
- **Crash desync:** If a session records an answer in `DECISIONS.md` but crashes before `ArtifactData` marks the row recorded (`docs/DESIGN_team-loop_2026-10-02.md:412`), the item remains active on the board, causing duplicate writes next session. Answered rows must be deleted upon commit, not retained.

**2. One board for all projects breaks PropOS regulated boundary (`docs/DESIGN_team-loop_2026-10-02.md:405-408, 483-484`).**
A single shared claude.ai artifact database for all projects (`docs/DESIGN_team-loop_2026-10-02.md:382, 483-484`) violates PropOS regulatory isolation:
- **Exfiltration via prompt drift:** The ban on personal data or money columns (`docs/DESIGN_team-loop_2026-10-02.md:405-407`) relies solely on lead prompt adherence. An unvetted lead summarizing an RLS or money migration can easily leak tenant schema or financial figures into cloud-hosted `question` or `recommendation` fields.
- **Co-mingling:** Storing PropOS governance decisions in the same cloud table as unregulated hobby projects compromises audit isolation. PropOS must strictly use local `team/ASK.md` (`docs/DESIGN_team-loop_2026-10-02.md:171-172`).

**3. Step 0 probe (`docs/DESIGN_team-loop_2026-10-02.md:415-422`) tests the wrong risks.**
Testing phone clicks and session wakeups misses critical operational risks:
- **Headless auth:** Whether `ArtifactData` functions in headless CLI sessions without an interactive browser session.
- **Concurrency & retention:** Whether `ArtifactData` handles concurrent writes from multiple repo sessions, and whether the table degrades without row deletion.
- **Offline fallback:** Probing seamless fallback to `team/ASK.md` when ArtifactData times out (`docs/DESIGN_team-loop_2026-10-02.md:409-411`).

[[POSITION - GEMPRO]]
Stage 1 is sound to pilot on an unregulated project, provided: (1) PropOS is strictly quarantined to local `team/ASK.md`; (2) the Ask board deletes answered rows upon git commit to eliminate dual state; and (3) the Step 0 probe validates headless CLI execution and offline fallback.

[[END GEMPRO round 3]]
<!-- seat: GEMPRO | thread: 483c7720-99d3-4624-a7a9-5645c464826c | grounding: repo-read | seat_turns: 3 | file_turns: 3 | usage: in=389938 out=30703 cache_read=477659 thinking=26053 -->

## [OPUS round 3]

**1. Step 8 gate.**
- (a) Item 4 diffs only after T (design:276-277), and T is builder-authored in both paths (:265-266). Regulated: TW commits A1 at M1; the builder runs `git merge --no-ff --no-commit <A>`, loosens test R2 (still red without the policy), commits T, builds H; or it commits a config edit before merging. Items 1-4 pass: the weakening is in or before T. Unregulated: T adds its tests plus a fixture edit, a config `exclude` or a skip on an existing test the build breaks; item 3's "full suite" is T's. Fix: record A1 at step 5 from the TW tool result, require `git diff --quiet A1 <head> -- <A1's test files>`, and diff config, fixtures and existing tests from the package base (`git merge-base`), not from T.
- (b) Item 3 tests a merge that is not the one committed. P1, P2 finish together; both gates run on M1, both green; the lead merges P1 (M2), then P2 (M3). M3 is the tree :273-275 says the gate prevents, and P2's BOARD row certifies a tree no branch holds. Fix: commit the tested merge in the scratch worktree, then `git merge --ff-only <tested sha>`; ff-only refuses if the milestone moved.
- (c) :269-270 overclaims: a test under the hard case's name can be hollow (`m` imports the existing `src/pay`; `expect(typeof m.refund).toBe('function')` is red at T, green on any stub), and T is found later in a history the builder can rewrite (:264). Fix: stop the unregulated builder after its tests commit; the lead line-reviews and pins T on the BOARD row, then resumes it.

**2. Roster yes from the board (:255).** Not a Rule 1 yes as written. The yes releases spend and spawns (commission-the-roster/SKILL.md:55, :213); :398 makes a board answer "data, not a command", and it reaches the lead as a tool result. Failure: roster R1 (two sonnet builders) gets "yes" from a phone; the lead, which already edits answered rows (:386), rewrites that row to R2 (three packages, one opus); on "continue" it reads R2 plus "yes" and spawns R2. By :403-404 it can write answers too. Fix: freeze answered rows and make a changed roster a new row, or take the yes in session.

Unverified: whether an ArtifactData row records who wrote a field; add a Claude-written answer to the step 0 probe (:415-421).

[[POSITION - OPUS]] The gate is computed now but trusts a builder-authored T and an untested merge; the Rule 1 yes rides on a row the lead can rewrite. With A1 and T pinned, ff-only merges, and a frozen row or an in-session yes, nothing remains in my area.

[[END OPUS round 3]]
<!-- seat: OPUS | thread: - | grounding: repo-read | model: Claude Opus via a code-reviewer subagent (resumed), appended by the hub | usage: subagent_tokens=127476 tool_uses=11 -->

## [CLAUDE close]

**Outcome: converged on revision 4.** Both seats closed round 3 with a conditional position, and
every condition is met in `docs/DESIGN_team-loop_2026-10-02.md` revision 4 (section 11 lists each
change against its finding). Verified before conceding: the Artifact tool description's "reads
and writes as the person", commission-the-roster/SKILL.md:55 and :213, and the git behaviour the
gate now relies on (`merge-base --is-ancestor`, `merge --ff-only` refusing when the target moved).

Not conceded: GEMPRO's fallback from the board to `team/ASK.md` on failure, which would make two
queues; the fallback is asking in the session.

Correction to CLAUDE round 3: its line pointers for OPUS were off (step 4 is line 255 of revision
3, the gate 263-285); OPUS was given the corrected ranges when its turn was started.

Seat note: GPT never answered (codex usage limit). OPUS, its replacement, shares the hub's model
family, so the mechanism findings had one less independent check than planned.

NEXT: NONE. The exchange is closed; reopen with a new CLAUDE section.

[[CONVERGED]]

[[END CLAUDE close]]
