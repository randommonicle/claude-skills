# Checkpoint log: the Tier 1 and Tier 2 build of 2026-11-05

Unit: the remaining proposals in `docs/SKILL_PROPOSALS_2026-11-01.md`, admitted by Ben on
2026-11-05 ("agree to all your proposals"). One branch, `feat/tier1-and-tier2-2026-11-05`,
because two PRs that both change the skill count conflict (NOW.md trap).

**Nothing on this branch has been pushed.** Ben is away and push and merge each need his own
authorisation (`confirm-before-push`). Every commit below is local.

Order as the proposals document set it: the two regulatory Tier 2 rows, the live-state-first
decision, then Tier 1 item 4, item 1, item 2, then the remaining Tier 2 rows by skill.

| # | Commit | What it did | Decision, and any deviation |
|---|---|---|---|
| 1 | `f5b0ffe` | The two regulatory Tier 2 rows (`legal-citation-integrity` rule 7, `statute-to-obligations-register` rule 10, `commission-the-roster` 2026-11-01 section) and the live-state-first clock resolution | Neither statutory rule restates the statute: both point at `legal-notice-handling/SKILL.md:130-131` where the s.48(3) wording was verified on 2026-10-03, per the standing rule on citations. The clock contradiction was flagged by the sweep as needing Ben's decision and "agree to all" did not reach it, so it was taken for him in favour of library 34, with the superseded wording and the reason left in the text so one edit reverses it |
| 2 | `9173ea1` | `instrument-reports-itself`, Tier 1 item 4. Nine rules in two halves | Built first although it is item 4, because the sweep's own order puts it first and because library 46 gave it an eighth instance four days after the sweep was written. Counts 57 to 58 |
| 3 | `67e4f9d` | `prove-it-can-pass`, Tier 1 item 1. Eight rules, two questions | `prove-it-can-fail` gained a Routes line to it, because a rule nothing delivers at the moment it applies is not learned (the sweep's own `skill-library-builder` row, applied to this build). Counts 58 to 59 |
| 4 | `b323377` | `enumerate-the-set`, Tier 1 item 2. Nine rules, plus a section on its boundary with `blast-radius-grep` and `unordered-events` | The PropOS instances are summarised as the proposals document records them; that repository's lessons file was not read for this build, and the skill says so on its face. Counts 59 to 60. All four Tier 1 items now exist |
| 5 | `4a9b39d` | The remaining eighteen Tier 2 rows, two of them acted on rather than written, and the CRC-32 defect that the second of those found | See the three deviations below |

## Deviations in commit 5, recorded because none was in the plan

**The em-dash gate is scoped to three files, not the library.** `enforce-invariants-in-build`'s
row says a skill that ships a scanner has the scanner run over its own text. The `index` job
now scans the three unslop `SKILL.md` files behind a step that plants an em dash and fails if
the scanner calls it clean. It is not widened: `UPSTREAM.md` uses the library's bold lead-in
format and `unslop-ui`'s generated reference index is vendor text with 293 em dashes, so a
library-wide gate reds on house style. Six pre-existing em dashes in `live-state-first` and
eight in `README.md` were left alone rather than rewritten quietly. Open for Ben.

**Nineteen em dashes were removed, eighteen of them mine.** Running the new gate found
`unslop-ui/SKILL.md` shipping one, which is library 43's class live in a sibling of the skill
it belongs to, and found the three skills written earlier the same day carrying eighteen
between them, by the author of the rule against them. Replaced one at a time with a script
that asserts a unique match per occurrence, never by blanket substitution.

**The archives were all unreadable.** `check-archives.mjs` went red on two stale `.skill`
files; Python's `zipfile` then refused to open them. It was not two. All five archives and all
twenty-one members carried a CRC-32 that did not match their bytes, because
`hooks/pack-skill.mjs` ran the CRC update as `c >>> 1` where the algorithm needs `c >>> 8`.
Deterministic, so a re-pack reproduced the committed archive byte for byte, which is what
identified the packer rather than the archives. `check-archives.mjs` read content by recorded
size and never looked at the field, and its own suite says so in a comment that was accurate
and was the defect. Fixed at source; all five re-packed with the real tool; a CRC check added
to the gate naming the rebuild command; the test helper taught to write a correct CRC and to
plant a wrong one; a new case asserting exit 2 on a member whose content is current and whose
CRC is not. Proved by restoring the `>>> 1`, re-packing, and watching the gate exit 2, then
restoring and re-verifying with `zipfile.testzip()` returning `None` for all five. LESSONS 47.

## Closing walk

- [x] Every Tier 1 item built, indexed, counted in all three places, and loading (each new
      skill's description was confirmed to reach the session after it was written)
- [x] Every Tier 2 row written, including the two that were code rather than prose
- [x] `check-index`, `check-archives`, `check-licences` and all 23 runnable hook suites green
      locally. The four win32 suites were not run here (the 2026-09-21 Avast moratorium,
      never formally lifted); CI covers them and did so on PR #41 this morning
- [x] The new CI step proved able to go red before being relied on
- [x] LESSONS 47, two DECISIONS entries, `team/NOW.md`, and this log
- [x] The Occam item resolved from "overdue" to "cannot run here", with evidence and the
      home-machine commands in `docs/OCCAM_second-read_2026-11-05.md`
- [ ] **Push and PR: not done, and not to be done without Ben's authorisation.** The command
      is in `team/NOW.md` under "To push"

**skill that should have prevented this:** for the CRC defect, `prove-it-can-pass`, built
earlier the same day. **class:** a writer and its checker built as a pair, where the checker
verifies only the properties the writer thinks about.
