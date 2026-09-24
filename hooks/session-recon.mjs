#!/usr/bin/env node
// SessionStart hook. parallel-work-recon's session-start half, mechanised:
// fetch, branch/PR state, and recent cross-ref log, injected as
// additionalContext so every session opens with live repo state instead of a
// stale snapshot. Fail-open: any error or timeout yields no context, never a
// broken session. The pre-commit re-run stays behavioural in the skill —
// this hook only covers session start. It also checks that this machine's
// CLAUDE.md still carries the Layer 1 norm block (normsLine, below).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// NORMS.md's block is pasted by hand into each direct-clone machine's CLAUDE.md, and
// nothing checked the paste: on 2026-09-24 the home machine was found with no block at
// all and no record of when it went (LESSONS_LEARNED entry 23). Compare the two, line
// endings aside, and say so when they differ. Only the direct-clone layout is checked,
// the library at <config>/skills beside <config>/CLAUDE.md; a plugin install gets the
// block from norms-inject, and in any other layout CLAUDE.md's place is unknown, so
// both stay silent rather than raise a false alarm. Fail-open.
const NORM_BLOCK = /<!-- BEGIN CLAUDE-SKILLS NORMS([^>]*)-->[\s\S]*?<!-- END CLAUDE-SKILLS NORMS[^>]*-->/;

function normsLine() {
  try {
    if (process.env.CLAUDE_PLUGIN_ROOT) return null;
    const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    if (basename(repo) !== 'skills') return null;
    const normsPath = join(repo, 'NORMS.md');
    const canon = NORM_BLOCK.exec(readFileSync(normsPath, 'utf8').replace(/\r\n/g, '\n'));
    if (!canon) return null;
    const claudeMd = join(repo, '..', 'CLAUDE.md');
    const paste = ' Paste the block from ' + normsPath + ', markers included.';
    if (!existsSync(claudeMd))
      return 'Layer 1 norms: ' + claudeMd + ' does not exist, so the always-on norms are not loaded in this session.' + paste;
    const live = NORM_BLOCK.exec(readFileSync(claudeMd, 'utf8').replace(/\r\n/g, '\n'));
    if (!live)
      return 'Layer 1 norms: ' + claudeMd + ' has no CLAUDE-SKILLS NORMS block, so the always-on norms are not loaded in this session.' + paste;
    if (live[0] === canon[0]) return null;
    const had = live[1].trim() || 'unversioned', want = canon[1].trim();
    return (
      'Layer 1 norms: the block in ' + claudeMd +
      (had === want ? ' differs from NORMS.md under the same marker (' + want + ').' : ' is ' + had + ' but NORMS.md is ' + want + '.') +
      ' Re-paste it from ' + normsPath + '.'
    );
  } catch {
    return null;
  }
}

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
    // One message per failure mode: these four states want four different
    // actions, and "the library may be behind" is simply untrue of an ahead one.
    const advice = {
      'skipped-ahead':
        (s.ahead ?? '?') + ' local commit(s) are not on origin, so the update is holding off. ' +
        'Push them, or the other machine never sees them.',
      'skipped-dirty': 'uncommitted changes are blocking the fast-forward. Commit or stash them.',
      'skipped-diverged':
        'local and origin have diverged (' + (s.ahead ?? '?') + ' ahead, ' + (s.behind ?? '?') + ' behind). ' +
        'Reconcile by hand; the updater will not touch it.',
      error: 'the updater could not run' + (s.reason ? ' - ' + s.reason : '') + '.',
    };
    return 'skills library: ' + (advice[s.state] ?? 'unrecognised update state "' + s.state + '".') +
      ' (last run ' + s.at + ')';
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
    const norms = normsLine();
    if (norms) parts.push(norms);
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
        // Missing norms are shown to the person too: the model-only context is where
        // this drift went unnoticed.
        ...(norms ? { systemMessage: norms } : {}),
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
