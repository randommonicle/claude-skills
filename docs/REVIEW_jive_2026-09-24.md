# Review: merijjeyn/jive, gut-and-reuse assessment (2026-09-24)

> **Outcome, 2026-09-24.** Ben's answers: the missing norms block was not deliberate, so it
> was restored to `~/.claude/CLAUDE.md`, copied from `NORMS.md` by script in that file's CRLF
> endings. A comparison with line endings normalised matches (22 lines), a deliberately
> altered copy fails it, and a second run changed nothing. It loads from the next session.
> The script-file blind spot is now named in `secret-echo-guard`'s header and its `HOOKS.md`
> row (`2488155`), and the Windows path-length trap is in this machine's toolchain memory.
> Found on the way and not fixed here: rule 4 denies any `grep` whose pattern contains
> `process.env`, escaped or not, because the pattern reads as a `*.env` path, while the same
> command with `-c` passes. Searching code for environment-variable use is routine work.

Source: `https://github.com/merijjeyn/jive`, reviewed at commit `a1644e0` (2026-09-21,
"cleanup"), MIT licence (`LICENSE:3`, copyright Meric Ungor 2026). 45 commits by one author,
dated 2026-09-18 to 2026-09-21; the GitHub repository was created on 2026-09-21. Read in full:
`README.md`, `DESIGN.md`, `docs/GRAPH_CONTRACT.md`, `src/core/planner-guide.ts`,
`src/jev/client.ts`, `demos/project/native_benchmark_stats.ts`. Everything else was grepped.
Cloned into a session scratchpad; nothing from it was executed.

Jive paths below are relative to the clone at `a1644e0`. Library paths are relative to this
repository at `7c28c52`.

## Verdict

Do not install it, and do not build a skill from it now. One rule in it is worth keeping. It is
recorded below as a candidate with a `class:` line, so the first real instance reads as
recurrence.

- **There is nothing to gut into a SKILL.md.** Jive is a competing agent runtime: a
  TypeScript/Bun planner loop over OpenRouter, a graph scheduler, and a terminal UI. Its
  differentiating feature, the `jev` node, is a call to a paid third-party classifier.
- **The portable part is one rule** from the planner prompt. The rest of that prompt is already
  in this library: batching independent calls is `context-economy` Rule 1
  (`context-economy/SKILL.md:47`), capping and isolating output are its Rules 2 and 5, and
  "report partial success, never truncate a collection" is `no-silent-data-drop`.
- **A skill built now would probably never fire.** The library adds skills after incidents, and
  this rule has none locally. The description budget is already 4,090 words across 46 skills,
  17% over the proposed ceiling (`docs/HANDOVER_red-ci_2026-09-21.md:120-123`). And the nearest
  existing skill, `context-economy`, has fired **0 times** in 89 fire-log entries since it was
  created on 2026-09-16. An efficiency rule that waits for a description match does not get
  loaded.

## What jive is

The planning model gets one main tool, `execute_graph`. Instead of one command per turn, it
submits a JSON graph of `bash` and `jev` nodes with dependencies, conditions, accepted exit
codes, per-item `foreach` groups and bounded `repeat` loops. The runtime runs the whole graph,
stores every node's full output on disk, and returns compact previews plus the few results the
model asked for. A `jev` node sends a fixed-choice question to TypeSafe's "System One" model and
gets back a choice with a probability distribution, so per-item judgement happens inside the
graph without a planner turn. A second tool, `execute_graph_mod`, reruns a saved graph after
small JSON-pointer edits.

It reads skills in the same `SKILL.md` frontmatter format as this library, from `.jive/skills/`
(`src/core/project-skills.ts:19`). That is its only direct overlap with this library.

## Blockers, with primary evidence

1. **No permission layer, and the keys are in reach.** A grep for permission, approval,
   sandbox, confirm and allowlist across `src/` returns one unrelated hit. Every bash node is
   spawned with the full parent environment (`src/core/process.ts:25`), and both API keys are
   read from that environment (`src/planner/agent.ts:253`, `src/jev/client.ts:60`). Any script
   the planner writes, including one steered by a fetched web page, can read both keys. None of
   this machine's hooks would see any of it, because jive does not run inside Claude Code. This
   is decisive on its own.
2. **Every semantic decision leaves the machine** for `api.typesafe.ai`
   (`src/jev/client.ts:79`). For PropOS or client data that is an `ai-surface-discipline`
   question before it is a tooling one.
3. **Two new paid accounts**, OpenRouter and Jev (`.env.example:2`, `.env.example:4`). Neither
   draws on the Claude plan.
4. **Install is `curl | sh`** (`README.md:16`), and the author works on macOS: the benchmark
   script hardcodes `/Users/mericungor/` (`demos/project/native_benchmark_stats.ts:7`).
   Windows is untested. On this machine the clone would not check out until `core.longpaths`
   was enabled for the one command: fixture paths run to 140 characters and, under the
   scratchpad prefix, git reported "Filename too long".
