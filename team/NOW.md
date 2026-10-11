# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-12 00:07 BST, an Unslop session on Ben's "agree to all ... do it all" after the 2026-10-11 repo and upstream check
topic: fork licences gated, unslop Reddit quotes paraphrased, legal upstream check recorded, ~/.agents/skills refreshed, Cloudflare pack reviewed (PR #21)
next: on or after 2026-10-16, read the Occam trial again and decide (DECISIONS 2026-10-09, second week). Ben's two open calls on the Cloudflare pack (In flight). Separately, a passive income session merges team-loop/pilot-setup, records ASK-0009 (a) in that repo's DECISIONS.md, then deletes the item
branches: main; fix/fork-licences until merged (worktree ~/.claude/skills-wt-fork-licences, remove after the merge)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- main 4f64d66 (PR #20): commission-the-roster's Haiku 5.5 price-step and effort traps; provider-mechanics re-read for the 5.5 models; tier policy unchanged (DECISIONS 2026-10-11)
- This branch: LICENSE files in the three unslop forks, bundled into their archives; their 36 Reddit quotes paraphrased; hooks/check-licences.mjs with its suite, in the archives job; the legal forks' Last checked lines; DECISIONS (licences, ~/.agents/skills, the Cloudflare source, Haiku 5.5); LESSONS 41; docs/REVIEW_cloudflare-pack_2026-10-12.md
- Machine, on Ben's word: library agents copied to ~/.claude/agents (all six match); ~/.agents/skills backed up to ~/.agents/skills-backup-2026-10-12 and reset to origin/main with no rewrite (DECISIONS 2026-10-12)

## In flight

- Nothing running. ASK-0009's item stays on the board until passive income records the decision
- Open with Ben: reinstall the Cloudflare pack at upstream head (210 commits newer); and whether to write down that the library's guardrails outrank a vendor skill's examples (docs/REVIEW_cloudflare-pack_2026-10-12.md)
- ~/.agents/skills: pull it after each merge until something does it automatically; modified files there mean the Codex app imported again

## Deferred, with grep anchors

- `FORWARD:` naming `team/INBOX/` in docs/DESIGN_team-loop_2026-10-02.md section 9
- Unpinned agents: debugger, refactorer (this machine's ~/.claude/agents); PropOS backend, frontend, test
- Accepted Low: a broad but not catch-all test-class glob in gate.json widens TESTS CHANGED (docs/REVIEW_team-loop-fixes_2026-10-04.md, CLAUDE close)

## Verification outstanding

- The board page in a real browser since its fixes: stub-DOM tests only; the built-in browser stops at claude.ai's sign-in page, so this needs Ben's own browser. MT5 compile or Tester commands as JUDGED BY lines; harness worktree isolation for a spawned tl-builder; worktree.baseRef "head" against a repo with a remote (design 5.4)

## Traps

- A direct push to main is refused now; write NOW.md's next line so it stays true after the merge
- `git -C <clone> worktree add <relative path>` resolves the path against the clone
- A scheduled desktop task runs in the creating session's folder and stalls on a write outside it
- Mobile push is disabled in this app's config: reach the operator by email or the board
- agy seats: forbid every command in the ask, git included, or one denied command ends the turn empty
- Heredocs and node -e eat backslashes in regexes: use the Edit tool for those edits
- A failing gate run deletes that package's tested ref, even a probe run under its id: re-gate before merging
- Take clock times from PowerShell Get-Date at the moment of writing, never from an estimate
