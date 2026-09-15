#!/usr/bin/env node
// Proves session-recon.mjs surfaces the skills library's update health, and is
// SILENT while the library is current. The hook is copied into a throwaway tree
// so the status path it derives from its own location is isolated from the real
// ~/.claude/skills-update.json.
//
// It reds against: a version that reads the status only after the .git check
// (case 8 goes quiet in a non-repo directory), a version with no staleness
// branch (case 6 goes quiet, so a scheduled task that stopped reads as healthy),
// and a version that mentions the library when all is well (cases 2 and 4).
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
function stage(status, { cwdIsRepo = false } = {}) {
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

const cases = [];
const test = (name, fn) => cases.push([name, fn]);

test('no status file at all stays silent', async (s) => {
  const r = await runHook(s);
  if (r.code !== 0) return 'exit ' + r.code;
  if (/skills library/i.test(r.out)) return 'mentioned the library with no status file';
  return true;
});

test('state=current and fresh stays silent', async (s) => {
  const r = await runHook(s);
  if (/skills library/i.test(r.out)) return 'mentioned the library while it is current';
  return true;
});

test('state=updated with hooks changed says so', async (s) => {
  const r = await runHook(s);
  if (!/skills library/i.test(r.context)) return 'no mention of the update';
  if (!/hooks/i.test(r.context)) return 'did not name hooks as the thing that changed';
  return true;
});

test('state=updated with nothing notable changed stays silent', async (s) => {
  const r = await runHook(s);
  if (/skills library/i.test(r.out)) return 'noise for a docs-only fast-forward';
  return true;
});

test('a refusal is reported as not clean', async (s) => {
  const r = await runHook(s);
  if (!/did NOT run cleanly/i.test(r.context)) return 'refusal not surfaced: ' + r.context;
  if (!/skipped-dirty/.test(r.context)) return 'state not named';
  return true;
});

test('a stale status file is reported even though its state is healthy', async (s) => {
  const r = await runHook(s);
  if (!/no update run for/i.test(r.context)) return 'staleness not surfaced: ' + r.context;
  return true;
});

test('a malformed status file fails open and stays quiet', async (s) => {
  const r = await runHook(s);
  if (r.code !== 0) return 'exit ' + r.code + ' (must never break a session)';
  if (/skills library/i.test(r.out)) return 'reported on an unparseable file';
  return true;
});

test('an unhealthy library is reported even when cwd is not a repo', async (s) => {
  const r = await runHook(s);
  if (!/skills library/i.test(r.context)) return 'silent in a non-repo directory';
  return true;
});

test('in a repo, both the library line and the repo status appear', async (s) => {
  const r = await runHook(s);
  if (!/skills library/i.test(r.context)) return 'library line missing';
  if (!/status:/.test(r.context)) return 'repo status missing: ' + r.context;
  return true;
});

const fixtures = [
  null,
  { state: 'current', at: hoursAgo(2) },
  { state: 'updated', at: hoursAgo(2), commits: 4, hooksChanged: true, skillsChanged: false },
  { state: 'updated', at: hoursAgo(2), commits: 4, hooksChanged: false, skillsChanged: false },
  { state: 'skipped-dirty', at: hoursAgo(2) },
  { state: 'current', at: hoursAgo(48) },
  '{ not json',
  { state: 'error', at: hoursAgo(1), reason: 'fetch failed' },
  { state: 'error', at: hoursAgo(1), reason: 'fetch failed' },
];
const opts = [{}, {}, {}, {}, {}, {}, {}, {}, { cwdIsRepo: true }];

const run = async () => {
  for (let i = 0; i < cases.length; i++) {
    const [name, fn] = cases[i];
    const s = stage(fixtures[i], opts[i]);
    try {
      const r = await fn(s);
      if (r === true) pass(name);
      else fail(name + ' -> ' + r);
    } catch (e) {
      fail(name + ' -> threw ' + e.message);
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
