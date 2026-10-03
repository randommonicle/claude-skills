#!/usr/bin/env node
// Team-loop step 8 gate: decides whether a work package may merge, from git and from the
// package's own checks, never from what the builder reported. A builder with Bash can reset,
// rewrite and recommit, so nothing it says about its history proves anything
// (docs/DESIGN_team-loop_2026-10-02.md section 5.3).
//
//   node team-loop/scripts/gate.mjs --wp WP-001 --t <sha> --head <branch|sha> --milestone <branch>
//        [--repo <path>] [--no-board] [--json]
//
// Everything the gate trusts is read from the milestone branch's committed tree: the brief
// (team/packages/<wp>.md), the project config (team/gate.json) and, for a regulated package,
// the verdict file (team/packages/<wp>.verdict.md). A builder's branch cannot edit them.
//
// JUDGED BY lines are `- <id>: <command>`. A command exits non-zero while its check fails and
// zero once it passes. That fits a test suite (one command per test file) and a project whose
// proofs are scripts. A skip cannot slip through: a skipped check passes at T, which fails
// check 2, and T's files cannot change after T, which is check 3.
//
// Checks, in order; the first failure ends the run:
//   1. T is an ancestor of the package head.
//   2. Red at T: every JUDGED BY command exits non-zero in a scratch worktree at T.
//   3. Not weakened: T's own files are unchanged from T to the head; existing test files,
//      test config, and package.json's test scripts are unchanged from B (the package base)
//      unless the brief's TESTS CHANGED names the exact path.
//   4. Green on the merge that will be committed: in a scratch worktree the head is merged
//      into the milestone tip and committed; every JUDGED BY command and the full suite exit
//      zero there. The tested merge is kept at refs/team-loop/tested/<wp>; the lead moves the
//      milestone with `git merge --ff-only`, which refuses if the milestone moved meanwhile.
//   5. A regulated package's verdict file exists and lists no open Critical or High.
//
// Exit 0: pass. Exit 1: the package failed a check. Exit 2: the gate could not run.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

class GateError extends Error {}
class Unrunnable extends Error {}

function parseArgs(argv) {
  const a = { repo: process.cwd(), board: true, json: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = () => {
      if (i + 1 >= argv.length) throw new Unrunnable('missing value for ' + k);
      return argv[++i];
    };
    if (k === '--wp') a.wp = v();
    else if (k === '--t') a.t = v();
    else if (k === '--head') a.head = v();
    else if (k === '--milestone') a.milestone = v();
    else if (k === '--repo') a.repo = resolve(v());
    else if (k === '--no-board') a.board = false;
    else if (k === '--json') a.json = true;
    else throw new Unrunnable('unknown argument ' + k);
  }
  for (const req of ['wp', 't', 'head', 'milestone']) if (!a[req]) throw new Unrunnable('--' + req + ' is required');
  if (!/^WP-\d{3,}$/.test(a.wp)) throw new Unrunnable('--wp must look like WP-001');
  return a;
}

