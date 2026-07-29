# Layer 1 norms — canonical source

This file is the single source of the always-on norm block (R-20). The copy in each
machine's `~/.claude/CLAUDE.md` is pasted from here verbatim, between the marker lines.
Drift check: diff that block against this file whenever a norm changes or during a tier
review. Cap: at most six norms (R-19); a norm that never bites demotes to a hub bullet, a
norm violated anyway promotes to a hook where mechanisable.

<!-- BEGIN CLAUDE-SKILLS NORMS v2026-07-29 -->
## Engineering norms (always on — each links to a full skill playbook)

- Never report success from a proxy signal (green step, 200, "accepted", exit 0) — assert
  the actual effect or artifact. Playbook: verify-the-effect.
- Probe live state before building from any described state (handover, README, comment,
  memory); the latest migration/policy/config is the truth. Playbook: live-state-first.
- Filters and gates hide empty things; they never drop content. Ask what happens to the
  non-matching data. Playbook: no-silent-data-drop.
- One message per failure mode; a disabled control must be pressable and say why; error
  level is for terminal states only. Playbook: honest-failure-surfacing.
- A check that cannot go red is not a check — ask what it prints when the thing is broken.
  Playbook: prove-it-can-fail.
- Agent and reviewer findings are evidence, not conclusions: re-derive Critical/High and
  regulatory claims from the primary source before acting. Playbook: findings-are-evidence.

When closing a lessons-learned entry in any repo, add one line: "skill that should have
prevented this: <name> / none - new candidate". That line is the library's misses log.
When the incident is the first of its kind but the class is plainly broader than the
instance, add a second line: "class: <the general category the next instance will belong
to>", so the second instance reads as recurrence rather than novelty when it lands.
<!-- END CLAUDE-SKILLS NORMS v2026-07-29 -->
