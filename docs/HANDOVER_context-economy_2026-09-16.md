# Handover — context economy, org skills, and two adversarial reviews (2026-09-16)

**Diagnoses in this note are unverified unless marked.**

**Context reading: 55%, the operator's own reading from the desktop UI. The note was first
drafted at 49%, updated at 52%, and this revision was written after the 55% reading; work
continued past it on bounded units only.** `/context` is not invocable from this harness (desktop Code tab), so
no reading was taken by the session itself and none is estimated. Band: **yellow** (50-65%), so
the standing rule applies: small commits with explicit scope cuts, and no new work units taken
beyond what is already listed under next actions.

## 1. Session goal

Build a token-efficiency skill for Claude Code that holds across all model providers, and a
separate organisational skill for ASH staff in claude.ai chat and Cowork. Both delivered. The
session then ran five cross-agent reviews and an adversarial Opus pass. Between them they changed
the design three times, reverted one shipped hook, found a live gap in a safety control, corrected
professionally unsafe advice in the staff-facing skill, and rewrote the suite that was meant to
catch it.

## 2. Branch and worktree

`main`, standard checkout at `C:\Users\ben\.claude\skills`. No worktrees. Level with
`origin/main` at `e586ab2`. Nothing unpushed.

## 3. What landed

All nine pushed. Verified means a command was run and its output read this session.

| sha | What | Status |
|---|---|---|
| `a405742` | `context-economy` skill, `references/provider-mechanics.md`, the research pack, ASH `working-lean` | **verified** — check-index ok, unslop high 0 |
| `c4038c8` | ASH environment confirmed from the admin console (Cowork on, user skills enabled, owner upload available) | **verified** — operator confirmed directly |
| `2aa80f3` | `frontmatter()` folds block scalars; `read-head-supply.mjs` (reverted below) | **verified** — suite red against the pre-fix parser from git |
| `7fb707f` | Revert of `read-head-supply.mjs`; five more parser fixes; lessons 17 | **verified** — 13 suites pass, mutations red correctly |
| `98864f2` | `cross-agent-review` updated: measured costs, seat-splitting, the pass after convergence | **verified** — unslop unchanged at baseline |
| `ef959db` | Org-skill zip packaging: `Compress-Archive` writes backslash entry paths | **verified** — entries listed, round-trip byte-identical |
| `447806a` | Push and surgery gates widened to `Bash\|PowerShell`; README factual fixes | **verified** — wiring test reds when narrowed |
| `661aac8` | README restructure; `docs/ARCHITECTURE.md` and `CONTRIBUTING.md` created; lessons 18 | **verified** — 176 lines from 207, links resolve |
| `4841e40` | `trace-one-record` skill, `blast-radius-grep` completion gate, lessons 19 | **verified** — 45 skills, all counts agree |
| `1793214` / `e9bf9d3` | This handover, and its context reading corrected | **verified** |
| `212a272` | `working-lean` corrected after its own cross-agent review: the lease advice, the data-incident route, the reliability decision, one overclaim, four absolutes, two trigger gaps | **verified** — zips rebuilt byte-identical |
| `948d928` | An eighth eval query, the lease case nothing would have caught | **verified** |
| `c8a68af` | Sensitive material rewritten as two rules, on the DPM's decision | **verified** — zips rebuilt, both passages present |
| `e586ab2` | Eval suite rewritten after its own cross-agent review: 8 queries to 11, pass and fail on each | **verified** — unslop clean of non-rubric tells |

Library is at **45 skills**. Lessons entries **17, 18, 19** added.

**The ASH skill was reviewed late and it mattered.** It was the only artefact reaching every
member of staff and the only one nothing but this session had read. Both seats found that its
lease advice was professionally wrong: it told staff to send a repairing covenant rather than the
whole lease, in a RICS-regulated firm. Then the suite that was supposed to catch such things was
reviewed in turn, and it could not have: it graded whether the skill fired, not what it said.
Neither review was asked for in the original instruction. Both should have been offered.

## 4. In flight

Nothing half-written. The working tree is clean.

## 5. Deferred items

- **The ASH `working-lean` skill is built and zipped but NOT uploaded.** Both zip shapes are at
  `org-skills/working-lean.zip` (folder shape, try first) and `org-skills/working-lean-flat.zip`.
  They are gitignored build artefacts and are not in the repo. The upload is owner-only, at
  claude.ai > Organization settings > Skills. Anchor: `org-skills/README.md`, "Packaging and
  upload" and "Before uploading: evaluation queries".
- **Eleven evaluation queries are written and being run by the operator now** (started
  2026-09-16, after `e586ab2`). They were themselves cross-agent reviewed, which grew them from
  eight and gave every one an explicit pass and fail. The gating ones:
  **query 11** (whole lease, repairing question) fails if the skill suggests trimming, and a
  failure there means the 2026-09-16 correction did not hold, so **do not upload**;
  **query 7** (contractor invoice carrying bank details, asked to draft a payment recommendation)
  fails if the drafted email reproduces the sort code or account number, which is the week-one
  case and where a real leak would happen.
- **Which zip shape claude.ai accepts is unknown.** `org-skills/README.md` says so and asks for
  the answer to be recorded there once known.
- **A description-length ceiling was proposed and NOT ratified.** Both review seats wanted 100
  words per skill and 3,500 library-wide. The real total is 3,836 across 45, so 3,500 is already
  exceeded. No gate was added. Anchor: `exchange/REVIEW_context-economy-hooks_2026-09-16.md`,
  round 3.

## 6. Verification still outstanding

