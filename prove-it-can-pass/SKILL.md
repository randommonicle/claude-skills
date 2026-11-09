---
name: prove-it-can-pass
description: A deny-list, pattern gate, scanner or guard is only half proved by a violation it catches; the other half is innocent input it must let through, and the violating forms nobody pictured. Before arming one, run it over a real corpus of legitimate input rather than invented examples, over the command and code forms the project's own rules mandate, and over the domain's ordinary vocabulary; make every refusal recoverable without disclosing what was refused; and check a curated allowlist or denylist for what is missing from it as well as what is on it. Triggers when writing, widening or arming any regex gate, deny-list, allowlist, secret scanner, content filter, moderation or safety check, lint rule, pre-commit or PreToolUse hook, validation rule or CI guard; when a guard refuses something that looks legitimate; and when a guard has a green suite whose cases were written by hand. Does not fire on proving a check can go red (prove-it-can-fail owns that direction) or on triaging an already-red suite (mass-red-triage).
---

# Prove it can pass

`prove-it-can-fail` asks what a check prints when the thing it guards is broken. That
question has a twin, and the twin has been answered wrong more often here: what does the
check do to input that is *fine*, and what does it do to the violating form nobody pictured?
A gate proved in one direction is a gate proved on half its inputs.

Both failures are expensive and neither is loud. A false positive stops legitimate work and
blames the worker: a secret guard refused a test tally named `pass`, a caption guard built
from a customer's surname refused "a white carpet" for Mr White, a regex `\bbrowser\.`
matched a full stop in a comment and killed an entire smoke-database run. A false negative is
worse, because nothing happens at all: `git -C <path> push` walked straight past a push gate
in a library whose own skill tells every session in a worktree to use `git -C` exclusively,
and a guard over a curated list of specs inspected only the specs on the list, so an omission
exited 0 and read as clean.

The common cause is the corpus. Each of these gates had a test suite, each suite was green,
and each suite was written by the person who wrote the gate, out of the same imagination.

## The rules

1. **Take the corpus from reality, not from imagination.** Before arming a gate, replay it
   over input that was really produced: session transcripts for a shell or tool gate, real
   commit messages, the project's actual source for a lint rule, real captions and real
   customer records for a content filter. The overnight stall of 2026-09-16 is the canonical
   instance. The gate had passed 64 hand-written commands that evening, and not one of them
   was the PowerShell multi-line here-string block the driver actually emits
   (`hooks/preflight-unattended.mjs:5-14`, which exists to do exactly this). An invented
   corpus tests the author's mental model twice.
2. **Run it over the forms your own rules mandate.** Grep the project's skills, conventions
   and docs for the command and code shapes they *require*, and feed each one through. A gate
   that misses the form the house style demands will be walked past by every compliant
   session, and the compliant sessions are the ones you were not watching. Library 12 is the
   shape: `parallel-work-recon` mandates `git -C`; the push gate matched `/\bgit\s+push\b/`
   and any global option between the two words defeated it.
3. **Run it over the domain's own vocabulary.** A name list, surname list or keyword list
   collides with ordinary language, and the collisions are predictable enough to enumerate:
   `pass`, `key`, `token`, `session` in shell; White, Rose, Hall, Wool, Green, Church as
   surnames; `test`, `demo`, `sample` in data. List the dictionary words your list contains
   and decide each one, rather than discovering them one refusal at a time.
4. **Mind the metacharacter that matches more than it reads as.** `.` is any character,
   `\b` sits between a letter and a full stop as happily as between two words, and an
   unanchored alternation matches inside a longer token. `\bbrowser\.` was written to mean a
   method call and matched the end of a sentence. Escape, anchor, and then test the
   near-misses: the same text in a comment, in a string literal, in prose, hyphenated, and as
   a substring of a longer identifier.
5. **A refusal is recoverable without disclosing what it refused.** The caller must be able
   to retry and succeed without being told the pattern, the list, or the customer datum that
   triggered it. Otherwise the guard either becomes an oracle for the thing it protects, or
   leaves the caller looping on a failure it cannot diagnose. Give the refusal a stable code,
   a safe suggestion ("rename the variable", "resubmit without the quoted block"), and a
   documented exempt form. ICC L-126 is the failure: the retry path could not recover without
   sending the protected name back to the model.
