---
name: spawn-from-declared-state
description: A child agent or process inherits whatever its launcher happens to be carrying — settings, hooks, CLAUDE.md, auto-memory, API tokens, MCP servers, and the parent's lifetime — unless the launch declares otherwise. Launch headless agents from an explicit settings source, tool list and environment allowlist; check what the child actually loaded before its output can reach a reader; start anything that must outlive the session from the OS rather than from a session; and tie anything that must not outlive it to its parent's life. Triggers when spawning a headless agent, subprocess, overlay, dev server or watch loop, when writing a launcher or wrapper script, when an agent's output reaches an audience or a third party, and when a long-running helper is started from a session. Does not fire on in-process subagents the harness scopes for you (commission-the-roster owns the roster), or on proving a stop took effect (measure-per-route rule 7).
---

# Spawn from declared state

A process started from a session is born holding everything the session holds. On this
machine that is the operator's `CLAUDE.md`, their auto-memory, every skill the plugin
installs, an OAuth token or `ANTHROPIC_*` key in the environment, the MCP servers the
desktop app configured, and the parent's own lifetime. None of that is chosen. It arrives
because nobody wrote down what the child should start from, and a launcher that names two
things to remove still passes everything it did not think of.

The cost is not usually a crash. It is a private instruction read out to an audience, a
token handed to a process that had no business holding one, a helper killed by an unrelated
app update, or a watch loop that outlives everything that knew about it.

## The rules

1. **Declare the settings source, do not subtract from the parent's.** A child's
   configuration is named at launch, not inherited and then trimmed. On the Claude CLI the
   switches that do this, verified on this machine 2026-11-05 with `claude --help`, are
   `--settings <file-or-json>` for an explicit source, `--restricted` to ignore user,
   project and local settings files, `--strict-mcp-config` to use only the MCP servers
   `--mcp-config` names, and `--bare` for minimal mode, which skips hooks, LSP, plugin sync,
   attribution, **auto-memory and CLAUDE.md auto-discovery** and sets `CLAUDE_CODE_SIMPLE=1`.
   Re-verify with `claude --help` before relying on any of them: these are the vendor's
   flags, not the library's, and they move.
2. **An environment is an allowlist, not the launcher's minus two names.** Build the child's
   environment from the variables it needs. A denylist cannot know about the credential that
   was added to the parent last week, and an inherited `ANTHROPIC_*` or OAuth token is a
   capability the child was never meant to be granted.
3. **Check what the child actually loaded, before its output can reach anyone.** The launch
   flags state an intention; the first run reports the fact. Read the session's own account
   of its memory and instruction sources and fail the run if it loaded anything the launch
   did not name. A narrating agent, a streamed overlay or any third-party-facing output gets
   this check *before* the first token is shown, not after.
4. **Lifetime is declared in both directions.** Anything that must outlive the session is
   started by the OS — a scheduled task or service — never from a session that an app update
   can close. Anything that must *not* outlive the session ties itself to its parent's life
   and is reaped when the parent goes. Neither direction is the default, and both halves fail
   silently: the first when a desktop update takes the helper down with it, the second when
   orphaned loops keep running against a heartbeat long after their monitor is gone.
5. **An unreviewed launcher is the whole attack surface.** The flags above only hold if every
   path that spawns the child uses them. One hand-run command, one wrapper that predates the
   rule, and the child is back to inheriting. Grep for every spawn site when the rule changes
   (blast-radius-grep), and treat the wrapper as the thing under test, not the agent.

## Why these and not a checklist of variables

The five incidents behind this skill differ in which thing leaked — skills, instructions,
memory, a token, a process's life — and agree on the shape: the launcher named what it
wanted and said nothing about what it was carrying. A list of variables to unset ages badly
and was already incomplete each time. Declaring the start state does not.

## Provenance

Rimagent 2026-09-26 (a headless `claude -p` ran the operator's SessionStart hook and loaded
131 skills), 2026-10-02 (the same step loaded the operator's `CLAUDE.md` and auto-memory into
an agent narrating to a stream overlay), 2026-10-14 (a show started from a desktop session
would inherit the app's `ANTHROPIC_*` and `CLAUDE_CODE_*` variables and an OAuth token),
2026-10-15 (a desktop-app update killed OBS and the overlay because a session had started
them), 2026-10-04 (the inverse: 95 orphaned watch loops outlived the monitors that started
them and kept an operator heartbeat alive). `docs/SKILL_PROPOSALS_2026-11-01.md`, Tier 1
item 3, admitted by Ben 2026-11-05.

Adjacent, and deliberately not duplicated: `commission-the-roster` covers least privilege at
creation for an API-created routine or agent (`commission-the-roster/SKILL.md:311`);
`measure-per-route` rule 7 covers proving a stop took effect
(`measure-per-route/SKILL.md:34`). Neither covers what a spawned child inherits.

**Correction to the proposal.** Tier 1 item 3 specified the environment variables
`CLAUDE_CODE_DISABLE_AUTO_MEMORY` and `CLAUDE_CODE_DISABLE_CLAUDE_MDS`. Neither name appears
in this repository or in `claude --help` on this machine as of 2026-11-05; the documented
switch covering both is `--bare`. Rule 1 states the flags that were verified rather than the
names the proposal carried.
