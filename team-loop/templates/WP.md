# WP-nnn: <one-line title>

spec: team/SPEC.md rev <n>
regulated: <yes | no>
role: <tl-builder | tl-test-writer then tl-builder-regulated>
T: <filled in by the lead from the tool result at step 5, never by the builder>

```
ROLE: <one sentence>
SCOPE: exactly these path globs, nothing else: <glob>, <glob>

FACTS for ORIENTATION ONLY, pre-verified by the lead. Do NOT re-derive.
  Nothing in this list is the premise of an edit; anything you must act on is
  in RE-DERIVE ANYWAY below:
  - <fact, quoted, with file:line>
  - decisions that bind: <DECISIONS.md entry date + one line each>
  If you believe any fact above is wrong, STOP and say which and why.

RE-DERIVE ANYWAY (regulated, dual derivation required): <list, or "none">

JUDGED BY (each command exits non-zero while its check fails, zero once it passes):
  - <id>: <command, run from the repo root>
  - <id>: <command>

TESTS CHANGED (existing test, config or fixture files this package may alter): <exact paths, or none>

BUDGET: ~<n>k tokens. If you approach it, stop and report what remains undone.
DELIVERABLE: <phase 1: commit T, the tests alone; phase 2: the build on top of T>.
OUT OF SCOPE: <what it must not touch>. If you find necessary work outside SCOPE,
  report it and STOP.
```
