#!/usr/bin/env node
// Proves gate.mjs refuses each way a package can be dishonest or broken, and passes an honest
// one. Every case builds its own throwaway repo: a milestone branch holding the brief, the
// gate config and a board, and a package branch with a tests commit T and a build on top.
// The checks are real `node --test` runs, so the gate's red and green are observed, not mocked.
//
// Each refusal case is aimed at one check and asserts that check's message, so a gate with
// that check removed goes red here: ancestry (check 1), a hollow test (2), a test edited
// after T, an existing test or test script edited without TESTS CHANGED (3), a broken suite,
// a conflicting merge and a check nobody wrote (4), and a regulated package with no verdict
// or an open High (5).
// Run: node team-loop/scripts/gate.test.mjs
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { gate, globToRegExp, parseBrief } from './gate.mjs';

let fails = 0;
const report = (name, r) => {
  if (r === true) console.log('PASS  | ' + name);
  else {
    console.log('FAIL  | ' + name + ' -> ' + r);
    fails++;
  }
};

const BUGGY = 'export const add = (a, b) => a - b;\n';
const FIXED = 'export const add = (a, b) => a + b;\n';
const ADD_TEST = "import test from 'node:test';\nimport assert from 'node:assert';\nimport { add } from '../src/add.mjs';\ntest('adds', () => assert.equal(add(2, 2), 4));\n";
const HOLLOW_TEST = "import test from 'node:test';\nimport assert from 'node:assert';\nimport { add } from '../src/add.mjs';\ntest('adds', () => assert.equal(typeof add, 'function'));\n";
const EXISTING_TEST = "import test from 'node:test';\nimport assert from 'node:assert';\nimport { two } from '../src/two.mjs';\ntest('two', () => assert.equal(two(), 2));\n";
const PKG = (test = 'node --test') => JSON.stringify({ type: 'module', scripts: { test } }, null, 2) + '\n';
const GATE_CFG = JSON.stringify({ setup: '', suite: 'node --test', tests: ['tests/**'], testConfig: ['package.json#scripts'], timeoutMs: 60000 }, null, 2);
const BRIEF = ({ judged = '- adds: node --test tests/add.test.mjs', regulated = 'no', tc = 'none' } = {}) =>
  '# WP-001: add two numbers\n\nregulated: ' + regulated + '\n\n```\nROLE: fix add\nSCOPE: src/**, tests/add.test.mjs\n\n' +
  'JUDGED BY (each command exits non-zero while its check fails, zero once it passes):\n  ' + judged +
  '\n\nTESTS CHANGED (existing test, config or fixture files this package may alter): ' + tc + '\n```\n';
const BOARD = '# BOARD: fixture\n\n| WP | status | role | branch | T | B | tested merge | red | green | gate |\n|---|---|---|---|---|---|---|---|---|---|\n| WP-001 | building | tl-builder | wp1 | - | - | - | - | - | - |\n';

function fixture({ brief = BRIEF(), tTest = ADD_TEST, build = (f) => f.w('src/add.mjs', FIXED), onMilestone = null, verdict = null } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'gate-test-'));
  const g = (...args) => {
    const r = spawnSync('git', ['-C', dir, '-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error('git ' + args.join(' ') + ': ' + r.stderr);
    return r.stdout.trim();
  };
  const w = (p, s) => {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), s, 'utf8');
  };
  const commit = (m) => {
    g('add', '-A');
    g('commit', '-qm', m);
    return g('rev-parse', 'HEAD');
  };
  const f = { dir, g, w, commit };
  g('init', '-q', '-b', 'milestone');
  w('package.json', PKG());
  w('src/add.mjs', BUGGY);
  w('src/two.mjs', 'export const two = () => 2;\n');
  w('tests/existing.test.mjs', EXISTING_TEST);
  w('team/gate.json', GATE_CFG);
  w('team/packages/WP-001.md', brief);
  if (verdict !== null) w('team/packages/WP-001.verdict.md', verdict);
  w('team/BOARD.md', BOARD);
  commit('milestone base');
  g('checkout', '-q', '-b', 'wp1');
  w('tests/add.test.mjs', tTest);
  f.T = commit('test(WP-001): pin add');
  build(f);
  f.head = commit('feat(WP-001): build');
  g('checkout', '-q', 'milestone');
  if (onMilestone) onMilestone(f);
  return f;
}

