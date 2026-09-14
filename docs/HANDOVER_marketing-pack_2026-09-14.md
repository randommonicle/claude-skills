# Handover: fire-log close-out and marketing pack install (2026-09-14, evening)

Diagnoses in this note are unverified unless marked. Context: no reading, /context
unavailable in this harness (Claude desktop app, Code tab). Band decision from harness
signals: no compaction or summarisation reminders seen; the session ended at Ben's request
("write up and do the handover") with every checkout clean and level with its upstream.
Supersedes the next-actions sections of `docs/HANDOVER_fire-log_2026-09-14.md` (stamped at
its head); that note's diagnosis and traps stand.

**Stamp, 2026-09-14 late evening, next session (`401a03c5`).** Check 1 ran and was refused.
Re-deriving the evening's evidence from the transcripts showed both of section 9a's loading
conclusions wrong: the `society:*` listing was captured mid-session with the junction in
place, and the icc-site sessions were launched in a stub folder, not "already open when the
pack was installed". Section 9b has the evidence and the citations; the junction is back;
DECISIONS, LESSONS 13 (correction stamp) and 14, `society/CLAUDE.md`, icc-site L-039 and
the 1f916 folder's CLAUDE.md and L-058 are re-corrected. Section 0's check 1 is closed
below. Checks 2 and 3 ran at 21:22Z in two auto-spawned icc-site task worktrees
(`seo-audit-localbusiness-schema-0451a5`, `booking-page-copy-review-2a2795`, both at
`3f8da11`, which carries the pack): the fire log holds `seo-audit` 21:22:38Z, `schema`
21:22:40Z, `copy-editing` 21:23:13Z, `cro` 21:23:14Z, `copywriting` 21:23:16Z, all with the
worktree cwd, so the icc-site loading path is proven through the Skill tool. Both `_v2`
files exist in the worktrees' `docs/`, not in the main checkout's. The v1 files they were
told to compare against are untracked in the main checkout's `docs/` and absent from the
worktrees, so the "differences" sections were written against the main checkout by absolute
path or not at all; Ben's pasted reports settle which. Outcome stamp to follow.

## 0. Start here, first thing next session

Three checks, in this order. They exist because the 2026-09-14 test run proved the pack's
content and not its loading path (section 9a, corrected in 9b): the two icc-site sessions
were refused by the Skill tool and produced their documents by reading the SKILL.md files
directly. Run these from **fresh** sessions, after the restart.

**Check 1, 1f916. Closed 2026-09-14 (section 9b).** Ran at 21:22Z in a fresh parent-folder
session with no junction: opening listing 84 skills, no pack, `society:seo-audit` refused
`Unknown skill`. Junction recreated 21:31Z; the same session then loaded bare `seo-audit`
at 21:34Z and was served the fourteen as bare names. The original prompt and pass criterion
(fourteen as `society:*`) were wrong in their premise and are not re-run. The cold-start
proof of the junction route already exists: both 1f916 test sessions opened with 98 skills,
pack unscoped, at 20:02Z and 20:03Z. Optional, for a line on the record only: a fresh
parent-folder session, first message "list the project skills available to you, names
exactly as you see them; do nothing else", expecting `seo-audit` and thirteen more bare
names in the opening listing.

**Checks 2 and 3, icc-site.** Launch a fresh session in
`C:\Users\bengr\Projects\ICC\icc-site` for each. These deliberately write `_v2` files rather
than overwriting the originals, so the two versions can be compared: same prompt, one run
without the skills loaded and one with. That comparison is itself worth having, because it
says whether invoking a skill properly produces materially different work from reading its
SKILL.md by hand.

Prompt 2, seo-audit and schema:

> First, list the project skills available to you from this repo's `.claude/skills/` (names
> only). Then call the `seo-audit` skill and tell me in one line whether it loaded or was
> refused with "Unknown skill"; do the same for `schema`. If either is refused, stop and
> report that, because it is the whole point of this run. If both load, carry on: use them,
> read-only on the code, to audit the site's technical and on-page SEO from the source under
> `site/` and to draft `LocalBusiness` JSON-LD from facts that exist in the code's
> business-facts source, writing "available on request" for any missing fact and inventing
> none. Write `docs/SEO_AUDIT_2026-09-14_v2.md`. Do not touch the existing
> `docs/SEO_AUDIT_2026-09-14.md`; when you have finished, read it and add a closing section
> naming the substantive differences between the two, if any. British English, no em dashes.
> Final pass `unslop-text`; `substantiate-outward-claims` over any claim. Do not commit or
> push. End with: the skill list, whether each Skill call loaded or was refused, files
> written, any hook `systemMessage` quoted, and the last five lines of
> `C:\Users\bengr\.claude\skills\FIRE_LOG.jsonl`.

Prompt 3, copy-editing and cro:

