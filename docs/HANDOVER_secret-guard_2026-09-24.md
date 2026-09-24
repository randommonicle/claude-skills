# Handover: the jive review, a norms restore, and secret-echo-guard rule 4 (2026-09-24)

**Diagnoses in this note are unverified unless marked.**

**Context reading: none.** `/context` is unavailable in this harness (the desktop Code tab),
as the 2026-09-16 and 2026-09-21 notes also record. No compaction warning or summarisation
reminder arrived during the session, so this wrap-up is deliberate: Ben asked for everything
merged "so a fresh session can take over from anywhere".

## 1. Session goal

Assess github.com/merijjeyn/jive as raw material for a skill of our own, then act on what the
assessment surfaced: the Layer 1 norms missing on the home machine, and two defect classes in
`secret-echo-guard`'s rule 4.

## 2. Branch and worktree

`main` only. PR #1's branch `fix/secret-guard-pattern-position` is merged and deleted, locally
and on origin, and its worktree (`~/.claude/skills-wt/secret-guard-pattern`, placed outside the
repo on purpose) is removed. The home machine's `C:\Users\bengr\.claude\skills` was level with
`origin/main` at `dbfa55c` before this note's own commits, working tree clean. **verified**:
`git worktree list` shows one entry, `git ls-remote --heads origin` shows only `main`,
`git status -sb` shows `## main...origin/main`.

`feat/legal-fork` (local only, stale at `3f00487`) predates this session and was left alone.

## 3. What landed

PR: https://github.com/randommonicle/claude-skills/pull/1, merged 2026-09-24T21:51:03Z.

| sha | What | Status |
|---|---|---|
| `2488155` | The hook header and its `HOOKS.md` row name any script file run by name as a residual | **verified**: stdin probe, `echo "$SUPABASE_SERVICE_ROLE_KEY"` denied, `bash probe-phase.sh` holding the same line allowed, nothing executed |
| `b9512b5` | `docs/REVIEW_jive_2026-09-24.md`: jive not adopted, one rule parked as a candidate | **verified**: its citations table re-derived line by line |
| `ad04512` | Rule 4: a grep's pattern is text, not a file | **verified**: 224 PASS / 15 FAIL before, 239 / 0 after; 7 mutants caught |
| `fdc76b0` | Rule 4: quiet flags read per tool from each grep's own segment; twelve real leaks closed | **verified**: 245 / 13 before, 258 / 0 after; 6 mutants caught |
| `a6b0f54` | `secrets-in-output`'s copy of the residual list brought in step | **verified**: a census of the phrase across the repo |
| `b4701e8` | A recursive grep named as a residual in all three copies; `HOOKS.md` timing re-measured | **verified**: stdin probe; median of seven runs |
| `b0cc595` | Option tables checked against GNU grep 3.0 and ripgrep 14.1.1 `--help` | **verified**: 259 / 4 before, 263 / 0 after |
| `c403daf` | `LESSONS_LEARNED.md` entry 22 | **verified** |
| `e6d5e0f` | `.gitignore` ignores `.trash/` | **verified**: `git check-ignore -v` matches at `.gitignore:46`; a tracked file is unmatched |
| `dbfa55c` | The merge of PR #1, as a merge commit so every SHA cited above stays valid | **verified**: `gh pr view 1` reports MERGED |

**CI.** The PR's run on `e6d5e0f` (run 36063442912) had all four jobs green, **verified from the
full log, not the colour**: the guard suite printed 263 case PASS and 0 FAIL on Linux, the
`hooks` job passed 22 of 22 suites, `index` its 27 checks, and `hooks-windows` discovered 3
suites and passed them 14/14, 16/16 and 15/15.

**The live guard.** `settings.json` runs this checkout's hook file, so the fixes went live
with the fast-forward of `main`. **verified**: the command the guard denied live earlier that
day (`grep -n "process\.env from" .../secret-echo-guard.test.mjs`) now runs, and 43 stdin probes
against the live file give the same verdicts as the final branch code (23 deny, 20 allow).

**Machine-local, home machine only, not in git:**

- `~/.claude/CLAUDE.md` carried no Layer 1 norm block, and Ben confirmed that was not
  deliberate. Restored from `NORMS.md` as the file's last section, in its CRLF endings, the
  22 lines matching `NORMS.md` with line endings normalised; a rerun changed nothing, and a
  deliberately altered copy failed the same comparison. Backup at
  `~/.claude/CLAUDE.md.bak-2026-09-24`. **verified**.
