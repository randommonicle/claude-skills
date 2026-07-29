#!/usr/bin/env node
// Proves push-gate.mjs still asks on every gated command AND that the freshness
// block it appends reflects real remote movement (prove-it-can-fail: a freshness
// note that says "unchanged" whatever the remote did is worse than none, and a
// probe that swallows the ask would break the gate it decorates).
// Fixtures are local-path git repos under os.tmpdir(), so no network: a bare
// origin, a clone left stale by a second clone's push, and a clone up to date.
// Run: node hooks/push-gate.test.mjs
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'push-gate.mjs');
const ORIGINAL_REASON =
  'confirm-before-push: pushes, PR merges and remote branch deletion need per-action confirmation. Branch deletion also needs the preflight (gh pr list --head/--base, git log main..branch).';

function git(args, cwd) {
  return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
}

try {
  git(['--version'], tmpdir());
} catch {
  console.log('SKIP  | git is not on PATH, fixtures cannot be built (a skip is not a pass)');
  process.exit(0);
}

function runHook(stdin) {
  return new Promise((resolve) => {
    const p = spawn('node', [HOOK], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (c) => (out += c));
    p.on('close', (code) => resolve({ out, code }));
    p.stdin.end(stdin);
  });
}

function identify(repo) {
  git(['config', 'user.name', 'Push Gate Fixture'], repo);
  git(['config', 'user.email', 'fixture@example.invalid'], repo);
  git(['config', 'commit.gpgsign', 'false'], repo);
}

function commitAndPush(repo, file, body) {
  writeFileSync(join(repo, file), body);
  git(['add', file], repo);
  git(['commit', '-m', `fixture: ${file}`], repo);
  git(['push', '-u', 'origin', 'main'], repo);
}

const root = mkdtempSync(join(tmpdir(), 'push-gate-'));
const origin = join(root, 'origin.git');
const stale = join(root, 'stale');
const fresh = join(root, 'fresh');
const plain = join(root, 'plain');
let fails = 0;

try {
  git(['init', '--bare', '-b', 'main', origin], root);
  git(['clone', origin, stale], root);
  identify(stale);
  commitAndPush(stale, 'base.txt', 'base\n');
  git(['clone', origin, fresh], root);
  identify(fresh);
  commitAndPush(fresh, 'second.txt', 'second\n');
  mkdirSync(plain);
  const originHeadBefore = git(['rev-parse', 'HEAD'], origin);

  // [name, cwd, command, assertion over the parsed reason]
  const CASES = [
    [
      'gated push, stale clone: asks and reports the movement',
      stale,
      'git push origin main',
      (r) =>
        r.includes(ORIGINAL_REASON) &&
        r.includes('origin moved') &&
        r.includes('second.txt') === false && // fetch lines name refs, not files
        r.includes('-> origin/main') &&
        r.includes('## main'),
    ],
    [
      'gated push, up-to-date clone: asks and reports no movement',
      fresh,
      'git push --force-with-lease',
      (r) => r.includes(ORIGINAL_REASON) && r.includes('origin unchanged at fetch time') && r.includes('## main'),
    ],
    [
      'gated push, non-git cwd: asks with the original reason, no freshness block',
      plain,
      'git push origin main',
      (r) => r === ORIGINAL_REASON,
    ],
    [
      'gh pr merge still asks',
      fresh,
      'gh pr merge 41 --squash',
      (r) => r.includes(ORIGINAL_REASON),
    ],
    [
      'shell-shaped cwd: still asks, original reason, nothing interpolated',
      `${plain}" ; echo INJECTED ; echo "`,
      'git push origin main',
      (r) => r === ORIGINAL_REASON,
    ],
  ];

  for (const [name, cwd, command, check] of CASES) {
    const { out, code } = await runHook(JSON.stringify({ tool_name: 'Bash', cwd, tool_input: { command } }));
    let reason = null;
    try {
      reason = JSON.parse(out).hookSpecificOutput?.permissionDecisionReason ?? null;
    } catch {}
    const asked = JSON.parse(out || '{}').hookSpecificOutput?.permissionDecision === 'ask';
    const ok = code === 0 && asked && reason !== null && check(reason);
    if (!ok) fails++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  asks  | ${name}${ok ? '' : `\n        exit=${code} out=${out}`}`);
  }

  // Negative control: an ordinary Bash call must produce no output at all.
  const q = await runHook(JSON.stringify({ tool_name: 'Bash', cwd: stale, tool_input: { command: 'ls -la' } }));
  const qok = q.code === 0 && q.out === '';
  if (!qok) fails++;
  console.log(`${qok ? 'PASS' : 'FAIL'}  quiet | non-gated command (plain ls) says nothing${qok ? '' : ` (exit=${q.code}, out=${q.out})`}`);

  // Fail-open: garbage on stdin must exit 0 and say nothing.
  const g = await runHook('not json at all');
  const gok = g.code === 0 && g.out === '';
  if (!gok) fails++;
  console.log(`${gok ? 'PASS' : 'FAIL'}  quiet | malformed stdin exits 0 silently (exit=${g.code})`);

  // The hook fetches; it must never push. Origin must be exactly where it was.
  const originHeadAfter = git(['rev-parse', 'HEAD'], origin);
  const pok = originHeadBefore === originHeadAfter;
  if (!pok) fails++;
  console.log(`${pok ? 'PASS' : 'FAIL'}  safe  | origin HEAD unmoved by the probe (${originHeadBefore.slice(0, 7)})`);
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
