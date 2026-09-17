#!/usr/bin/env node
// Proves watchdog-unattended.ps1 actually escalates, by driving it with an injected
// clock against synthetic lease files. Run: node hooks/watchdog-unattended.test.mjs
//
// The watchdog exists because on 2026-09-16 a heartbeat file was written all night
// and never read by anything. The obvious trap when replacing that is to build a
// second thing nobody proves either, so every stage below is asserted by its real
// output, not by reading the script.
//
// Alerts and restarts are suppressed (-NoAlert -NoRestart): the DECISION is what is
// under test. Sending mail and killing the app are exercised separately and by hand,
// because neither is safe to run in a suite.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'watchdog-unattended.ps1');
const NOW = '2026-09-17T02:00:00';
const work = mkdtempSync(join(tmpdir(), 'wd-'));

function run(leaseText, { gitRoot = work, extra = [] } = {}) {
  const lease = join(work, 'lease.txt');
  const log = join(work, 'log.txt');
  const state = join(work, `state-${Math.random().toString(36).slice(2)}.txt`);
  if (leaseText === null) {
    try { rmSync(lease); } catch {}
  } else {
    writeFileSync(lease, leaseText);
  }
  const r = spawnSync(
    'powershell',
    ['-NoProfile', '-File', SCRIPT,
     '-LeaseFile', lease, '-LogFile', log, '-StateFile', state,
     '-GitRoots', gitRoot, '-Now', NOW, '-NoAlert', '-NoRestart', ...extra],
    { encoding: 'utf8' },
  );
  return { out: (r.stdout || '') + (r.stderr || ''), code: r.status };
}

const lease = (hb, driver = 'relay-x') =>
  `HEARTBEAT ${hb}\nDRIVER ${driver}\nIN-FLIGHT doing a thing\n`;

const CASES = [
  ['IDLE',    () => run(null),                                    'no lease file at all'],
  ['DONE',    () => run(lease('2026-09-17T01:59:00', 'none')),     'DRIVER none means the run ended'],
  // The arming state. The heartbeat here is 409 minutes stale, which for any real
  // driver is a RESTART, so this case can only pass if `pending` is recognised.
  // Without it there is no lease value that arms the relay and leaves this quiet.
  ['ARMED',   () => run(lease('2026-09-16T19:11:00', 'pending')),  'DRIVER pending is armed but unclaimed, not a stall'],
  ['OK',      () => run(lease('2026-09-17T01:40:00')),             'heartbeat 20m old is healthy'],
  ['OK',      () => run(lease('2026-09-17T01:16:00')),             '44m is still under the 45m threshold'],
  ['ALERT',   () => run(lease('2026-09-17T01:15:00')),             '45m exactly is the boundary and DOES escalate'],
  ['ALERT',   () => run(lease('2026-09-17T01:05:00')),             '55m stale escalates to ALERT'],
  ['ALERT',   () => run(lease('2026-09-17T00:35:00')),             '85m is still ALERT, not yet RESTART'],
  ['RESTART', () => run(lease('2026-09-17T00:25:00')),             '95m stale escalates to RESTART'],
  ['RESTART', () => run(lease('2026-09-16T19:11:00')),             'the real 2026-09-16 freeze, 409m stale'],
  ['FAULT',   () => run('HEARTBEAT not-a-date\nDRIVER x\n'),       'unparseable timestamp is a fault, not silence'],
  ['FAULT',   () => run('DRIVER x\nIN-FLIGHT y\n'),                'missing HEARTBEAT line is a fault, not silence'],
];

// Counted, not typed. The total used to be the literal 11 while CASES grew past it,
// so adding a case silently made the summary lie. A tally that cannot track what it
// summarises is the same defect as a "before" value typed into a verification query.
let fails = 0;
let ran = 0;
for (const [want, fn, label] of CASES) {
  ran++;
  const { out } = fn();
  const got = ['FAULT', 'RESTART', 'ALERT', 'DEFER', 'DONE', 'ARMED', 'IDLE', 'OK'].find((l) =>
    new RegExp(`\\s${l}\\s`).test(out),
  ) ?? '(none)';
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  want=${want.padEnd(8)} got=${got.padEnd(8)} ${label}`);
}

// A restart must never interrupt a git write. This is the one case where getting it
// wrong leaves a worse state than the stall it is fixing.
{
  const repo = join(work, 'repo', '.git');
  mkdirSync(repo, { recursive: true });
  writeFileSync(join(repo, 'index.lock'), '');
  const { out } = run(lease('2026-09-16T19:11:00'), { gitRoot: join(work, 'repo') });
  const ok = /\sDEFER\s/.test(out);
  ran++;
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  want=DEFER   got=${ok ? 'DEFER' : '(not DEFER)'}  index.lock present defers the restart`);
}

try { rmSync(work, { recursive: true, force: true }); } catch {}
console.log(`\n${ran - fails}/${ran} passed`);
process.exit(fails ? 1 : 0);
