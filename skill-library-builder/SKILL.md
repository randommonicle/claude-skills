---
name: skill-library-builder
description: Turn a real repository into a project-specific skill library that preserves a senior engineer's operating knowledge, so juniors and smaller models can carry the project forward. Load when asked to build, refresh, or audit a skill library or engineering playbook for a codebase, to capture tribal knowledge before someone leaves, to onboard engineers, or to make a repo easier for AI agents to work on. This is project-agnostic and installed user-level, so it applies to every project on this machine; the PropOS repo's own propos-* family is the worked example it was derived from. Do not load it to write a single skill on a topic you already know (write that skill directly).
---

# Skill library builder

Turn a repository into a project-specific skill library: what the system is, what must not break, how it is set up, run and tested, how it fails, how to prove a fix is real, and how to change it safely. The output is a set of focused runbooks under `.claude/skills/`, not generic documentation. Reject any skill that only restates the README.

This skill is the method behind the PropOS library (16 skills authored by Fable, reviewed by Sonnet and a domain reviewer, fixed by Opus, on 2026-07-02). The PropOS artefacts `docs/PLAN_fable_skill_library.md` and `docs/FABLE_PROMPT_skill_library.md` are a full worked instance of everything below.

## When this applies

Load this when the task is to build or refresh a library of operating knowledge for a repository, especially before a knowledgeable engineer leaves, when onboarding, or when a codebase needs to be workable by a cheaper model. Do not load it to author one skill on a subject you already understand: write that directly. Do not load it to change product code: this is a read-and-author job.

## Non-negotiables

1. **Discover before you author.** No skill is written until its facts are verified against the repo.
2. **Write only under the skills root** (`.claude/skills/`). The rest of the repo is read-only unless the user explicitly asks for code changes.
3. **Ground truth only.** Verify every command, flag, path and claim against the repo before stating it. Do not invent commands, flags, paths, ownership, history or success claims. Label inference as inference.
4. **Verify provenance with git, not memory.** Dates, PR and commit numbers, and "who added what when" are the claims most likely to be wrong. Confirm each with `git log --follow <path>` or `git show <sha>` before writing it. This is the single most common authoring error: the technical facts (function names, config keys, error codes) verify cleanly while the story of when and why a thing landed drifts, especially when two similar artefacts exist.
5. **Do not route around the project's change-control.** Nothing you write may tell a reader to bypass the project's gates.
6. **Do not present candidate work as proven.** Open, deferred or experimental items stay labelled open.
7. **Put volatile facts behind re-verification commands** and date-stamp them.
8. **No mutating git and no side effects.** Forbidden without explicit authorisation: `reset`, `checkout`, `switch`, `clean`, `commit`, `push`, `pull`, `merge`, `rebase`, publish, deploy, and any database or production write.

## Source priority (when sources disagree)

1. Current checked-out code. 2. Tests and fixtures. 3. CI config. 4. Build scripts and manifests. 5. Runtime and deploy scripts. 6. Official repo docs. 7. Git history and reverts. 8. Issues, TODO/FIXME anchors, ADRs, memory and notes. 9. Inference from patterns (labelled). Where a handover doc and the live code disagree, the live code wins.

## Procedure

### 1. Census (read-only)

```bash
git status --short
git log --oneline --decorate -n 80
```

Then locate the docs of record, manifests, CI config and tests, and grep the hotspots:

```bash
grep -rniE "TODO|FIXME|HACK|deprecated|flaky|workaround|revert|rollback|known issue" .
```

Expected: a list of the repo's own admissions of debt and fragility. These seed the debugging and failure-archaeology skills.

### 2. Build the System Map (before any skill)

Write an internal map: domain, durable and runtime state, actors, who or what may mutate each state, the idea-to-release workflow, the known risks and historical failures, the diagnostic tools, and what a real successful change looks like. If the map is thin, keep discovering. A shallow map produces shallow skills.

### 3. Choose the taxonomy (aim for 10 to 16)

Adapt this template to the repo. Merge thin categories, split deep ones, add domain categories the repo demands.

- `<project>-architecture-contract`: load-bearing designs, invariants, known-weak points.
- `<project>-change-control`: how changes are classified and gated, each rule with its rationale and the incident behind it.
- `<project>-debugging-playbook`: symptom-to-triage table for this repo's failure modes.
- `<project>-failure-archaeology`: the dated chronicle of settled battles, so none is re-fought.
- `<domain>-reference`: the field's theory as it applies HERE, not a textbook.
- `<project>-config-and-flags`: every configuration axis, production versus experimental, with re-verify commands.
- `<project>-build-and-env`: recreate the environment from scratch.
- `<project>-run-and-operate`: run and deploy the thing.
- `<project>-diagnostics-and-tooling`: how to measure instead of eyeball; the real scripts with interpretation guides.
- `<project>-validation-and-qa`: what counts as evidence; acceptance thresholds; the golden inventory.
- `<project>-docs-and-writing`: maintaining the docs of record; house style.
- `<project>-external-positioning`: papers, releases, competitors; novel versus known; reproducibility.
- Advanced: `<project>-<hardest-problem>-campaign` (a decision-gated campaign with expected numbers at each gate), `<project>-proof-and-analysis-toolkit`, `<project>-research-frontier`, `<project>-research-methodology`.

