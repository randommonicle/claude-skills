# The second Occam read: blocked on this machine, with the commands for the home machine

Status on 2026-11-05: **not done, and not doable from here.** Nothing below is a reading. No
numbers were estimated or reconstructed.

> **Ben, 2026-11-09, changed the question.** Asked whether he wanted the trial's second week or
> Occam's effect over the three weeks since, he answered "over the three weeks I guess". So the
> read DECISIONS 2026-10-09 ordered is not going to be run, and what replaces it is a different
> measurement with a weaker claim. See "What the changed question costs" at the foot of this
> note before reading any figure it produces as a verdict. Everything else below stands.

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

## What the changed question costs (added 2026-11-09)

The question is now Occam's effect over the roughly three weeks since the trial window closed,
not the trial's second week. That is a reasonable thing to want and it is worth saying plainly
what it can and cannot support.

**It has no comparable baseline.** The first read's power came from a before-and-after: a
2026-09-29 baseline week with Occam off, against a trial week with it on, on the same machine
and a similar mix of work. The three weeks since have Occam on throughout. A figure from them
is a reading of the present, not a difference, so "the counts are low" cannot be read as "Occam
is working". The only comparison available is against the 2026-09-29 baseline, which is now
six weeks and a different body of work away, and that gap is doing at least as much to the
numbers as the plugin is.

**The mix has changed more than the plugin has.** The first read already flagged this, which is
why it ran a second row excluding the RimWorld ride. Since then the work has moved through a
skills build-out, a vendor-pack reinstall and a long CI episode, none of it resembling the
baseline week. Run the ride-excluded variant again if the transcripts still warrant it, and say
in the result which weeks are in the window.

**So the honest form of the result** is a current reading with its window stated, offered
alongside the 2026-09-29 and 2026-10-09 figures without pretending the three are a series. If
the decision wanted is simply keep or remove, and the numbers cannot settle it, the deciding
question is whether Occam's rules are still worth ~82 tokens on every session given that the
2026-09-29 review found two of them conflict with this library's own norms at `lite`. That is a
judgement, not a measurement, and it can be made without running anything.
