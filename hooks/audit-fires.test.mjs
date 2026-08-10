#!/usr/bin/env node
// Proves audit-fires.mjs counts what it claims to count AND cannot be crashed by
// the two logs it reads (prove-it-can-fail: an audit that silently miscounts is
// worse than no audit, because a tier gets moved on it). Builds a fixture fire log
// and a fixture repo under os.tmpdir(), spawns the tool against them, and asserts
// on stdout. The inventory is the real /tmp/cs library, because the tool
// enumerates its own siblings, so every inventory assertion is membership and tag,
// never a total.
// Run: node hooks/audit-fires.test.mjs
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOL = join(dirname(fileURLToPath(import.meta.url)), 'audit-fires.mjs');

const root = mkdtempSync(join(tmpdir(), 'audit-fires-'));
const fireLog = join(root, 'FIRE_LOG.jsonl');
const repo = join(root, 'demo-repo');
mkdirSync(join(repo, 'docs'), { recursive: true });

// Several skills across two working directories and three dates, one line of
// rubbish, one line that parses but names no skill, and a blank line.
const fire = (ts, skill, cwd) => JSON.stringify({ ts, skill, args: null, cwd });
writeFileSync(
  fireLog,
  [
    fire('2026-07-20T09:15:00.000Z', 'safe-smokes', 'C:/r/propos'),
    fire('2026-07-20T10:02:00.000Z', 'db-migration-verification', 'C:/r/propos'),
    fire('2026-07-21T08:40:00.000Z', 'safe-smokes', 'C:/r/propos'),
    '{ this is not json',
    fire('2026-07-21T09:00:00.000Z', 'verify-the-effect', 'C:/r/site'),
    fire('2026-07-22T11:30:00.000Z', 'safe-smokes', 'C:/r/site'),
    fire('2026-07-22T11:45:00.000Z', 'db-migration-verification', 'C:/r/site'),
    fire('2026-07-22T12:00:00.000Z', 'pdf', 'C:/r/site'),
    fire('2026-07-22T12:05:00.000Z', 'wrangler', 'C:/r/site'),
    JSON.stringify({ ts: '2026-07-22T12:10:00.000Z', cwd: 'C:/r/site' }),
    '',
  ].join('\n') + '\n',
);

writeFileSync(
  join(repo, 'docs', 'LESSONS_LEARNED.md'),
  [
    '# Lessons learned',
    '',
    '## 2026-07-20 smoke deleted shared rows',
    'skill that should have prevented this: safe-smokes',
    '',
    '## 2026-07-21 teardown asserted nothing',
    '- skill that should have prevented this: safe-smokes, and the teardown never counted its rows.',
    '',
    '## 2026-07-22 migration shipped without a catalog check',
    'skill that should have prevented this: db-migration-verification (the post-apply half, app/tests/smoke path)',
    '',
    '## 2026-07-23 nothing in the library covered this',
    'skill that should have prevented this: none - new candidate (fire-log-blind-spots)',
    '',
    '## 2026-07-24 half covered',
    '**skill that should have prevented this:** live-state-first / none - new candidate (inventory-drift)',
    '',
  ].join('\n'),
);

