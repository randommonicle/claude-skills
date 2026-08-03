---
name: commission-the-roster
description: Before spawning a fleet of agents, publish a roster for the operator's approval - role, model tier, token budget, scope and single artifact per agent - and brief each agent with pre-verified facts instead of questions. Triggers when appointing a lead agent, delegating a multi-agent wave, planning a commission whose shape is not yet known, choosing which model tier does which job, or when a usage window emptied faster than the work justified. Does not fire on spawning one agent for one bounded task, and does not price the result (price-the-spend reports the burn afterwards).
---

# Commission the roster

A single PropOS session appointed a lead plus five senior agents, each with two interns, plus a
merge sitter. Roughly eighteen identities. The surfaced ledger came to about **4.6M tokens over
16 agent-run-segments, averaging 290k a segment**, and it emptied a five-hour usage window well
before the wave finished. It delivered five merged PRs, so it was not a failure. It was three or
four times dearer than the same five PRs needed to be, and none of the excess was visible while
it happened.

Where it actually went, largest first:

- **The orientation tax.** Every fresh agent loaded the project skills, read the project
  instructions, grepped migrations for the live schema, and read a handover before producing a
  line. Call it 60k to 120k each. Across 16 segments that is roughly 1.5M tokens spent
  re-deriving facts the lead already held in front of it.
- **Tier misallocation.** Opus seniors were assigned a seventeen-site comment pass, test
  scaffolding, docs mechanics, evidence capture and git chores. Every one of those is Sonnet
  work. The comment pass did not need judgement, it needed care.
- **An agent with no artifact.** The merge sitter cost 315k, about 7% of the session, and twice
  reported "continuing to watch" after it had gone idle. A blocking `gh run watch` in a
  background command costs approximately nothing and cannot lie about being awake.

Headcount was not the variable. Cutting the roster from eighteen to three, with each segment
still costing 290k and the work still needing 16 segments, would have saved nothing.

## The two dials, which are constantly confused

**Total burn** = scope x context-per-agent-turn x model rate. Every tool result a subagent
receives is re-sent with the next call, so an agent holding 120k of context and making 40 tool
calls is not a 120k agent. Context size per agent is the multiplier on everything it does. Fix
total burn with briefs, tiers and tight scope.

**How fast the window empties** = concurrency. Three agents in parallel cost the same tokens as
three in series; they just front-load the spend into a rolling window. Fix that, and only that,
with a concurrency cap.

An operator who says "the slot went in ninety minutes" has the second problem. An operator who
says "that wave was expensive" has the first. The same complaint usually contains both, and
capping headcount only ever addresses one of them. Say which one you are fixing.

## Rule 1: the roster is approved before anything spawns

The operator cannot approve a plan that does not exist yet, which is the whole difficulty. So do
not ask them to. Hand the lead an **allocation policy**, require it to publish a **roster**
against that policy, and gate spawning on approval of the roster. The roster is a table the
operator can trim in ten seconds without knowing the technical plan:

| # | Role | Model | Budget | Scope (paths) | Single artifact | Fresh or resume |

Anything absent from the approved roster does not get spawned. An agent that wants a helper
comes back to the lead, and the lead comes back to the operator, because sub-delegation is
exactly how a nine-agent plan becomes thirty.

## Rule 2: tier by decision class, not by seniority of the topic

Seniority language ("Senior Database Engineer") invites the best model by flattery. Assign the
tier to the kind of decision being made:

- **Strategic planning, operator-facing decisions, gate reviews, line review of diffs:** best
  available model. This is the lead. The lead does not grep the repo and does not write feature
  code, because reading files at the highest rate per token is the most expensive habit in the
  commission.
- **Regulated build** (migration, RLS policy, trigger, money column, audit chain, statutory
  gate): the strong build tier. This is where dual derivation and adversarial review belong.
- **Unregulated build** (UI, tests, a refactor inside one module): the mid tier.
- **Evidence collection, docs mechanics, grep sweeps, git chores, scaffolding, formatting:** the
  mid tier, or the cheap tier where the output is purely mechanical.
- **Adversarial review:** strong tier, on regulated diffs only. On an unregulated diff, name the
  check instead of spawning a reviewer. A seventeen-site comment pass is reviewed by a grep.

Load **claude-api** for current model ids rather than naming versions here, and note the
separate reliability constraint: cheap tiers drift on schema, so any grounding claim about
columns or constraints comes back tier-scoped and gets re-grepped.

## Rule 3: delegate facts, not questions

This is the rule that recovers the orientation tax, and it is worth more than every other rule
combined. The expensive prompt is "work out the reconciliation seam and fix it". The cheap one
hands over what the lead already verified:

