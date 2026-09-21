# Handover — the red CI streak, a shared-checkout incident, and the loose ends closed (2026-09-21)

**Diagnoses in this note are unverified unless marked.**

**Context reading: none — `/context` is unavailable in this harness** (desktop Code tab; the
2026-09-16 note records the same gap). No figure is estimated. The band decision was made from
the harness's own signals instead: no compaction warning and no summarisation reminder arrived
during this session, so the wrap-up is deliberate rather than forced.

## 1. Session goal

Review the 2026-09-16 handover and the "several red smokes" visible on git. Both done, and the
review turned into a fix: CI had been red for eight consecutive runs and is now green, with the
green verified rather than assumed.

## 2. Branch and worktree

`main`, standard checkout at `C:\Users\ben\.claude\skills`. Level with `origin/main` at
`caf7deb`, working tree clean. **verified** — `git status -sb`, `git ls-remote`.

**A second worktree exists and is not this session's:** `C:\Users\ben\Projects\claude-skills-wt`
on branch `wt/session-b`, at `4e9bb96`, clean, with **0 commits unique to it** (`git rev-list
--count main..wt/session-b` = 0). **verified.** Nothing to merge. It was left in place
deliberately — see §7.

**Read §9 before doing anything in a second window.** This session lost forty minutes of
verified work to a sibling session, and the mechanism is still present.

## 3. What landed

Four commits, all pushed, plus one force-push. Verified means a command was run and its output
read this session.

| sha | What | Status |
|---|---|---|
| `681b5a1` | Three win32 suites skip loudly off win32; every powershell spawn checks `r.error` and exits 2; the crashing state read made defensive; `hooks-windows` job added | **verified** — SKIP path proved by simulating a Linux platform; FATAL path proved by mutation (`powershell` → `powershell-absent`, exit 2), then reverted |
| `0fbe3ca` | `docs/REVIEW_red-ci_2026-09-21.md`, and `LESSONS_LEARNED.md` entry 20 | **verified** — review cross-checked item by item against live state |
| `e0736f6` | `-ConfigFile` parameter on `watchdog-network.ps1`; the suite supplies its own recipient config | **verified** — 16/16 with `USERPROFILE` emptied, which was 14/16 before; control 16/16; live script runs identically with no new args |
| `caf7deb` | `synced/` ignored; actions `v4`→`v7`; `node-version` `20`→`24`; two `DECISIONS.md` entries | **verified** — CI green on the new runtime, `check-ignore` confirms, kept-in-step test still passes |
| force-push | `b47e020` removed from public `origin/main`, on the owner's explicit authorisation | **verified** — `git ls-remote` returns `4e9bb96`; no branch contains it. **And its limit is verified too: `gh api` still returns the commit by SHA.** Off the branch, not unpublished. |

CI run `35618849412`: **all four jobs green**, and the Windows job **executed** rather than
passing by doing nothing — `discovered 2`, then `16/16` and `15/15`. **verified** from the full
log. Node 20 deprecation warnings: **0**. Last green before this session: 2026-09-16.

`LESSONS_LEARNED.md` now has **21** entries (20 and 21 added). Library remains at **46 skills**.

## 4. In flight

Nothing. Working tree clean, everything committed and pushed.

## 5. Deferred items

Both carry a grep anchor at the place the work lands, per `flag-deferred-items`. **verified** —
both anchors grepped after planting.

- **`relay-cli-takeover` has no automated win32 coverage.** Anchor:
  `hooks/relay-cli-takeover.test.mjs:34`, `FORWARD:`. It is excluded from `hooks-windows` and
  carries no `@win32-only` marker because its case 3 points the launcher at `wininit.exe` and
  relies on the account being unable to kill it — but hosted Windows runners are **elevated**
  and the launcher's kill is a real `taskkill /T /F` (`hooks/relay-cli-fire.ps1:186`,
  **verified**). Gating case 3 behind an `IsInRole(Administrators)` check that skips loudly is
  what would make it runner-safe. Deliberately not attempted at session end: it is unverifiable
  locally, and the failure mode is force-killing a system process.
- **`parallel-work-recon` needs two rules it does not have.** Anchor:
  `parallel-work-recon/SKILL.md:78`, `FORWARD:`. That a junction or symlink is not a second
  working copy, and that commit-early is the mitigation when a start-up recon is what you are
  standing on. Derived from entry 21; a candidate amendment, not a new skill.

## 6. Verification still outstanding

- **The `hooks-windows` job has one green run, not a history.** It passed on `windows-latest`
  twice (`35616808642`, `35618849412`). Hosted-runner behaviour can drift — the alert-path
  defect in `e0736f6` is exactly what a first real run surfaces. Watch the next few.
- **The v7 action bump and Node 24 have one green run each.** Local runs cannot verify the
  runner image; CI is the only check and it passed. If anything odd appears, `caf7deb` is the
  commit to look at and reverting the pins is a two-line change.

Nothing else. The items the 2026-09-16 note left outstanding were all either resolved this
session or are owner-actions listed in §8.

## 7. Blockers and open questions

None blocking. Four things awaiting someone other than the next session.

- **`b47e020` is off the branch but still retrievable from GitHub by SHA.** **verified** by
  `gh api`. Force-pushing does not unpublish, and forks, caches and indexers may already hold
  it. Treat the content as disclosed and handle that where the underlying matter is recorded —
  it is deliberately not described in this repository.
