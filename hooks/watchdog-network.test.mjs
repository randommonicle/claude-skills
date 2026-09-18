#!/usr/bin/env node
// Proves watchdog-network.ps1 makes the right DECISION at each stage, by driving it
// with -ForceDown and -NoRemediate against a real state file. Run:
//   node hooks/watchdog-network.test.mjs
//
// A network watchdog cannot be tested by unplugging the network, so -ForceDown is
// the seam. What is under test is the escalation and, most of all, THE CAP: the
// sibling watchdog shipped with a repeat guard that suppressed the repeat email but
// not the repeat restart, so a condition that persisted meant the destructive action
// every fire, forever. That bug is the reason this suite exists before the script is
// ever scheduled.
//
// Remediation is suppressed throughout (-NoRemediate -NoAlert): flushing the real DNS
// cache and bouncing the real adapter are not things a suite may do.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'watchdog-network.ps1');
const work = mkdtempSync(join(tmpdir(), 'wdnet-'));

// One state file per scenario, but SHARED across the fires within a scenario: the cap
// only exists across fires, so a fresh state file per fire would hide exactly the bug
// this is here to catch.
function fire(scenario, { down = true, now = null, extra = [] } = {}) {
  const state = join(work, `state-${scenario}.json`);
  const log = join(work, `log-${scenario}.txt`);
  const args = ['-NoProfile', '-File', SCRIPT, '-StateFile', state, '-LogFile', log, '-NoRemediate', '-NoAlert'];
  if (down) args.push('-ForceDown');
  if (now) args.push('-Now', now);
  const r = spawnSync('powershell', [...args, ...extra], { encoding: 'utf8' });
  return { out: (r.stdout || '') + (r.stderr || ''), state, code: r.status };
}

const LEVELS = ['RECOVERED', 'CAPPED', 'NOPERM', 'RESTART', 'FLUSH', 'WAIT', 'FAULT', 'DOWN', 'OK', 'ALERT'];
const levelsIn = (out) => LEVELS.filter((l) => new RegExp(`\\s${l}\\s`).test(out));

let fails = 0;
let ran = 0;
function check(label, ok, detail = '') {
  ran++;
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  -> ' + detail : ''}`);
}

// 1. A healthy link says so and writes no outage. This is the case that proves the
//    suite is wired to a real script rather than asserting against -ForceDown alone.
{
  const { out, state } = fire('healthy', { down: false, now: '2026-09-18T10:00:00' });
  const got = levelsIn(out);
  check('a reachable link logs OK and opens no outage', got.includes('OK') && !got.includes('DOWN'), got.join(','));
  check('a reachable link writes no outage state', !existsSync(state) || !JSON.parse(readFileSync(state, 'utf8')).outageStart);
}

// 2. The escalation, fire by fire, on ONE state file.
{
  const f1 = fire('esc', { now: '2026-09-18T10:00:00' });
  const got1 = levelsIn(f1.out);
  check('fire 1 of an outage flushes DNS and stops there', got1.includes('DOWN') && got1.includes('FLUSH') && got1.includes('WAIT'), got1.join(','));
  check('fire 1 does not reach for the adapter', !got1.includes('RESTART'), got1.join(','));

  const f2 = fire('esc', { now: '2026-09-18T10:15:00' });
  const got2 = levelsIn(f2.out);
  check('fire 2 escalates to the adapter restart', got2.includes('RESTART'), got2.join(','));

  const f3 = fire('esc', { now: '2026-09-18T10:30:00' });
  check('fire 3 is the last permitted remediation', levelsIn(f3.out).includes('RESTART'), levelsIn(f3.out).join(','));

  // THE ONE THAT MATTERS. Without the cap this is a fourth restart, and a fifth, and
  // one every fire for as long as the outage lasts.
  const f4 = fire('esc', { now: '2026-09-18T10:45:00' });
  const got4 = levelsIn(f4.out);
  check('fire 4 is CAPPED and touches nothing', got4.includes('CAPPED') && !got4.includes('RESTART') && !got4.includes('FLUSH'), got4.join(','));

  const f5 = fire('esc', { now: '2026-09-18T11:00:00' });
  const got5 = levelsIn(f5.out);
  check('the cap holds on every later fire, not just the first', got5.includes('CAPPED') && !got5.includes('RESTART'), got5.join(','));

  // Recovery must reset the budget, or one bad morning spends it for the whole weekend.
  const f6 = fire('esc', { down: false, now: '2026-09-18T11:15:00' });
  check('recovery is logged with how long it was down', levelsIn(f6.out).includes('RECOVERED'), levelsIn(f6.out).join(','));
  const after = JSON.parse(readFileSync(f6.state, 'utf8'));
  check('recovery clears the outage and the remediation budget', !after.outageStart && after.remediations === 0);

  const f7 = fire('esc', { now: '2026-09-18T12:00:00' });
  const got7 = levelsIn(f7.out);
  check('a NEW outage after a recovery gets a fresh budget', got7.includes('FLUSH') && !got7.includes('CAPPED'), got7.join(','));
}

// 3. A FAILED alert must not mark itself delivered. Until 2026-09-18 this script
//    discarded the notifier's output, logged "notified the owner" unconditionally and
//    set alerted = true, so Outlook COM could fail at 2am and the run would record the
//    alert as sent and never retry. The alert is the whole safety net for an unattended
//    weekend, so a net that reports success when it failed is worse than none.
{
  const stub = join(work, 'failing-notifier.ps1');
  writeFileSync(stub, 'Write-Output "FAIL: pretend Outlook is not there"\nexit 1\n');
  const state = join(work, 'state-alertfail.json');
  const log = join(work, 'log-alertfail.txt');
  const cleanRoot = join(work, 'alertfail-root');
  mkdirSync(cleanRoot, { recursive: true });

  // -NoAlert is deliberately NOT passed here: the alert path is what is under test.
  // TWO fires on one state file, because the alert only happens once the local remedies
  // are spent: fire 1 flushes and waits, fire 2 reaches stage 2 and therefore the alert.
  const fireOnce = () =>
    spawnSync(
      'powershell',
      ['-NoProfile', '-File', SCRIPT, '-StateFile', state, '-LogFile', log,
       '-ForceDown', '-NoRemediate', '-Notifier', stub],
      { encoding: 'utf8' },
    );
  fireOnce();
  const r = fireOnce();
  const out = (r.stdout || '') + (r.stderr || '');

  const saidNotDelivered = /NOT DELIVERED/.test(out);
  check('a notifier that exits non-zero is logged as NOT DELIVERED', saidNotDelivered,
    saidNotDelivered ? '' : out.replace(/\s+/g, ' ').slice(0, 160));

  let alerted = null;
  try { alerted = JSON.parse(readFileSync(state, 'utf8')).alerted; } catch {}
  check('a failed alert does NOT set alerted, so it retries', alerted === false || alerted === undefined,
    `alerted=${JSON.stringify(alerted)}`);

  check('it does not claim to have notified the owner', !/notified the owner/.test(out),
    /notified the owner/.test(out) ? 'it said it notified the owner anyway' : '');
}

// 4. The outage clock is measured from the first fire that saw it, not from this one.
{
  fire('clock', { now: '2026-09-18T10:00:00' });
  const later = fire('clock', { now: '2026-09-18T10:40:00' });
  check('the DOWN line reports cumulative minutes, not per-fire', /down 40m/.test(later.out), (later.out.match(/down \d+m/) || ['(no match)'])[0]);
}

try { rmSync(work, { recursive: true, force: true }); } catch {}
console.log(`\n${ran - fails}/${ran} passed`);
process.exit(fails ? 1 : 0);