```
ROLE: <one sentence>
SCOPE: exactly these paths, nothing else: <paths>

FACTS, pre-verified by the lead. Do NOT re-derive:
  - <fact, quoted, with file:line>
  - migration slot <n>, confirmed free across all refs on <date>
  - decisions that bind: <log entry date + one line each>
  If you believe any fact above is wrong, STOP and say which and why.
  Do not investigate it yourself.

RE-DERIVE ANYWAY (regulated, dual derivation required): <list, or "none">

BUDGET: ~<n>k tokens. If you approach it, stop and report what remains undone
  rather than continuing.
DELIVERABLE: one <artifact>. Report the diff and the evidence, not a narrative.
OUT OF SCOPE: <what it must not touch>. If you find necessary work outside SCOPE,
  report it and STOP. Do not do it, however obviously right it looks.
```

The "do not re-derive" line collides with **live-state-first** and **findings-are-evidence** on
purpose, so bound the collision explicitly rather than leaving each agent to guess:

- **Dual derivation stays mandatory** where those skills bite: migrations, RLS, triggers, money
  columns, audit chains, and any claim that will be written into a durable artifact. Name those
  in the RE-DERIVE ANYWAY line. Two independent derivations of a migration is a control, not
  waste.
- **Everywhere else, handing over a verified fact is not a shortcut**, it is declining to pay
  twice for the same grep. UI work, docs passes, comment sweeps, test scaffolding and git chores
  do not need to rediscover the schema.

The STOP clause is what keeps this honest. An agent that silently accepts a wrong fact is worse
than one that re-derives everything, so give it a cheap, explicit way to refuse. Extend the same
courtesy to scope: an agent that finds necessary work outside its remit should report it and
stop, because the reasoning that justifies stepping outside will be sound most of the time, and
the one time it is not, nobody was asked. Measured 2026-08-03: an agent scoped to `docs/` edited
five files outside it, including the repo's always-on instruction file. Every edit was correct
and its argument was good. It still should have come back.

**Budget derive-it-yourself scope separately, and expect it to dominate.** This rule saves
tokens when you hold the facts. When you genuinely do not, the derivation IS the expensive part,
and a cheaper tier does not make it cheap, it makes it more tool-heavy. Measured 2026-08-03, one
wave, one repo:

| Agent | Tier | Brief | Tokens | Tool calls |
|---|---|---|---|---|
| Docs mechanics | mid | "derive this yourself" on 3 of 4 tasks | **310,017** | 102 |
| Adversarial review | strong | nine pre-verified facts, tight file list | 144,467 | 36 |
| Strategic review | strongest | verified findings only, repo access denied | **44,305** | **0** |

The cheap tier cost 2.1x the strong one, and the most expensive model in the commission was the
cheapest agent in it. Tier sets the rate, scope sets the volume, and volume wins by enough that
tier barely shows. So mark the derive-it-yourself rows in the roster explicitly and budget them
at a multiple rather than a discount. Handing over facts you do not have is not an option, and
pretending you have them is worse, so the honest move is to name the uncertainty and pay for it
deliberately.

## Rule 4: no agent without a single named artifact

If you cannot name the one file, diff, or report an agent will produce, it is not an agent, it
is a habit. The three that recur:

- **Watchers and sitters.** Use a blocking command in a background task. It notifies on
  completion, costs nothing, and a stopped agent watches nothing while still claiming to.
- **Collators.** The lead already holds every result. Collation is a lead turn, not a spawn.
- **Coordinators.** A second coordinator underneath the lead doubles the briefing cost and
  halves the accountability.

## Rule 5: resume over respawn, and cap the concurrent builders

**Resume.** Continuing an existing agent reuses its warm context instead of paying orientation
again. Mark every roster row fresh or resume, and prefer resume. Several agents in a wave are
usually the same identities coming back, which is the cheap shape, not a shortcut.

**Concurrency.** Cap the agents producing a mergeable change at **two**, and set the cap from
the merge pipeline rather than from the token budget: shared-database smokes serialise, a
one-PR-at-a-time rule is common, and a newly arriving run can cancel an older queued one so a
required check never reports at all. A third builder in flight buys queue thrash and rework, not
throughput. Non-PR work (design notes, probes, docs) runs alongside freely.

## The commission prompt

Paste this at the top of any wave whose shape is not yet known. It is the operator's half; the
lead produces the roster in reply.

