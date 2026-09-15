# Design note: an agent bus, and the two skills that ride on it

> **SUPERSEDED AS A PLAN, 2026-09-15.** An adversarial review found three of the four
> load-bearing arguments do not survive contact with this document's own evidence. The
> decision is to prototype a CLI transport for `cross-agent-review` instead of building this
> MCP server. See `REVIEW_agent-bus_2026-09-15.md` for the findings, the verification status
> of each, and why.
>
> This note is kept because the research in sections 1, 2, 7a and 7b is sound and was
> expensive to get, and because the review's findings only make sense against it. **The
> factual errors it shipped with have been corrected in place** — an implementer copying the
> adapter block should get working argv even though the architecture around it was dropped.

Status: **proposal, superseded — see above.** Written 2026-09-15 after web research and a
local environment probe; revised the same day to split dispatch from collaboration and to add
the degradation model; corrected after review the same evening.

Goal: Claude, Antigravity and GPT working together with no prompt pasting and no exchange
folder, Claude holding leadership, other agents easy to plug in later. Two shapes of work,
with very different cost profiles, sharing one transport.

---

## 1. The constraint that sets the shape

The instinct is "an MCP server they all connect to and chat through". That cannot work, and
the reason decides everything else.

**MCP servers cannot wake an idle agent.** The 2026-07-28 specification made the protocol
core stateless and removed the persistent bidirectional stream. Server-initiated requests
(sampling, elicitation) are now permitted **only while the server is actively processing a
client request** — previously a recommendation, now a requirement, so a user is never
prompted out of nowhere. The `notifications/elicitation/complete` signal was removed
outright, replaced by Multi Round-Trip Requests where the client re-sends the original call
with answers attached.

So a shared MCP server has no way to tap Antigravity on the shoulder and say "your turn".
Nothing can, in that architecture: an idle chat session is not listening.

A2A (Agent2Agent) is the protocol actually designed for agent-to-agent work — v1.0, Linux
Foundation governed, 150+ organisations, `SendMessage`/`GetTask` over JSON-RPC, gRPC or
REST. It does not help here either, for a more mundane reason: A2A assumes each agent is a
**running service with an AgentCard endpoint**. An Antigravity chat window is not a service.
Adopting A2A means building the service wrapper anyway, then owning a protocol we do not
need for a single-user desktop.

**Therefore: hub-relayed turn-taking.** Claude decides who speaks next; a local bus delivers
shared context to that agent, runs its turn, and appends the reply. Claude leading is not a
policy bolted on to satisfy the brief — it falls out of the only transport that works. It
also means there is exactly one place to enforce round caps, spend limits, the read-only
boundary and the degradation ladder in section 5.

## 2. What makes it possible anyway

Both other agents ship a **headless CLI with conversation continuity**. That is the trick:
we do not reach into a chat window, we start and resume real agent sessions that keep their
own tools, working directory and repo grounding.

| | Headless turn | Continue a thread | Structured output |
|---|---|---|---|
| Antigravity (`agy`) | `agy -p "…"` | `--continue`, or `--conversation <id>` | `--output-format json`, `--json-schema` |
| Codex | `codex exec` | `codex exec resume <uuid>` | `--json` (JSONL events) + `-o <file>` |

This preserves what makes cross-model work worth doing: the spoke is a **whole agent with
its own tools and its own view of the repo**, not a bare model completion. Calling the
Gemini and GPT APIs directly would be far simpler and would throw exactly that away.

Conversation continuity is also what makes section 5's parking model possible. Both sides
store conversation state as **local files keyed by the conversation id**, so a parked thread
is resumable until those files are deleted — verified for both in section 7a. That was the
single assumption the parking model rested on, and it holds.

## 3. Architecture

