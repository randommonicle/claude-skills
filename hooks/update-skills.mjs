#!/usr/bin/env node
// Not a hook: a CLI, run unattended by Windows Task Scheduler (see HOOKS.md).
// Fast-forwards this skills library so the live install never runs month-old
// hooks. Deterministic by design - it decides from git state alone and never
// asks a model anything. session-recon.mjs surfaces the result at the next
// session start, so an unattended failure is visible instead of rotting.
//
// Then the mirrors, if ../skills-mirrors.json lists any (machine-local, beside the
// repo like the status file): each extra checkout of this library is
// fast-forwarded under the same rules, and each port is refreshed by
// sync-port.mjs, only when the library itself read current or updated.
//
//   node hooks/update-skills.mjs [--repo <path>] [--dry-run]
//
// Exit 0: current | updated, and every mirror current | updated | synced.
// Exit 1: anything a human should look at.
import { spawnSync } from 'node:child_process';
import { writeFileSync, existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncPort } from './sync-port.mjs';

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
const real = (p) => (existsSync(p) ? realpathSync(p) : p);
const here = dirname(fileURLToPath(import.meta.url));
const repo = real(resolve(repoArg ?? join(here, '..')));

// The status and mirrors files live BESIDE the repo, never inside it: nothing to
// gitignore and nothing that can be committed by accident.
const statusPath = resolve(repo, '..', 'skills-update.json');
const mirrorsPath = resolve(repo, '..', 'skills-mirrors.json');

// 'none' is an OK state, not a failure: a machine with no mirrors configured is a normal
// machine. It is in the record rather than omitted from it so the absence is visible --
// see updateMirrors.
const OK = new Set(['current', 'updated', 'synced', 'none']);