5. **Maturity:** three days public, one author.

## The benchmark

This concerns jive's claims, not Ben's use of it. The README table (`README.md:23-42`) shows
Jive fastest, and lowest in output tokens, on all six tasks. The evidence does not support the
conclusion drawn from it:

- **Different models.** Jive and Codex ran GPT-5.6 Sol and Claude Code ran Opus 5
  (`demos/project/native-benchmark-results.json:3-7`). The author's own posting notes say to
  keep that caveat visible (`reddit-posts.md:15`) and call it "not a clean model comparison"
  (`reddit-posts.md:256`). The README omits it.
- **No quality measure.** The stats script's first line says "no quality/grade metrics"
  (`demos/project/native_benchmark_stats.ts:1`), yet the README asserts "on par quality"
  (`README.md:49`). Three of the six benchmarked tasks ship a `verifier/verify.py`; the table
  uses none of them.
- **One run per agent per task**, 18 in total. Jive's token column counts planner tokens only
  (`native_benchmark_stats.ts:22`), so the up to 140 Jev calls per task appear in no token
  figure, and the table has no cost column.
- **The six linked videos are not in the repository** (`demos/README.md:3`).
- **The one thing that holds:** Claude Code's counts come from its own session log
  (`native_benchmark_stats.ts:30-36`), and on every task its model responses outnumbered its
  tool calls (98 to 97 on the largest), so it made, in effect, one call per turn. That behaviour
  is real, and it is what the portable rule targets. The author's own design note covers the
  rest: "Fewer planner turns alone do not establish that the architecture is better"
  (`DESIGN.md:307-308`).

## The portable rule

In the planner prompt's words: "If you already know what action follows each possible outcome,
encode those actions in the same graph" (`src/core/planner-guide.ts:74`). For Claude Code: when
what happens next is already decidable from a command's output by a fixed test (a file exists, a
count, an exit code, an exact match), write the branch into the script and skip the turn spent
reading the output to decide. A turn that only follows a plan buys nothing, and under
`context-economy`'s core mechanic it re-sends the whole prefix as well.

Its two boundaries, from the same prompt:

- Hand back when the continuation needs "a new strategy, original code or rubric text, an
  unforeseen failure diagnosis, or a user decision" (`planner-guide.ts:75`).
- Build "the whole bounded phase whose shape you already know", never a speculative whole task
  (`planner-guide.ts:104`).

**The fence this library would have to add, which jive lacks.** A script is where the
command-text hooks cannot see. `bash deploy.sh` is one of the two routes the push gate records as
open (`hooks/push-gate.mjs:13-15`). The same holds for `secret-echo-guard`, proven in this review
by driving the hook with stdin and executing nothing: `echo "$SUPABASE_SERVICE_ROLE_KEY"` is
denied, while `bash probe-phase.sh`, whose file holds that same line, is allowed. Any version of
this rule must therefore say that a batched script holds reads and local, reversible writes only.
Pushes, merges, deploys, sends, migrations, deletions and anything that reads a secret stay as
separate, visible tool calls. Without that fence the rule would move gated work into the gates'
blind spot.

### Candidate record

- **candidate:** batch the known continuation (working name; a leaf, or a Rule 7 in
  `context-economy`, decided when built)
- **class:** model turns spent on continuations that were decidable before the command ran
- **build when:** a `LESSONS_LEARNED.md` entry records a session that spent its usage window, or
  an hour, on a serial sweep whose steps were knowable at the start. Given the fire-log figure
  above, the rule would need an always-on line to take effect, and the Layer 1 block is at its
  cap of six (`NORMS.md:6`).

### The reusable piece

Jive's benchmark tasks are a ready before-and-after harness for that day. Each is an
`instruction.md`, a `workspace/`, and a verifier named in `task.json` (for example
`taskground/task_definitions/error_handling_audit/task.json:7-9`); five of the ten tasks carry
`verifier/verify.py`. Run a task with and without the rule, count turns from the Claude Code
session log as `native_benchmark_stats.ts:30-36` does, and grade with the verifier so quality is
measured, which jive's own table skipped. The library has no eval harness today, and `python3` is
on PATH on this machine. The workspaces are third-party source snapshots (each task has a
`SOURCE.json`), so use them locally and check their licences before committing any.

## Preconditions to revisit jive itself

- A permission or sandbox layer upstream, or a disposable VM with throwaway keys.
- A quality column from the verifiers, and same-model comparisons.
- Windows support stated by the author.
- A bulk-classification job whose data is unregulated, or has cleared `ai-surface-discipline`,
  that justifies a Jev account.