```
          ┌──────────────────────────────────────────┐
          │  Claude Code (hub, this session)         │
          │  decides who speaks, verifies, concludes │
          └───────────────┬──────────────────────────┘
                          │ MCP (stdio)
          ┌───────────────▼──────────────────────────┐
          │  agent-bus MCP server (local, Node)      │
          │  · roster      · banked transcript       │
          │  · turn router · caps, trust, fallbacks  │
          └───┬───────────────┬──────────────────┬───┘
              │ adapter       │ adapter          │ adapter
        ┌─────▼─────┐   ┌─────▼──────┐     ┌─────▼─────┐
        │ agy CLI   │   │ codex      │     │ (future)  │
        │ Gemini    │   │ exec CLI   │     │           │
        └───────────┘   └────────────┘     └───────────┘
```

Tools the bus exposes:

- `roster()` — who is configured, which models, who is reachable, **who is rate-limited**
- `ask(agent, message)` — one turn, one agent (the dispatch primitive)
- `open(topic, agents[], budget)` — start a collaborative thread
- `turn(thread, agent, message)` / `broadcast(thread, message)` — run turns in a thread
- `state(thread)` — the banked record so far, including gaps and substitutions
- `park(thread)` / `resume(thread)` — stop and restart without losing anything
- `conclude(thread)` — emit the final record, **whether or not every seat answered**

**Why the transcript lives in the bus.** If Claude called Codex's MCP server directly, GPT's
answer would land in Claude's context and nowhere else — Gemini would never see it unless
Claude retyped it. The bus composing each spoke's prompt from the shared transcript *is* the
collaboration mechanism. It is also the only place a bank can live that survives the hub
session ending.

## 4. Two modes, two skills, one bus

The cost profiles are different enough that the judgement of when to reach for each belongs
in separate skills.

### `agent-dispatch` — one shot, different family

One bounded question to one agent, usually because a different model family is likely to see
something we would not, or because a task is genuinely better suited elsewhere. Synchronous,
no thread, no shared transcript. Claude verifies the answer before using it
(`findings-are-evidence`: what comes back is a claim, not a finding).

Cost is one agent run, known before you start. This is the mode that should be cheap enough
not to think about.

Failure is simple: unreachable or limited means **say so and proceed without it**, never
silently continue as though the answer had been "nothing to add".

### `agent-collab` — multi-turn, expensive, must survive being cut off

Several seats, several rounds, a shared transcript. This is the one that needs the whole of
section 5, because the realistic end state is not "it finished" but "somebody's quota ran
out mid-thread".

The skill's job is mostly restraint: state the question and the budget before opening,
prefer three sharp rounds to eight woolly ones, and converge on the warning rather than the
hard stop.

## 5. Banking and degradation — the design for running out

Treat exhaustion as the expected ending, not an error path. Two properties make that
survivable.

**Bank as you go.** Every completed turn is persisted the moment it returns, before the next
call is made. A thread killed at round 3 of 5 has three rounds of banked value on disk. The
losing design is the one that gathers everything and synthesises at the end — that design
loses the lot when the last call fails.

`state(thread)` and `conclude(thread)` must therefore work **at any moment**, including with
seats missing, and must render the gaps on the face of the output. "Gemini was never asked"
and "Gemini had nothing to add" must never produce the same artifact. That is LESSONS 13's
refused-and-invisible failure wearing a new costume, and it is the single most likely way
this design goes quietly wrong.

**The ladder, in order.** Each rung is recorded in the transcript, never applied silently:

1. **Transient limit** → one retry after backoff.
2. **Still limited** → substitute the seat's configured cheaper sibling (e.g. a flash model
   for a pro one). The substitution is written into the transcript, so a downgraded
   contribution is never mistaken for a premium one.
3. **No sibling configured** → park that seat, continue with the rest, record the absence in
   the thread and in `roster()`.
4. **Budget cap reached, or all seats down** → park the whole thread and emit the bank.
5. **Later** → `resume(thread)` re-enters every surviving seat by its stored conversation id.

**Warn before you stop.** At 80% of budget the bus should tell Claude to start converging.
A thread that is told to wrap up produces a conclusion; a thread that is cut off mid-round
produces a fragment. This is cheap to implement and is most of the practical difference.

