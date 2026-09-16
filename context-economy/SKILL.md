---
name: context-economy
description: Keep the context window small and its prefix stable, because every token in it is re-sent on every later turn. Read slices instead of whole files, cap tool and log output before it lands, isolate high-volume work behind a summary, and clear rather than compact between unrelated tasks. Triggers when about to read a large file, log, dataset, transcript or search result into context; when a session has grown long, auto-compacted, or hit a usage limit mid-task; when writing or growing an instruction file (CLAUDE.md, AGENTS.md, GEMINI.md) or a skill; and when assembling a prompt from a static part and a varying part. Does not fire on pricing a recurring job or reporting what an action cost (price-the-spend), shaping a multi-agent roster (commission-the-roster), writing the handover at the end of a session (handover), or designing a product path that sends data to a model (ai-surface-discipline).
---

# Context economy

A cross-agent review seat was handed the literal string `{prompt}`, because the argv path
substituted every placeholder except that one. The Gemini seat spent **73,030 input tokens**
reasoning about a placeholder, ran to the print timeout, and produced no section. A correct review
turn on the same seat, the same day, cost **27,320 tokens** and completed in 40 seconds. The tell
was sitting in the numbers. Nobody looked, because the failure resembled a known prior, so the run
was filed as "a real review turn timed out" (`faca163`) and stayed mislabelled for five hours
until `64871d5` fixed the substitution and `18288d7` corrected the record.

Two things follow from that, and this skill is both of them. The seat was **sent the wrong
input**, and the whole cost was incurred before anyone could see it was wrong. There is no partial
refund on a bad context.

## The one mechanic everything else follows from

A conversation is not state the provider holds. The entire prefix goes up with every request.
Claude Code's own cost documentation puts it plainly: *"Claude Code sends your full conversation
with every request, and each time Claude uses tools it sends another request carrying that batch
of tool results"*, and therefore *"a one-line question in a session that has been open all day
still draws usage for the whole conversation."*

So a token is not paid once. It is paid on the turn it enters and on every turn after it, until
the session is cleared. A 40,000-token file read at 10am is still being re-sent at 4pm. Caching
makes the re-send cheap, not free, and only while the prefix is undisturbed.

This holds on Anthropic, OpenAI and Google alike. It is not a Claude Code quirk.

## Rule 1: read the slice, not the file

Hold identifiers, not contents. A path is a handful of tokens; the file is thousands. Retrieve
just in time, at the narrowest width that answers the question.

- `grep` with `-n` and a `head_limit` before any `Read`. The line number tells you where to look;
  the file tells you everything you did not ask.
- `Read` with `offset` and `limit` when you know the region. `sed -n '120,180p'` where a shell is
  cheaper.
- `git log --oneline`, `git show -s --format=...`, `git diff --stat` before the full forms.
- Ask a database for `count(*)` and five sample rows before `select *`.
- **Do not re-read a file to verify an edit you just made.** `Edit` and `Write` fail loudly when
  they fail; a confirming read buys nothing and is paid on every subsequent turn.
- Batch independent calls into one turn. Two searches in one message cost the same tokens as two
  searches in two messages, but the second message also re-sends the first result.

## Rule 2: cap the output before it lands, not after

Once a 30,000-line log is in context it is in the prefix for the rest of the session. Truncation
after the fact removes nothing already paid for.

Put the filter on the producing side: `| head`, `| grep -c`, `--stat`, `--quiet`, `-o` to print
only matches, a `LIMIT` in the query, a hook that greps before the agent sees anything. Claude
Code's cost page gives the shape as a worked example: a `PreToolUse` hook that rewrites a test
command to show only failures takes *"tens of thousands of tokens"* of log down to *"hundreds"*.

Anthropic's tool-writing guidance sets the default ceiling to design against and the behaviour to
prefer: *"For Claude Code, we restrict tool responses to 25,000 tokens by default"*, and when
truncating, steer toward *"many small and targeted searches instead of a single, broad search"*.
The same guidance measures one Slack result at **206 tokens** verbose against **72 tokens**
concise: a third of the size, carrying the same information.

Prefer a CLI to an MCP server where both exist. `gh`, `aws`, `gcloud` and friends add no per-tool
listing to the prompt at all.

## Rule 3: keep the prefix stable

Every major provider bills a cache read at roughly a tenth of fresh input, and every one of them
gives the same structural rule in near-identical words: **stable content first, volatile content
last.** Anthropic: place the breakpoint *"at the end of the static prefix, not on the varying
block"*. OpenAI: *"Put stable developer instructions and shared reference material first"*, and
move anything dynamic to the end. Google: keep the beginning of the request identical and add the
changing part at the end.

