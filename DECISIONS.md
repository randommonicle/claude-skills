# Decisions

Standing decisions about the library that are not derivable from the code or
the git history. Newest first. Lessons live in LESSONS_LEARNED.md; this file
records choices, with enough of the why that a later session does not
relitigate them.

## 2026-09-21 A suite that needs an interpreter declares it, and runs where it exists

A suite driving a `.ps1` script cannot run on a Linux runner. Three did anyway and
`main` was red for eight consecutive runs while every suite passed on the
maintainer's machine. The standing shape, so this is not relitigated:

A win32-only suite carries `// @win32-only` at the start of a comment line, skips
loudly off win32 with a second line saying "not a pass", and exits 0. The
`hooks-windows` job discovers suites by that anchored marker and runs them for
real. A bare-substring grep is not acceptable discovery: two drafts silently
selected the wrong set, one of them returning the right count so a count guard
passed, and the second matching a file whose comment merely *explained* the marker.
Prose about a marker is not a marker.

Every powershell spawn in such a suite checks `spawnSync`'s `error` and exits **2**.
Exit 1 stays "the thing under test decided wrongly" and 2 means "the harness could
not run", because conflating them is what turned one missing interpreter into
fifteen reported logic failures.

A suite only goes in that job if every side effect is suppressed. `relay-cli-takeover`
does not: its case 3 points the launcher at `wininit.exe` and relies on the account
being unable to kill it, while hosted Windows runners are elevated and the kill is a
real `taskkill /T /F`. It keeps the skip, carries no marker, and a `FORWARD:` note in
the file records that gating case 3 behind an `IsInRole(Administrators)` check is
what would make it runner-safe. Its win32 coverage is manual until then.

Anything the alert or notification path needs is a **parameter**, not a read of
`$env:USERPROFILE`. The recipient config was hardcoded, so two cases passed on one
machine and failed the first time they ran anywhere else. `-ConfigFile` defaults to
the previous expression, so the scheduled task is unaffected.

## 2026-09-21 The claude.ai skill-sync cache is ignored, and is not a VENDOR member

`synced/` is written by the desktop app: a `<orgId>_<userId>` bucket holding the
anthropic-example skills and a manifest, 222 files. Same rule as the vendor packs
(2026-08-10): not this library's content, so never committed, indexed or counted.

It is **not** added to the `VENDOR` sets in `check-index.mjs` and `audit-fires.mjs`.
Those count top-level directories holding a `SKILL.md`, and this one's skills are
nested a level down, so the index gate never sees it — it reports 46 and passes with
`synced/` on disk. Adding it there would assert a collision that does not exist.
The `.gitignore` entry stands alone with a comment saying so, and the kept-in-step
test is unaffected because it asserts VENDOR members have a `.gitignore` line, not
the converse.

## 2026-09-20 The secret-echo guard is a deny from its first day, not a warn promoted later

`hooks/secret-echo-guard.mjs` denies a command whose output would carry a secret
value (a fallback expansion or print of a secret-named variable, an environment
listing, a `.env` read, a bare `supabase status`, a verbose curl with an
`Authorization` header, and the Read tool on `.env`) and hands back the safe form
in the reason. The library's own path for a command gate is warn-and-log first,
promote on evidence (the sql-surgery row in HOOKS.md). This one skips that step.

Why. The evidence the promotion clause waits for already existed before the hook
was written: two incidents in two days, both routine checks by an agent (a Sonnet
verification agent's bare `npx supabase status` on 2026-09-18; the main
session's `${X:-unset}` loop over `SUPABASE_*` names on 2026-09-19, which put an
account-wide personal access token and another project's service-role key in the
transcript, ICC L-045). And a warn cannot do the job here at all: in a
bypass-permissions session an `ask` is auto-approved and its reason reaches
nobody, and `additionalContext` arrives after the value has already landed; only
a deny stops the output before it exists, and the reason still reaches the model
so the rewrite is one retry. The false-positive cost is bounded by the same
mechanism: the command set is six shapes that print a value and never one that
only uses it, the prescribed presence-and-length form is a green case in the
hook's own suite, and a denied command is rewritten from the reason, not
abandoned. What the hook cannot see (a value copied to another variable and
printed, a script printing `process.env` from its own source, an API response
returning a credential) stays with the `secrets-in-output` skill, which routes
from `context-economy`. Both incident commands are the first two deny cases in
`hooks/secret-echo-guard.test.mjs`.

## 2026-09-15 A seat_turns divergence is recorded with a warning, never refused, never retried

