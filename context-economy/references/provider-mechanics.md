# Provider caching and context mechanics

## Contents

- What is universal (safe to assume on any provider)
- Anthropic mechanics
- OpenAI mechanics
- Google mechanics
- Cross-provider comparison table
- What does not port
- Re-verification

**All figures below were read from the vendor's own page on 2026-09-16.** They move. Re-read the
page before quoting any number from this file in anything that leaves the building. Full extraction
notes, including which facts came from a search summary rather than the page itself, are in
[docs/RESEARCH_2026-09-16_token-efficiency.md](../../docs/RESEARCH_2026-09-16_token-efficiency.md).

---

## What is universal

These hold on Anthropic, OpenAI and Google, each stated on that vendor's own documentation. They
are the only things safe to assume without checking.

1. **The whole prefix is re-sent on every turn.** Conversations are stateless at the provider.
2. **Stable content first, volatile content last.** All three give this rule for caching; Google
   gives the same ordering independently for accuracy.
3. **A cache read costs roughly a tenth of fresh input.** Hence: do not disturb the prefix.
4. **A minimum cacheable length exists, and falling below it fails silently.**
5. **Caches expire in minutes**, not hours, unless explicitly extended.
6. **Changing a setting can invalidate a cache**, not only changing content.

---

## Anthropic mechanics

Source: `https://platform.claude.com/docs/en/build-with-claude/prompt-caching`
(`docs.claude.com` 302-redirects here). Read 2026-09-16.

**Explicit breakpoints.** Marking a block with `cache_control` writes exactly one cache entry: a
hash of the prefix ending at that block. No entries are written for earlier positions.

**Prefix hierarchy:** `tools` → `system` → `messages`. A change at one level invalidates that
level and everything after it.

**Lookback window: 20 blocks.** At most 20 positions are checked per breakpoint, counting the
breakpoint itself. A run of consecutive `tool_use` blocks counts as one position; so does a run of
consecutive `tool_result` blocks.

**Placement rule, quoted:** *"Place `cache_control` on the last block whose prefix is identical
across the requests you want to share a cache."* For a varying suffix (timestamps, per-request
context, the incoming message), the breakpoint goes at the end of the static prefix, never on the
varying block.

**Minimum cacheable prefix**, per the page's table on 2026-09-16:

| Model | Minimum tokens |
|---|---|
| Fable 5.1, Mythos 5.1, Opus 5, Fable 5, Mythos 5 | 512 |
| Opus 4.8, Sonnet 5, Sonnet 4.6, Sonnet 4.5, Opus 4.1, Opus 4, Sonnet 4 | 1,024 |
| Mythos Preview, Opus 4.7 | 2,048 |
| Haiku 3.5 | 2,048 |
| Opus 4.6, Opus 4.5, Haiku 4.5 | 4,096 |

Quoted: *"Shorter prompts cannot be cached, even if marked with `cache_control`. Any requests to
cache fewer than this number of tokens will be processed without caching, and no error is
returned."*

**Price multipliers against base input:** 5-minute write 1.25x, 1-hour write 2x, read 0.1x for
most models and 0.025x for Fable 5.1 and Mythos 5.1.

**Non-obvious invalidators:** toggling web search, toggling citations, changing the speed setting,
and changing `tool_choice` all invalidate at or below `system`. Images invalidate `tools` and
`system`. Thinking and effort parameters are model-specific invalidators. Thinking blocks cannot
carry `cache_control` directly, but do count as input tokens when read from cache.

**Cacheable:** tool definitions, system blocks, text in user and assistant turns, images and
documents in user turns, tool use and tool results. **Not cacheable:** empty text blocks,
sub-content blocks such as citations (cache the top-level block instead).

### Claude Code specifics

Source: `https://code.claude.com/docs/en/costs`, read 2026-09-16.

- **Cache lifetime: one hour on a subscription**, dropping to five minutes once drawing on usage
  credits; five minutes by default on an API key or cloud provider.
