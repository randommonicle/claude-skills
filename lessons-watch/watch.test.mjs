#!/usr/bin/env node
// Suite for lib.mjs, count.mjs and mirror.mjs. Run as `node lessons-watch/watch.test.mjs`
// and judge it by exit code. Node stdlib and git only; the mirror cases use throwaway
// repositories under the temp dir and never touch a network.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { countCandidates, scanSecrets } from './lib.mjs';
import { collect, report, mirrorNotes } from './count.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let failed = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`ok   ${name}`);
  else { failed++; console.log(`FAIL ${name}${detail ? ` :: ${detail}` : ''}`); }
}

// ---- countCandidates: every shape seen in real lessons files on 2026-11-14 ----
const EN = String.fromCharCode(0x2013), EM = String.fromCharCode(0x2014);
const shapes = [
  'skill that should have prevented this: none - new candidate',
  'skill that should have prevented this: none - new candidate.',
  'skill that should have prevented this: prove-it-can-fail / none - new candidate',
  'skill that should have prevented this: none - new candidate (units stated at every boundary)',
  'the runner invocation itself. none - new candidate (gate-coverage-allowlist-drift).',
  `Skill that should have prevented this: none ${EN} new candidate`,
  `skill that should have prevented this: none ${EM} New Candidate`,
  '**skill that should have prevented this:** none, new candidate.',
  'skill that should have prevented this: none for (1) and (2), new candidate: the precondition',
  'New candidate: pin-the-generator-inputs.',
];
check('"renew candidates" is not a match', countCandidates('we renew candidates yearly; a newcandidate too') === 0);
check('counts each real line shape once', countCandidates(shapes.join('\r\n')) === shapes.length, String(countCandidates(shapes.join('\r\n'))));
check('a covered entry is not a candidate', countCandidates('skill that should have prevented this: verify-the-effect') === 0);
check('the quoted template line is not an entry', countCandidates('add one line: "skill that should have\nprevented this: <name> / none - new candidate". That line') === 0);
check('an empty file counts zero candidates', countCandidates('') === 0);

// ---- scanSecrets: planted shapes go red, an innocent corpus stays clean ----
// Fakes are assembled at run time so no scanner reading this file sees a token.
const a = (n, c = 'a') => c.repeat(n);
const planted = {
  'github-token': 'gh' + 'p_' + a(36),
  'github-fine-grained-token': 'github' + '_pat_' + a(44),
  'api-key-sk': 's' + 'k-ant-' + a(40),
  'aws-access-key': 'AK' + 'IA' + a(16, 'B'),
  'slack-token': 'xo' + 'xb-' + a(24, '1'),
  'private-key-block': '-----BEGIN RSA ' + 'PRIVATE KEY-----',
  jwt: 'ey' + 'J' + a(20) + '.ey' + 'J' + a(20) + '.' + a(20),
  'supabase-token': 'sb' + 'p_' + a(40, 'c'),
  'stripe-live-key': 's' + 'k_live_' + a(24),
  'stripe-webhook-secret': 'wh' + 'sec_' + a(30),
  'google-api-key': 'AI' + 'za' + a(35),
  'resend-key': 'r' + 'e_' + a(8) + '_' + a(20),
};
for (const [name, value] of Object.entries(planted)) {
  const hit = scanSecrets(`the call failed with ${value} in the header`);
  check(`secret shape ${name} is caught`, hit.includes(name), hit.join(',') || 'clean');
}
const innocent = [
  'commit 4141fa0c9d2e7b61a0f3c5d8e9b2a17c6f4d3e21 landed on main',
  'id 550e8400-e29b-41d4-a716-446655440000 in the audit row',
  'pip install sk-learn; the re_render_component_on_every_keystroke bug',
  'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  'SUPABASE_SERVICE_ROLE_KEY was unset (length 0), sk_test_ keys only in fixtures',
  'the JWT header eyJhbGciOi was truncated in the log',
].join('\n');
check('an innocent corpus is clean', scanSecrets(innocent).length === 0, scanSecrets(innocent).join(','));