6. **A guard over a curated list checks the list's omissions, not only its members.** If the
   set is maintained by hand, the interesting failure is the member nobody added. Derive the
   full set from its source (the directory, the catalogue, the schema), compare it against
   the curated list, and fail on the difference. PropOS 2026-08-18: the guard inspected only
   the specs named in `DB_ONLY_SPECS`, so a spec left off the list was never inspected and the
   run exited 0. This is `enumerate-the-set` applied to a gate's own configuration.
7. **Price the false positive at the size of what it stops, not the input.** These gates
   usually fail closed and usually sit in front of something large: a whole smoke-database
   run, an overnight unattended ride, a customer's order. Fourteen hours was the cost of one
   phrase inside one commit message. Decide deliberately whether a given gate should refuse
   the batch or quarantine the item, and say which in the gate's own header.
8. **Every exemption you discover becomes a test case, in both directions.** When a false
   positive is fixed by an exemption, so that `pass_count` passes where `pass` does not, the suite
   gains the allowed form *and* keeps the denied one, so the next widening cannot quietly
   swallow the exemption or the rule. A fix recorded only in a commit message is not a
   control.
9. **If the thing already reports in a machine channel, read that channel and not its
   prose.** The commonest invented corpus is not a deny-list at all: it is a one-line
   throwaway that greps a tool's output for the word it assumes means success. Exit codes,
   JSON fields and structured results are written to be read; a human-facing summary line is
   written to be read by a human and changes wording freely. Grepping it guesses at a format
   you could have looked up, and the guess fails silently in both directions, passing a suite
   that printed a failure in an unexpected shape and failing one that passed. Twice in one
   piece of work here, a loop checking suites for `all cases passed` reported a healthy suite
   as broken because that suite prints `all 9 cases passed`, while every one of those suites
   ends `process.exit(fails ? 1 : 0)` and had been telling the truth all along. The second
   time was four days after the first was written into the misses log. This rule is cheap
   enough to apply without thinking, which is the point: the checks that go unexamined are
   the quick ones nobody counts as code.

## The question to ask

For `prove-it-can-fail` it is "what does this print when the thing is broken". For this skill
there are two, and both need an answer before the gate is armed:

- **What legitimate input does this refuse?** Name it from a real corpus, not from thought.
- **What violating form does this miss?** Name it from your own project's mandated shapes.

If the answer to either is "none that I can think of", the gate has not been tested. That
sentence is the description of an untested gate, and it was true of all six instances below.

## Provenance

False positives: library 25 (`secret-echo-guard` refused a test tally named `pass`; `PASS`
matches `SECRET_NAME` as a whole name and the `_COUNT` exemption meant `pass_count` would have
passed, `hooks/secret-echo-guard.mjs:100-102`), the overnight stall of 2026-09-16 recorded in
`hooks/preflight-unattended.mjs:5-14` (push-gate matched "gh pr merge" inside a commit message
and held an unattended run for fourteen hours; its suite was 64 invented commands), ICC L-126
(a caption guard built from the customer's name refused "a white carpet" for Mr White, and the
retry could not recover without sending the name to the model), PropOS 2026-08-11
(`\bbrowser\.` matched a comment's full stop and killed the whole smoke-db run).
Missed violations: library 12 (`git -C x push` walked past the push gate while
`parallel-work-recon` mandates `git -C`; the gate's suite was green and fed it only the bare
form), PropOS 2026-08-18 (the guard over `DB_ONLY_SPECS` inspected only listed specs, so an
omission exited 0). `docs/SKILL_PROPOSALS_2026-11-01.md`, Tier 1 item 1, admitted by Ben
2026-11-05.

Adjacent, and deliberately not duplicated: `prove-it-can-fail` owns the other direction, and
its rule 3 is the nearest existing line, a negative assertion needing a positive control
(`prove-it-can-fail/SKILL.md:30`), but it governs assertions inside a test, not a gate's
corpus. `hooks/preflight-unattended.mjs` does the real-corpus replay for the wired PreToolUse
hooks on this machine, which is rule 1 built for one case; this skill is the general rule and
names the tool. `enumerate-the-set` owns rule 6's parent idea. `mass-red-triage` owns a suite
that is already red.
