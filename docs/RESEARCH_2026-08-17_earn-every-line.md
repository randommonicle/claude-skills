# Research pack — earn-every-line (2026-08-17)

The evidence base behind the earn-every-line skill, preserved verbatim as delivered.
Two web-research subagents were commissioned on 2026-08-17 (roster published in-session;
Sonnet tier, ~80k budget each; actual burn 164k and 149k — the budget line is intent,
not a control, as commission-the-roster predicts). Part 1 is the community-evidence
sweep; Part 2 is the canonical-citation verification pass. Each pack carries its own
per-item status labels (VERIFIED / PARTLY / gap), and those labels governed what the
skill was allowed to quote: PARTLY items are paraphrased with attribution in the skill,
never placed in quotation marks.

Lead's own re-derivations (findings-are-evidence): Fowler's Yagni bliki and Metz's The
Wrong Abstraction were fetched and confirmed first-hand; the Anthropic "Overeagerness"
section was fetched and confirmed first-hand, with one correction to Part 1's framing —
the doc's tendency sentence is scoped to Claude Opus 4.5/4.6 specifically ("Claude Opus
4.5 and Claude Opus 4.6 have a tendency to overengineer..."), not to Claude generally,
and the skill attributes it that way. The same first-hand fetch confirmed the sample
prompt's full defensive-coding bullet verbatim, one sentence of which Part 1's excerpt
does not carry; the skill quotes from it on this basis: "Defensive coding: Don't add
error handling, fallbacks, or validation for scenarios that can't happen. Trust
internal code and framework guarantees. Only validate at system boundaries (user
input, external APIs)."

Known access gaps, honestly carried: Reddit was unreachable to Part 1's tooling (the
evidence leans on HN, GitHub, arXiv, and vendor docs instead); Part 2 could not open the
Ousterhout extract PDF, the Refactoring book text, or several other primaries — its
per-item caveats say exactly what a human with a browser should confirm before quoting
those verbatim anywhere.

---

# PART 1 — Community evidence (Sonnet subagent, verbatim)

# What practitioners name when AI code is over-engineered or over-commented

Research pass, web-only. Companion to the existing verified Reddit-tell taxonomy (do not
re-derive frequencies here — this file is specifics and remedies only).

Methodology note / limitation: direct Reddit fetches (reddit.com JSON, `site:reddit.com`
searches) were blocked or unproductive in this pass — WebFetch cannot reach reddit.com,
and `site:` search operators mostly surfaced non-Reddit content. Hacker News (via the
Algolia API, which returns real structured comment data), one GitHub Discussions thread,
named-author blogs, and Anthropic's own published docs carried this research instead. A
handful of secondary "how to stop Claude over-engineering" blogs (codersera.com,
mcp.directory, bswen.com, explainx.ai, theaiarchitects.com) are 2026 content-marketing
sites riding the trend, not primary community sources — they are marked as such below and
used only as corroboration, never as the sole source for a claim. Where a lead looked
promising but I could not verify it to a specific, checkable source, I say so rather than
polish it into a citation.

---

## 1. Named over-engineering patterns in AI code