- The project memory notes on the home machine. A session elsewhere will not see them; this
  note carries their substance.

## 4. In flight

Nothing. Everything is committed, merged and pushed.

## 5. Deferred items

- **The jive candidate rule**: when what follows each possible outcome is already known, put
  the branch in the script instead of spending a model turn on it, with the fence that a
  batched script never pushes, deploys, sends or reads a secret. Anchor:
  `docs/REVIEW_jive_2026-09-24.md`, section "Candidate record". Build it only once a
  `LESSONS_LEARNED.md` entry records its class.
- **`prove-it-can-fail` rule 8, widened from tests to gates and classifiers.** Anchor:
  `LESSONS_LEARNED.md` entry 22, the "Candidate amendment" sentence.
- **A chip that arrives without a worktree** (section 9). Anchor: the `FORWARD:` comment in
  `parallel-work-recon/SKILL.md`, section "Chips and spawned sessions".

## 6. Verification still outstanding

- **CI on `main` for this note's own push** (docs only) had not been read when the note was
  written.
- **The work machine** (`C:\Users\ben`): whether its `~/.claude/CLAUDE.md` carries the norm
  block is **unverified**; it cannot be reached from here. Its guard gets the rule 4 fixes
  with a `git pull`, because hooks run from the checkout.
- Carried from the 2026-09-21 note, section 6, **not re-verified this session**:
  `relay-cli-takeover`'s pre-flight guard is still unproven, and the moratorium on running
  that suite locally stands.

## 7. Blockers and open questions

- **For Ben:** a mechanical drift check for the norm block (for example `session-recon`
  comparing the block in `~/.claude/CLAUDE.md` with `NORMS.md` and printing one line on a
  mismatch), and a `LESSONS_LEARNED.md` entry for the missing block. Offered on 2026-09-24,
  not yet answered.
- Carried from the 2026-09-21 note, section 7, **not re-verified**: the owner-only claude.ai
  items (the `working-lean` upload and its eval results) and `b47e020` remaining retrievable
  by SHA.

## 8. Next actions

1. On any machine, before other work: `git -C ~/.claude/skills pull --ff-only`. A machine's
   guard has the rule 4 fixes only once its checkout contains `dbfa55c`.
2. On the work machine: `grep -c "BEGIN CLAUDE-SKILLS NORMS" ~/.claude/CLAUDE.md`. If it
   prints 0, paste the block from `NORMS.md`, markers included.
3. Answer the drift-check question in section 7.
4. Optional: delete the stale local `feat/legal-fork`, or re-point it with `git branch -f`
   before resuming that work.

## 9. Traps and working agreements

- **`secret-echo-guard` and `push-gate` read command text only.** A script file run by name
  is opaque to both (`hooks/push-gate.mjs` lines 13 to 15; the guard's header says the same).
  A script written to batch work must not push, deploy, send or read secrets.
- **A chip can arrive inside the spawning conversation with no worktree made for it.** This
  session's did. It created `~/.claude/skills-wt/secret-guard-pattern` itself, outside the
  repo so the main checkout's `git status` never listed it. Promoted as the `FORWARD:` anchor
  in section 5.
- **Windows path length.** Cloning a deep third-party repo under the session scratchpad
  failed with "Filename too long"; `git -c core.longpaths=true` on the one command fixed it.
  Clone to a short path.
- **A truncated sweep hid a line again.** `grep --help | grep NUM | head -5` cut off grep's
  `-NUM` entry, and only re-running without `head` found it. `blast-radius-grep`'s completion
  gate already names this; it is recorded as an instance, not a new rule.
- **Mutation search strings go stale.** After a later commit renamed a line, one mutant's
  search string matched nothing. The harness reported "HARNESS ... matched 0 times" instead of
  passing, which is the design working; re-run every mutation set on the final code.
- **The desktop app's skill sync writes `.trash/` into this repo's root.** Ignored since
  `e6d5e0f`; on a checkout without that commit, stage files by name.
- **Merge with a merge commit when commits have been cited by SHA.** Squash or rebase merging
  would orphan the citations in `LESSONS_LEARNED.md` and the review.

## Supersession

Nothing in `docs/HANDOVER_red-ci_2026-09-21.md` is made stale by this session. Its section 7
owner-only items are carried in section 7 above, marked not re-verified.
