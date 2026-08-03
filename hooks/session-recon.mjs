#!/usr/bin/env node
// SessionStart hook. parallel-work-recon's session-start half, mechanised:
// fetch, branch/PR state, and recent cross-ref log, injected as
// additionalContext so every session opens with live repo state instead of a
// stale snapshot. Fail-open: any error or timeout yields no context, never a
// broken session. The pre-commit re-run stays behavioural in the skill —
// this hook only covers session start.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// argv form, never a shell string. cwd is untrusted text: a directory name may
// legally contain a double quote on POSIX, and interpolating it into a shell
// command made this hook injectable. The .git test below is not a defence, since
// a crafted directory can hold a .git entry, and a ';' payload executes
// regardless of git's exit status. Same rule lint-after-edit already states.
function run(bin, args, timeout = 6000) {
  const r = spawnSync(bin, args, { timeout, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  if (r.error || r.status !== 0) return null;
  return r.stdout.trim();
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const cwd = evt.cwd ?? process.cwd();
    if (!existsSync(join(cwd, '.git'))) process.exit(0);

    run('git', ['-C', cwd, 'fetch', '--quiet'], 8000);
    const status = run('git', ['-C', cwd, 'status', '-sb']);
    const log = run('git', ['-C', cwd, 'log', '--oneline', '--decorate', '--all', '-8']);
    const prs = run('gh', ['pr', 'list', '--state', 'open', '--limit', '10'], 8000);

    const parts = [];
    if (status) parts.push(`status:\n${status}`);
    if (log) parts.push(`recent commits (all refs, post-fetch):\n${log}`);
    if (prs) parts.push(`open PRs:\n${prs}`);
    if (!parts.length) process.exit(0);

    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext:
            'parallel-work-recon (SessionStart hook) — live repo state at session start. ' +
            'This is a snapshot, not a lease: re-run fetch + pr list immediately before any commit or merge.\n\n' +
            parts.join('\n\n'),
        },
      }),
    );
  } catch {}
  process.exit(0);
});
