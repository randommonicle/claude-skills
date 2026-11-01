# The AI-writing tells: full catalog

Each entry has the data evidence (so you can weight it), a paraphrase of what people said in the threads, the
literal text the scanner keys on, and the fix. Ordered by priority: the **cited share** from
the 600-post audited sample, which is the cleanest signal, with the broad keyword-pass share
next to it. Source: 89,239 posts pulled, 7,984 on-topic, across roughly 50 AI, writing, and
SaaS subreddits, 2021 to 2026.

A note on weighting. Two numbers are reported per tell. **Cited** is the share of audited
posts where a human actually names the tell as a giveaway. **Matched** is the share of all
on-topic posts whose text a keyword pass flags. They diverge in informative ways. The em dash
is cited far more than it is matched (people talk about it more than they leave it in). The
generic diction words are matched far more than they are cited (they are mostly the poster's
own ordinary prose, not a giveaway). Trust cited over matched, and treat the structural tells
in Part B as under-counted, since no keyword can catch them at all.

Read by concentration, not by lone hits. A single `comprehensive` or one `delve` is almost
always the writer's own prose, not a tell; the signal is density, the same tic clustering. The
two exceptions are absolute, counted on a single instance wherever they appear: the em dash and
leftover assistant boilerplate (entry 7). For everything else, weight by how thickly it
clusters, and remember the scanner reports a lexical surface only. The Part B tells, which the
audited pass ranked above most of Part A, are where the real reading happens.

## Contents

Part A, the tells the scanner catches:
1. The em dash
2. "It's not just X, it's Y" (the antithesis cadence)
3. The formulaic essay shape and the "In conclusion" wrap-up
4. "Dive in" / "deep dive"
5. Everything turned into bullet lists
6. The diction memes (`delve`, `tapestry`, `leverage`, `seamless`, ...)
7. Leftover assistant boilerplate ("as an AI language model")
8. Bolded lead-in labels (**Word:** then a sentence)
9. "Unlock the potential" and marketing hype
10. "In today's fast-paced world" and other hollow openers
11. Emoji as bullets, icons, or headers
12. Trailing assistant offers ("Would you like me to ...")

Part B, the cited tells a regex cannot see (human pass required):
13. Uniform / robotic sentence rhythm
14. Sycophancy and the yes-man register
15. Saying nothing at length (the empty, polished paragraph)
16. No contractions / over-formal register
17. Hedging instead of committing
18. The rule of three
19. Hallucinated citations, "Honestly," openers, and fake typos
20. The over-corrected "anti-AI" register (the 2026 tell)

Part C, cleared by the data (do not over-chase):
21. The over-counted generic diction (`however`, `comprehensive`, "when it comes to", `utilize`),
    plus what was seen in other skills and not adopted

Part D, added 2026-11-01 from two other skills (pattern ideas only, examples written fresh;
see UPSTREAM.md). No Reddit share: these are not in the study's data, so weight them by the
severity the scanner gives them and by clustering, never on one sighting:
22. One-line closers and rows of fragments
23. The staged run-up before the point
24. Arguing with no one
25. Sayings that sound deep
26. Inflated significance and the stock send-off
27. Shallow `-ing` riders
28. Avoiding "is" and "has" (`serves as`, `stands as`, `boasts`)
29. Borrowed authority
30. A knowledge gap filled with a guess
31. Elegant variation (a new synonym every sentence)
32. Repeated sentence openings
33. Formatting by rule: title-case headings, decorative bold, the heading echoed
34. Writing about the document instead of its subject
35. The reply that buries the decision


## Part A: the tells the scanner catches

### 1. The em dash

**Evidence.** cited 7.1%, matched 4.5%. The single most-cited tell, and the one with the
sharpest before-and-after: essentially absent from the on-topic posts before 2024, then 6.7%
of them in 2025. The arrival of the ChatGPT era in one punctuation mark.

**What people say.** A teacher pointed out that ChatGPT loves the em dash while the average
teenager has no idea what one is (r/Teachers), and others call the em dash the most reliable
single tell of AI text (r/ChatGPT).

**Pattern (scanner).** the em dash character itself, anywhere in the file. Unlike the other
rules, this one is flagged inside quotes too, because the rule is simply not to ship one.