Google gives the same ordering a second time for a completely different reason, accuracy:
*"the model's performance will be better if you put your query / question at the end of the prompt
(after all the other context)."* One layout satisfies both. There is no trade-off to weigh.

Three traps that cost a full reprocess and announce nothing:

- **Below the minimum, nothing caches and no error is raised.** Anthropic: *"Any requests to cache
  fewer than this number of tokens will be processed without caching, and no error is returned."*
- **A cache expires in minutes.** The first message after lunch reprocesses the whole prefix.
- **Settings invalidate caches, not just content.** Changing reasoning effort or verbosity
  invalidates on OpenAI; tool definitions, tool choice and images invalidate on Anthropic.
  Re-ordering a tool array is enough.

Per-provider minimums, TTLs and multipliers are in
[references/provider-mechanics.md](references/provider-mechanics.md), with the date each was read.
They move. Do not quote them from here or from memory.

## Rule 4: clear beats compact between unrelated tasks

Compaction is not free. `/compact` reads the entire conversation in order to summarise it, so
compacting a large context is itself a large request. `/clear` costs nothing.

- Switching to unrelated work: **clear**. Nothing in the old task earns its re-send.
- Continuing the same work past the window: **compact**, and say what to keep.
  `/compact Focus on the failing test and the migration`. An unsteered summary keeps what it
  guesses and drops what you needed.
- A summary is lossy in a specific direction: it preserves narrative and drops exact strings.
  Re-derive file paths, line numbers, shas and counts from the repo after any compaction rather
  than trusting the summary's version of them. This is where **verified-citations** and
  **live-state-first** earn their place.

## Rule 5: isolate high-volume work behind a summary

Delegating verbose work to a subagent does not reduce the tokens spent doing it. It keeps them out
of the prefix that is re-sent for the rest of the parent session. That is the whole benefit, and
it is a real one.

Anthropic's context-engineering guidance puts the target return at *"often 1,000-2,000 tokens"* of
distilled output per subagent. If the subagent hands back a transcript, you have paid for the
isolation and kept the cost.

Isolation is not parallelism, and it is not free. Claude Code's own figure: agent teams use
*"approximately 7x more tokens than standard sessions when teammates run in plan mode"*, because
each teammate carries a full context window of its own. Before appointing more than one, load
**commission-the-roster**; that skill shapes the wave, this one only says why a single isolated
reader is worth its cost.

## Rule 6: an instruction file is paid for in every session

Anything loaded at session start is in the prefix whether the session needs it or not. Skills are
the opposite: only `name` and `description` are pre-loaded, and the body is read when the skill
actually fires.

- Claude Code's guidance: *"Aim to keep CLAUDE.md under 200 lines by including only essentials."*
  Workflow-specific instructions belong in a skill, not the always-on file.
- A skill's `description` is the part that is always paid for. Keep it short and specific; keep
  the body under the documented 500 lines; push detail into `references/`, which costs nothing
  until read.
- **Reference files must be one level deep from SKILL.md.** A nested reference gets partially read
  (`head -100`) and acted on incompletely. Give any reference over 100 lines a table of
  contents for the same reason.
- Every skill added competes for recall: *"Each Skill's metadata (name and description) competes
  for attention in the system prompt."* The cost of a library is paid in every session; the
  benefit only in the sessions where a skill fires.

## Smaller context is also more accurate

This is the part that survives a flat-rate seat, where nothing appears to cost anything.

Chroma's 2025 *Context Rot* study evaluated **18 models** across Anthropic, OpenAI, Google and
Alibaba, and found performance varies significantly with input length *"even on simple tasks"*,
well before the window is full. A **single distractor** already cost accuracy against baseline.
Models did *better* on shuffled, incoherent haystacks than on logically structured ones, and that
held across all 18. Even trivial word-repetition degraded with length.

State its limits honestly when citing it: it is a vendor's research blog, not peer-reviewed, and
the models tested are the mid-2025 generation. The direction is well evidenced; the magnitudes
should not be presented as current.

The practical reading: irrelevant context is not inert. It is a distractor competing with the
thing you actually need the model to attend to. "It still fits" was never the question.

## Measure, do not estimate

An agent has no instrument for its own spend. Measured on this library on 2026-08-03: an agent
briefed at roughly 150k reported using *"roughly half the ~150k budget"* while its metadata read
**310,017**, wrong by four times, with no dishonesty in it.

