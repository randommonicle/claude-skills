# Review — the red CI streak, the 2026-09-16 handover, and a shared-checkout incident (2026-09-21)

**Diagnoses are marked verified where a command was run and its output read.**
**Line numbers in section 2 are anchored to `4e9bb96`**, the commit this review was written
against. The fix in section 8 shifts them; that is expected, and the anchor is stated so a
later reader can re-derive rather than trust.

## 1. Headline

CI was red on `main` for **8 consecutive runs**, 2026-09-17T12:08Z to 2026-09-21T13:20Z. Last
green: 2026-09-16T15:59Z (`2ef7963`, the handover commit).

One job of three. `index` and `archives` were **green** throughout — the drift gates never
stopped working. Only `hooks` failed. **verified** — `gh run view 35605022973 --json jobs`.

All 22 hook suites passed locally on Windows the whole time. **verified** — full loop, 22 PASS.

A platform defect in CI, **not a logic regression**. Nothing shipped since 2026-09-16 was broken
in the way CI claimed. The cost was not a broken library; it was five days without a usable
signal.

## 2. Root cause: three suites, not two

Three suites drive `.ps1` scripts through `powershell` — the Windows-only 5.1 executable, absent
from `ubuntu-latest`, which ships PowerShell 7 as **`pwsh`**:

| suite (at `4e9bb96`) | spawn sites | Linux CI result |
|---|---|---|
| `hooks/watchdog-unattended.test.mjs` | `:34` | `0/15 passed`, every case `got=(none)` |
| `hooks/watchdog-network.test.mjs` | `:33`, `:109`, `:140` | 7 FAIL, then a hard crash at `:84` |
| `hooks/relay-cli-takeover.test.mjs` | `:25`, `:51` | crash |

**verified** — the full log, `gh run view 35605022973 --log`, grepped for every
`PASS|FAIL hooks/*.test.mjs` verdict: three FAIL, nineteen PASS.

`spawnSync` returns `error: ENOENT`, `status: null`, `stdout: null`. No suite inspected
`r.error`; all did `(r.stdout || '') + (r.stderr || '')`, so a missing interpreter became the
empty string and every assertion failed against output that was never produced. **One missing
interpreter was reported as fifteen logic failures** — the `honest-failure-surfacing` defect,
worth fixing on its own terms whatever is decided about platforms.

Three other suites mention powershell only as fixture strings and pass on Linux:
`push-gate-message-bodies`, `push-gate-search-patterns`, `secret-echo-guard`. **verified.**

### 2a. Two crashes that truncated their own runs

`watchdog-network.test.mjs:84` did an unguarded `JSON.parse(readFileSync(f6.state, 'utf8'))`.
The `.ps1` never ran, so the state file was never written, so the suite died at case 9 of 16 and
the last 7 never reported. `relay-cli-takeover` crashed the same way, downstream of reading
output that did not exist. A red run that hides its own cases is worse than one that counts them.

### 2b. A negative pass count (already fixed, no action)

The 2026-09-17 run printed `-1/11 passed`. `watchdog-unattended.test.mjs` at `88405f9`
hardcoded the denominator — an `11 - fails` over `11` — against 12 real check sites. **Fixed**
in `e910901`: `ran - fails` over `ran`, with a comment explaining it. **verified** —
`git show 88405f9:hooks/watchdog-unattended.test.mjs`. Recorded only so the implausible number
in the logs is not re-investigated by the next reader.

## 3. Why this mattered more than one red job

The workflow's own header states why the `hooks` job exists: `lint-after-edit.test.mjs` stubs are
`#!/bin/sh`, so its six "fires" cases **cannot execute on the Windows machine the library is
maintained from**, and "six cases that guard nothing look exactly like six cases that pass."

This was that defect **in mirror image**. The library closed the Windows-cannot-run-sh gap by
adding a Linux job, then opened the Linux-cannot-run-ps1 gap and did not add the matching Windows
job. Second-order cost: a job red for 5 days is not a check. A new breakage arrives into an
already-red badge, indistinguishable from the standing failure, and the two green gates are
buried under an overall red run.

## 4. The handover — `docs/HANDOVER_context-economy_2026-09-16.md`

The note is well made: explicit about what is unverified, honest about the provenance of its own
context reading, separates verified from claimed, carries a Supersession section. The problem is
its **age**, not its quality.

### 4a. It predates everything that went red

It is the newest handover in `docs/`, committed at the last green run. Since then 8 commits
landed (watchdogs, `safe-push`, two relay-cli fixes, the `secret-echo-guard` rebuild), plus the
incident in section 6. **None appears in any handover.** The first watchdog push went red on its
first CI run and the streak was recorded nowhere — not in `DECISIONS.md`, not in
`LESSONS_LEARNED.md`, which ended at entry 19.

### 4b. Claims that had drifted

