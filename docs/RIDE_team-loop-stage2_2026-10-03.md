# Ride: one package through the team loop, 2026-10-03

`one-real-ride` for stage 2: a real agent and the real gate, end to end, before any pilot.
Observed, not assumed, except where marked.

**Setup.** A throwaway local repo in the session scratchpad, `ride-repo`, no remote. Milestone
branch `milestone/ride` with `team/SPEC.md` rev 1 (an `apportion(totalPence, weights)` that
splits a total in pence by largest remainder), brief `team/packages/WP-001.md` (regulated: no,
SCOPE `src/apportion.mjs`, three JUDGED BY commands), `team/gate.json` and `team/BOARD.md`, all
committed (8ec99ff) before any spawn.

**Roster.** One builder: the `tl-builder` contract handed to a general-purpose subagent on
sonnet. Deviation: the definition is not installed in this session, and this session's
directory is not a git repo, so `isolation: worktree` could not apply; the agent created its own
worktree with `git worktree add`. The ride proves the contract and the gate, not frontmatter
loading or harness isolation (the latter probed 2026-10-02, design section 5.4).

| Step | What happened | Evidence |
|---|---|---|
| 5, tests first | The builder wrote three test files, confirmed each JUDGED BY command exits 1, committed them alone as T, and stopped. It also checked its own tests against a reference implementation and two wrong ones, then restored the stub. | T = bf52bd5, 3 files; 83,311 tokens, 10 tool uses, 92 s |
| 5, lead review | The lead read the tests, checked two expected values by hand (`apportion(10,[1,2,4])` is `[1,3,6]`, `apportion(5,[1,2,1,2])` is `[1,2,1,1]`), accepted three stated judgement calls, and pinned T from the tool result | this record |
| 6, build | Resumed, the builder implemented `src/apportion.mjs` only, on top of T, no rewrite of history | head = cdee0d1; 85,624 tokens, 12 tool uses, 139 s |
| 8, gate | `gate.mjs` passed: ancestry, red at T (3 checks), not weakened, inside SCOPE, green on the merge with the full suite | 3.0 s wall; tested merge 7852cd9 |
| 8, can it fail | A copy of the head with one remainder assertion removed after T was refused at check 3, "T's own files changed after T", and that failing run deleted the earlier tested ref as designed | exit 1 |
| 8, merge | Re-gated, then `git merge --ff-only refs/team-loop/tested/WP-001`; the milestone suite: 15 pass, 0 fail; BOARD row set to merged; a LEDGER line written; worktree and branch removed | milestone at 9532349 |

**What the ride changed.** The tested merge was titled "Merge commit '<sha>' into HEAD",
because the gate merges in a detached scratch worktree; it now carries
`Merge WP-001 (<branch> at <sha>) into <milestone>`, asserted in the suite.

**What it did not cover.** A regulated package (test writer, regulated builder, verdict file);
two packages at once; the Ask queue steps (2 and 9); a project whose checks are scripts or MT5
runs rather than `node --test`. The pilot is the next ride for those.

**Cost.** Builder 168,935 tokens over two segments, about 4 minutes of agent time; the lead's
share is in this session's own usage.
