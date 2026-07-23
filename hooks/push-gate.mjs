#!/usr/bin/env node
// PreToolUse hook, matcher: Bash. Mechanical enforcement of confirm-before-push:
// any push, PR merge, or remote branch deletion gets permissionDecision "ask",
// forcing the per-action prompt regardless of session permission mode.
// This is the library's one fail-closed-by-intent gate (proposal doc, Layer 0).
// On script error it exits 0 (cannot match what it cannot parse) — the skill
// remains the behavioural backstop for that residual case.

const GATED = [
  /\bgit\s+push\b/, // includes --force and push-based remote branch deletion
  /\bgh\s+pr\s+merge\b/,
  /\bgh\s+api\b.*-X\s+DELETE.*\/git\/refs\//,
];

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const cmd = evt.tool_input?.command ?? '';
    if (GATED.some((re) => re.test(cmd))) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'ask',
            permissionDecisionReason:
              'confirm-before-push: pushes, PR merges and remote branch deletion need per-action confirmation. Branch deletion also needs the preflight (gh pr list --head/--base, git log main..branch).',
          },
        }),
      );
    }
  } catch {}
  process.exit(0);
});
