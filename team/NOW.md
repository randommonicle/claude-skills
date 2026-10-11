# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-12 00:15 BST, session end (Unslop session; context 39%, green). Diagnoses in this note are unverified unless marked
topic: Haiku 5.5 review, fork licences, ~/.agents/skills refresh, Cloudflare pack review and reinstall, vendor precedence rule (PRs #20 to #22)
next: on or after 2026-10-16, the second Occam read (DECISIONS 2026-10-09). Separately, a passive income session merges team-loop/pilot-setup, records ASK-0009 (a) there, then deletes the item
branches: main; docs/now-session-end until merged (this note only)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- main 4f64d66 (PR #20): Haiku 5.5 price-step and effort traps in commission-the-roster; tier policy unchanged. verified: merged, four checks green
- main ecd0200 (PR #21): hooks/check-licences.mjs, LICENSE files in the unslop forks, their 36 Reddit quotes paraphrased, legal upstream check, LESSONS 41, the Cloudflare review. verified: merged, four checks green; the gate red on the pre-fix tree, green after
- main 547114e (PR #22): DECISIONS 2026-10-12, library guardrails outrank vendor-skill examples, and the reinstall record. verified: merged, four checks green; ~/.claude/skills and ~/.agents/skills fast-forwarded to it
- Machine: library agents in ~/.claude/agents (verified, cmp); ~/.agents/skills reset to origin/main, backup ~/.agents/skills-backup-2026-10-12 (verified, diff); 13 Cloudflare skills replaced from c430dd9 in both copies, backups *-vendor-backup-2026-10-12 (verified, diff -rq)

## In flight

- Nothing running. ASK-0009's item stays on the board until passive income records the decision
- ~/.agents/skills is pulled by hand after each merge; modified files there mean the Codex app imported again
- Not done, on purpose: the four Cloudflare skills new upstream (basin, k2, nextjs-on-cloudflare, workers-profiling; each needs the three VENDOR sites); a NORMS line for the precedence rule (offered, not taken up)

## Deferred, with grep anchors

- `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md section 9
- Unpinned agents: debugger, refactorer (this machine's ~/.claude/agents); PropOS backend, frontend, test. Accepted Low: a broad test-class glob in gate.json widens TESTS CHANGED (docs/REVIEW_team-loop-fixes_2026-10-04.md)

## Verification outstanding

- A Codex session on the refreshed ~/.agents/skills; a full re-sweep of the reinstalled Cloudflare pack (string re-check only); the board page in Ben's own browser; tl-builder worktree isolation; worktree.baseRef "head" with a remote (design 5.4)

## Traps

- A direct push to main is refused; write NOW.md's next line so it stays true after the merge
- Auto-merge did not fire on PR #21 with all four checks green; merged by hand (cause unverified)
- `git -C <clone> worktree add <relative path>` resolves against the clone; worktrees live at ~/.claude/skills-wt-<name> (LESSONS 40)
- A failing gate run deletes that package's tested ref, even a probe run under its id: re-gate before merging
- A scheduled desktop task runs in its creating session's folder and stalls on a write outside it; mobile push is off, so reach Ben by email or the board
- agy seats: forbid every command, git included. Heredocs and node -e eat backslashes: write regex-bearing files with the Write or Edit tool
- Take clock times from PowerShell Get-Date, never an estimate