### 4. Author (one agent per skill)

Each skill is `.claude/skills/<name>/SKILL.md` with YAML frontmatter (`name` plus a trigger-rich `description` stating exactly when to load it and which sibling to use instead). Use imperative runbook voice. Include: purpose, when NOT to use it, source-of-truth files, procedure, commands WITH expected observations, decision gates, known traps, the evidence required for success, and a final "Provenance and maintenance" section with one-line re-verification commands for volatile facts. One home per fact; cross-reference elsewhere.

### 5. Review, then fix

Three review passes over the complete set, then a fixer:

- Factual review re-verifies flags, paths, commands, citations, and provenance (dates, PRs, commits) against the repo.
- Doctrine review finds contradictions with project rules or between skills, overstated claims, anything that changes behaviour without a gate, and any skill that routes around change-control. Use a domain reviewer for regulated or safety-critical content.
- Usability review checks the description's trigger quality, one-home-per-fact discipline, self-containedness, and scannability.

The fixer applies blocking and important findings without introducing new unverified claims.

### 6. Slop gate

If the unslop skills are installed, scan the prose and any scripts. The bar is 0 high-severity.

```bash
python ~/.claude/skills/unslop-text/scripts/unslop_text_scan.py <SKILL.md> --severity high
```

Expected: `high: 0`. A clean scan clears the surface tells only; the structural ones (a skill that restates the README, an invented command) still need a reviewer.

## Running it as a multi-agent workflow

The efficient shape, proven on PropOS: a pipeline of one author agent per skill, then a review stage, then a conditional fix stage, all running per-skill in parallel. Route the authoring to your strongest available author model and the review to a cheaper independent one, so the reviewer is not biased by the author. Give each author its exact source-file list and its scope plus the sibling that owns what it excludes. Assign a domain reviewer to the regulated skills. See `docs/PLAN_fable_skill_library.md` for the exact routing used.

## What good looks like

A zero-context engineer or a small model can answer, from the skills alone: what is this system and what must not break; how do I set it up, run it and test it; how do I debug the real failures; how do I know a fix is real; how do I avoid re-fighting a settled battle; how do I change behaviour safely; how do I advance the project without unverifiable claims.

## What this skill does not do

It does not write good product code, and it has no house style: it captures the project's operating knowledge in the project's own voice. It does not replace the project's change-control, its tests or its docs of record; it makes them findable and executable. For a single self-contained skill on a subject you already know, use `anthropic-skills:skill-creator` instead.

## Why

The knowledge that keeps a complex project safe lives in one or two people's heads: the invariants, the settled debates, the traps that cost a week once. When they leave or when a cheaper session picks up the work, that knowledge is gone and the same mistakes get re-made. A library built to this discipline turns tribal knowledge into executable runbooks that a reader can trust, because every claim was verified against the repo and the volatile ones carry their own re-check command.

## Provenance and maintenance

Date stamp: 2026-07-02. Distilled from the PropOS engagement: `docs/PLAN_fable_skill_library.md`, `docs/FABLE_PROMPT_skill_library.md`, and the pilot that established the git-provenance rule (finding 4 above). Portable: copy this directory to `~/.claude/skills/skill-library-builder/` to use it on any project.

```bash
cp -R .claude/skills/skill-library-builder ~/.claude/skills/
```

Volatile facts and their re-checks:

| Fact | Re-verify with | Expected |
|---|---|---|
| Unslop scanners installed | `ls ~/.claude/skills \| grep unslop` | `unslop-text`, `unslop-code`, `unslop-ui` |
| The worked-example artefacts still present | `ls docs/PLAN_fable_skill_library.md docs/FABLE_PROMPT_skill_library.md` | both listed |

## A lesson is not a control (added 2026-07-23)

Skills must encode mechanical steps — grep this, run that, assert this count — not
awareness. A documented trap in the worked-example repo recurred anyway until the procedure
was fixed mechanically; prose that raises awareness fails exactly when attention is
elsewhere, which is when the trap fires. When authoring any skill, convert each "be careful
about X" into a command or a check, or expect the lesson to repeat.