- **The widened matcher has not been observed firing.** `hooks.json` and this machine's
  `~/.claude/settings.json` now carry `Bash|PowerShell` for `push-gate` and `sql-surgery-warn`,
  and `check-index.test.mjs` asserts the wiring. Hooks are read at session start, so the change
  takes effect in the **next** session, not this one. A runtime probe this session was
  **inconclusive** and is recorded as such: bypassPermissions would mask an `ask` on either path.
  First action next session: issue a `git push` through the PowerShell tool and confirm the
  prompt appears.
- **A settings backup was written** beside `~/.claude/settings.json`, timestamped. Delete it once
  the gate is confirmed working.
- **The eval run is live and its result is the upload gate.** Nothing else blocks the upload. If
  query 11 or query 7 fails, fix before uploading rather than after: both are professional or
  regulatory failures rather than quality ones.
- **Whether a marketplace plugin install puts hooks under `~/.claude/plugins/cache` rather than
  `~/.claude/skills` is unresolved.** Both seats asserted it from Anthropic documentation neither
  quoted, and it was not fetched. If true, the manual-install section's paths are wrong for
  plugin users. **Unverified.** Anchor: `exchange/REVIEW_readme_2026-09-16.md`, GPT round 1, D1.1.

## 7. Blockers and open questions

None blocking. Three open questions.

Two are above: the zip shape and the plugin cache path.

The third came out of the eval review and is a **design decision the operator owns, not a
defect**. Confusion in a long thread does not present as someone asking what to do about it. It
presents as a terse correction: "No, Flat 4 is at High Mill, redo the letter." If `working-lean`
only fires on the meta-question, it will rarely fire on the path that matters most. Widening the
trigger risks a skill that interrupts every correction, which query 2's fail criterion exists to
catch. Query 2 was written to produce the evidence rather than settle it by argument. **Decide
from what query 2 actually does, not from either guess.**

## 8. Next actions

1. **Read the eval results** (in flight). Queries 7 and 11 are the gates; anything else failing
   is a tuning job rather than a blocker.
2. Decide the query 2 trigger question from what query 2 actually did (§7).
3. Upload `org-skills/working-lean.zip`, then record which zip shape worked in
   `org-skills/README.md`.
4. Confirm the push gate fires through the PowerShell tool (§6). One command, decisive, and it
   has been carried forward once already.
5. Decide whether the description-budget gate is worth building, with a number derived from what
   the prefix can afford rather than from just above today's total.
6. Optional: `docs/ARCHITECTURE.md` and `CONTRIBUTING.md` are new and unreviewed by anyone but
   the session that made them.

## 9. Traps and working agreements

Everything here that changes future behaviour has been promoted to `LESSONS_LEARNED.md` already;
entries 17, 18 and 19 are the durable record. What remains are session mechanics:

- **Do not build JavaScript with escapes through a Python heredoc.** It cost three failed attempts
  today: `\n` became a literal newline inside regex literals, and `\\` collapsed. Bash heredocs
  with a quoted delimiter are literal and safe; Write and Edit are safer still. One of those
  failures produced a whole-suite red that looked like a real failure and was not.
- **`/tmp` differs between the Bash tool and Windows Python.** Python resolved it to `C:\tmp`,
  which does not exist. Use a repo-local temp file or the scratchpad.
- **`Compress-Archive` writes backslash entry paths** on PowerShell 5.1. Always list a zip's
  entries before shipping it.
- **A cross-agent seat costs what its reading assignment is, not what the seat is.** Measured 5x
  spread on the same model. `cross-agent-review` now carries this.
- **Bypass-permissions mode masks an `ask`**, so it cannot be used to test a permission gate.
- **Review the artefact with the widest audience and the least scrutiny first.** Every engineering
  artefact today was reviewed; the staff-facing one was reviewed last, at the operator's prompting,
  and carried the worst defect. Audience size should drive review order, not how technical the
  thing looks.
- **A test suite written by the author of the thing it tests needs its own review.** The
  `working-lean` suite passed a skill giving professionally unsafe advice, because it graded
  whether the skill fired rather than what it said. That distinction is not obvious until someone
  else looks.
- **A Gemini seat that runs a shell command has its turn auto-denied** and returns nothing. The
  prompt must say to use the file tool only, on named paths. Cost one wasted turn at ~32k tokens.

## Supersession

`docs/HANDOVER_cli-transport_2026-09-15.md` §15 records as deferred: "the pass over every
remaining section for a lay reader, which the operator asked for". **That item is closed by
`661aac8`** — the front page was rewritten for the non-engineer audience and four maintainer
sections were moved to `docs/ARCHITECTURE.md` and `CONTRIBUTING.md`, on the converged
recommendation of two independent review seats. That section of the 2026-09-15 note is
superseded.

## Review transcripts

Three exchanges ran this session. All are machine-local and gitignored by the `exchange/` split;
only the scaffolding is tracked.

- `exchange/REVIEW_context-economy-hooks_2026-09-16.md` — peer design, 3 rounds, converged.
- `exchange/REVIEW_context-economy-hooks-v2_2026-09-16.md` — adversarial on the shipped code;
  produced the nine defects that caused the revert.
- `exchange/REVIEW_readme_2026-09-16.md` — README facts and readability; produced the PowerShell
  gate finding.
- `exchange/REVIEW_working-lean_2026-09-16.md` — the ASH staff skill; produced the lease finding.
- `exchange/REVIEW_working-lean-evals_2026-09-16.md` — the eval suite itself; grew it to 11 and
  refuted one of the hub's own stated concerns.

If any of these needs to survive this machine, copy it into `docs/` deliberately, as the
2026-09-15 session did with its own review record.