- **Tool responses are capped at 25,000 tokens by default** (source: Anthropic, "Writing effective
  tools for AI agents", 11 September 2025).
- MCP tool definitions are **deferred by default** — only names and server instructions enter
  context until a tool is used. CLI tools add no per-tool listing at all.
- Thinking tokens bill as **output**. Default budgets can run to tens of thousands of tokens per
  request. Lower with `/effort`; `MAX_THINKING_TOKENS` works only on fixed-budget models, and
  adaptive-reasoning models ignore a nonzero budget.
- `/compact` reads the whole conversation to summarise it. `/clear` costs nothing.
- Agent teams: approximately **7x** a standard session when teammates run in plan mode.
- Idle sessions still draw: scheduled tasks, cross-session messages and goal check-ins each send
  the full context when they fire.

---

## OpenAI mechanics

Source: `https://developers.openai.com/api/docs/guides/prompt-caching`. Read 2026-09-16.

**Implicit by default.** GPT-5.6 and later also support explicit mode
(`prompt_cache_options.mode: "explicit"` with `prompt_cache_breakpoint`); earlier models are
implicit only.

**Minimum cacheable prefix: 1,024 tokens** for GPT-5.6 and later. Earlier models vary by request
settings.

**Matching granularity:** GPT-5.5 and earlier round **down to the nearest multiple of 128** at
model-dependent intervals. GPT-5.6 uses exact eligible boundaries with no rounding.

**Discount:** *"discounted up to 90%"*; GPT-5.6 at 0.1x the uncached input rate.

**Retention:** GPT-5.6 keeps an entry 30 minutes after its most recent write or reuse. Earlier
models: in-memory entries typically survive 5-10 minutes of inactivity, up to one hour; the 24h
option typically ~30 minutes, retained up to 24 hours.

**Invalidators:** model change, tool definition / ordering / schema change, output format change,
**reasoning effort change**, **text verbosity change**, and context compaction. Quoted: *"Cache
reuse requires the entire rendered prefix to match."*

**`prompt_cache_key`:** stable routing on pre-5.6 models; optional separate cache accounting after.

**Reasoning and verbosity** (SEARCH-ONLY — read via search summary, not the page; re-derive before
quoting): `reasoning_effort` controls internal reasoning tokens (GPT-5: minimal/low/medium/high;
GPT-5.2 adds none and xhigh). `text.verbosity` (low/medium/high) controls output length only.
These are two separate dials and conflating them wastes money in the wrong place.

---

## Google mechanics

Sources: `https://ai.google.dev/gemini-api/docs/long-context` (read 2026-09-16) and
`https://ai.google.dev/gemini-api/docs/caching` (SEARCH-ONLY).

**Implicit caching on by default** for Gemini 2.5 and newer. No breakpoint concept is exposed.

**Minimum: 2,048 tokens** on the Gemini API; **4,096** for open models on Google Cloud.
Cached tokens billed at **10%** of standard input.

**Query placement, quoted from the long-context page:** *"the model's performance will be better
if you put your query / question at the end of the prompt (after all the other context)."* This is
an accuracy claim, independent of caching, and it happens to produce the same layout.

The page reports needle-in-a-haystack retrieval at approximately **99%** for single queries and
gives no degradation figures — it does not, on its own, support any claim about long-context decay.

---

## Cross-provider comparison

| | Anthropic | OpenAI | Google |
|---|---|---|---|
| Caching mode | Explicit `cache_control` | Implicit; explicit on GPT-5.6+ | Implicit (2.5+) |
| Minimum prefix | 512-4,096 by model | 1,024 (GPT-5.6+) | 2,048 API / 4,096 open models |
| Read discount | 0.1x (0.025x on two models) | up to 90% off; 0.1x on GPT-5.6 | 10% of input |
| Write premium | 1.25x (5m) / 2x (1h) | none stated | storage per hour |
| Lifetime | 5m default, 1h option | ~30m (GPT-5.6) | not read |
| Granularity | Block boundaries, 20-block lookback | 128-token rounding pre-5.6; exact after | not exposed |
| Silent sub-minimum failure | Yes, stated | Not stated | Not stated |

---

## What does not port

Carry the universal rules anywhere. Leave these behind:

- `cache_control`, the 20-block lookback, and the `tools` → `system` → `messages` hierarchy are
  Anthropic's alone.
- The 128-token rounding is OpenAI's, on GPT-5.5 and earlier only.
- `reasoning_effort` and `text.verbosity` are OpenAI parameter names. Anthropic's nearest
  equivalents are effort levels and `MAX_THINKING_TOKENS` on fixed-budget models.
- **Effort and verbosity invalidate the cache on OpenAI unconditionally**; on Anthropic the same
  parameters are listed as model-specific invalidators. Same trap, different rule — check per
  vendor rather than assuming either way.
- The 25,000-token tool response cap is a Claude Code default, not a model property.
- `/clear`, `/compact`, `/context`, `/usage`, `CLAUDE.md`, hooks and subagents are Claude Code
  surfaces. `AGENTS.md` is the portable instruction file.

---

## Re-verification

```bash
# The four pages this file is built from
# https://platform.claude.com/docs/en/build-with-claude/prompt-caching
# https://code.claude.com/docs/en/costs
# https://developers.openai.com/api/docs/guides/prompt-caching
# https://ai.google.dev/gemini-api/docs/long-context
```

For current Claude model ids and prices, load the **claude-api** skill rather than adding a price
table here — one home per fact, and that is its home.
