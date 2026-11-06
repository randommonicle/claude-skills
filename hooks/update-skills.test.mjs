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

// Every other case in this file also runs with no mirrors config, and none of them noticed
// that the key was simply missing from the record. That is how the feature stayed switched
// off on the maintainer's machine from 2026-11-01 to 2026-11-05 while each run said
// "current": absence has to be an assertion of its own, or it is indistinguishable from
// a mirror list that ran and was fine.
test('no mirrors config: the record SAYS so rather than omitting the key', (f) => {
  const r = runUpdater(f.lib);
  if (!Array.isArray(r.json?.mirrors)) return 'the record has no mirrors key at all';
  const cfg = r.json.mirrors.find((m) => m.kind === 'config');
  if (!cfg) return 'no config entry in mirrors: ' + JSON.stringify(r.json.mirrors);
  if (cfg.state !== 'none') return 'state=' + cfg.state;
  if (!/no mirrors configured/i.test(cfg.reason ?? '')) return 'reason does not say why: ' + cfg.reason;
  if (r.code !== 0) return 'exit ' + r.code + ', but an unconfigured machine is not a failure';
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

// Was: "without a mirrors file the status carries no mirrors key", asserting the omission
// as correct. That is prove-it-can-fail rule 9 -- a green test pinning the bug. The omission
// is what let the feature sit switched off for four days while every run reported success,
// so the assertion is inverted here rather than deleted: the no-config case still has to be
// exercised on the `updated` path, and it still has to be legible in the record.
test('a mirrors-less machine still records the absence when the library updates', (f) => {
  advanceOrigin(f);
  const r = runUpdater(f.lib);
  if (r.json?.state !== 'updated') return 'state=' + r.json?.state;
  if (!Array.isArray(r.json.mirrors)) return 'mirrors key missing from an updated record';
  if (r.json.mirrors.some((m) => m.state !== 'none')) return 'unexpected mirror entries: ' + JSON.stringify(r.json.mirrors);
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

// The neighbour of the absent-config case above, and the member of the set that the
// 2026-11-05 fix did not decide. A config that exists and lists nothing produced
// `"mirrors": []`, which `every()` reads as true, so the run reported success for a
// capability that did nothing -- the same hole in a different shape. Reached for real on
// 2026-11-06 when ~/.agents/skills came out of `checkouts` and the file was left listing
// neither a checkout nor a port.
test('a mirrors config that lists nothing says so, rather than reporting an empty list', (f) => {
  writeFileSync(join(f.root, 'skills-mirrors.json'), JSON.stringify({ checkouts: [], ports: [] }));
  const r = runUpdater(f.lib);
  if (!Array.isArray(r.json?.mirrors)) return 'the record has no mirrors key at all';
  if (r.json.mirrors.length === 0) return 'mirrors is an empty array, which is the bug: nothing says the config is empty';
  const cfg = r.json.mirrors.find((m) => m.kind === 'config');
  if (!cfg) return 'no config entry in mirrors: ' + JSON.stringify(r.json.mirrors);
  if (cfg.state !== 'none') return 'state=' + cfg.state;
  if (!/lists no checkouts and no ports/i.test(cfg.reason ?? '')) return 'reason does not say why: ' + cfg.reason;
  if (r.code !== 0) return 'exit ' + r.code + ', but an empty config is not a failure';
  return true;
});

// ...and when the operator wrote down WHY it is empty, that reason reaches the report
// instead of the generic sentence, so the next session reads the decision and not a
// default. instrument-reports-itself rule 1: a disabled state carries its reason.
test('a note in the mirrors config is what the record reports as the reason', (f) => {
  const note = 'the Codex port is maintained by hand; a fast-forward would overwrite it';
  writeFileSync(join(f.root, 'skills-mirrors.json'), JSON.stringify({ checkouts: [], ports: [], note }));
  const r = runUpdater(f.lib);
  const cfg = r.json?.mirrors?.find((m) => m.kind === 'config');
  if (!cfg) return 'no config entry: ' + JSON.stringify(r.json?.mirrors);
  if (cfg.reason !== note) return 'reason=' + cfg.reason;
  if (r.code !== 0) return 'exit ' + r.code;
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
