---
name: live-state-first
description: Playbook for the always-on norm "probe live state before building from any described state". Load when about to write code, SQL, config, or a fixture from a handover, memory note, README, audit tracker, or code comment, or when two documents disagree. Does not fire on repo/PR/branch state (parallel-work-recon owns repo probes) or on state you observed yourself this session.
---

# Live state first

The single most-repeated lesson on this machine: twelve-plus recurrences of building against
a world that no longer exists — invented columns from a stale handover, a "still open" item
carried across four handovers a month after it was done, an audit finding two migrations
stale, a reviewer's citation superseded by a later migration. Layer: norm + playbook — the
one-line norm in the global CLAUDE.md is the everyday trigger; this file is the depth.

## The rule

Every document claim — including the repo's own comments, skills, and FORWARD notes — is a
claim, not a fact. Before it becomes an input to code, SQL, config, or a fixture, verify it
with one cheap probe of the live source. The latest migration, policy, or config is the
truth; when two documents disagree, the catalog settles it.

## How to apply

- **One cheap probe before building**: a catalog query for schema claims
  (`information_schema`, `pg_policy`, `pg_get_functiondef`), the deployed surface for
  behaviour claims, the actual config for settings claims.
- **The file is not the live object, in either direction.** The live database routinely runs
  ahead of main (raw-applied unmerged migrations) and behind the repo (comments and fixes
  never applied). A migration file's text is evidence of intent, not of state.
- **Query the live distribution, not just the schema**, before building on a data
  assumption — 254 residue rows once would have shipped a correct feature looking broken.
- **Structured data needs a parser, not a grep with context lines.** Grep-with-context
  misled on JSON twice; scope schema greps to the block they describe.
- **Staleness ranks**: "still open" items in handovers, path hints in a repo's own docs, and
  audit trackers are the most likely claims to be stale — they record status at a moment,
  not state.

## What this skill does not do

It does not probe repo state — fetch, PR lists, and identifier ceilings are
parallel-work-recon's territory. It does not define migration verification (that is
db-migration-verification's post-apply half; this skill is the pre-compose half).

## Why

Documents decay the moment parallel work exists, and composing from a stale description
produces confident, wrong artifacts that pass review because the reviewer reads the same
stale document. Evidence: PropOS LESSONS_LEARNED Sessions 9, 11, 12, 22, 41, 52, 54,
2026-07-06, 2026-07-08, 2026-07-09, 2026-07-19, 2026-07-20; ASH LESSONS_LEARNED 2026-05-25,
2026-07-10.