Take the number from the harness, never from the prose:

- `/context`: what is in the window now, and what is occupying it.
- `/usage`: session totals, and from v2.1.251 a `Prompt cache (main)` line giving the share of
  input served from cache, the miss count, and whether the cache is warm. The breakdown flags any
  behaviour accounting for *"10% or more"* of recent usage, cache misses and long context included.
- API `usage` metadata: `cache_read_input_tokens` against `input_tokens` gives the cache hit rate.
  A low rate with a long stable system prompt means something is disturbing the prefix.

If you are about to state what something cost, **price-the-spend** owns that report. This skill
only insists the figure be read rather than guessed.

## Porting this to another agent

Rules 1 through 6 are provider-independent and worth carrying anywhere. The surfaces differ:

| This | Elsewhere |
|---|---|
| `/clear` | Start a new conversation |
| `/compact <focus>` | Summarise the state yourself, paste it into a fresh session |
| `/context`, `/usage` | Whatever readout the tool exposes; otherwise the API's `usage` block |
| `CLAUDE.md` | `AGENTS.md` (Codex, Copilot, Cursor, Gemini, Windsurf, Zed; Claude Code reads it as a fallback) or `GEMINI.md` |
| Hooks that pre-filter | A wrapper script around the command |
| Subagent isolation | A separate session that returns only its conclusion |

Write the portable rules into `AGENTS.md` where a repo is worked by more than one vendor's agent,
so the context discipline is not re-taught per tool. Vendor-specific mechanics (`cache_control`
breakpoints, OpenAI's 128-token rounding, `reasoning_effort`) do **not** port; they are listed
per provider in [references/provider-mechanics.md](references/provider-mechanics.md).

## Routes

- The spend is a recurring job, a scheduled workflow, or you are reporting what an action cost:
  **price-the-spend**.
- You are about to appoint more than one agent: **commission-the-roster** before the first spawn.
- The context band is amber or red and the session is ending: **handover**.
- You are building a product path that sends data to a model, where input minimisation is a
  regulatory matter and not only a cost one: **ai-surface-discipline**.
- A filter you added to shrink output is dropping content rather than hiding empty things:
  **no-silent-data-drop**.
- You are quoting a model price or a model id: **claude-api**, which holds the current figures.
- You have just compacted and are about to cite a path, line or sha from the summary:
  **verified-citations**.

## What this skill does not do

It does not price anything, cap any endpoint, or decide how many agents to appoint. It does not
argue for shorter output to the user. A truncated answer that causes a follow-up question costs
more than the full answer did. Its whole subject is what enters the context window and what stays
in it.

## Why

Every other kind of waste announces itself. A wasted context does not: the session still works,
the answers still arrive, and the only signal is a usage window that empties earlier than the work
justifies. By the time it shows, the tokens are spent, re-sent, and spent again. The 73,030-token
run produced a plausible-looking failure that matched a known prior, and the cost of the wrong
input was fully paid before anyone could examine what the seat had been asked.

And on a flat-rate seat where none of it appears on a bill, the accuracy argument still stands on
its own: across 18 models, more context measurably made the answers worse.

## Provenance and maintenance

Date stamp: 2026-09-16. Evidence base and every source URL with its fetch date:
[docs/RESEARCH_2026-09-16_token-efficiency.md](../docs/RESEARCH_2026-09-16_token-efficiency.md).
Local incidents: `docs/HANDOVER_cli-transport_2026-09-15.md` section 15, `LESSONS_LEARNED.md`
entry 16 (`2a7e652`), and the 2026-08-03 budget self-report already carried by
`commission-the-roster`.

Volatile facts and their re-checks:

| Fact | Re-verify with | Expected |
|---|---|---|
| Cache minimums, TTLs, multipliers | `references/provider-mechanics.md`, then the vendor pages it cites | A dated table; re-read the pages if the date is stale |
| 25,000-token tool response default | Anthropic "Writing effective tools for AI agents" | A Claude Code default, not a model property |
| `CLAUDE.md` under 200 lines, SKILL.md under 500 | Claude Code cost docs; Agent Skills best practices | Both stated by Anthropic, both guidance rather than enforced limits |
| Agent teams ~7x | Claude Code cost docs, "Manage agent team costs" | Scoped to teammates running in plan mode |
| Context rot, 18 models | `trychroma.com/research/context-rot` | July 2025, mid-2025 model generation |
