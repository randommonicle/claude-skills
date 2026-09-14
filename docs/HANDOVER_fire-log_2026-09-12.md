# Handover: fire-log fix, skills review, delegate eval (2026-09-12)

> **Superseded 2026-09-14.** The fire-log diagnosis in sections 4, 5, 6 and 8 was wrong:
> the nameless lines were Antigravity `view_file` events through a wrapper, not a Claude
> Code auto-activation class, and there was no key to discover. Current truth:
> LESSONS_LEARNED entry 11 postscript, and the fire-log-fix memory file. The legal-fork
> carry-forward (section 4, last bullet) still stands.

Diagnoses in this note are unverified unless marked. No context reading; /context
unavailable in this harness (Claude desktop app, Code tab). Band decision made from
harness signals: no compaction/summarisation reminders seen this session, work paused at a
clean committed checkpoint at the user's request ("pick this up later").

## 1. Session goal

Three things in sequence: (a) review the external repo `github.com/krzysztofradomski/skills`
for fit in the ASH skills library, especially the `delegate` multi-agent skill; (b) review
the skills library for anything to change/update/add; (c) fix the broken `skill-fire-log`
hook and salvage what fire data could be recovered.

## 2. Branch and worktree

- Repo: `C:\Users\bengr\.claude\skills`. No non-standard worktree.
- Current branch: **`feat/legal-fork`** (the legal-fork work, separate, untouched this session).
- The fire-log fix is on **`fix/skill-fire-log`**, branched off `origin/main`.
- **Verified** (2026-09-12, `git rev-list`): `feat/legal-fork` is 1 behind / 0 ahead of
  `origin/main` (missing LICENSE commit `6c4e5ad`). `fix/skill-fire-log` is 2 ahead / 0
  behind `origin/main`, and **not pushed**.

## 3. What landed

- `fix/skill-fire-log` `5f07cb1` **fix(hooks): skill-fire-log captures event shape instead
  of silently logging 'unknown'**. **Verified**: `git show 5f07cb1` = 3 files
  (`hooks/skill-fire-log.mjs`, `hooks/skill-fire-log.test.mjs`, `.gitignore`); test passes
  all 6 cases; `check-index.mjs` green (43 skills).
- `fix/skill-fire-log` `7a87c90` **docs(lessons): entry 11**. **Verified** present.
- Both commits are **not pushed and not merged** (confirm-before-push, per-action).
- Memory written (this session): `memory/delegate-cli-eval.md`, `memory/fire-log-fix.md`,
  and `memory/MEMORY.md` index updated. **Verified** written.
- Salvage artifact `~/.claude/skills/FIRE_LOG_RECONSTRUCTED.jsonl` (199 lines, gitignored).
  **Verified**: produced and consumed by `audit-fires.mjs --fire-log`.

## 4. In flight

- **`fix/skill-fire-log` unmerged, unpushed.** To adopt: fast-forward `main` to
  `origin/main`, then ff-merge `fix/skill-fire-log`, then push (user's call).
- **Auto-activation payload key unknown.** `hooks/skill-fire-log.mjs:22-34` (`readSkillName`)
  reads `tool_input.skill` plus alternates; the dominant event class (auto-activations) uses
  a key not derivable from disk. The self-diagnosing capture writes the real shape to
  `FIRE_LOG_DEBUG.jsonl` on the first wired fire; the key then goes into `readSkillName`.
- Legal fork (`feat/legal-fork`) still in flight per `docs/HANDOVER_legal-fork_2026-09-11.md`,
  untouched this session. That handover is **not** superseded by this one.

## 5. Deferred items

- **Wiring the hook.** In-code grep anchor: `hooks/skill-fire-log.mjs:13`
  ("once the true key is known, add it to readSkillName"). Config anchor: `hooks/HOOKS.md`
  install block. No code FORWARD marker planted (it is a config/settings decision, not a code site).
- **Reconstruction script** lives in the session scratchpad
  (`...\scratchpad\reconstruct-fires.mjs`), not committed. Move into the repo if you want it kept.
- **Real test fixture** for the auto-activation shape deferred until `FIRE_LOG_DEBUG.jsonl`
  captures one live (see §6).

## 6. Verification still outstanding

- **One real wired run** (one-real-ride): wire the hook, run a session, confirm
  `FIRE_LOG.jsonl` gains named lines AND `FIRE_LOG_DEBUG.jsonl` captures the auto-activation
  shape. Not done; the hook is currently unwired.
- After that capture: add the real key to `readSkillName` and a real fixture to
  `skill-fire-log.test.mjs` (the current red case is a synthetic shape-less event).

## 7. Blockers and open questions

- **Wiring choice (user's call):** direct-clone `settings.json` block per `hooks/HOOKS.md`,
  OR reinstall the `ash` plugin (which also re-arms `push-gate`). Choose one; the README
  warns never both.
- **Delegate adoption: parked** (see `memory/delegate-cli-eval.md`). Needs `agy`+`codex`
  CLIs (absent on this box) and a Windows port. Revisit only if committing to those CLIs.

## 8. Next actions (ordered)

1. Review the fix: `git -C ~/.claude/skills diff origin/main fix/skill-fire-log`.
2. Adopt: catch `main` up to `origin/main`, ff-merge `fix/skill-fire-log`, push (your call).
3. Decide and apply wiring (settings.json block or plugin reinstall).
4. Run one wired session; read `FIRE_LOG_DEBUG.jsonl`; add the auto-activation key to
   `readSkillName`; add the real test fixture.
5. Separately: rebase `feat/legal-fork` onto `origin/main` (1 behind) before resuming the
   legal fork.

## 9. Traps and working agreements

- **The fire log is UNWIRED right now.** Verified: no `~/.claude/plugins`, no Skill hook in
  `~/.claude/settings.json`, no hooks block in the AI-domain project. Nothing is being
  measured until wiring is chosen.
- **Local was behind `origin/main` all session** (`feat/legal-fork` still 1 behind). Probe
  live state (`git fetch`) before trusting branch positions; do not build legal-fork on the
  stale base.
- **findings-are-evidence bit twice this session** (both caught): a wrong "count drift"
  claim, retracted by running `check-index.mjs`; and the field-bug had two rival causes
  (i wrong-field vs ii auto-activations), resolved only by a to-the-second transcript join.
  Re-derive from the user's own tooling/primary source before asserting.
- **Not pushed.** confirm-before-push is per-action; the fix stays local until you say push.
- Money n/a this session.
