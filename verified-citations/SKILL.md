---
name: verified-citations
description: Stops fabricated and drifted references in any document that cites code, schema, config or history. Load BEFORE writing or reviewing a handover, design doc, plan, spec, decision log, lessons entry, audit, review report, PR description, or commit message that points at files, line numbers, migrations, commits, PRs or dates. The failure it prevents is specific and measured, a model grounds technical facts correctly while inventing the PATH around a borrowed line number, drifting a line number onto a blank line, citing a range that spans unrelated blocks, or misattributing when something landed, and then self-reports that everything was verified. Triggers on file:line, "landed in PR", "added on", "see some/file.ts", migration numbers, or any claim a reader would act on without re-deriving. Do not load for writing code itself.
---

# Verified citations

A citation is **output you produced**, never a reference you recalled. This skill exists because
recall is confident and wrong in a narrow, repeatable way, and because the model committing the
error reliably reports that it checked.

## The measured failure mode

Two independent runs on the same repository, one building a skill library, one authoring an
implementation design, both reviewed by a different model:

- **58 of 62 citations exactly right.** Trigger names, ERRCODEs, migration numbers, statutory
  message prefixes, function signatures: all correct. Technical grounding is not the weakness.
- **The misses were all about WHERE and WHEN, not WHAT:**
  - A **path invented around a borrowed line number.** A spec named a file with no directory and
    cited `:47-49`. The author reproduced the line numbers correctly and fabricated a plausible
    directory to complete the reference. The file was real; the path was not.
  - A **line number drifted onto nothing.** `:239` was cited as a function; 239 was a blank line
    between two functions.
  - **Ranges that were loose rather than wrong.** A cited `:82-118` contained the claimed content
    and also a comment block and a grants preamble, presented as one coherent thing.
  - **Provenance misattributed.** "Landed 2026-07-01 under audit C4" when `git log --follow` showed
    2026-06-15 under C5.
- **Every run self-reported full verification.** The error is invisible from the inside. That is
  the single most important fact in this file.

## The rule that does the work

**Every `file:line` citation carries the quoted text of the line it points at.**

This is not a style preference. It is the only rule here that cannot be satisfied by intending to
be careful, because you cannot quote a line without having opened the file at that path and looked
at that line. It kills the two commonest failures outright: a fabricated path has no line to quote,
and a drifted line number quotes a blank string.

It also makes review mechanical. A reviewer runs `sed -n 'Np' FILE` and compares, instead of
re-deriving your argument to decide whether they believe you.

If quoting every line would bloat the document, quote in the citations table at the end (below) and
keep bare `file:line` inline. The table is the evidence; the inline reference is the pointer.

## Four supporting rules, one per observed failure

1. **Never complete a partial reference from another document.** If a source names a file without a
   directory, or a symbol without a file, resolve it yourself with a glob or `find` and cite what
   the search returned. Inheriting `:47-49` from someone else's citation does not license inventing
   the path it hangs off. Correct line numbers are not evidence of a correct path.

2. **Cite the narrowest range that contains the claim, and check both boundaries.** A range is a
   claim that everything inside it is the thing you are describing. Read the first and last line of
   any range you cite. If they belong to different constructs, the range is wrong even though the
   content is in there somewhere.

3. **Provenance is the highest-risk class and needs its own command.** Any claim of the form
   "added on DATE", "landed in PR N", "shipped under audit item X", "introduced by commit SHA"
   requires `git log --follow`, `git show`, or the forge's API, run now. Never carry a date, PR
   number or SHA from memory or from a summary. In a squash-merge repository, note that "merged" is
   a PR fact and not a git-ancestry fact, so `git branch --merged` will lie to you in both
   directions.

4. **Write "unverified" out loud.** An explicit gap costs a reader nothing. A confident wrong
   citation costs a reviewer their entire pass and can outlive the document in things that quote it.
   If a tool was unavailable or the check was skipped, say which claim is affected and why.

## The output contract

End any document that makes more than a handful of citations with a table the reviewer can check
mechanically:

| Claim | Path | Line | Quoted text | How verified |
|---|---|---|---|---|

"How verified" is the command you actually ran (`grep -n`, `sed -n`, `git log --follow`,
`git show`). If a row cannot name a command, it is unverified and must say so in that column.

**"I verified everything" is not admissible.** The table is the evidence. Do not write a summary
sentence claiming the citations were checked, because that sentence has been true-sounding and false
in every recorded instance of this failure.

## Scope, and what this does not replace

**This applies to whoever is writing, not to one model.** The same session that caught a design
agent inventing a directory also produced two first-hand errors of the same genus, both asserted
confidently from structural inference, both one command away from being settled: "widening this
trigger alone would break production" (the caller made it irrelevant) and "the CLI is not installed
on this machine" (it was simply not on PATH). A reference you derived is not safer than one you
were handed. It only feels safer.

Adjacent rule, same root: **a failure message is a symptom, not a diagnosis.** "Not recognized"
means not on PATH. Establish that a blocker is real before designing around it, because a workaround
built on a phantom blocker is usually worse than the path it replaced, and it will not be reviewed
as carefully because it looks like a solved problem.

**This skill lowers the error rate. It does not remove the need for an independent verification
pass.** The 58/62 figure above was achieved *without* this skill, and the reviewer still earned its
keep on the two that mattered. If a workflow adopts this and quietly drops the adversarial review
because "the skill handles it", that trades a control that works for one that merely feels
diligent.

When you do run that review, brief it at **provenance specifically**. A reviewer asked to critique
a document returns opinions. A reviewer asked to verify every path, line and date against the
repository returns findings.
