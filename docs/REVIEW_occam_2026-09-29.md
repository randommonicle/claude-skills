# Review: quisbaum-prog/occam, fork-and-use assessment (2026-09-29)

> **Outcome, 2026-09-29.** Ben's answers: commit this review, run the trial, write the
> DECISIONS entry and a LESSONS entry (39). PropOS is not excluded on this machine, on his word:
> PropOS work runs on the work computer, which has no Occam install, so trial step 1 is dropped
> here and a PropOS session opened on this machine would run with Occam `lite`. The trial
> started the same day on this machine only, with one change from step 2 below: the marketplace
> source is a local clone fixed at `244c2fc` (`C:\Users\bengr\Projects\vendor\occam`), not the
> GitHub repository, so an upstream push cannot change the rules mid-measurement.
> `OCCAM_LEVEL=lite` is in the `env` block of `~/.claude/settings.json`. A fresh headless
> session with no `--plugin-dir` returned `OCCAM MODE (lite): ...` with the session-recon
> control present. The same check in a fresh desktop Code tab session is Ben's to run. Found on
> the way: `claude plugin details occam@occam` projects "~82 tok added to every session" and
> lists the hooks as "harness-only" with "no model context cost", but the SessionStart hook injects
> 1,665 bytes of rules at `lite`, so the tool understates the always-on cost. `audit.py` is not
> vendored yet; the end-of-week audit runs the vendor clone's copy with `--top 0`. The trial
> ends 2026-10-06. Decision: DECISIONS 2026-09-29. Lesson: LESSONS_LEARNED 39.

