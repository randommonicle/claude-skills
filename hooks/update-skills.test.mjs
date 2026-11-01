#!/usr/bin/env node
// Proves update-skills.mjs fast-forwards ONLY when it is safe to, and that every
// refusal leaves HEAD exactly where it was. Each case builds a real bare origin
// and a real clone, so `fetch` is a real fetch rather than a mock.
//
// It reds against: a version with the dirty check removed (case 3 moves HEAD), a
// version that treats untracked files as dirty (case 6 refuses), a version that
// trusts `git merge`'s exit code instead of re-reading HEAD (case 2 asserts on
// the SHA), and a version without the origin-URL guard (case 7 would
// fast-forward a repo that is not this library).
// Run: node hooks/update-skills.test.mjs
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, appendFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'update-skills.mjs');
let fails = 0;
const pass = (m) => console.log('PASS  | ' + m);
const fail = (m) => {
  console.log('FAIL  | ' + m);
  fails++;
};

const git = (cwd, args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
const head = (repo) => spawnSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
const author = ['-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false'];

// root/origin/claude-skills.git (bare) + root/work (pusher) + root/lib (under test).
// The bare repo's NAME carries the origin-URL guard's match, so the guard is
// exercised positively by every case, not only by case 7.
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'upd-'));
  const origin = join(root, 'origin', 'claude-skills.git');
  mkdirSync(join(root, 'origin'), { recursive: true });
  git(root, ['init', '--bare', '-b', 'main', origin]);

  const work = join(root, 'work');
  git(root, ['clone', '--quiet', origin, work]);
  mkdirSync(join(work, 'hooks'), { recursive: true });
  writeFileSync(join(work, 'hooks', 'a.mjs'), '// one\n');
  git(work, ['add', '-A']);
  git(work, [...author, 'commit', '-qm', 'first']);
  git(work, ['push', '--quiet', 'origin', 'main']);

  const lib = join(root, 'lib');
  git(root, ['clone', '--quiet', origin, lib]);
  return { root, origin, work, lib };
}

// Push one more commit so `lib` is exactly one behind.
function advanceOrigin(f, file = 'hooks/a.mjs') {
  appendFileSync(join(f.work, file), '// two\n');
  git(f.work, ['add', '-A']);
  git(f.work, [...author, 'commit', '-qm', 'second']);
  git(f.work, ['push', '--quiet', 'origin', 'main']);
  return head(f.work);
}

function runUpdater(lib) {
  const r = spawnSync(process.execPath, [SCRIPT, '--repo', lib], { encoding: 'utf8' });
  let json = null;
  try {
    json = JSON.parse(r.stdout);
  } catch {}
  return { code: r.status, json, stdout: r.stdout, stderr: r.stderr };
}

const cases = [];
const test = (name, fn) => cases.push([name, fn]);

test('already at origin tip reports current and exits 0', (f) => {
  const before = head(f.lib);
  const r = runUpdater(f.lib);
  if (r.json?.state !== 'current') return 'state=' + r.json?.state;
  if (r.code !== 0) return 'exit ' + r.code;
  if (head(f.lib) !== before) return 'HEAD moved on a no-op';
  return true;
});

test('clean and behind fast-forwards, HEAD lands on the upstream SHA', (f) => {
  const target = advanceOrigin(f);
  const r = runUpdater(f.lib);
  if (r.json?.state !== 'updated') return 'state=' + r.json?.state;
  if (head(f.lib) !== target) return 'HEAD is ' + head(f.lib) + ', expected ' + target;
  if (r.code !== 0) return 'exit ' + r.code;
  if (r.json.hooksChanged !== true) return 'hooksChanged should be true for a hooks/ change';
  return true;
});

test('tracked modification refuses and leaves HEAD untouched', (f) => {
  advanceOrigin(f);
  const before = head(f.lib);
  appendFileSync(join(f.lib, 'hooks', 'a.mjs'), '// local edit\n');
  const r = runUpdater(f.lib);
  if (r.json?.state !== 'skipped-dirty') return 'state=' + r.json?.state;
  if (head(f.lib) !== before) return 'HEAD MOVED to ' + head(f.lib) + ' despite local changes';
  if (r.code !== 1) return 'exit ' + r.code + ', expected 1';
  return true;
});

test('local commits ahead refuse and leave HEAD untouched', (f) => {
  appendFileSync(join(f.lib, 'hooks', 'a.mjs'), '// mine\n');
  git(f.lib, ['add', '-A']);
  git(f.lib, [...author, 'commit', '-qm', 'local only']);
  const before = head(f.lib);
  const r = runUpdater(f.lib);
  if (r.json?.state !== 'skipped-ahead') return 'state=' + r.json?.state;
  if (head(f.lib) !== before) return 'HEAD MOVED to ' + head(f.lib);
  return true;
});

test('diverged history refuses and leaves HEAD untouched', (f) => {
  advanceOrigin(f);
  writeFileSync(join(f.lib, 'other.txt'), 'divergent\n');
  git(f.lib, ['add', '-A']);
  git(f.lib, [...author, 'commit', '-qm', 'divergent']);
  const before = head(f.lib);
  const r = runUpdater(f.lib);
  if (r.json?.state !== 'skipped-diverged') return 'state=' + r.json?.state;
  if (head(f.lib) !== before) return 'HEAD MOVED to ' + head(f.lib);
  return true;
});

test('an untracked file does NOT block the update', (f) => {
  const target = advanceOrigin(f);
  writeFileSync(join(f.lib, 'FIRE_LOG.jsonl'), '{"machine":"local"}\n');
  const r = runUpdater(f.lib);
  if (r.json?.state !== 'updated') return 'state=' + r.json?.state + ' (untracked file wrongly treated as dirty)';
  if (head(f.lib) !== target) return 'HEAD is ' + head(f.lib);
  if (!existsSync(join(f.lib, 'FIRE_LOG.jsonl'))) return 'the untracked file was destroyed';
  return true;
});