`run-seat.mjs` records two counts in each section's metadata: `seat_turns`, the
CLI's own count of turns on the thread (`num_turns` in the agy envelope; `-`
for codex, whose events carry none), and `file_turns`, the sections this file
holds for that seat. When they differ, a turn happened that the record never
received, a kill or a timeout after the seat had already advanced its history,
and a resume carries it.

The section is still appended. Beside it go both counts in the metadata, a
visible `> **[transport] ... recorded with a warning**` line under the
terminator naming them and what they mean, and `ANSWERED ... WARNING` on
stdout with exit 0. Nothing is retried and no thread is reset by the script.

Why record rather than refuse: by the time the counts can be compared the
reply's temporary file is already unlinked, so refusing the section destroys
the only copy of an answer the operator paid for (78,000 to 93,000 input
tokens a turn on the agy seat), over a fact about the thread rather than the
reply. Recording keeps the answer and states the provenance doubt where a
reader will meet it. Why no retry: the script formats one requested turn and
decides neither when a seat speaks nor what it is asked; reset versus resume
belongs to the operator. Both seats of the 2026-09-15 cross-agent review first
argued for refusal and conceded on this reasoning. Measured before building:
`num_turns` counts conversation turns, not model steps (1 on a tool-using
start, 2 after one resume). Landed in `d329385`.

## 2026-09-15 A pre-flight refusal writes nothing to the exchange file

`run-seat.mjs` refuses with exit 2 and a reason on stderr, and appends nothing,
when the configuration or the invocation is wrong: no open round, a seat that
already answered, a missing or malformed template, a bad `promptVia`, a prompt
over the argv budget. Only a seat that was actually spawned and did not answer
gets the visible `> **[transport] ... did not complete**` note.

Why: LESSONS_LEARNED 13 separates "the seat was never asked" from "the seat
had nothing to add". A pre-flight refusal IS never asked, and the file says
exactly that: round open, no section, no note. The process that ran the
command holds the reason. A note here would also fire on the double-turn
refusal and record a failure against a round already answered, and would fill
the shared transcript with the operator's config typos. A caller that runs the
script unattended and ignores exit codes has a caller bug, not a transport
gap. Argued in the 2026-09-15 cross-agent review (GPT proposed the note and
conceded).

## 2026-09-15 A CLI seat gets its prompt by exactly one channel, refused at pre-flight