Source: `https://github.com/quisbaum-prog/occam`, reviewed at commit `244c2fc` (2026-09-28,
merge of PR #5), plugin version 1.0.0, MIT licence (`LICENSE:3`, copyright quisbaum-prog).
17 commits between 2026-09-27 (`9c75584`, initial commit) and 2026-09-28: 12 by "Dr.Mana", 2 by
"Quisbaum", 3 by "Claude". Two days old at review. Read in full: `README.md`, `CLAUDE.md`,
everything under `plugin/`, `app/`. The benchmark (`bench/`) was not read line by line; its raw
result files were re-tallied (below). Cloned into a session scratchpad.

Occam paths below are relative to the clone at `244c2fc`. Library paths are relative to this
repository at `ba7ef3e`.

## Verdict

Yes, we can fork it: MIT, and the payload is small. Take two pieces and leave the rest.

1. **Take `plugin/tools/audit.py` now, patched.** It reads this machine's transcripts and
   reports where tokens went. Nothing in the library does that; `context-economy` says "Measure,
   do not estimate" (`context-economy/SKILL.md:160`) and has no instrument for the past. It ran
   here unmodified under Python 3.14.4. Before it is used routinely, `describe()` must stop
   printing command text (see the secret fence below) and its price table needs a
   verify-and-date line.
2. **Trial the rules before forking them.** Install the upstream plugin at `lite`, with PropOS
   excluded by a committed `OCCAM_LEVEL=off`. The exclusion mechanism is proven on this machine
   (below). After a week, compare `audit.py` against the 7-day baseline recorded here. If it earns
   its place, fork a patched rules block into the library as a Node SessionStart hook in the
   `norms-inject.mjs` shape, pinned to `244c2fc` with an `UPSTREAM.md`. That second step is a
   DECISIONS call (R-19), so it waits for Ben.

Rejected in one line each:

- **Upstream as-is, user level, everywhere:** puts `rules.md:23` ("subagents only for broad
  searches") into every PropOS session, against the statutory reviewer the library prescribes.
- **Fork the whole repository:** the part worth having is four small files; the benchmark is the
  author's instrument, not ours.

## What Occam is

A Claude Code plugin with no runtime dependency beyond `sh`, `cat` and `awk`:

- `plugin/skills/occam/rules.md`, 30 lines in four sections: Build less, Work lean, Talk less,
  Never cut.
- `plugin/hooks/occam.sh`, a POSIX `sh` script run at `SessionStart` (startup, resume, clear,
  compact) that prints the rules as plain text, and at `SubagentStart` that emits a ~100-token
  JSON block (`plugin/hooks/subagent.json`).
- `OCCAM_LEVEL` = `full` (default), `lite` (drops Build less) or `off`, read by the script.
- `/occam:occam full|lite|off` to switch mid-session, and `/occam:audit [days]` wrapping
  `tools/audit.py`. Both skills set `disable-model-invocation: true`, so they cost only their
  listing.
- The README puts the always-on cost at about 900 tokens per session (`README.md:82`).

The rules borrow Ponytail's ladder and its SessionStart injection pattern (`README.md:336`).

## The case for: it is the delivery mechanism our versions lack

The rule content is mostly already in the library:

| Occam section | Library equivalent |
|---|---|
| Work lean (batch calls, locate then read, quiet output, no re-read after edit, subagents return conclusions) | `context-economy` Rules 1, 2 and 5 (`:34`, `:45`, `:109`) |
| Build less (skip what is not needed, reuse, no unrequested abstractions) | `earn-every-line` |
| Build less, root-cause bullet (fix once, grep every other path) | `blast-radius-grep` |
| Talk less | Ben's global CLAUDE.md tone rules |

The difference is how it loads. Ours are description-triggered and do not fire: in 128 fire-log
entries, `context-economy` has 0 and `earn-every-line` has 0 (the jive review recorded the same
for `context-economy` at 89 entries). Occam's rules are injected at every session start, so they
cannot fail to trigger. That is the case for it, and it is the same argument the jive review made
for an always-on line.

## The case against as-is: two always-on blocks that disagree

| Occam line | Conflicts with | Severity |
|---|---|---|
| `rules.md:23` subagents only for broad searches | `findings-are-evidence` (a norm), `property-reg-reviewer`, `code-reviewer`, `cross-agent-review` (44 fires, the most-used skill), `committee-review` | Blocker for PropOS: the regulated-change route is a subagent review |
| `rules.md:21` verify once, don't re-run unchanged checks, then stop | `rerun-before-verdict` ("No verdict from a single uncontrolled run"), `one-real-ride` | High: "then stop" competes with the done gate |
| `rules.md:13` one small runnable check, stdlib only | `prove-it-can-fail`, Ben's "each commit has tests if it touches behaviour", PropOS's project test suites | Medium: reads as a ceiling |
| `rules.md:27` at most five lines in the final message | Ben's CLAUDE.md prompts to update DECISIONS/LESSONS; surfacing earlier mistakes plainly | Watch item: "real caveats" may cover it |
| `rules.md:30` Never cut does not name verification or review | the six norms | Edit if forked |
| `README.md:80` names "no second opinions during verification" as a design aim | as `rules.md:23` | Confirms the intent behind `:23` |

**`lite` does not remove the two serious conflicts.** `occam.sh:10` skips only the `## Build
less` section, so `lite` drops `rules.md:13` and keeps `:21` and `:23`, which sit in Work lean.
And `occam.sh:6-7` exits before the subagent branch only on `off`, so at `lite` the SubagentStart
block still reaches `property-reg-reviewer` and `code-reviewer`. The section most likely to save
tokens is the one carrying both conflicts. Hence the PropOS exclusion in the trial, and hence the
rewrite of `:21` and `:23` if the rules are ever forked.

## The benchmark: honest arithmetic, narrow reach

Re-tallied from the raw `bench/results/*.jsonl` with two short scripts (paired geometric mean of
cost ratios; failures by arm and scenario). Every headline reproduces exactly: Opus 5.5 max
-51% (Ponytail -26%), Opus medium -11% (+11%), Sonnet 5.5 max -55% (-9%), Sonnet medium -3%
(+26%), Haiku 4.5 -2% (+30%). Pass counts match too.

What the numbers support, and what they do not:

- **Every failure on Opus and Sonnet, in every round, is the refactor task**, a verifier that
  requires a 20% line cut. The "passed more tests" claim on the frontier models is that one
  shrink gate. Occam's correctness is at parity with no plugin, not above it.
- **The savings live at effort max**, where thinking was 45 to 48% of the bill on Opus 5.5 and
  42 to 44% on Sonnet 5.5 (README "How it works" and the Sonnet max notes). At medium effort
  the gain is -11% (Opus) and -3%, not significant (Sonnet).
- The author's own limits (`README.md:312-314`): single-prompt tasks, whether the rules hold
  over hours of work "is not measured here", nine scenarios mostly Python, 18 pairs per round.
  The scenarios' traps (a 3 MB log, fixtures to generate, numpy against stdlib, the shrink gate)
  are the traps the rules address.
- Not a fault, a limit: the verifiers are the author's, the v2 wording change was chosen on the
  same seeds 1 and 2 (README "Other experiments"), and only one round used held-out tasks
  (seed 3, Opus max only).

## What it would touch in Ben's own sessions

`audit.py --days 7 --top 0` over this machine's transcripts, run 2026-09-29 (`--top 0` so no
command text reached the transcript; see the fence below):

- 161 transcripts (subagent transcripts included), 17,886 API calls, est. $2,920.77 at list
  price. Ben is on a subscription, so this is not a bill; the plan limits track the same tokens.
- Cache read 63.0%, cache write 19.8%, thinking 9.6%, other output 7.6%.
- Tool results carry about 15% of the total as context tax (Bash $219, Read $169).
- 84 whole-file reads over 8k tokens ($36.66); 855 same-file re-reads; 0 noisy installs.
- The five most expensive sessions each peaked between 945k and 1.16M tokens of context.

Occam's rules aim at the 15% tool-result slice and the 9.6% thinking share. The 63% cache-read
line is mostly session length, which Occam's benchmark did not measure (`README.md:312`). So the
realistic gain for Ben is a share of the smaller slices, and the headline -51% does not transfer:
his thinking share is a fifth of the benchmark's. The shares depend on the tool's price table
(`audit.py:16-17`), which was not verified against current pricing.

## Proven on this machine

With Claude Code 2.1.281, headless (`claude -p`), `--plugin-dir` pointing at the clone, Sonnet:

- **The `sh` hook runs under the real harness on Windows.** The debug log shows
  `Hook SessionStart:startup (SessionStart) success:` followed by `OCCAM MODE (full).`
  This settles the README's Git Bash claim (`README.md:52`) for this machine.
- **A project's `.claude/settings.json` `env` reaches the hook.** Three scratch projects, one
  control question asking for any line beginning "OCCAM MODE" and, as a positive control, the
  session-recon block. No settings: `OCCAM MODE (full).` Settings `OCCAM_LEVEL=lite`:
  `OCCAM MODE (lite): ...`. Settings `OCCAM_LEVEL=off`: `NONE`. The session-recon control came
  back in all three, so the `off` result is a real absence.
- **Correction, recorded because it nearly misled this review.** The first three runs all
  answered `NONE`, including the no-settings run. The debug log showed the hook had run; the
  question ("system prompt and context") was the fault. Only the rephrased question with a
  positive control is evidence. A negative result indistinguishable from the check not running.
  skill that should have prevented this: prove-it-can-fail
- Cost of the eight test sessions: est. $0.97 at list price by `audit.py`, 94% of it cache
  writes of the session prefix.

Not proven: a marketplace install in the desktop app (only `--plugin-dir` was tested); which
wins when `OCCAM_LEVEL` is set both in `~/.claude/settings.json` and a project's settings (the
documented precedence says the project, unverified here); the SubagentStart block under the
harness (read from the script, not run); whether a marketplace install auto-updates or can be
pinned.