| Handover claim | Live state | |
|---|---|---|
| "Library is at 45 skills" | **46 skills** | drifted — `node hooks/check-index.mjs`, **verified** |
| "Level with origin/main at `0e32f54`. Nothing unpushed." | `4e9bb96`, behind origin by 1 | see section 6 |
| "Nothing half-written. The working tree is clean." | a discarded incident commit; `synced/` untracked | sections 6 and 5 |

### 4c. Deferred and outstanding items, cross-checked against live state

All **verified** by grep/ls.

| Item | Handover said | Live state |
|---|---|---|
| `working-lean` upload | built, zipped, NOT uploaded; eval run is the gate | **no record either way** |
| Eval queries 7 and 11 (the gates) | live, operator running them | **no result recorded** in `DECISIONS.md` or `LESSONS_LEARNED.md` |
| Query 2 trigger decision | operator's to make from what query 2 did | **not recorded** |
| Which zip shape claude.ai accepts | unknown, record it in `org-skills/README.md` | **still "Which shape, still unconfirmed"**, `org-skills/README.md:71` |
| Push gate firing via the PowerShell tool | "first action next session", carried forward once | **no record**; now carried forward twice |
| The timestamped settings backup | delete once the gate is confirmed | **still present**: `~/.claude/settings.json.bak-1789557391933`, dated 2026-09-16 — corroborating that the gate was never confirmed |
| Description-budget gate | proposed, NOT ratified | **not built**, no gate, no record |
| Blank-page bug upstream cause | unknown, worth asking the other session | **still only the symptom checker** |
| Plugin cache path vs `~/.claude/skills` | unverified, from undocumented recall | **still unverified** |

Of the handover's 6 next actions, **none has a recorded outcome.** Several are one command each.
Item 4, the push gate, is the one the note itself called decisive and twice-deferred.

## 5. `synced/` — untracked and not ignored

222 files, appeared 2026-09-18. The claude.ai skill-sync cache written by the desktop app: bucket
directory named `<orgId>_<userId>`, `manifest.json` listing skills with
`"source": "anthropic-example"`. **verified** — manifest read.

`.gitignore` already carries a "Vendor skill packs: machine-local, reinstalled per machine, never
committed" block of 13 directories, and `DECISIONS.md` (2026-08-10) gives the rule: third-party
packs are never committed, indexed or counted, because committing them would make the `ash`
plugin redistribute someone else's material. `synced/` is that class and is not in the block. One
`git add -A` commits 222 vendor files, including ISO-IEC 29500 `.xsd` schemas and a `.woff2`.

It needs **no** matching `VENDOR` change in `check-index.mjs` / `audit-fires.mjs`: those count
top-level directories holding a `SKILL.md`, and `synced/`'s skills are nested a level down, so
the gate does not see it — `check-index.mjs` reports 46 and passes with `synced/` on disk.
**verified.**

**Left unchanged, flagged only**, at the operator's instruction.

## 6. The shared-checkout incident

Found at 14:43-14:49 while verifying the fix, and it is the largest handover-vs-live drift in
this review.

`C:\Users\ben\.claude\projects\Unslop\claude-skills` is **not a second clone**. It is a directory
junction onto `C:\Users\ben\.claude\skills`. **verified** — `fsutil reparsepoint query` reports
`Substitute Name: \??\C:\Users\ben\.claude\skills`, and `git rev-parse --absolute-git-dir`
returns the identical git directory from both paths. One repository, one working copy, two paths.
(`Get-Item ... LinkTarget` returns blank for a junction under PowerShell 5.1, which is a
limitation of that property, not evidence against the junction.)

Two sessions therefore ran against one working copy. Timeline, all **verified** from reflog,
`ORIG_HEAD` mtime and commit metadata:

| 21 Sep | Event |
|---|---|
| 14:19:45 | `b47e020` committed, then pushed to public `origin/main` |
| 14:27:14 | `f572d88` committed — a revert of the above, never pushed |
| 14:43:15 | `git reset --hard 4e9bb96`, discarding both |