- **The `wt/session-b` worktree is a live parallel-work surface.** Clean, no unique commits, so
  safe to remove with `git worktree remove C:/Users/ben/Projects/claude-skills-wt` and
  `git branch -d wt/session-b`. **Deliberately not removed:** deleting another session's
  workspace is the same class of action that caused this session's data loss, and it is not
  mine to do unilaterally. Removing it would reduce the hazard in §9 to one path.
- **The settings backup is now safe to delete.** `~/.claude/settings.json.bak-1789557391933`,
  dated 2026-09-16. The 2026-09-16 note said to delete it once the push gate was confirmed; the
  gate is now confirmed (§8, and the Supersession note below). Left in place because it is a
  file outside the repo and deletion is irreversible:
  `Remove-Item '~/.claude/settings.json.bak-1789557391933'`.
- **Six items from the 2026-09-16 note are the owner's, not the next session's.** All
  re-verified as still open this session (**verified** by grep/ls, not carried forward on
  trust): the `working-lean` upload and its eval-query results (7, 11 and 2), which zip shape
  claude.ai accepts, the unratified description-budget gate, the blank-page bug's upstream
  cause, and whether a marketplace plugin install puts hooks under `~/.claude/plugins/cache`.
  Detail and anchors in `docs/REVIEW_red-ci_2026-09-21.md` §4c.

## 8. Next actions

1. **Read §9 first if a second session or window is going to touch this repo.** One session per
   working copy; the junction makes two paths look like two checkouts and they are not.
2. Decide whether to remove the `wt/session-b` worktree (§7). One command, and it closes the
   remaining shared-copy surface.
3. Delete the settings backup (§7). One command, now unblocked.
4. Watch the next two or three CI runs for `hooks-windows` and the v7/Node-24 pins (§6).
5. Pick up the owner-items in §7 when convenient — the `working-lean` eval results are the
   only ones gating anything.
6. Optional: the `relay-cli-takeover` admin gate (§5), if automated win32 coverage of the
   launcher is wanted.

## 9. Traps and working agreements

Everything here that changes future behaviour has been promoted already: `LESSONS_LEARNED.md`
entries **20** and **21**, two `DECISIONS.md` entries dated 2026-09-21, and two `FORWARD:`
anchors. What follows is what a session working in this repo needs in hand.

- **`C:\Users\ben\.claude\skills` and `C:\Users\ben\.claude\projects\Unslop\claude-skills` are
  ONE working copy.** The second is a directory junction onto the first. **verified** —
  `fsutil reparsepoint query`, and `git rev-parse --absolute-git-dir` returns the identical git
  directory from both. A `reset --hard` in a session at either path destroys uncommitted work at
  the other, with no trace in `reflog` or `fsck --unreachable`. **Commit early**; the commit is
  the unit of safety, not the file save. Entry 21.
- **A session-start `git status` had a half-life of minutes here, not hours.** It was accurate
  when taken and silently wrong when relied upon forty minutes later.
- **Reading `gh run view --log-failed | tail` undercounted the failing suites.** It truncated the
  third, and the wrong count reached a workflow comment before the full log was read. Read the
  whole log and grep every `PASS|FAIL` verdict.
- **Two grep-based discovery drafts silently selected the wrong test suites.** One returned the
  right *count*, so a count-only guard passed while the job would have run the wrong tests; the
  other matched the file whose comment merely explained the marker. Prose about a marker is not a
  marker. Discovery greps are anchored (`^// @win32-only`) and the set is printed and read.
- **A green job that ran nothing looks exactly like a green job that passed.** Both CI runs were
  checked for `discovered 2` and real pass counts before the green was believed.
- **`env PATH=/nonexistent` does not test a missing interpreter on Windows** — it removes `node`
  too. Mutate the binary name in the source instead, then revert and re-run.
- **This session's permission mode auto-approves and masks an `ask`.** A permission gate cannot
  be tested by performing the action; drive the hook directly with the stdin it expects.
- **`git config user.email` is unset on this machine**, so git guesses from the domain-joined
  host and lands on the work address, which 115 of 188 commits already use. Not a new
  disclosure, and consistent with the repo. Left alone.
- **`.gitignore`'s kept-in-step assertion is one-directional.** It checks that every `VENDOR`
  member has a `.gitignore` line, not the converse, so an extra ignore entry such as `synced/`
  is safe and needs no `VENDOR` change. Checked before relying on it.

## Supersession

`docs/HANDOVER_context-economy_2026-09-16.md` §6 records as outstanding: "**The widened matcher
has not been observed firing** … First action next session: issue a `git push` through the
PowerShell tool and confirm the prompt appears." That item was carried forward twice.

**It is closed.** The gate was driven directly with the stdin a real push produces and returns
`permissionDecision: "ask"` under **both** `tool_name: Bash` and `tool_name: PowerShell`, so the
widened `Bash|PowerShell` matcher works. **verified.** What is *not* proven is a prompt reaching
the operator, because this session's permission mode auto-approves — which is precisely what the
2026-09-16 note predicted would happen, and why performing a push was never going to settle it.
The decision logic is proven, the wiring is in `~/.claude/settings.json`, and
`check-index.test.mjs` asserts the wiring. That section of the 2026-09-16 note is superseded,
and its dependent instruction to delete the settings backup is now unblocked (§7).

The same note's §4 ("Nothing half-written. The working tree is clean.") was true when written and
is superseded by events rather than by this session: see §9 on why that claim has a short shelf
life on a shared working copy.
