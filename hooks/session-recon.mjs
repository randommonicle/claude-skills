#!/usr/bin/env node
// SessionStart hook. parallel-work-recon's session-start half, mechanised:
// fetch, branch/PR state, and recent cross-ref log, injected as
// additionalContext so every session opens with live repo state instead of a
// stale snapshot. Fail-open: any error or timeout yields no context, never a
// broken session. The pre-commit re-run stays behavioural in the skill —
// this hook only covers session start.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// update-skills.mjs writes this beside the repo after each unattended run. Stay
// SILENT while the library is current: a line appears only when something wants
// a human, so a stopped updater cannot read as a healthy one. A missing file is
// not a fault (the scheduled task is per-machine and may never have been set up);
// a STALE one is, because it means the task ran once and then stopped.
const STALE_HOURS = 36;

function skillsUpdateLine() {
  try {
    const statusPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'skills-update.json');
    if (!existsSync(statusPath)) return null;
    const s = JSON.parse(readFileSync(statusPath, 'utf8'));
    const ageHours = (Date.now() - Date.parse(s.at)) / 3600000;

    if (!Number.isFinite(ageHours)) return 'skills library: update status file is unreadable (' + statusPath + ').';
    if (ageHours > STALE_HOURS)
      return (
        'skills library: no update run for ' + Math.round(ageHours) + 'h (last state: ' + s.state + '). ' +
        'The scheduled task may have stopped - run: node hooks/update-skills.mjs'
      );
    if (s.state === 'current') return null;
    if (s.state === 'updated') {
      const what = [s.hooksChanged ? 'hooks' : null, s.skillsChanged ? 'skills' : null].filter(Boolean).join(' and ');
      if (!what) return null;
      return (
        'skills library: fast-forwarded ' + s.commits + ' commit(s) at ' + s.at + '; ' + what +
        ' changed, so this session is the first to load them.'
      );
    }
    return (
      'skills library: the update did NOT run cleanly (' + s.state + (s.reason ? ': ' + s.reason : '') + '). ' +
      'The library may be behind - fix this before relying on its hooks.'
    );
  } catch {
    return null;
  }
}

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
    const parts = [];

    // Read first: the library's own health matters wherever the session opens,
    // including a directory that is not a repo at all.
    const update = skillsUpdateLine();
    if (update) parts.push(update);

    if (existsSync(join(cwd, '.git'))) {
      run('git', ['-C', cwd, 'fetch', '--quiet'], 8000);
      const status = run('git', ['-C', cwd, 'status', '-sb']);
      const log = run('git', ['-C', cwd, 'log', '--oneline', '--decorate', '--all', '-8']);
      const prs = run('gh', ['pr', 'list', '--state', 'open', '--limit', '10'], 8000);

      if (status) parts.push(`status:\n${status}`);
      if (log) parts.push(`recent commits (all refs, post-fetch):\n${log}`);
      if (prs) parts.push(`open PRs:\n${prs}`);
    }
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
