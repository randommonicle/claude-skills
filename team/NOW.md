# NOW: claude-skills

template: team-loop NOW v1
updated: 2026-10-11 23:30 BST, an Unslop session on Ben's brief: check a Reddit Haiku 5.5 claim against the roster skill, then check the repo and its upstreams
topic: the Haiku 5.5 pricing edits (PR #20); the repo and upstream check's findings wait on Ben, listed under In flight
next: on or after 2026-10-16, read the Occam trial again and decide (DECISIONS 2026-10-09, second week). Before that, Ben's calls on the In flight items from the 2026-10-11 check. Separately, a passive income session merges team-loop/pilot-setup, records ASK-0009 (a) in that repo's DECISIONS.md, then deletes the item
branches: main; docs/haiku-5-5-pricing until merged (worktree ~/.claude/skills-wt-haiku-5-5, remove after the merge)
ask: https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH

## Landed since the last NOW.md

- main 6cf6883 (PR #19): the Occam trial read, a second week, lesson 40; the live library updated to it on 2026-10-11
- This branch: commission-the-roster's two traps (Haiku 5.5's fivefold price step over 100K prompt tokens; effort named in the roster, no low effort on a cheap-tier agent that owns verification); provider-mechanics' Anthropic caching figures re-read for the 5.5 models. Tier policy unchanged

## In flight

- Nothing running. ASK-0009's item stays on the board until passive income records the decision
- Found on 2026-10-11, waiting on Ben, none acted on:
  - unslop-code, unslop-text and unslop-ui ship without the MIT notice their upstream's LICENSE requires, in the repo and in their .skill archives (UPSTREAM.md is not packed), and the README says their UPSTREAM.md records those terms. The same LICENSE excludes "harvested Reddit text" from the grant, and the three tells.md files carry dozens of verbatim, attributed Reddit quotes; the DATA_NOTE.md it points to does not exist upstream
  - ~/.agents/skills is a second clone of this repo at bea30c9 (2026-08-06), 249 commits behind, with CLAUDE.md rewritten to AGENTS.md in 17 tracked files and newer skills copied in untracked; something outside this repo rewrote its team-loop/SKILL.md on 2026-10-11. Nothing here documents it
  - rohasnagpal/legal-ai-skills is 38 commits past our pin (head ad5df19): the forked files moved to plugins/legal-ai-skills/, seven of nine are byte-identical, the other two add tool-dependent sections our forks already cover. UPSTREAM.md paths are stale; nothing to adopt
  - JCarterJohnson/vibecoded-design-tells: identical to our pin
  - this machine's ~/.claude/agents: the four tl- agents are absent; code-reviewer and property-reg-reviewer lack the effort line

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
