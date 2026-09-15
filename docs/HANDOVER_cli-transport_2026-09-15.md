# Handover: 2026-09-15, clone reconciliation → CLI transport for cross-agent-review

Diagnoses in this note are unverified unless marked.

**Wrap-up context reading: 60% — YELLOW band. Operator-supplied, not model-measured.**

The model cannot invoke `/context` in the Claude Code desktop app, so the note was first
written with "no reading — /context unavailable in this harness" verbatim, per the skill's
rule for that case. The operator then read `/context` and supplied 60%, which is a real
reading and replaces the gap. Recording the provenance because the distinction matters: a
figure the operator read is a measurement, a figure the model inferred from a token budget
would have been an invention, and only one of those is worth acting on.

At yellow the rule is: mention the reading, keep commits small with explicit scope cuts. No
new work unit was started after this point. The session ended on the operator's instruction,
not on a band — amber (65%) was never reached.

## 1. Session goal

Started as "check the skills repo for updates and update local". Became: reconcile a
two-clone drift, mechanise the update so it cannot recur, then design and build a way for
Claude to drive Antigravity and GPT directly with no prompt pasting.

## 2. Branch and worktree

`main`, at `C:\Users\ben\.claude\skills` — which as of today is **the only clone**, and is
simultaneously the live skills install and the working copy. The old working-copy path
`...\projects\Unslop\claude-skills` is now a directory junction into it. Both names are the
same files. Everything pushed; tree clean at `31501ef`.

## 3. What landed

All on `origin/main`, verified by `git ls-remote` after each push.

| sha | what | status |
|---|---|---|
| `65a8364` | `update-skills.mjs` unattended fast-forward + `session-recon` health line | **verified** — ridden, and the scheduled task proven to execute from a deleted status file |
| `ca90c92` | cross-agent-review `[[END …]]` section terminator | **verified** — shipped regex run against a synthetic file |
| `09580fd` | one message per refusal state; fixture arrays de-coupled | **verified** — mutation-checked |
| `0cbd013` | HOOKS.md carries the scheduler command actually run | **verified** |
| `1ec143f` `e66f9d0` `ccdeb2a` | agent-bus design note + two rounds of step-0 corrections | **verified** — every field path re-derived by real invocation |
| `2a0749b` | adversarial review of the design, with per-finding verification status | **verified** — 3 findings re-derived by running the CLIs |
| `fbef00e` | token floors corrected (no-tool floors understate a real turn 3–9×) | **verified** — measured |
| `2b67ab0` | **CLI transport**, GPT seat | **verified** — ridden end to end |
| `9baee61` | agy seat, envelope output shape, argv guard, `cwd` passthrough | **partly verified** — see §4 |
| `faca163` | agy seat relabelled configured-not-proven | **verified** |
| `31501ef` | portable paths in the agy settings template | **verified** — all five paths checked to exist |

Also done, outside the repo: the two clones reconciled into one (junction verified, duplicate
removed, fire log intact), and a Windows scheduled task **"claude-skills update"** registered,
daily 06:30, proven to execute.

## 4. In flight

**The GEMPRO (agy) seat is configured but has never completed a review turn.**
`cross-agent-review/templates/seats.example.jsonc` — the GEMPRO block, and its header
comment says so. A trivial task (read one named file, return a token) completes in 40s for
27,320 input tokens. A real review turn through `run-seat.mjs` was **still in progress at a
150s print-timeout after 73,030 input tokens** and produced no section. *Unverified:* whether
a longer timeout finishes it. The turn was mid-flight rather than stuck, which is why this
is "untested" and not "will not work".

`cross-agent-review/scripts/run-seat.mjs:1-320` is complete and green at 20 cases. Nothing
half-written.

## 5. Deferred items

- **`transport: bus` option for cross-agent-review** — anchor at
  `docs/DESIGN_agent-bus_2026-09-15.md:381`, the only `FORWARD` planted today.
- **agent-bus roster, degradation ladder and budget instrument** — dropped with the bus
  design. All three were found unimplementable as specified (REVIEW F6, F13, F7) and are
  recorded in `docs/REVIEW_agent-bus_2026-09-15.md` §4 as candidates for the relay route.
- **`agent-dispatch` one-shot skill** — designed, not built. Name collides with an existing
  third-party project of the same name; rename before building.

## 6. Verification still outstanding

1. **The 300s agy retest.** One run settles viable-but-slow versus not viable for review turns.
2. **The 06:30 scheduled task's first unattended run** (2026-09-16). Should be a no-op
   reporting `current`; `session-recon` will say so at the next session start if it is not.
3. **`lint-after-edit.test.mjs` is red** and was red before this session — the recorded win32
   `resolveBin` issue with its own FORWARD anchor in the test file. Not touched, not mine.
4. **The other machine has none of the per-machine setup**: no `settings.json` for agy, no
   scheduled task. Both are documented but neither travels with a clone.

## 7. Blockers and open questions

- Nothing blocking. The GEMPRO timeout is the only open technical question and it has a
  cheap test.
- **Open decision:** whether to build `agent-dispatch` at all, or let the CLI transport cover
  one-shot use by simply running a single round.

## 8. Next actions

1. Run the agy seat once with `--print-timeout 300s` against the same fixture; record the
   result in the GEMPRO block either way.
2. On the **bengr** machine: copy `cross-agent-review/templates/antigravity-settings.example.json`
   to `%USERPROFILE%\.gemini\antigravity-cli\settings.json`, and register the update task per
   `hooks/HOOKS.md`.
