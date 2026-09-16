# Research pack — token efficiency / context economy (2026-09-16)

The evidence base behind the `context-economy` skill and the ASH organisational skill
`working-lean`. (The organisational skill was drafted as `working-lean-with-claude` and renamed:
per 1.6 below, an uploaded skill's `name` may not contain the reserved word "claude", so the
original name would have been rejected at the point of upload.) Unlike the `earn-every-line`
pack, no subagents were commissioned:
every source below was fetched first-hand in this session with `WebFetch` against the primary
page, and the extraction prompt asked for exact figures. Where a fact reached me through a
search-result summary rather than the page itself, it is labelled **SEARCH-ONLY** and must be
re-derived from the primary page before anything quotes it verbatim.

**Fetched on 2026-09-16.** Vendor pricing, minimums and TTLs move; every number here carries its
source URL so it can be re-checked rather than trusted. Publication dates below are the dates the
pages themselves state, not the date they were read.

---

## Part 1 — Anthropic primary sources

### 1.1 Effective context engineering for AI agents

`https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents`
Page states publication **29 September 2025**. Fetched 2026-09-16.

The core principle, quoted: *"find the smallest possible set of high-signal tokens that maximize
the likelihood of some desired outcome."* Context is framed as a finite attention budget with
diminishing returns, not as a capacity to be filled.

Named techniques, as the page describes them:

| Technique | What it does | Figure given |
|---|---|---|
| Just-in-time retrieval | Load data at runtime through tools; hold lightweight identifiers (file paths, queries, links) rather than the content | none |
| Compaction | Summarise history near the window limit and reinitiate from the summary; preserve architectural decisions and bugs, discard redundant tool outputs | none |
| Structured note-taking | Persist notes outside the context window and re-read them later (the `NOTES.md` pattern) | none |
| Sub-agent architectures | Specialised agents do focused work and return condensed summaries | subagents *"often"* return **1,000–2,000 tokens** |
| Tool design | Tools must be token-efficient and unambiguous | none |
| Tool result clearing | Discard raw results once used; described as *"one of the safest lightest touch forms of compaction"* | none |

On system prompts: *"you should be striving for the minimal set of information that fully outlines
your expected behavior"* — and explicitly, minimal is **not** the same as short. Recommends
distinct sections (`<background_information>`, `<instructions>`, tool guidance, output
description) and the "right altitude" between brittle if-else logic and vague direction.

On tool ambiguity, quoted: *"If a human engineer can't definitively say which tool should be used
in a given situation, an AI agent can't be expected to do better."*

**Honest gap:** the page gives **no** recommended maximum length for a system prompt and **no**
benchmark threshold at which performance degrades. It names "context rot" without quantifying it.
Anything stating an Anthropic-blessed number for either is not coming from this page.

### 1.2 Writing effective tools for AI agents

`https://www.anthropic.com/engineering/writing-tools-for-agents`
Page states publication **11 September 2025**. Fetched 2026-09-16.

The single hardest number in the Anthropic corpus for harness work, quoted: *"For Claude Code, we
restrict tool responses to 25,000 tokens by default."*

Also: *"implement some combination of pagination, range selection, filtering, and/or truncation
with sensible default parameter values"*. A worked `ResponseFormat` example shows the same Slack
result at **206 tokens** detailed versus **72 tokens** concise — roughly one third. When
truncating, the page says to *"steer agents with helpful instructions"* toward *"many small and
targeted searches instead of a single, broad search"*.

### 1.3 Code execution with MCP

`https://www.anthropic.com/engineering/code-execution-with-mcp`
Page states publication **4 November 2025**. Fetched 2026-09-16.

The headline figure, quoted: *"This reduces the token usage from 150,000 tokens to 2,000 tokens—a
time and cost saving of 98.7%."*

Two supporting facts. On tool-definition overhead: agents connected to thousands of tools *"need
to process hundreds of thousands of tokens before reading a request"*. On intermediate results:
a two-hour meeting transcript flowing through context twice is *"an additional 50,000 tokens"*.
The mechanism is that *"intermediate results stay in the execution environment by default"* — the
agent sees only what is explicitly logged or returned.

**Caveat on the 98.7%:** it is one worked example in a favourable shape (a large intermediate
result that never needed to enter context), not a general expectation. Cite it as an illustration
of the mechanism, never as a figure anyone should expect to reproduce.

### 1.4 Prompt caching