The reset also destroyed this session's uncommitted, already-proved fix. `git fsck --unreachable
--no-reflogs` accounts for every dangling object — four `git stash` WIP commits from 16 September
plus `f572d88` — and holds **nothing** from this session, which is consistent with the loss being
uncommitted and therefore unrecoverable by any means. It was redone from the session transcript.

Both discarded commits concerned an endpoint-security matter on the maintainer's machine. That
matter is recorded in a private location and is **out of scope for this repository**, which is
public and is not where endpoint incidents belong. Nothing about it — including any sanitised
retelling — is reproduced here, and this section deliberately stops at the git mechanics.

`b47e020` was removed from public `origin/main` by force-push on 2026-09-21, on the owner's
explicit authorisation, because the method it documented turned out to be harmful on this machine
and the material did not belong in this repository. Preconditions were re-verified immediately
beforehand: nothing sat above it, and only `origin/main` and `origin/HEAD` contained it.
**verified after the fact**: `git ls-remote origin refs/heads/main` returns `4e9bb96`, and no
branch contains `b47e020`.

**The force-push did not unpublish it, and this was tested rather than assumed.**
`gh api repos/.../commits/b47e0207...` still returns the commit and its message. It is off the
branch; it is not gone, so treat anything it contained as disclosed and handle that where the
matter itself is recorded. The diff carried no client, property, staff or firm data: the only
identifier in it was the commit's own `Author:` line, which every commit in this repo already
carries. **verified** by grepping the diff for firm and client patterns.

One consequence worth keeping: `update-skills` refuses on diverged history and leaves HEAD
untouched (its own suite asserts this). A rewrite of pushed `main` therefore makes the daily
update job on any other install stop silently rather than loudly. Here local `main` was already
at the new tip, so nothing diverged.

## 7. The blocker on the Windows job

> **Superseded later the same day.** The finding below is accurate and is why the suite was
> held back. The remedy it proposes — gating case 3 behind an `IsInRole(Administrators)`
> check — was **not** what shipped, because gating only makes the zero coverage official:
> the case was *already* skipping on the maintainer's non-admin machine, where
> `Get-Process` cannot read `wininit`'s `StartTime`. So it ran nowhere at all. Instead
> `relay-cli-fire.ps1` gained a `-Taskkill` parameter and the suite now manufactures the
> condition with a stub against a victim it starts itself. The case is exercised for the
> first time, the suite carries the marker, and all three run in `hooks-windows`. See
> `DECISIONS.md` 2026-09-21 and `docs/HANDOVER_red-ci_2026-09-21.md`.

`relay-cli-takeover.test.mjs` case 3 ("a victim that cannot be killed") points the launcher at
**`wininit.exe`** and depends on the account being unable to terminate it. Its guard skips only
when that process cannot be **read**, not when it can be **killed**. The launcher's kill is real:
`hooks/relay-cli-fire.ps1:186` runs `taskkill /T /F /PID`. **verified.**

`windows-latest` runs **elevated**, where `wininit` is both readable and killable. Shipping that
suite to the hosted runner would issue a forced tree-kill against a critical system process.

So the Windows job covers **the two watchdog suites only**. `relay-cli-takeover` gets the loud
skip, so the ubuntu job is honest and green, and a `FORWARD:` flag in the file records that its
win32 coverage remains manual until case 3 is gated behind an `IsInRole(Administrators)` check.
An earlier draft of the workflow comment claimed all three were runner-safe. That was false and
is corrected.

## 8. The fix

1. All three suites skip loudly off win32 — two lines, the second saying "not a pass" — and exit
   0. **Proved** by simulating a Linux platform
   (`Object.defineProperty(process,'platform',{value:'linux'})` then dynamic import): all three
   print the SKIP and exit 0.
2. Every powershell spawn routes through a guard that checks `r.error` and exits **2**, distinct
   from the 1 that means the thing under test decided wrongly. **Proved by mutation**:
   `'powershell'` → `'powershell-absent'` produced `FATAL ... ENOENT`, "no case below was
   executed", exit 2; then reverted, 0 residual, 16/16 green again. An earlier attempt using
   `env PATH=/nonexistent` was invalid — it removed `node` itself.
3. `watchdog-network.test.mjs` reads the recovery state file defensively and reports a missing
   file as a failed case instead of killing the run.
4. A `hooks-windows` job on `windows-latest`, bash-shelled so the loop matches the ubuntu one.

**Two failed attempts at discovery, both silent, both caught only by running it:**

- **Draft 1** grepped `spawnSync('powershell'`. It matched `relay-cli-takeover` (which must not
  run there), **missed** `watchdog-unattended` (whose spawn is split across two lines), and
  returned a count of 2 — so a `-lt 2` count guard passed while the job ran the wrong tests.
- **Draft 2** grepped a bare `@win32-only`. That matched `relay-cli-takeover`, whose comment
  *explains why it must not carry the marker*. Prose about a marker is not a marker.

The shipped form anchors to a declaration: `grep -lE '^// @win32-only\b'`, which returns exactly
the two watchdog suites. **verified.** An empty discovery exits 1, because a job that runs no
test and reports green is the precise failure this workflow exists to prevent; that guard was
confirmed to fire by simulating a renamed marker. The converse — a new PowerShell suite that
forgets the marker — needs no check here: it has no skip either, so it goes red on ubuntu.

Since anything discovered by that pattern gets an **elevated** runner, its precision is a safety
property rather than tidiness.

After the fix, on the maintainer's machine: 15/15, 16/16, 11/11, and 22/22 across the whole loop.
Note what that does and does not prove — these suites pass on Windows either way, so the loop is
a regression check, and the SKIP and FATAL proofs above are the evidence that the fix works.

**Not proved here:** that the `hooks-windows` job is green. No local run can establish that. The
first CI run on `windows-latest` is the only evidence, and it is the one-real-ride for this
change.

## 9. Minor

The runner warns Node 20 is deprecated on GitHub Actions; the workflow pins `node-version: '20'`
in all jobs. Unrelated to the red, not urgent, worth a separate pass.
