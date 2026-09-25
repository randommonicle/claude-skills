#!/usr/bin/env node
// Proves the launcher hands the lease back when its driver exits without doing so, and
// that it never starts a second driver while a recorded one is still running.
//
// Why this exists (2026-09-25). Until then the launcher wrote nothing to the lease after
// the CLI exited, and its finally block deleted the pid record. A driver that died
// mid-item - a usage limit, a crash, --max-turns - therefore left its own id in the lease
// with no pid record behind it. Every later fire went down the takeover path, found no
// record, logged "the previous driver could not be proved dead" and refused, for the rest
// of the window. The 2026-09-18 run never met it because its driver always exited
// cleanly; a run meant to hit the 5-hour limit on purpose meets it on the first hit.
//
// No CLI is invoked: -Cli points at stub .cmd files that act out each exit shape.
// RELAY_SCRIPT may point the suite at another copy of the launcher, which is how it was
// shown red against the unfixed one before the fix was trusted.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = process.env.RELAY_SCRIPT || join(HERE, 'relay-cli-fire.ps1');

// @win32-only -- the marker the hooks-windows CI job discovers this suite by.
if (process.platform !== 'win32') {
  console.log(`SKIP  relay-cli-handback.test.mjs: needs Windows PowerShell, platform is ${process.platform}`);
  console.log('SKIP  not a pass. This suite is executed by the hooks-windows CI job.');
  process.exit(0);
}

const work = mkdtempSync(join(tmpdir(), 'handback-'));

const psRaw = (args) => {
  const r = spawnSync('powershell', args, { encoding: 'utf8' });
  if (r.error) {
    console.error(`FATAL  could not run powershell: ${r.error.code ?? ''} ${r.error.message}`);
    console.error('FATAL  no case below was executed. This is a harness fault, not a launcher fault.');
    process.exit(2);
  }
  return r;
};
const ps = (script) => psRaw(['-NoProfile', '-Command', script]);

// A repo that exists only so pre-flight passes, and a prompt nobody sends.
const stubRepo = join(work, 'stub-repo');
mkdirSync(stubRepo, { recursive: true });
const promptFile = join(work, 'prompt.txt');
writeFileSync(promptFile, 'this prompt is never sent anywhere\n');

const ENDS = new Date(Date.now() + 6 * 3600000).toISOString();
const ARMED = `HEARTBEAT ${new Date().toISOString()}\r\nDRIVER pending\r\nWINDOW-ENDS ${ENDS}\r\nIN-FLIGHT armed for the handback suite\r\n`;

function startVictim() {
  const r = ps(`$p = Start-Process -FilePath 'ping' -ArgumentList '-n','600','127.0.0.1' -PassThru -WindowStyle Hidden; Write-Output ($p.Id.ToString() + '|' + $p.StartTime.ToString('o'))`);
  const [pid, started] = (r.stdout || '').trim().split('|');
  return { pid: pid?.trim(), started: started?.trim() };
}
const alive = (pid) =>
  (ps(`[bool](Get-Process -Id ${pid} -ErrorAction SilentlyContinue)`).stdout || '').trim() === 'True';
const kill = (pid) => ps(`Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`);

// stubLines are the body of the stub CLI after `@echo off` and the marker write. The
// marker is how a case tells "the launcher fired" from "the launcher stood down".
function runLauncher({ lease = ARMED, pidFileContent = null, stubLines, extraArgs = [] }) {
  const id = Math.random().toString(36).slice(2);
  const leaseFile = join(work, `lease-${id}.txt`);
  const pidFile = join(work, `driver-${id}.pid`);
  const logFile = join(work, `log-${id}.txt`);
  const marker = join(work, `fired-${id}.txt`);
  const snapshot = join(work, `seen-${id}.txt`);
  const stub = join(work, `stub-${id}.cmd`);
  writeFileSync(leaseFile, lease);
  if (pidFileContent !== null) writeFileSync(pidFile, pidFileContent);
  // stubLines gets the lease path and a snapshot path: a stub that copies the lease to the
  // snapshot records exactly what a real driver would have read when it started.
  const body = ['@echo off', `echo fired> "${marker}"`, ...stubLines(leaseFile, snapshot)].join('\r\n') + '\r\n';
  writeFileSync(stub, body);
  const r = psRaw(['-NoProfile', '-File', SCRIPT, '-LeaseFile', leaseFile, '-LogFile', logFile,
    '-PidFile', pidFile, '-Cli', stub, '-PromptFile', promptFile, '-Repo', stubRepo, ...extraArgs]);
  const out = (r.stdout || '') + (r.stderr || '');
  // A copy of the launcher run from anywhere but this directory cannot find push-gate.mjs
  // and bails before firing. The first red proof of this suite hit exactly that, and two
  // checks in case 1 PASSED against a launcher that never ran, because the armed lease
  // already reads pending. So that bail is a harness fault too, and every case that needs
  // a turn asserts the stub actually fired.
  const bail = out.match(/FAULT\s+(?:(?:CLI|prompt|repo) not found at|push-gate\.mjs not found).*/);
  if (bail) {
    console.error(`FATAL  the launcher bailed at pre-flight: ${bail[0].trim()}`);
    console.error('FATAL  a path this suite supplies is missing, so no case exercised the launcher.');
    process.exit(2);
  }
  return {
    out,
    leaseAfter: existsSync(leaseFile) ? readFileSync(leaseFile, 'utf8') : '',
    seen: existsSync(snapshot) ? readFileSync(snapshot, 'utf8') : '',
    fired: existsSync(marker),
    pidFileAfter: existsSync(pidFile),
  };
}