`https://platform.claude.com/docs/en/build-with-claude/prompt-caching` (the `docs.claude.com`
path 302-redirects here). Fetched 2026-09-16.

Cache prefix hierarchy: **`tools` → `system` → `messages`**. A change at any level invalidates
that level and everything after it.

The placement rule, quoted: *"Place `cache_control` on the last block whose prefix is identical
across the requests you want to share a cache."* And for the varying-suffix case: *"For a prompt
with a varying suffix (timestamps, per-request context, the incoming message), place the
breakpoint at the end of the static prefix, not on the varying block."*

The lookback window is **20 blocks**; consecutive `tool_use` blocks count as one position, as do
consecutive `tool_result` blocks.

Minimum cacheable prefix, per the page's table (a moving target — re-read before quoting):

| Model | Minimum tokens |
|---|---|
| Claude Fable 5.1, Mythos 5.1, Opus 5, Fable 5, Mythos 5 | 512 |
| Opus 4.8, Sonnet 5, Sonnet 4.6, Sonnet 4.5, Opus 4.1, Opus 4, Sonnet 4 | 1,024 |
| Mythos Preview, Opus 4.7 | 2,048 |
| Haiku 3.5 | 2,048 |
| Opus 4.6, Opus 4.5, Haiku 4.5 | 4,096 |

Quoted: *"Shorter prompts cannot be cached, even if marked with `cache_control`. Any requests to
cache fewer than this number of tokens will be processed without caching, and no error is
returned."* — a silent failure, which is why this belongs in a skill rather than a comment.

Price multipliers against base input: 5-minute cache write **1.25x**, 1-hour cache write **2x**,
cache read **0.1x** for most models and **0.025x** for Fable 5.1 and Mythos 5.1.

Non-obvious invalidators from the page's table: toggling web search, toggling citations, changing
the speed setting, and changing `tool_choice` all invalidate at or below the `system` level.
Images invalidate `tools` and `system` caches. Thinking blocks cannot carry `cache_control`
directly but do count as input tokens when read from cache.

### 1.5 Claude Code — manage costs effectively

`https://code.claude.com/docs/en/costs`. Fetched 2026-09-16. Undated page; its contents reference
Claude Code v2.1.2xx, so it is current to this month.

Deployment figures, quoted: *"the average cost is around $13 per developer per active day and
$150-250 per developer per month, with costs remaining below $30 per active day for 90% of
users."*

The mechanism behind a long session, quoted: *"Claude Code sends your full conversation with every
request, and each time Claude uses tools it sends another request carrying that batch of tool
results."* Therefore *"a one-line question in a session that has been open all day still draws
usage for the whole conversation."* This is the single fact most users do not hold.

