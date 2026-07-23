---
name: confirm-before-push
description: Always ask explicitly before pushing to a remote or fast-forwarding a protected branch. Per-action authorisation, not standing approval. Triggers on any git push, merge, or branch fast-forward operation, regardless of whether previous pushes in the same session were approved.
---

# Confirm before push or merge

Always ask before pushing to a remote, merging to a protected branch, or fast-forwarding a protected branch. Each action needs its own explicit authorisation. Past approvals in the same session do not extend to future ones.

## When this applies

This skill fires on:

- Any `git push` to a remote
- Any `git merge` into main, master, or another protected branch
- Any fast-forward of a protected branch (`git push origin HEAD:main`)
- Any history-rewriting push (`--force`, `--force-with-lease`)
- Any merge or rebase that lands work on a protected branch

This skill applies even when the project's convention is direct-to-main solo shipping. The convention defines where work lands; this skill defines the per-action authorisation gate before it lands.

## How to apply

After committing locally, summarise what's on the branch and ask before pushing. Examples:

- "Committed locally as `<sha> <message>`. Three files, plus one migration. Ready to push to origin?"
- "Worktree branch has two commits ahead of main. Push the branch first, then fast-forward main?"

Wait for explicit confirmation. Words like "yes", "push it", "go ahead", "proceed" are clear authorisations. Ambiguous responses ("looks good", "nice") are not.

Do not push with `--force` or rewrite published history without explicit per-action approval that names the force operation specifically.

## Standard push order

When a multi-step push is authorised, the canonical sequence is:

1. Push the local working branch to its remote tracking branch
2. Verify the push landed (check `git log --oneline <remote>/<branch>`)
3. If a protected branch fast-forward is part of the authorisation, perform it as a separate step
4. Verify the protected branch tip with `git log --oneline <remote>/<protected-branch>`

If any step fails, stop and report rather than continuing to the next.

## What this skill does not do

Local commits do not require this gate. Commit freely; the gate is on the moment work leaves the machine or lands on a protected branch.

Branch creation, worktree setup, and similar local operations are not push events and do not trigger this skill.

## Why

Pushing is visible to others and hard to reverse. CI runs, deploy webhooks, and anyone watching the repository all consume pushes the moment they land. Even on a solo direct-to-main project, every push is the moment a commit becomes off-machine durable and shared. Per-action authorisation prevents the case where standing approval from earlier in a session is used to push work the user has not yet reviewed.

## Remote branch deletion (added 2026-07-23)

The gate extends to deleting any remote branch, including `--delete-branch` on a merge.
Deleting a branch an open PR points at closes the PR unrecoverably (a fresh PR gets a new
number; one deletion left the work's only surviving copy in a local object store). Before
any branch delete, run the mechanical preflight:

```bash
gh pr list --head <branch> --state all
gh pr list --base <branch>
git log main..<branch>
```

In a squash-merge repo, "merged" is a PR fact, never an ancestry fact — `git branch
--merged` lies in both directions. Judge a stale branch by the diff it would apply to main
today. Redundancy means content-on-main AND no open PR — never a name or someone's say-so.

## Merge mechanics (added 2026-07-23)

- Diff a branch with `git diff $(git merge-base main branch) branch`, not `main..branch` —
  the symmetric diff misleads for branches forked before a main-side hotfix. After merging
  onto a hotfixed base, grep the queries the branch introduced (see blast-radius-grep).
- `gh pr merge` from a worktree can error on the local step while the remote merge
  succeeded: verify the real outcome with `gh pr view --json state,mergedAt` and sync main
  separately with `git -C`.

Enforcement note: the push-gate hook (hooks/push-gate.mjs) mechanises this gate by forcing
the permission prompt on pushes, PR merges, and remote ref deletion. The hook is the
control; this skill is the policy and the preflight.
