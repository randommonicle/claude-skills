# Layer 0 hooks — definitions and per-machine install

The deterministic layer of the orchestration architecture (see
docs/SKILL_PROPOSALS_2026-07-23.md). The scripts live in this directory and are tracked;
the wiring lives in each machine's `~/.claude/settings.json`, which is not tracked — so
install on every machine, per below. All mechanics verified against the Claude Code docs
on 2026-07-23 (see the proposal doc's mechanics table).

## The hooks

| Script | Event / matcher | Behaviour | Failure mode |
|---|---|---|---|
| `push-gate.mjs` | PreToolUse / Bash | `git push` (with any global options between the words: `git -C <path> push`, `--git-dir=`, `-c k=v`), `gh pr merge`, remote ref deletion → `permissionDecision: "ask"` (forces the per-action prompt; mechanises confirm-before-push), with a best-effort `git fetch` + `status -sb` freshness block appended to the reason, so the prompt carries live remote state rather than the session-start snapshot (parallel-work-recon's pre-push half) | fail-closed for matched commands; exits 0 on script error (skill is the backstop); freshness degrades to the original reason on non-repo cwd, missing git or timeout, and the fetch runs only on matched commands |
| `skill-fire-log.mjs` | PostToolUse / Skill | appends one JSONL line per `Skill` tool invocation to `~/.claude/skills/FIRE_LOG.jsonl` (the rating system's measurement arm); any other event shape (a loosened matcher, a foreign harness's wrapper) or a Skill event carrying no name is captured once per shape to `FIRE_LOG_DEBUG.jsonl`, keys only, never the loaded skill text | fail-open; an unreadable input is recorded, never a silent `'unknown'` (LESSONS_LEARNED 11) |
| `sql-surgery-warn.mjs` | PreToolUse / Bash | destructive SQL in an EXECUTION context (`psql -c`/`-f`, `supabase db ...`, `sh -c`, heredoc, SQL as a quoted flag value) → logs to `~/.claude/skills/SURGERY_LOG.jsonl`, then `permissionDecision: "ask"` carrying the matched statement, the live-data-surgery protocol in one line, and the named `.sql` script's own header comments. A leading-binary denylist (grep, rg, cat, echo, sed, awk, head, tail, less, git) runs first, so searching the repo or committing a message that mentions the words stays silent and unlogged; a denylisted binary piping or chaining into a SQL client is execution after all | fail-closed for matched commands; exits 0 on script error; `node scripts/cleanup.mjs` carries no SQL in the command string and stays invisible (skill is the backstop). Promoted from warn-and-log on the evidence this row's promotion clause always reserved (2026-07: a destructive delete pre-authorised without the script's own constraints being read) |
| `session-recon.mjs` | SessionStart | in a git repo: fetch, `status -sb`, all-refs log, open PRs → injected as `additionalContext` (parallel-work-recon's session-start half). Also reports this library's own update health from `../skills-update.json`, read BEFORE the repo check so it reaches a session opened outside a repo: silent while the state is `current`, one line when the updater refused or errored, when a fast-forward changed `hooks/` or a `SKILL.md` (so this session is the first to load them), or when no run has completed in 36h — a scheduled task that stopped is the failure that last branch exists to make visible | fail-open, silent on timeout/offline; a MISSING status file is silence by design (the scheduler is per-machine and may never have been installed), a STALE one is not |
| `schedule-cost-warn.mjs` | PreToolUse / Write\|Edit | a payload landing a schedule (`.github/workflows/*.yml` carrying `schedule:`/`cron:`, or `vercel.json`/`wrangler.toml`/`netlify.toml`/crontab carrying `cron`) → pricing reminder as `systemMessage` + `additionalContext` (mechanises price-the-spend, whose description cannot match "add a cron job") | fail-open, warn-only, never blocks |
| `migration-write-warn.mjs` | PreToolUse / Write\|Edit | a payload writing a `.sql` file under a `migrations` path segment → migration discipline as `systemMessage` + `additionalContext`: derive the guard predicate from the actual write, probe the target's environmental premises, execute against a throwaway container first, ship the catalog query; an invariant asserted in SQL comment prose appends the enforce-invariants-in-build clause (mechanises the moment db-migration-verification, live-state-first and prove-it-can-fail cannot description-match: a bare `.sql` write has no trigger vocabulary) | fail-open, warn-only, never blocks |
| `test-write-warn.mjs` | PreToolUse / Write\|Edit | a test-shaped path (`.spec.`/`.test.`, or a `tests`/`test`/`smoke`/`smokes`/`e2e` segment) whose payload carries a DB-context delete, a service-role credential, or an error-existence-only assertion → the matching rule lines as `systemMessage` + `additionalContext` (mechanises safe-smokes and prove-it-can-fail, whose descriptions cannot match "write me a smoke") | fail-open, warn-only, never blocks |
| `lint-after-edit.mjs` | PostToolUse / Write\|Edit | an edited `.js/.jsx/.ts/.tsx/.mjs/.cjs` file outside `node_modules`/`dist`/`build`/`.git`: walks up to the nearest `package.json`, picks Biome (`biome.json`/`biome.jsonc`) else ESLint (`eslint.config.*`, `.eslintrc*`, or an `eslintConfig` key), resolves the binary strictly from that project's `node_modules/.bin` (never npx, never an install; on Windows that is npm's `.cmd` shim, run through `cmd.exe` with metacharacter paths skipped, since Node will not spawn a `.cmd` bare and the hook was silent on every Windows project until 2026-09-15), lints the single edited file and reports up to 30 lines as `systemMessage` + `additionalContext` (retires the lint-after-edit skill, whose moment is the edit itself and which no prompt names) | fail-open, warn-only, never blocks; silent on no config, no binary, crash or the 15s internal timeout |
| `read-head-supply.mjs` | PostToolUse / Read | a `Read` carrying an `offset` above the head window (derived: `HEAD_LINES + 1`, so a read that already contains the head is silent) -> the file's first 5 lines returned as `systemMessage` + `additionalContext`, once per file per session. It SUPPLIES, it does not warn: the first design of this control asserted "one read would have been cheaper", which a two-model review refuted as false in the common case (content read late is re-sent fewer times than content read early), so the message makes no claim about the read at all and a test pins the absence of claim words. Mechanises as much of context-economy's premature-narrowing weakness as is reachable: LESSONS_LEARNED entry 14's missed state sat at line 4 and every read that night started below it, which is the suite's gating case. HEAD_LINES is derived from that incident plus the 4-line minimum of a YAML frontmatter block, not picked | fail-open, warn-only, never blocks; exits before touching disk on the common path (no offset, or offset inside the head window), since PostToolUse/Read is the most frequent call in a session; per-session state under `.read-head-state/` is the first state file here that prunes itself (7 days), because every other one is append-only. **Does not know whether the omitted content mattered** - the general case of premature narrowing stays uncovered and the skill says so |
| `audit-fires.mjs` | none: CLI, run by hand (`node hooks/audit-fires.mjs --repo <path>...`) | scores the rating system on this machine's data: fires per skill (count, first and last ts, distinct cwds), never-fired skills each tagged with the layer that explains the zero (norms and hook-backed skills are invisible to the fire log by construction), misses per skill from each repo's `docs/LESSONS_LEARNED.md`, and a loads-vs-misses cross-reference, the promotion and prune signal | fail-open per line, fail-loud per file: a malformed JSONL line is skipped and counted, a missing log prints a notice and the run continues; never registered as a hook, so it cannot affect a session |
| `update-skills.mjs` | none: CLI, run unattended by the OS scheduler (`node hooks/update-skills.mjs [--repo <path>] [--dry-run]`) | fast-forwards this library so the live install never runs month-old hooks (LESSONS_LEARNED 11 ran a broken fire-log hook for a month; on 2026-09-15 the live clone was 22 commits behind while a working copy was 20). Decides from git state alone and asks no model anything: fetch, then `current` \| `updated` \| `skipped-dirty` \| `skipped-ahead` \| `skipped-diverged` \| `error`, written to `../skills-update.json` beside the repo — never inside it, so there is nothing to gitignore and nothing to commit by accident. Fast-forwards only when clean, behind, and not ahead; re-reads HEAD afterwards rather than trusting `git merge`'s exit code (verify-the-effect). Untracked files do not count as dirty, since this clone always carries machine-local logs. `session-recon.mjs` surfaces the result at the next session start, which is what stops an unattended failure from rotting | fail-loud into the status file, one distinct state per failure mode; exit 0 only on `current`/`updated`. Refuses any repo whose `origin` is not a `claude-skills` remote, so pointing it at a client repo cannot fast-forward it. `realpath` resolves a junction to the one real path, so entering by either name is the same repo. Never registered as a hook |
| `install-marketing-pack.mjs` | none: CLI, run by hand (`node hooks/install-marketing-pack.mjs <target-repo> [--source <clone>] [--dry-run]`) | installs the stripped 14-skill subset of `coreyhaines31/marketingskills` into a target repo's `.claude/skills/`, pinned to one upstream commit (DECISIONS 2026-09-14, the third door): drops `evals/` and non-markdown, deletes the `## Tool Integrations` section and every `tools/integrations/` or `tools/REGISTRY.md` link (four live in `references/`), drops Related Skills rows naming an uninstalled skill in all three upstream row forms, writes `UPSTREAM.md` (pin, commit date, installed list, every cut by file and upstream line) and `LICENSE.marketingskills`; a re-run removes what its own `UPSTREAM.md` lists and reinstalls, so a changed keep list converges and the output is byte-identical across machines | fail-loud before any write: refuses a `--source` whose HEAD is not the pin, a target that is not a directory, and a same-named skill directory its `UPSTREAM.md` did not install; never registered as a hook |

All three `.jsonl` logs (fire, fire-debug, surgery) are machine-local and gitignored. The `Write|Edit` matcher is an unanchored
regex, so it also covers `MultiEdit` and `NotebookEdit`; `schedule-cost-warn.mjs`,
`migration-write-warn.mjs` and `test-write-warn.mjs` read `content`, `new_string` and
`edits[].new_string` for that reason. Every hook with fire-and-quiet behaviour ships its
asserted cases as a sibling suite in this directory (`node hooks/<name>.test.mjs`, prints
PASS/FAIL per case); `push-gate.test.mjs` builds throwaway git fixtures so the freshness
block is proven against a genuinely stale clone, offline.

## Install (per machine)

Merge into `~/.claude/settings.json` (create the `hooks` key if absent; if a matcher
already has entries, append to its `hooks` array rather than replacing it). Hook commands
run in Git Bash by default on Windows (PowerShell only where Git Bash is absent), so the
block uses `$USERPROFILE` with forward slashes, which bash expands and node accepts, and
states `"shell": "bash"` on each entry so the assumption lives in the config. The earlier
form of this block used `%USERPROFILE%`, which is cmd.exe syntax and expands in neither
shell, so it silently ran nothing. On macOS/Linux replace `$USERPROFILE` with `$HOME`.
The command hooks match `Bash|PowerShell` because the Windows desktop harness also exposes
a `PowerShell` tool carrying the same `tool_input.command`; a `Bash`-only matcher lets a
`git push` run through that tool walk past the push gate.

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "node \"$USERPROFILE/.claude/skills/hooks/session-recon.mjs\"", "shell": "bash", "timeout": 20 } ] }
    ],
    "PreToolUse": [
      { "matcher": "Bash|PowerShell", "hooks": [
        { "type": "command", "command": "node \"$USERPROFILE/.claude/skills/hooks/push-gate.mjs\"", "shell": "bash" },
        { "type": "command", "command": "node \"$USERPROFILE/.claude/skills/hooks/sql-surgery-warn.mjs\"", "shell": "bash" }
      ] },
      { "matcher": "Write|Edit", "hooks": [
        { "type": "command", "command": "node \"$USERPROFILE/.claude/skills/hooks/schedule-cost-warn.mjs\"", "shell": "bash" },
        { "type": "command", "command": "node \"$USERPROFILE/.claude/skills/hooks/migration-write-warn.mjs\"", "shell": "bash" },
        { "type": "command", "command": "node \"$USERPROFILE/.claude/skills/hooks/test-write-warn.mjs\"", "shell": "bash" }
      ] }
    ],
    "PostToolUse": [
      { "matcher": "Skill", "hooks": [
        { "type": "command", "command": "node \"$USERPROFILE/.claude/skills/hooks/skill-fire-log.mjs\"", "shell": "bash" }
      ] },
      { "matcher": "Write|Edit", "hooks": [
        { "type": "command", "command": "node \"$USERPROFILE/.claude/skills/hooks/lint-after-edit.mjs\"", "shell": "bash", "timeout": 20 }
      ] }
    ]
  }
}
```

Requires `node` on PATH (true on both dev machines). Verify after install: invoke any skill
and check `FIRE_LOG.jsonl` gained a line naming it and no `FIRE_LOG_DEBUG.jsonl` appeared;
run `git push --dry-run` (sends nothing) and confirm the prompt carries the confirm-before-push
reason. In a bypass-permissions session the "ask" is auto-approved and never shown; the
proof there is a `hook_success PreToolUse:Bash` record in the session transcript
(`~/.claude/projects/<project>/<session>.jsonl`). Settings edits are picked up by a file
watcher, so the check can run in the same session.

### The unattended updater (per machine, separate from the hooks above)

`update-skills.mjs` is not wired into `settings.json` — it is a scheduled job, because a
SessionStart pull races the skill listing this library's own LESSONS 13 and 14 argue about
in both directions. Running it between sessions removes the question rather than answering
it. On Windows, per user, no elevation:

```powershell
$node   = (Get-Command node).Source          # full path: a scheduled task's PATH is not the shell's
$script = "$env:USERPROFILE\.claude\skills\hooks\update-skills.mjs"
$action   = New-ScheduledTaskAction -Execute $node -Argument ('"' + $script + '"')
$trigger  = New-ScheduledTaskTrigger -Daily -At '06:30'
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName 'claude-skills update' -Action $action -Trigger $trigger -Settings $settings -Force
```

This is the form that was run and proven on 2026-09-15, not a `schtasks /create` line — the
`/tr` form wants `%USERPROFILE%` and this file already records what that costs elsewhere.
`-StartWhenAvailable` matters on a laptop: a 06:30 missed because the machine was off runs
at the next wake instead of being skipped for the day.

Remove with `Unregister-ScheduledTask -TaskName 'claude-skills update' -Confirm:$false`
(without `-Confirm:$false` it prompts, and hangs in a non-interactive shell); inspect with
`Get-ScheduledTaskInfo -TaskName 'claude-skills update'`.

Verify by DELETING `~/.claude/skills-update.json` first, then `Start-ScheduledTask`, then
confirming the file reappears with a fresh `at` — a status file left in place proves
nothing, since the task failing to run looks identical. Then confirm the negative path:
a session opened with that file aged past 36h must report the staleness, which is the
branch that catches the task dying quietly. `node hooks/session-recon.test.mjs` asserts it.

## Deferred hook rows

- `lint-after-edit` shipped 2026-07-29 as the `lint-after-edit.mjs` row above: detection
  walks up to the nearest `package.json`, and the speed guards are extension, path
  segment, on-disk existence, installed-binary-only resolution and a 15 second internal
  cap (the 20s harness timeout sits deliberately above it, so the internal cap fires and
  the skip stays silent). The skill is deleted rather than kept as a backstop. It reads
  the file from disk after the write, not the payload, which is why it is PostToolUse.
- Banned-character gate — per-project scope by convention (R-39), so it installs as a
  project pre-commit hook or project-level PostToolUse hook, not globally from here.
  FORWARD: banned-character gate per-project template, see docs/SKILL_PROPOSALS_2026-07-23.md Layer 0.

## Plugin machines: none of the above applies

Machines that installed the `ash` plugin (see the README's install section) get every hook
in this directory automatically via `hooks/hooks.json`, plus `norms-inject.mjs` (which
injects the NORMS.md block at session start — plugin machines skip the manual CLAUDE.md
copy too). The manual settings.json install above is ONLY for the direct-clone dev machine.
Never do both on one machine: the hooks would fire twice per event.

One project also carries a hand-made **Antigravity** port of the plugin
(`<project>/.agents/plugins/ash/`, 2026-08-10, not tracked here), which maps Antigravity's
tool names onto snapshot copies of these scripts through a wrapper. Antigravity has no
`Skill` tool, so `skill-fire-log.mjs` has nothing to measure there and must not be wired:
its wiring to `view_file` wrote 508 `'unknown'` lines over a month (LESSONS_LEARNED 11).
The port's copies do not follow this directory; re-copy after any hook change you want it
to carry.
