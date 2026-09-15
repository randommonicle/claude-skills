#!/usr/bin/env node
// Not a hook: a CLI, run unattended by Windows Task Scheduler (see HOOKS.md).
// Fast-forwards this skills library so the live install never runs month-old
// hooks. Deterministic by design - it decides from git state alone and never
// asks a model anything. session-recon.mjs surfaces the result at the next
// session start, so an unattended failure is visible instead of rotting.
//
//   node hooks/update-skills.mjs [--repo <path>] [--dry-run]
//
// Exit 0: current | updated.   Exit 1: anything a human should look at.
import { spawnSync } from 'node:child_process';
import { writeFileSync, existsSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// argv form, never a shell string: a repo path is untrusted text and
// interpolating it into a shell command would make this injectable. Same rule
// session-recon.mjs and lint-after-edit state.
function git(cwd, args, timeout = 20000) {
  const r = spawnSync('git', ['-C', cwd, ...args], { timeout, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error) return { ok: false, out: '', err: String(r.error.message) };
  return { ok: r.status === 0, out: (r.stdout ?? '').trim(), err: (r.stderr ?? '').trim() };
}

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const repoArg = argv.includes('--repo') ? argv[argv.indexOf('--repo') + 1] : null;

// Default to the repo this script lives in, so the file is portable between
// machines and checkouts. realpath means entering via a junction resolves to
// the one real path instead of treating it as a second repo.
const here = dirname(fileURLToPath(import.meta.url));
let repo = resolve(repoArg ?? join(here, '..'));
if (existsSync(repo)) repo = realpathSync(repo);

// The status file lives BESIDE the repo, never inside it: nothing to gitignore
// and nothing that can be committed by accident.
const statusPath = resolve(repo, '..', 'skills-update.json');

function finish(state, detail = {}) {
  const record = { state, at: new Date().toISOString(), repo, ...detail };
  if (!dryRun) {
    try { writeFileSync(statusPath, JSON.stringify(record, null, 2) + '\n', 'utf8'); }
    catch (e) { console.error(`could not write ${statusPath}: ${e.message}`); }
  }
  console.log(JSON.stringify(record, null, 2));
  process.exit(state === 'current' || state === 'updated' ? 0 : 1);
}

if (!existsSync(join(repo, '.git'))) finish('error', { reason: `not a git repository: ${repo}` });

// Guard: this script fast-forwards without asking, so it must never be able to
// do that to a client repo if someone points it at one by mistake.
const remote = git(repo, ['remote', 'get-url', 'origin']);
if (!remote.ok) finish('error', { reason: 'no origin remote' });
if (!/claude-skills(\.git)?$/i.test(remote.out.replace(/\/+$/, ''))) {
  finish('error', { reason: `refusing: origin is not a claude-skills repo (${remote.out})` });
}

const fetched = git(repo, ['fetch', '--quiet', '--prune', 'origin'], 60000);
if (!fetched.ok) finish('error', { reason: `fetch failed: ${fetched.err || 'unknown'}` });

const upstream = git(repo, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
if (!upstream.ok) finish('error', { reason: 'no upstream tracking branch' });

const counts = git(repo, ['rev-list', '--left-right', '--count', `HEAD...${upstream.out}`]);
if (!counts.ok) finish('error', { reason: 'could not compare with upstream' });
const [ahead, behind] = counts.out.split(/\s+/).map(Number);

const from = git(repo, ['rev-parse', 'HEAD']).out;
const to = git(repo, ['rev-parse', upstream.out]).out;
const base = { from, to, ahead, behind, upstream: upstream.out };

if (ahead > 0 && behind > 0) finish('skipped-diverged', base);
if (ahead > 0) finish('skipped-ahead', base);
if (behind === 0) finish('current', { from, upstream: upstream.out });

// Untracked files never block a fast-forward, and this clone always carries
// machine-local logs, so only TRACKED changes count as dirty. A genuine
// collision still fails loudly below as an error.
const dirty = git(repo, ['status', '--porcelain', '--untracked-files=no']);
if (!dirty.ok) finish('error', { reason: 'could not read working tree state' });
if (dirty.out) finish('skipped-dirty', { ...base, changes: dirty.out.split('\n').slice(0, 10) });

if (dryRun) finish('updated', { ...base, dryRun: true });

const merged = git(repo, ['merge', '--ff-only', upstream.out]);
if (!merged.ok) finish('error', { ...base, reason: `ff-only merge failed: ${merged.err || merged.out}` });

// verify-the-effect: the merge's exit code is a proxy. Assert HEAD actually moved.
const now = git(repo, ['rev-parse', 'HEAD']).out;
if (now !== to) finish('error', { ...base, now, reason: 'merge reported success but HEAD is not at upstream' });

const changed = git(repo, ['diff', '--name-only', `${from}..${to}`]).out.split('\n').filter(Boolean);
finish('updated', {
  ...base,
  commits: behind,
  hooksChanged: changed.some((f) => f.startsWith('hooks/')),
  skillsChanged: changed.some((f) => f.endsWith('SKILL.md')),
});
