---
name: parallel-work-recon
description: On any repo worked from multiple machines, sessions, or agents, your knowledge of its state is a snapshot with a short half-life. Run git fetch, gh pr list, and git log --all at session start AND again immediately before committing; claim sequential identifiers (migration numbers, versions) by scanning all refs including remote; keep one session per working copy; and whenever operating in a git worktree — including in any prompt handed to a subagent — use git -C exclusively and verify which checkout an edit actually landed in. Every chip or background session spun off from a live session is TOLD it is one: its prompt declares the parallelism, names in-flight branches and PRs, carries the recon duties, and forbids protected-branch merges from the chip. Does not fire on single-machine single-session repos with no open branches, and not for probing non-repo state (live-state-first owns catalogs and deployed surfaces).
---

# Parallel-work recon

Eight incidents of duplicated work, colliding identifiers, and edits landing in trees that
no longer existed — plus five more where a session or subagent silently edited the wrong
checkout. All from one cause: treating a snapshot of repo state as a lease on it. Layer:
session-boundary hub; the session-start half is mechanised by the SessionStart hook
(hooks/session-recon.mjs), which injects live state at session open.

## The recon

At session start AND again immediately before any commit, merge, or identifier claim:

```bash
git fetch --quiet
git log --oneline --decorate --all -8
gh pr list --state open
```

The pre-commit re-run is the sharp edge. The session-start check (even the hook's) is a
snapshot, not a lease — another machine or session may have pushed while you worked. A
session once nearly rebuilt a fully-shipped PR because it trusted a stale handover; another
inferred a migration was "phantom" when it was simply unpushed (`git ls-remote` before
inferring absence).

## Sequential identifiers

Migration numbers, version strings, and anything else claimed by "next in sequence" collide
silently under parallel work — git flags nothing when two branches ship the same numbers.
Claim by scanning ALL refs including remote, at merge time, not just when the file is
created. A `009*`-style glob can misread the ceiling; list and sort, don't pattern-guess.

## Worktrees and checkouts

- One session per working copy. Two sessions on one clone halves the snapshot's half-life.
- **Two paths are not two working copies until you have checked.** A junction, symlink, bind
  mount, network share, or the same repo reached by a second name gives the appearance of
  isolation with none of the substance: two window titles, two transcripts, one index and
  one tree. `git rev-parse --absolute-git-dir` from each path answers it in one command, and
  on Windows `fsutil reparsepoint query <path>` names the target. Check before trusting,
  because nothing at either path announces the sharing.
- **Commit early whenever another session, agent, or scheduled job can reach the same tree.**
  The recon rules protect the commit; nothing protects uncommitted work. A `reset --hard` in
  a sibling session destroys it with no trace in `reflog` or `fsck --unreachable`, so
  "recoverable by SHA" applies only to what was committed. The commit is the unit of safety,
  not the file save. After a loss, establish committed-or-not *before* hunting: the two cases
  have completely different answers.
- Use `git -C <path>` exclusively for worktree git operations — a `cd` between tool calls
  silently lands elsewhere.
- Any prompt handed to a subagent that must work in a worktree states the absolute path and
  a branch-check first step; audit the paths in its report to confirm which checkout it
  actually edited (a subagent once edited seven files on main).
- A stale dev server serves the old tree; restart it after switching checkouts.
- Staging is per absolute path: `git add app/src` in the wrong checkout stages nothing you meant.

## Chips and spawned sessions

A chip — any background task or session spun off from a live one — starts life mid-parallel-work
by construction: the spawning session is still pushing, rebasing and merging while the chip runs.
Every chip prompt therefore states these as verbatim duties, never as context the chip must infer:

- "You are a background chip running in parallel with an active main session (and possibly other
  chips)." Name the branches and PRs known to be in flight at spawn time.
- The recon above applies unreduced: fetch + pr list at start AND immediately before any commit
  or push; sequential identifiers claimed across ALL refs.
- The chip works on its own branch or worktree and never merges to a protected branch; it opens a
  PR and leaves the merge to the operator's per-action confirm.

<!-- FORWARD: a rule this section should gain (docs/HANDOVER_secret-guard_2026-09-24.md,
section 9). A chip's prompt can arrive inside the spawning conversation itself with no
worktree made for it, as one did on 2026-09-24 in ~/.claude/skills. The chip then checks
`git worktree list` and, finding none of its own, runs `git worktree add` before its first
edit, at a path outside the repo so the main checkout's `git status` never lists it. For
~/.claude/skills that also keeps the copy away from the directory Claude Code reads skills
from (a precaution, not a verified hazard). -->

Ratified 2026-08-06 (PropOS, Ben): a chip was spawned to investigate a smoke-teardown leak while
the spawning session was mid-rebase on an open PR; its prompt scoped files and live-data rules but
never declared the parallelism. No collision that day; the rule closes the class, not the instance.

## What this skill does not do

It does not probe non-repo state — database catalogs, deployed surfaces, and config are
live-state-first's territory. It does not gate the push itself (confirm-before-push and the
push-gate hook own that moment).

## Why

Parallel work makes staleness the default, not the exception, and git provides no collision
signal for identifiers or duplicated effort. Evidence: PropOS LESSONS_LEARNED Sessions 26,
31, 33, 38, 45, 2026-05-22, 2026-07-16, 2026-07-19; worktree incidents Sessions 5, 6, 44,
2026-07-05, 2026-07-07.

Evidence for the two rules above, added 2026-09-21: two sessions ran against one working
copy of this very library, because `~/.claude/projects/Unslop/claude-skills` is a directory
junction onto `~/.claude/skills` rather than a second clone. A `reset --hard` in one
destroyed forty minutes of written and verified work in the other, plus a pushed commit, and
left nothing in `reflog` or `fsck`. The session had re-probed before committing exactly as
the recon section requires; what it did not do was commit, and it was editing on the strength
of a start-up reading. LESSONS_LEARNED entry 21.

