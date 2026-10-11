# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-12 00:12 BST, an Unslop session on Ben's "yes to both" (the Cloudflare reinstall and the precedence rule)
topic: library guardrails outrank vendor-skill examples; the Cloudflare pack reinstalled at c430dd9 (PR #22)
next: on or after 2026-10-16, read the Occam trial again and decide (DECISIONS 2026-10-09, second week). Separately, a passive income session merges team-loop/pilot-setup, records ASK-0009 (a) in that repo's DECISIONS.md, then deletes the item
branches: main; docs/vendor-precedence until merged (worktree ~/.claude/skills-wt-vendor-precedence, remove after the merge)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- main 4f64d66 (PR #20): Haiku 5.5 price-step and effort traps; tier policy unchanged
- main ecd0200 (PR #21): fork licences gated (hooks/check-licences.mjs), unslop Reddit quotes paraphrased, legal upstream check, LESSONS 41, the Cloudflare review; ~/.claude/skills and ~/.agents/skills fast-forwarded to it
- This branch: DECISIONS 2026-10-12 (guardrails outrank vendor-skill examples; the reinstall); the review's after-reinstall table
- Machine, on Ben's word: library agents in ~/.claude/agents; ~/.agents/skills reset clean (backup ~/.agents/skills-backup-2026-10-12); the 13 Cloudflare skills replaced from c430dd9 in both copies (backups *-vendor-backup-2026-10-12 beside each)

## In flight

- Nothing running. ASK-0009's item stays on the board until passive income records the decision
- ~/.agents/skills: pull it after each merge until something does it automatically; modified files there mean the Codex app imported again
- Not installed: the four Cloudflare skills new upstream (basin, k2, nextjs-on-cloudflare, workers-profiling); each needs the three VENDOR sites in the same change
- The precedence rule lives only in DECISIONS; a NORMS line would carry it into every session (not asked for)

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
