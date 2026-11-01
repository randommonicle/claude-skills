#!/usr/bin/env node
// Proves sync-port.mjs refreshes a port from the library's committed HEAD and from
// nothing else. Each case builds a real git repo shaped like this library and a real
// port folder shaped like an Antigravity plugin.
//
// It reds against: a version that copies the working tree (case 5 sees the
// uncommitted edit), one that copies untracked skill folders (case 2 copies the
// vendor pack), one that wipes the port's own skills (case 3), one that leaves
// files deleted upstream (case 4), one that copies every hook rather than the wired
// ones (case 6), and one without the plugin.json or inside-the-repo guards (7, 8).
// Run: node hooks/sync-port.test.mjs
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'sync-port.mjs');
let fails = 0;
const pass = (m) => console.log('PASS  | ' + m);
const fail = (m) => {
  console.log('FAIL  | ' + m);
  fails++;
};

const git = (cwd, args) => spawnSync('git', ['-C', cwd, '-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', '-c', 'core.autocrlf=false', ...args], { encoding: 'utf8' });
const put = (path, text) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};
const read = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : null);

// root/lib: a committed library with two skills, two hooks (one wired, one not),
// NORMS.md and ports/antigravity; an ignored vendor skill sits beside them.
// root/port: an Antigravity plugin holding a stale copy and a skill of its own.
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'port-'));
  const lib = join(root, 'lib');
  mkdirSync(lib);
  git(lib, ['init', '-q', '-b', 'main']);
  put(join(lib, 'alpha', 'SKILL.md'), 'alpha v2\n');
  put(join(lib, 'alpha', 'references', 'notes.md'), 'notes v2\n');
  put(join(lib, 'beta', 'SKILL.md'), 'beta v1\n');
  put(join(lib, 'hooks', 'push-gate.mjs'), '// gate v2\n');
  put(join(lib, 'hooks', 'unwired.mjs'), '// not in hooks.json\n');
  put(join(lib, 'NORMS.md'), 'norms v2\n');
  put(join(lib, 'ports', 'antigravity', 'plugin.json'), '{"name":"ash"}\n');
  put(join(lib, 'ports', 'antigravity', 'hooks.json'), '{"c":"node ./hooks/agy-wrapper.mjs ./hooks/push-gate.mjs"}\n');
  put(join(lib, 'ports', 'antigravity', 'hooks', 'agy-wrapper.mjs'), '// wrapper v2\n');
  put(join(lib, '.gitignore'), 'vendor-pack/\n');
  git(lib, ['add', '-A']);
  git(lib, ['commit', '-qm', 'library']);
  put(join(lib, 'vendor-pack', 'SKILL.md'), 'vendor, untracked\n');

  const port = join(root, 'port');
  put(join(port, 'plugin.json'), '{"name":"ash","old":true}\n');
  put(join(port, 'hooks.json'), '{}\n');
  put(join(port, 'hooks', 'push-gate.mjs'), '// gate v1\n');
  put(join(port, 'hooks', 'agy-wrapper.mjs'), '// wrapper v1\n');
  put(join(port, 'rules', 'NORMS.md'), 'norms v1\n');
  put(join(port, 'skills', 'alpha', 'SKILL.md'), 'alpha v1\n');
  put(join(port, 'skills', 'alpha', 'gone.md'), 'deleted upstream\n');
  put(join(port, 'skills', 'port-only', 'SKILL.md'), 'mine\n');
  return { root, lib, port };
}

function runSync(f, extra = []) {
  const r = spawnSync(process.execPath, [SCRIPT, f.port, '--repo', f.lib, ...extra], { encoding: 'utf8' });
  let json = null;
  try {
    json = JSON.parse(r.stdout);
  } catch {}
  return { code: r.status, json, stdout: r.stdout, stderr: r.stderr };
}

// A case that asserts something is ABSENT passes trivially if the sync never ran
// (LESSONS 20's vacuous passes), so those cases first require a real sync.
function synced(f) {
  const r = runSync(f);
  return r.json?.state === 'synced' ? null : 'sync did not run: state=' + r.json?.state + ' ' + (r.json?.reason ?? r.stderr.slice(0, 120));
}

const cases = [];
const test = (name, fn) => cases.push([name, fn]);

test('a stale port is synced: skills, wired hook, wrapper, plugin files, NORMS', (f) => {
  const r = runSync(f);
  if (r.json?.state !== 'synced') return 'state=' + r.json?.state + ' ' + (r.json?.reason ?? r.stderr);
  if (r.code !== 0) return 'exit ' + r.code;
  const want = {
    'skills/alpha/SKILL.md': 'alpha v2\n',
    'skills/alpha/references/notes.md': 'notes v2\n',
    'skills/beta/SKILL.md': 'beta v1\n',
    'hooks/push-gate.mjs': '// gate v2\n',
    'hooks/agy-wrapper.mjs': '// wrapper v2\n',
    'plugin.json': '{"name":"ash"}\n',
    'rules/NORMS.md': 'norms v2\n',
  };
  for (const [rel, text] of Object.entries(want)) {
    if (read(join(f.port, rel)) !== text) return rel + ' is ' + JSON.stringify(read(join(f.port, rel)));
  }
  return true;
});

