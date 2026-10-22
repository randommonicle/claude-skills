# Skill proposals: the misses-log sweep of 22 October 2026

The second sweep of the misses log, after `SKILL_PROPOSALS_2026-07-23.md`. Nothing here is built. Ben decides which proposals are admitted; each admitted one is then built on its own branch with its tests, per skill-library-builder.

## Method and sources

Every `LESSONS_LEARNED.md` entry in Ben's project repositories whose misses-log line reads "none - new candidate" was listed by a script (heading, the parenthetical, the `class:` line): 80 entries, all dated after the July sweep (12 August to 22 October 2026). Repositories: `ICC/icc-site` (39), `AI domain and social network` (19), `passive income` (10; its `passive-income-wt-team-loop` worktree duplicates six of them and is not counted), `Factorio Mods` (5), `RimModManager` (4), `RMC guide` (2), `the-commission-game` (1). The entries were grouped by class, not by repository, and each group was checked against the library's 51 skills and the hooks in `hooks/` by a grep of every `SKILL.md` for the group's terms (for example "out of order", "heredoc", "CRLF", "compare-and-set"). Read in one session by Claude (Opus 5.5), from the class lines and headings, not from every entry's full text: a builder reads the full entries before writing a skill. Diagnoses here are unverified unless marked.

## Tier 1: new skills, with recurrence across repositories or money at stake

### 1. `tool-layer-bytes` (a skill and a hook): the shell and editing layers rewrite bytes the author did not touch

**Evidence (12 instances, 4 repositories):** ICC L-043 (a raw control byte made a source file binary to git), L-046 (`sed -i` turned a CRLF file LF), L-083 (Git Bash rewrote a `rev:path` argument), L-094 (backslashes rewritten ten times in six days), L-120 (`python - <<EOF ... < /dev/null` never ran), and the 22 October session (Python's default read turned fifty working-copy files LF; three heredocs lost backslashes); AI domain L-122 (a single quote ending `node -e`), L-144 and L-146 (platform defaults changing bytes between the reviewed and the sent or tested file); passive income L-084 (a heredoc rewrote code into a committed file "although a memory already warned of it"); RimModManager L-011. **Coverage today:** a machine memory (`feedback_tool_layer_bytes.md` and similar), no skill, no hook; the class keeps recurring because the warning lives only in memory (passive income L-084's own class line).
**Proposal:** a PreToolUse hook on Bash that warns (does not deny) when a heredoc or `node -e`/`python -c` payload carries a backslash, `$'`, or a quote of the enclosing kind, and when `sed -i` targets a file git reports `w/crlf`, naming the Write or Edit tool instead; and a short skill holding the byte checks that prove a scripted edit (`git diff --stat` for a whole-file count, CR and control-byte counts, `node --check`), with "a green run after a scripted edit proves nothing about whether the edit applied".

### 2. `unordered-events`: every status a webhook or queue writes is guarded against the states it may not move from, under any delivery order

**Evidence (5 instances, money paths):** ICC L-062 (Stripe does not order webhook deliveries), L-065 (a guard for one status let the neighbouring status through), L-082 (an event guarded to move drafts only was overtaken by an event for a later state), L-059 (a compare-and-set on one row does not serialise a write to another), and the 22 October review R11 (a dispute delivered before its deposit's paid event, acknowledged without a hold). **Coverage today:** none (no `SKILL.md` mentions delivery order); outbound-side-effect-idempotency and lock-at-the-chokepoint cover sends and concurrency, not order.
**Proposal:** for each event handler, write down the state machine and test every (event, current state) pair, including each event arriving before the one it logically follows; a guard names the states it may move FROM, never the one it expects; an event whose prerequisite has not landed is answered retryably, not acknowledged.

### 3. `fixtures-from-reality`: a test double, fixture or ride must reach its state the way production does, from what the real dependency sends

**Evidence (9 instances, 2 repositories):** ICC L-063 (a Stripe field absent on the pinned API version; fixtures from documentation), L-070 (test doubles more lenient than the service, second instance after L-069), L-079 (a ride's setup reached its state by a path production never takes), L-081 (two halves tested against their own fixtures, never each other's output), L-119 (Android 17 behaviour the Android 16 emulator never showed); AI domain L-095 (a query plan no functional test can see), L-139 and L-143 (the test runtime accepts what the deploy runtime refuses), L-140 (a test pins a value a planned later step must change). **Coverage today:** prove-it-can-fail asks whether a check can go red; nothing asks whether its fixture is real.
**Proposal:** fixtures recorded from the pinned provider version (or the documented shape cross-checked against one real response); a contract test that feeds one half's real output to the other; the deploy runtime, device or engine named for each claim a test supports, and a check on it where they differ.

### 4. `pin-to-what-was-seen`: an action taken on displayed state carries that state and is refused if it changed

**Evidence (5 instances):** ICC L-076 (a confirmation must carry the state it was given for), L-066 (two remedies pointing at each other loop), L-058 (an idempotency ledger read after the row lock, not before), and the 22 October session's repeated "from" pins (the staff role change, the access-notes edit, GPT's R11 and R12 on the editor closing after a 409 or an answer in doubt). **Coverage today:** none (team-loop alone mentions compare-and-set).
**Proposal:** every mutation from a screen sends the value or version the screen drew; the server's compare-and-set answers 409 on a mismatch; the client closes the editor and redraws from a fresh read on a 409 or an answer in doubt; a confirm text names the state it confirms.