// One checkout, one record. Returns rather than exits, so the same rules run for
// the library and for each mirror checkout.
function updateRepo(repo) {
  const done = (state, detail = {}) => ({ state, repo, ...detail });
  if (!existsSync(join(repo, '.git'))) return done('error', { reason: `not a git repository: ${repo}` });

  // Guard: this fast-forwards without asking, so it must never be able to do
  // that to a client repo if someone points it at one by mistake.
  const remote = git(repo, ['remote', 'get-url', 'origin']);
  if (!remote.ok) return done('error', { reason: 'no origin remote' });
  if (!/claude-skills(\.git)?$/i.test(remote.out.replace(/\/+$/, ''))) {
    return done('error', { reason: `refusing: origin is not a claude-skills repo (${remote.out})` });
  }

  const fetched = git(repo, ['fetch', '--quiet', '--prune', 'origin'], 60000);
  if (!fetched.ok) return done('error', { reason: `fetch failed: ${fetched.err || 'unknown'}` });

  const upstream = git(repo, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  if (!upstream.ok) return done('error', { reason: 'no upstream tracking branch' });

  const counts = git(repo, ['rev-list', '--left-right', '--count', `HEAD...${upstream.out}`]);
  if (!counts.ok) return done('error', { reason: 'could not compare with upstream' });
  const [ahead, behind] = counts.out.split(/\s+/).map(Number);

  const from = git(repo, ['rev-parse', 'HEAD']).out;
  const to = git(repo, ['rev-parse', upstream.out]).out;
  const base = { from, to, ahead, behind, upstream: upstream.out };

  if (ahead > 0 && behind > 0) return done('skipped-diverged', base);
  if (ahead > 0) return done('skipped-ahead', base);
  if (behind === 0) return done('current', { from, upstream: upstream.out });

  // Untracked files never block a fast-forward, and this clone always carries
  // machine-local logs, so only TRACKED changes count as dirty. A genuine
  // collision still fails loudly below as an error.
  const dirty = git(repo, ['status', '--porcelain', '--untracked-files=no']);
  if (!dirty.ok) return done('error', { reason: 'could not read working tree state' });
  if (dirty.out) return done('skipped-dirty', { ...base, changes: dirty.out.split('\n').slice(0, 10) });

  if (dryRun) return done('updated', { ...base, dryRun: true });

  const merged = git(repo, ['merge', '--ff-only', upstream.out]);
  if (!merged.ok) return done('error', { ...base, reason: `ff-only merge failed: ${merged.err || merged.out}` });

  // verify-the-effect: the merge's exit code is a proxy. Assert HEAD actually moved.
  const now = git(repo, ['rev-parse', 'HEAD']).out;
  if (now !== to) return done('error', { ...base, now, reason: 'merge reported success but HEAD is not at upstream' });

  const changed = git(repo, ['diff', '--name-only', `${from}..${to}`]).out.split('\n').filter(Boolean);
  return done('updated', {
    ...base,
    commits: behind,
    hooksChanged: changed.some((f) => f.startsWith('hooks/')),
    skillsChanged: changed.some((f) => f.endsWith('SKILL.md')),
  });
}

function updateMirrors(library) {
  // An absent config SAYS so. It used to return null, which omitted the `mirrors` key from
  // the status file entirely and left `(mirrors ?? []).every(...)` vacuously true, so the
  // run reported "current" and exited 0 while keeping nothing beyond the library current.
  // On 2026-11-05 that had been the state since the feature shipped on 2026-11-01: the
  // config was never created on this machine, ~/.agents/skills was 295 commits behind, and
  // every scheduled run reported success. A feature that is switched off must be legible as
  // off, not indistinguishable from a feature that ran.
  if (!existsSync(mirrorsPath)) {
    return [{ kind: 'config', path: mirrorsPath, state: 'none', reason: 'no mirrors configured on this machine; only the library itself is kept current' }];
  }
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(mirrorsPath, 'utf8'));
  } catch (e) {
    return [{ kind: 'config', path: mirrorsPath, state: 'error', reason: `unreadable: ${e.message}` }];
  }
  // A config that exists and lists nothing is the same hole as a config that does not
  // exist: `out` stays empty, `every()` is vacuously true, and the run reports success
  // for a capability that did nothing. Yesterday's fix (2026-11-05) covered the absent
  // file and left this neighbouring case, which is enumerate-the-set rule 1 -- the set
  // here is {absent, present but empty, populated} and only one member was decided.
  // Reached for real on 2026-11-06, when ~/.agents/skills had to come out of `checkouts`.
  // `note` is optional and machine-local; it travels into the report so the reason for
  // an empty config is visible at every run rather than living only in a commit message.
  if ((cfg.checkouts ?? []).length === 0 && (cfg.ports ?? []).length === 0) {
    return [{
      kind: 'config',
      path: mirrorsPath,
      state: 'none',
      reason: cfg.note || 'the mirrors config lists no checkouts and no ports, so only the library itself is kept current',
    }];
  }

  const out = [];
  for (const c of cfg.checkouts ?? []) {
    const path = real(resolve(c));
    if (path === repo) continue; // the library itself, entered by another name
    const { repo: _, ...rec } = updateRepo(path);
    out.push({ kind: 'checkout', path, ...rec });
  }
  // A port copies from HEAD, so only a HEAD known to match origin is copied.
  for (const p of cfg.ports ?? []) {
    out.push(OK.has(library.state) ? syncPort(repo, p, { dryRun }) : { kind: 'port', path: p, state: 'skipped', reason: `library is ${library.state}` });
  }
  return out;
}

const library = updateRepo(repo);
const mirrors = updateMirrors(library);
const record = { ...library, at: new Date().toISOString(), mirrors };
if (!dryRun) {
  try { writeFileSync(statusPath, JSON.stringify(record, null, 2) + '\n', 'utf8'); }
  catch (e) { console.error(`could not write ${statusPath}: ${e.message}`); }
}
console.log(JSON.stringify(record, null, 2));
process.exitCode = OK.has(library.state) && mirrors.every((m) => OK.has(m.state)) ? 0 : 1;
