#!/usr/bin/env node
// Proves record-time-warn.mjs fires on a stamp typed ahead of its commit and stays quiet on the
// near-misses a real record is full of (prove-it-can-fail and prove-it-can-pass: the corpus it was
// shaped on is 6,401 commits of eight repositories, docs/SKILL_PROPOSALS_2026-11-23.md).
// Every commit's clock is pinned, and each stamp is computed from that pin, so no case depends on
// a minute boundary. Throwaway git repositories under the temp dir; no network.
// Run: node hooks/record-time-warn.test.mjs
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.TZ = 'Europe/London';
const HOOK = process.env.RECORD_TIME_HOOK || join(dirname(fileURLToPath(import.meta.url)), 'record-time-warn.mjs');
const { ahead, commitDir, isRecord, recordLines } = await import(`file://${HOOK.replace(/\\/g, '/').replace(/^(?=[A-Za-z]:)/, '/')}`);

let fails = 0;
const check = (name, ok, detail = '') => {
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`);
};

// --- the stamp rule, on fixed instants ---
const at = (iso) => Date.parse(iso);
const mins = (line, iso) => ahead(line, at(iso)).map((x) => x.minutes).join(',');
check('a UTC stamp 13 min ahead is found', mins('### UPDATE 2026-10-27 07:58 UTC: x', '2026-10-27T07:45:31Z') === '13');
check('the comma form is found', mins('## CLOSE 2026-11-02, 22:15 UTC', '2026-11-02T22:12:28Z') === '3');
check('the " at " form is found', mins('## Done 2026-11-02 at 22:15 GMT', '2026-11-02T22:12:28Z') === '3');
check('the T form with Z is found', mins('updated: 2026-10-03T10:25Z', '2026-10-03T10:05:00Z') === '20');
check('two minutes ahead is found', mins('## 2026-11-02 10:02 UTC', '2026-11-02T10:00:59Z') === '2');
check('one minute ahead passes as rounding', mins('## 2026-11-02 10:01 UTC', '2026-11-02T10:00:01Z') === '');
check('a stamp equal to the commit minute passes', mins('## 2026-11-02 10:00 UTC', '2026-11-02T10:00:59Z') === '');
check('an old stamp passes', mins('## 2026-11-01 23:00 UTC', '2026-11-02T10:00:00Z') === '');
check('four hours ahead is still a slip', mins('## 2026-11-02 14:00 UTC', '2026-11-02T10:00:00Z') === '240');
check('a deadline beyond four hours passes', mins('## Grants until 2026-11-02 14:01 UTC', '2026-11-02T10:00:00Z') === '');
check('a BST stamp is an hour earlier in UTC', mins('## 2026-07-01 12:35 BST', '2026-07-01T11:31:00Z') === '4');
check('a BST stamp in the past passes', mins('## 2026-07-01 12:30 BST', '2026-07-01T11:31:00Z') === '');
check('an unlabelled summer time is read as local', mins('## 2026-07-01 12:30', '2026-07-01T11:31:00Z') === '');
check('an unlabelled summer time later than both readings is found', mins('## 2026-07-01 12:40', '2026-07-01T11:31:00Z') === '9');
check('the same time labelled UTC is found', mins('## 2026-07-01 12:30 UTC', '2026-07-01T11:31:00Z') === '59');
check('a time with no date beside it is not a stamp', mins('## Next: the 16:00 run on 2026-11-02', '2026-11-02T10:00:00Z') === '');
check('a date, then words, then a time is not a stamp', mins('## 2026-11-02: the 12:50 probe is armed', '2026-11-02T10:00:00Z') === '');
check('a date with no time is not a stamp', mins('## 2026-11-02 close', '2026-11-02T10:00:00Z') === '');
check('a line reference is not a stamp', mins('## mcp.ts:190 2026-11-02', '2026-11-02T10:00:00Z') === '');
check('two stamps on one line are both judged', mins('## 2026-11-02 10:30 UTC, close 2026-11-02 10:45 UTC', '2026-11-02T10:00:00Z') === '30,45');

// --- which files and lines are read ---
for (const [f, want] of [['HANDOVER.md', true], ['docs/HANDOVER_x_2026-11-23.md', true], ['team/NOW.md', true], ['LESSONS_LEARNED.md', true], ['exchange/REVIEW_a-b.md', true], ['README.md', false], ['docs/NOWHERE.md', false], ['HANDOVER.mjs', false], ['notes/REPORT.md', false]]) {
  check(`${f} is ${want ? '' : 'not '}a record`, isRecord(f) === want);
}
const patch = ['diff --git a/HANDOVER.md b/HANDOVER.md', '--- a/HANDOVER.md', '+++ b/HANDOVER.md', '@@ -1 +1,4 @@', '-## old heading', '+## new heading', '+body line', '++++ not a file header', '+updated: x', 'diff --git a/README.md b/README.md', '--- a/README.md', '+++ b/README.md', '@@ -0,0 +1 @@', '+## a readme heading'].join('\n');
check('only added headings and updated lines of records are read', recordLines(patch).map((x) => x.line).join('|') === '## new heading|updated: x', JSON.stringify(recordLines(patch)));

// --- where the commit landed ---
const base = process.platform === 'win32' ? 'C:/w' : '/w';
check('a plain commit uses the event cwd', commitDir('git commit -m x', base) === base);
check('git -C names the folder', commitDir(`git -C "${base}/a b" commit -m x`, base).replace(/\\/g, '/') === `${base}/a b`);
check('a cd before the commit names the folder', commitDir(`cd "${base}/a b" && git add . && git commit -m x`, base).replace(/\\/g, '/') === `${base}/a b`);
if (process.platform === 'win32') check('an MSYS path is translated', commitDir('cd /c/w/x && git commit -m x', 'C:/y').replace(/\\/g, '/') === 'c:/w/x');
check('commit-tree is not a commit', commitDir('git commit-tree abc', base) === null);
check('a command with no commit is not read', commitDir('git log --oneline', base) === null);

// --- end to end, on real commits ---
const root = mkdtempSync(join(tmpdir(), 'record-time-'));
const pad = (n) => String(n).padStart(2, '0');
const stamp = (ms) => { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`; };
let n = 0;
function repo({ file = 'HANDOVER.md', before, body, subject = 'record', agoMs = 0 }) {
  const dir = join(root, `r${++n}`);
  mkdirSync(dir);
  const commitMs = Date.now() - agoMs;
  const env = { ...process.env, GIT_AUTHOR_DATE: `@${Math.floor(commitMs / 1000)} +0000`, GIT_COMMITTER_DATE: `@${Math.floor(commitMs / 1000)} +0000`, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid' };
  const git = (...a) => execFileSync('git', ['-C', dir, '-c', 'core.autocrlf=false', '-c', 'commit.gpgsign=false', ...a], { env, stdio: 'ignore' });
  git('init', '-q');
  if (before !== undefined) { writeFileSync(join(dir, file), typeof before === 'function' ? before(commitMs) : before); git('add', '.'); git('commit', '-q', '-m', 'first'); }
  writeFileSync(join(dir, file), typeof body === 'function' ? body(commitMs) : body);
  git('add', '.');
  git('commit', '-q', '-m', typeof subject === 'function' ? subject(commitMs) : subject);
  return dir;
}
function fire(event, raw) {
  return new Promise((done) => {
    const p = spawn(process.execPath, [HOOK], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (c) => (out += c));
    p.on('close', (code) => done({ out, code }));
    p.stdin.end(raw ?? JSON.stringify(event));
  });
}
const M = 60000;
const CASES = [
  ['a heading 10 min ahead', true, { body: (c) => `## UPDATE ${stamp(c + 10 * M)}\n` }],
  ['an updated: line 10 min ahead in NOW.md', true, { file: 'NOW.md', body: (c) => `updated: ${stamp(c + 10 * M)}\n` }],
  ['a subject 10 min ahead', true, { body: 'x\n', subject: (c) => `Handover ${stamp(c + 10 * M)}` }],
  ['a subject that corrects a stamp', false, { body: 'x\n', subject: (c) => `record: correct the ${stamp(c + 10 * M)} stamp` }],
  ['a heading read from the clock', false, { body: (c) => `## UPDATE ${stamp(c)}\n` }],
  ['a heading from an hour ago', false, { body: (c) => `## UPDATE ${stamp(c - 60 * M)}\n` }],
  ['a future time in body text', false, { body: (c) => `## UPDATE\nthe next run is ${stamp(c + 10 * M)}\n` }],
  ['a future heading in a file that is not a record', false, { file: 'README.md', body: (c) => `## Event ${stamp(c + 10 * M)}\n` }],
  ['a future heading this commit removes', false, { before: (c) => `## UPDATE ${stamp(c + 10 * M)}\nkeep\n`, body: 'keep\n' }],
  ['a future heading that was already there', false, { before: (c) => `## UPDATE ${stamp(c + 10 * M)}\n`, body: (c) => `## UPDATE ${stamp(c + 10 * M)}\nmore\n` }],
  ['a HEAD that this command did not make', false, { body: (c) => `## UPDATE ${stamp(c + 10 * M)}\n`, agoMs: 10 * M }],
];
for (const [name, want, spec] of CASES) {
  const dir = repo(spec);
  const { out, code } = await fire({ tool_name: 'Bash', cwd: dir, tool_input: { command: 'git add -A && git commit -q -m x' } });
  const fired = out.includes('record-time-warn:');
  check(`${want ? 'fires' : 'quiet'} | ${name}`, code === 0 && fired === want && (want || out === ''), `exit=${code} out=${out.slice(0, 160)}`);
}
{
  const dir = repo({ body: (c) => `## UPDATE ${stamp(c + 10 * M)}\n` });
  const a = await fire({ tool_name: 'PowerShell', cwd: root, tool_input: { command: `git -C "${dir.replace(/\\/g, '/')}" commit -m x` } });
  check('fires | through -C from another folder, under PowerShell', a.out.includes('record-time-warn:'));
  const j = JSON.parse(a.out || '{}');
  check('it warns and never blocks', j.hookSpecificOutput?.hookEventName === 'PostToolUse' && !('permissionDecision' in (j.hookSpecificOutput || {})) && !('decision' in j) && !('continue' in j));
  check('it names the stamp, the file and the minutes', /HANDOVER\.md: "20\d\d-\d\d-\d\d \d\d:\d\d UTC" is 10 min after the commit/.test(j.systemMessage || ''), j.systemMessage);
  const b = await fire({ tool_name: 'Bash', cwd: root, tool_input: { command: 'git commit -m x' } });
  check('quiet | a folder that is not a repository', b.code === 0 && b.out === '');
  const c = await fire({ tool_name: 'Bash', cwd: dir, tool_input: { command: 'git status' } });
  check('quiet | a command that is not a commit', c.code === 0 && c.out === '');
  const d = await fire(null, 'not json at all');
  check('quiet | input that is not JSON', d.code === 0 && d.out === '');
}
rmSync(root, { recursive: true, force: true, maxRetries: 5 });
console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
process.exit(fails ? 1 : 0);