**Budget is declared at `open()`**, not discovered: turns per seat, wall clock, and
optionally a spend ceiling. `price-the-spend` applies — the number should be stated before
the first call, not reconstructed afterwards.

**The hub can run out too.** If Claude's own session hits a limit, the banked transcript and
the stored thread ids are on disk, so a fresh session resumes rather than restarts. This is
the same reasoning as the handover skill, mechanised.

## 6. The adapter contract

Adding an agent should be a config block, not code. An agent qualifies if it has a headless
CLI that takes a prompt and can resume a thread by id.

```jsonc
{
  // VERIFIED against codex-cli 0.154.0 by a real run, 2026-09-15.
  "gpt": {
    "transport":  "cli",
    "start":      ["codex", "exec", "--json", "-s", "read-only", "-C", "{cwd}",
                   "-m", "{model}", "-o", "{replyFile}", "{prompt}"],
    // CORRECTED after review: `exec resume` takes a NARROWER flag set than `exec`.
    // It rejects --sandbox, --cd, --add-dir, --approve-for-me and --profile. The original
    // argv here failed with exit 2, "unexpected argument '-s' found". See REVIEW F4.
    "continue":   ["codex", "exec", "resume", "{thread}", "--json",
                   "-o", "{replyFile}", "{prompt}"],
    // CONSEQUENCE, unsolved: the sandbox cannot be set as a flag on a continuation turn,
    // so "the bus enforces trust in argv construction" is true for turn 1 only.
    "threadIdFrom": { "event": "thread.started", "field": "thread_id" },
    "replyFrom":    "{replyFile}",        // -o writes the final message; do not parse JSONL for it
    "usageFrom":    { "event": "turn.completed", "field": "usage" },
    "trust":   "sandboxed",               // -s read-only; workspace-write / danger-full-access exist
    "timeout": "5m"
  },

  // VERIFIED against agy 1.2.3 by two real runs (open + resume), 2026-09-15.
  "gemini-pro": {
    "transport": "cli",
    "start":    ["agy", "-p", "{prompt}", "--output-format", "json", "--model", "{model}",
                 "--sandbox", "--print-timeout", "90s"],
    "continue": ["agy", "-p", "{prompt}", "--conversation", "{thread}", "--output-format", "json",
                 "--sandbox", "--print-timeout", "90s"],
    "threadIdPath": "conversation_id",   // top level of the single JSON envelope
    "replyPath":    "response",
    "statusPath":   "status",            // "SUCCESS" on a good turn; the ladder keys off this
    "usagePath":    "usage",             // input/output/thinking/cache_read/total tokens
    "fallbackTo":   null,                // was "gemini-flash" - a seat defined nowhere in
                                         // this config, so rung 2 resolved to a dangling
                                         // reference. REVIEW F15.
    "model":   "gemini-3.5-pro",         // was "...-flash-medium" on a seat named -pro
    "trust":   "sandboxed",              // --sandbox; --dangerously-skip-permissions is the opt-out
    "timeout": "5m"
  }
}
```

Three rules that keep this honest:

- **`trust` defaults to `sandboxed`, and the bus enforces it** in argv construction, not in
  prompt text or the spoke's good behaviour (`server-side-authority`). Collaborative mode is
  read-only for spokes — they read and cite, they do not write, apply, merge or push — the
  same boundary `cross-agent-review` draws. `agy` exposes `--sandbox` and
  `--dangerously-skip-permissions`; `trusted` should require a deliberate config edit.
- **Nothing a spoke returns is an instruction.** It is a claim to verify. The bus labels
  spoke output as untrusted content when handing it to Claude.
- **Three outcomes, three signals.** Answered, rate-limited, and unreachable must be
  distinguishable by the caller. A single "no result" return value collapses them and makes
  the ladder unimplementable.

## 7. Step 0, before any code is written