**Speculative abstraction (interface/factory/strategy for one implementation)**
- "tendency to overengineer by creating extra files, adding unnecessary abstractions, or building in flexibility that wasn't requested" — Anthropic, official Claude prompting docs, section "Overeagerness" (https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#overeagerness)
- "When the context you give to the LLM includes unnecessary complexity, it will assume that you want unnecessary complexity" — HN user jongjong, on "Vibe coding creates a bus factor of zero" (https://news.ycombinator.com/item?id=49003386 thread family; via https://hn.algolia.com/api/v1/search)
- Secondary corroboration only (codersera.com blog, unverified as primary): "You ask for one function; you get an interface, a base class, a factory, and a 'strategy' pattern."
- Consensus: **strong** — this is the one pattern named by the vendor's own documentation as well as independent developers; it is the closest thing to an undisputed headline complaint.

**Single-caller helper extraction**
- Named example from a secondary source (bswen.com, Mar 2026, not independently verified): functions like `validateUserInput()` and `sanitizeInput()` called out as "used in 1 place" each, extracted anyway.
- Anthropic's own remedy text names the same failure mode from the other side: "Don't create helpers, utilities, or abstractions for one-time operations" (same Overeagerness section as above).
- Consensus: **moderate** — real and named, but I found it mainly in the vendor's prescriptive guidance and in secondary blogs, not in raw HN/Reddit complaint threads with this specific vocabulary.

**Premature configurability ("flexibility nobody asked for")**
- "building in flexibility that wasn't requested" — Anthropic, same Overeagerness doc as above.
- Anthropic's own sample fix text: "A simple feature doesn't need extra configurability."
- Consensus: **moderate** — named explicitly by the model vendor; less visible as a distinct complaint in community threads, which tend to fold it into "unnecessary abstraction" generally rather than call out unused parameters/options as their own tell.

**Unnecessary classes / excessive type definitions**
- Secondary source only (bswen.com): "Interfaces created for simple objects when inline types suffice," alongside a demonstrated case of a "35-line validation function reduced to 12 lines with identical functionality."
- Consensus: **weak-to-moderate** — plausible and consistent with the abstraction complaints above, but I could not find this named as its own distinct tell in a primary community thread; treat as a sub-case of speculative abstraction rather than a separate pattern.

**Blanket defensive try/except, "just in case" branches, silent fallbacks that mask errors**
- Anthropic's own remedy text names it directly: "Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees." (Overeagerness section)
- Empirical anchor: GitClear's 2026 report measured "error-masking constructs" rising 47% in AI-era commits (see Section 4 for full citation) — this is the closest thing to a quantified version of the "silent fallback" complaint.
- Consensus: **strong** on the general shape (defensive over-coding is one of the most repeated complaints across every source type in this research), but the specific "just in case" phrasing is mine/the brief's, not a term I found practitioners using verbatim — they describe the behaviour more than they name it.

**Backwards-compatibility shims nobody asked for**
- "shimming a function signature that has exactly one caller" — secondary source (codersera.com), describing what it calls "Backward-compatibility theater."
- Consensus: **weak** — I could not corroborate this specific pattern with a primary HN/GitHub/Reddit quote within budget. Flagged as a plausible but thinly-sourced lead; worth a follow-up pass specifically on this if the skill wants to name it.

**v2 / "enhanced" / parallel-file forks instead of edits**
- Anthropic's own docs acknowledge the adjacent behaviour directly, under "Reduce file creation in agentic coding": Claude "may sometimes create new files for testing and iteration purposes" and the docs supply a standard instruction to have it delete scratch files afterward (https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#reduce-file-creation-in-agentic-coding).
- Secondary source (codersera.com) names the sharper version: "A two-line helper gets its own module," under "file sprawl."
- Consensus: **moderate** — the milder "creates scratch files" version is vendor-confirmed; the sharper "forks a whole v2/enhanced file instead of editing" complaint (the one your organisation instructions already guard against) is widely assumed in the AI-coding-advice ecosystem but I did not find a named, quoted community complaint about it specifically — most sources jump straight to the prescribed rule ("edit, don't fork") without quoting an incident that provoked it.

**Dead code kept "for future use"**
- Not independently corroborated for AI-generated code specifically. The general software anti-pattern is well documented (the "boat anchor" anti-pattern: modules kept "just in case" but never used), but I found no primary AI-specific complaint using this language within budget.
- Consensus: **weak / gap** — treat as assumed-but-unverified for this deliverable.

**Scope creep / unrequested "improvements" while making a change**
- Not one of the brief's named items, but it showed up unprompted often enough to flag: "Claude code makes it so easy to do things the 'right way' that it also makes scope creep get out of hand" — HN user subarctic, "I'm OK being left behind, thanks" (via hn.algolia.com search).
- Secondary source (codersera.com) names it "Scope drift": "reformatting, renaming, re-ordering imports, upgrading a pattern it dislikes."
- Consensus: **strong** — arguably as commonly named as speculative abstraction; recommend the skill treat this as a first-class pattern alongside the brief's original list.

---

## 2. Named comment/docstring patterns

**Comments that restate the line ("what" not "why")**
- "they are frankly redundant comments" / "the comments it creates are... redundant 99% of the time" — GitHub user zz-james, Copilot community discussion, 28 Apr 2025 (https://github.com/orgs/community/discussions/157778)
- "it typically suggests comments about the _what_" rather than the why, and "it _never_ will suggest the way that I would phrase it" — GitHub user jalfje, same thread, 13 Jun 2025
- Consensus: **strong** — the single most repeated comment complaint across every source type (GitHub, HN, blogs).

**Essay-length / "wall of text" comments on trivial code**
- "Claude-written code is quite easy to spot - because it has this particular style of overly verbose 'walls of text' comments, that... repeat verbatim what the code just below does" — HN user OleksandrC, on "Codeberg bans vibe coded projects" (https://news.ycombinator.com/item?id=49003386)
- "Opus 5 seems to produce way too verbose comments and that makes it harder to read all of it" — HN user jaegerpicker, "AI Coding and Its Discontents" thread (https://news.ycombinator.com/item?id=49242660)
- "I have to yell at Gemini to not add so many comments it almost writes more comments than code by default" — HN user hu3, "Your LLMs get rid of comments? Mine add them incessantly" (https://news.ycombinator.com/item?id=45624429)
- Consensus: **strong** — corroborated across three independent HN threads plus the GitHub Copilot discussion.

**Changelog/diff-narration comments ("this used to be X", "// changed", "// new version")**
- Comments that "talk about 'how things used to be before we changed it here' (useless to anyone reading the code now)" — HN user OleksandrC, same Codeberg thread as above.
- "commit messages suffer from the same verbose prose" as the code comments — same commenter, same thread.
- Consensus: **moderate-strong** — well-named in this one thread with multiple corroborating replies; I did not independently find a second, unrelated thread using this exact framing, so treat it as strongly evidenced but from a single primary source.

**Diary/step narration ("First, we...") and reviewer-directed justification ("this ensures...")**
- Weakest-evidenced item in this section. I found strong adjacent evidence (verbose walls of text, restating-the-line, narrating what rather than why) but no clean, independently-sourced verbatim example of literal step-by-step diary narration or a comment explicitly written to reassure a human reviewer. Anthropic's own docs describe the closely-related agentic *chat* behaviour — "Claude Opus 5 narrates readily during agentic work: it tends to announce what it is about to do" (https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5#user-facing-progress-updates) — which is the same narrating impulse showing up in conversation rather than in code comments. Treat the in-code version as plausible-by-extension, not independently confirmed.
- Consensus: **weak for the code-comment form specifically; strong for the equivalent chat-narration form**, which is vendor-documented.

**AI replacing a meaningful comment with a trivial one**
- "The agent will come through and replace that reasoned comment with 'Add one to index'" — HN user lolc, same "Your LLMs get rid of comments" thread (https://news.ycombinator.com/item?id=45624429)
- "The generators are really bad at intent, they just write dross comments about the how" — same commenter, same thread.
- Consensus: **moderate** — one strong corroborated source; useful specifically because it's a documented failure mode of *removing/replacing* a good comment, not just adding bad ones (relevant to the anti-goal in Section 5).

**Redundant/low-information param docs and banner comments**
- Not separately named by a primary source in this pass. The GitHub thread's "restates the what" complaint (zz-james, jalfje above) is the closest coverage; no distinct verbatim example of banner/section-comment complaints specifically about AI output was found.
- Consensus: **weak / gap**.

**Counter-evidence worth carrying into the skill: not everyone experiences excess commenting**
- "Your LLMs get rid of comments? Mine add them incessantly" — thread title itself (HN, id 45624429) frames a genuine split: some practitioners report models stripping their hand-written comments, others report models burying code in unwanted ones. Model, prompt, and harness (Claude Code vs. raw API vs. Copilot) appear to matter.
- One practitioner reports deliberately keeping AI-added comments as a review artifact: "I remove redundant comments AI adds specifically to demonstrate that I have reviewed the code" — HN user lukeschlather, same thread. Worth noting as a minority but sophisticated practice.

---

## 3. Remedies practitioners converge on

**Anthropic's own shipped remedy (the single most authoritative text found in this research)**
Anthropic's official prompting documentation names the failure mode ("Overeagerness") and supplies exact prompt language to fix it, aimed at exactly the file's target patterns:
> "Avoid over-engineering. Only make changes that are directly requested or clearly necessary... Don't add features, refactor code, or make 'improvements' beyond what was asked... Don't add docstrings, comments, or type annotations to code you didn't change. Only add comments where the logic isn't self-evident... Don't add error handling, fallbacks, or validation for scenarios that can't happen... Don't create helpers, utilities, or abstractions for one-time operations."
(https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#overeagerness — paraphrased/excerpted above, not reproduced in full)
This is not a community workaround — it is the vendor confirming the complaint is real and shipping the fix as documentation. Treat this as the strongest single source in the whole file.

**The "N+ call sites before you abstract" bright line**
- Secondary source (codersera.com, unverified as primary): "Inline first; abstract only when there are 3+ real call sites," explicitly framed as "a bright line instead of a vibe."
- Consensus: **moderate** — a clean, memorable rule that shows up in multiple secondary "how to configure CLAUDE.md" posts, but I could not trace it to a single originating primary-source practitioner.

**"Edit the file, don't fork a new one"**
- Secondary source (codersera.com): recommended CLAUDE.md line, "Do NOT create new files unless strictly required. Prefer editing an existing file over adding a new one."
- Corroborated in spirit by Anthropic's own "Reduce file creation in agentic coding" guidance (Section 1 above), though Anthropic's version is about cleaning up scratch files, not about forbidding v2-style forks outright.
- Consensus: **moderate**.

**YAGNI applied to the AI workflow itself, not just the code**
- "I think YAGNI applies here: don't front-load this work. Only set those up if you run into specific problems" — HN user kelnos, on over-building CLAUDE.md/tooling scaffolding itself rather than the target codebase (https://news.ycombinator.com/item?id=49003386 thread family; via hn.algolia.com search). Note the context: this is YAGNI applied to *how much tooling infrastructure to build for the agent*, not a direct "stop writing over-engineered app code" complaint — a useful adjacent data point, not a perfect match.
- Consensus: **moderate**, and useful precisely because it shows YAGNI-as-remedy generalising beyond code into agent configuration.

**"Comments only for why, not what"**
- GitHub user jalfje wanting comments on "why" rather than "the _what_" (Section 2, above) is the community-side pull.
- Named-author remedy table (Saad Tarhi, 25 Nov 2025, https://www.saadtarhi.com/blog/ai-generated-comments-and-docs-you-cant-trust): replace generic comments with "small, targeted notes on non-obvious decisions: timeouts, fallbacks, API assumptions," and test any surviving comment by asking whether it "restates code or reveals non-obvious knowledge."
- Anthropic's own text again matches: "Only add comments where the logic isn't self-evident."
- Consensus: **strong** — three independent source types (community, named-author blog, vendor) converge on the identical rule.

**Does it hold up, or does the model regress? Mixed, and this is the most important nuance for the skill.**
- Direct empirical evidence that the standard remedy (a written context/instruction file) can backfire: a peer-reviewed-style evaluation, "Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?" (Gloaguen, Mündler, Müller, Raychev, Vechev; arXiv:2602.11988, v1 12 Feb 2026, v2 23 Jun 2026 — verified via https://arxiv.org/abs/2602.11988) found LLM-generated context files **decreased** task success by roughly 2-3% on average, human-written files improved it by roughly 4% ("a marginal gain"), and both increased inference cost by over 20%. Core mechanism named in the paper: "agents, like humans, can be over-instructed" — a context file that names a specific tool causes the agent to over-rely on it "nearly exclusively," and repository-overview-style content (the most common thing people put in these files) was specifically found unhelpful.
- Practitioner reports of instructions eroding over a long session are common in the secondary blog ecosystem (context compaction, instruction-file bloat) but I could not verify the specific figures those posts cite (e.g. a claimed "150-200 instruction" ceiling) to any primary source — flagged as an unverified secondary claim, not included as fact.
- Consensus: **the remedy itself is not in dispute; its durability is.** The clearest documented risk is not "the model ignores the rule" but "the rule works too literally and narrows or distorts behaviour in a new way" — directly relevant to the skill's anti-goal.

---

## 4. Empirical anchors

**GitClear, "AI Copilot Code Quality" (2025 research, published ~Feb 2025, analysing 211M lines)**
- Duplicated code blocks (copy/paste) rose roughly eightfold in 2024 versus the prior baseline; 2024 was the first year on record where within-commit copy/paste exceeded "moved" (refactored) code.
- Code churn: approx. 3.3% pre-AI baseline → 5.7% in 2024 → 7.1% in 2025 (roughly doubling over two years).
- Refactoring (lines classified as "moved") fell from about 25% of changed lines in 2021 to under 10% by 2024, while "copy/pasted" lines rose from 8.3% to 12.3% over the same period.
- (https://www.gitclear.com/ai_assistant_code_quality_2025_research — summary also at https://www.jonas.rs/2025/02/09/report-summary-gitclear-ai-code-quality-research-2025.html)
- Consensus/status: **primary, quantified, from a company whose business is exactly this measurement** — treat as strong but note GitClear is a commercial code-review vendor with a product interest in this narrative; the topline numbers are widely re-cited but I did not find independent replication.

**GitClear, "The Maintainability Gap: 2026 AI Code Quality Research" (published Jan 2026, a separate/later report)**
- Block duplication rose 81% from 2023 to 2026 (40.3 → 73.0 duplicated blocks per million changed lines); copy/paste now occurs roughly 5x more often than refactoring.
- "Moved" (refactored) code fell from 21% (2022) to 3.8% (2026) — a 70% relative decline.
- Cross-file function calls fell 35% since 2023 (343 → 223 per thousand changed lines) — the report's proxy for new code "standing alone" rather than integrating with existing systems.
- **Error-masking constructs rose 47%** — GitClear's own quantified version of the "silent fallback" complaint in Section 1.
- Named framing from the report itself: "The headline is not 'AI writes bad code.' It is that today's default AI workflow is incentivized to deliver atomic code... while quietly taxing the invisible and the deferred."
- (https://www.gitclear.com/the_ai_code_quality_maintainability_gap)
- Consensus/status: same caveat as above (commercial vendor, self-published); the two GitClear reports use different methodologies/date ranges and should be cited as two separate anchors, not combined into one figure.

**Academic: AI-generated comment *quality* is not obviously worse — a needed counterweight**
- Guelman et al., "On the Quality of AI-Generated Source Code Comments: A Comprehensive Evaluation" (arXiv:2408.14007, evaluated Nov 2025 revision). Using GPT-3.5 Turbo against 415 Java code elements, human raters scored 58.8% of AI-generated comments as equivalent to the human original and 27.7% as superior; automated metrics (BLEU, ROUGE-L, METEOR) correlated only weakly-to-moderately with human judgment.
- (https://arxiv.org/html/2408.14007v2)
- Why this matters for the skill: the community complaint is about **volume and placement** (too many comments, restating obvious lines, narrating changes), not about factual comment *accuracy* — the one academic study found on this narrow question suggests AI comments are often fine or better on correctness. The skill should target verbosity/redundancy specifically rather than imply AI comments are typically wrong.

**Academic: does a CLAUDE.md/AGENTS.md-style remedy actually work?**
- Covered in full in Section 3 — Gloaguen et al., arXiv:2602.11988 (ETH Zurich-affiliated authors; verified via arXiv abstract page). Directly relevant here as the one controlled, quantified test of the community's own preferred remedy, with a negative-to-marginal result.

**Provider guidance acknowledging the tendency directly**
- Anthropic, "Overeagerness" section, prompting best practices docs (quoted in Section 1/3): names overengineering as a known model tendency in Claude Opus 4.5/4.6, with a shipped mitigation prompt.
- Anthropic, "Prompting Claude Opus 5" docs, section "Task scope and over-verification": "Claude Opus 5 verifies its own work without being told to... instructions like these [explicit verification steps] cause over-verification on Claude Opus 5, and removing them reduces wasted tokens with no loss in quality." (https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5#task-scope-and-over-verification) — the vendor documenting that a *previous-generation* remedy for thoroughness now itself needs pruning, i.e. the over-correction problem running the other direction.
- Same page, "Response length and verbosity": Claude Opus 5's "default user-facing responses run longer than prior Opus models'," and lowering reasoning effort "does not reliably shorten the visible response" — verbosity is named as a specific, current, model-level trait requiring explicit counter-prompting, not solved by generic "be concise" settings.
- I found no equivalent public OpenAI/Codex documentation making a comparably explicit admission; search only surfaced third-party commentary inferring similar behaviour from GPT-5-Codex release notes, not an OpenAI-authored statement. Flagged as a gap, not a finding.

---

## 5. The over-correction failure (anti-goal evidence)

This is the section with the thinnest direct evidence. I looked specifically for "told the model to simplify/be terse/stop commenting and it broke something real" incident reports and did not find a clean, named, verifiable war story within budget. What I did find, in descending order of relevance:

**Vendor-documented instance of a correction that itself needs correcting**
- Anthropic's own docs (Section 4 above) describe instructing Opus 5 to skip self-verification as the fix for over-verification bloat — i.e., they document the *general shape* of "an instruction that was a safeguard on an older model becomes dead weight or worse on a newer one," which is conceptually the same risk class as "telling the model to simplify strips something load-bearing." This is the closest vendor-acknowledged parallel, not a direct hit on code validation.

**AI itself degrading a load-bearing comment, unprompted by a "simplify" instruction**
- "The agent will come through and replace that reasoned comment with 'Add one to index'" — HN user lolc (https://news.ycombinator.com/item?id=45624429). This shows the failure mode happening spontaneously (model replacing a "why" comment with a trivial "what" comment) rather than as a result of a human's terseness instruction — relevant but not the same causal story the brief asked for.

**General LLM evidence that "be concise" instructions have a measured accuracy cost**
- Giskard's Phare LLM benchmark (built with Google DeepMind, the EU, and Bpifrance as partners) found that system prompts like "be concise" measurably degrade factual reliability: "Instructions emphasizing conciseness specifically degraded factual reliability across most models tested, with the most extreme cases resulting in a 20% drop in hallucination resistance." Mechanism given: concise answers cut off room for the caveats and corrections that let a model debunk a false premise. (https://www.giskard.ai/knowledge/good-answers-are-not-necessarily-factual-answers-an-analysis-of-hallucination-in-leading-llms)
- Important caveat: this is a general chatbot-factuality benchmark (tested on models including Claude 3.7 Sonnet, GPT-4o, Mistral Large), **not a coding-specific or validation-stripping study**. It supports the anti-goal by analogy (terseness instructions have real, measured costs, not just upside) rather than by direct demonstration that "simplify" deletes a trust-boundary check.
- Consensus: **the mechanism is plausible and has one real quantified analogue; the specific coding failure (stripped validation, deleted load-bearing comment, code-golf output) is asserted throughout the secondary "how to prompt Claude" blog ecosyston as a reason to phrase rules carefully, but I could not verify a single concrete named incident to a primary source.** Recommend the skill state the anti-goal as a reasoned risk backed by the Giskard analogy and Anthropic's own over-verification admission, rather than claim a documented coding incident that I could not substantiate.

**What this gap itself suggests**
The near-total absence of "I told it to simplify and it broke prod" war stories, set against the very large volume of "it over-engineers by default" complaints, is itself informative: practitioners talk far more about reining AI code in than about reining it in *too hard*. That asymmetry could mean the failure is genuinely rarer, or that it's less narratively satisfying to admit ("I caused this by my own prompt" vs. "the AI did this to me"), or that it shows up silently (a missing check that never gets noticed until much later) rather than as a visible incident worth posting about. The skill should treat the anti-goal as a real design constraint regardless — the reasoning holds even without a viral anecdote — but should not cite a coding-specific incident as if one were found here.

---

## Executive summary

1. The single strongest, most authoritative source in this whole research pass is Anthropic's own docs: a named "Overeagerness" section admits Claude tends to overengineer and ships the exact counter-prompt.
2. Community and vendor language converge tightly on one composite complaint: unrequested abstractions, unrequested flexibility, and unrequested defensive code, all in one motion.
3. The single most repeated comment complaint, corroborated across GitHub, three separate HN threads, and named-author blogs, is comments that restate "what" the code does instead of "why" it exists.
4. GitClear's two separate reports (2025 and Jan-2026) give the best quantified trendlines: duplication up roughly 8x then +81% further, refactoring down to under 4% of changes, error-masking constructs up 47% — but both are self-published by a commercial code-analytics vendor.
5. One academic study (Guelman et al.) is a useful counterweight: AI comment *accuracy* was rated equal-or-better than human comments most of the time — the complaint is about volume and placement, not correctness.
6. The community's own favourite remedy — a CLAUDE.md/AGENTS.md rules file — has one controlled academic test (Gloaguen et al., ETH-affiliated, arXiv:2602.11988) and it found LLM-written rule files actively hurt task success while raising cost; human-written files helped only marginally.
7. "Comments only for why," "3+ call sites before abstracting," and "edit, don't fork a new file" are the three remedy phrasings that show up repeatedly and match Anthropic's own prompt text almost verbatim.
8. Direct evidence for the anti-goal (simplification instructions stripping real validation or load-bearing comments) is thin: the best analogue is a general (non-coding) benchmark showing "be concise" prompts measurably increase hallucination.
9. Reddit itself (r/ExperiencedDevs, r/ChatGPTCoding, r/cursor) was largely inaccessible to this research pass's tools; the evidence base here leans on Hacker News, one GitHub Discussions thread, arXiv, and Anthropic's own documentation instead — worth a follow-up pass with different tooling if Reddit-specific phrasing matters to the skill.
10. Several named items from the brief (backwards-compat shims, dead-code-for-future-use, banner comments, reviewer-directed "this ensures..." comments) were not found with a verifiable primary quote in this pass — they are flagged as gaps above rather than filled with a plausible-sounding but unconfirmed example.


---

# PART 2 — Canonical-citation verification (Sonnet subagent, verbatim)

# Canonical software-design quotes — verification pass

Research date: 2026-08-17. Method: WebSearch + WebFetch against primary sources where
reachable; secondary/tertiary sources flagged explicitly where the primary text could not
be opened (paywall, file-size limit, dynamic page, blocked fetch). Nothing here should be
pasted into the skill as a verbatim quote without re-reading the "Caveats" line for that
item — several are PARTLY for tool-access reasons, not because the content looks wrong.

---

## 1. YAGNI

**1a. Martin Fowler's bliki formulation**

- **Status:** VERIFIED (fetched the live page directly, twice, independently consistent)
- **Quote:** "You Aren't Gonna Need It" — "a statement that some capability we presume our
  software needs in the future should not be built now."
- **Source:** Martin Fowler, "Yagni," martinfowler.com/bliki/Yagni.html
- **Year:** page shows 26 May 2015
- **Caveat — important, corrects the task's framing:** Fowler's page does **not** credit
  Ron Jeffries with originating the phrase. It states verbatim: "The origin of the phrase
  is an early conversation between Kent Beck and Chet Hendrickson on the C3 project."
  Jeffries' name does not appear anywhere on the page (checked twice, including a full
  list of every proper name on the page). Do not have the skill say "Fowler traces YAGNI
  to Jeffries" — Fowler traces the *phrase's origin* to a Beck/Hendrickson conversation.
  That's a separate claim from 1b below.

**1b. Ron Jeffries' formulation ("Always implement things when you actually need them…")**

- **Status:** VERIFIED, with a light process caveat (see below)
- **Quote:** "Always implement things when you actually need them, never when you just
  foresee that you need them."
- **Source:** Ron Jeffries, "You're NOT gonna need it!," originally published on
  xprogramming.com (Practices/PracNotNeed.html), now mirrored at
  https://ronjeffries.com/xprog/articles/practices/pracnotneed/
- **Year:** 1998 (page byline: "© Apr 4, 1998")
- **Caveat:** Confirmed via two separate fetches of the live page, the second an explicit
  instruction to do a character-by-character comparison, which returned an exact match. I
  did not personally read the raw HTML byte-for-byte — a fetch tool summarizing a page is
  one small step removed from primary — so a 30-second human eyeball of the live URL is
  cheap insurance before the skill quotes it verbatim. More importantly: this answers "who
  wrote this sentence," which is a different question from "who coined YAGNI" (see 1a). Yes,
  the popular wording really is Jeffries', on his own XP site, 1998 — but don't merge that
  fact with Fowler's separate (and different) origin story for the acronym/phrase itself.

---

## 2. Rule of three (Fowler's *Refactoring*, attributed to Don Roberts)

- **Status:** PARTLY — wording is very likely accurate but I only reached it via
  consistent secondary quotation, not a direct read of the book
- **Quote (as reproduced identically across multiple independent secondary sources):**
  "Here's a guideline Don Roberts gave me: The first time you do something, you just do
  it. The second time you do something similar, you wince at the duplication, but you do
  the duplicate thing anyway. The third time you do something similar, you refactor."
- **Source:** Martin Fowler et al., *Refactoring: Improving the Design of Existing Code*
  (Addison-Wesley, 1999), attributing the guideline within the book to Don Roberts. There
  is **no** martinfowler.com/bliki/RuleOfThree.html page — that URL 404s — so this lives
  only in the book, not the bliki.
- **Year:** 1999 (1st edition); the concept is retained in the 2nd edition (2018)
- **Caveats:**
  1. "Three strikes and you refactor" (the phrasing used in the task prompt) is a popular
     mnemonic/subtitle for the rule — it's used, e.g., as the parenthetical alternate name
     on Wikipedia's "Rule of three (computer programming)" page — but it is **not**
     presented anywhere as a direct Fowler or Roberts quotation. Don't put it in quotation
     marks and attribute it to Fowler.
  2. I did not access the book's actual text (no legitimate free full copy found; I
     deliberately avoided the pirated-book-scan sites that turned up in search) to confirm
     exact page number or whether 1st vs. 2nd edition wording differs at all. Recommend a
     five-minute check against a purchased/library copy before the skill quotes this
     verbatim.

---

## 3. Sandi Metz — "duplication is far cheaper than the wrong abstraction"

- **Status:** VERIFIED (direct fetch of the primary blog post)
- **Quotes:** "duplication is far cheaper than the wrong abstraction" and "prefer
  duplication over the wrong abstraction" — both appear as Sandi Metz's own words in the
  post itself, **not** attributed to anyone else (specifically not to Sarah Mei) on the
  page.
- **Source:** Sandi Metz, "The Wrong Abstraction," sandimetz.com/blog/2016/1/20/the-wrong-abstraction
- **Year:** 20 January 2016 (the post states it was originally written for her Chainline
  newsletter and republished here with light edits)
- **Caveat:** The post frames the first phrase as something she "asserted" in her RailsConf
  2014 talk "All the Little Things" (youtu.be/8bZh5LMaSmE) — so the talk is the original
  utterance and the 2016 blog post is her own later written record of it. I verified the
  **blog post's** text directly by fetching it; I did not pull a transcript of the 2014
  talk to confirm the live-spoken wording matches word-for-word. Cite the blog post; treat
  "this is verbatim what she said on stage in 2014" as PARTLY, not VERIFIED.

---

## 4. John Ousterhout, *A Philosophy of Software Design*

**Shared caveat for all of 4a–4e:** this is a commercially sold book (1st ed. 2018, Yaknyam
Press; 2nd ed. 2021), not freely available in full online. I deliberately did not use the
unauthorized full-text scans that turned up in search (pdfcoffee.com, milkov.tech) since I
can't vouch for their provenance or edition accuracy. Ousterhout's own **legitimate** free
extract — web.stanford.edu/~ouster/cgi-bin/aposd2ndEdExtract.pdf — exceeded this session's
10MB fetch limit, and his own Stanford course pages
(web.stanford.edu/~ouster/cgi-bin/cs190-winter20/lecture.php?topic=comments and
`?topic=complexity`) returned empty content to the fetch tool (looks like a
rendering/dynamic-content issue, not a deliberate block — worth a human retry in an actual
browser). So every quote below rests on convergent, independent secondary
summaries/reviews rather than a direct read of the primary text. **Before the skill quotes
any of these in quotation marks, open the Stanford extract PDF directly (a human, in a
browser) and confirm.**

**4a. Comment doctrine**

- **Status:** PARTLY
- **Quote:** "Comments should describe things that are not obvious from the code."
- Related, likely-verbatim: "Comments capture information that was in the mind of the
  designer but couldn't be represented in the code."
- **Chapter:** one secondary source (Goodreads reader notes) cites this at "p. 101"
  (edition unstated). Ousterhout's own Stanford lecture on this material is titled
  "Writing Comments."

**4b. "Define errors out of existence"**

- **Status:** PARTLY
- **Quote/heading:** "define errors out of existence" — recurs as a named principle across
  independent summaries, consistently illustrated with Tcl's `unset()`: the original throws
  an error if the variable was never set, whereas Ousterhout's suggested design just makes
  "not set" the natural result of unsetting, so there's nothing to throw an error about.
- Could not obtain the exact full original sentence(s) around the phrase.

**4c. Complexity is incremental**

- **Status:** PARTLY (but higher confidence — this phrasing recurs near-identically across
  multiple unrelated summaries, which suggests direct copying rather than paraphrase)
- **Quotes:** "Complexity comes from an accumulation of dependencies and obscurities." /
  "Complexity is anything related to the structure of a software system that makes it hard
  to understand and modify the system."

**4d. Tactical vs. strategic programming**

- **Status:** PARTLY
- **Quotes:** "In the tactical approach, your main focus is to get something working, such
  as a new feature or a bug fix," contrasted with a strategic mindset that "invest[s] time
  to produce clean designs and fix problems" on the grounds that strategic programming is
  "actually cheaper... over the long run." Chapter 3, per multiple independent sources.

**4e. "Good code is self-documenting" is a myth — the nuance the task asked to capture**

- **Status:** PARTLY
- **Quote:** Ousterhout reportedly calls self-documenting code "a delicious myth,"
  illustrated with the ambiguity of Java's `String.substring()` (is the end index
  inclusive? what happens if start > end?) — exactly the kind of detail that has to live in
  a comment because it can't live in the method signature. This is a distinctive enough
  phrase ("a delicious myth") that it reads as genuine, but I want a human to see it with
  their own eyes in the book/extract before it goes into the skill in quotation marks.
- This item is confirmed **directionally**: Ousterhout does argue comments are undervalued
  and that the "just write self-documenting code" position doesn't hold up, which is the
  real nuance the task flagged — I just can't certify the exact wording yet.

---

## 5. Kernighan & Plauger, *The Elements of Programming Style*

- **Status:** PARTLY (extremely consistent secondary attestation over decades; primary
  text not directly opened — two attempts to fetch archive.org-hosted PDFs of the book
  failed, one on file size, one returned nothing usable)
- **Quote:** "Don't comment bad code—rewrite it." (em dash, no surrounding spaces, in the
  most common rendering)
- **Source:** Brian W. Kernighan & P. J. Plauger, *The Elements of Programming Style*
- **Year/edition:** 1st edition 1974 (McGraw-Hill); the commonly-cited edition is the 2nd,
  1978. I could not pin which edition first carries the line, or a page/chapter number.
- **Caveat:** this is about as well-attested a "famous programming quote" as exists —
  identical wording across dozens of independent citations over 40+ years — but that is
  still consistent *secondary* sourcing, not a primary read. Low risk, but flag it as such.

---

## 6. Knuth — "premature optimization is the root of all evil"

- **Status:** PARTLY (the ACM original was not opened directly — it's paywalled at ACM
  Digital Library and I chose not to pull from unofficial PDF mirrors — but this is
  probably the single most carefully fact-checked quote in software engineering, and the
  wording below is stable across every authoritative secondary treatment I found)
- **Quote (fuller context, verbatim per convergent sourcing):** "We should forget about
  small efficiencies, say about 97% of the time: premature optimization is the root of all
  evil. Yet we should not pass up our opportunities in that critical 3%."
- **Source:** Donald E. Knuth, "Structured Programming with go to Statements," *Computing
  Surveys*, Vol. 6, No. 4 (December 1974), ACM. (DOI 10.1145/356635.356640 — not
  independently confirmed by me this session, worth checking.)
- **Year:** 1974
- **Caveat:** recommend a final check against the actual ACM copy before presenting this as
  verbatim in the skill — this is exactly the kind of quote where a word quietly drifts
  ("the root of all evil" placement, "3%" vs. "three percent") across 50 years of retelling,
  and I have not personally seen the 1974 page.

---

## 7. Gall's Law (John Gall, *Systemantics*, 1975)

- **Status:** PARTLY (Wikiquote-sourced with a specific book/page citation; I did not see a
  scan of the book itself)
- **Quote:** "A complex system that works is invariably found to have evolved from a simple
  system that worked. The inverse proposition also appears to be true: A complex system
  designed from scratch never works and cannot be made to work. You have to start over,
  beginning with a working simple system."
- **Source:** John Gall, *General Systemantics: An Essay on How Systems Work, and
  Especially How They Fail* (General Systemantics Press, Ann Arbor, MI, 1975), p. 71, per
  en.wikiquote.org/wiki/John_Gall.
- **Year:** 1975
- **Caveat:** a second, independent secondary source cited the first sentence alone at "p.
  65" of "Systemantics (1975)" — different page number, likely a different
  edition/printing. The book has gone through several titles and revisions (*General
  Systemantics*, 1975 → *Systemantics: How Systems Work and Especially How They Fail*,
  1977/78 → *The Systems Bible*, revised 2002), with different pagination and some
  rewording between them. Confirm which edition the skill means to cite before quoting the
  "inverse proposition" sentence specifically — that's the part most likely to have been
  tightened by later paraphrasers.

---

## 8. KISS — attribution to Kelly Johnson (Lockheed Skunk Works)

This is a reliability question, not a quote to verify — answered accordingly.

- **Finding:** Wikipedia's KISS principle article asserts, without hedging language, that
  it was "reportedly coined by Kelly Johnson, lead engineer at Lockheed Skunk Works,"
  citing (1) Ben R. Rich's 1994 memoir *Skunk Works* / a National Academies biographical
  memoir, and (2) Tom Dalzell's 2009 *Routledge Dictionary of Modern American Slang*, which
  itself points to a 1960 US Navy "Project KISS" as a separate, earlier, institutionally
  documented origin.
- **Countervailing evidence surfaced in search:** the acronym does not appear in Johnson's
  own written "Basic Operating Rules"/"Kelly's 14 Rules" for the Skunk Works; and a "keep it
  short and simple" phrase is attested in print as early as 1938 (Minneapolis Star), which
  predates Johnson's WWII-era Skunk Works career entirely.
- **Verdict for the skill:** treat the Kelly Johnson/Skunk Works origin as **folklore-grade,
  not documented fact**. Safe to say "popularly attributed to Kelly Johnson"; not safe to
  assert he coined it as if that were settled. If precision matters more than the familiar
  anecdote, the 1960 US Navy "Project KISS" is the better-attested institutional origin.

---

## 9. The Zen of Python (PEP 20)

- **Status:** VERIFIED — direct primary read, python.org's own PEP text, explicitly public
  domain
- **Source:** PEP 20 — The Zen of Python, https://peps.python.org/pep-0020/
- **Author:** Tim Peters
- **Confirmed character-for-character against the live page**, including both lines named
  in the task ("Simple is better than complex." / "If the implementation is hard to
  explain, it's a bad idea.") and a sample of others ("Beautiful is better than ugly.",
  "There should be one-- and preferably only one --obvious way to do it.", "Namespaces are
  one honking great idea -- let's do more of those!"). 19 aphorism lines total; the PEP's
  own abstract notes "only 19 of which have been written down."
- **Year:** the PEP document itself doesn't show a creation year in what I fetched; common
  knowledge (not independently verified this session) places the underlying 19 lines as
  circulated by Peters on the Python mailing list around 1999, formalized as PEP 20 in
  2004 — flagging this dating as a minor loose end if the skill wants a precise year.
- **Caveat:** none of substance — this is the cleanest VERIFIED item in the set, and it's
  public domain, so there's no copyright concern in quoting it in full.

---

## 10. Jeff Atwood, "Code Tells You How, Comments Tell You Why" (Coding Horror, 2006)

- **Status:** VERIFIED (direct fetch of the primary post)
- **Title/URL:** blog.codinghorror.com/code-tells-you-how-comments-tell-you-why/
- **Year:** 18 December 2006
- **Thesis:** code demonstrates *how* a program works; comments should carry *why* it's
  written that way. Write clear, simple code to minimize the need for comments, but
  comments remain necessary for intent and rationale code can't express.
- **Representative quote:** "Code can only tell you how the program works; comments can
  tell you why it works."
- **Does the how/why framing predate him? Yes.** The post itself nods to *Structure and
  Interpretation of Computer Programs* (1985) and Donald Knuth's writing on Literate
  Programming (1984) as earlier articulations of a how/why-shaped distinction. Atwood is
  popularizing the framing for a wide blog audience, not originating it — good to have the
  skill say so if it cites him.

---

## 11. grugbrain.dev ("The Grug Brained Developer")

- **Status:** page content VERIFIED (direct fetch); authorship PARTLY (corroborated
  externally, not stated on the page itself)
- **Quotes confirmed verbatim on the page:**
  - "complexity _very_ bad" — and, elsewhere on the page, the further-intensified
    "complexity _very_, _very_ bad" (both forms genuinely appear, in different places)
  - "best weapon against complexity spirit demon is magic word: 'no'"
  - "no, grug not build that feature"
  - on DRY/premature abstraction: "repeat code simple enough and obvious enough, and grug
    begin feel repeat/copy paste code with small variation is better than many
    callback/closures passed arguments" (the page's deliberate broken-English "grug-speak"
    style — not a transcription artifact on my end)
- **Author:** Carson Gross. The page carries **no byline** — it's deliberately presented
  pseudonymously as "grug." The Carson Gross attribution comes from outside the page: the
  linked print book "The Grug Brained Developer" by Carson Gross (published via Lulu) and
  his public identity as htmx's creator. If the skill wants to name an author, cite the
  book's byline or Gross's own public acknowledgment, not the site itself.
- **Year:** page is undated; commonly cited/circulating from around 2022 onward.

---

## 12. Dan Abramov, "Goodbye, Clean Code" (overreacted.io, Jan 2020)

- **Status:** VERIFIED (direct fetch)
- **Title/URL:** overreacted.io/goodbye-clean-code/
- **Year:** 11 January 2020
- **Thesis + quote:** "My code traded the ability to change requirements for reduced
  duplication, and it was not a good trade." Also: "Clean code is not a goal."
- **"The WET Codebase" talk (Deconstruct 2019):** URL confirmed via search —
  https://www.deconstructconf.com/2019/dan-abramov-the-wet-codebase (the page reportedly
  hosts a transcript plus the video link). I found this URL via WebSearch and did not
  independently open/fetch it this session, so treat the URL as located-but-not-fetched.

---

## 13. qntm, "It's probably time to stop recommending Clean Code" (qntm.org, 2020)

- **Status:** PARTLY — direct fetch of qntm.org/clean returned HTTP 403 in this session
  (possibly this tool being blocked rather than a real access restriction); relying on
  consistent excerpts surfaced independently across two separate WebSearch passes instead
- **Title/URL:** "It's probably time to stop recommending Clean Code," https://qntm.org/clean
- **Year:** 28 June 2020 (Lobsters submission date; Hacker News threads tag it "(2020)" on
  resubmission, with an original HN submission dated 1 July 2020)
- **Thesis + quotes (consistent across both search passes):** "Clean Code mixes together a
  disarming combination of strong, timeless advice and advice which is highly questionable
  or dated or both"; on the example code: "It's incredibly hard to figure out what any of
  this code does because all of these incredibly tiny methods do almost nothing and work
  exclusively through side effects."
- **Caveat:** recommend a direct human read of qntm.org/clean before quoting — I'm one step
  removed from the primary text here (search-engine-surfaced excerpts, not a page I
  rendered myself).

---

## 14. Rich Hickey, "Simple Made Easy" (Strange Loop 2011)

- **Status:** PARTLY — no official transcript located; relying on a fan-made transcript
  plus the official InfoQ page's summary notes
- **Talk:** Strange Loop conference, September 2011 (InfoQ's posting of the video is dated
  20 October 2011; I did not pin the exact conference day the talk was delivered)
- **Simple ≠ easy distinction:** "simple" from Latin roots "sim" + "plex" ("one twist/braid";
  the opposite, complex, means "intertwined/braided together"); "easy" from a root meaning
  "near/adjacent" — i.e., relative to the person, what's close at hand or familiar to *them*
  specifically, not a property of the thing itself.
- **Representative lines** (community transcript: github.com/matthiasn/talk-transcripts,
  Hickey_Rich/SimpleMadeEasy-mostly-text.md — **not** officially reviewed or endorsed by
  Hickey or Strange Loop): "Simple does not mean that there is only one of them. It also
  does not mean an interface that only has one operation." / "Easy is relative... They are
  easy for other people."
- **Caveat:** for anything the skill quotes as Hickey's exact spoken words, cross-check
  against the InfoQ video itself (infoq.com/presentations/Simple-Made-Easy/) — a fan
  transcript is a reasonable stand-in but isn't authoritative for word-for-word accuracy.

---

## 15. Google style guide — comments explain why, not what

- **Status:** VERIFIED (direct fetch)
- **Source:** Google Go Style Guide (Style Decisions), https://google.github.io/styleguide/go/guide.html
- **Quote:** "It is often better for comments to explain why something is done, not what
  the code is doing."
- **Context:** appears within the guide's material on code clarity, framed around the
  question "Why is the code doing what it does?"
- **Caveat:** this is a living document; exact section-heading hierarchy may shift over
  time, so if the skill links to it, anchor on the quoted sentence rather than a specific
  heading path. This satisfies the task's "Go / C++ / Java or similar" ask via Go — I did
  not additionally check the C++ or Java guides for a parallel line given the token budget,
  so don't claim they say the same thing without checking separately.

---

## 16. OPTIONAL — John Carmack on inlined code (2007/2014)

- **Status:** PARTLY (found via two independent third-party reposts, not the original
  mailing-list post; both this session's direct fetches of the two candidate host pages
  failed — one on response size, one on a transient socket error — so this rests on what
  WebSearch surfaced from them)
- **Quotes:** on the 2007 original — concern about being unaware of "very large blocks of
  code that you just always skip over while debugging"; on a 2014 follow-up remark — "The
  real enemy addressed by inlining is unexpected dependency and mutation of state, which
  functional programming solves more directly and completely."
- **Source:** original email dated 13 March 2007 from johnc@idsoftware.com, on the topic of
  inlining code; widely reposted, including at Jonathan Blow's site,
  number-none.com/blow/blog/programming/2014/09/26/carmack-on-inlined-code.html (which
  pairs the 2007 email with Carmack's 2014 follow-up comment).
- **Caveat:** I could not identify the original mailing list by name within budget, and
  could not get either candidate host page to load directly this session. Treat as the
  least-verified item in the set — reasonably solid given two independent, mutually
  consistent secondary reposts, but this is explicitly the optional item, so I'd suggest
  not leaning on it unless a human confirms the number-none.com page directly.

---

## Out-of-scope notes (per task instructions — flagging, not doing)

- Several items (4, 5, 6, 7, 13, 16) would benefit from one human-driven step I couldn't
  complete inside this tool session: opening a large PDF or a blocked/dynamic page directly
  in a browser. Specifically: web.stanford.edu/~ouster/cgi-bin/aposd2ndEdExtract.pdf (>10MB,
  legitimate Ousterhout extract); the archive.org-hosted Kernighan & Plauger PDF; a
  Google-Books or ACM look at Knuth 1974; a specific-edition copy of Gall's *Systemantics*;
  qntm.org/clean directly; number-none.com's Carmack repost directly. None of this requires
  repository access — it's all open web — so it's within the spirit of the task, just
  outside what this session's fetch tool could physically retrieve.
- No skill drafting was done, per the task's explicit instruction. This file is verification
  input only.

---

# PART 3 — Lead follow-up pass (2026-08-17, same day, post-landing)

Two access gaps from the parts above were re-attempted by the lead with different
tooling, at the operator's request. Outcomes, honestly recorded:

**Reddit (Part 1's gap): still unreachable, now by policy rather than tooling.** The
in-app browser — a residential connection, the "different tooling" Part 1 suggested —
returned "blocked by policy" for both old.reddit.com and www.reddit.com: the
organisation's browsing policy blocks the domain, and routing around an org policy
block via another surface was not attempted on principle. The gap stands, with one
mitigation already in hand: the unslop-code fork's upstream dataset is itself a
verified Reddit corpus (11,906 on-topic posts + 11,306 comments, adversarially
verified per its references/tells.md), so the skill's Reddit-native evidence comes
from there rather than from a fresh sweep.

**Ousterhout extract (Part 2's gap): obtained and read first-hand; it does not contain
the comment chapters.** The extract
(web.stanford.edu/~ouster/cgi-bin/aposd2ndEdExtract.pdf, 13.9MB, image-only — fetched
by curl, rendered to images via pypdfium2, pages read visually) holds the title page,
Chapter 6 (General-Purpose Modules are Deeper) and Chapter 21 (Decide What Matters)
only. The comment-doctrine wording in Part 2 items 4a/4e therefore remains
paraphrase-only for the skill until someone opens the book itself. Two adjacent
positions were, however, verified first-hand on the extract's own pages:

- Ch. 6, p. 39: "I have found over and over that specialization leads to complexity;
  I now think that over-specialization may be the single greatest cause of complexity
  in software." (His argument is for deep, general-purpose module interfaces — not
  for speculative flexibility; the two are distinct and the skill takes no position
  on interface generality.)
- §21.2 "Minimize what matters", p. 172: "Try to make as little matter as possible:
  this will result in simpler systems. For example, try to minimize the number of
  parameters that must be specified to construct an object, or provide default values
  that reflect most common usage." — a first-hand Ousterhout confirmation of the
  skill's flexibility bullet, recorded here rather than added to the skill (the
  bullet's point is already carried by Fowler; a second citation would not earn its
  place).
