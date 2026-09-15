# Adversarial review: the agent-bus design, and what survived verification

Reviewed: `docs/DESIGN_agent-bus_2026-09-15.md` at commit `ccdeb2a`.
Reviewer: a subagent, briefed to attack rather than assess, read-only, barred from running
`agy` or `codex` (those calls cost money).
Verification: by Claude, afterwards, against the primary source.

**Outcome: the design is not being built as specified.** The review's verdict — add a CLI
transport to `cross-agent-review` instead of building an MCP server — was accepted by Ben on
2026-09-15. Section 4 records why.

---

## 1. How to read this

`findings-are-evidence` is one of the always-on norms: a subagent report is evidence, not
findings. Every item below carries its verification status, and the three categories mean
different things.

| Status | Meaning |
|---|---|
| **RAN** | Re-derived by invoking the primary source. The strongest claims here are this. |
| **READ** | A claim about text in the design note. Checked by reading it; true on its face. |
| **PUSHED BACK** | The finding overstates. What remains of it is recorded. |

Two findings were **strengthened** by verification: the reviewer could not run the CLIs, so
it did not know how much worse two of its own findings were.

## 2. Findings

### F4 — the verification ledger over-claimed, and `codex exec resume` does not work as documented — **RAN**

Design §10 claimed "everything in the `gpt` adapter block" was verified by a real run. Only
one turn had been run; the `continue` argv had never been executed.

Running it: **exit 2, `error: unexpected argument '-s' found`.**

**And the part the reviewer could not reach.** `codex exec resume` takes a *narrower flag set*
than `codex exec`. Absent: `--sandbox`, `--cd`, `--add-dir`, `--approve-for-me`, `--profile`.

The consequence is larger than a wrong argv. Design §6 claimed `trust` is enforced "in argv
construction, not in prompt text or the spoke's good behaviour". That holds for turn 1 and is
**false for every continuation turn**: the sandbox can only be inherited, and the bus has no
way to assert what was inherited. A design whose security rests on argv construction cannot
construct the argv that carries it.

With `-s` removed, resume works: same `thread_id`, and it quoted its own previous reply.

### F2 — the cost model was refuted by the document's own measurement — **RAN, with one correction**

The design costed a 3-seat 3-round thread as nine turns × a flat floor, two sections after
recording that `agy` turn 2 cost twice turn 1 because `--conversation` replays history.

Measured for Codex, which had never been measured: **turn 1 = 21,425 input tokens, turn 2 =
42,879. Exactly 2.00×.** The reviewer derived this by analogy from `agy`; it holds.

So the design's own worked example is under-counted roughly 2×, and the recommended "last-N
window" does not touch the dominant term at all — the CLI replays its own history regardless
of what the bus sends, and the seat then sees its own prior turns twice.

**The fork the design never named:** native continuity and a bus-controlled flat bill are
mutually exclusive. Resume is what the whole parking model depends on.

**Correction to the reviewer's arithmetic.** 33,408 of those 42,879 tokens were *cache reads*.
Cached input is billed at a discount, so the raw-token doubling overstates the bill even
though it is exactly right about context growth. The growth term is real; the money impact is
softer than the reviewer's table. Anyone quoting a figure should check current pricing first.

Also correct, and unaddressed: **the hub's own tokens are outside the budget instrument**,
and the hub is the most expensive seat.

### F11 — the recommended window does not fit in argv on this platform — **RAN**

The reviewer flagged this for verification rather than asserting it. Measured through Node's
`spawn` on this machine: **OK at 32,000 characters, `ENAMETOOLONG` at 32,700.** About 8,000
tokens of prompt, shared with every other flag.

A last-6 window of substantial replies exceeds that. Both spawns then fail with an OS error,
which — with no status channel on the Codex side (F6) — is indistinguishable from "the seat
did not answer", so the ladder parks a seat that was never asked. Every collab thread would
die at round 3 on the default config.

Both CLIs accept a prompt on stdin. The adapter contract had no `promptVia` field.

### F1 — the bank records what each seat *said*, never what it was *shown* — **READ**

Nothing in the tool surface records the composed prompt. Four mechanisms make what a seat saw
differ from what `conclude()` renders: window eviction, substitution (the substitute has no
conversation id, so it enters with the window only while others carry native history), park
and resume, and CLI-side replay the bus cannot inspect.

The failure is that an agreement and an artefact of eviction are indistinguishable in the
delivered artefact. This is `no-silent-data-drop`'s shape: the bank keeps everything, the
prompt composer drops, and `conclude()` is the renderer that looks complete. The design
invokes LESSONS 13 for the *seat* gap and rebuilds the identical failure one layer down for
the *context* gap.

### F8 — spoke output is labelled untrusted for one of its three consumers — **READ, strengthened by F4**

Design §6: "The bus labels spoke output as untrusted content when handing it to Claude."
Spoke output has three consumers — Claude's context, the bank, and **other spokes' prompts**,
which §3 calls the collaboration mechanism itself. Only the first is specified.