test('refuses a repo whose origin is not this library, before fetching', (f) => {
  advanceOrigin(f);
  const before = head(f.lib);
  git(f.lib, ['remote', 'set-url', 'origin', join(f.root, 'origin', 'some-client-repo.git')]);
  const r = runUpdater(f.lib);
  if (r.json?.state !== 'error') return 'state=' + r.json?.state;
  if (!/refusing/i.test(r.json.reason ?? '')) return 'reason=' + r.json.reason;
  if (head(f.lib) !== before) return 'HEAD MOVED to ' + head(f.lib);
  return true;
});

test('writes the status file beside the repo, not inside it', (f) => {
  advanceOrigin(f);
  runUpdater(f.lib);
  const statusPath = resolve(f.lib, '..', 'skills-update.json');
  if (!existsSync(statusPath)) return 'no status file at ' + statusPath;
  if (existsSync(join(f.lib, 'skills-update.json'))) return 'status file was written INSIDE the repo';
  const s = JSON.parse(readFileSync(statusPath, 'utf8'));
  if (s.state !== 'updated') return 'status file says state=' + s.state;
  if (!s.at) return 'status file has no timestamp';
  return true;
});

// Mirrors: <root>/skills-mirrors.json sits beside the repo, as the status file does.
const mirrors = (f, cfg) => writeFileSync(join(f.root, 'skills-mirrors.json'), JSON.stringify(cfg));
const secondClone = (f) => {
  const lib2 = join(f.root, 'lib2');
  git(f.root, ['clone', '--quiet', f.origin, lib2]);
  return lib2;
};

test('without a mirrors file the status carries no mirrors key', (f) => {
  advanceOrigin(f);
  const r = runUpdater(f.lib);
  if (r.json?.state !== 'updated') return 'state=' + r.json?.state;
  if ('mirrors' in r.json) return 'mirrors key present with no mirrors file';
  return true;
});

test('a mirror checkout that is behind is fast-forwarded too', (f) => {
  const lib2 = secondClone(f);
  const target = advanceOrigin(f);
  mirrors(f, { checkouts: [lib2] });
  const r = runUpdater(f.lib);
  if (r.json?.state !== 'updated') return 'library state=' + r.json?.state;
  if (r.json?.mirrors?.[0]?.state !== 'updated') return 'mirror state=' + r.json?.mirrors?.[0]?.state;
  if (head(lib2) !== target) return 'mirror HEAD is ' + head(lib2);
  if (r.code !== 0) return 'exit ' + r.code;
  return true;
});

test('a mirror whose origin is not this library is refused; the library still updates', (f) => {
  const lib2 = secondClone(f);
  const target = advanceOrigin(f);
  git(lib2, ['remote', 'set-url', 'origin', join(f.root, 'origin', 'some-client-repo.git')]);
  const before = head(lib2);
  mirrors(f, { checkouts: [lib2] });
  const r = runUpdater(f.lib);
  if (head(f.lib) !== target) return 'library did not update';
  const m = r.json?.mirrors?.[0];
  if (m?.state !== 'error' || !/refusing/i.test(m?.reason ?? '')) return 'mirror state=' + m?.state + ' reason=' + m?.reason;
  if (head(lib2) !== before) return 'the refused mirror moved';
  if (r.code !== 1) return 'exit ' + r.code + ', expected 1';
  return true;
});

test('a port is synced when the library updates', (f) => {
  for (const [rel, text] of [
    ['s1/SKILL.md', 's1\n'],
    ['ports/antigravity/plugin.json', '{}\n'],
    ['ports/antigravity/hooks.json', '{}\n'],
  ]) {
    mkdirSync(dirname(join(f.work, rel)), { recursive: true });
    writeFileSync(join(f.work, rel), text);
  }
  advanceOrigin(f);
  const port = join(f.root, 'port');
  mkdirSync(port);
  writeFileSync(join(port, 'plugin.json'), '{}\n');
  mirrors(f, { ports: [port] });
  const r = runUpdater(f.lib);
  const m = r.json?.mirrors?.[0];
  if (m?.state !== 'synced') return 'port state=' + m?.state + ' reason=' + m?.reason;
  if (!existsSync(join(port, 'skills', 's1', 'SKILL.md'))) return 'skill not in the port';
  return true;
});

test('a port is skipped, untouched, while the library is dirty', (f) => {
  advanceOrigin(f);
  appendFileSync(join(f.lib, 'hooks', 'a.mjs'), '// local edit\n');
  const port = join(f.root, 'port');
  mkdirSync(port);
  writeFileSync(join(port, 'plugin.json'), '{}\n');
  mirrors(f, { ports: [port] });
  const r = runUpdater(f.lib);
  if (r.json?.state !== 'skipped-dirty') return 'library state=' + r.json?.state;
  if (r.json?.mirrors?.[0]?.state !== 'skipped') return 'port state=' + r.json?.mirrors?.[0]?.state;
  if (existsSync(join(port, 'skills'))) return 'the port was written to';
  return true;
});

test('an unreadable mirrors file is reported, not ignored', (f) => {
  writeFileSync(join(f.root, 'skills-mirrors.json'), '{ not json');
  const r = runUpdater(f.lib);
  if (r.json?.mirrors?.[0]?.state !== 'error') return 'mirrors=' + JSON.stringify(r.json?.mirrors);
  if (r.code !== 1) return 'exit ' + r.code;
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
