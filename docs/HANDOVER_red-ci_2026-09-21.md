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

`main`, standard checkout at `~/.claude/skills`. Level with `origin/main`, working tree
clean. **verified** -- `git status -sb`, `git ls-remote`.

**One working copy.** The `wt/session-b` worktree that existed when this note was first
written has been removed along with its branch (section 7). The junction described in
section 9 remains, so two *paths* still reach this one tree.

**Read section 9 before doing anything in a second window.** This session lost forty
minutes of verified work to a sibling session, and the junction that allowed it is still
there.

## 3. What landed

Eight commits, all pushed, plus one force-push. Verified means a command was run and its
output read this session.

| sha | What | Status |
|---|---|---|
| `681b5a1` | Three win32 suites skip loudly off win32; every powershell spawn checks `r.error` and exits 2; the crashing state read made defensive; `hooks-windows` job added | **verified** -- SKIP path proved by simulating a Linux platform; FATAL path proved by mutation (`powershell` to `powershell-absent`, exit 2), then reverted |
| `0fbe3ca` | `docs/REVIEW_red-ci_2026-09-21.md`, `LESSONS_LEARNED.md` entry 20 | **verified** -- cross-checked item by item against live state |
| `e0736f6` | `-ConfigFile` on `watchdog-network.ps1`; the suite supplies its own recipient config | **verified** -- 16/16 with `USERPROFILE` emptied, which was 14/16 before; control 16/16 |
| `caf7deb` | `synced/` ignored; actions v4 to v7; node-version 20 to 24; two `DECISIONS.md` entries | **verified** -- CI green on the new runtime; `check-ignore` confirms; kept-in-step test still passes |
| `b653308` | This note, `LESSONS_LEARNED.md` entry 21, the `parallel-work-recon` FORWARD anchor | **verified** -- every file:line re-derived after the last edit |
| `5eea571` | `-Taskkill` on `relay-cli-fire.ps1`; the unkillable-victim case manufactures its own condition; `@win32-only` marker; workflow and DECISIONS updated | **verified** -- 11 cases to 14; mutation to the real taskkill gives 11/14 "premise broken" |
| `13ae617` | `parallel-work-recon` gains the two rules; FORWARD resolved | **verified** -- index gate unaffected, description untouched |
| `2098640` | The takeover suite supplies `-Repo`; a pre-flight bail is now one harness fault, not nine failures and four vacuous passes | **verified on CI** -- 14/14 on `windows-latest`, having been 5/14 |
| force-push | `b47e020` removed from public `origin/main`, on explicit authorisation | **verified** -- `git ls-remote` returned `4e9bb96`; no branch contains it. **Its limit is verified too:** `gh api` still returns the commit by SHA. Off the branch, not unpublished. |

Final CI run: **all four jobs green**, `discovered 3`, and all three PowerShell suites
executing with real counts -- 14/14, 16/16, 15/15. **verified** from the full log, not the
tail. Node 20 deprecation warnings: **0**. Last green before this session: 2026-09-16.

`LESSONS_LEARNED.md` has **21** entries (20 and 21 added, 20 later amended with the
same-day recurrence). `prove-it-can-fail` gained **rule 10**. Library remains at **46
skills**.

## 4. In flight

Nothing. Working tree clean, everything committed and pushed.

## 5. Deferred items

**None outstanding.** Both items this note originally deferred were closed later the same
day, and their `FORWARD:` anchors removed rather than carried. Recorded here because the
first resolution is not the one this note proposed.

- **`relay-cli-takeover` now has real win32 coverage.** This note proposed gating its
  `wininit` case behind an `IsInRole(Administrators)` check. That was the wrong remedy:
  checking revealed the case was *already* skipping on this non-admin machine, because
  `Get-Process` cannot read `wininit`'s `StartTime` without elevation. It skipped where it
  was developed and would have force-killed a system process where it ran, so it had never
  executed anywhere, and gating would only have made the zero coverage official. Instead
  `relay-cli-fire.ps1` gained a `-Taskkill` parameter (default unchanged, so the scheduled
  task is unaffected) and the suite manufactures the condition with a stub against a victim
  it starts itself. 11 cases became 14, the `@win32-only` marker is on, and all three
  PowerShell suites run in `hooks-windows`. **verified** — 14/14 on `windows-latest`, and a
  mutation to the real taskkill takes it to 11/14 with "premise broken".
- **`parallel-work-recon` gained its two rules.** An alias is not a working copy until
  checked (`git rev-parse --absolute-git-dir` from each path), and commit early whenever
  another session can reach the same tree. Written into the Worktrees and checkouts section;
  the description is untouched so the index gate is unaffected.

## 6. Verification still outstanding