function git(repo, args, { allowFail = false } = {}) {
  const r = spawnSync('git', ['-C', repo, '-c', 'core.longpaths=true', ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new Unrunnable('git could not run: ' + r.error.message);
  if (r.status !== 0 && !allowFail) throw new Unrunnable('git ' + args.join(' ') + ' failed: ' + (r.stderr || '').trim().split('\n')[0]);
  return { ok: r.status === 0, out: (r.stdout || '').trim() };
}

const sha = (repo, rev) => {
  const r = git(repo, ['rev-parse', '--verify', '--quiet', '--end-of-options', rev + '^{commit}'], { allowFail: true });
  if (!r.ok) throw new Unrunnable('not a commit: ' + rev);
  return r.out;
};

// The brief, as the milestone branch holds it.
export function parseBrief(text) {
  const judged = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const at = lines.findIndex((l) => /^\s*JUDGED BY\b/.test(l));
  if (at >= 0) {
    for (const l of lines.slice(at + 1)) {
      const m = /^\s*-\s*([A-Za-z0-9._-]+):\s*(\S.*)$/.exec(l);
      if (m) judged.push({ id: m[1], command: m[2].trim() });
      else if (l.trim() !== '') break;
    }
  }
  const tc = /^\s*TESTS CHANGED\b[^:]*:\s*(.*)$/m.exec(text);
  const testsChanged =
    tc && !/^none\b/i.test(tc[1].trim())
      ? tc[1].split(',').map((s) => s.trim().replace(/`/g, '')).filter(Boolean)
      : [];
  const regulated = /^regulated:\s*yes\b/im.test(text);
  return { judged, testsChanged, regulated };
}

// Glob to RegExp: ** spans directories, * and ? stay inside one segment.
export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      i++;
      if (glob[i + 1] === '/') {
        i++;
        re += '(?:.*/)?';
      } else re += '.*';
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$');
}

const matchesAny = (path, globs) => globs.some((g) => globToRegExp(g).test(path));

function run(command, cwd, timeoutMs) {
  const r = spawnSync(command, { cwd, shell: true, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 });
  const tail = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').slice(-3).join(' | ').slice(0, 300);
  if (r.error && r.error.code === 'ETIMEDOUT') return { code: null, timedOut: true, tail };
  if (r.error) return { code: null, timedOut: false, tail: r.error.message };
  return { code: r.status, timedOut: false, tail };
}

function scratch(repo, rev, label, cleanup) {
  const dir = mkdtempSync(join(tmpdir(), 'tl-gate-' + label + '-'));
  rmSync(dir, { recursive: true, force: true });
  git(repo, ['worktree', 'add', '--quiet', '--detach', dir, rev]);
  cleanup.push(() => {
    git(repo, ['worktree', 'remove', '--force', dir], { allowFail: true });
    rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

function setup(cfg, dir, where) {
  if (!cfg.setup) return;
  const r = run(cfg.setup, dir, cfg.timeoutMs);
  if (r.code !== 0) throw new Unrunnable('setup failed ' + where + (r.timedOut ? ' (timed out)' : '') + ': ' + r.tail);
}

function packageScripts(repo, rev) {
  const r = git(repo, ['show', rev + ':package.json'], { allowFail: true });
  if (!r.ok) return {};
  try {
    const scripts = JSON.parse(r.out).scripts ?? {};
    return Object.fromEntries(Object.entries(scripts).filter(([k]) => /test/i.test(k)));
  } catch {
    throw new Unrunnable('package.json at ' + rev.slice(0, 8) + ' is not valid JSON');
  }
}

export function gate(argv) {
  const a = parseArgs(argv);
  const repo = a.repo;
  const result = { wp: a.wp, pass: false, checks: [], red: [], green: [] };
  const cleanup = [];
  const step = (name, detail) => result.checks.push({ name, ok: true, detail });
  try {
    const T = sha(repo, a.t);
    const head = sha(repo, a.head);
    const milestone = sha(repo, a.milestone);
    result.T = T;
    result.head = head;

    const briefPath = 'team/packages/' + a.wp + '.md';
    const brief = git(repo, ['show', milestone + ':' + briefPath], { allowFail: true });
    if (!brief.ok) throw new Unrunnable(briefPath + ' is not committed on the milestone branch');
    const { judged, testsChanged, regulated } = parseBrief(brief.out);
    if (!judged.length) throw new Unrunnable(briefPath + ' has no JUDGED BY lines');
    const cfgText = git(repo, ['show', milestone + ':team/gate.json'], { allowFail: true });
    if (!cfgText.ok) throw new Unrunnable('team/gate.json is not committed on the milestone branch');
    let cfg;
    try {
      cfg = JSON.parse(cfgText.out);
    } catch {
      throw new Unrunnable('team/gate.json on the milestone branch is not valid JSON');
    }
    cfg.timeoutMs = Number(cfg.timeoutMs) > 0 ? Number(cfg.timeoutMs) : 600000;
    const testGlobs = Array.isArray(cfg.tests) ? cfg.tests : [];
    const configGlobs = (Array.isArray(cfg.testConfig) ? cfg.testConfig : []).filter((g) => !g.includes('#'));
    const watchScripts = (cfg.testConfig ?? []).includes('package.json#scripts');

    // 1. T is an ancestor of the head.
    if (!git(repo, ['merge-base', '--is-ancestor', T, head], { allowFail: true }).ok)
      throw new GateError('check 1: T ' + T.slice(0, 8) + ' is not an ancestor of the head ' + head.slice(0, 8));
    const B = git(repo, ['merge-base', milestone, head]).out;
    result.B = B;
    step('ancestry', 'T is an ancestor of the head');

    // 2. Red at T.
    const atT = scratch(repo, T, 'red', cleanup);
    setup(cfg, atT, 'at T');
    for (const j of judged) {
      const r = run(j.command, atT, cfg.timeoutMs);
      if (r.timedOut) throw new GateError('check 2: ' + j.id + ' timed out at T, so whether it fails there is unknown');
      if (r.code === null) throw new GateError('check 2: ' + j.id + ' could not run at T: ' + r.tail);
      if (r.code === 0) throw new GateError('check 2: ' + j.id + ' already passes at T, so it pins nothing (a hollow or skipped check)');
      result.red.push({ id: j.id, code: r.code, tail: r.tail });
    }
    step('red at T', judged.length + ' check(s) fail at T');

    // 3. Not weakened.
    const tFiles = git(repo, ['diff-tree', '--no-commit-id', '--name-only', '-r', '--root', T]).out.split('\n').filter(Boolean);
    const touchedAfterT = tFiles.length
      ? git(repo, ['diff', '--name-only', T, head, '--', ...tFiles]).out.split('\n').filter(Boolean)
      : [];
    if (touchedAfterT.length) throw new GateError('check 3: T\'s own files changed after T: ' + touchedAfterT.join(', '));
    const changes = git(repo, ['diff', '--name-status', '--no-renames', B, head]).out.split('\n').filter(Boolean);
    const weakened = [];
    for (const line of changes) {
      const [status, path] = line.split('\t');
      if (testsChanged.includes(path)) continue;
      if (matchesAny(path, configGlobs)) weakened.push(path + ' (test config, ' + status + ')');
      else if (matchesAny(path, testGlobs) && status !== 'A') weakened.push(path + ' (existing test, ' + status + ')');
    }
    if (watchScripts && !testsChanged.includes('package.json')) {
      const before = packageScripts(repo, B);
      const after = packageScripts(repo, head);
      for (const k of new Set([...Object.keys(before), ...Object.keys(after)]))
        if (before[k] !== after[k]) weakened.push('package.json scripts.' + k);
    }
    if (weakened.length)
      throw new GateError('check 3: changed since the package base without TESTS CHANGED naming them: ' + weakened.join(', '));
    step('not weakened', 'T\'s files, existing tests and test config unchanged');

    // 4. Green on the merge that will be committed.
    const atMerge = scratch(repo, milestone, 'green', cleanup);
    const m = git(atMerge, ['-c', 'user.name=team-loop gate', '-c', 'user.email=gate@team-loop.invalid', 'merge', '--no-ff', '--no-edit', head], {
      allowFail: true,
    });
    if (!m.ok) throw new GateError('check 4: the head does not merge cleanly into the milestone tip');
    const tested = git(atMerge, ['rev-parse', 'HEAD']).out;
    setup(cfg, atMerge, 'on the merge');
    for (const j of judged) {
      const r = run(j.command, atMerge, cfg.timeoutMs);
      if (r.code !== 0)
        throw new GateError('check 4: ' + j.id + (r.timedOut ? ' timed out' : ' exits ' + r.code) + ' on the merge: ' + r.tail);
      result.green.push({ id: j.id, code: 0 });
    }
    if (cfg.suite) {
      const r = run(cfg.suite, atMerge, cfg.timeoutMs);
      if (r.code !== 0) throw new GateError('check 4: the full suite ' + (r.timedOut ? 'timed out' : 'exits ' + r.code) + ' on the merge: ' + r.tail);
    }
    git(repo, ['update-ref', 'refs/team-loop/tested/' + a.wp, tested]);
    result.tested = tested;
    step('green on the merge', 'all checks' + (cfg.suite ? ' and the full suite' : '') + ' pass on ' + tested.slice(0, 8));

    // 5. Regulated: the verdict file.
    if (regulated) {
      const vPath = 'team/packages/' + a.wp + '.verdict.md';
      const v = git(repo, ['show', milestone + ':' + vPath], { allowFail: true });
      if (!v.ok) throw new GateError('check 5: regulated package with no ' + vPath + ' committed on the milestone branch');
      const open = v.out.split('\n').filter((l) => /^\s*[-*]\s*\[open\]\s*(critical|high)\b/i.test(l));
      if (open.length) throw new GateError('check 5: open Critical or High in ' + vPath + ': ' + open.map((l) => l.trim()).join(' / '));
      step('verdict', 'no open Critical or High');
    }
    result.pass = true;
  } catch (e) {
    if (e instanceof GateError) result.failure = e.message;
    else if (e instanceof Unrunnable) result.error = e.message;
    else result.error = 'unexpected: ' + (e && e.message);
  } finally {
    for (const f of cleanup.reverse()) {
      try {
        f();
      } catch {}
    }
    git(repo, ['worktree', 'prune'], { allowFail: true });
  }
  if (a.board && !result.error) result.board = writeBoard(repo, result);
  return result;
}

// Writes the gate's columns onto the package's BOARD row in the lead's working tree. The lead
// commits it. A missing board or row is reported, never created.
function writeBoard(repo, r) {
  const path = join(repo, 'team', 'BOARD.md');
  if (!existsSync(path)) return 'no team/BOARD.md, so no row was written';
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  const headerAt = lines.findIndex((l) => /^\|\s*WP\s*\|/.test(l));
  if (headerAt < 0) return 'team/BOARD.md has no table with a WP column';
  const cols = lines[headerAt].split('|').slice(1, -1).map((c) => c.trim());
  const rowAt = lines.findIndex((l, i) => i > headerAt && new RegExp('^\\|\\s*' + r.wp + '\\s*\\|').test(l));
  if (rowAt < 0) return 'team/BOARD.md has no row for ' + r.wp;
  const cells = lines[rowAt].split('|').slice(1, -1).map((c) => c.trim());
  const short = (s) => (s ? s.slice(0, 8) : '-');
  const set = {
    T: short(r.T),
    B: short(r.B),
    'tested merge': short(r.tested),
    red: r.red.map((x) => x.id).join(' ') || '-',
    green: r.green.map((x) => x.id).join(' ') || '-',
    gate: r.pass ? 'pass' : 'FAIL: ' + (r.failure || '').replace(/\|/g, '/').slice(0, 120),
  };
  for (const [k, v] of Object.entries(set)) {
    const i = cols.indexOf(k);
    if (i >= 0) cells[i] = v;
  }
  lines[rowAt] = '| ' + cells.join(' | ') + ' |';
  writeFileSync(path, lines.join('\n'), 'utf8');
  return 'row ' + r.wp + ' updated';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let r;
  try {
    r = gate(process.argv.slice(2));
  } catch (e) {
    r = { error: e.message };
  }
  if (process.argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else {
    for (const c of r.checks ?? []) console.log('ok    | ' + c.name + ': ' + c.detail);
    if (r.pass) console.log('PASS  | ' + r.wp + '. To merge: git merge --ff-only refs/team-loop/tested/' + r.wp);
    if (r.failure) console.log('FAIL  | ' + r.failure);
    if (r.error) console.log('ERROR | the gate could not run: ' + r.error);
    if (r.board) console.log('board | ' + r.board);
  }
  process.exit(r.pass ? 0 : r.error ? 2 : 1);
}
