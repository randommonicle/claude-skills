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

## Ride 2: a repo shaped like the pilot, 12:33 BST

A second throwaway repo, `ride2-repo`, shaped like the passive income project: no
`package.json`; checks are stdlib-only Python scripts under `checks/`; a check reads gitignored
data (`local/rates.json`) that `team/gate.json` lists under `copy`; the suite is a Python
runner. Run by one background subagent (sonnet) that built the milestone, played the
`tl-builder` contract (T fbec1ba, head 5b8c46b) and ran the gate; the hub then reran the
honest gate itself and got the same result (PASS, tested merge 81e6120c), with each check's
red-at-T reason matching its id.

| Case | Expected | Observed |
|---|---|---|
| Honest package | pass | PASS, all four checks ok |
| `copy` list emptied (second milestone branch) | fail at check 4 | FAIL at check 4: `FileNotFoundError` for `local/rates.json` in the scratch worktree |
| A check that exits 0 against the stub | fail at check 2 | FAIL at check 2: "already passes at T" |
| A `README.md` added outside SCOPE | fail at check 3 | FAIL at check 3: "changed outside SCOPE: README.md" |

**Windows observations.** `python` resolved through `cmd.exe` to the real install, not the
WindowsApps alias that `where python` lists first. Commands ran unquoted with forward slashes.
`cpSync` created `local/` in the scratch worktree. With `core.autocrlf=true` the scratch
worktrees check out CRLF; Python and `json.load` were unaffected, and the gate parses the brief
from `git show` (LF) so parsing was unaffected too.

**What it changed.** In the `copy`-less case both checks were red at T for an environmental
reason (the missing data file), not the reasons their ids name, and check 2 accepted that; only
check 4 caught it. The gate cannot tell a right red from a wrong one, so its command-line
output now prints each check's red-at-T reason (`red | <id> (exit N at T): <tail>`) for the
lead to read at step 8, asserted in the suite.

**Still not covered:** a regulated package, two packages at once, MT5 compile or Tester
commands.