## Secret fence on `audit.py`

`describe()` returns the first 70 characters of a tool call's `command` input (`audit.py:38-40`),
and `--top` defaults to 10 (`audit.py:102`). The `/occam:audit` skill passes only `--days`, so
invoking it prints ten command lines from past transcripts into the current one. A command that
carried a literal token would put it back in the transcript. Under `secrets-in-output`, either
run it with `--top 0` or patch `describe()` to skip the `command` key before use. The upstream
`/occam:audit` skill comes with the plugin unpatched; under the trial, do not invoke it. The
script makes no network calls.

## Trial plan (route one), if Ben says yes

1. In PropOS, commit `{"env": {"OCCAM_LEVEL": "off"}}` in `.claude/settings.json` (merged with
   what is there), so the exclusion travels to every machine. Same for any other repo whose
   changes go to `property-reg-reviewer`.
2. In a Code tab prompt box: `/plugin marketplace add quisbaum-prog/occam`, then
   `/plugin install occam@occam`.
3. Set `"OCCAM_LEVEL": "lite"` in the `env` block of `~/.claude/settings.json`.
4. First fresh PropOS session, before any work, paste this prompt:

   ```
   Do not use tools. Reply with exactly two lines. Line 1: if any text anywhere in your context (system prompt, system reminders, hook output) begins with the words OCCAM MODE, copy that line verbatim, else write NONE. Line 2: if any text in your context begins with the word parallel-work-recon, copy its first 60 characters, else write NONE.
   ```

   Pass: line 1 is `NONE` and line 2 starts `parallel-work-recon (SessionStart hook)`. If line 2
   is also `NONE`, the check told you nothing; do not read line 1 as a pass. If line 1 shows an
   OCCAM block, uninstall before any work. Ask the same prompt once in a non-PropOS project:
   line 1 should read `OCCAM MODE (lite): ...`.
