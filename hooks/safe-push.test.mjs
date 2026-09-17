#!/usr/bin/env node
// Proves safe-push.mjs refuses everything it should, and allows only what it should.
// Run: node hooks/safe-push.test.mjs   (no network: --dry-run stops before the push)
//
// This is the single door an unattended run pushes through, so the refusals are the
// product. Each is asserted by its real exit code, and every case runs against a real
// git work tree rather than a mock, because the checks it makes are git's answers.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'safe-push.mjs');
const GATE = join(HERE, 'push-gate.mjs');

const work = mkdtempSync(join(tmpdir(), 'sp-'));
const repo = join(work, 'repo');
const lease = join(work, 'lease.txt');
const audit = join(work, 'audit.log');

function git(args, cwd = repo) {
  return spawnSync('git', args, { cwd, encoding: 'utf8' });
}
// a real work tree with a real branch
spawnSync('git', ['init', '-q', '-b', 'main', repo], { encoding: 'utf8' });
git(['config', 'user.email', 't@t']);
git(['config', 'user.name', 't']);
writeFileSync(join(repo, 'f.txt'), 'x');
git(['add', '.']);
git(['commit', '-qm', 'init']);
git(['branch', 'fix/real-branch']);
git(['branch', 'feature/main']);

const future = new Date(Date.now() + 3600e3).toISOString();
const past = new Date(Date.now() - 3600e3).toISOString();
const setLease = (t) => (t === null ? rmSync(lease, { force: true }) : writeFileSync(lease, t));
const OPEN = `HEARTBEAT ${new Date().toISOString()}\nDRIVER relay-test\nWINDOW-ENDS ${future}\nIN-FLIGHT t\n`;

function run(args, leaseText) {
  setLease(leaseText);
  const r = spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, PROPOS_LEASE_FILE: lease, PROPOS_PUSH_AUDIT: audit },
  });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

const CASES = [
  [2, [repo], OPEN, 'wrong argument count'],
  [2, [repo, 'bad branch name!'], OPEN, 'branch name with illegal characters'],
  [3, [repo, 'main'], OPEN, 'the protected branch itself'],
  [3, [repo, 'feature/main'], OPEN, 'a protected segment inside the branch path'],
  [4, [repo, 'fix/real-branch'], null, 'no lease file: no run is in progress'],
  [4, [repo, 'fix/real-branch'], `HEARTBEAT x\nDRIVER none\nWINDOW-ENDS ${future}\n`, 'DRIVER none: the run ended'],
  [4, [repo, 'fix/real-branch'], `HEARTBEAT x\nDRIVER relay-test\n`, 'no WINDOW-ENDS line'],
  [4, [repo, 'fix/real-branch'], `HEARTBEAT x\nDRIVER relay-test\nWINDOW-ENDS ${past}\n`, 'the window has closed'],
  [4, [repo, 'fix/real-branch'], `HEARTBEAT x\nDRIVER relay-test\nWINDOW-ENDS not-a-date\n`, 'WINDOW-ENDS is unparseable'],
  [5, [join(work, 'not-a-repo'), 'fix/real-branch'], OPEN, 'target is not a git work tree'],
  [5, [repo, 'fix/does-not-exist'], OPEN, 'branch does not exist'],
  [0, [repo, 'fix/real-branch', '--dry-run'], OPEN, 'ALLOWED: real branch, open window'],
];

let fails = 0;
for (const [want, args, leaseText, label] of CASES) {
  const { code } = run(args, leaseText);
  const ok = code === want;
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  want-exit=${String(want).padEnd(2)} got=${String(code).padEnd(2)} ${label}`);
}

// The gate must stay silent on this command shape. If it ever fires here, the
// unattended run is back to waiting on a prompt nobody can answer.
{
  const cmd = `node ${SCRIPT} ${repo} fix/real-branch`;
  const r = spawnSync(process.execPath, [GATE], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: cmd }, cwd: tmpdir() }),
    encoding: 'utf8',
  });
  const asked = (r.stdout || '').includes('"ask"');
  if (asked) fails++;
  console.log(`${asked ? 'FAIL' : 'ok  '}  push-gate stays silent on a safe-push invocation`);
}

// ...but must still fire on a raw push, so this suite cannot pass by the gate
// simply having been switched off.
{
  const r = spawnSync(process.execPath, [GATE], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git push origin main' }, cwd: tmpdir() }),
    encoding: 'utf8',
  });
  const asked = (r.stdout || '').includes('"ask"');
  if (!asked) fails++;
  console.log(`${asked ? 'ok  ' : 'FAIL'}  control: push-gate still fires on a raw git push`);
}

try { rmSync(work, { recursive: true, force: true }); } catch {}
const total = CASES.length + 2;
console.log(`\n${total - fails}/${total} passed`);
process.exit(fails ? 1 : 0);