- **The `hooks-windows` job now has four green runs**, the last with all three suites
  executing (14/14, 16/16, 15/15) and `discovered 3`. It found two real defects on its first
  two runs, which is the job working, so keep reading its log rather than its colour.
- **One unproven guard.** `relay-cli-takeover`'s new pre-flight guard — any
  `FAULT ... not found at` is reported once as a harness fault with exit 2 — has **not** been
  shown to fire. The mutation intended to prove it was inconclusive, because the takeover work
  appears to run before the launcher's pre-flight check, so a bad `-Repo` does not bail the
  early cases. Marked unverified deliberately rather than claimed.
- **Local runs of `relay-cli-takeover` are under a moratorium.** It spawns hidden processes
  and executes `.cmd` stubs from PowerShell, plausibly the same Avast `IDP.HELU.PSD11`
  surface that removed seven scheduled tasks from this machine on 2026-09-21. Verify it on
  CI, not here. After this session's runs all seven tasks were confirmed present and `Ready`
  and no stray test processes remained. **verified.**
- **The v7 actions and Node 24 pins** have several green runs now.

## 7. Blockers and open questions

None blocking. Everything this note listed as awaiting action has been resolved except the
owner-only items, which cannot be done from a session.

**Resolved since this note was written:**

- **The `wt/session-b` worktree is gone.** Clean, zero unique commits, so removed along with
  its branch; the directory is off disk. One working copy remains. **verified** —
  `git worktree list`, `git branch -a`.
- **The settings backup is deleted.** Confirmed first to be the pre-widening
  `"matcher": "Bash"` against a live `"matcher": "Bash|PowerShell"`, so its rollback purpose
  was spent. Live settings re-checked afterwards: 1184 bytes, valid JSON, both hooks still
  wired. A copy is in this session's scratchpad. **verified.**
- **The plugin cache path question is answered, with no defect.** Marketplace plugins install
  to `~/.claude/plugins/marketplaces/<marketplace>/plugins/<plugin>/`; there is **no**
  `plugins/cache` directory on this machine. Six official plugins ship a `hooks/` directory
  there, and this library's `hooks/hooks.json` already uses `${CLAUDE_PLUGIN_ROOT}`
  throughout, exactly as they do, so a plugin install needs no `~/.claude/skills` clone. The
  one hardcoded path, `skill-fire-log.mjs` writing to `~/.claude/skills`, is deliberate and
  self-creating with a comment saying "plugin installs don't create this dir". The
  `push-gate.mjs` reference to that path is advisory text in a message, not a code path.
  **verified** by probing the live tree rather than documentation.
- **The description budget is quantified.** **4,090 words across 46 skills** (mean 89, median
  82); the 2026-09-16 note recorded 3,836 across 45. **13 skills exceed** the proposed
  100-word cap, the largest being `unslop-text` at 166. The proposed 3,500 library-wide
  ceiling is exceeded by 17%. **verified.** No gate was built: one would go red immediately on
  13 skills, and the number to ratify is the owner's to pick, not a session's.

**Still open, and owner-only:**

- **`b47e020` remains retrievable from GitHub by SHA** despite the force-push. **verified** by
  `gh api`. Treat anything it contained as disclosed and handle it where that matter is
  recorded; it is deliberately not described in this repository.
- **Four items need someone in claude.ai, not a session**: the `working-lean` upload, its
  eval-query results (7, 11 and 2), which zip shape the console accepts, and the blank-page
  bug's upstream cause, which belongs to another session. All re-verified as still open.
  Anchors in `docs/REVIEW_red-ci_2026-09-21.md` §4c.

## 8. Next actions

1. **Read §9 before a second session or window touches this repo.** One working copy now,
   but the junction still makes two paths look like two checkouts.
2. **Do not run `relay-cli-takeover` locally** (§6). CI covers it.
3. Pick up the owner-only items in §7 when convenient; the `working-lean` eval results are
   the only ones gating anything.
4. If the description budget matters, pick a number from §7's live figures rather than the
   unratified 3,500.
5. Optional: prove `relay-cli-takeover`'s pre-flight guard can fire (§6), on CI.

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
- **Backslashes lose one level through a heredoc into an interpreter in this shell.** It bit
  three times in one session: a .cmd stub's CRLF escapes became real newlines and broke a JS
  module, two regex anchors silently failed to match, and a Windows path in a generator
  aborted on a unicode escape. LESSONS_LEARNED entry 9 already names the class; the sharper
  form is that one level is *stripped* even from a quoted heredoc, so content with escapes
  must not travel that way. Use forward slashes, reuse an existing literal, or edit
  line-wise with no escapes in the match.
- **A generator that asserts before it writes leaves the file untouched on a failed
  assert.** Convenient, but easy to misread as a partial edit: one run reported two
  successful replacements and wrote nothing, because a third assert threw first. Re-grep the
  file rather than trusting the generator's own log.
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
