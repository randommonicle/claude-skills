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
// The norm-block cases (2026-09-24) red against a version with no check, one that
// compares line endings (a CRLF CLAUDE.md reads as drift), one that runs under a
// plugin install or an unknown layout (a false alarm on every session there), one
// that tells only the model, and one that reports a NORMS.md it cannot parse.
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

// <root>/skills/hooks/session-recon.mjs, so the hook resolves its status file to
// <root>/skills-update.json, NORMS.md to <root>/skills/NORMS.md and CLAUDE.md to
// <root>/CLAUDE.md exactly as it does beside the real library. `norms.dir` stages
// another layout; a null normsMd or claudeMd leaves that file out.
function stage(status, cwdIsRepo, norms = null) {
  const root = mkdtempSync(join(tmpdir(), 'recon-'));
  const lib = join(root, norms?.dir ?? 'skills');
  mkdirSync(join(lib, 'hooks'), { recursive: true });
  copyFileSync(HOOK, join(lib, 'hooks', 'session-recon.mjs'));
  if (norms?.normsMd != null) writeFileSync(join(lib, 'NORMS.md'), norms.normsMd, 'utf8');
  if (norms?.claudeMd != null) writeFileSync(join(root, 'CLAUDE.md'), norms.claudeMd, 'utf8');
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
  return { root, hook: join(lib, 'hooks', 'session-recon.mjs'), cwd, env: norms?.env ?? {} };
}

function runHook(s) {
  return new Promise((resolve) => {
    // A plugin marker inherited from whoever runs the suite would skip the norm check.
    const env = { ...process.env, ...s.env };
    if (!('CLAUDE_PLUGIN_ROOT' in s.env)) delete env.CLAUDE_PLUGIN_ROOT;
    const p = spawn(process.execPath, [s.hook], { stdio: ['pipe', 'pipe', 'pipe'], env });
    let out = '';
    p.stdout.on('data', (c) => (out += c));
    p.on('close', (code) => {
      let context = '', system = '';
      try {
        const o = JSON.parse(out);
        context = o.hookSpecificOutput.additionalContext;
        system = o.systemMessage ?? '';
      } catch {}
      resolve({ code, out, context, system });
    });
    p.stdin.end(JSON.stringify({ cwd: s.cwd }));
  });
}

// Each case carries its own fixture: parallel arrays let a case silently run
// against the wrong status file, which is the failure this suite exists to catch
// in other people's code.
const cases = [];
const test = (name, fixture, fn, cwdIsRepo = false, norms = null) => cases.push({ name, fixture, fn, cwdIsRepo, norms });

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

// The norm block, 2026-09-24. Each silent case also stages an unhealthy update status,
// so the hook must visibly run: a crash exits 0 with nothing, which would otherwise
// pass as silence (prove-it-can-fail rule 10).
const block = (v, body = 'norm one\nnorm two') =>
  `<!-- BEGIN CLAUDE-SKILLS NORMS ${v} -->\n${body}\n<!-- END CLAUDE-SKILLS NORMS ${v} -->`;
const NORMS_MD = '# Layer 1 norms\n\n' + block('v2026-07-29') + '\n\nafter the block\n';
const NO_BLOCK = '# Global rules\n\nno norm block here\n';
const unhealthy = { state: 'error', at: hoursAgo(1), reason: 'staged fault' };
const ranAndSaidNothingAboutNorms = (r) => {
  if (r.code !== 0) return 'exit ' + r.code;
  if (!/staged fault/.test(r.context)) return 'the hook produced no context, so silence proves nothing: ' + r.out;
  if (/Layer 1 norms/.test(r.out)) return 'reported the norms: ' + r.context;
  return true;
};

test(
  'a norm block matching NORMS.md stays silent, CRLF line endings included',
  unhealthy,
  async (r) => ranAndSaidNothingAboutNorms(r),
  false,
  { normsMd: NORMS_MD, claudeMd: ('# Global rules\n\n' + block('v2026-07-29') + '\n').replace(/\n/g, '\r\n') },
);

test(
  'no norm block in CLAUDE.md is reported, to the person as well as the model',
  { state: 'current', at: hoursAgo(1) },
  async (r) => {
    if (!/has no CLAUDE-SKILLS NORMS block/.test(r.context)) return 'not reported to the model: ' + r.out;
    if (!/Layer 1 norms/.test(r.system)) return 'no systemMessage for the person: ' + r.out;
    if (!/NORMS\.md/.test(r.context)) return 'did not name the file to paste from: ' + r.context;
    return true;
  },
  false,
  { normsMd: NORMS_MD, claudeMd: NO_BLOCK },
);

test(
  'no CLAUDE.md at all is reported as its own case',
  { state: 'current', at: hoursAgo(1) },
  async (r) => {
    if (!/does not exist/.test(r.context)) return 'a missing file not named as missing: ' + r.out;
    return true;
  },
  false,
  { normsMd: NORMS_MD, claudeMd: null },
);

test(
  'an older block names both versions',
  { state: 'current', at: hoursAgo(1) },
  async (r) => {
    if (!/is v2026-07-23 but NORMS\.md is v2026-07-29/.test(r.context)) return 'versions not named: ' + r.out;
    return true;
  },
  false,
  { normsMd: NORMS_MD, claudeMd: '# Global rules\n\n' + block('v2026-07-23') + '\n' },
);

test(
  'the same marker with edited text is reported as drift',
  { state: 'current', at: hoursAgo(1) },
  async (r) => {
    if (!/differs from NORMS\.md under the same marker \(v2026-07-29\)/.test(r.context)) return 'drift not reported: ' + r.out;
    return true;
  },
  false,
  { normsMd: NORMS_MD, claudeMd: '# Global rules\n\n' + block('v2026-07-29', 'norm one\nnorm TWO') + '\n' },
);

test(
  'a plugin install is skipped, since norms-inject supplies the block there',
  unhealthy,
  async (r) => ranAndSaidNothingAboutNorms(r),
  false,
  { normsMd: NORMS_MD, claudeMd: NO_BLOCK, env: { CLAUDE_PLUGIN_ROOT: 'C:/plugin' } },
);

test(
  'a layout other than <config>/skills is skipped, since CLAUDE.md could be anywhere',
  unhealthy,
  async (r) => ranAndSaidNothingAboutNorms(r),
  false,
  { normsMd: NORMS_MD, claudeMd: NO_BLOCK, dir: 'repo' },
);

test(
  'a NORMS.md without a block fails open and stays quiet',
  unhealthy,
  async (r) => ranAndSaidNothingAboutNorms(r),
  false,
  { normsMd: '# Layer 1 norms, markers lost\n', claudeMd: NO_BLOCK },
);

const run = async () => {
  for (const c of cases) {
    const s = stage(c.fixture, c.cwdIsRepo, c.norms);
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