let fails = 0, ran = 0;
const check = (label, ok, detail = '') => {
  ran++; if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  -> ' + detail : ''}`);
};
const oneLine = (s) => s.replace(/\s+/g, ' ').slice(0, 160);

// 1. THE ONE THAT MATTERS. The driver claims the lease under the launcher's id, then dies
//    without handing back. The lease must come back as pending, with the window intact
//    and a note saying the item may be partial.
{
  const r = runLauncher({
    stubLines: (lease) => [
      `(echo HEARTBEAT 2026-09-25T12:00:00.0000000+01:00& echo DRIVER %PROPOS_DRIVER_ID%& echo WINDOW-ENDS ${ENDS}& echo IN-FLIGHT stub was midway through item 3)> "${lease}"`,
      'exit /b 3',
    ],
  });
  check('(precondition) the launcher fired the dying driver', r.fired, oneLine(r.out));
  check('the lease was rewritten, not merely left armed', r.leaseAfter !== ARMED, oneLine(r.leaseAfter));
  check('a driver that dies without handing back gets its lease returned to pending',
    /^DRIVER pending\r?$/m.test(r.leaseAfter), oneLine(r.leaseAfter));
  check('the window line survives the handback byte for byte',
    r.leaseAfter.includes(`WINDOW-ENDS ${ENDS}\r\n`), oneLine(r.leaseAfter));
  check('the in-flight line marks the item as possibly partial and keeps what the driver wrote',
    /^IN-FLIGHT ORPHANED: relay-\S+ exited 3 .*It had written: stub was midway through item 3/m.test(r.leaseAfter),
    oneLine(r.leaseAfter));
  check('and the log says HANDBACK', /HANDBACK/.test(r.out), oneLine(r.out));
}

// 2. The normal path: the driver hands back itself and exits. The launcher must not touch
//    the lease at all.
{
  const handed = `HEARTBEAT 2026-09-25T12:30:00.0000000+01:00\r\nDRIVER pending\r\nWINDOW-ENDS ${ENDS}\r\nIN-FLIGHT item 3 DONE, item 4 next\r\n`;
  const prepared = join(work, 'prepared-pending.txt');
  writeFileSync(prepared, handed);
  const r = runLauncher({ stubLines: (lease) => [`copy /y "${prepared}" "${lease}" >nul`, 'exit /b 0'] });
  check('(precondition) the launcher fired the driver that hands back', r.fired, oneLine(r.out));
  check('a lease the driver handed back itself is left byte-identical', r.leaseAfter === handed,
    oneLine(r.leaseAfter));
}

// 3. A turn that never claimed the lease, which is what a usage limit at start looks like.
//    The armed lease must be left exactly as it was, so the next fire tries again.
{
  const r = runLauncher({ stubLines: () => ['echo usage limit reached 1>&2', 'exit /b 1'] });
  check('a turn that never claimed the lease leaves it byte-identical', r.leaseAfter === ARMED,
    oneLine(r.leaseAfter));
  check('and the launcher did fire it', r.fired);
}

// 4. A lease naming some OTHER driver is never rewritten: the launcher only vouches for
//    the process it watched.
{
  const r = runLauncher({
    stubLines: (lease) => [
      `(echo HEARTBEAT 2026-09-25T12:00:00.0000000+01:00& echo DRIVER some-other-driver& echo WINDOW-ENDS ${ENDS}& echo IN-FLIGHT theirs)> "${lease}"`,
      'exit /b 0',
    ],
  });
  check('(precondition) the launcher fired the stub that writes a foreign id', r.fired, oneLine(r.out));
  check('a lease naming another driver is left alone',
    /^DRIVER some-other-driver\r?$/m.test(r.leaseAfter) && !/ORPHANED/.test(r.leaseAfter), oneLine(r.leaseAfter));
  check('and the launcher reports it as a fault', /FAULT.*names driver 'some-other-driver'/.test(r.out), oneLine(r.out));
}