3. Ride the transport on a real target (not a fixture) — a genuine review of a real change
   with the GPT seat, two or three rounds, to see whether the round mechanics hold past round 1.

## 9. Traps and working agreements

- **The CLI state directory is not the IDE's.** `~/.gemini/antigravity-cli/` versus
  `~/.gemini/antigravity/`. Looking in the IDE's for a CLI conversation finds nothing; this
  session briefly concluded from that that CLI conversation state was server-side, which
  would have killed the park-and-resume design on a wrong reading of the right evidence.
- **Absolute paths from this machine are wrong on the other one** (`ben` versus `bengr`,
  43 occurrences in `docs/`). Anything git-tracked uses `%USERPROFILE%`.
- **`status` and exit code both lie on both CLIs.** A print timeout and a permission denial
  each return `status: "SUCCESS"` with an empty reply and exit 0. Empty reply is the only
  honest signal; stderr carries the reason; agy also ships a structured `denied_actions`
  field, but only for denials, never timeouts.
- **Windows: an npm CLI on PATH is a `.cmd` shim** and `spawnSync` cannot execute the
  extensionless POSIX sibling that sits beside it. Cost two failed rides while 13 tests
  stayed green, because every fixture passed an absolute path and skipped resolution.
- **Standing rule that held:** every push this session was asked for and confirmed
  per-action, and verified against `git ls-remote` rather than the push output.

## 10. Promoted, not left here

Per step 4 of the handover skill, the two items that would change future behaviour have
been promoted rather than parked in this note:

- The measured-on-the-easy-case error is recorded in `fbef00e` and `faca163`, at both
  landing points, not only here. **It happened twice in one day from the same instinct** —
  token floors, then agy viability — which makes it a candidate for a LESSONS entry rather
  than two commit messages. *Not yet written: prompt the operator.*
- Everything agy-specific lives in the two template files where a reader will hit it, not
  in this handover.

**skill that should have prevented this: one-real-ride** (green tests passed at three points
where the real CLI failed; the ride caught each). **class:** a fixture that differs from the
real thing in the one dimension the code under test actually branches on — absolute versus
PATH-resolved command, no-tool versus tool-using turn.

## 11. Correction from the bengr machine, 2026-09-15 evening

Written after the desktop app restart that put `agy` on this process's PATH. Every check
in the note above passes here (clone level with `origin/main` at `7de222c`, settings file
present, scheduled task Ready with next run 2026-09-16 06:30, status file `current`,
`session-recon` silent). One finding changes §3, §4, §6 and §8.

**§4 was misread. The GEMPRO seat never received a prompt.** `run-seat.mjs` at `7de222c`
substituted `{thread}`, `{replyFile}`, `{cwd}` and `{sandbox}` into a seat's argv template
and never `{prompt}`, and `run()` delivered the prompt on stdin only. The GEMPRO block is
`promptVia: "argv"` with `-p "{prompt}"`, so agy was handed the eight-character string
`{prompt}` as its entire prompt: no exchange file, no ask, no anti-wander suffix.
**Verified** by driving an echo seat through the unchanged script: argv was
`["-p","{prompt}","--output-format","json","--new-project"]` and stdin was empty. So
"still in progress at the 150s print-timeout after 73,030 input tokens" was agy working
out what `{prompt}` meant. Nothing is yet known about a real review turn on this seat.

The suite was green because the one envelope fixture said `promptVia: 'stdin'` while
listing `{prompt}` on argv, so the argv branch was never exercised. That is §10's class
a fourth time, and LESSONS 15 itself cites the 73,030 figure as a viability measurement
it was not. Also: the suite at `7de222c` has 17 cases, not the 20 stated in §4.

**Landed on this machine as `64871d5`** (push state: `git log origin/main..main`). `{prompt}` substituted last and through
a function, since the prompt is untrusted text and a string replacement would expand `$&`
(`cross-agent-review/scripts/run-seat.mjs:289`); two pre-flight refusals before any spend,
an argv seat with no `{prompt}` in its active template and a stdin seat with one
(`run-seat.mjs:272-278`); the envelope fixture switched to argv; `fake-seat.mjs:33-41`
dumps what arrived on each channel; three new cases (`run-seat.test.mjs:239`, `:257`,
`:272`), each **verified** red on `7de222c` before the fix. 20 cases green.

**Ridden after the fix, verified:** one tool-free turn through `run-seat.mjs` against the
real `agy 1.2.3` with the shipped GEMPRO block unedited, `--cwd` at this repo. ANSWERED
with the exact token in 26.9s, 18,000 input / 199 output tokens, thread id recorded. The
first GEMPRO section the transport has appended. It proves the spawn by PATH name, the
substitution, and the envelope read against the real CLI. It does not prove a review turn.

**§8 revised.** Action 1 (the 300s retest) was going to time the wrong invocation and is
now a meaningful test for the first time; unrun, it is a multi-minute spend. Action 2 is
done on this machine: settings file copied 19:09 BST, task registered 19:05 BST and
proven with `LastTaskResult 0` and a `current` status file. Action 3 unchanged.

**Promoted, not left here:** LESSONS candidate raised with the operator (a fourth instance
of entry 15's third shape, plus entry 15's own second paragraph resting on the misread
figure); DECISIONS candidate raised (the prompt reaches a seat by exactly one channel,
refused at pre-flight).