### 5. `measure-per-route`: a platform property measured on one access path, runtime, device or timing is not assumed on another

**Evidence (7 instances, 3 repositories):** passive income L-062 (a tick boundary on one request shape), L-066 (a diagnostic depending on the run before it), L-088 (an identity check on an undocumented flag across two timings), L-057 (a terminal applying an update at restart); ICC L-087 (a Lighthouse reading contaminated by the antivirus), L-071 (a local service keeping a peer's old address after a restart); AI domain L-119 (stopping a wrapper left its child process). **Coverage today:** live-state-first reads current state; nothing says a measurement is bound to its route.
**Proposal:** each measured platform fact is recorded with the route, build and timing it was measured on; reused elsewhere only after a measurement there; a reading taken on a contaminated machine says so.

## Tier 2: upgrades to existing skills

| Skill | Upgrade | Evidence |
|---|---|---|
| live-state-first | Times, dates and counts written into any record are read from a command, in its own call, never estimated | ICC L-093 (the fifth instance of guessed times) |
| blast-radius-grep | A fact recorded in two decision records drifts: one record, the others link to it | ICC L-088 |
| honest-failure-surfacing (or a new micro-skill) | Bound every await on a network path, not only the one with the fetch in it; a long silent call says it is still working | ICC L-103; Factorio 2026-10-18 (side sessions silent 14 minutes) |
| no-silent-data-drop | An ignore rule or filter hiding a file meant to ship; check `git check-ignore` on a new file | ICC L-101 |
| reproduce-the-real-build | A generator that writes a resolved absolute path into a tracked file; a file's module type set by the nearest package.json | ICC L-108, L-115 |
| server-side-authority | A change of permission leaves a record of who made it; a published grammar's parser is a library's, never hand-written, when it decides security or approval | ICC L-117; AI domain L-117 |
| guard-the-spend-paths, findings-are-evidence | A money path's review walks every statement from the settle to the response, and keeps all three review layers | AI domain L-105, L-112 |
| cross-agent-review, commission-the-roster | Probe a seat's workspace, limits and runtime before use; a delegated agent writes its deliverable to a file; read what a sandbox flag bounds; a routine created through the API inherits every connector, so grant least privilege at creation | ICC L-095; RimModManager L-006; RMC 2026-08-19; passive income L-065; AI domain L-091 |
| safe-smokes | A test must never block on a modal or other user input, and a live check must not intrude on the user's desktop | RimModManager L-005, L-010 |
| prove-it-can-fail | A check whose reference state is frozen when written alarms on history; a gate never compares against evidence a later step produces; a red-proof restore by checkout reverts more than the mutation | AI domain L-092, L-145; passive income L-059 |
| preflight-unattended (hook) | A notification channel is proven end to end before a run relies on it; a dated duty is scheduled, never left to "the next session"; a confirmation gate is planned for when the operator is absent | ICC L-078, L-080; AI domain L-136 |
| one-real-ride | A deploy record names the tree it gated, so two waves on one base cannot be confused | AI domain L-103 |
| substantiate-outward-claims | A qualified claim that restates a contradiction is removed, not qualified | RMC 2026-08-11 |
| price-the-spend | An account-wide usage change is not attributed to one source without evidence (second instance) | ICC L-075 |

## Tier 3: project-level, not library

- **Trading (passive income):** units stated at every boundary (L-076), a constraint set composed at the account's operating point (L-073), a risk read reconciled against the fill that changed it (L-074). Strong rules for that project's own CLAUDE.md or a project skill; the library has no second trading project to prove them general.
- **Factorio Mods:** ghosts over eyeballed pins, placement rules before derived positions, side effects landing near the player, fluid-network priority. Project skill.
- **the-commission-game:** generated art drifting across a set. One instance; watch for a second.
- **AI domain L-098** (venue limits in the draft, not the send script) and **L-106** (a reply arriving beside the comment, not under it): folded into upgrades if a second instance appears.

## Rejected or already covered

- ICC L-045 (a secret printed by a shell expansion): covered since 20 September 2026 by the secret-echo-guard hook.
- ICC L-037 (a `[skip ci]` tip lands code without deploying): a project hook candidate (a commit-msg check), not a library skill.
- ICC L-061 (the integration suite right after `supabase db reset`), L-068 (the CLI's own login), AI domain L-125 (an antivirus naming a test script a trojan), L-092-class shell separators (ICC L-092): machine or project notes.

## Order proposed

Tier 1 items 1 and 2 first (the most recurrence, and money), then 4 and 3, then 5; the Tier 2 upgrades in one pass by skill. Each built skill gets the library's tests and its provenance line naming these entries.
