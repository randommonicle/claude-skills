# The second Occam read: blocked on this machine, with the commands for the home machine

Status on 2026-11-05: **not done, and not doable from here.** Nothing below is a reading. No
numbers were estimated or reconstructed.

## Why it could not be run

DECISIONS 2026-10-09 set the second read for on or after 2026-10-16, by the same method as the
first. DECISIONS 2026-09-29 scopes the whole trial to the home machine: "Occam is installed as
its own plugin at user scope on the home machine only", and `docs/REVIEW_occam_2026-09-29.md:5`
records that "PropOS work runs on the work computer, which has no Occam install".

This session ran on the work machine, and four checks agree:

| Check | Result |
|---|---|
| `hostname` | `ASH-HP-241` |
| User profile | `C:\Users\ben`. There is no `C:\Users\bengr` on this box |
| Pinned clone `C:\Users\bengr\Projects\vendor\occam` (DECISIONS 2026-09-29) | absent, under either profile |
| `OCCAM_LEVEL` in `~/.claude/settings.json` | absent; the `env` block is `{}` |
| Installed plugins | one marketplace, `claude-plugins-official`; no Occam |

`audit.py --days 7` selects transcripts by file time from the local transcript store, so even a
fresh clone of Occam here would read this machine's week, which never had Occam on it. That is
not the trial's second week by any reading.

## What has also lapsed

The trial window closed on 2026-10-16 and today is twenty days past it. `--days 7` taken now
covers 2026-10-29 to 2026-11-05 and does not overlap the trial fortnight at all. A read run
today is therefore a third question, not the second one, unless `--days` is widened to reach
back to the window, and a wider window mixes trial weeks with post-trial weeks.

## To run it on the home machine

From the pinned clone at `244c2fc` (`C:\Users\bengr\Projects\vendor\occam`), not from GitHub,
and with `--top 0`, as the first read did. Two runs, the second excluding the RimWorld ride's
worktrees (`handover-continuation-0bc258`, `game-agent-unattended-setup`), whose director play
is many API calls with few file reads and would flatter a per-call rate.

```
python C:\Users\bengr\Projects\vendor\occam\scripts\audit.py --days 7 --top 0
```

Check the script's own path and flags against the clone before running: the first read's
method is recorded in `docs/REVIEW_occam_2026-09-29.md` under "Trial read, 2026-10-09", and
that section is the authority on how the second row was produced, including the wrapper used
for the ride-excluded figures.

The two counts to compare are the ones the first read tabulated, per 1,000 API calls:
whole-file reads over 8k tokens, and same-file re-reads. The baseline and first-read figures
are in that table; do not retype them from here.

Because `--days 7` no longer reaches the trial window, decide first which question is being
asked: the second week of the trial (needs a window reaching back to 2026-10-09 to 2026-10-16),
or Occam's effect on the three weeks since. The first is the one DECISIONS 2026-10-09 ordered.

## The decision this feeds

Keep, or remove by the three steps in DECISIONS 2026-09-29:

```
claude plugin uninstall occam@occam
```

```
claude plugin marketplace remove occam
```

then delete `OCCAM_LEVEL` from the `env` block of `~/.claude/settings.json` on the home
machine.

Nothing of Occam has entered this library, which the 2026-09-29 entry required for the
duration of the trial and which remains true: the only Occam content here is the review and
the two DECISIONS entries. So a decision either way costs nothing in this repository.

The read is Ben's to run or to drop. This note exists so that the item stops reading as
overdue work on the work machine, which it is not, and starts reading as one command on the
home machine.