test('an untracked (vendor) skill folder is never copied', (f) => {
  const not = synced(f);
  if (not) return not;
  if (existsSync(join(f.port, 'skills', 'vendor-pack'))) return 'the ignored vendor skill reached the port';
  return true;
});

test("the port's own skill is left alone", (f) => {
  const not = synced(f);
  if (not) return not;
  if (read(join(f.port, 'skills', 'port-only', 'SKILL.md')) !== 'mine\n') return 'port-only skill was changed or removed';
  return true;
});

test('a file deleted upstream inside a library skill is removed', (f) => {
  const not = synced(f);
  if (not) return not;
  if (existsSync(join(f.port, 'skills', 'alpha', 'gone.md'))) return 'gone.md survived the sync';
  return true;
});

test('content comes from HEAD, not from an uncommitted edit', (f) => {
  appendFileSync(join(f.lib, 'alpha', 'SKILL.md'), 'UNCOMMITTED\n');
  runSync(f);
  if (read(join(f.port, 'skills', 'alpha', 'SKILL.md')) !== 'alpha v2\n') return 'port got the working-tree text';
  return true;
});

test('only hooks that hooks.json wires are copied', (f) => {
  const not = synced(f);
  if (not) return not;
  if (existsSync(join(f.port, 'hooks', 'unwired.mjs'))) return 'an unwired hook was copied';
  return true;
});

test('refuses a folder with no plugin.json and writes nothing', (f) => {
  rmSync(join(f.port, 'plugin.json'));
  const r = runSync(f);
  if (r.json?.state !== 'error') return 'state=' + r.json?.state;
  if (r.code !== 1) return 'exit ' + r.code;
  if (read(join(f.port, 'skills', 'alpha', 'SKILL.md')) !== 'alpha v1\n') return 'wrote into a folder it refused';
  return true;
});

test('refuses a port inside the library itself', (f) => {
  put(join(f.lib, 'inner', 'plugin.json'), '{}\n');
  const r = spawnSync(process.execPath, [SCRIPT, join(f.lib, 'inner'), '--repo', f.lib], { encoding: 'utf8' });
  const json = JSON.parse(r.stdout || '{}');
  if (json.state !== 'error' || !/inside/i.test(json.reason ?? '')) return 'state=' + json.state + ' reason=' + json.reason;
  return true;
});

test('--dry-run reports the changes and writes nothing', (f) => {
  const r = runSync(f, ['--dry-run']);
  if (r.json?.state !== 'synced' || r.json?.dryRun !== true) return 'state=' + r.json?.state + ' dryRun=' + r.json?.dryRun;
  if (!(r.json.count > 0)) return 'count=' + r.json.count;
  if (read(join(f.port, 'skills', 'alpha', 'SKILL.md')) !== 'alpha v1\n') return 'dry run wrote to the port';
  return true;
});

test('a second run finds nothing to do and reports current', (f) => {
  runSync(f);
  const r = runSync(f);
  if (r.json?.state !== 'current') return 'state=' + r.json?.state + ' changed=' + JSON.stringify(r.json?.changed);
  if (r.code !== 0) return 'exit ' + r.code;
  return true;
});

test('a hook wired in hooks.json but missing from the library is an error', (f) => {
  put(join(f.lib, 'ports', 'antigravity', 'hooks.json'), '{"c":"node ./hooks/agy-wrapper.mjs ./hooks/no-such-hook.mjs"}\n');
  git(f.lib, ['add', '-A']);
  git(f.lib, ['commit', '-qm', 'wire a missing hook']);
  const r = runSync(f);
  if (r.json?.state !== 'error' || !/no-such-hook/.test(r.json?.reason ?? '')) return 'state=' + r.json?.state + ' reason=' + r.json?.reason;
  return true;
});

for (const [name, fn] of cases) {
  const f = fixture();
  try {
    const r = fn(f);
    if (r === true) pass(name);
    else fail(name + ' -> ' + r);
  } catch (e) {
    fail(name + ' -> threw ' + e.message);
  } finally {
    try {
      rmSync(f.root, { recursive: true, force: true });
    } catch {}
  }
}

console.log(fails ? '\n' + fails + ' case(s) failed' : '\nall cases passed');
process.exit(fails ? 1 : 0);