**Why it reads as AI.** almost nobody types a real em dash on a phone or in a quick post.
Models produce it constantly because their training favors "correct" typography. So the mark
that signals polish now signals a machine.

**Fix.** cut it. Use a comma, a period, or parentheses. Do not just swap in a colon, because
people have started flagging that too. If you genuinely write with em dashes by choice, mark
the line `unslop-ignore`, but know that readers will still read it as a tell.

### 2. "It's not just X, it's Y" (the antithesis cadence)

**Evidence.** cited 2.8%, matched 1.9%. The most-named *sentence* tell, often paired with the
em dash in the same complaint.

**What people say.** Posters list the "not just X, it's Y" frame beside slang tics such as
"straight up" and "honestly? that's growth" (r/ChatGPT), and describe the "that's not X; that's
Y" pattern as part of a cadence that is easy to recognise (r/ChatGPT).

**Pattern (scanner).** `it's not just X, it's Y`, `not X, but Y`, `isn't just ... it's ...`.
The negate-then-assert shape. Since 2026-11-01 also the version split over two sentences,
`this doesn't mean X. It means Y.`, when both sit on one line. Two shapes it cannot see: the
split across a line break, and the clipped negative tail ("the totals come from the ledger, no
guesswork"). Check both by eye. Keep a contrast when the reader really does hold the belief
being corrected, or when both halves carry a fact.

**Why it reads as AI.** the construction manufactures profundity for free. It is the clearest
single piece of the "AI accent," a rhythm the model falls into to sound insightful.

**Fix.** state the thing plainly. If Y is the point, just say Y. Delete the throat-clearing
negation in front of it.

### 3. The formulaic essay shape and the "In conclusion" wrap-up

**Evidence.** formulaic shape cited 2.5%; the "In conclusion" / "in summary" closer cited
0.2% but matched 1.0% and is a classic giveaway. Several auditors called the shape
under-counted (several described one fixed three-paragraph template).

**What people say.** Users complain about essays, posts and emails that keep boilerplate such
as an "In conclusion, this essay has discussed" closer, an "As an AI developed by OpenAI"
disclaimer or a "To summarize the above points" wrap-up (r/ChatGPT).

**Pattern (scanner).** `in conclusion`, `in summary`, `to summarize`, `to conclude`, `in
closing`. The shape itself (intro, three even body paragraphs, recap) is structural and needs
a human eye.

**Why it reads as AI.** the model defaults to the five-paragraph essay it was rewarded for.
The signposted recap at the end is the tell most writers forget to delete.

**Fix.** break the intro / three-body / conclusion mold and let the structure follow the idea.
End on a real last point. If the reader needs a summary to follow it, the piece is too long.

### 4. "Dive in" / "deep dive"

**Evidence.** cited 2.0%, matched 1.6%.

**What people say.** One post written entirely in the register was offered as a specimen: it
opens by wanting to "take a moment to delve" into something and sets it in "today's fast-paced
digital landscape" (r/ClaudeAI).

**Pattern (scanner).** `dive in`, `dive into`, `deep dive`, `let's dive`, `diving in`.

**Why it reads as AI.** the model announces that it is starting before it starts. A person
just starts.

**Fix.** cut the metaphor and open with the actual topic.

### 5. Everything turned into bullet lists

**Evidence.** cited 1.7%, matched 1.8%. The "5 ways to" / "7 signs" listicle scaffolding.

**What people say.** A student posted a list of giveaways for teachers, a compilation of the
sentence structures and phrases ChatGPT favours (r/Teachers).

**Pattern (scanner).** a numbered listicle header such as `5 ways to ...`, `7 signs ...`, `3
reasons ...`.

**Why it reads as AI.** prose gets shredded into bullets because lists are the model's safe
default for "organized." Real argument lives in paragraphs.

**Fix.** write prose. Reserve bullets for genuinely list-like content (steps, parts, options),
not as the shape of every answer.

### 6. The diction memes (`delve`, `tapestry`, `leverage`, `seamless`, `game-changer`, ...)

**Evidence.** cited 1.3% as a cluster, matched higher. The audited pass found the keyword
counts are inflated by people copy-pasting "words to avoid" lists, but the words are real
corpus-wide and instantly recognizable.

**What people say.** Prompt-tip posts tell people to forbid em dashes and words like "seamless"
(r/ChatGPT), and a whole genre of posts lists a hundred or more words to exclude.

**Pattern (scanner).** `delve`, `tapestry`, `leverage`, `seamless`, `game-changer`, `unleash`,
`underscore`, `testament`, `embark`, `meticulous`, `elevate`, `harness`, `showcase`,
`captivating`, `ever-evolving`.

**Why it reads as AI.** these are the words the model reaches for over the plain ones. No real
register uses all of them.

**Fix.** swap for the word you would actually say. "delve into" is "look at." "leverage" is
"use." "utilize" is "use." Do not swap one fancy word for another.

### 7. Leftover assistant boilerplate ("as an AI language model")

**Evidence.** cited 1.2%. Aging out as people learn to delete it, but the single most
conclusive tell when it survives.

**What people say.** The same giveaway posts single out the "As an AI developed by OpenAI" line
left in by mistake (r/ChatGPT).

**Pattern (scanner).** `as an AI language model`, `as a large language model`, a refusal like
`I cannot assist`, a `knowledge cutoff` line, `I don't have personal opinions`.

**Why it reads as AI.** it is the machine speaking in its own voice. There is no human reading
of it.

**Fix.** delete every trace of the assistant before publishing: disclaimers, refusals, cutoff
dates, "I'm just an AI."

### 8. Bolded lead-in labels (**Word:** then a sentence)

**Evidence.** cited 0.3%, but matched 2.8% (n=220), the third-highest by keyword pass. The
title-case `**Bold:**` then a clause pattern.

**What people say.** Named alongside the other format tells in the giveaway-list posts
(r/ChatGPT, r/Teachers).

**Pattern (scanner).** a line like `**Productivity:** Studies show ...`, a bolded label and
colon in front of a sentence.

**Why it reads as AI.** it is the model formatting a chat answer, not writing prose. Human
writing rarely labels each sentence.

**Fix.** write the sentence without the boldface label. If you need structure, use real
sentences and paragraphs.

### 9. "Unlock the potential" and marketing hype

**Evidence.** "unlock / unleash the power/potential" cited 0.8%; the broader marketing
category (`revolutionary`, `transformative`, "transform your life") cited around 0.3% and named
repeatedly as a category.

**What people say.** The giveaway-list and words-to-avoid posts single out the hype verbs
(r/ChatGPT, r/marketing).

**Pattern (scanner).** `unlock the potential`, `unleash the power`, `revolutionary`,
`transform your business`, `take it to the next level`, `supercharge`, `game-changer`. Since
2026-11-01 also the travel-brochure family: `nestled`, `in the heart of`, `breathtaking`,
`must-visit`, `stunning`. Estate-agent copy uses these by long habit; they are still empty, and
the fix is the same: say where the thing is and what it has.

**Why it reads as AI.** it is the voice of a landing page no person wrote. It promises and
says nothing.

**Fix.** say what the thing literally does, with a specific. Strip the promotional adjective.

### 10. "In today's fast-paced world" and other hollow openers

**Evidence.** cited 0.7%, matched 0.4%. Iconic and low-volume, the empty scene-setting first
sentence.

**What people say.** The specimen post above opens in exactly this way, with today's fast-paced
digital landscape (r/ClaudeAI).

**Pattern (scanner).** `in today's fast-paced world`, `in today's digital age`, `in the
modern era`, and the dated-opener family.

**Why it reads as AI.** the model warms up with a sentence that establishes nothing, because
it was trained to ease in.

**Fix.** delete it and open with something specific. The first sentence should carry the
claim, not set a scene.

### 11. Emoji as bullets, icons, or headers

**Evidence.** cited 0.8%. Decorative emoji standing in for list markers or section headings.

**What people say.** The specimen post opens with a cheery greeting to everyone and a waving
emoji before it gets to the delving (r/ClaudeAI), the emoji used as a flourish.

**Pattern (scanner).** an emoji at the start of a heading or a list item, or wrapped around a
bold label.

**Why it reads as AI.** emoji-as-decoration is the model's free substitute for design. It
reads as templated.

**Fix.** use plain text headers and normal list markers. An emoji in a sentence where a person
would actually use one is fine; emoji as structure is not.

### 12. Trailing assistant offers ("Would you like me to ...")

**Evidence.** cited around 0.4% each. The sign-off that the writer forgot to cut: "Would you
like me to ...", "Let me know if ...", "I hope this helps!", "I hope this email finds you
well."

**What people say.** Named in the giveaway-list posts as a line people forget to delete
(r/ChatGPT).

**Pattern (scanner).** `would you like me to`, `let me know if you'd like`, `I hope this
helps`, `hope this email finds you well`, `is there anything else`.

**Why it reads as AI.** a person finishing a thought does not ask whether you want a revision.
It is the assistant's turn-ending move, pasted into a final draft.

**Fix.** delete the meta-offer and the form-letter sign-off. End on the last real sentence.


## Part B: the cited tells a regex cannot see

These are named as often as the top mechanical tells, sometimes more, but no pattern can catch
them. The scanner will not flag them. Read the piece aloud and check them by ear. The audited
pass put several of these above most of Part A.

### 13. Uniform / robotic sentence rhythm

**Evidence.** cited 4.0%, the second-most-cited tell overall, and entirely keyword-invisible.

**What people say.** Posters say ChatGPT's cadence is easy to recognise, and that once you
notice it you cannot focus on the content, because no actual person's thinking is behind it
(r/ChatGPT). Another complained that YouTube scripts now share one cadence and one vocabulary
(r/ChatGPT).

**Why it reads as AI.** the model produces sentences of similar length and shape, evenly
paced, with no variation. The evenness is the tell. A human ear catches it before any single
word.

**Fix.** vary sentence length on purpose. Let one run long and the next be three words. Read it
aloud; if it lulls, break the meter.

### 14. Sycophancy and the yes-man register

**Evidence.** cited 2.5%, the fourth-most-cited tell, and one auditor found it rivals the em
dash for citation density. Keyword-invisible as tone, though the openers in Part A catch some
of it.

**Why it reads as AI.** the model opens with flattery ("Great question!"), agrees reflexively,
and refuses to take a side. The relentless positivity reads as a customer-service bot, not a
person with a view.

**Fix.** drop the flattery and the reflexive agreement. Disagree when you disagree. Stay
neutral when you are neutral. A real writer is willing to say no.

### 15. Saying nothing at length (the empty, polished paragraph)

**Evidence.** cited 0.7% and flagged by multiple auditors as under-counted (it folds in
"soulless," "word salad," "no opinion"). Keyword-invisible.

**Why it reads as AI.** the prose is fluent and grammatical and makes no actual claim. It
restates the prompt, hedges, and moves on. Fluency with nothing behind it is the deepest tell.

**Fix.** make a real claim and cut the filler. If a paragraph could be deleted with nothing
lost, delete it. Say each thing once.

### 16. No contractions / over-formal register

**Evidence.** cited 0.7% (higher once "overly formal" is merged in). Keyword-invisible.

**Why it reads as AI.** "do not," "cannot," "it is" everywhere, in a casual context, reads as
stiff in the specific way the default register is stiff.

**Fix.** use contractions and write the way the speaker actually talks, unless the register
genuinely calls for formality (a brief, a paper).

### 17. Hedging instead of committing

**Evidence.** cited 0.3%. The scanner catches the cliche phrasings ("it depends," "on one hand
... on the other") but not the underlying refusal to commit.

**Why it reads as AI.** the model gives a balanced menu instead of an answer, because it is
trained to avoid being wrong. The reader wanted a position.

**Fix.** take a position. List the trade-off if it matters, but say what you would do.

A related shape is the stacked qualifier, "could potentially", "might arguably", "it may
perhaps be the case", where each round of editing added one more softener. Keep one qualifier
when the doubt is real. Keep scope statements, legal and safety caveats, and corrections; a
single "perhaps" or "tends to" is ordinary human prose.

### 18. The rule of three

**Evidence.** cited 1.2% and named spontaneously across several threads ("uses three-part
structures constantly"). A regex cannot reliably tell a deliberate triad from a normal list.

**Why it reads as AI.** the model loves parallel triplets and three-part lists. One is fine;
reaching for three every time is the tell.

**Fix.** vary the count. Two items, or four, or a single clean sentence. Do not let everything
arrive in threes.

### 19. Hallucinated citations, "Honestly," openers, and fake typos

- **Hallucinated citations** (cited by four auditors, no keyword share): invented sources,
  fake author names, made-up case law. A content-level giveaway. Verify every reference.
- **"Honestly," and fake-relatability openers** ("Look, I get it," "Imagine this"): one of the
  top threads is devoted to "Honestly" being "zombified by AI." The scanner catches the literal
  openers; cut the throat-clearing and start with the point.
- **Deliberately-inserted fake typos** to beat detectors ("excyted," "annownce"): named in the
  data as itself a tell. Do not fake errors. This is the over-corrected register, not a fix.

### 20. The over-corrected "anti-AI" register (the 2026 tell)

This is the mirror of the whole catalog above, and the moving target this skill exists to stay
ahead of. As writers learned the 2024 tells, a second default appeared: prose visibly straining
not to read as AI. It is its own tell, named in the data and clocked just as fast, the way a
cream-and-serif redesign is now its own tell in UI. Mostly keyword-invisible, so it belongs in
the human pass.

**What it looks like.** Staccato three-word fragments on every beat, so the rhythm is uniform
in a new way. Forced lowercase and dropped capitals in a context that is otherwise standard. A
"here's the thing," a "look," or a "real talk" cold open bolted onto formal content. Profanity
or a "lol" dropped in to seem off-the-cuff. And conspicuous em-dash avoidance: replacing every
natural dash with an ellipsis, a colon, or a sentence visibly contorted around the gap.

**Why it reads as AI.** It is still a default, just a newer one, and a reader feels the strain.
All-short sentences are as mechanical as all-medium ones; evenness is the tell whichever length
it lands on. Bolted-on slang is a costume rather than a voice, and the contortion to dodge a
dash is as legible as the dash would have been. The deliberately-inserted fake typo (entry 19)
is the most extreme form of the same move.

**Fix.** Do not over-apply the rules. The fix for a dash is a comma or a period in a sentence
you would actually write, not an ellipsis and not a contortion. The fix for the smooth voice is
a real voice (pick a register; see writing-with-intent.md), not the absence of voice dressed up
as casual. Vary sentence length for real, long ones included. If a casual marker is not native
to the register you chose, cut it.


## Part C: cleared by the data (do not over-chase)

The audited sample showed the keyword pass badly over-counts a set of ordinary words. They
match a lot of posts but are almost never what a reader actually cites, because they are the
poster's own normal prose, not a giveaway.

- "however," "thus," "hence": matched 6.3%, the single highest keyword share, and cited
  0%. Mostly the poster writing normally. Do not flag a lone "however."
- "when it comes to": matched 1.9%, cited 0%.
- "comprehensive," "robust," "crucial," "navigate," "utilize," "nuanced": matched 1 to 2%
  each, cited near 0%. Real words people use. "utilize" is worth swapping for "use," but it is
  not a smoking gun.
- "moreover / furthermore / additionally": matched 1.7%, over-counted. As a stacked
  sentence-opener it reads as machine-smoothed, but one of them is just a connective.

Flag what the data supports, at the weight it supports. For exactly this reason the scanner
does not scan "however", "when it comes to" or "navigate" at all, and weights the rest low,
apart from `nuanced`, which sits in the medium diction list of entry 6. Over-flagging trains writers to ignore the tool.

**Seen in other skills on 2026-11-01 and not adopted.** Recorded so a later cross-check does
not argue them again.

- **Curly quotation marks as a tell.** Curly quotes are standard UK typography and most
  editors insert them. Not a tell.
- **Passive voice as a tell.** Correct and often required in formal, legal and regulatory
  drafting (Register D). Prefer the active voice when it names who acts, but never flag it.
- **Dropping the hyphen after the noun** ("the plan is long term"). Weak, noisy, and a style
  rule rather than a tell.
- **An allowed number of em dashes per paragraph.** One upstream treats one dash in a
  paragraph as normal. This skill keeps the dash absolute (entry 1), because the readers in the
  data name it on sight.
- **Separate vocabulary and allow-list override files.** `unslop-ignore` on the line already
  marks a deliberate choice; a second mechanism would have no user.
- **Adding `key`, `valuable`, `enhance` to a stock-word list.** The data clears generic diction
  (above). `additionally` stays where it was, a low-weight sentence opener in the
  `transition-stack` rule, and nothing was added to it. `quietly`, as in "is quietly reshaping", is worth watching by
  ear as a new cliche, but there is no evidence yet to scan for it.


## Part D: added 2026-11-01 (ideas from two other skills, examples written fresh)

These come from cross-checking the humanizer and antislop skills (UPSTREAM.md has the commits
and why no text was copied). None has a Reddit share. Several overlap Part A or B; where they
do, the entry says so and adds only what was missing. Each says whether the scanner sees it,
and every scanner rule here is low severity, so alone none moves the verdict.
They are weaker alone than Part A: act on one when it clusters with others in the same
paragraph, which is what the scanner's cluster report shows.

### 22. One-line closers and rows of fragments

**What it looks like.** A one-sentence paragraph that repeats the paragraph above it ("That is
the whole point."), an instruction to the reader to pause ("Let that sink in."), the same
closer after every section, a line naming what an example has just shown, and a row of
fragments standing in for a claim ("No forms. No waiting. No surprises.").

**Pattern (scanner).** `closer-line` catches the fixed phrases: `let that sink in`, `read that
again`, `that's the real win`, `that distinction matters`, `the message was clear`. The row of
fragments and the repeated closer need an eye.

**Why it reads as AI.** the line asks for emphasis instead of adding anything, and it is the
same move whatever the subject.

**Fix.** cut a closer that repeats. Keep a short sentence that adds a new fact or consequence.
Merge a row of fragments into one sentence that says what is actually true. Overlaps entry 20:
the fragment row is also the over-corrected register.

### 23. The staged run-up before the point

**What it looks like.** An announcement that the point is coming, in place of the point:
"Here's what you need to know", "Let's break this down", "Without further ado", "Here's the
thing", "Real talk", a standalone "Honestly?" before a routine claim.

**Pattern (scanner).** `staged-runup`. Entry 4 (`dive in`) and entry 19 (`Honestly,`) cover two
members of the family already.

**Why it reads as AI.** a person with a point makes it. Staged candour is a performance of a
voice.

**Fix.** delete the run-up and start with the first sentence that carries information. A
casual "honestly" inside a sentence is ordinary speech; the tell is the opener.

### 24. Arguing with no one

**What it looks like.** A defence against an objection nobody raised: "To be clear, this isn't
about cost", "Don't get me wrong", "I'm not saying the old process was bad", "A tempting
approach would be to rebuild the whole table, but". Often a leftover from an earlier draft.

**Pattern (scanner).** `strawman-defence`, low, since people say these too.

**Fix.** delete the defence. If it carries a real claim, state the claim. Keep an objection the
reader really would raise, and keep an alternative they would really weigh. In formal
correspondence "to be clear" can be a deliberate clarification of a disputed point; leave it.

### 25. Sayings that sound deep

**What it looks like.** An ordinary point dressed as a hidden truth: "The real question is",
"At its core", "The heart of the matter", "What really matters is", "Trust is the currency of
property management".

**Pattern (scanner).** `deep-saying`, low. The "X is the Y of Z" aphorism needs an eye.

**Fix.** replace the saying with the specific claim it gestures at. "Clients renew when repairs
are done on time" says what the aphorism did not.

### 26. Inflated significance and the stock send-off

**What it looks like.** A plain fact made to mark a turning point or prove a legacy ("marking a
pivotal moment", "setting the stage for", "leaves an indelible mark"), the stock "Despite
these challenges, the town continues to thrive" paragraph, and the send-off ("The future looks
bright", "Exciting times lie ahead").

**Pattern (scanner).** `inflated-significance`, low. "Plays a key role" is not matched: in a
report it is often a plain statement of function ("the reserve fund plays a key role in meeting
the repairing obligations").

**Fix.** keep the fact and drop the significance. End on the last concrete fact. If the source
states real plans, give those instead of the forecast.

### 27. Shallow `-ing` riders

**What it looks like.** A participle clause bolted onto a fact to imply analysis: "The block
was re-roofed in 2019, reflecting the board's commitment to long-term maintenance."

**Pattern (scanner).** `ing-rider`, low: a comma, then `highlighting`, `underscoring`,
`showcasing`, `symbolising`, `cementing` and similar, then a determiner; `reflecting` and
`emphasising` only before an abstract noun such as "commitment" or "importance".

**Fix.** cut the rider and keep the fact. Keep it only when a source supports the claim it
makes, and then make it a sentence of its own. A rider that states a cause is a fact, not a
tell: "the reserve contribution rose to 45,000 pounds, reflecting the lift tender" explains the
figure, and a budget or an accounts note needs it.

### 28. Avoiding "is" and "has" (`serves as`, `stands as`, `boasts`)

**What it looks like.** "The courtyard serves as a meeting point." "The building boasts three
lifts." The plain verb was available and the sentence reached past it.

**Pattern (scanner).** `copula-avoidance`, low.

**Fix.** use "is", "are" and "has". Leave a fixed legal phrase alone: "this letter serves as
notice under section 20" is a term of art in Register D. The scanner matches only "serves as
a", "an" or "the", so it does not flag that phrase; never put `unslop-ignore` into a document
that goes to a client.

### 29. Borrowed authority

**What it looks like.** Unnamed experts or reports propping up a claim ("Experts agree",
"Industry reports suggest", "Observers have noted"), or a list of outlets standing in for what
was said.

**Pattern (scanner).** `borrowed-authority`, low.

**Fix.** name the source and what it said, or cut the claim. A sentence with no citation is not
a tell; most writing is unsourced. Overlaps entry 19's hallucinated citations: never invent the
source to fix the sentence.

### 30. A knowledge gap filled with a guess

**What it looks like.** The text admits it has no source and then fills the gap: "While
specific details are limited, the firm was likely founded in the 1990s." "Information about
his early life is not publicly available, suggesting he keeps a low profile."

**Pattern (scanner).** `knowledge-gap`, low, on the shapes that come with a guess: "while
details are limited", "keeps a low profile", "likely grew up". Entry 7 already catches the
explicit cutoff line.

**Fix.** say plainly what the sources do not show, or cut the sentence. Never keep the guess.
A plain statement of an evidential limit is the fix, not the tell: "based on the available
information, the surveyor cannot confirm the roof is watertight" stays, and the scanner does
not match it.

### 31. Elegant variation (a new synonym every sentence)

**What it looks like.** The same thing renamed in each sentence to avoid repeating a word: the
lease, then the agreement, then the instrument, then the document. In a contract or a notice
this is worse than style, because a reader may take each new word for a different thing.

**Pattern (scanner).** none; it is about meaning.

**Fix.** repeat the noun, or use a pronoun. Vary only when the things really differ.

### 32. Repeated sentence openings

**What it looks like.** Four sentences in a row that start "She", or "The system", or "This".

**Pattern (scanner).** none.

**Fix.** merge two of them, or start one with the action. Do not ban the word; a deliberate
repetition for rhythm is a choice.

### 33. Formatting by rule: title-case headings, decorative bold, the heading echoed

**What it looks like.** Every heading in title case in a document that otherwise uses sentence
case ("## Service Charge And Reserve Fund Overview"); bold on terms that need no emphasis; an
arrow or emoji in each heading; a first sentence that repeats the heading above it before the
content starts.

**Pattern (scanner).** `title-case-heading`, low: a markdown heading with a short joining word
(And, Of, The, For, With, To, In, On) capitalised in the middle, after a capitalised word. It
will also flag a proper name written that way; a name keeps the form its owner or the
statute gives it. Entries 8 and 11 cover the
bold label and the emoji. The echoed heading needs an eye.

**Fix.** sentence case, unless a house style says otherwise. Bold only what the reader must not
miss. Delete the sentence that repeats the heading.

### 34. Writing about the document instead of its subject

**What it looks like.** Narration of how the text was made or arranged: "This section is
organised by building", "The table below compares the three quotes", "This was added to
replace the previous approach", "Anything we could not confirm is flagged".

**Pattern (scanner).** none.

**Fix.** cut what the reader can already see. Keep a source credit the reader can follow, and a
caveat that changes what they should do. History belongs in a change log, not in the text that
replaced it. In Register D this entry mostly does not apply: signposting in a notice of
estimates or a tender report ("the table below compares the three quotes") and a statement of
what could not be verified in a survey or a safety report are expected, and may carry legal
weight. Cut them only in informal writing. `unslop-code` applies the same rule to code comments.

### 35. The reply that buries the decision

**What it looks like.** A reply in a thread that restates the problem, walks through the
diagnosis and shows the proof before it reaches the answer, which sits in the last line. Each
sentence reads well, so a sentence-level pass leaves it untouched.

**Pattern (scanner).** none. Act only when you can see the conversation, or the text plainly is
a reply.

**Fix.** lead with the decision. Keep the one fact the reader lacks and any link they need to
act. The diagnosis goes in the ticket or the document that follows.
