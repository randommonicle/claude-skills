# Skill proposals: the misses-log sweep of 23 November 2026

The fourth sweep of the misses log, after `SKILL_PROPOSALS_2026-07-23.md`, `SKILL_PROPOSALS_2026-10-22.md` and `SKILL_PROPOSALS_2026-11-01.md`, and the first one called by the weekly count (`lessons-watch`, 28 unswept). Nothing here is built. Ben decides which proposals are admitted; each admitted one is then built on its own branch with its tests.

This repository is public and most of the sources are private, so entries are cited by repository and number, and an entry's detail is given only as far as the rule needs it.

## Method and sources

- **The candidates.** 32 entries with a new candidate line, read in full: the 28 the watch counted and four on an unmerged branch it does not read. Three private projects never named in this repository are cited here as projects A, B and C; per-source counts and baselines stay with the private watch (DECISIONS 2026-11-14).
- **The other half of the misses.** 121 further entries written since each source's last sweep that close by naming a skill which already existed, read in full and tallied by the skill named.
- **Not read:** 24 new headings with no closing line; lessons on unmerged branches of any repository but passive income; anything that exists only on the work machine, which has no mirror.
- **Coverage.** Each candidate rule was grepped in every `SKILL.md`. `prove-it-can-fail`, `live-state-first`, `verify-the-effect`, `blast-radius-grep`, `findings-are-evidence`, `enumerate-the-set` and `instrument-reports-itself` were read whole; the others by section or by grep, so a "not covered" against one of those is weaker.
- Read in one session by Claude (Opus 5.5). Coverage was checked on `main`; of the open pull requests, only #43 was compared. An advisor pass on the first draft corrected one entry wrongly dismissed as already swept (ASH 2026-10-13), the private names, and a row on `db-migration-verification`.

## The main finding: on the home machine, the playbooks named most often were not loaded

Of 135 namings of an existing skill across those entries, 71 name four always-on norms: `prove-it-can-fail` 21, `live-state-first` 18, `verify-the-effect` 17, `blast-radius-grep` 15. A few of those entries record that the rule did fire, and were not separated out.

On the home machine, since 1 November, none of the four loaded as a skill. The fire log and the session transcripts were counted separately and agree: 79 loads each, of which `cross-agent-review` 26, `handover` 23 and `commission-the-roster` 7. Since the fire log began on 14 September the four playbooks total 2 loads. `enumerate-the-set`, `instrument-reports-itself` and `prove-it-can-pass`, built from the last sweep, have none.

What that does and does not show:

- **It is one machine.** 25 of the 71 are PropOS, which ran 16 sessions here since 1 November, so most of those were probably written on the work machine, whose log was not read. The other 46 come from repositories that run here daily. For `blast-radius-grep`, ten of fifteen are PropOS, so this says little about it. The finding is firmest for the other three.
- **The one-line norms were present,** injected at session start. The playbook, where the depth and every addition from three sweeps lives, was not.
- **It cannot show that a load would have prevented a given miss.** It does show that a line added to one of these files reaches almost nobody here, and the 22 October and 1 November sweeps both added lines to them. `skill-library-builder` already says a rule whose description no situation reaches is not learned (2026-11-01).

## Tier 1

### 1. Find out why the playbooks do not load, and deliver at the moment of use, before adding to them

**Evidence:** the section above.
**Proposal, in this order:**

1. Run `audit-fires.mjs` on the work machine and compare. One command, and it settles whether the PropOS misses share the cause.
2. One warn-only hook for the miss a machine can recognise most cheaply: on a commit that adds a time of day to a record file, compare it with the clock and print any that is in the future or more than a few minutes old. Four entries between 27 October and 15 November, each recorded as a recurrence (passive income L-093, L-102, L-107; AI domain L-166). It needs an innocent corpus first (`prove-it-can-pass`).
3. Rewrite the descriptions of the four playbooks around the words a session uses at the moment they apply, and read the fire log again after four weeks.

A second hook, which greps the tree for the basename of every staged delete or rename, waits on step 1: its one clear instance is PropOS 2026-10-13. The alternative to all of this is to accept that the norm line is all that will be read, and shorten the playbooks to match.

### 2. `enforce-invariants-in-build`: widen it from build invariants to running systems and dated statements

