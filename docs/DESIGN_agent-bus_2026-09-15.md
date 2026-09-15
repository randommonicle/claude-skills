# Design note: an agent bus, and the two skills that ride on it

Status: **proposal, nothing built.** Written 2026-09-15 after web research and a local
environment probe; revised the same day to split dispatch from collaboration and to add the
degradation model. Read section 9 before trusting any flag name in here.

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
| Codex | `codex exec` | `codex mcp-server` → `codex()` / `codex-reply(threadId)` | JSON envelope |

This preserves what makes cross-model work worth doing: the spoke is a **whole agent with
its own tools and its own view of the repo**, not a bare model completion. Calling the
Gemini and GPT APIs directly would be far simpler and would throw exactly that away.

Conversation continuity is also what makes section 5's parking model possible. It is doing
two jobs, so its retention behaviour is a step-0 question, not a detail.

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
        │ Gemini    │   │ mcp-server │     │           │
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
  "gemini-pro": {
    "transport": "cli",
    "start":    ["agy", "-p", "{prompt}", "--output-format", "json", "--model", "{model}"],
    "continue": ["agy", "-p", "{prompt}", "--conversation", "{thread}", "--output-format", "json"],
    "threadIdPath": "conversation_id",   // PLACEHOLDER - step 0 replaces this
    "replyPath":    "response",          // PLACEHOLDER - step 0 replaces this
    "rateLimit":    { "exitCode": 429, "matches": ["quota", "rate limit"] },
    "fallbackTo":   "gemini-flash",      // rung 2 of the ladder; null means skip to rung 3
    "model":   "gemini-3.5-flash-medium",
    "trust":   "sandboxed",              // sandboxed | trusted
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

Neither CLI is on PATH here. Verified 2026-09-15: `agy`, `codex`, `gemini` and `antigravity`
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
4. Whether `codex mcp-server` exists in the installed version and lists `codex` /
   `codex-reply`.
5. Whether either CLI reports remaining quota. If it does, the bus can warn before spending
   rather than discovering the wall.

Designing further against documentation, when a real invocation is ten minutes away, is the
mistake LESSONS 13 and 14 were both written about.

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

**From documentation, not run here:** every `agy` flag in this note (`-p`,
`--output-format`, `--json-schema`, `--continue`, `--conversation`, `--model`, `--effort`,
`--print-timeout`, `--sandbox`, `--dangerously-skip-permissions`) comes from the official
Antigravity CLI headless docs, not from `agy --help` on this machine. The Codex
`mcp-server` tool names and the `--ephemeral` parallel hazard come from a third-party
knowledge base dated May 2026 and a DeepWiki page, not from OpenAI's own docs and not from
the installed binary. The JSON field names in section 6 (`conversation_id`, `response`) and
the `rateLimit` shape are **invented placeholders** — that is what step 0 replaces.

MCP and A2A statements in section 1 come from the official specification changelog, the MCP
blog and Linux Foundation press releases, all dated 2026.

## 11. Sources

- MCP 2026-07-28 changelog — https://modelcontextprotocol.io/specification/2026-07-28/changelog
- MCP 2026-07-28 specification release — https://blog.modelcontextprotocol.io/posts/2026-07-28/
- Antigravity CLI headless mode — https://antigravity.google/docs/cli/headless/
- Antigravity CLI install & auth — https://antigravity.google/docs/cli/install
- Antigravity CLI MCP (consumer only) — https://antigravity.google/docs/cli/mcp
- Codex headless execution mode — https://deepwiki.com/openai/codex/4.2-headless-execution-mode-(codex-exec)
- Codex CLI as an MCP server — https://codex.danielvaughan.com/2026/05/18/codex-cli-as-mcp-server-exposing-agent-capabilities-agents-sdk-multi-agent-delegation/
- A2A joins the Linux Foundation — https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents
- agent-dispatch (prior art) — https://github.com/ginkida/agent-dispatch