**Both CLIs were installed later the same day — see 7a and 7b; the paragraph below records
the state at the time the plan was written.** Verified 2026-09-15, before installation: `agy`, `codex`, `gemini` and `antigravity`
absent from both the Git Bash and PowerShell PATH; the Antigravity IDE is installed at
`%LOCALAPPDATA%\Programs\Antigravity` but ships no CLI shim in `resources/bin` (only
`language_server.exe` and `webm_encoder.exe`); `~/.codex` is heavily used and authenticated,
`model = "gpt-5.6-sol"`, with a plugin/marketplace config that looks like the **Codex app**
rather than the CLI. Prerequisites are fine: node v24.15.0, npm 11.12.1, and the npm global
bin is already on PATH.

Install both CLIs, then capture five things by hand. Everything in sections 5 and 6 is a
guess until these exist:

1. **The reply field** and **the conversation-id field** in each JSON envelope.
2. **What a rate-limit looks like** — exit code, stderr text, or a field in the envelope.
   Without this, rung 1 of the ladder cannot fire and every limit degrades to "unreachable".
3. **How long a conversation id stays resumable.** Parking assumes a thread can be re-entered
   tomorrow. If ids expire in an hour, the parking model needs rethinking, and it is better
   to learn that now than on the day a quota resets.
4. ~~Whether `codex mcp-server` exists.~~ **Answered 2026-09-15: it does not.** See 7a.
5. Whether either CLI reports remaining quota. If it does, the bus can warn before spending
   rather than discovering the wall.

Designing further against documentation, when a real invocation is ten minutes away, is the
mistake LESSONS 13 and 14 were both written about.

### 7a. What the Codex half of step 0 actually returned (2026-09-15)

`codex-cli 0.154.0` installed via `npm.cmd install -g @openai/codex` (the `.ps1` shim is
blocked by a Restricted execution policy; `npm.cmd` sidesteps it). One real turn was run.

- **`codex mcp-server` does not exist.** The `mcp` subcommand manages external MCP servers
  *for* Codex — it is a client, not a server. The third-party page that claimed otherwise was
  dated May 2026 and is wrong for this version. The transport is `codex exec`.
- **Headless:** `codex exec --json` emits JSONL events: `thread.started`, `turn.started`,
  `item.completed`, `turn.completed`.
- **Thread id:** `thread.started.thread_id`, a UUID. Resume with
  `codex exec resume <uuid> "<prompt>"`, or `--last`.
- **Reply:** take it from `-o <file>` (`--output-last-message`) rather than parsing JSONL.
  Cleaner and version-independent.
- **Retention is not a problem here.** Sessions are local files under
  `~/.codex/sessions/<year>/…`, resumable until `codex archive` or `codex delete`. The
  parking model in section 5 holds for Codex. **Still unknown for `agy`.**
- **`--ephemeral` is incompatible with parking.** It runs without persisting session files,
  so it destroys resumability. The May-2026 advice to use it for parallel work applies only to
  fire-and-forget dispatch, never to collab threads.
- **Trust is a first-class flag:** `-s read-only | workspace-write | danger-full-access`,
  with `-C <dir>` for the working root. Section 6's `sandboxed` default maps straight onto
  `-s read-only`, enforced in argv exactly as intended.

**Two findings that change the cost model:**

- **Every turn reports its own usage.** `turn.completed.usage` carries `input_tokens`,
  `cached_input_tokens`, `cache_write_input_tokens`, `output_tokens` and
  `reasoning_output_tokens`. The bus can therefore bank *measured* spend per turn rather than
  estimating it, which makes the budget cap and the 80% converge warning exact.
- **Resume verified after review, with corrected flags.** `codex exec resume <uuid>`
  returns the same `thread_id` and quotes its own previous reply. **Turn 2 cost 42,879 input
  tokens against turn 1's 21,425 — exactly 2.00×**, of which 33,408 were cache reads. So the
  replay term is real and matches `agy`'s, but the cache discount means the raw-token
  doubling overstates the bill. REVIEW F2.
