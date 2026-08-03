#!/usr/bin/env node
// PreToolUse hook, matcher: Bash. Mechanical enforcement of confirm-before-push:
// any push, PR merge, or remote branch deletion gets permissionDecision "ask",
// forcing the per-action prompt regardless of session permission mode.
// One of the library's two fail-closed-by-intent gates (proposal doc, Layer 0;
// the other is sql-surgery-warn, promoted 2026-07-29).
// On script error it exits 0 (cannot match what it cannot parse) — the skill
// remains the behavioural backstop for that residual case.
//
// The ask also carries freshness evidence. A session's knowledge of remote state
// is a snapshot whose half-life is however long until another session pushes.
// Measured: on 2026-07-19 a session duplicated a full session's work because the
// start-of-session check was treated as true all day; on 2026-07-28 a push landed
// into a merge queue that a parallel session had already filled. The push prompt
// is the one moment the user already stops to read, so the freshness evidence
// belongs inside it. This adds no new gate (R-21 unchanged); it makes the
// existing ask carry live evidence.
// Latency: the fetch runs only on a matched push/merge command, never on ordinary
// Bash calls. Decoration only: if cwd is not a repo, git is missing, or a probe
// times out, the original reason is emitted unchanged. A failed freshness probe
// must never be the reason this gate does not ask.
import { spawnSync } from 'node:child_process';

const GATED = [
  /\bgit\s+push\b/, // includes --force and push-based remote branch deletion
  /\bgh\s+pr\s+merge\b/,
  /\bgh\s+api\b.*-X\s+DELETE.*\/git\/refs\//,
];

const REASON =
  'confirm-before-push: pushes, PR merges and remote branch deletion need per-action confirmation. Branch deletion also needs the preflight (gh pr list --head/--base, git log main..branch).';

// argv form, never a shell string. cwd is untrusted text: a directory name may
// legally contain a double quote on POSIX, and interpolating it into a shell
// command made this hook injectable, since a ';' payload executes regardless of
// git's exit status and the strict 'true' test below runs only afterwards. Same
// rule lint-after-edit already states for the edited path.
function run(args, timeout = 6000, withStderr = false) {
  const r = spawnSync('git', args, {
    timeout,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', withStderr ? 'pipe' : 'ignore'],
  });
  if (r.error || r.status !== 0) return null;
  return `${r.stdout}${withStderr ? r.stderr : ''}`.trim();
}

// Live remote state for the prompt. '' on anything short of two clean probes:
// the caller must be able to append this unconditionally, so it never throws.
// The strict 'true' test is what keeps a surprising cwd out of the later probes.
function freshness(cwd) {
  try {
    if (run(['-C', cwd, 'rev-parse', '--is-inside-work-tree']) !== 'true') return '';
    const fetched = run(['-C', cwd, 'fetch'], 6000, true); // ref updates print to stderr
    const status = run(['-C', cwd, 'status', '-sb']);
    if (fetched === null || status === null) return '';
    const moved = fetched
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => !l.startsWith('From ') && (l.includes('..') || l.includes('->')));
    return (
      '\n\nFreshness, probed now rather than at session start: ' +
      (moved.length
        ? `origin moved during this session:\n${moved.slice(0, 5).join('\n')}`
        : 'origin unchanged at fetch time') +
      `\n${status.split('\n')[0]}`
    );
  } catch {
    return '';
  }
}

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
            permissionDecisionReason: REASON + freshness(evt.cwd ?? process.cwd()),
          },
        }),
      );
    }
  } catch {}
  process.exit(0);
});
