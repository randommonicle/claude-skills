# Handover: fire-log close-out and marketing pack install (2026-09-14, evening)

Diagnoses in this note are unverified unless marked. Context: no reading, /context
unavailable in this harness (Claude desktop app, Code tab). Band decision from harness
signals: no compaction or summarisation reminders seen; the session ended at Ben's request
("write up and do the handover") with every checkout clean and level with its upstream.
Supersedes the next-actions sections of `docs/HANDOVER_fire-log_2026-09-14.md` (stamped at
its head); that note's diagnosis and traps stand.

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

- **The two real rides, Ben's to run** (section 10 has the prompts): a session in icc-site
  invoking a pack skill (proves the pack loads from a repo's `.claude/skills/`, and gives the
  fire log a line with a different cwd); a session from the 1f916 parent folder (proves the
  junction loads). PropOS can be ridden from the worktree now, or from the main checkout
  after #313 merges and `main` is pulled.
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

1. Ben runs the six prompts in section 10 (or a subset) and pastes each session's closing
   report plus the tail of `~/.claude/skills/FIRE_LOG.jsonl` back into a session here.
2. On a red or a missing skill in any ride: the installer's output is deterministic, so
   diff the target's `.claude/skills/<skill>/SKILL.md` frontmatter against the pinned
   upstream first, then check the launch directory (DECISIONS 2026-09-14, last paragraph).
3. Merge #313 on Ben's yes; then in the PropOS main checkout `git pull --ff-only` (0 ahead,
   **verified** at write time) and `git worktree remove .claude/worktrees/marketing-pack`.
4. On the other machine: `git pull` all three repos and the library; create the 1f916
   junction; wire `~/.claude/settings.json` from `hooks/HOOKS.md` "Install (per machine)".
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

## 10. Test prompts, two per project

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