function run(args) {
  return new Promise((resolve) => {
    const p = spawn('node', [TOOL, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    p.stdout.on('data', (c) => (out += c));
    p.stderr.on('data', (c) => (err += c));
    p.on('close', (code) => resolve({ out, err, code }));
  });
}

let fails = 0;
function check(name, ok, detail = '') {
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  | ${name}${ok || !detail ? '' : ` (${detail})`}`);
}

// One section's indented body only: headings sit at column 0, every row under them
// is indented, so the next non-blank column-0 line ends the section. Without this
// bound a "not in this section" assertion would match a row in a later section.
function body(out, section) {
  const from = out.indexOf(section);
  if (from < 0) return [];
  const lines = out.slice(from).split('\n').slice(1);
  const end = lines.findIndex((l) => l && !/^\s/.test(l));
  return end === -1 ? lines : lines.slice(0, end);
}

// A row for `skill`, as one whitespace-collapsed line.
function row(out, section, skill) {
  const line = body(out, section).find((l) => new RegExp(`^\\s{2}${skill}\\s`).test(l));
  return line ? line.trim().replace(/\s+/g, ' ') : '';
}

const main = await run(['--fire-log', fireLog, '--repo', repo]);

check('exits 0 on a complete run', main.code === 0, `exit=${main.code} stderr=${main.err.trim()}`);

// Section 1: counts, timestamps, distinct cwds.
const s1 = '1. FIRES PER SKILL';
check(
  'safe-smokes: 3 fires, 2 cwds, first and last ts',
  row(main.out, s1, 'safe-smokes') ===
    'safe-smokes 3 2026-07-20T09:15:00.000Z 2026-07-22T11:30:00.000Z 2',
  row(main.out, s1, 'safe-smokes'),
);
check(
  'db-migration-verification: 2 fires, 2 cwds',
  /^db-migration-verification 2 .* 2$/.test(row(main.out, s1, 'db-migration-verification')),
  row(main.out, s1, 'db-migration-verification'),
);
check(
  'verify-the-effect: 1 fire, 1 cwd',
  /^verify-the-effect 1 .* 1$/.test(row(main.out, s1, 'verify-the-effect')),
  row(main.out, s1, 'verify-the-effect'),
);
check('fires sorted by count desc', main.out.indexOf('\n  safe-smokes ') < main.out.indexOf('\n  verify-the-effect '));
check(
  'malformed and skill-less lines skipped and counted',
  main.out.includes('malformed lines skipped: 2'),
  main.out.split('\n').find((l) => l.includes('malformed lines skipped')),
);
// The vendor half can only red on a machine where the pack is installed: in CI
// no wrangler/ directory exists, so it is a stranger with or without the VENDOR
// set. check-index.test.mjs carries the fixture-built half that reds anywhere.
check(
  'a fired built-in and a fired vendor skill are flagged as outside the inventory',
  /outside the inventory \(built-in, vendor, or retired\): pdf, wrangler/.test(main.out),
);

// Section 2: a zero must arrive with the reason it may be expected.
const s2 = '2. NEVER FIRED';
check(
  'never-fired norm carries the norm tag',
  row(main.out, s2, 'live-state-first') === 'live-state-first norm: always-on, invisible to this log',
  row(main.out, s2, 'live-state-first'),
);
check(
  'never-fired hook-backed skill carries the hook tag',
  row(main.out, s2, 'confirm-before-push') ===
    'confirm-before-push hook-backed: enforced without a Skill call',
  row(main.out, s2, 'confirm-before-push'),
);
check(
  'a never-fired skill with no layer says the zero is a real question',
  /^lock-at-the-chokepoint no layer tag: a zero here is a real question$/.test(
    row(main.out, s2, 'lock-at-the-chokepoint'),
  ),
  row(main.out, s2, 'lock-at-the-chokepoint'),
);
check('a skill that fired is absent from never-fired', row(main.out, s2, 'safe-smokes') === '');

// Section 3: misses, including the parenthetical and multi-skill forms.
const s3 = '3. MISSES PER SKILL';
check(
  'two lines naming the same skill count as 2',
  /^safe-smokes 2 demo-repo$/.test(row(main.out, s3, 'safe-smokes')),
  row(main.out, s3, 'safe-smokes'),
);
check(
  'parenthetical aside containing slashes counts once, not as extra skills',
  /^db-migration-verification 1 demo-repo$/.test(row(main.out, s3, 'db-migration-verification')),
  row(main.out, s3, 'db-migration-verification'),
);
check(
  'multi-skill line counts its named skill',
  /^live-state-first 1 demo-repo$/.test(row(main.out, s3, 'live-state-first')),
  row(main.out, s3, 'live-state-first'),
);
check('the aside is not counted as a skill', row(main.out, s3, 'the') === '' && row(main.out, s3, 'tests') === '');
check('all five miss lines matched', main.out.includes('miss lines matched: 5'));
check(
  'new-candidate slugs listed with their repo',
  /^fire-log-blind-spots demo-repo 1$/.test(row(main.out, s3, 'fire-log-blind-spots')) &&
    /^inventory-drift demo-repo 1$/.test(row(main.out, s3, 'inventory-drift')),
  `${row(main.out, s3, 'fire-log-blind-spots')} / ${row(main.out, s3, 'inventory-drift')}`,
);
check('no miss value failed to parse', !main.out.includes('did not parse'));

// Section 4: totals, the session proxy stated as a proxy, and the cross-reference.
const s4 = '4. SUMMARY';
// Eight valid lines: the rubbish line and the line naming no skill are both skipped.
check(
  'total fires counts every valid line',
  /^total fires 8$/.test(row(main.out, s4, 'total fires')),
  row(main.out, s4, 'total fires'),
);
check(
  'sessions is date + cwd and says it is a proxy',
  /^sessions \(proxy: date \+ cwd, not a real session id\) 4$/.test(row(main.out, s4, 'sessions')),
  row(main.out, s4, 'sessions'),
);
check(
  'fires per session derived from the proxy',
  /^fires per session 2\.0$/.test(row(main.out, s4, 'fires per session')),
  row(main.out, s4, 'fires per session'),
);
check('total misses counts named plus new candidates', /^total misses 6$/.test(row(main.out, s4, 'total misses')));
check(
  'loads vs misses lists a skill in both logs',
  /^safe-smokes 3 2$/.test(row(main.out, '  loads vs misses', 'safe-smokes')),
  row(main.out, '  loads vs misses', 'safe-smokes'),
);
check(
  'a skill with misses but no fires stays out of loads vs misses',
  row(main.out, '  loads vs misses', 'live-state-first') === '',
);

// Fail-loud per file, and still exit 0: the run is an audit, not a gate.
const noLessons = await run(['--fire-log', fireLog, '--repo', join(root, 'absent-repo')]);
check(
  'missing LESSONS file gives a one-line notice and exit 0',
  noLessons.code === 0 &&
    /^notice: misses log not read at .*absent-repo.*LESSONS_LEARNED\.md: file not found \(no misses counted for absent-repo\)$/m.test(
      noLessons.out,
    ),
  `exit=${noLessons.code}`,
);
check(
  'fires still reported when the misses log is absent',
  /^total fires 8$/.test(row(noLessons.out, s4, 'total fires')),
  row(noLessons.out, s4, 'total fires'),
);

const noFireLog = await run(['--fire-log', join(root, 'absent.jsonl'), '--repo', repo]);
check(
  'missing fire log gives a notice, exit 0, and misses still counted',
  noFireLog.code === 0 &&
    /^notice: fire log not read at .*absent\.jsonl: file not found/m.test(noFireLog.out) &&
    /^total fires 0$/.test(row(noFireLog.out, s4, 'total fires')) &&
    /^named misses 4$/.test(row(noFireLog.out, s4, 'named misses')),
  `exit=${noFireLog.code}`,
);
check(
  'with no fire log every inventoried skill is listed as never fired',
  row(noFireLog.out, s2, 'safe-smokes') === 'safe-smokes no layer tag: a zero here is a real question',
  row(noFireLog.out, s2, 'safe-smokes'),
);

const noRepo = await run(['--fire-log', fireLog]);
check(
  'no --repo says so rather than implying zero misses',
  noRepo.code === 0 && noRepo.out.includes('notice: no --repo given'),
  `exit=${noRepo.code}`,
);

const badArg = await run(['--nope']);
check('an unknown argument fails loudly with the usage line', badArg.code === 1 && badArg.err.includes('usage:'), `exit=${badArg.code}`);

rmSync(root, { recursive: true, force: true });

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