> First, list the project skills available to you from this repo's `.claude/skills/` (names
> only). Then call the `copy-editing` skill and tell me in one line whether it loaded or was
> refused with "Unknown skill"; do the same for `cro` and `copywriting`. If any is refused,
> stop and report that. If they load, carry on: review the customer-facing copy of the
> booking page (`site/src/pages/book.astro` and the chat flow strings it renders), using
> copy-editing for the prose and cro for the structure and conversion path. Write
> `docs/BOOKING_PAGE_COPY_REVIEW_2026-09-14_v2.md` with, per element, current text, proposed
> text, and one line of why. Do not touch the existing
> `docs/BOOKING_PAGE_COPY_REVIEW_2026-09-14.md`; when finished, read it and add a closing
> section naming the substantive differences. No new claims about the business, no
> statistics, no testimonials; anything that reads as a claim goes through
> `substantiate-outward-claims` and is cut if the repo cannot substantiate it. British
> English, no em dashes, no placeholder contact details. Final pass `unslop-text`. Do not
> edit the page, do not commit or push. End with the same report as prompt 2.

Paste the three reports back. If all three pass, the only things left from this session are
PR #313 and the second machine.

## 1. Session goal

Close the fire-log thread from the 09-14 morning handover (six decisions), then decide and
execute the marketingskills strip-and-use. Both done; one finding on the way (push-gate).

## 2. Branch and worktree

Four checkouts touched, all **verified** clean and level after `git fetch` at write time:

| Repo | Checkout | Branch | State |
|---|---|---|---|
| skills library | `C:\Users\bengr\.claude\skills` | `main` | level with `origin/main` at `3f00487` plus this note's commit |
| icc-site | `C:\Users\bengr\Projects\ICC\icc-site` | `main` | level at `7976d1c` |
| 1f916 | `C:\Users\bengr\Projects\AI domain and social network\society` | `main` | level at `780b2a13` |
| PropOS | worktree `C:\Users\bengr\Projects\PropOS\.claude\worktrees\marketing-pack` | `chore/marketing-pack` | level with its remote at `8b46fe9`; PR #313 open. The main checkout at `C:\Users\bengr\Projects\PropOS` is untouched, 86 behind origin, with untracked `.agents/ .codex/ AGENTS.md exchange/` |

Skills-repo side branches: `fix/skill-fire-log` deleted (fully merged); `feat/legal-fork`
moved onto `main` at `3f00487` (it has no commits of its own, **verified** `git rev-list
--count main..feat/legal-fork` = 0 before the move).

## 3. What landed

Skills library, pushed in two batches (**verified** `git log --oneline origin/main..main`
empty after each):

- `6c4e5ad..a44f75f` (8 commits): the fire-log fix and docs carried from the morning
  session (`5f07cb1`, `7a87c90`, `6a18da3`, `8688fa2`, `6dc65a9`, `951c2f3`), plus
  `aeb89f8` fix(hooks): push-gate matches git global options before push, and `a44f75f`
  docs: the four untracked notes committed, `.gitignore` widened to `FIRE_LOG*.jsonl`.
- `a44f75f..3f00487` (5 commits): `7703777` feat(hooks): install-marketing-pack;
  `b7c264d` DECISIONS third door; `1ba24e5` LF output regardless of source autocrlf;
  `955c50b` review outcome stamp; `3f00487` LESSONS 12 and the push-gate header comment.
- This note's commit: the note, the DECISIONS launch-directory sentence, the handover
  skill's "commit the note" paragraph.

Targets:

