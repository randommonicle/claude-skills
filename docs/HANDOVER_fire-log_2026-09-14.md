# Handover: fire-log fix (diagnosis corrected) and marketingskills review (2026-09-14)

> **Closed out 2026-09-14, evening session** (Claude desktop, Code tab; `/context` unavailable,
> no percentage). Ben answered all six section-7 decisions: 1 yes, 2 full Layer 0, 3 yes, 4 yes,
> 5 and 6 proceed this session (their outcome goes in the marketing review doc, not here).
> Items 1 to 4 as executed:
>
> - **Order corrected: quarantine, then wire, then ride.** Section 8 step 4 had the rename after
>   the ride, which would have swept the one genuine line out with the junk. `FIRE_LOG.jsonl`
>   renamed to `FIRE_LOG_antigravity-junk_2026-08-10_to_2026-09-13.jsonl` (508 lines, first
>   `ts` 2026-08-10T21:00:38Z, last 2026-09-13T13:27:07Z). `.gitignore` line 4 is now
>   `FIRE_LOG*.jsonl`; the two exact rows it made redundant are dropped.
> - **Wired.** Full Layer 0 block, 10 command hooks in 5 groups, installed in
>   `~/.claude/settings.json` from last session's `settings.proposed.json`. Pre-wiring copy at
>   `~/.claude/settings.json.bak_2026-09-14_pre-wiring`. Fail-open checked first: all eight
>   hooks exit 0 on `{}`, on non-JSON, and on a benign Bash event.
> - **The ride passed.** One `Skill` call (verified-citations) in the same session; the file
>   watcher picked the settings up. `FIRE_LOG.jsonl` holds exactly one line,
>   `{"ts":"2026-09-14T18:41:01.958Z","skill":"verified-citations","args":null,"cwd":"C:\\Users\\bengr\\Projects\\Unslop"}`,
>   uppercase `C:`; `FIRE_LOG_DEBUG.jsonl` absent.
> - **`Bash|PowerShell` matcher proven on both tools** by harness-recorded `hook_success` rows in
>   this session's transcript: `PreToolUse:Bash` at 18:41:17Z and `PreToolUse:PowerShell` at
>   18:53:39Z, both `permissionDecision: "ask"`. A bypass-permissions session auto-approves the
>   ask and shows nothing, so the transcript is the only proof surface; HOOKS.md install check
>   amended to say so and to use `git push --dry-run`.
> - **Finding on the way: `git -C <path> push` evaded the gate.** The bare `\bgit\s+push\b`
>   ignored git global options between the words, and `git -C` is the form parallel-work-recon
>   mandates. The first PowerShell dry-run used that form and left no hook record; that is how it
>   surfaced. Fixed in `aeb89f8`: four positive cases, each proven quiet on the committed original,
>   three negative controls, 15/15. Ben approved it as an extra commit before the push.
> - **Antigravity `view_file` row deleted** from
>   `C:\Users\bengr\Projects\AI domain and social network\.agents\plugins\ash\hooks.json`
>   (the block at lines 27 to 32, `"matcher": "view_file"`); backup beside it as
>   `hooks.json.bak_2026-09-14`. JSON re-validated; the lint-after-edit row stays.
> - Docs commit and push: the commit carrying this stamp, then `git log origin/main`.
>
> Still deferred: the `lint-after-edit.test.mjs` win32 red (section 5, unchanged), and 903 em
> dashes across 60 tracked files (the no-em-dash hook flagged HOOKS.md's four pre-existing ones
> during this session's edit; a sweep is its own decision, not folded in here).

Diagnoses in this note are unverified unless marked. Context: no reading, /context
unavailable in this harness (Claude desktop app, Code tab). Band decision from harness
signals: no compaction or summarisation reminders seen; the session ended at the user's
request ("time for bed") at a committed checkpoint. Supersedes
`docs/HANDOVER_fire-log_2026-09-12.md` (stamped), except its legal-fork carry-forward.

## 1. Session goal

Resume the 2026-09-12 handover (adopt the fire-log fix, wire the hook, learn the
"auto-activation" payload key), and review `github.com/coreyhaines31/marketingskills`
for strip-and-use. The first goal changed shape: the key does not exist (section 3).

## 2. Branch and worktree

- Repo `C:\Users\bengr\.claude\skills`, no worktree.
- **`main` is checked out, deliberately**: hooks run whatever file is on disk, and only
  `main` carries the fixed `hooks/skill-fire-log.mjs`. Keep it there until the other
  branches are current.
- **Verified** (`git status -sb`, `git branch -v`, 2026-09-14): `main` is 6 ahead / 0
  behind `origin/main`, **not pushed**. `fix/skill-fire-log` and `feat/legal-fork` both
  sit at `8688fa2`, two commits behind `main` (`951c2f3`). `feat/legal-fork` has no
  commits of its own (**verified** `git rev-list --count main..feat/legal-fork` = 0 before
  it was moved with `git branch -f`).
- Untracked: `docs/HANDOVER_fire-log_2026-09-12.md`, `docs/HANDOVER_legal-fork_2026-09-11.md`,
  `docs/REVIEW_marketingskills_2026-09-14.md`, this note.

## 3. What landed

All six commits **verified** by `git log --oneline origin/main..main`:

- `5f07cb1` fix(hooks): shape capture (carried from 09-12).
- `7a87c90` docs(lessons): entry 11 (carried from 09-12).
- `6a18da3` fix(hooks): fire line only when `tool_name === 'Skill'`; `tool_input.skill`
  is the only name source; unreadable shapes captured once per (reason, tool_name) to
  `FIRE_LOG_DEBUG.jsonl`. **Verified**: `node hooks/skill-fire-log.test.mjs` 9/9 pass;
  the same test against the `origin/main` hook fails 4 cases, the first reproducing the
  508-line class.
- `8688fa2` docs(hooks): LESSONS 11 corrected in place plus a postscript; HOOKS.md
  install block moved from `%USERPROFILE%` (cmd.exe syntax, expands in neither Git Bash
  nor PowerShell) to `$USERPROFILE/...` with `"shell": "bash"`. **Verified**: the block
  parses as JSON; `node hooks/check-index.mjs` green, 43 skills.
- `6dc65a9` docs(hooks): command-hook matcher `Bash|PowerShell`. **Verified**: block
  parses; `push-gate.mjs:78` and `sql-surgery-warn.mjs:119` both read
  `evt.tool_input?.command`, which the PowerShell tool also carries.
- `951c2f3` test(hooks): FORWARD anchor in `hooks/lint-after-edit.test.mjs` for the win32
  red (section 5). **Verified**: `node --check` passes; five comment lines, no code change.

The corrected diagnosis, **verified** three ways: piping
`{"cwd":"c:/Users/bengr/Projects/AI domain and social network","tool_input":{}}` into the
original hook writes a line identical field for field to the real log; all 508 lines carry
the Antigravity wrapper's lowercase `c:/` cwd and 0 carry Claude Code's `C:` (`grep -c`);
the log's first line (2026-08-10T21:00Z) is 18 minutes after
`...\.agents\plugins\ash\hooks.json` was written (21:42 BST). The producer is that file's
`PostToolUse / view_file` row through `agy-wrapper.mjs`, which builds `tool_input: {}` for
anything but `run_command` and the write tools. The Claude Code side was never wired on
this machine (**verified**: no `hooks` key beyond prettier and em-dash in
`~/.claude/settings.json`, no `~/.claude/plugins`).

Outside the repo: memory files `fire-log-fix.md` (rewritten), `marketingskills-review.md`
(new), `MEMORY.md` index (updated). The old handover is stamped superseded at its top.

## 4. In flight

- **Wiring, not applied.** Two ready files were staged in the session scratchpad
  (`settings.proposed.json` = full Layer 0 block, `settings.fire-log-only.json`, plus
  `settings.backup.json`), path
  `C:\Users\bengr\AppData\Local\Temp\claude\C--Users-bengr-Projects-Unslop\bbda9311-6ddf-477a-bcba-77855a1358f6\scratchpad\`.
  Scratchpads are session-scoped and may be gone; if so, regenerate from the install
  block at `hooks/HOOKS.md` ("Install (per machine)") appended into the existing
  `PostToolUse` group `Write|Edit|MultiEdit` (prettier and em-dash hooks stay).
- **Marketing pack: nothing built.** The review doc is the whole state
  (`docs/REVIEW_marketingskills_2026-09-14.md`): verdict, 12-skill keep list, drop list,
  five-step strip recipe, two flags, four open decisions.

## 5. Deferred items

- `lint-after-edit.test.mjs` red on Windows: 6 "should fire" cases, **verified**
  identical on the pristine `origin/main` copy, so pre-existing. The stub binaries the
  test writes to `node_modules/.bin` are extensionless shell scripts; `spawnSync` on
  win32 cannot execute them, while the hook itself tries `.cmd` first
  (`hooks/lint-after-edit.mjs:116-118`). Anchor: FORWARD line in the test's header
  comment, `hooks/lint-after-edit.test.mjs` (planted this session).
- Install script `scripts/install-marketing-pack.mjs`: not built until the keep list is
  confirmed. No code site exists; anchor is the review doc, "Strip recipe", last paragraph.
- DECISIONS.md "third door" (domain packs per project, stripped, with UPSTREAM.md; never
  user-level, never in this library): anchor is the review doc, "Open decisions", item 4.
- Antigravity port's `view_file` row: config outside any repo
  (`C:\Users\bengr\Projects\AI domain and social network\.agents\plugins\ash\hooks.json`).
  Anchor: `hooks/HOOKS.md`, "Plugin machines" section, Antigravity paragraph.

## 6. Verification still outstanding

- **The one real ride, not run** (the hook is unwired). After the settings land: invoke
  any skill in a session; `~/.claude/skills/FIRE_LOG.jsonl` must gain a line naming it
  with an uppercase `C:` cwd, and `FIRE_LOG_DEBUG.jsonl` must not appear. If this
  harness's `tool_name` is not exactly `Skill`, the debug file is where that shows; check
  both files. Settings edits are picked up mid-session by the file watcher (Claude Code
  hooks docs, read 2026-09-14), so the ride can run in the same session that wires it.
- A `git push` issued through the PowerShell tool should raise the push-gate ask,
  proving the `Bash|PowerShell` matcher.

## 7. Blockers and open questions

Six decisions were put to Ben at 01:10 BST and not answered before the session ended.
Recommendation first on each:

1. Push `main` (6 commits). Recommend yes.
2. Wire `~/.claude/settings.json`: full Layer 0 block (recommended) or fire-log-only.
3. Remove the `view_file` row from the Antigravity port's `hooks.json`. Recommend yes.
4. Quarantine `~/.claude/skills/FIRE_LOG.jsonl` (rename aside). Recommend yes:
   `audit-fires.mjs` has no special case for `'unknown'` (**verified** grep), so the
   first audit after wiring would show a skill named "unknown" with 508 fires.
   `FIRE_LOG_RECONSTRUCTED.jsonl` (199 named lines from transcripts) is the real history.
5. Marketing: confirm or edit the 12-skill keep list, name the target repos, script or
   one-off copy.
6. DECISIONS.md third-door entry.

## 8. Next actions (ordered)

1. `git -C "C:\Users\bengr\.claude\skills" fetch` and confirm `main` is still 6 / 0
   against `origin/main` before anything else.
2. Get the six answers in section 7.
3. On (1): push `main`.
4. On (2): write the settings file, run the section 6 ride, then on (4) rename
   `FIRE_LOG.jsonl` aside.
5. On (3): delete the `view_file` block from the Antigravity `hooks.json`.
6. Commit the three untracked docs (two handovers, the review) as one docs commit.
7. On (5): build the script or copy by hand per the review's strip recipe; add the two
   CLAUDE.md lines in each target repo (unslop-text final pass; substantiate-outward-claims
   in front).
8. Legal fork: `git checkout feat/legal-fork` (it now sits on the current base, two behind
   `main` by docs-only commits; `git merge --ff-only main` first) and resume from
   `docs/HANDOVER_legal-fork_2026-09-11.md`.

## 9. Traps and working agreements

- **Search `.agents/` as well as `.claude/`.** The Antigravity port lives beside the
  project, outside git, and the 09-12 search of `~/.claude` and the repo missed it.
  A diagnosis whose next step is "wire it and wait for the shape" has not found its
  evidence yet (LESSONS 11 postscript).
- **Hook commands run under Git Bash on Windows.** `%USERPROFILE%` is dead syntax;
  `$USERPROFILE/` expands (**verified** `bash -c 'echo $USERPROFILE'` prints
  `C:\Users\bengr`) and node accepts the mixed-separator path.
- **This harness's Bash heredoc collapses `\\` to `\` even with a quoted delimiter**
  (bit twice this session: a template literal and a JSON-escaped match string). Write
  any script carrying backslashes with the Write tool, then run it.
- **The checked-out branch decides which hook is live.** Do not resume `feat/legal-fork`
  without fast-forwarding it to `main` first.
- **Not pushed.** confirm-before-push is per-action; nothing left this machine.
- **findings-are-evidence**, third bite on this thread. Re-derive from the primary
  source before writing a cause into code comments or LESSONS.
- Money: nil this session (no paid calls beyond the session itself; one shallow clone).
