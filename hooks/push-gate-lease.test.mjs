#!/usr/bin/env node
// Proves the 2026-09-17 lease check: when an unattended driver holds the lease,
// push-gate DENIES rather than asks, because an ask is auto-approved in
// bypassPermissions and there is nobody awake to answer one anyway.
//
// Run: node hooks/push-gate-lease.test.mjs   (no network, no real repo needed:
// every case is decided before the freshness probe, and the non-gated cases
// never reach it either.)
//
// WHAT THIS MUST BE ABLE TO PRINT WHEN THE FEATURE IS ABSENT. Delete the
// unattendedDriver() branch from push-gate.mjs and the four `deny` cases below
// go FAIL, because the hook falls back to `ask`. That is the check going red.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const GATE = join(HERE, 'push-gate.mjs');
const work = mkdtempSync(join(tmpdir(), 'pgl-'));
const lease = join(work, 'lease.txt');
let fails = 0;

const now = new Date().toISOString();
const LIVE = `HEARTBEAT ${now}\nDRIVER relay-2026-09-17T1700\nWINDOW-ENDS ${now}\nIN-FLIGHT t\n`;
const ENDED = `HEARTBEAT ${now}\nDRIVER none\nIN-FLIGHT closed out\n`;
const ARMED = `HEARTBEAT ${now}\nDRIVER pending\nWINDOW-ENDS ${now}\nIN-FLIGHT armed\n`;

// Run the hook with the lease pointed at our scratch file. A leaseText of null
// means no lease file at all, which is the ordinary attended machine.
function decide(command, leaseText) {
  if (leaseText === null) rmSync(lease, { force: true });
  else writeFileSync(lease, leaseText);
  const r = spawnSync(process.execPath, [GATE], {
    input: JSON.stringify({ tool_name: 'Bash', cwd: work, tool_input: { command } }),
    encoding: 'utf8',
    env: { ...process.env, PROPOS_LEASE_FILE: lease },
  });
  if (!r.stdout.trim()) return { decision: null, reason: '' };
  try {
    const o = JSON.parse(r.stdout).hookSpecificOutput;
    return { decision: o.permissionDecision, reason: o.permissionDecisionReason ?? '' };
  } catch {
    return { decision: 'UNPARSEABLE', reason: r.stdout };
  }
}

function check(label, got, want) {
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  (got ${got}, want ${want})`}`);
}

try {
  // --- the whole point: a live driver turns every gated command into a deny ---
  for (const cmd of [
    'git push -u origin fix/x',
    'git -C C:/Users/ben/Projects/PropOS push origin main',
    'gh pr merge 333 --squash',
    'git --no-pager push --zzz-not-a-flag',
  ]) {
    check(`live driver | "${cmd}" is DENIED`, decide(cmd, LIVE).decision, 'deny');
  }

  // The deny must name the one legitimate door, or a blocked driver has nowhere
  // to go and will start improvising, which is the failure this whole design is
  // about. Asserted on the text because that text IS the recovery instruction.
  const r = decide('git push -u origin fix/x', LIVE);
  const named = /safe-push\.mjs/.test(r.reason) && /nobody to answer/i.test(r.reason);
  if (!named) fails++;
  console.log(`${named ? 'PASS' : 'FAIL'}  live driver | the deny names safe-push as the route`);

  // --- and does not become stricter anywhere else ---
  check('no lease      | still asks (attended machine)', decide('git push -u origin fix/x', null).decision, 'ask');
  check('DRIVER none   | still asks (run has ended)', decide('git push -u origin fix/x', ENDED).decision, 'ask');
  check('DRIVER pending| still asks (armed, unclaimed)', decide('git push -u origin fix/x', ARMED).decision, 'ask');

  // A live lease must not make the gate fire on things it never fired on. The
  // prose case is the 2026-09-16 incident itself: it must stay silent, and a
  // deny would be far worse than the ask that cost fourteen hours.
  check(
    'live driver | prose in a commit message stays silent',
    decide(`git commit -m "gh pr merge was never invoked and was never un-gated"`, LIVE).decision,
    null,
  );
  check('live driver | ordinary command stays silent', decide('npm test', LIVE).decision, null);

  // An unreadable lease must fall back to the attended ask, never to silence.
  check('garbage lease | falls back to ask, not silence', decide('git push -u origin fix/x', 'nonsense\n').decision, 'ask');
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
