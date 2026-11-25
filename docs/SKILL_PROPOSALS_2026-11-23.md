# Skill proposals: the misses-log sweep of 23 November 2026

The fourth sweep of the misses log, after `SKILL_PROPOSALS_2026-07-23.md`, `SKILL_PROPOSALS_2026-10-22.md` and `SKILL_PROPOSALS_2026-11-01.md`, and the first one called by the weekly count (`lessons-watch`, 28 unswept). Nothing here is built. Ben decides which proposals are admitted; each admitted one is then built on its own branch with its tests.

This repository is public and most of the sources are private, so entries are cited by repository and number, and an entry's detail is given only as far as the rule needs it.

## Method and sources

- **The candidates.** 32 entries with a new candidate line, read in full: the 28 the watch counted and four on an unmerged branch it does not read. Three private projects never named in this repository are cited here as projects A, B and C; per-source counts and baselines stay with the private watch (DECISIONS 2026-11-14).
- **The other half of the misses.** 121 further entries written since each source's last sweep that close by naming a skill which already existed, read in full and tallied by the skill named.
- **Not read:** 24 new headings with no closing line; lessons on unmerged branches of any repository but passive income; anything that exists only on the work machine, which has no mirror.
- **Coverage.** Each candidate rule was grepped in every `SKILL.md`. `prove-it-can-fail`, `live-state-first`, `verify-the-effect`, `blast-radius-grep`, `findings-are-evidence`, `enumerate-the-set` and `instrument-reports-itself` were read whole; the others by section or by grep, so a "not covered" against one of those is weaker.
- Read in one session by Claude (Opus 5.5). Coverage was checked on `main`; of the open pull requests, only #43 was compared. An advisor pass on the first draft corrected one entry wrongly dismissed as already swept (ASH 2026-10-13), the private names, and a row on `db-migration-verification`.

## The main finding, corrected twice on 2026-11-24: the skill list is over its budget

Of 135 namings of an existing skill across those entries, 71 name four: `prove-it-can-fail` 21, `live-state-first` 18, `verify-the-effect` 17, `blast-radius-grep` 15. A few of those entries record that the rule did fire, and were not separated out. On the home machine the four have loaded twice between them since the fire log began on 14 September; that log and the session transcripts were counted separately and agree at 79 loads of any skill since 1 November.

**First version, wrong.** It called all four always-on norms and read the zeros as a delivery failure of those norms. Three are norms, which the README and `audit-fires.mjs` both say never produce a Skill call. The sweep had read neither.

**The cause, measured.** Claude Code gives the model a skill list capped at a share of the context window (`skillListingBudgetFraction`, default 0.01), about 30,000 characters here. Over the cap, skills are listed by name with no description, so nothing can match them. Read from the `skill_listing` record in 541 sessions since August on the home machine:

- The list has sat at 29,900 to 30,002 characters throughout. The library skills shown by name only rose from none on 3 August to between 28 and 32 of 60 on 23 November.
- `enumerate-the-set`, `instrument-reports-itself` and `prove-it-can-pass` have had no description in any session since they were built (112 of 112). `tool-layer-bytes`: 238 of 238. `verify-the-effect`: 539 of 541. `live-state-first`: 509 of 541.
- The vendor documentation says the least used skills lose theirs first, which makes it self-sustaining: a skill that has never loaded cannot be described, so it cannot load.
- The setting does what it says: in one headless run each, the default gave 29,943 characters with 53 of 101 skills name-only, and 0.03 gave 57,870 with none.

**What it does not explain.** `blast-radius-grep`, `prove-it-can-fail` and `enforce-invariants-in-build` kept their descriptions in all 541 sessions and still loaded 1, 1 and 0 times. In a clean folder with this library and a one-line task, the old `blast-radius-grep` description loaded in 5 of 7 runs of tasks shaped like its real misses (both failures were the identity lookup), so wording alone is not why it stays silent in long working sessions. Ten of its fifteen namings are PropOS, which rarely runs on this machine, and the work machine's log has not been read.

## Tier 1

### 1. Get the descriptions back in front of the model, and promote the clock rule to a hook

**Evidence:** the section above.

