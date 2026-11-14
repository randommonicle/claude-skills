# Handover: lessons-watch and the model-tier review, 2026-11-14

Diagnoses in this note are unverified unless marked.

Wrap-up context: 26% (reading from `get_usage`, 2026-11-14 23:57 GMT), green. The session ends
because Ben is away from a computer and one step needs him at one, not because of the band.
Written on the home machine: user folder `C:\Users\bengr`, host name `Obelisk22`.

## 1. Session goal

Review a Facebook "lead orchestrator" prompt against the library, incorporate what it exposed,
then build a way to know when a misses-log sweep is due without the computer being on.

## 2. Branch and worktree

- `feat/lessons-watch-2026-11-14`, worktree `C:\Users\bengr\.claude\skills-wt-lessons-watch`,
  level with its remote at `ed0c588` before this note's commit. Draft PR
  randommonicle/claude-skills#47.
- The private instance: repository `randommonicle/lessons-watch`, cloned at
  `C:\Users\bengr\Projects\lessons-watch`, branch `main`, level with its remote at `56faad4`.
- Live library `C:\Users\bengr\.claude\skills`: `main` at `ee815c2`, level with origin.

## 3. What landed

| What | Where | State |
|---|---|---|
| PR #46, merged as `ee815c2`: commission-the-roster 2026-11-14 section, team-loop "failed gate" paragraph, DECISIONS and NOW.md entries | claude-skills `main` | verified: `gh pr view 46` read MERGED, four checks green on `4141fa0` before merge |
| `CLAUDE_CODE_SUBAGENT_MODEL` set to `sonnet` | `C:\Users\bengr\.claude\settings.json`, `env` | file parses and the key reads back. **Effect unverified**: it applies to new sessions only |
| `c58fe69` lessons-watch tooling, tests, template, README section, CI step | PR #47 branch | verified: suite exit 0 locally on Windows; `index`, `archives`, `hooks`, `hooks-windows` all SUCCESS on `ed0c588` |
| `ed0c588` DECISIONS and NOW.md for lessons-watch | PR #47 branch | committed and pushed; not merged |
| Private repository created, visibility read back as PRIVATE before any push | `randommonicle/lessons-watch` | verified by `gh repo view --json visibility,isPrivate` |
| Eight local-only lessons files copied to `mirror/` | private repo, commit `d06a150` | verified: `git ls-tree origin/main` lists all eight and `STATUS.json`. Run by hand from the session, not by a scheduled task |
| One live workflow run with no token | private repo, Actions run 43654900356 | verified: failed as designed, issue 1 created with the report and one comment, eight sources shown NOT READ with HTTP 404 |

## 4. In flight

Nothing is half-edited. PR #47 is complete as written and waits on the items in section 6.

## 5. Deferred items

- The work machine (`ASH-HP-241`) has no mirror config, so lessons files that exist only there
  are not counted. Recorded in DECISIONS.md, entry "2026-11-14 A sweep is called by a weekly
  count", under "Not done".
- No Rounds re-run is recorded for Fable 5.2. Recorded in `team/NOW.md` under "Deferred, with
  grep anchors".

## 6. Verification still outstanding

1. **The passing run.** No `LESSONS_READ_TOKEN` secret exists (verified: `gh secret list` on the
   private repo printed nothing, 2026-11-14 23:57). Until it does, every run fails by design.
2. **A notification reaches Ben.** The comment on issue 1 mentions the repository owner. Whether
   it arrived is not known; he was asked and had not answered.
3. **The daily copy.** No scheduled task named `lessons-watch mirror` exists (verified:
   `schtasks /query` found none). DECISIONS.md in PR #47 and the private README both say the
   copy runs daily. That is not yet true.
4. **The subagent model setting.** Prove it in a fresh session on this machine: spawn an agent
   with no pin and no per-call model, and read the model from its usage report.

## 7. Blockers and open questions

- **Token (Ben, at a computer or in a phone browser).** Fine-grained, Contents read-only, on
  the private repositories listed as `github` sources in the private `watch.json`. He stores
  it himself: `gh secret set LESSONS_READ_TOKEN --repo randommonicle/lessons-watch`, or the
  repository's Settings, Secrets and variables, Actions page. It must never be pasted into a
  session.
- **Repeat comments.** The issue comments only when the figures change, so a count sitting
  over the threshold of 10 goes quiet. Ben has not said whether he wants a weekly repeat.
- **"Send out updates".** For plugin installs, merging to `main` is the distribution. Whether
  Ben also wants a GitHub Release, which is a public post, is unanswered.
- **Private remotes for Rimagent and the AI domain project.** Asked, unanswered. His yes on
  2026-11-14 covered the watch repository only.
- **Auto-fix** could not be enabled from the session for PR #46 (the app could not match the
  repository to the session folder). The same is likely for #47; it can be switched on the PR bar.

## 8. Next actions

1. Run `gh secret list --repo randommonicle/lessons-watch` and confirm `LESSONS_READ_TOKEN` is listed.
2. Trigger the run: `gh workflow run lessons-watch.yml --repo randommonicle/lessons-watch`, wait
   for it, and read the issue table. Expect every source read and a total near 17. If a
   source is still NOT READ, fix it on the PR #47 branch as a new commit.
3. Ask Ben for his yes to mark PR #47 ready and merge it.
4. After the merge, confirm `c58fe69` is an ancestor of `main`, then fast-forward the live library.
5. Register a new scheduled task `lessons-watch mirror`: daily, start when available, allowed
   on battery, running `node C:\Users\bengr\.claude\skills\lessons-watch\mirror.mjs`. Start it
   once through Task Scheduler and assert a new commit on the private repo's origin with a
   fresh `ranAt` in `mirror/STATUS.json`.
6. Remove the worktree `skills-wt-lessons-watch` and the local branch once #47 is merged.
7. Put the two lessons below to Ben for `LESSONS_LEARNED.md`.

## 9. Traps and working agreements

- **Never amend or rebase `c58fe69`.** The private workflow checks out this repository at that
  exact commit. Fixes go on top as new commits; to use them, bump the `ref` in the private
  repository's workflow deliberately.
- The standing push exception covers `mirror.mjs` pushing to `randommonicle/lessons-watch` and
  nothing else. Every other push, PR and merge is still Ben's per-action yes.
- This repository is public. Do not write the private repositories' names or counts into it.
- The counter matches the words "new candidate" on a line (verified: a pattern tied to
  "none - " missed 9 of 160 real lines across 19 files on 2026-11-14). It can count prose and
  errs high.
- Baselines live only in the private `watch.json`. After a sweep, set each to that source's
  "Now" figure, or the total only grows.
- With the subagent default set to Sonnet, an unpinned spawn that needs the strong tier gets
  Sonnet without a word. Strong work states its model on the call.
- The session fast-forwarded the live library by hand once, after telling Ben it had been left
  for the 05:30 task. Say what was done, not what was planned.

## Lessons to promote (Ben to rule)

1. **The misses-log line has drifted from its canonical form.** Nine of 160 candidate lines no
   longer read "none - new candidate" ("none, new candidate", a wrapped "New candidate:",
   others), and the 22 October sweep listed entries by a script keyed on the canonical form.
   Unverified whether that sweep missed any of them.
   skill that should have prevented this: enforce-invariants-in-build
   class: a convention every tool greps for, kept only by a sentence in a norms block
2. **A public home was recommended for a job that reads private repositories**, before any
   repository's visibility had been checked. Caught one turn later by checking.
   skill that should have prevented this: live-state-first