Named causes of climbing usage in an idle session: long context; cache misses after a break longer
than the cache lifetime; scheduled tasks firing on their interval; cross-session messages; goal
check-ins; active agent teammates; and compaction itself (*"`/compact` reads the conversation it
summarizes"*, so compacting a large context is itself a large request, whereas *"`/clear` costs
nothing"*).

Cache lifetime, as stated here: **one hour on a subscription**, dropping to **five minutes** once
drawing on usage credits; **five minutes by default** on an API key or cloud provider.

Reduction techniques the page gives, with its own figures where present:

- `/clear` between unrelated tasks; `/rename` first if you want to `/resume` later.
- `/compact <instruction>` to steer what survives summarisation; compact instructions can live in
  `CLAUDE.md`.
- Model choice: Sonnet for most coding work, Opus reserved for architecture and multi-step
  reasoning, `model: haiku` for simple subagents.
- MCP: tool definitions are *deferred by default*, so only names and server instructions enter
  context until a tool is used. CLI tools (`gh`, `aws`, `gcloud`) are *"still more context-efficient
  than MCP servers because they don't add any per-tool listing"*. `/context` shows what is
  consuming space.
- Hooks as preprocessors: the page's worked example turns *"tens of thousands of tokens"* of log
  file into *"hundreds"* by grepping for `ERROR` before Claude sees it.
- **`CLAUDE.md` guidance, quoted: *"Aim to keep CLAUDE.md under 200 lines by including only
  essentials."*** Specialised instructions belong in skills, which load on demand.
- Extended thinking: thinking tokens bill as **output**; the default budget can be *"tens of
  thousands of tokens per request"*. Lower with `/effort`, or `MAX_THINKING_TOKENS` on
  fixed-budget models. Adaptive-reasoning models ignore a nonzero budget — use effort there.
- Subagents to isolate high-volume operations so only the summary returns.
- **Agent teams use *"approximately 7x more tokens than standard sessions when teammates run in
  plan mode"***, because each teammate carries its own context window.
- Plan mode before implementation, to avoid paying for the wrong direction twice.
- Specific prompts: *"Vague requests like 'improve this codebase' trigger broad scanning."*

Background token use even when idle: *"typically under $0.04 per session"*.

Measurement surfaces: `/usage` (session block, plus a `Prompt cache (main)` line from v2.1.251
giving request count, share of input tokens served from cache, misses and warm/cold state);
`/context`; `/insights`. The `/usage` breakdown *"flags behaviors that account for 10% or more of
your recent usage, such as long context or cache misses"*.

Note for ASH: on Team and Enterprise plans the per-seat allowance *"is shared with Claude chat and
Cowork"* and resets on a rolling five-hour window plus a weekly window. So a Cowork habit and a
Claude Code habit draw on the same allowance.

### 1.6 Skill authoring best practices

`https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices`
Fetched 2026-09-16.

Framing, quoted: *"The context window is a public good."* And the three challenge questions the
page tells authors to put to every line: *"Does Claude really need this explanation?"* / *"Can I
assume Claude knows this?"* / *"Does this paragraph justify its token cost?"*

Progressive disclosure, three levels: metadata (name + description) pre-loaded for **all** skills
at startup; SKILL.md read only when the skill becomes relevant; bundled files read only when
needed. Quoted on the third level: *"Reference files, data, or documentation don't consume context
tokens until actually read."* Scripts can be **executed** without their contents entering context
— *"Only the script's output consumes tokens."*

Hard limits from the page: `name` **max 64 characters**, lowercase/numbers/hyphens only, no
reserved words "anthropic" or "claude"; `description` **max 1,024 characters**, non-empty, third
person. Body guidance: **"Keep SKILL.md body under 500 lines for optimal performance."**

Two structural rules that are really context rules. **Keep references one level deep from
SKILL.md** — Claude may `head -100` a nested reference and act on a partial read. And **give any
reference file longer than 100 lines a table of contents**, for the same reason.

The worked conciseness example: the same PDF instruction at *"approximately 50 tokens"* concise
versus *"approximately 150 tokens"* verbose — the verbose one spending its budget explaining what
a PDF is.

### 1.7 Skills for enterprise

`https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise`
Fetched 2026-09-16.

**Recall limits** — the reason a skill library has a size question at all: *"Each Skill's metadata
(name and description) competes for attention in the system prompt. With too many Skills active,
Claude may fail to select the right Skill or miss relevant ones entirely."* The page gives no
number for claude.ai or Claude Code; it says to measure recall with an evaluation suite and *"stop
adding when performance degrades"*. It does give one hard API figure: *"API requests support a
maximum of 20 Skills for each request."*

**Cross-surface warning, quoted:** *"Custom Skills do not sync across surfaces. Skills uploaded to
the API are not available on claude.ai or in Claude Code, and vice versa. Each surface requires
separate uploads and management."* The page's remedy is to hold the source files in Git as the
single source of truth and synchronise deliberately. This is the fact that makes the ASH
organisational skill a **separate artefact** from anything in this repo's Claude Code library,
not a copy of one.

Also: evaluation suites of **3-5 representative queries per skill** covering should-trigger,
should-not-trigger and ambiguous cases; test across Haiku, Sonnet and Opus; authors should not be
their own reviewers.

### 1.8 Provisioning organisation skills

`https://support.claude.com/en/articles/13119606-provision-and-manage-skills-for-your-organization`
Fetched 2026-09-16.

The rollout mechanism for ASH, as the article states it:

- **Only organisation owners** can add or remove organisation-wide skills.
- Path: **Organization settings > Skills** (`https://claude.ai/admin-settings/skills`).
- Upload format: **a `.zip` containing a `SKILL.md`**.
- Surfaces reached: **chat on the web, the Chat tab in Claude Desktop, and Claude Cowork**. The
  article does **not** list Claude Code or the API — consistent with the cross-surface warning in
  1.7.
- Admins can switch off user-created skills, leaving only provisioned and built-in ones.
- The article states **no** size or count limit. Treat the absence as unknown, not as unlimited.

Separately, from 1.7: Enterprise organisations can turn on **skill and plugin security scanning**
at the same settings page; it does not cover the API, pre-existing skills, or organisations on
CMEK / ZDR / HIPAA configurations.

**SEARCH-ONLY, not re-derived from a primary page:** a search summary stated Cowork is off by
default on Enterprise at launch and turns on by default from 10 September 2026 unless disabled,
and is on by default on Team. Ben should confirm ASH's actual Cowork state in the admin console
rather than rely on this line.

---

## Part 2 — OpenAI primary sources

### 2.1 Prompt caching

`https://developers.openai.com/api/docs/guides/prompt-caching`. Fetched 2026-09-16.

Minimum cacheable prefix: **1,024 tokens** for GPT-5.6 and later; earlier models vary by request
settings. Matching granularity: GPT-5.5 and earlier round **down to the nearest multiple of 128**
at model-dependent intervals; GPT-5.6 uses exact eligible boundaries without rounding.

Discount: *"discounted up to 90%"*, with GPT-5.6 at *"0.1x the uncached input-token rate"*.

Retention: GPT-5.6 keeps an entry **30 minutes after its most recent write or reuse**. Earlier
models: in-memory entries typically survive **5-10 minutes of inactivity, up to one hour**; the
24h option typically **~30 minutes**, retained up to **24 hours**.

Invalidators: model change, tool definition / ordering / schema change, output format change,
**reasoning effort change**, **text verbosity change**, and context compaction. Quoted: *"Cache
reuse requires the entire rendered prefix to match."*

Placement rule, quoted: *"Put stable developer instructions and shared reference material
first… place those at the end rather than the beginning, or move them into later conversation
messages"* for anything dynamic.

GPT-5.6 supports implicit and explicit caching (`prompt_cache_options.mode: "explicit"` with
`prompt_cache_breakpoint`); earlier models are implicit only. `prompt_cache_key` gives stable
routing on pre-5.6 models and separate cache accounting after.

**SEARCH-ONLY, from OpenAI's own caching material via search summary, not re-derived:** the
counter-intuitive arithmetic that padding a 900-token prompt to 1,100 tokens to cross the caching
threshold can *reduce* total cost at a 50% hit rate (~33% saving) or 70% (~55%). Worth knowing,
worth verifying against the page before anyone acts on it.

### 2.2 GPT-5 family reasoning and verbosity controls

**SEARCH-ONLY throughout — the GPT-5.2 prompting guide and the GPT-5 developer post were read via
search summaries, not fetched.** Re-derive before quoting.

Two separate dials, which is the portable point: `reasoning_effort` controls internal reasoning
tokens (GPT-5: minimal/low/medium/high; GPT-5.2 adds none and xhigh), and `text.verbosity`
(low/medium/high) controls output length only. The summarised finding — that raising effort
improves accuracy while raising verbosity changes explanation length without changing accuracy —
came from an arXiv evaluation paper, not from OpenAI, and is reported here as such.

### 2.3 AGENTS.md

`https://agents.md/` and surrounding coverage. **SEARCH-ONLY.**

Released by OpenAI **August 2025**, transferred to the Linux Foundation's Agentic AI Foundation in
late 2025. Adoption figures from search summaries (170+ AAIF members, 60,000+ repositories) are
unverified. Supported by Codex, Copilot, Cursor, Gemini/Jules, Windsurf, Zed and others; Claude
Code reads `AGENTS.md` as a fallback where no `CLAUDE.md` exists. Plain Markdown, no schema.

Relevance here: it is the one artefact where a single instruction file can carry a project's
context rules to every agent tool at once — which is what "applies across all models" looks like
in practice for a repo.

---

## Part 3 — Google primary sources

### 3.1 Long context

`https://ai.google.dev/gemini-api/docs/long-context`. Fetched 2026-09-16.

Query placement, quoted: *"the model's performance will be better if you put your query /
question at the end of the prompt (after all the other context)"*.

Context caching is named as the primary optimisation for long-context work. The page reports
needle-in-a-haystack retrieval at approximately **99%** accuracy for single queries and gives
**no** figures for degradation patterns — so it does not, on its own, support any claim about
long-context decay.

### 3.2 Context caching

`https://ai.google.dev/gemini-api/docs/caching` and the implicit-caching announcement.
**SEARCH-ONLY.**

Implicit caching on by default for Gemini 2.5 and newer; minimum **2,048 tokens** on the Gemini
API, **4,096** for open models on Google Cloud; cached tokens billed at **10%** of standard input.
The placement guidance matches everyone else's: keep the start of the request identical and put
the varying part at the end.

---

## Part 4 — The cross-provider finding

### 4.1 Context rot (Chroma)

`https://www.trychroma.com/research/context-rot` (the `research.trychroma.com` path 301-redirects
here). Page states **July 2025**, authors **Kelly Hong, Anton Troynikov, Jeff Huber**.
Fetched 2026-09-16.

**18 models across four families** — Anthropic (Opus 4, Sonnet 4, Sonnet 3.7, Sonnet 3.5,
Haiku 3.5), OpenAI (o3, GPT-4.1 and mini/nano, GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo), Google
(Gemini 2.5 Pro/Flash, 2.0 Flash) and Alibaba (Qwen3-235B-A22B, 32B, 8B).

Core finding, quoted: *"Model performance varies significantly as input length changes, even on
simple tasks."* Models do not process context uniformly; reliability falls as tokens accumulate,
well before the window is full.

Per-experiment results as the page reports them:

1. **Needle-question similarity.** Lower semantic alignment between the target and the query
   produces steeper degradation at length. High-similarity pairs hold up.
2. **Distractors.** A *single* distractor already costs accuracy against baseline; multiple
   distractors compound non-uniformly. Claude models showed the lowest hallucination rates,
   GPT models the highest.
3. **Needle-haystack similarity.** Inconsistent across haystack types; no clean rule.
4. **Haystack structure.** Models did *better* on shuffled, incoherent haystacks than on
   logically structured ones. Counter-intuitive, and it held across all 18.
5. **LongMemEval (conversational QA).** A substantial gap between a focused ~300-token context
   and a full ~113k-token one. Thinking modes narrowed it without closing it.
6. **Repeated words.** Even trivial replication degraded with length: misplaced words,
   under-generation, and content not present in the input.

**Why this is the load-bearing citation for a cross-model skill.** It is the only source in this
pack that is (a) independent of any vendor, (b) evaluated across all four major families, and
(c) about *quality*, not cost. Everything else here argues that a smaller context is cheaper.
This argues that a smaller context is also **more accurate** — which is what makes the discipline
worth keeping even on an unmetered plan or a flat-rate seat.

**Limits to state honestly:** it is a vendor's research blog, not peer-reviewed; the models tested
are the mid-2025 generation, and none of the 2026 frontier models appear in it. The direction of
the finding has not, as far as this pack establishes, been contradicted since — but nobody should
present the specific magnitudes as current.

---

## Part 5 — What is universal and what is one vendor's mechanic

This split is the whole answer to "something that can be applied globally, across all models".

**Universal — holds on Anthropic, OpenAI and Google, each stated on that vendor's own page:**

1. **Input is re-sent every turn.** A conversation is not a running state the provider holds; the
   whole prefix goes up with each request. Long sessions cost on every message, not once.
2. **Stable content first, volatile content last.** All three vendors give this rule for caching,
   in almost identical words (1.4, 2.1, 3.2). Google gives the *same* ordering independently for
   accuracy (3.1). A single layout satisfies both.
3. **Cache reads are roughly a tenth of fresh input.** Anthropic 0.1x (0.025x on two models),
   OpenAI "up to 90%" off / 0.1x on GPT-5.6, Google 10%. The rule that follows is the same
   everywhere: **do not disturb the prefix**.
4. **A minimum length exists below which nothing caches**, and crossing it is silent — 512 to
   4,096 tokens (Anthropic, by model), 1,024 (OpenAI GPT-5.6+), 2,048 (Gemini API).
5. **Caches expire in minutes.** 5 minutes to 1 hour depending on vendor, tier and setting. The
   first message after lunch reprocesses everything.
6. **More context is less accurate, not just dearer** (4.1, across 18 models). Distractors cost
   accuracy at n=1.
7. **Keep the question at the end** (3.1 explicitly; 1.4 and 2.1 arrive at the same layout from
   the caching side).
8. **Retrieve just in time; hold identifiers, not contents** (1.1). Reading a slice beats reading
   a file; a path is a few tokens and a file is thousands.
9. **Isolate high-volume work and return a summary** (1.1, 1.5). Costs the same tokens somewhere,
   but keeps them out of the prefix that is re-sent for the rest of the session.

**Vendor-specific mechanics — do not port these:**

- `cache_control` breakpoints, the 20-block lookback, and the tools→system→messages hierarchy are
  Anthropic's (1.4). OpenAI is implicit-by-default with an explicit mode only on GPT-5.6+ (2.1).
  Google 2.5+ is implicit with no breakpoint concept exposed (3.2).
- The **128-token rounding** is OpenAI's on GPT-5.5 and earlier, and is gone on GPT-5.6 (2.1).
- **`reasoning_effort` / `text.verbosity`** are OpenAI parameter names (2.2). Anthropic's
  equivalent is effort levels and `MAX_THINKING_TOKENS` on fixed-budget models (1.5).
- Changing reasoning effort or verbosity **invalidates the OpenAI cache** (2.1). Anthropic's
  table makes effort and thinking parameters *model-specific* invalidators (1.4). Same trap,
  different rule — check per vendor rather than assuming.
- The **25,000-token tool response cap** is Claude Code's default, not a model property (1.2).
- `/clear`, `/compact`, `/context`, `/usage`, `CLAUDE.md`, hooks and subagents are Claude Code
  surfaces (1.5). The portable equivalents are: start a new conversation; summarise and restart;
  whatever the tool's context readout is; and `AGENTS.md` (2.3) for the instruction file.

---

## Part 6 — The local evidence

The library does not need to borrow an incident for this one; this repo produced three in the
fortnight to 2026-09-15, all recorded in `docs/HANDOVER_cli-transport_2026-09-15.md` and
`LESSONS_LEARNED.md`.

**The 73,030-token question that was never asked.** A cross-agent review seat was handed the
literal string `{prompt}` because argv substitution was missing. The Gemini seat spent 73,030
input tokens reasoning about a placeholder, ran to the 150-second print timeout, and produced no
section. The tell was there — a correct review turn on the same seat cost 27,320 tokens and took
40 seconds — but the failure looked like a known prior, so nobody asked what the seat had actually
received.

The chain of shas, each verified with `git show -s` on 2026-09-16 rather than recalled:
`faca163` (2026-09-15 14:36) is the commit that *recorded the wrong reading*, filing the run as
"a real review turn timed out"; `64871d5` (19:29) is the code fix that substitutes `{prompt}` for
argv seats; `18288d7` (19:31) is the relabel that says the 73,030-token result was the placeholder
and not a review turn; `2a7e652` (20:15) is lessons entry 16. The cost of a wrong-input agent run
is paid in full before anybody can see it is wrong, and the mislabel outlived the fix by two
minutes and the wrong reading by five hours.

**The silent stdin ceiling.** `agy` 1.2.3 accepts a prompt on stdin, and drops any line over
roughly 23,500 bytes: **returns success, empty response, zero usage, nothing on stderr**
(23,184 bytes answered, 23,884 did not, across nine probes). Landed as `cef4930`. A payload
ceiling that fails silently is the input-side twin of the caching minimum in 1.4, which also fails
silently.

**The measured cost of the fix.** About **260k Gemini input tokens** went on the stdin probes and
the ceiling search, at roughly 20k per successful probe, with the dropped calls costing nothing.
The handover's own conclusion — *"The answer to a long exchange is shorter sections or fewer
seats"* — is the same conclusion as Part 5, arrived at from measurement rather than from a vendor
page.

And from the earlier multi-agent work, already carried by `commission-the-roster`: an agent
briefed at roughly 150k reported using *"roughly half the ~150k budget"* while its metadata read
**310,017** — an error of four times, with no dishonesty in it. An agent has no instrument for its
own spend. Measured 2026-08-03.

---

## Part 7 — What this pack does not establish

Stated plainly so that nothing downstream overstates it:

- **No threshold for "too much context".** No vendor publishes one, and Chroma's finding is a
  gradient, not a cliff. Any skill that names a percentage is inventing it.
- **No figure for the cost of a wasted session.** The `$13 per developer per active day` average
  (1.5) is a deployment average across enterprises, not a per-session claim.
- **No verified adoption numbers for AGENTS.md** (2.3) and no first-hand reading of the GPT-5
  prompting guides (2.2).
- **No current confirmation of ASH's Cowork state** (1.8) — that is an admin-console check.
- **No measurement of what the `context-economy` skill itself costs to load.** Per 1.6, its
  description is pre-loaded for every session whether it fires or not; its body is only paid for
  when it fires. The description is the part that must stay short.

## Provenance

Every URL above was fetched on **2026-09-16** except those labelled SEARCH-ONLY, which reached
this pack through search-result summaries and are flagged inline. Vendor minimums, TTLs, price
multipliers and model tables are the most volatile facts here; re-read 1.4, 2.1 and 3.2 before
quoting any of those numbers in anything that leaves the building.
