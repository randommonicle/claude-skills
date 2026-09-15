#!/usr/bin/env node
// Proves session-recon.mjs surfaces the skills library's update health, is
// SILENT while the library is current, and names a DIFFERENT action for each
// way the updater can refuse. The hook is copied into a throwaway tree so the
// status path it derives from its own location is isolated from the real
// ~/.claude/skills-update.json.
//
// It reds against: a version that reads the status only after the .git check
// (the non-repo case goes quiet), a version with no staleness branch (a
// scheduled task that stopped reads as healthy), a version that mentions the
// library when all is well, and a version that gives every refusal the same
// message (the ahead case is told it is "behind", which is the opposite).
// Run: node hooks/session-recon.test.mjs
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'session-recon.mjs');
let fails = 0;
const pass = (m) => console.log('PASS  | ' + m);
const fail = (m) => {
  console.log('FAIL  | ' + m);
  fails++;
};

const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();

// <root>/repo/hooks/session-recon.mjs, so the hook resolves its status file to
// <root>/skills-update.json exactly as it does beside the real library.
function stage(status, cwdIsRepo) {
  const root = mkdtempSync(join(tmpdir(), 'recon-'));
  mkdirSync(join(root, 'repo', 'hooks'), { recursive: true });
  copyFileSync(HOOK, join(root, 'repo', 'hooks', 'session-recon.mjs'));
  if (status !== null) {
    writeFileSync(
      join(root, 'skills-update.json'),
      typeof status === 'string' ? status : JSON.stringify(status),
      'utf8',
    );
  }
  const cwd = join(root, 'session-dir');
  mkdirSync(cwd, { recursive: true });
  if (cwdIsRepo) {
    // No remote: `git fetch` fails and the hook ignores it, so this stays offline.
    spawnSync('git', ['init', '-q', '-b', 'main', cwd], { encoding: 'utf8' });
    writeFileSync(join(cwd, 'f.txt'), 'x\n');
    spawnSync('git', ['-C', cwd, 'add', '-A'], { encoding: 'utf8' });
    spawnSync('git', ['-C', cwd, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'init'], {
      encoding: 'utf8',
    });
  }
  return { root, hook: join(root, 'repo', 'hooks', 'session-recon.mjs'), cwd };
}

function runHook(s) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [s.hook], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (c) => (out += c));
    p.on('close', (code) => {
      let context = '';
      try {
        context = JSON.parse(out).hookSpecificOutput.additionalContext;
      } catch {}
      resolve({ code, out, context });
    });
    p.stdin.end(JSON.stringify({ cwd: s.cwd }));
  });
}

// Each case carries its own fixture: parallel arrays let a case silently run
// against the wrong status file, which is the failure this suite exists to catch
// in other people's code.
const cases = [];
const test = (name, fixture, fn, cwdIsRepo = false) => cases.push({ name, fixture, fn, cwdIsRepo });

test('no status file at all stays silent', null, async (r) => {
  if (r.code !== 0) return 'exit ' + r.code;
  if (/skills library/i.test(r.out)) return 'mentioned the library with no status file';
  return true;
});

test('state=current and fresh stays silent', { state: 'current', at: hoursAgo(2) }, async (r) => {
  if (/skills library/i.test(r.out)) return 'mentioned the library while it is current';
  return true;
});

test(
  'state=updated with hooks changed says so',
  { state: 'updated', at: hoursAgo(2), commits: 4, hooksChanged: true, skillsChanged: false },
  async (r) => {
    if (!/skills library/i.test(r.context)) return 'no mention of the update';
    if (!/hooks/i.test(r.context)) return 'did not name hooks as the thing that changed';
    return true;
  },
);

test(
  'state=updated with nothing notable changed stays silent',
  { state: 'updated', at: hoursAgo(2), commits: 4, hooksChanged: false, skillsChanged: false },
  async (r) => {
    if (/skills library/i.test(r.out)) return 'noise for a docs-only fast-forward';
    return true;
  },
);

test('a dirty refusal asks for the action that clears it', { state: 'skipped-dirty', at: hoursAgo(2) }, async (r) => {
  if (!/skills library/i.test(r.context)) return 'refusal not surfaced: ' + r.context;
  if (!/commit or stash/i.test(r.context)) return 'did not name the fix: ' + r.context;
  if (/behind/i.test(r.context)) return 'called a dirty tree "behind": ' + r.context;
  return true;
});

test(
  'an ahead refusal asks to push, and never calls the library behind',
  { state: 'skipped-ahead', at: hoursAgo(2), ahead: 2, behind: 0 },
  async (r) => {
    if (!/push them/i.test(r.context)) return 'did not name the fix: ' + r.context;
    if (/behind/i.test(r.context)) return 'an AHEAD library described as behind: ' + r.context;
    if (!/2 local commit/.test(r.context)) return 'did not carry the count: ' + r.context;
    return true;
  },
);

test(
  'a stale status file is reported even though its state is healthy',
  { state: 'current', at: hoursAgo(48) },
  async (r) => {
    if (!/no update run for/i.test(r.context)) return 'staleness not surfaced: ' + r.context;
    return true;
  },
);

test('a malformed status file fails open and stays quiet', '{ not json', async (r) => {
  if (r.code !== 0) return 'exit ' + r.code + ' (must never break a session)';
  if (/skills library/i.test(r.out)) return 'reported on an unparseable file';
  return true;
});

test(
  'an unhealthy library is reported even when cwd is not a repo',
  { state: 'error', at: hoursAgo(1), reason: 'fetch failed' },
  async (r) => {
    if (!/skills library/i.test(r.context)) return 'silent in a non-repo directory';
    if (!/fetch failed/.test(r.context)) return 'dropped the reason: ' + r.context;
    return true;
  },
);

test(
  'in a repo, both the library line and the repo status appear',
  { state: 'error', at: hoursAgo(1), reason: 'fetch failed' },
  async (r) => {
    if (!/skills library/i.test(r.context)) return 'library line missing';
    if (!/status:/.test(r.context)) return 'repo status missing: ' + r.context;
    return true;
  },
  true,
);

const run = async () => {
  for (const c of cases) {
    const s = stage(c.fixture, c.cwdIsRepo);
    try {
      const r = await c.fn(await runHook(s));
      if (r === true) pass(c.name);
      else fail(c.name + ' -> ' + r);
    } catch (e) {
      fail(c.name + ' -> threw ' + e.message);
    } finally {
      try {
        rmSync(s.root, { recursive: true, force: true });
      } catch {}
    }
  }
  console.log(fails ? '\n' + fails + ' case(s) failed' : '\nall cases passed');
  process.exit(fails ? 1 : 0);
};
run();