```
COMMISSION: <one line, what this wave delivers>

Before spawning anything, publish a roster for my approval:
| # | Role | Model | Budget | Scope (paths) | Single artifact | Fresh/resume |

Apply this allocation policy and justify any departure IN the roster:
- Strategic planning, my decisions, gate reviews, line review of diffs: best
  available model. That is you. You do not grep the repo and you do not write
  feature code.
- Regulated build (migration, RLS, trigger, money, audit chain, statutory gate):
  strong build tier.
- Unregulated build (UI, tests, single-module refactor): mid tier.
- Evidence capture, docs, grep sweeps, git chores, scaffolding: mid or cheap tier.
- Adversarial review: strong tier, regulated diffs ONLY. Elsewhere name the check
  instead of spawning a reviewer.
- Watching, polling, sitting, collating: NO agent. Blocking background command.

Brief every agent with pre-verified FACTS (file:line, quoted) and an explicit
"do not re-derive, STOP if you disbelieve one" clause. Name separately anything
that MUST be dually derived because it is regulated.

Concurrency: at most 2 agents producing a mergeable change at once.
Reuse: resume existing agents rather than spawning fresh ones; say which in the roster.
Ceiling: <N> agent-run-segments for this wave. Stop and report if you near it.
No sub-delegation: an agent wanting a helper comes back to you, and you to me.

Wait for my yes on the roster. Report actual per-agent token burn when the wave closes.
```

A sane default roster for a single wave is about six live identities and eight to ten
run-segments: one lead, two builders, one reviewer that fires only on regulated diffs, two
interns, zero watchers.

## Traps

- **Naming an agent by seniority sets its model by flattery.** "Senior Contracts Engineer"
  reads as a case for the best tier. The decision class is what sets the tier, so write the
  decision class into the roster row and let the title be decoration.
- **Fan-out multipliers hide inside the plan, not the roster.** One-verifier-per-finding or
  one-judge-per-design turns a planned nine agents into thirty, and the roster looked fine.
  Cap the multiplier explicitly: verify only the high-severity findings, or run one verify pass
  over all findings at once.
- **An orchestration mode that says "cost is not a constraint" is not consent to spend.**
  Harness modes that direct fan-out by default are a permission to orchestrate, never an
  instruction the operator authorised. Reasoning effort and orchestration breadth are separate
  dials: raising the depth of thinking on one agent is cheap next to spawning five more, so
  reach for effort before reaching for headcount.
- **The lead's own context is billed at the highest rate in the commission.** A lead drifting
  past half its window re-sends that window every turn. Keep the lead reading briefs and diffs,
  never repositories.
- **Two agents in one working copy invalidate every recon either did.** Give each agent its own
  worktree or serialise them, and expect a fresh worktree to need a dependency install before
  anything runs. See **parallel-work-recon**.
- **A budget line is decoration even WITH a stop instruction, because the agent has no meter.**
  Measured 2026-08-03: an agent briefed at "roughly 150k, stop and report what remains" spent
  310,017 tokens and then reported that it had "used roughly half the ~150k budget". It was not
  being dishonest. It cannot see its own consumption, so it estimated, and the estimate was out
  by a factor of four. Write the number anyway, because it sets intent and it makes the overrun
  legible afterwards, but never treat it as a control. The only real ceilings are one the harness
  enforces and a scope too small to overrun. **If a task genuinely must not exceed a budget, cut
  the scope until it cannot.**

## Routes

- The wave has closed and you owe the operator its cost, load **price-the-spend** (this skill
  shapes the spend, that one reports it).
- You are about to act on what an agent reported, load **findings-are-evidence**.
- An agent's brief asserts schema, policy or config state, load **live-state-first** to decide
  what genuinely needs re-deriving versus what can be handed over verified.
- The wave produces a plan before it produces code, load **plan-first** and put the roster in
  the plan.
- Multiple agents share one repository, load **parallel-work-recon** for worktree and
  identifier discipline.

## What this skill does not do

It does not decide whether to use agents at all, and it does not price the outcome
(**price-the-spend** owns the arithmetic, before and after). It governs one moment: the
commission, between deciding to delegate and the first spawn.

## Why

A commission's cost is decided entirely in its first five minutes and is invisible for the rest
of it. Every structural choice that matters, tier per role, context per brief, artifact per
agent, concurrency, resume versus fresh, is made before any work starts and cannot be revisited
once agents are running, because by then the orientation is already paid and the only remaining
lever is stopping. Publishing a roster converts all of that into one table an operator can trim
in ten seconds. Evidence: PropOS, 2026-07-31, about 4.6M tokens over 16 run-segments across
eighteen identities for five merged PRs, roughly a third of it recoverable by briefing and
tiering alone. Then PropOS again, 2026-08-03, where a four-agent wave run to this skill's own
rules cost 499k for a confirmed three-HIGH review, a strategic ruling and a docs pass, and where
the two measurements that corrected the skill both came from watching what the agents actually
spent rather than from what they reported spending.