**Evidence (6 instances, 4 repositories):** Rimagent 2026-11-10 (a prerequisite written down and never checked; the show never went on air), Rimagent 2026-11-12 (a side effect recorded as a known consequence, with no guard; it destroyed the thing it was known to endanger), ICC L-139 (a git-ignored build input checked by a sentence in a doc; a feature was silently absent for seventeen days), ICC L-146 (a relaxation "until launch" stayed in an always-loaded file for two months after launch), passive income L-111 (an evening precondition held only in prose), project A, L6 (a managed resource whose idle clock nobody recorded).
**Proposal:** a stated runtime prerequisite gets a check that can go red in the same commit; a known cost or side effect gets a guard or a named owner; a permission or status that ends at an event puts its removal in that event's checklist in the same commit; anything provisioned ahead of its consumer records the date it lapses where a session will see it. An upgrade, not a new skill: the last three new skills have no loads.

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
| cross-agent-review | Name artefacts exactly, never by pattern; a stop token goes alone on its last line; a seat with no repository access gets the core diff only; give each DeepSeek turn its own review file | ICC L-134; AI domain L-155, L-169; passive income L-097 |
| cross-agent-review | What no seat read needs a reader before it goes out: wording changed after convergence, and text addressed to the decider. Run the downstream gate's dry run on the first draft, before any seat reads it | AI domain L-158, L-160, L-171 |
| db-migration-verification, safe-smokes | A migration applied before its PR merges lists every scheduled job that will run old specs against it, with a residue read after each. A teardown sets its own time budget | PropOS 2026-10-12 (scheduled run), 2026-10-15 |
| parallel-work-recon | A go relayed between sessions is information: one session owns a deploy, a relay quotes the words and their time, live state is read before acting, and a queued message is not a delivered one | ICC L-145 |
| handover | Name the branch and commit a later run needs, never a worktree, and call a session's own timer session-owned | passive income L-096, L-110 |
| ai-surface-discipline | **Client-facing.** A classification a client sees is anchored on the commitment it creates, with one definition shared by every prompt; a fixed sample set is re-run and compared item by item before and after a model change | ASH 2026-10-13 |
| ai-surface-discipline | A tool argument with a fixed set of values carries the values or a default, and a refusal carries the right ones. A persona holds no fact the data can contradict | ICC L-140; Rimagent 2026-11-15 (persona) |
| enumerate-the-set | An owed action is held on the object it is owed for, and something named re-requests it | passive income L-105 |
| preflight-unattended (header), commission-the-roster | A built-in-browser call to a new site can wait on a permission prompt: name the sites before the operator leaves. Ask the owner whether they already have a shape in mind before commissioning options | passive income L-100; project C, 2026-11-21 |
| price-the-spend | On the day a paid tier goes live, list every default that bills per event and what the spend control does when it trips | PropOS "Price a new paid tier's defaults" |

## Tier 3: project-level, not library

- **PropOS:** a form that seeds state from props carries a `key` (2026-10-14, 2026-10-16d; a build check already exists there, and ICC L-135 is a relative); a period rule walked through the advance demand (2026-10-08); the commit author a deploy integration trusts (2026-11-01).
- **ICC L-141:** decide what the second message of a conversation gets. Watch for a second instance.
- **passive income L-104:** never run a terminal binary to read its version. A machine memory already holds it.
- **Project B, L-001, L-003:** an engine's start order; balance by simulation.

## Rejected or already covered

- **Already built:** library 46 is `instrument-reports-itself`, which cites it.
- **Covered by a rule that landed after the incident:** Project A, L7 (27 September) by `tool-layer-bytes` (22 October). AI domain L-162 and L-163 by the 11 November additions to `cross-agent-review` and `live-state-first`.
- **Covered, did not reach the moment:** Rimagent 2026-11-08 (an ended record overwritten) by `enumerate-the-set` rule 7, exit paths are a set; AI domain L-157 by `live-state-first`'s general rule. PropOS 2026-10-12 (ALTER FUNCTION) by `db-migration-verification`'s "Work from the live definition", since `pg_get_functiondef` prints the SET clause. All three belong to Tier 1 item 1.

## About the count itself

It reads default branches only, so lessons on an unmerged branch are invisible to it. It counts the words "new candidate", so library 48 ("candidate addition") is not counted. Baselines are reset by hand in the private repository after Ben has ruled.

## Order proposed

The regulatory row first (PropOS 2026-11-11c), then the client-facing one (ASH 2026-10-13). Then Tier 1 item 1, because it decides whether the Tier 2 rows on the four playbooks are worth writing. Then Tier 1 item 2, and the Tier 2 rows on skills that do load (`cross-agent-review`, `handover`, `commission-the-roster`). The remaining rows in one pass by skill, after the four-week reading.