- **The argv ceiling is ~32,700 characters on this machine** (measured through Node's
  `spawn`: fine at 32,000, `ENAMETOOLONG` at 32,700) — roughly 8,000 tokens of prompt,
  shared with every other flag. A last-N window of substantial replies exceeds it, so the
  adapter contract needs a `promptVia: argv | stdin | file` field that it does not have.
  Both CLIs accept a prompt on stdin. REVIEW F11.
- **CORRECTION, later the same day: the floors below are NO-TOOL floors and understate a real
  turn by 3-9x.** Measured once the CLI transport was built and ridden: a codex seat taking an
  actual review turn (read a file, run a probe, cite two lines) cost **71,288 input tokens**,
  and an agy turn that read files and timed out cost **195,056**. The 13k and 21k figures are
  the cost of saying hello. Cost a session from 70k-200k per tool-using turn, not from these.
- **There is a ~21k input-token floor per turn.** "Reply with exactly: hello from codex"
  cost 21,425 input tokens (12,160 of them cached) for 8 output tokens — that is the agent's
  own system context, before any of our transcript. A three-seat three-round thread therefore
  starts from roughly nine turns × 20k+ input before the shared transcript is added. This is
  hard evidence for Ben's instinct that collab mode is the expensive one, and it argues for the
  last-N window in section 8a over the full transcript.

### 7b. The Antigravity half (2026-09-15)

`agy 1.2.3`. The first install attempt failed with a truncated 166 MB download; the script's
SHA512 check caught it and halted rather than installing a corrupt binary. A clean re-run
fetched the full 195 MB and installed. The security control worked exactly as designed —
worth recording, because the visible symptom was simply "nothing installed".

**Every flag this note quoted from the docs exists**: `-p`/`--print`, `--output-format`,
`--json-schema`, `--continue`, `--conversation`, `--model`, `--effort`, `--sandbox`,
`--dangerously-skip-permissions`, `--input-format`, `--print-timeout` (default `5m0s`).

Unlike Codex's JSONL event stream, `agy --output-format json` returns **one envelope**:

```json
{"conversation_id":"b378179c-…","status":"SUCCESS","response":"hello from gemini\n",
 "duration_seconds":13.0,"num_turns":1,
 "usage":{"input_tokens":13102,"output_tokens":36,"thinking_tokens":32,
          "cache_read_tokens":0,"total_tokens":13138}}
```

- **Resume verified, not assumed.** A second turn with `--conversation <id>` returned the same
  id, `num_turns: 2`, and quoted its own previous reply verbatim. Input tokens went
  13,102 → 26,454, which is the transcript replay cost made visible in the envelope.
- **Retention: local.** The CLI keeps its own state at `~/.gemini/antigravity-cli/`, separate
  from the IDE's `~/.gemini/antigravity/` — `conversations/<uuid>.db` plus `brain/<uuid>/`
  transcripts. Keyed by conversation id, retained until deleted. Parking holds on this side too.
- **`status` is the ladder's discriminator.** `"SUCCESS"` on a good turn; the rate-limited and
  error values are the one thing still unobserved, since a limit cannot be forced to order.
  Scope of the remaining unknown is now one enum in a known field, not an unknown mechanism.
- **Input floor ~13k tokens**, against Codex's ~21k. Both charge a per-turn floor before any
  shared transcript, which is the structural reason collab mode is expensive.

## 8. Decisions for you

**a. Transcript strategy — the cost lever for collab mode.** Every spoke turn replays
context, and a spoke turn is a full agent run.

| Option | Cost | Loses |
|---|---|---|
| Full transcript each turn | grows quadratically | nothing |
| Last-N turns window | predictable, flat | long-range references |
| Delta + running summary | cheapest | fidelity; and someone must write the summary |

Recommendation: **last-N window, default 6, opener always pinned**. The only option whose
bill is predictable before you start, which matters more here than completeness.