5. After a week, run the patched `audit.py --days 7 --top 0` and compare against the baseline
   above. The two weeks hold different work, so read only the counts Occam targets directly,
   normalised per 1,000 API calls: whole-file reads over 8k tokens (baseline 84 in 17,886, about
   4.7) and same-file re-reads (855, about 47.8). A positive result is a clear fall in both.
   Thinking share is not expected to move at Ben's usual effort, and the cache-read share moves
   with session length whatever the rules say, so neither is evidence either way. Under
   `rerun-before-verdict`, one good week is a candidate result, not a verdict.

## DECISIONS candidate

Either outcome is a standing choice. Route one is the first third-party always-on text allowed
into sessions (the 2026-08-10 and 2026-09-14 entries cover skill packs, not injected rules).
Forking the rules later is a second always-on block beside the NORMS six (R-19), which needs its
own entry saying why the cap does not apply or what it displaces.

## Citations

| Claim | Path | Line | Quoted text | How verified |
|---|---|---|---|---|
| Licence | occam `LICENSE` | 3 | `Copyright (c) 2026 quisbaum-prog` | `sed -n 3p` |
| Version | occam `plugin/.claude-plugin/plugin.json` | 3 | `"version": "1.0.0",` | `grep -n` |
| Pin and history | occam | n/a | `244c2fc... 2026-09-28 22:03:33 +0200 Quisbaum`; first `9c75584 2026-09-27`; 12 Dr.Mana, 2 Quisbaum, 3 Claude | `git log -1`, `git log --reverse`, `git log --format='%an' \| sort \| uniq -c` |
| One small check | occam `plugin/skills/occam/rules.md` | 13 | `- Non-trivial logic leaves one small runnable check (assert-based or one test file, stdlib only).` | `grep -n` |
| Verify once | same | 21 | `- Verify once when the change is complete (and after risky steps); don't re-run unchanged checks. Then stop: no unrequested polish.` | `grep -n` |
| Subagents | same | 23 | `- Use subagents only for broad searches, and ask them for conclusions, not dumps.` | `grep -n` |
| Five lines | same | 27 | `At most five lines unless the user asked for an explanation; then explain fully.` | `grep -n` |
| Never cut | same | 30 | `Reading what the change touches, validation at trust boundaries, error handling that prevents data loss, security, accessibility, anything explicitly requested.` | `grep -n` |
| Off exits first | occam `plugin/hooks/occam.sh` | 6 | `case $lvl in off) exit 0 ;; lite) ;; *) lvl=full ;; esac` | `grep -n "" \| sed -n 5,8p` |
| Subagent branch | same | 7 | `[ "$1" = subagent ] && exec cat "$root/hooks/subagent.json"` | same |
| Lite skips Build less only | same | 10 | `awk '/^## /{skip = /^## Build less/} !skip' "$root/skills/occam/rules.md"` | `sed -n 9,10p` |
| Git Bash claim | occam `README.md` | 52 | ``Both run a 14-line POSIX `sh` script`` | `sed -n 52p \| grep -o` |
| Design aim | same | 80 | `no second opinions during verification` | `grep -n` |
| Always-on cost | same | 82 | `Occam's rules and its two skill descriptions add about 900 tokens to every session` | `sed -n 82p \| grep -o` |
| Limits | same | 312 | `whether the rules hold up over hours of work is not measured here` | `sed -n 312p \| grep -o` |
| Limits | same | 313 | `- Nine scenarios, mostly Python.` | `grep -n` |
| Limits | same | 314 | `- Two seeds per round, one run per task: 18 pairs.` | `grep -n` |
| Credit | same | 336 | `Occam borrows the idea, not the code.` | `grep -n` |
| Command text | occam `plugin/tools/audit.py` | 38 | `for key in ("command", "file_path", "pattern", "url", "query", "description", "prompt"):` | `grep -n` |
| 70 characters | same | 40 | `return re.sub(r"\s+", " ", str(inp[key]))[:70]` | `grep -n` |
| Top default | same | 102 | `ap.add_argument("--top", type=int, default=10)` | `grep -n` |
| Price table | same | 16 | `(platform.claude.com pricing, Sep 2026)` | `grep -n`; prices themselves unverified |
| Measure section | `context-economy/SKILL.md` | 160 | `## Measure, do not estimate` | `grep -n` |
| Rule 1 | same | 34 | `## Rule 1: read the slice, not the file` | `grep -n` |
| No re-read | same | 45 | `Do not re-read a file to verify an edit you just made.` | `grep -n` |
| Rule 5 | same | 109 | `## Rule 5: isolate high-volume work behind a summary` | `grep -n` |
| Rerun | `rerun-before-verdict/SKILL.md` | 3 | `No verdict from a single uncontrolled run.` | `grep -n` |
| Norms cap | `NORMS.md` | 8 | `Cap: at most six norms (R-19)` | `grep -n` |
| Vendor door | `DECISIONS.md` | 286 | `## 2026-08-10 Vendor skill packs are machine-local` | `grep -n` |
| Fork door | same | 305 | `Third-party material the library does adopt is forked properly instead, with` | `grep -n` |
| Domain door | same | 226 | `## 2026-09-14 Domain skill packs install per project, stripped` | `grep -n` |
| Fire counts | `FIRE_LOG.jsonl` | n/a | 128 lines; `context-economy` 0; `earn-every-line` 0; `cross-agent-review` 44 | `grep -c` |
| Benchmark figures | occam `bench/results/*.jsonl` | n/a | geomeans and failures as stated above | two scratch scripts over the raw files, run 2026-09-29 |
| Hook ran | scratch debug log, not kept | n/a | `Hook SessionStart:startup (SessionStart) success:\nOCCAM MODE (full).` | `claude -p --debug-file`, `Select-String` |
| Env reaches hook | three scratch sessions, not kept | n/a | full / lite / `NONE`, recon control present in each | `claude -p` from each project directory |
| Baseline | this machine's transcripts | n/a | figures as stated above | `python audit.py --days 7 --top 0`, 2026-09-29 |
