---
name: checkpoint-log
description: Keep a live, committed checkpoint log during any work unit expected to span multiple commits or sessions. Each commit ships with a short note in the log, what the commit did, the key decision and why, any deviation from plan; closing the unit requires an explicit walk of the checklist including the wiring steps. Triggers when starting multi-commit work, when resuming a unit after a crash or a gap, and when declaring a multi-commit work unit done. Does not fire on single-commit fixes, where the commit message carries the note.
---

# Checkpoint log

A handover note is written at the end of a session, so a session that dies unexpectedly
takes its unwritten detail with it, and the next session inherits a compressed summary it
has to re-derive. This skill moves the record to the commit boundary: every commit in a
multi-commit unit carries a short checkpoint note, so the repository sits at a documented,
resumable checkpoint after every commit. Layer: leaf (commit seam). Admitted by review
rather than by the misses log — see Provenance — so candidate-tier until fires accumulate.

## The rule

A multi-commit work unit keeps a live log entry per commit, staged with that commit, and
closes only after an explicit item-by-item walk of its checklist.

## How to apply

- **The file.** `WORKLOG.md` in the project root, append-only, one `##` heading per work
  unit. A project with an established worklog location uses that instead, consistently.
- **The unit opens with two things:** a one-line goal, and the checklist of planned commits
  or tasks as checkboxes. plan-first produces this list; copying it here makes progress
  visible in the file, not only in chat.
- **The per-commit entry** is written before the commit and staged with the code: two to
  four sentences — what the commit did, the key decision and why it went that way, any
  deviation from the plan, any finding worth keeping. Tick the checklist item in the same
  edit. Long evidence goes in the commit body or the project's docs, never the log.
- **Why inside the commit:** any commit can then be checked out cold and the log explains
  how the work got there; a later session resumes from the last entry without re-deriving,
  and the closing summary is written from the log alone.
- **Closing the unit:** walk the checklist explicitly, item by item, before declaring it
  done — including the wiring steps that are easiest to skip: registrations and DI
  bindings, route tables and exports, config and environment entries, gitignore entries,
  migration catalog queries (db-migration-verification), doc updates, and deferred-item
  anchors planted where promised (flag-deferred-items). Only then write the closing
  summary from the log: what was built, what deviated, what was deferred and where its
  anchor is.

## What this skill does not do

It does not serve the session seam — handover owns that, and synthesises its landed,
in-flight, and deferred sections from this log where one exists. It does not probe repo or
live state at boundaries (parallel-work-recon, live-state-first). It does not decide the
plan (plan-first) and does not gate "done" on deployed surfaces (one-real-ride owns that
moment; the closing walk here is about the checklist being genuinely finished, not the
change being genuinely live).

## Why

Mid-unit failure is where detail is lost: "why" evaporates faster than "what", and the
closing summary written from memory is the one that omits the deviation that mattered. A
note per commit keeps why next to what while both are fresh, makes every commit a safe
stopping point, and turns the closing summary into a synthesis job rather than a memory
job. The closing walk exists because the items that break a "finished" unit are rarely the
interesting code; they are the wiring steps nobody remembers doing.

## Provenance

Adapted from the CURRENT_PHASE checkpoint pattern and phase-close checklist rule in
[Project Architect 2.0](https://github.com/Druthulu/ProjectArchitect) (source-available;
reviewed 2026-08-03, verdict: do not adopt wholesale, nick this pattern). Text written
in-house; no upstream text copied.