// ---- collect + report, with a stub fetch driving each failure mode ----
const root = mkdtempSync(join(tmpdir(), 'lw-count-'));
mkdirSync(join(root, 'mirror', 'Local'), { recursive: true });
writeFileSync(join(root, 'mirror', 'Local', 'LESSONS_LEARNED.md'), shapes.slice(0, 3).join('\n') + '\n');
writeFileSync(join(root, 'mirror', 'Local', 'EMPTY.md'), '');
const bodies = {
  'o/good': { status: 200, text: shapes.slice(0, 5).join('\n') },
  'o/shrunk': { status: 200, text: shapes[0] },
  'o/private': { status: 404, text: '{"message":"Not Found"}' },
  'o/expired': { status: 401, text: '{"message":"Bad credentials"}' },
  'o/blank': { status: 200, text: '' },
};
const seen = [];
const stub = async (url, init) => {
  seen.push({ url, auth: init.headers.Authorization });
  const key = Object.keys(bodies).find((k) => url.includes(`/repos/${k}/`));
  const b = bodies[key];
  return { status: b.status, text: async () => b.text };
};
const config = {
  threshold: 3,
  sources: [
    { name: 'good', type: 'github', repo: 'o/good', path: 'docs/LESSONS LEARNED.md', baseline: 2 },
    { name: 'unknown-baseline', type: 'file', path: 'mirror/Local/LESSONS_LEARNED.md', baseline: null },
    { name: 'shrunk', type: 'github', repo: 'o/shrunk', path: 'L.md', baseline: 4 },
    { name: 'private', type: 'github', repo: 'o/private', path: 'L.md', baseline: 0 },
    { name: 'expired', type: 'github', repo: 'o/expired', path: 'L.md', baseline: 0 },
    { name: 'blank', type: 'github', repo: 'o/blank', path: 'L.md', baseline: 0 },
    { name: 'gone', type: 'file', path: 'mirror/Nope/LESSONS_LEARNED.md', baseline: 0 },
    { name: 'empty-file', type: 'file', path: 'mirror/Local/EMPTY.md', baseline: 0 },
    { name: 'badrepo', type: 'github', repo: 'not a repo', path: 'L.md', baseline: 0 },
    { name: 'dup', type: 'excluded', reason: 'second checkout of good' },
  ],
};
const rows = await collect(config, { root, token: 'tok', fetchImpl: stub });
const by = Object.fromEntries(rows.map((r) => [r.name, r]));
check('a readable github source is counted against its baseline', by.good.current === 5 && by.good.unswept === 3);
check('the path is encoded and the token sent', seen[0].url.endsWith('/contents/docs/LESSONS%20LEARNED.md') && seen[0].auth === 'Bearer tok', seen[0].url);
check('an unknown baseline counts from 0 and is flagged', by['unknown-baseline'].unswept === 3 && by['unknown-baseline'].baselineKnown === false);
check('a count below its baseline stays negative', by.shrunk.unswept === -3);
for (const n of ['private', 'expired', 'blank', 'gone', 'empty-file', 'badrepo']) {
  check(`unreadable source "${n}" is an error, never a zero`, typeof by[n].error === 'string' && by[n].current === undefined, JSON.stringify(by[n]));
}
check('a malformed repo never reaches the network', !seen.some((s) => s.url.includes('not a repo')));
const rep = report(rows, { threshold: config.threshold, notes: ['Not copied: **X** (matches secret shape: jwt).'], now: new Date('2026-11-14T00:00:00Z') });
check('the total sums positive deltas only', rep.total === 6, String(rep.total));
check('every unreadable source is counted as failed', rep.failed === 6, String(rep.failed));
check('the report says the total is incomplete', rep.text.includes('could not be read, so the total is incomplete'));
check('the report names the 404 cause', rep.text.includes('NOT READ: HTTP 404 (missing, or private and the token cannot read it)'));
check('the report flags the below-baseline source', rep.text.includes('below its baseline'));
check('the report lists the excluded source with its reason', rep.text.includes('| dup | | | | excluded: second checkout of good |'));
check('the report carries a skipped file by name', rep.text.includes('Not copied: **X**'));
check('the marker line carries the three figures', rep.text.includes('<!-- lessons-watch total=6 failed=6 warnings=2 -->'));
const clean = report(rows.filter((r) => !r.error && r.name !== 'shrunk'), { threshold: 3, now: new Date('2026-11-14T00:00:00Z') });
check('a clean run over the threshold says a sweep is due', clean.failed === 0 && clean.text.includes('a sweep is due'));