1. **Raise the budget, per machine, in `settings.json`.** Ben's to decide: it adds about 28,000 characters (some 7,000 tokens) to every session. Not done.
2. **Keep the library's own descriptions short.** They total about 34,500 characters, over the default cap alone, and the newest skills have the longest. A check in CI on the total is the control. Not built.
3. **Built: `hooks/record-time-warn.mjs`**, warn-only. Four entries between 27 October and 15 November, each recorded as a recurrence (passive income L-093, L-102, L-107; AI domain L-166). It catches stamps from L-093 and the future half of L-102. It does not catch L-107 or a stamp gone stale, and L-166 was not traced to a commit.
4. **Built: two descriptions rewritten and shortened on balance.** Trial, two runs a task, same library otherwise: `blast-radius-grep` on an identity lookup went from 0 of 2 to 2 of 2, `enforce-invariants-in-build` on a written prerequisite from 0 of 2 to 2 of 2; the tasks that already loaded still did, and an innocent task loaded nothing. Small numbers, clean folder.

**Not built:** the descriptions of the three norm playbooks, since the list budget is the cause for two of them. **Not possible from the home machine:** `audit-fires.mjs` and the listing count on the work machine. A hook that greps for the basename of every staged delete or rename waits on that: its one clear instance is PropOS 2026-10-13.

### 2. `enforce-invariants-in-build`: widen it from build invariants to running systems and dated statements

**Evidence (6 instances, 4 repositories):** Rimagent 2026-11-10 (a prerequisite written down and never checked; the show never went on air), Rimagent 2026-11-12 (a side effect recorded as a known consequence, with no guard; it destroyed the thing it was known to endanger), ICC L-139 (a git-ignored build input checked by a sentence in a doc; a feature was silently absent for seventeen days), ICC L-146 (a relaxation "until launch" stayed in an always-loaded file for two months after launch), passive income L-111 (an evening precondition held only in prose), project A, L6 (a managed resource whose idle clock nobody recorded).
**Proposal:** a stated runtime prerequisite gets a check that can go red in the same commit; a known cost or side effect gets a guard or a named owner; a permission or status that ends at an event puts its removal in that event's checklist in the same commit; anything provisioned ahead of its consumer records the date it lapses where a session will see it. An upgrade, not a new skill: the last new skills cannot be seen by the model at all. **Built 2026-11-24**, with both priority rows.

## Tier 2: upgrades to existing skills