A spoke quoting attacker-influenced repo content into its reply gets that text composed into
another full agent's prompt with no untrusted framing. `-s read-only` bounds writes; it is not
an exfiltration boundary, and the shared transcript is the channel. `{cwd}` was never defined,
so scope was unbounded too.

F4 makes this worse: on continuation turns the sandbox flag cannot even be set.

### F9 — turn ordering manufactures false consensus — **READ**

`broadcast()` ordering was never specified. Parallel means no seat sees any other, so it is N
one-shots wearing a round number. Sequential means position determines knowledge: the first
seat answers blind, the last has read both peers. `conclude()` renders them under one round
heading and the reader sees corroboration. `cross-agent-review` guards exactly this with its
turn rule and `NEXT:` line, and states the guarantee: never a false consensus.

### F5 — `agent-collab` was `cross-agent-review` with the disciplines subtracted — **READ**

Same turn mechanics; dropped the citation requirement, concede-on-evidence, the round cap with
a stop token, and the two-positions outcome. Worse, `agent-dispatch` carried the
`findings-are-evidence` discipline explicitly and `agent-collab` did not — so the cheap
one-shot mode verified its input and the expensive mode, whose output is banked to disk and
composed into other agents' prompts, did not. That inverts the risk.

### F6 — "three outcomes, three signals" was unimplementable — **READ**

The contract's own rule demands answered / rate-limited / unreachable be distinguishable. The
`gpt` adapter block had no status or error path at all, and the design deliberately chose
`-o {replyFile}` — a channel carrying no outcome signal — while instructing implementers not
to parse the JSONL that carries one. `{replyFile}` reused across turns also means a failed
turn leaves the *previous* turn's reply in place to be banked as the new one.

Design §10 then collapsed the rule to two signals anyway ("any non-`SUCCESS` counts as not
answered"), so an expired auth token and an exhausted quota become the same record.

### F7 — the spend instrument is success-only and lagging — **READ**

Usage arrives in `turn.completed` *after* the turn is paid for, so a cap can report an
overrun but not prevent one. And a turn that dies at the timeout emits no envelope, so it
banks **zero** measured spend while having burned real compute — the instrument
systematically under-counts the expensive failures. LESSONS 13's class line, applied to money.

### F15 — config defects inside a block labelled `// VERIFIED` — **RAN**

`gemini-pro` carried `model: "gemini-3.5-flash-medium"` (the premium seat running a flash
model), and `fallbackTo: "gemini-flash"` named a seat defined nowhere in the config, so rung 2
resolved to a dangling reference.

### F3 — §1's derivation does not select the architecture it claims to — **PUSHED BACK, core accepted**

The reviewer argued §1 attacks something nobody would build, since a CLI subprocess is never
idle and so never needs waking.

**Pushed back:** §1 is not a straw man. "An MCP server they all connect to and chat through"
was the operator's actual opening framing, and explaining why it fails was necessary.

**Accepted, and it is the finding that changed the outcome:** "it falls out of the only
transport that works" is an overclaim. Once spokes are subprocesses, *anything* can invoke
them — including Claude through the Bash tool, with no MCP server at all. §8d compared the bus
only against other people's MCP servers. **The cheapest competitor was never on the table.**

### Minor — **RAN**

§7's "Neither CLI is on PATH here" was contradicted by §7a and §7b in the same document.
And the proposed skill name `agent-dispatch` collides with the prior-art project of the same
name that the document suggests forking.

## 3. What the reviewer got wrong

Little, and nothing structural. The one substantive correction is the cache-read nuance in F2:
the token doubling is real, the billing impact is softer. The one overstatement is F3's
framing of §1 as a straw man.

Notably, its two flagged-for-verification items were both **correct** — the argv ceiling
within 70 characters of its recalled figure, and Codex's replay growth within a rounding error
of its derived 2×. It marked both as needing verification rather than asserting them, which is
the behaviour that made the rest of the report worth spending time on.

## 4. The decision

**Prototype the file-relay route first.** Add a CLI transport to `cross-agent-review`: Claude
runs `agy` and `codex` directly, appends each reply to the existing `REVIEW_*.md`, and records
each seat's conversation id in the file.

What that buys on day one, without an MCP server:

- **No prompt pasting** — the original goal.
- **Banking for free** — the file is append-only and written after every turn.
- **Gap rendering for free** — a seat that did not answer has no section, which cannot be
  confused with a seat that had nothing to add.
- **Park and resume for free** — the file and the stored ids persist; a new session re-arms
  the watcher and continues.
- **F1 cannot occur** — the file *is* the prompt, so what a seat was shown and what it said
  are the same record.
- **The disciplines retained** — citation rule, concede-on-evidence, the anti-self-reply turn
  rule, converge-or-two-positions.

The design note argued against itself on this point: §3 claimed the bus is "the only place a
bank can live that survives the hub session ending", while §9 praised the file relay because
"it survives the session". The second is the true one.

**What the bus would still add** — the roster with limit state, the degradation ladder, a
structured budget — is worth having and needs no MCP server. All three were unimplementable as
specified (F6, F13, F7). They are candidates for the relay route once it earns them.

FORWARD: if the file-relay transport proves too limited, the bus findings above are the
starting point, not a fresh page.