// 5. THE GUARD. The lease says pending but a recorded driver is still running (its
//    launcher was stopped at the task's time limit before its finally block ran). The
//    launcher must stand down, start nothing, and kill nothing.
{
  const v = startVictim();
  try {
    const r = runLauncher({ pidFileContent: `${v.pid}|${v.started}`, stubLines: () => ['exit /b 0'] });
    check('pending plus a live recorded driver: no second driver is started', !r.fired, oneLine(r.out));
    check('and it says why', /STANDDOWN.*still running/.test(r.out), oneLine(r.out));
    check('and the recorded driver is left running', alive(v.pid));
    check('and its pid record is kept', r.pidFileAfter);
  } finally {
    kill(v.pid);
  }
}

// 6. Pending plus a record of a driver that is already gone: clear it and fire. Guards the
//    guard, so it cannot quietly stop every fire after one untidy exit.
{
  const v = startVictim();
  kill(v.pid);
  const dead = !alive(v.pid);
  check('(setup) the recorded driver really is dead before the launcher runs', dead);
  const r = runLauncher({ pidFileContent: `${v.pid}|${v.started}`, stubLines: () => ['exit /b 0'] });
  check('pending plus a dead recorded driver: the launcher fires', r.fired, oneLine(r.out));
}

// 7. Pending plus a record nobody can read: nothing can be concluded, so fail closed.
{
  const r = runLauncher({ pidFileContent: 'not-a-pid-record', stubLines: () => ['exit /b 0'] });
  check('pending plus an unreadable pid record: the launcher does not fire', !r.fired, oneLine(r.out));
  check('and it reports a fault', /FAULT.*cannot be read/.test(r.out), oneLine(r.out));
}

// 8. THE DEADLOCK. A stale driver is killed and a replacement fired. The replacement must
//    find the lease PENDING: if it still names the dead driver, a replacement that obeys its
//    prompt stands down at once, the launcher then declines to hand back a lease that is
//    not its own driver's, and every later fire finds no pid record and refuses.
{
  const v = startVictim();
  try {
    const stale = new Date(Date.now() - 120 * 60000).toISOString();
    const r = runLauncher({
      lease: `HEARTBEAT ${stale}\r\nDRIVER hung-driver\r\nWINDOW-ENDS ${ENDS}\r\nIN-FLIGHT item 4 half done\r\n`,
      pidFileContent: `${v.pid}|${v.started}`,
      stubLines: (lease, seen) => [`copy /y "${lease}" "${seen}" >nul`, 'exit /b 0'],
    });
    check('(precondition) the stale driver was killed', !alive(v.pid));
    check('(precondition) the replacement was fired', r.fired, oneLine(r.out));
    check('the replacement found the lease pending, not naming the dead driver',
      /^DRIVER pending\r?$/m.test(r.seen), oneLine(r.seen));
    check('with a note that the item may be partial and what the dead driver had written',
      /^IN-FLIGHT ORPHANED: hung-driver was taken over .*It had written: item 4 half done/m.test(r.seen), oneLine(r.seen));
    check('and the window survived the takeover', r.seen.includes(`WINDOW-ENDS ${ENDS}\r\n`), oneLine(r.seen));
  } finally {
    kill(v.pid);
  }
}

// 9. The guard's bound. Pending plus a recorded driver that has been alive longer than the
//    stale threshold is hung (it never claimed, or it carried on after handing back). It must
//    be killed and replaced, not waited on for the rest of the window. -StaleMinutes 0 makes
//    a freshly started victim old enough; case 5 covers the young one.
{
  const v = startVictim();
  try {
    const r = runLauncher({ pidFileContent: `${v.pid}|${v.started}`, stubLines: () => ['exit /b 0'],
      extraArgs: ['-StaleMinutes', '0'] });
    check('pending plus an over-age recorded driver: it is killed', !alive(v.pid), oneLine(r.out));
    check('and a replacement is fired', r.fired, oneLine(r.out));
    check('and the log calls it hung', /TAKEOVER.*treating it as hung/.test(r.out), oneLine(r.out));
  } finally {
    kill(v.pid);
  }
}

try { rmSync(work, { recursive: true, force: true }); } catch { /* best effort */ }
console.log(`\n${ran - fails}/${ran} checks passed against ${SCRIPT}`);
process.exit(fails ? 1 : 0);