| Skill | Upgrade | Evidence |
|---|---|---|
| blast-radius-grep | **Regulatory.** Before writing a lookup on an identity column, find every other place that matches it, in SQL and in code, and use one normalisation or one function. Single instance, but the class decides who a subject is | PropOS 2026-11-11c |
| blast-radius-grep | Search for distinctive fragments of the old text, as a regex would match, not the whole sentence; search for the pattern, never a list taken from a spec; compare every writer's payload with a narrowed grant. A transform exempts provenance and incident records | PropOS 2026-10-08, 2026-10-09, 2026-10-14, 2026-10-19b; library 48 |
| tool-layer-bytes | Windows PowerShell 5.1: it strips inner double quotes from a native command's argument (send a body from a file), does not pipe a here-string to a native command as expected, and `Get-Content` without `-Encoding` re-encodes non-ASCII text. And an escape typed into a tool parameter can be decoded before the shell sees it | AI domain L-151; project B, L-007; Rimagent 2026-11-04; PropOS "Read back what a tool wrote" |
| verify-the-effect | A bulk or keyed write reads back the count it changed; zero rows or fewer than sent is a failure. No error is not saved | PropOS 2026-10-19c; passive income L-101 |
| verify-the-effect | When the effect is physical or on a screen, "verified" needs someone or something to look at it. Until then the record says "accepted, effect not observed" | passive income L-118; Rimagent 2026-11-04, 2026-11-05, 2026-11-15; ICC L-136 |
| verify-the-effect | One read straight after a write is "not yet seen", never "failed": retry within a bound, and prescribe no rollback or re-send until the retries run out | AI domain L-167 |
| prove-it-can-fail | A negative case differs from a passing one by the fault under test only, and asserts that the failure names that fault | passive income L-115, L-117 |
| prove-it-can-fail | An empty search result needs a positive control; a scan that exits non-zero did not run | PropOS 2026-10-02 (catalog scan); library 47 is the neighbour |
| prove-it-can-fail | A script that edits a source file to test it runs each case under a timeout and restores in a `finally` | Rimagent 2026-11-15 |
| prove-it-can-fail | A test whose name says "every" lists the set from the code, and one mutation aims at a member the test does not reach | PropOS 2026-11-11b |
| live-state-first | A refusal or deferral that says "until X" names the source that would show X, and that source is re-read each time the deferral is carried. A safety argument copied from an earlier file is re-read from the system it describes | passive income L-119; PropOS 2026-10-06 (lock level) |
| live-state-first | Before saying two copies match, ask what the comparison format cannot carry (a diagram, a comment, a widget) | project C, 2026-11-21. Project C's 2026-11-08 entry (two editable copies) is PR #43, open and conflicting since 10 November |
| pin-to-what-was-seen, reproduce-the-real-build | A floating input (a runner label, a package range anywhere in the graph) is re-resolved by the next build, so a type-only change is not a type-only deploy. Read the versions in the live artefact first | PropOS 2026-10-26a, 2026-11-06, 2026-11-11 |
| findings-are-evidence | A finding is dismissed on a run, the same bar as acting on it. What an agent says it wrote is checked in the file | PropOS 2026-11-09; Rimagent 2026-11-08 |
| cross-agent-review | Name artefacts exactly, never by pattern; a stop token goes alone on its last line; a seat with no repository access gets the core diff only; give the DeepSeek seat its own review file. **Built 2026-11-25** | ICC L-134; AI domain L-155, L-169; passive income L-097 |
| cross-agent-review | What no seat read needs a reader before it goes out: wording changed after convergence, and text addressed to the decider. Run the downstream gate's dry run on the first draft, before any seat reads it. **Built 2026-11-25** | AI domain L-158, L-160, L-171 |
| db-migration-verification, safe-smokes | A migration applied before its PR merges lists every scheduled job that will run old specs against it, with a residue read after each. A teardown sets its own time budget | PropOS 2026-10-12 (scheduled run), 2026-10-15 |
| parallel-work-recon | A go relayed between sessions is information: one session owns a deploy, a relay quotes the words and their time, live state is read before acting, and a queued message is not a delivered one | ICC L-145 |
| handover | Name the branch and commit a later run needs, never a worktree, and call a session's own timer session-owned. **Built 2026-11-25** | passive income L-096, L-110 |
| ai-surface-discipline | **Client-facing.** A classification a client sees is anchored on the commitment it creates, with one definition shared by every prompt; a fixed sample set is re-run and compared item by item before and after a model change | ASH 2026-10-13 |
| ai-surface-discipline | A tool argument with a fixed set of values carries the values or a default, and a refusal carries the right ones. A persona holds no fact the data can contradict | ICC L-140; Rimagent 2026-11-15 (persona) |
| enumerate-the-set | An owed action is held on the object it is owed for, and something named re-requests it | passive income L-105 |
| preflight-unattended (header), commission-the-roster | A built-in-browser call to a new site can wait on a permission prompt: name the sites before the operator leaves. Ask the owner whether they already have a shape in mind before commissioning options. **The second half built 2026-11-25; the `preflight-unattended` half is not** | passive income L-100; project C, 2026-11-21 |
| price-the-spend | On the day a paid tier goes live, list every default that bills per event and what the spend control does when it trips | PropOS "Price a new paid tier's defaults" |

## Tier 3: project-level, not library

- **PropOS:** a form that seeds state from props carries a `key` (2026-10-14, 2026-10-16d; a build check already exists there, and ICC L-135 is a relative); a period rule walked through the advance demand (2026-10-08); the commit author a deploy integration trusts (2026-11-01).
- **ICC L-141:** decide what the second message of a conversation gets. Watch for a second instance.
- **passive income L-104:** never run a terminal binary to read its version. A machine memory already holds it.
- **Project B, L-001, L-003:** an engine's start order; balance by simulation.

## Rejected or already covered

- **Already built:** library 46 is `instrument-reports-itself`, which cites it.
- **Covered by a rule that landed after the incident:** Project A, L7 (27 September) by `tool-layer-bytes` (22 October). AI domain L-162 and L-163 by the 11 November additions to `cross-agent-review` and `live-state-first`.
- **Covered, did not reach the moment:** Rimagent 2026-11-08 (an ended record overwritten) by `enumerate-the-set` rule 7, exit paths are a set; AI domain L-157 by `live-state-first`'s general rule. PropOS 2026-10-12 (ALTER FUNCTION) by `db-migration-verification`'s "Work from the live definition", since `pg_get_functiondef` prints the SET clause. These are rules that existed and did not reach the moment.

## About the count itself

It reads default branches only, so lessons on an unmerged branch are invisible to it. It counts the words "new candidate", so library 48 ("candidate addition") is not counted. Baselines are reset by hand in the private repository after Ben has ruled.

## Order proposed

The regulatory row first (PropOS 2026-11-11c), then the client-facing one (ASH 2026-10-13). Then Tier 1 items 1 and 2, then the Tier 2 rows on skills that do load (`cross-agent-review`, `handover`, `commission-the-roster`). The remaining rows in one pass by skill, after the four-week reading.