const runGate = (f, extra = {}) =>
  gate(['--repo', f.dir, '--wp', 'WP-001', '--t', extra.t ?? f.T, '--head', extra.head ?? 'wp1', '--milestone', 'milestone']);

const cases = [];
const test = (name, make, check) => cases.push({ name, make, check });
const failsAt = (n, pattern) => (r) => {
  if (r.pass) return 'passed, expected check ' + n + ' to fail';
  if (r.error) return 'could not run: ' + r.error;
  if (!r.failure.startsWith('check ' + n + ':')) return 'failed at the wrong check: ' + r.failure;
  if (pattern && !pattern.test(r.failure)) return 'wrong reason: ' + r.failure;
  return true;
};

test('an honest package passes, keeps the tested merge, writes the board row, leaves the milestone alone', () => fixture(), (r, f) => {
  if (!r.pass) return 'did not pass: ' + (r.failure || r.error);
  const ref = f.g('rev-parse', 'refs/team-loop/tested/WP-001');
  if (ref !== r.tested) return 'tested ref does not point at the tested merge';
  if (f.g('rev-parse', 'milestone') === r.tested) return 'the gate moved the milestone itself';
  const row = readFileSync(join(f.dir, 'team', 'BOARD.md'), 'utf8').split('\n').find((l) => l.startsWith('| WP-001'));
  if (!row.includes(r.T.slice(0, 8)) || !row.includes('| pass |') || !row.includes('| adds |')) return 'board row not written: ' + row;
  f.g('merge', '--ff-only', 'refs/team-loop/tested/WP-001');
  if (f.g('rev-parse', 'HEAD') !== r.tested) return 'the printed fast-forward does not land on the tested merge';
  return true;
});

test('check 1: a T that is not an ancestor of the head is refused', () => fixture(), null);
cases[cases.length - 1].run = (f) => {
  f.g('checkout', '-q', '-b', 'stray', 'milestone');
  f.w('stray.txt', 'x\n');
  const stray = f.commit('stray');
  f.g('checkout', '-q', 'milestone');
  return runGate(f, { t: stray });
};
cases[cases.length - 1].check = failsAt(1, /not an ancestor/);

test('check 2: a test that already passes at T is refused as hollow', () => fixture({ tTest: HOLLOW_TEST }), failsAt(2, /already passes at T/));

