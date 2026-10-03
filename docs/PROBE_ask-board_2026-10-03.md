# Probe: the Ask board, 2026-10-03

Step 0 of `docs/DESIGN_team-loop_2026-10-02.md` section 6, run before the board was built into
the `team-loop` skill. Each item below was observed, not assumed, unless marked otherwise.

Board: `team-loop/ask-board.html`, published 2026-10-03 09:44Z as a private artifact,
`https://claude.ai/artifact/Kqqm4sFUJLD4VAg6Tz14SH`, runtime contract 0.2.67, capabilities
`db` with one rule (`path ""`, read `owner`, write `owner`) and `user`. Claude Code 2.1.286 in
the desktop app; `claude` CLI 2.1.281 for the headless runs.

| # | Item (design section 6) | Result | Evidence |
|---|---|---|---|
| 1 | Publish a board with `db`, write rows with ArtifactData | **Observed.** Five items and `meta/status` written in one atomic batch | batch result "committed atomically, 6 writes" |
| 2 | Answer from a phone, read back from a fresh session | **Pending the operator,** who is away today; the link went by email at 09:47Z | ASK-0001 on the board |
| 3a | Read and write from the desktop app's Code tab | **Observed** | this session's ArtifactData calls |
| 3b | Read and write from a headless `claude -p` run | **Observed.** Read `meta/status` and wrote `probe/headless` | `claude -p ... --permission-mode bypassPermissions`, 4 turns, USD 0.29 |
| 3c | Read from the CLI in an interactive terminal | **Not exercised.** Same binary as 3b, so expected to match; unverified | |
| 3d | Read from a scheduled desktop session | **Observed**, and the write after it **stalled** | see "Scheduled sessions" below |
| 4 | Two sessions write different rows at once, both survive | **Observed.** Two headless sessions launched together wrote `probe/parallel-1` and `parallel-2` (3 s apart); both present on re-read, beside three earlier rows | list of `probe`, 5 documents |
| 5 | Does a row show who wrote it | **No.** A document carries `version` and `updatedAt` only; any `by` field is written by whoever writes the row | `get meta/status` |
| 6 | Wrong board link reports failure | **Observed.** A wrong artifact id fails: `invalid_argument: no such artifact, collection, or document (or no access)` | ArtifactData list on a mistyped id |
| 6b | Wrong collection on the right board | **Reads as empty.** `No documents matched`, the same as a queue with nothing open | ArtifactData list at `as_level: admin`, and on an unwritten collection |
| 7 | Does an answer reach a live session | **Not tested.** The design's expectation stands: the lead reads the board on start, resume and each checkpoint, and does not rely on a wake | |
| 8 | Owner-only rule hides rows from lower levels | **Observed.** A list at `as_level: admin` returned nothing while the owner's read returned the rows | |

## What the probe changed in the design

- **Read a sentinel first.** Item 6b means a typo in a collection name looks like an empty
  queue. The skill therefore reads `meta/status` before anything else; a missing sentinel is a
  wrong board or an unreadable one, never "no open decisions".
- **Answers stay steering only.** Item 5 confirms the design's caution: nothing in the store
  distinguishes the operator's answer from one Claude wrote.
- **Privacy is enforced, not described.** The owner-only rule (item 8) replaces the design's
  "edit access is never shared" prose as the control.

## Scheduled sessions

A one-shot task from the desktop app's scheduler (`team-loop-chain-probe-2026-10-03`, fired
09:51Z) ran `date`, loaded ArtifactData and read the board, then stopped on its second Bash
call, an append to a file under `~/.claude/` outside its working folder, and sat there with no
one to answer. Its working folder was the creating session's (`Projects\Unslop`), not the
folder the prompt named. Stopped by hand at 09:56Z. So an unattended scheduled session can
read the board but cannot be trusted to write outside its folder without a prompt; any chain
of scheduled work sessions needs its tools approved in advance (the scheduler stores approvals
granted during a run) or a headless `claude -p` with an explicit permission mode. Today's
chain uses session-only cron jobs in the driving session instead, which run in that session's
own permission mode.

## Clean-up

The `probe` collection (5 documents) is deleted once this record is committed.