- icc-site `7976d1c` on `chore/marketing-skills-pack`, ff-merged to `main`, pushed
  `e3bd73a..7976d1c` (carrying 34 earlier unpushed commits of Ben's). Branch deleted.
- 1f916 `780b2a13`, same route, pushed `623d9eda..780b2a13`. Branch deleted.
- PropOS `8b46fe9` on `chore/marketing-pack`, pushed, PR #313 opened against `main` and
  bound to the session (**verified** via the app: 3 checks pending, 2 skipped, mergeable,
  blocked pending review, at open time).

Measured on the real pack (**verified**, installer output and a sha256 walk): 14 skills, 71
lines cut, 59 files, raw-byte identical across the three targets after the LF fix.

The fire-log side, all **verified** this session: `FIRE_LOG.jsonl` holds exactly two lines,
`verified-citations` at 18:41:01Z and `handover` at 19:55:52Z, both with the uppercase
`C:\Users\bengr\Projects\Unslop` cwd; `FIRE_LOG_DEBUG.jsonl` absent. Both halves of the
`Bash|PowerShell` matcher proven by `hook_success` rows in this session's transcript
(`~/.claude/projects/C--Users-bengr-Projects-Unslop/d7173cab-542b-4c9f-b7f1-b886b7151435.jsonl`,
`PreToolUse:Bash` at 18:41:17Z, `PreToolUse:PowerShell` at 18:53:39Z).

Outside any repo (machine-local, each with its undo):

- `~/.claude/settings.json`: full Layer 0 block, 10 command hooks. Pre-wiring copy
  `~/.claude/settings.json.bak_2026-09-14_pre-wiring`.
- `C:\Users\bengr\Projects\AI domain and social network\.agents\plugins\ash\hooks.json`:
  `view_file` row removed. Backup `hooks.json.bak_2026-09-14` beside it.
- `C:\Users\bengr\Projects\AI domain and social network\CLAUDE.md`: one paragraph appended
  under "## Style" (marketing pack rules). No backup; delete the paragraph to undo.
- Directory junction `C:\Users\bengr\Projects\AI domain and social network\.claude\skills`
  → `...\society\.claude\skills` (`mklink /J`; `rmdir` on the link removes only the link).
- `~/.claude/skills/FIRE_LOG.jsonl` quarantined as
  `FIRE_LOG_antigravity-junk_2026-08-10_to_2026-09-13.jsonl` (508 lines).
- Memory files rewritten: `fire-log-fix.md`, `marketingskills-review.md`,
  `windows-doc-toolchain.md`, and the `MEMORY.md` index.

## 4. In flight

Nothing half-written. PR #313 awaits CI and Ben's review; the worktree stays until merge,
matching the two worktrees already under `PropOS/.claude/worktrees/`.

## 5. Deferred items

- `lint-after-edit.test.mjs` red on Windows, 6 cases, pre-existing on `origin/main`.
  Anchor: FORWARD line in the test's header comment (planted 09-14 morning, `951c2f3`).
- 903 em dashes across 60 tracked files in the skills library (289 in
  `unslop-ui/references/design-reference-index.md`, 147 and 142 in two research docs). A
  sweep is its own decision; much of it is third-party-derived reference text. No anchor:
  the count is the anchor (`node -e` walk in this session's transcript, or re-run `git
  ls-files | xargs grep -c $'\u2014'` in a UTF-8 shell). Not a FORWARD candidate until Ben
  decides whether reference docs are in scope.
- Prose mentions of dropped skills inside installed pack files (outside Related Skills rows)
  are left as written; `UPSTREAM.md` in each target says so. Anchor: that sentence in
  `hooks/install-marketing-pack.mjs` `renderUpstream`, "Prose mentions of uninstalled skills
  outside those rows are left as written."
- The other machine needs the 1f916 junction; command in `society/CLAUDE.md`.
- Legal fork: unchanged since 09-11; resume from `docs/HANDOVER_legal-fork_2026-09-11.md`
  on `feat/legal-fork` (now on `main`, no fast-forward needed).

## 6. Verification still outstanding

- **The ride is half done.** 1f916 and PropOS rode clean on 2026-09-14 (four fresh sessions,
  six pack skills invoked through the Skill tool, fire-log lines with four distinct cwds).
  icc-site did not: both its sessions predated the install and were refused, so the pack has
  never been invoked from that repo. That is check 2 and check 3 in **section 0**, together
  with re-proving 1f916 now the junction is gone (check 1).
- PR #313 CI outcome (3 pending at open). The change is 60 markdown files and one
  CLAUDE.md bullet, so a red would be a workflow that lints or counts skills, not the pack.
- First `node hooks/audit-fires.mjs --repo <path>...` run with real data, after a few
  sessions have fired skills.
- The wired hooks other than fire-log and push-gate (`session-recon` on SessionStart,
  `lint-after-edit`, the three write-warns, `sql-surgery-warn`) have only had synthetic
  fail-open checks (`{}`, non-JSON, benign event, all exit 0). Their first real fires happen
  in Ben's next sessions; watch for a `systemMessage` from any of them.

## 7. Blockers and open questions

- PR #313: review and merge are Ben's.
- Em-dash sweep: in scope for reference docs or only for house prose? Undecided.
- `lint-after-edit` win32 red: fix the test's stub binaries (add `.cmd` shims) or mark the
  six cases skipped-on-win32 with a reason? Undecided; either is a small unit.

## 8. Next actions (ordered)

1. **Section 0, the three checks.** They are the first thing; everything below can wait.
2. On a refusal in any of them: a session's listing is fixed at start, so confirm the session
   really is fresh before anything else. Then, because the installer's output is
   deterministic, diff the target's `.claude/skills/<skill>/SKILL.md` against the pinned
   upstream, and check the launch directory against DECISIONS 2026-09-14.
3. Merge #313 on Ben's yes; then in the PropOS main checkout `git pull --ff-only` (0 ahead,
   **verified** at write time) and `git worktree remove .claude/worktrees/marketing-pack`.
4. On the other machine: `git pull` all three repos and the library, then wire
   `~/.claude/settings.json` from `hooks/HOOKS.md` "Install (per machine)". The 1f916
   junction **is** needed there (section 9b reversed 9a on this): the `mklink /J` command is
   in `society/CLAUDE.md`. The 1f916 parent folder's `CLAUDE.md` and `LESSONS_LEARNED.md`
   sit outside git, so that machine's copies do not carry L-058 or the pack paragraph; copy
   them across by hand if wanted, in their corrected form.
5. Legal fork, fresh session: `git checkout feat/legal-fork`, resume from its handover.
6. Decide the em-dash sweep scope and the lint-after-edit approach (section 7).

## 9. Traps and working agreements

- **Bypass-permissions sessions swallow a hook's "ask".** Proof that a gate fired is the
  `hook_success` row in the session transcript, never the UI; the harness records a row
  only when the hook produced output, so silence means "did not match", not "did not run".
  LESSONS 12.
- **Test a gate with the form the library recommends.** `git -C <path> push` is the
  `parallel-work-recon` idiom and it evaded the gate for as long as the gate existed. A new
  positive test case is run against the old pattern first; one of tonight's passed by
  accident (`.git push` inside an unquoted path). LESSONS 12.
- **Project skills load from the launch directory and its ancestors, never a subdirectory.**
  Check where sessions launch (`~/.claude/projects/<encoded-cwd>` names it) before
  installing anything into a repo's `.claude/skills/`. DECISIONS 2026-09-14.
- **Heredoc backslash trap, third session running.** The desktop harness's Bash tool
  collapses `\\` to `\` even with a quoted delimiter; single backslashes survive. Anything
  carrying `\\` goes through Write or Edit. Memory `windows-doc-toolchain`.
- **autocrlf ` M` artefact.** Rewriting tracked files with the other line ending makes
  `git status` list them modified while `git diff` is empty; the blob is identical
  (`git hash-object --path`), `git add` clears it. Memory `windows-doc-toolchain`.
- **Installed pack files carry upstream em dashes by design.** The no-em-dash hook flags
  `UPSTREAM.md` and the SKILL.md files on any in-place edit; the answer is not to edit
  them in place (the installer overwrites), so the flag is doing its job.
- **Quarantine before the ride, not after.** The morning note had the rename after the
  test invocation, which would have swept the one genuine line out with the junk.
- **Commit the handover before the session ends.** Four notes from three sessions sat
  untracked in `docs/` until tonight. Now in the handover skill, step 3.
- **Not pushed without a yes, and one yes covers one push.** Tonight's "yes to all"
  itemised each push before it was given.
- Money: nil this session. No paid calls; the previous session's clone of the pack
  survived in its scratchpad and was reused.

## 9a. Test run outcome (added the same evening, after the six prompts ran)

All six prompts ran; all six files exist and are house-rule clean (**verified**: zero em
dashes across the six, every figure carrying a file:line citation or an attribution, the
only apparent US spellings being the schema.org type name `Organization`).

**The loading half was compromised, informatively.** Four sessions were fresh and invoked
the pack through the Skill tool (**verified**, fire log and transcripts): `ai-seo`,
`product-marketing`, `society:content-strategy` in 1f916; `pricing`, `customer-research`,
`emails` in PropOS. The two icc-site sessions were already open when the pack was installed,
so their listings were stale and the Skill tool refused six times (**verified**, transcripts
`0d7887b6` and `36de68ba`: `Unknown skill: seo-audit`, `schema`, `copy-editing` three times).
Both read the SKILL.md files directly and produced the documents anyway. LESSONS 13.

**A decision made earlier in this session was wrong and is corrected.** The DECISIONS
sentence committed in `2bb59bc`, "project skills load from the launch directory and its
ancestors, never from a subdirectory", is false: transcript `2ee45744` line 148 carries a
listing of all 14 as `society:*`, discovered in the subdirectory and scoped by path. The
1f916 junction was therefore unnecessary and was removed (**verified**: link gone, target
intact at 16 entries). DECISIONS, `society/CLAUDE.md` and the parent folder's CLAUDE.md now
describe the scoped names instead. Ben re-tests from a fresh parent-folder session after a
restart; if the scoped names fail there, `mklink /J` stays in `society/CLAUDE.md` as the
fallback.

**Cleanup.** The PropOS prompts ran in two auto-spawned task worktrees
(`propos-pricing-model-draft-1ebec2`, `property-manager-research-demo-270674`) rather than
`marketing-pack`, with the needed skills copied in (**verified** byte-identical to the
committed ones). Those copies were deleted; both worktrees are back to 16 tracked skills and
0 untracked, their output documents untouched.

**Still outstanding after Ben restarts:** re-run prompts A and B in fresh icc-site sessions,
so the pack is exercised through the Skill tool rather than read off disk; and confirm the
scoped names load in 1f916 with no junction. The six output documents stand either way.

## 9b. Section 9a's two loading conclusions, re-derived (2026-09-14, late evening)

Written in the next session (`401a03c5`) after check 1 was refused. Everything here is
**verified** against the transcript files named, by a Python scan of each file's lines
(timestamps are the transcripts' own, UTC); the citations table at the end has the rows.
Section 9a is left as written above, as the record of what was concluded and why.

**The `society:*` listing was captured mid-session, with the junction in place.** The
junction was created at 19:16:28Z (`d7173cab` line 814) and removed at 20:56:57Z (line
1213). Both 1f916 test sessions launched between those times and opened with 98 skills, the
pack unscoped (`df64a87c` line 9, 20:02:46Z; `2ee45744` line 9, 20:03:42Z); `df64a87c`
invoked bare `ai-seo` at 20:03:11Z before touching any file. The listing of fourteen
`society:*` names in `2ee45744` is a `dynamic_skill` attachment at line 147 and the
`skill_listing` that follows it at line 148, both 20:13:18Z, in the second after the
session's first file-tool touch under `society/` (a `Write` to `society\docs\product-marketing.md`,
line 141, 20:13:17Z). `df64a87c` made the equivalent `Write` at line 252 (20:18:19Z) and
carries no `dynamic_skill` attachment anywhere. The first fresh parent-folder session with
no junction (`57894514`, 21:22:07Z) opened with 84 skills and was refused
`Unknown skill: society:seo-audit` (line 44, 21:22:54Z). So the line 9a cited was real and
did not show what 9a said; the correction in `40fc7e4` inverted the claim it corrected.

**The icc-site sessions were not "already open when the pack was installed".** The pack
was committed to icc-site at 19:15:18Z (`7976d1c`) and its files carry mtime 19:18:07Z.
Both test sessions started after that (`0d7887b6` 20:02:22Z, `36de68ba` 20:03:55Z), and
both started with working directory `C:\Users\bengr\OneDrive\Desktop\icc-site`, a stub
folder holding only a `.claude` directory from July with no `skills` inside (line 4 of each
transcript, `environment` attachment, `isGitRepo: false`). Each noticed, worked on
`C:\Users\bengr\Projects\ICC\icc-site` by absolute path, and called `change_directory` to it
(`0d7887b6` line 225, 20:08:45Z; `36de68ba` line 272, 20:13:54Z); the working directory
changed at 20:11:32Z and 20:14:55Z respectively, and a refusal followed each change
(`schema`, line 298, 20:11:57Z; `copy-editing`, line 300, 20:14:58Z). The launch directory
explains every refusal. Nothing in those sessions tested a mid-session install, and
LESSONS 13 and icc-site L-039 were written as if it had. Both now carry correction stamps.

**What was then observed after the junction went back (21:31:46Z, `401a03c5` line 129).**
The stale session `57894514`, whose opening listing had none of the pack, loaded bare
`seo-audit` at 21:34:35Z (line 59, result "Launching skill" at line 60) and was served the
fourteen as bare names (line 62). A skill directory appearing at the launch directory
mid-session can therefore be picked up; `change_directory` to a different directory was
not, twice. Both are recorded as observations in DECISIONS, not as rules.

**Net position.** From the parent folder the junction is required and the callable names
are bare. Subdirectory discovery and mid-session pickup exist, are inconsistent, and are
not relied on. The safe practice is unchanged: launch in the directory whose skills you
need, fresh session. It is practice, not a claimed harness rule. LESSONS 14 has the lesson.

## 10. Test prompts, two per project (the original set, all six run on 2026-09-14)

Kept as written, as the record of what was asked and because D, E and F are reusable. **To
run something next session, use section 0, not this section**: prompts A and B here are
superseded by section 0's checks 2 and 3, which additionally report whether the Skill call
loaded or was refused, and write `_v2` files so the two runs can be compared.

Each prompt is self-contained, paste it as the first message of a fresh session launched
from the directory named. Each writes a file rather than chat output, keeps the house
rules, and ends with a report to paste back here. Nothing commits or pushes.

### icc-site (launch in `C:\Users\bengr\Projects\ICC\icc-site`)

**Prompt A, seo-audit and schema:**

> Before anything else, list the project-level skills available to you from this repo's
> `.claude/skills/` (names only) and confirm `seo-audit` and `schema` are among them. If
> either is missing, stop and report what you see. Then, read-only on the code: use the
> seo-audit skill to audit the site's technical and on-page SEO from the source under
> `site/` (structure, metadata, headings, internal links, anything the skill checks that can
> be checked without a live crawl), and use the schema skill to draft `LocalBusiness`
> JSON-LD for the business using only facts that exist in the code's business-facts source;
> where a fact is missing write "available on request", never invent one. Write both to
> `docs/SEO_AUDIT_2026-09-14.md` with RAG findings. British English, no em dashes. Run
> `unslop-text` as the final pass on the prose and `substantiate-outward-claims` over any
> claim the JSON-LD or copy makes about the business. Do not commit or push. End with a
> report: the project skills listed at the start; every skill you invoked through the Skill
> tool, in order; files written; any `systemMessage` a hook sent you (quote it); and the
> last five lines of `C:\Users\bengr\.claude\skills\FIRE_LOG.jsonl`.

**Prompt B, copy-editing and cro on the booking page:**

> Before anything else, list the project-level skills available to you from this repo's
> `.claude/skills/` (names only) and confirm `copy-editing`, `cro` and `copywriting` are
> among them; if any is missing, stop and report. Then, read-only on the code: review the
> customer-facing copy of the booking page (`site/src/pages/book.astro`, and the chat flow
> strings it renders) using copy-editing for the prose and cro for the page structure and
> conversion path. Produce `docs/BOOKING_PAGE_COPY_REVIEW_2026-09-14.md` with, per element,
> the current text, the proposed text, and one line of why. No new claims about the
> business, no statistics, no testimonials; anything that reads as a claim goes through
> `substantiate-outward-claims` and is cut if it cannot be substantiated from the repo.
> Final pass `unslop-text`. British English, no em dashes, no placeholder contact details.
> Do not edit the page itself, do not commit or push. End with the same report as before:
> skills listed, skills invoked in order, files written, hook messages quoted, last five
> lines of `C:\Users\bengr\.claude\skills\FIRE_LOG.jsonl`.

### 1f916 (launch in `C:\Users\bengr\Projects\AI domain and social network`, the parent folder, so the junction is what gets tested)

**Prompt C, ai-seo agent-readiness:**

> Before anything else, list the project-level skills available to you (names only) and say
> which directory they were loaded from; confirm `ai-seo` is among them. If it is missing,
> stop and report: that means the `.claude\skills` junction in this folder did not load, and
> the report is the result. Then, read-only: using the ai-seo skill and its agent-readiness
> reference, assess whether the front-door document the Worker serves at `GET /`
> (`society/src/doc.ts`) is readable and citeable by AI agents and AI search: structure,
> plain-text discoverability, whether an `llms.txt` would help, what is missing. Write
> `society/docs/AI_SEO_ASSESSMENT_2026-09-14.md` with RAG findings and concrete edits, but
> change no source. British English, no em dashes. Final pass `unslop-text`. Do not commit
> or push. End with the report: skills listed and where from, skills invoked in order,
> files written, hook messages quoted, last five lines of
> `C:\Users\bengr\.claude\skills\FIRE_LOG.jsonl`.

**Prompt D, product-marketing hub:**

> Before anything else, list the project-level skills available to you (names only) and
> confirm `product-marketing` and `content-strategy` are among them; if either is missing,
> stop and report. Then, read-only on the repo: use the product-marketing skill to draft the
> positioning document from `society/README.md`, `society/src/doc.ts` and `docs/` in this
> folder. The skill writes `.agents/product-marketing.md` by default; write it to
> `society/docs/product-marketing.md` instead, and say so (the `.agents/` folder here belongs
> to an Antigravity plugin port). Then use content-strategy to propose five pieces of
> content that follow from that positioning, one paragraph each, appended to the same file.
> No statistics, no claims about adoption or performance; `substantiate-outward-claims` over
> anything that reads as a claim. British English, no em dashes. Final pass `unslop-text`.
> Do not commit or push. End with the report: skills listed, skills invoked in order, files
> written, hook messages quoted, last five lines of
> `C:\Users\bengr\.claude\skills\FIRE_LOG.jsonl`.

### PropOS (launch in `C:\Users\bengr\Projects\PropOS\.claude\worktrees\marketing-pack` until PR #313 merges; after the merge and a `git pull --ff-only` on main, launch in `C:\Users\bengr\Projects\PropOS`)

**Prompt E, pricing:**

> Before anything else, list the project-level skills available to you from this checkout's
> `.claude/skills/` (names only) and confirm both `pricing` and `propos-external-positioning`
> are among them; if either is missing, stop and report. Then, read-only, no app code and no
> database: use the pricing skill to draft a pricing model and pricing-page structure for
> PropOS as a product for RICS-regulated managing agents, informed by
> `propos-external-positioning` for who it is for. No invented prices, no invented customer
> numbers: every figure is "to be decided" and every comparison names its source or is cut.
> Write `docs/marketing/PRICING_DRAFT_2026-09-14.md`. British English, no em dashes (a
> PropOS always-on rule). Final pass `unslop-text`; `substantiate-outward-claims` over any
> claim about the product. Do not commit or push. End with the report: skills listed, skills
> invoked in order, files written, hook messages quoted, last five lines of
> `C:\Users\bengr\.claude\skills\FIRE_LOG.jsonl`.

**Prompt F, customer-research and emails:**

> Before anything else, list the project-level skills available to you from this checkout's
> `.claude/skills/` (names only) and confirm `customer-research` and `emails` are among
> them; if either is missing, stop and report. Then, read-only: use customer-research to
> draft an interview guide for property managers at a RICS-regulated firm evaluating PropOS
> (ten questions, grouped, with what each is trying to learn), and use the emails skill to
> draft a three-email sequence inviting a managing agent to a demo, each under 150 words.
> Write both to `docs/marketing/RESEARCH_AND_DEMO_SEQUENCE_2026-09-14.md`. No statistics,
> no named clients, no claims about outcomes; `substantiate-outward-claims` over anything
> that reads as a claim. British English, no em dashes. Final pass `unslop-text`. Do not
> commit or push. End with the report: skills listed, skills invoked in order, files
> written, hook messages quoted, last five lines of
> `C:\Users\bengr\.claude\skills\FIRE_LOG.jsonl`.

What the reports prove, read together: the skill list at the start shows what loaded and
from where (the junction, for 1f916); the invoked list shows description-matching picked
the pack skills for a marketing task; the fire-log tail shows the user-level hook firing in
three other projects with three other cwds; the hook messages show the em-dash gate and the
write-warns are live outside this project.

## Citations

| Claim | Path | Line | Quoted text | How verified |
|---|---|---|---|---|
| push-gate widened pattern | `hooks/push-gate.mjs` | 34 | `` new RegExp(String.raw`\bgit(?:\s+${GIT_GLOBAL_OPT})*\s+push\b`), `` | file shown in full after edit, 2026-09-14 |
| push-gate header names both tools | `hooks/push-gate.mjs` | 2 | `// PreToolUse hook, matcher: Bash\|PowerShell. Mechanical enforcement of confirm-before-push:` | `sed -n '2p'` after edit |
| junk log gitignored by glob | `.gitignore` | 4 | `FIRE_LOG*.jsonl` | `git check-ignore -v` on four names |
| Antigravity row was at 27 to 32 | `...\.agents\plugins\ash\hooks.json` (pre-edit) | 28 | `"matcher": "view_file",` | `cat -n` before deletion; `diff` against `.bak_2026-09-14` after |
| DECISIONS entry order | `DECISIONS.md` | 8 | `## 2026-09-14 Domain skill packs install per project, stripped` | `grep -n "^## "` |
| fire log line 1 | `~/.claude/skills/FIRE_LOG.jsonl` | 1 | `{"ts":"2026-09-14T18:41:01.958Z","skill":"verified-citations","args":null,"cwd":"C:\\Users\\bengr\\Projects\\Unslop"}` | `cat` at write time |
| fire log line 2 | `~/.claude/skills/FIRE_LOG.jsonl` | 2 | `{"ts":"2026-09-14T19:55:52.543Z","skill":"handover","args":null,"cwd":"C:\\Users\\bengr\\Projects\\Unslop"}` | `cat` at write time |
| skills push 1 | git | | `6c4e5ad..a44f75f  main -> main` | `git push` output |
| skills push 2 | git | | `a44f75f..3f00487  main -> main` | `git push` output |
| icc-site push | git | | `e3bd73a..7976d1c  main -> main` | `git push` output |
| 1f916 push | git | | `623d9eda..780b2a13  main -> main` | `git push` output |
| PropOS PR | GitHub | | `https://github.com/randommonicle/PropOS/pull/313` | `gh pr create` output; `ccd_pr get_status` |

Rows added for section 9b (2026-09-14 late evening). Transcript paths are under
`~/.claude/projects/`: `U` = `C--Users-bengr-Projects-Unslop/`, `P` =
`C--Users-bengr-Projects-AI-domain-and-social-network/`, `I` = `C--Users-bengr-Projects-ICC-icc-site/`.
"Quoted text" is the JSON field the claim rests on; all read by `json.loads` of that line.

| Claim | Path | Line | Quoted text | How verified |
|---|---|---|---|---|
| junction created | `U/d7173cab-…jsonl` | 814 | `"timestamp":"2026-09-14T19:16:28.346Z"`, PowerShell input begins `$parent = "C:\Users\bengr\Projects\AI domain and social netw` | Python scan, 2026-09-14 |
| junction removed | `U/d7173cab-…jsonl` | 1213 | `"timestamp":"2026-09-14T20:56:57.454Z"`, PowerShell input begins `$link = "C:\Users\bengr\Projects\AI domain and social network\.claude\skills"` | Python scan |
| df64a87c opened with the pack unscoped | `P/df64a87c-…jsonl` | 9 | `"timestamp":"2026-09-14T20:02:46.420Z"`, `skill_listing`, 98 entries, one `- ai-seo` | Python scan |
| df64a87c invoked bare ai-seo before any file tool | `P/df64a87c-…jsonl` | 41 | `"timestamp":"2026-09-14T20:03:11.910Z"`, Skill input `"skill":"ai-seo"` | Python scan; no Read/Write/Edit/Glob/Grep before line 41 |
| df64a87c Write under society, no dynamic_skill | `P/df64a87c-…jsonl` | 252 | `"timestamp":"2026-09-14T20:18:19.161Z"`, Write `…\society\docs\AI_SEO_ASSESSMENT_2026-09-14.md` | Python scan; `"dynamic_skill"` absent from all 435 lines |
| 2ee45744 opened with the pack unscoped | `P/2ee45744-…jsonl` | 9 | `"timestamp":"2026-09-14T20:03:42.579Z"`, `skill_listing`, 98 entries | Python scan |
| 2ee45744 first file-tool touch under society | `P/2ee45744-…jsonl` | 141 | `"timestamp":"2026-09-14T20:13:17.973Z"`, Write `…\society\docs\product-marketing.md` | Python scan; lines 1 to 140 hold Bash and Skill tool uses only |
| the `society:*` discovery event | `P/2ee45744-…jsonl` | 147 | `"timestamp":"2026-09-14T20:13:18.878Z"`, `"type":"dynamic_skill"`, `skillDir` `…\society\.claude\skills`, 14 names | Python scan |
| the line 9a cited | `P/2ee45744-…jsonl` | 148 | `"timestamp":"2026-09-14T20:13:18.878Z"`, `skill_listing` beginning `- society:ai-seo: Wh` | Python scan |
| check 1 fresh, no pack | `P/57894514-…jsonl` | 9 | `"timestamp":"2026-09-14T21:22:07.698Z"`, `skill_listing`, 84 entries | Python scan |
| check 1 refused | `P/57894514-…jsonl` | 44 | `"timestamp":"2026-09-14T21:22:54.872Z"`, `<tool_use_error>Unknown skill: society:seo-audit</tool_use_error>` | Python scan |
| junction recreated | `U/401a03c5-…jsonl` | 129 | `"timestamp":"2026-09-14T21:31:46.789Z"`, PowerShell | Python scan of this session's own transcript |
| stale session loaded bare seo-audit | `P/57894514-…jsonl` | 59, 60 | `"timestamp":"2026-09-14T21:34:35.643Z"` Skill `"skill":"seo-audit"`; result `Launching skill: seo-audit` | Python scan |
| stale session served fourteen bare names | `P/57894514-…jsonl` | 62 | `"timestamp":"2026-09-14T21:34:35.659Z"`, `skill_listing` beginning `- ai-seo: Wh`, 14 entries | Python scan |
| icc-site pack commit time | icc-site git | | `7976d1c … 2026-09-14 20:15:18 +0100 chore: marketing skills pack` | `git log -1 --format='%H %ci %s' 7976d1c` |
| icc-site pack file mtime | `icc-site/.claude/skills/seo-audit/SKILL.md` | | `2026-09-14 20:18:07.346937000 +0100` | `stat -c '%y %n'` |
| 0d7887b6 launched in the stub | `I/0d7887b6-…jsonl` | 4 | `"timestamp":"2026-09-14T20:02:22.366Z"`, `"workingDirectory":"C:\Users\bengr\OneDrive\Desktop\icc-site"`, `"isGitRepo":false` | Python scan |
| 0d7887b6 switched directory | `I/0d7887b6-…jsonl` | 225 | `"timestamp":"2026-09-14T20:08:45.233Z"`, `mcp__ccd_directory__change_directory` path `C:\Users\bengr\Projects\ICC\icc-site` | Python scan |
| 0d7887b6 working directory changed | `I/0d7887b6-…jsonl` | 289 | `"timestamp":"2026-09-14T20:11:32.946Z"`, `"workingDirectory":"C:\Users\bengr\Projects\ICC\icc-site"` | Python scan |
| 0d7887b6 refused after the change | `I/0d7887b6-…jsonl` | 298 | `"timestamp":"2026-09-14T20:11:57.586Z"`, `<tool_use_error>Unknown skill: schema</tool_use_error>` | Python scan |
| 36de68ba launched in the stub | `I/36de68ba-…jsonl` | 4 | `"timestamp":"2026-09-14T20:03:55.325Z"`, `"workingDirectory":"C:\Users\bengr\OneDrive\Desktop\icc-site"`, `"isGitRepo":false` | Python scan |
| 36de68ba switched directory | `I/36de68ba-…jsonl` | 272 | `"timestamp":"2026-09-14T20:13:54.377Z"`, `mcp__ccd_directory__change_directory` path `C:\Users\bengr\Projects\ICC\icc-site` | Python scan |
| 36de68ba working directory changed | `I/36de68ba-…jsonl` | 295 | `"timestamp":"2026-09-14T20:14:55.083Z"`, `"workingDirectory":"C:\Users\bengr\Projects\ICC\icc-site"` | Python scan |
| 36de68ba refused after the change | `I/36de68ba-…jsonl` | 300 | `"timestamp":"2026-09-14T20:14:58.654Z"`, `<tool_use_error>Unknown skill: copy-editing</tool_use_error>` | Python scan |
| the stub has no skills directory | `C:\Users\bengr\OneDrive\Desktop\icc-site` | | `ls -la` shows `.claude` (Jul 19) only; `ls .claude/skills`: `No such file or directory` | `ls -la`, `ls` |
| icc-site L-039 pushed | icc-site git | | `3f8da11 2026-09-14 22:10:21 +0100 docs: L-039, a skill installed mid-session is invisible to open sessions` | `git show --stat --format='%h %ci %s' 3f8da11`; `git status -sb` level with origin |