test(
  'check 3: a test T added and the build then edited is refused',
  () => fixture({ build: (f) => (f.w('src/add.mjs', FIXED), f.w('tests/add.test.mjs', HOLLOW_TEST)) }),
  failsAt(3, /T's own files changed after T: tests\/add\.test\.mjs/),
);

test(
  'check 3: an existing test edited without TESTS CHANGED is refused',
  () => fixture({ build: (f) => (f.w('src/add.mjs', FIXED), f.w('tests/existing.test.mjs', EXISTING_TEST.replace('two(), 2', 'two(), two()'))) }),
  failsAt(3, /tests\/existing\.test\.mjs \(existing test, M\)/),
);

test(
  'check 3: the same edit passes when TESTS CHANGED names the exact path',
  () =>
    fixture({
      brief: BRIEF({ tc: 'tests/existing.test.mjs' }),
      build: (f) => (f.w('src/add.mjs', FIXED), f.w('tests/existing.test.mjs', EXISTING_TEST.replace('two(), 2', 'two(), two()'))),
    }),
  (r) => (r.pass ? true : 'refused an edit TESTS CHANGED allows: ' + (r.failure || r.error)),
);

test(
  "check 3: a changed test script in package.json is refused",
  () => fixture({ build: (f) => (f.w('src/add.mjs', FIXED), f.w('package.json', PKG('node --test tests/add.test.mjs'))) }),
  failsAt(3, /package\.json scripts\.test/),
);

test(
  'check 4: a build that breaks another test fails the full suite on the merge',
  () => fixture({ build: (f) => (f.w('src/add.mjs', FIXED), f.w('src/two.mjs', 'export const two = () => 3;\n')) }),
  failsAt(4, /full suite/),
);

test(
  'check 4: a head that conflicts with the milestone is refused',
  () => fixture({ onMilestone: (f) => (f.w('src/add.mjs', 'export const add = (a, b) => b + a;\n'), f.commit('milestone moved')) }),
  failsAt(4, /does not merge cleanly/),
);

test(
  'check 4: a check the brief names but nobody wrote never goes green',
  () => fixture({ brief: BRIEF({ judged: '- adds: node --test tests/add.test.mjs\n  - rounding: node --test tests/rounding.test.mjs' }) }),
  failsAt(4, /rounding exits/),
);

test('check 5: a regulated package with no verdict file is refused', () => fixture({ brief: BRIEF({ regulated: 'yes' }) }), failsAt(5, /no team\/packages\/WP-001\.verdict\.md/));

test(
  'check 5: an open High in the verdict file is refused',
  () => fixture({ brief: BRIEF({ regulated: 'yes' }), verdict: '# Verdict\n\n- [closed] Critical: fixed\n- [open] High: rounding at the boundary\n' }),
  failsAt(5, /open Critical or High/),
);

test(
  'check 5: a verdict with nothing open passes',
  () => fixture({ brief: BRIEF({ regulated: 'yes' }), verdict: '# Verdict\n\n- [closed] High: fixed in b2\n- [open] Low: naming\n' }),
  (r) => (r.pass ? true : 'refused a clean verdict: ' + (r.failure || r.error)),
);

test(
  'a brief that is not committed on the milestone stops the gate as unrunnable, not as a fail',
  () => fixture(),
  null,
);
cases[cases.length - 1].run = (f) => {
  f.g('rm', '-q', 'team/packages/WP-001.md');
  f.commit('drop brief');
  return runGate(f);
};
cases[cases.length - 1].check = (r) => (r.error && /not committed on the milestone/.test(r.error) && !r.pass ? true : 'expected an unrunnable result: ' + JSON.stringify(r));

const unit = [];
unit.push([
  'parseBrief reads JUDGED BY lines, TESTS CHANGED and the regulated flag',
  () => {
    const b = parseBrief(BRIEF({ judged: '- a: cmd one\n  - b-2: cmd two --x', regulated: 'yes', tc: 'x.test.mjs, `y.json`' }));
    if (JSON.stringify(b.judged) !== JSON.stringify([{ id: 'a', command: 'cmd one' }, { id: 'b-2', command: 'cmd two --x' }])) return 'judged: ' + JSON.stringify(b.judged);
    if (JSON.stringify(b.testsChanged) !== '["x.test.mjs","y.json"]') return 'testsChanged: ' + JSON.stringify(b.testsChanged);
    return b.regulated === true || 'regulated not read';
  },
]);
unit.push([
  'the template brief yields no JUDGED BY lines, so an unfilled brief cannot pass',
  () => {
    const t = readFileSync(new URL('../templates/WP.md', import.meta.url), 'utf8');
    const b = parseBrief(t);
    return b.judged.length === 0 || 'parsed placeholders as checks: ' + JSON.stringify(b.judged);
  },
]);
unit.push([
  'globs: ** spans directories, * stays in one segment',
  () => {
    const ok = [
      ['tests/**', 'tests/a/b.mjs', true],
      ['**/*.test.*', 'a/b/c.test.mjs', true],
      ['**/*.test.*', 'c.test.mjs', true],
      ['src/*.mjs', 'src/a/b.mjs', false],
      ['vitest.config.*', 'vitest.config.ts', true],
    ];
    for (const [g, p, want] of ok) if (globToRegExp(g).test(p) !== want) return g + ' vs ' + p + ' expected ' + want;
    return true;
  },
]);

for (const [name, fn] of unit) {
  try {
    report(name, fn());
  } catch (e) {
    report(name, 'threw ' + e.message);
  }
}
for (const c of cases) {
  let f;
  try {
    f = c.make();
    const r = c.run ? c.run(f) : runGate(f);
    report(c.name, c.check(r, f));
  } catch (e) {
    report(c.name, 'threw ' + e.message);
  } finally {
    if (f) rmSync(f.dir, { recursive: true, force: true });
  }
}
console.log(fails ? '\n' + fails + ' case(s) failed' : '\nall cases passed');
process.exit(fails ? 1 : 0);
