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
    // Global options between `git` and `push` are still a push. `git -C` is the
    // idiom parallel-work-recon mandates in worktrees; on 2026-09-14 it walked
    // past the gate unasked.
    [
      'git -C <quoted path> push: asks',
      fresh,
      `git -C "${fresh}" push origin main`,
      (r) => r.includes(ORIGINAL_REASON),
    ],
    [
      // Quoted on purpose: an unquoted path ending in `.git` followed by ` push`
      // matched the old pattern by accident and proved nothing.
      'git --git-dir="<path>" push: asks',
      fresh,
      `git --git-dir="${join(fresh, '.git')}" push`,
      (r) => r.includes(ORIGINAL_REASON),
    ],
    [
      'git -c key=value push: asks',
      fresh,
      'git -c core.autocrlf=false push origin main',
      (r) => r.includes(ORIGINAL_REASON),
    ],
    [
      // The fixture tmpdir has no spaces, so this one is synthetic: non-git cwd,
      // quoted paths with spaces after both `=` and a bare space.
      'stacked options, quoted paths with spaces: asks',
      plain,
      'git -C "C:/a b/c" --git-dir="C:/a b/c/.git" --work-tree "C:/a b/c" push --force',
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

  // Negative controls: non-gated commands must produce no output at all. The
  // last three fence the global-options widening: a subcommand never starts
  // with `-`, so `push` appearing after one is not a push.
  const QUIET = [
    ['plain ls', 'ls -la'],
    ['git -C <path> fetch', `git -C "${fresh}" fetch`],
    ['git commit -m "push it"', 'git commit -m "push it"'],
    ['git log --grep=push', 'git log --grep=push'],
  ];
  for (const [name, command] of QUIET) {
    const q = await runHook(JSON.stringify({ tool_name: 'Bash', cwd: stale, tool_input: { command } }));
    const qok = q.code === 0 && q.out === '';
    if (!qok) fails++;
    console.log(`${qok ? 'PASS' : 'FAIL'}  quiet | non-gated command (${name}) says nothing${qok ? '' : ` (exit=${q.code}, out=${q.out})`}`);
  }

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