`cross-agent-review/scripts/run-seat.mjs` composes the prompt for a headless
seat and hands it over either on stdin (`promptVia: "stdin"`, the codex shape)
or on argv through a `{prompt}` placeholder in the seat's template (`promptVia:
"argv"`, the agy shape). The channel is resolved once (`cfg.promptVia ??
"argv"`), must be exactly one of those two strings, and that one value drives
the guard, the argv budget check and the spawn. The script refuses, with exit
2 and a message naming the seat and the template, before it spawns anything
and before `--dry-run` prints anything, when:

- `promptVia` is any other value, since the old guard treated it as stdin and
  the spawn treated it as not-stdin, and the seat received no prompt at all;
- a template element is not a string;
- an argv seat's `start` or `continue` template has `{prompt}` any number of
  times other than exactly one: none and the seat never receives the prompt,
  two and it receives the prompt twice (or once plus a literal placeholder when
  both are in one element);
- a stdin seat's template has one, since the prompt would go by two channels.

Both templates are checked at every turn, not only the active one. They are
static config, so a `continue` template that would be refused at round 2 is
refused before round 1 is paid for.

Why a refusal rather than a warning or a default: the failure this guards
against is silent. On 2026-09-15 the shipped script substituted every
placeholder except `{prompt}`, the agy seat was handed the literal string
`{prompt}` as its whole prompt, spent 73,030 input tokens on it, and the
transport recorded an honest "did not complete" that was read as "slow". A
seat that cannot receive its prompt must fail loudly and cost nothing. Why
before `--dry-run`: a dry run that prints a prompt for a seat that could never
be invoked is false assurance. Why not the `ARGV_BUDGET` check too: seeing an
over-long prompt is what a dry run is for, so that one stays after it.

The substitution is one regex pass over the five placeholders with a function
on the right: each is replaced once from a fixed table, an inserted value is
never re-scanned, and no `$&` or `$1` inside the prompt is interpreted. Chained
replaces re-scanned each inserted value, so a thread id of `{prompt}` read
from the exchange file (untrusted material, by the protocol's own framing)
expanded into the whole prompt as the `--conversation` argument.
`run-seat.test.mjs` holds a case for each clause (`64871d5`, `738c872`,
`e440365`); LESSONS_LEARNED 16 has the history and the 2026-09-15 cross-agent
review (`docs/REVIEW_run-seat-guards_2026-09-15.md`) the argument.

## 2026-09-14 Domain skill packs install per project, stripped

The 2026-08-10 entry gives third-party material two doors: vendor pack
(machine-local, never committed) or proper fork with `UPSTREAM.md`. A domain
pack such as `coreyhaines31/marketingskills` (50 skills, MIT) fits neither.
It is not a guardrail and has no cross-repo recurrence, so it fails the
library's admission rule; and it is not a machine-local vendor tool, because
the repos that do marketing need it committed and synced between machines.
Installing it user-level would put roughly 9k tokens of trigger text into
every session, including regulated PropOS work.

Third door: a domain pack installs into `.claude/skills/` of each repo that
does the work, as a stripped subset, with an `UPSTREAM.md` pinning the
commit and listing every cut, and the upstream licence beside it. Never
user-level, never into this library, never indexed or counted here. The
installer is `hooks/install-marketing-pack.mjs` (keep list, pin, and cuts
in one place; idempotent; refuses foreign same-named directories) and
`docs/REVIEW_marketingskills_2026-09-14.md` records why the subset is what
it is. Two library skills stand in front of the pack in every target repo's
CLAUDE.md: `unslop-text` as the final pass on its copy, and
`substantiate-outward-claims` on any customer-facing claim.

The pack installs into the repo, even where sessions launch from outside it
(1f916: sessions run from the non-git parent folder). A session's opening
listing is built from the `.claude/skills/` of the directory it launched
in, plus the user level; nothing below the launch directory is in it. So
from that parent folder the pack is reached through a directory junction,
`<parent>\.claude\skills` to `society\.claude\skills` (`mklink /J`, once
per machine, command in `society/CLAUDE.md`), and the callable names are
the bare ones (`seo-audit`, `pricing`), which is what the two 1f916 test
sessions of 2026-09-14 opened with (98 skills, pack unscoped) and invoked.

**This paragraph was written three times on 2026-09-14, and the second
version was wrong.** `2bb59bc` said the harness never reaches a
subdirectory and prescribed the junction. `40fc7e4` said it does, by path
scope, and removed the junction, citing a listing of all 14 as
`society:ai-seo` and so on (transcript `2ee45744`, line 148). That line is
real and was captured mid-session: a `dynamic_skill` event at 20:13:18Z,
in the second after a `Write` under `society/`, with the junction still in
place. The twin session `df64a87c` made the same kind of `Write` and got
no such event, and the first fresh parent-folder session without the
junction (`57894514`, 21:22Z) listed none of the pack and was refused
`Unknown skill: society:seo-audit`. The junction went back at 21:31Z.
Subdirectory discovery therefore exists, is lazy, fired in one of two like
cases, and is not relied on; expect a session that touches `society/`
files to list the pack a second time as `society:*`. LESSONS 14.

Two further observations, recorded as observations. A skill directory that
appears at the launch directory mid-session can be picked up: after the
junction was recreated, the stale session `57894514` loaded bare
`seo-audit` (21:34Z) although its opening listing had none of the pack.
And `change_directory` did not rebuild the listing, twice: the two icc-site test
sessions launched in a stub folder with no `.claude/skills/`, switched to
the real repo mid-session, and were refused before and after the switch;
the "installed mid-session" account of those refusals in `40fc7e4` was
wrong, the pack had been on disk 44 minutes before they started. The safe
practice is unchanged, launch in the directory whose skills you need and
use a fresh session, but it is practice, not a harness rule. LESSONS 13
(corrected) and 14.

## 2026-08-10 Vendor skill packs are machine-local

Third-party skill packs installed beside the library in `~/.claude/skills`
(today that is the Cloudflare pack: agents-sdk, cloudflare,
cloudflare-email-service, cloudflare-one, cloudflare-one-migrations,
durable-objects, sandbox-migrate-to-next, sandbox-next, sandbox-stable,
turnstile-spin, web-perf, workers-best-practices, wrangler) are never
committed, indexed, or counted. They are not the maintainer's content, they
are not committee-ratified guardrails, and committing them would make the
`ash` plugin redistribute someone else's material. Each machine reinstalls
them from their own source instead.

The Anthropic built-ins already followed this pattern via the `BUILTINS` set
in the gate scripts. Vendor packs get the same treatment via a `VENDOR` set,
stated in three kept-in-step sites: `hooks/check-index.mjs`,
`hooks/audit-fires.mjs`, and the vendor block in `.gitignore`.
`check-index.test.mjs` asserts all three agree, so adding a fourteenth vendor
skill to one site and not the others goes red in CI.

Third-party material the library does adopt is forked properly instead, with
an `UPSTREAM.md` recording provenance and local patches, as the three
`unslop-*` skills do.