The nearer route to the cheap-judgement idea is the parked `delegate` evaluation (2026-09-12,
machine memory `delegate-cli-eval`), which offloads one-shot work to other providers on plan
allowance. Its revisit condition was `agy` and `codex` running as CLIs; both are on PATH here now, though
neither was run in this review.

## Side finding: the Layer 1 norms are not loaded on this machine

A question for Ben, not a verdict. `NORMS.md:3-4` says each machine's `~/.claude/CLAUDE.md`
carries the norm block pasted verbatim, and `hooks/norms-inject.mjs:2-5` says only plugin
installs use the hook instead. Here, `~/.claude/CLAUDE.md` has no `BEGIN CLAUDE-SKILLS NORMS`
marker, `~/.claude/settings.json` does not mention `norms-inject`, and neither `DECISIONS.md` nor
`LESSONS_LEARNED.md` records a removal. If it was deliberate, for example as a `context-economy`
trim, it needs a `DECISIONS.md` entry. If not, the six always-on norms were absent from the
session that wrote this review.

## Citations

| Claim | Path | Line | Quoted text | How verified |
|---|---|---|---|---|
| Licence and holder | jive `LICENSE` | 3 | `Copyright (c) 2026 Meric Ungor` | `grep -n -i copyright LICENSE` |
| Skills directory | jive `src/core/project-skills.ts` | 19 | `return { directory: join(resolve(cwd), ".jive", "skills"), skills: [], diagnostics: [] };` | `grep -n`; line 20 was cited first and is a closing brace, corrected |
| Bash nodes inherit the environment | jive `src/core/process.ts` | 25 | `spawn("bash", ["-c", options.script], { cwd: options.cwd, env: { ...process.env, ...stdinEnv, ...options.env }` | `sed -n 25p` |
| OpenRouter key from the environment | jive `src/planner/agent.ts` | 253 | `this.#apiKey = options.apiKey ?? process.env.OPENROUTER_API_KEY;` | `grep -rn OPENROUTER_API_KEY src` |
| Jev key from the environment | jive `src/jev/client.ts` | 60 | `const apiKey = this.options.apiKey ?? process.env.JEV_API_TOKEN ?? process.env.TYPESAFE_API_KEY;` | `grep -n` |
| Jev endpoint | jive `src/jev/client.ts` | 79 | `${this.options.baseUrl ?? "https://api.typesafe.ai/v1"}/systemone` | `grep -n api.typesafe.ai` |
| Two paid keys | jive `.env.example` | 2, 4 | `OPENROUTER_API_KEY=` and `JEV_API_TOKEN=` | `grep -n` |
| Install route | jive `README.md` | 16 | `curl -fsSL https://raw.githubusercontent.com/merijjeyn/jive/main/install.sh \| sh` | `grep -n "curl -fsSL"` |
| macOS-only stats path | jive `demos/project/native_benchmark_stats.ts` | 7 | `const root = "/Users/mericungor/.local/share/taskground/f1269136c384/runs";` | `sed -n 7p` |
| Table span | jive `README.md` | 23-42 | 23: `\| Task \| Agent \| Time \| Tool calls \| LLM calls \|`; 42: `\|  \| Claude Code \| 3m 04s \| 21 \| 22 \| 0 \| 19,253 \|` | `grep -n` for 23; `sed -n 41,43p` for the end (43 is blank); first cited as 23-40, which stopped at the Jive row |
| Models differ | jive `demos/project/native-benchmark-results.json` | 3-7 | `"jive": "openai/gpt-5.6-sol"`, `"codex": "gpt-5.6-sol"`, `"claude": "claude-opus-5"` | `sed -n 3,7p` |
| Author's caveat | jive `reddit-posts.md` | 15 | `Keep the benchmark caveat visible: Jive and Codex ran GPT-5.6 Sol, Claude Code ran Opus 5, all at medium effort.` | `sed -n 15p` |
| Not a clean comparison | jive `reddit-posts.md` | 256 | `so this is not a clean model comparison` | `sed -n 256p` |
| No quality metrics | jive `demos/project/native_benchmark_stats.ts` | 1 | `/** Main-agent usage from durable native sessions; no quality/grade metrics. */` | `sed -n 1p` |
| Quality asserted | jive `README.md` | 49 | `surprisingly more efficient with on par quality on most daily tasks of an engineer.` | `grep -n "on par quality"` |
| Planner tokens only | jive `demos/project/native_benchmark_stats.ts` | 22 | `if(row.type==="planner.message") outputTokens += row.data?.usage?.completionTokens ?? 0;` | `sed -n 22p` |
| Videos untracked | jive `demos/README.md` | 3 | `The recordings and rendered edits are not tracked in git (they are gigabytes of` | `sed -n 3,4p`; `ls demos/edits` fails |
| Claude Code counts measured | jive `demos/project/native_benchmark_stats.ts` | 30-36 | 30: `row.type==="assistant" && row.message?.id && !row.isSidechain`; 36: `llmCalls=responses.size; toolCalls=calls.size;` | `sed -n` on 30, 33 and 36 |
| Author's design caveat | jive `DESIGN.md` | 307-308 | `Fewer planner turns alone do not` / `establish that the architecture is better.` | `sed -n 307,308p` |
| The portable rule | jive `src/core/planner-guide.ts` | 74 | `If you already know what action follows each possible outcome, encode those actions in the same graph.` | `grep -n -o` |
| Hand-back boundary | jive `src/core/planner-guide.ts` | 75 | `Return to the planner when the continuation needs a new strategy, original code or rubric text, an unforeseen failure diagnosis, or a user decision.` | `grep -n -o` |
| Bounded-phase boundary | jive `src/core/planner-guide.ts` | 104 | `do build the whole bounded phase whose shape you already know.` | `grep -n -o` |
| Task verifier shape | jive `taskground/task_definitions/error_handling_audit/task.json` | 7-9 | `"verify": [` / `"python3",` / `"{definition}/verifier/verify.py"` | `grep -n -A2 '"verify"'` |
| Verifier coverage | jive `taskground/task_definitions/*/verifier/verify.py` | n/a | 5 of 10 tasks: async_blocking_audit, error_handling_audit, retry_audit, search_latency, slow_trace_search | `git ls-files` with the glob |
| Batching already covered | `context-economy/SKILL.md` | 47 | `- Batch independent calls into one turn.` | `grep -n` |
| Description budget | `docs/HANDOVER_red-ci_2026-09-21.md` | 120-123 | 120: `4,090 words across 46 skills`; 123: `ceiling is exceeded by 17%` | `grep -n` |
| `context-economy` fires | `FIRE_LOG.jsonl` | n/a | 89 entries, 2026-09-14T18:41Z to 2026-09-24T20:08Z, `context-economy`: 0 | node, JSON-parsed count by `skill` |
| Push gate blind spot | `hooks/push-gate.mjs` | 13-15 | `TWO REMAIN OPEN AND CANNOT BE CLOSED HERE:` / `bash deploy.sh          (the push lives in a file this never sees)` | `sed -n 13,15p` |
| Secret guard blind spot | `hooks/secret-echo-guard.mjs` | n/a | direct `echo "$SUPABASE_SERVICE_ROLE_KEY"`: `"deny"`, 761 bytes of output; `bash probe-phase.sh` holding the same line: no output, exit 0 | stdin JSON piped to `node hooks/secret-echo-guard.mjs`; the probe script was never run and has been deleted |
| Norms cap | `NORMS.md` | 6 | `review. Cap: at most six norms (R-19)` | `grep -n` |
| Norms location | `NORMS.md` | 3-4 | `The copy in each` / `` machine's `~/.claude/CLAUDE.md` is pasted from here verbatim, between the marker lines. `` | `sed -n 3,5p` |
| Hook is plugin-only | `hooks/norms-inject.mjs` | 2-5 | `SessionStart hook (plugin install only).` ... `Direct-clone machines use the copied CLAUDE.md block instead and do NOT wire` | `sed -n 2,5p` |
| Marker absent here | `~/.claude/CLAUDE.md` | n/a | 0 matches for `BEGIN CLAUDE-SKILLS NORMS` | `grep -c` |
| Hook not wired here | `~/.claude/settings.json` | n/a | 0 matches for `norms-inject` | `grep -c` |
| No recorded removal | `DECISIONS.md`, `LESSONS_LEARNED.md` | n/a | no match for norms, Layer 1, R-19, R-20 or "norms block" | `grep -n -i -E` |
| CLIs present | this machine | n/a | `agy`, `codex`, `python3` each resolve | `command -v` |
| Repository facts | jive git history, GitHub API | n/a | 45 commits, one author, 2026-09-18 to 2026-09-21; created 2026-09-21, 51 stars | `git log`; `gh api repos/merijjeyn/jive` |
| Hook note commit | this repository | n/a | `2488155 docs(hooks): secret-echo-guard names any script file run by name as a residual` | `git log --oneline -2` after the commit |
| Norms restored | `~/.claude/CLAUDE.md` | n/a | marker count 1; block MATCH over 22 lines; altered copy DIFFERS; rerun "NO CHANGE" | restore script's own re-read, then an independent node comparison, `grep -c`, and a mutation |
| Rule 4 false positive | `hooks/secret-echo-guard.mjs` | n/a | `grep -n "process\.env" f.test.mjs`: deny; `grep -n "process.env from" f.test.mjs`: deny; `grep -n -c "process\.env from" f.test.mjs`: no deny | stdin JSON piped to the hook, nothing executed; first met as a live deny of this review's own search |