const now = Date.parse('2026-11-14T00:00:00Z');
check('no status with file sources is a note', mirrorNotes(null, now, true).length === 1);
check('no status and no file sources is silent', mirrorNotes(null, now, false).length === 0);
check('a fresh, complete status is silent', mirrorNotes({ ranAt: '2026-11-13T05:40:00Z', host: 'h', files: [{ name: 'A', state: 'copied' }] }, now, true).length === 0);
check('a stale status is a note', mirrorNotes({ ranAt: '2026-11-01T05:40:00Z', host: 'h', files: [] }, now, true)[0].includes('12 days ago'));
check('skipped and missing files are each a note', mirrorNotes({ ranAt: '2026-11-13T05:40:00Z', host: 'h', files: [{ name: 'A', state: 'skipped', reason: 'r' }, { name: 'B', state: 'missing' }] }, now, true).length === 2);

// ---- count.mjs as a CLI: exit code is the contract the workflow relies on ----
const node = process.execPath;
const run = (script, args, env = {}) => spawnSync(node, [join(here, script), ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
writeFileSync(join(root, 'ok.json'), JSON.stringify({ sources: [{ name: 'l', type: 'file', path: 'mirror/Local/LESSONS_LEARNED.md', baseline: 1 }] }));
writeFileSync(join(root, 'bad.json'), JSON.stringify({ sources: [{ name: 'g', type: 'file', path: 'mirror/Nope/x.md', baseline: 0 }] }));
writeFileSync(join(root, 'none.json'), JSON.stringify({ sources: [] }));
const okRun = run('count.mjs', ['--config', join(root, 'ok.json'), '--out', join(root, 'r.md')]);
check('CLI exits 0 when every source is read', okRun.status === 0, okRun.stderr);
check('CLI writes the report file', existsSync(join(root, 'r.md')) && readFileSync(join(root, 'r.md'), 'utf8').includes('**2 unswept candidates**'));
check('CLI exits 1 when a source cannot be read', run('count.mjs', ['--config', join(root, 'bad.json'), '--out', join(root, 'r2.md')]).status === 1);
check('CLI still writes the report on failure', readFileSync(join(root, 'r2.md'), 'utf8').includes('NOT READ'));
check('CLI exits 1 on an empty source list', run('count.mjs', ['--config', join(root, 'none.json')]).status === 1);
check('CLI exits 1 with no config', run('count.mjs', []).status === 1);

// ---- mirror.mjs against a throwaway origin ----
const g = (cwd, ...args) => spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
const base = mkdtempSync(join(tmpdir(), 'lw-mirror-'));
const bare = join(base, 'origin.git'), clone = join(base, 'clone'), src = join(base, 'src');
mkdirSync(src);
spawnSync('git', ['init', '--quiet', '--bare', '--initial-branch=main', bare]);
spawnSync('git', ['clone', '--quiet', bare, clone]);
g(clone, 'config', 'user.email', 'test@example.invalid'); g(clone, 'config', 'user.name', 'Test');
g(clone, 'checkout', '--quiet', '-b', 'main');
writeFileSync(join(clone, 'watch.json'), '{}\n'); g(clone, 'add', '.'); g(clone, 'commit', '--quiet', '-m', 'init'); g(clone, 'push', '--quiet', '-u', 'origin', 'main');
const originUrl = g(clone, 'remote', 'get-url', 'origin').stdout.trim();
writeFileSync(join(src, 'LESSONS_LEARNED.md'), shapes.slice(0, 2).join('\r\n') + '\r\n');
writeFileSync(join(src, 'LEAKY.md'), `entry\nheader was ${planted['github-token']}\n`);
const cfgPath = join(base, 'lessons-watch.json');
const writeCfg = (over = {}) => writeFileSync(cfgPath, JSON.stringify({
  clone, origin: originUrl,
  files: [
    { name: 'Good', file: join(src, 'LESSONS_LEARNED.md') },
    { name: 'Leaky', file: join(src, 'LEAKY.md') },
    { name: 'Absent', file: join(src, 'nope.md') },
    { name: '../escape', file: join(src, 'LESSONS_LEARNED.md') },
  ], ...over,
}));

const unconfigured = run('mirror.mjs', ['--config', join(base, 'no-such.json')]);
check('with no config the mirror does nothing, says so, and exits 0', unconfigured.status === 0 && unconfigured.stdout.includes('not configured'), unconfigured.stdout);

writeCfg();
const headBefore = g(bare, 'rev-parse', 'main').stdout.trim();
const dry = run('mirror.mjs', ['--config', cfgPath, '--dry-run']);
check('a dry run writes and pushes nothing', !existsSync(join(clone, 'mirror')) && g(bare, 'rev-parse', 'main').stdout.trim() === headBefore, dry.stdout);
check('a dry run names what it would do', dry.stdout.includes('would be copied: Good') && dry.stdout.includes('would be skipped: Leaky'));

writeCfg({ origin: 'https://example.invalid/somewhere/else.git' });
const wrong = run('mirror.mjs', ['--config', cfgPath]);
check('an unexpected origin stops the run before any copy', wrong.status === 1 && !existsSync(join(clone, 'mirror')), wrong.stderr);

writeCfg();
const real = run('mirror.mjs', ['--config', cfgPath]);
check('a run with a skipped file exits 1', real.status === 1, real.stdout + real.stderr);
const pushed = (p) => g(bare, 'show', `main:${p}`);
check('the clean file reached the origin, LF-normalised', pushed('mirror/Good/LESSONS_LEARNED.md').stdout === shapes.slice(0, 2).join('\n') + '\n');
check('the leaky file never reached the origin', pushed('mirror/Leaky/LEAKY.md').status !== 0);
check('the leaky file is not in the clone either', !existsSync(join(clone, 'mirror', 'Leaky')));
check('an unsafe name writes nothing outside mirror/', !existsSync(join(clone, 'escape')) && !existsSync(join(base, 'escape')));
const status = JSON.parse(pushed('mirror/STATUS.json').stdout || '{}');
const st = Object.fromEntries((status.files ?? []).map((f) => [f.name, f]));
check('STATUS records copied, skipped and missing by name', st.Good?.state === 'copied' && st.Leaky?.state === 'skipped' && st.Absent?.state === 'missing' && st['../escape']?.state === 'skipped', JSON.stringify(st));
check('STATUS names the secret shape and not the value', st.Leaky?.reason === 'matches secret shape: github-token' && !JSON.stringify(status).includes(planted['github-token']));
check('the run output never prints the secret', !(real.stdout + real.stderr).includes(planted['github-token']));
check('STATUS carries when and where it ran', typeof status.ranAt === 'string' && typeof status.host === 'string');

writeCfg({ files: [{ name: 'Good', file: join(src, 'LESSONS_LEARNED.md') }] });
const again = run('mirror.mjs', ['--config', cfgPath]);
check('a clean run exits 0 and reports unchanged', again.status === 0 && again.stdout.includes('unchanged: Good'), again.stdout + again.stderr);
check('a clean run still pushes a fresh STATUS', g(bare, 'rev-list', '--count', 'main').stdout.trim() === '3');

for (const d of [root, base]) { try { rmSync(d, { recursive: true, force: true }); } catch { /* temp dir, best effort */ } }
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
