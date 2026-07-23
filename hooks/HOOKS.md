# Layer 0 hooks — definitions and per-machine install

The deterministic layer of the orchestration architecture (see
docs/SKILL_PROPOSALS_2026-07-23.md). The scripts live in this directory and are tracked;
the wiring lives in each machine's `~/.claude/settings.json`, which is not tracked — so
install on every machine, per below. All mechanics verified against the Claude Code docs
on 2026-07-23 (see the proposal doc's mechanics table).

## The hooks

| Script | Event / matcher | Behaviour | Failure mode |
|---|---|---|---|
| `push-gate.mjs` | PreToolUse / Bash | `git push`, `gh pr merge`, remote ref deletion → `permissionDecision: "ask"` (forces the per-action prompt; mechanises confirm-before-push) | fail-closed for matched commands; exits 0 on script error (skill is the backstop) |
| `skill-fire-log.mjs` | PostToolUse / Skill | appends one JSONL line per skill invocation to `~/.claude/skills/FIRE_LOG.jsonl` (the rating system's measurement arm) | fail-open |
| `sql-surgery-warn.mjs` | PreToolUse / Bash | logs commands carrying `DELETE FROM` / `TRUNCATE` / `DROP TABLE` to `~/.claude/skills/SURGERY_LOG.jsonl` | fail-open, warn-and-log; promote to "ask" if the misses log shows it is too quiet |
| `session-recon.mjs` | SessionStart | in a git repo: fetch, `status -sb`, all-refs log, open PRs → injected as `additionalContext` (parallel-work-recon's session-start half) | fail-open, silent on timeout/offline |

Both `.jsonl` logs are machine-local and gitignored.

## Install (per machine)

Merge into `~/.claude/settings.json` (create the `hooks` key if absent). Windows shown;
on macOS/Linux replace `%USERPROFILE%` with `$HOME`.

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "node \"%USERPROFILE%\\.claude\\skills\\hooks\\session-recon.mjs\"", "timeout": 20 } ] }
    ],
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [
        { "type": "command", "command": "node \"%USERPROFILE%\\.claude\\skills\\hooks\\push-gate.mjs\"" },
        { "type": "command", "command": "node \"%USERPROFILE%\\.claude\\skills\\hooks\\sql-surgery-warn.mjs\"" }
      ] }
    ],
    "PostToolUse": [
      { "matcher": "Skill", "hooks": [
        { "type": "command", "command": "node \"%USERPROFILE%\\.claude\\skills\\hooks\\skill-fire-log.mjs\"" }
      ] }
    ]
  }
}
```

Requires `node` on PATH (true on both dev machines). Verify after install: run any skill
and check `FIRE_LOG.jsonl` gained a line; attempt a `git push` and confirm the prompt
carries the confirm-before-push reason.

## Deferred hook rows

- `lint-after-edit` as a PostToolUse hook — the skill covers the behaviour today; a hook
  version needs per-project linter detection and speed guards.
  FORWARD: lint-after-edit hook row, see docs/SKILL_PROPOSALS_2026-07-23.md Layer 0.
- Banned-character gate — per-project scope by convention (R-39), so it installs as a
  project pre-commit hook or project-level PostToolUse hook, not globally from here.
  FORWARD: banned-character gate per-project template, see docs/SKILL_PROPOSALS_2026-07-23.md Layer 0.

## Plugin machines: none of the above applies

Machines that installed the `ash` plugin (see the README's install section) get every hook
in this directory automatically via `hooks/hooks.json`, plus `norms-inject.mjs` (which
injects the NORMS.md block at session start — plugin machines skip the manual CLAUDE.md
copy too). The manual settings.json install above is ONLY for the direct-clone dev machine.
Never do both on one machine: the hooks would fire twice per event.