**b. Default budget for `open()`.** Recommendation: 3 turns per seat, 15 minutes wall clock,
converge warning at 80%. Low, and raised on evidence.

**c. Trust default.** Recommendation: `sandboxed` everywhere; `trusted` requires an explicit
config edit with a comment saying why.

**d. Build or fork.** Real prior art exists — `agent-dispatch` (MCP server + CLI, "agent
dialogues", spawns `claude -p` per project), an Antigravity Supervisor MCP delegating to
headless subagents, and several CLI-orchestrator MCP servers. None has the banking or
degradation model above, and most delegate *tasks* where collab mode wants a *shared
conversation* — but `agent-dispatch` may be close enough to fork for dispatch mode. Worth
30 minutes of reading before committing to build.

## 9. Relationship to cross-agent-review

Siblings, not a replacement. `cross-agent-review` stays as it is: adversarial,
citation-disciplined, file-relay based. The file relay is a feature there — it is the
auditable record, with its tracked-scaffolding gitignore split, and it survives the session.
The two new skills are collaborative and one-shot respectively, and neither adjudicates.

FORWARD: if the bus proves itself, `cross-agent-review` could gain a `transport: bus` option
while keeping its protocol, handles and turn rule unchanged. Not in scope here; noted so the
idea is findable.

## 10. What is verified and what is not

Verified locally on 2026-09-15: every statement in section 7 about this machine.

**Verified by a real run, 2026-09-15** (section 7a) — *this list was over-scoped when first
written; corrected after review, see REVIEW F4*: the `start` argv of the `gpt` adapter block
(the `continue` argv was NOT run, and failed when it finally was),
the Codex event names and field paths, the sandbox flags, session retention, the per-turn
usage record and the 21k input floor. The claim that `codex mcp-server` exists was checked
and is **false** for codex-cli 0.154.0 — it came from a third-party page dated May 2026, and
it is the reason this section exists.

**Also verified by real runs, 2026-09-15** (section 7b): `agy 1.2.3`, every flag quoted
here, the single-envelope shape, both field paths that were previously guesses
(`conversation_id` and `response` — the guesses happened to be right), the `status` and
`usage` fields, resume across two turns, and local conversation storage under
`~/.gemini/antigravity-cli/`.

**What remains unverified:** the `status` value (and any exit code) that a rate-limited or
quota-exhausted turn produces, on either CLI. A limit cannot be forced to order, so rung 1 of
the ladder should be written defensively — treat any non-`SUCCESS` status as "not answered",
and refine the retry-versus-park split the first time a real limit is observed. Until then,
**a rate limit will degrade to rung 3 (park the seat), not rung 1 (retry)**. That is the safe
direction: it under-retries rather than hammering a limited endpoint, and the transcript
records the seat as absent rather than silently missing.

MCP and A2A statements in section 1 come from the official specification changelog, the MCP
blog and Linux Foundation press releases, all dated 2026.

## 11. Sources

- MCP 2026-07-28 changelog — https://modelcontextprotocol.io/specification/2026-07-28/changelog
- MCP 2026-07-28 specification release — https://blog.modelcontextprotocol.io/posts/2026-07-28/
- Antigravity CLI headless mode — https://antigravity.google/docs/cli/headless/
- Antigravity CLI install & auth — https://antigravity.google/docs/cli/install
- Antigravity CLI MCP (consumer only) — https://antigravity.google/docs/cli/mcp
- Codex headless execution mode — https://deepwiki.com/openai/codex/4.2-headless-execution-mode-(codex-exec)
- Codex CLI as an MCP server — https://codex.danielvaughan.com/2026/05/18/codex-cli-as-mcp-server-exposing-agent-capabilities-agents-sdk-multi-agent-delegation/ **(SUPERSEDED: its `mcp-server` subcommand does not exist in codex-cli 0.154.0; see 7a)**
- A2A joins the Linux Foundation — https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents
- agent-dispatch (prior art) — https://github.com/ginkida/agent-dispatch
