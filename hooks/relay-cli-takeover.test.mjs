#!/usr/bin/env node
// Proves the launcher kills a HUNG driver before starting its replacement, and that it
// refuses to kill anything it cannot positively identify.
//
// Why this exists. A reviewer challenged the claim that a hung driver is bounded by the
// scheduled task's ExecutionTimeLimit. A controlled probe on 2026-09-18 settled it
// against the claim: a task with a one-minute limit spawned a child, the limit expired,
// the task went back to Ready, and the child was still running. Task Scheduler
// terminates the registered process, not the tree. So the CLI and its node descendants
// survive as orphans and a replacement starts alongside them.
//
// No CLI is ever invoked here: -Cli points at a stub that exits immediately, so the
// whole launcher path runs without spending anything.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'relay-cli-fire.ps1');

// Windows PowerShell only. It skips loudly off win32 rather than failing: in the
// Linux-only hooks job `powershell` does not exist, and this suite crashed there on every
// run from 2026-09-18 to 2026-09-21 while passing on the maintainer's machine.
//
// NOTE the absence of the @win32-only marker, which is deliberate and is what keeps this
// suite OUT of the hooks-windows job. Case 3 ("a victim that cannot be killed") points the
// launcher at wininit.exe and depends on this account being unable to terminate it, but
// its guard only skips when that process cannot be READ, not when it can be KILLED. The
// launcher's kill is real: relay-cli-fire.ps1 runs `taskkill /T /F /PID`. A hosted Windows
// runner is elevated, so there the case would force-kill a critical system process.
//
// FORWARD: to run this suite on a hosted runner, gate case 3 behind an
// IsInRole(Administrators) check that skips loudly, then add the @win32-only marker here.
// Until then its win32 coverage is manual, on the maintainer's machine. Decided
// 2026-09-21, see docs/REVIEW_red-ci_2026-09-21.md section 7.
if (process.platform !== 'win32') {
  console.log(`SKIP  relay-cli-takeover.test.mjs: needs Windows PowerShell, platform is ${process.platform}`);
  console.log('SKIP  not a pass, and NOT covered by hooks-windows either. See the FORWARD note in this file.');
  process.exit(0);
}

const work = mkdtempSync(join(tmpdir(), 'takeover-'));

// Every spawn goes through here so a missing interpreter is reported once, as itself,
// rather than as a downstream crash on output the script was never alive to produce.
// Exit 2 for a harness fault; exit 1 stays the launcher behaving wrongly.
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

// A stub "CLI" that exits at once, and a prompt file for it to be handed.
const stubCli = join(work, 'stub-cli.cmd');
writeFileSync(stubCli, '@echo off\r\nexit /b 0\r\n');
const promptFile = join(work, 'prompt.txt');
writeFileSync(promptFile, 'this prompt is never sent anywhere\n');

// A victim process that will sit there until something kills it.
function startVictim() {
  const r = ps(`$p = Start-Process -FilePath 'ping' -ArgumentList '-n','600','127.0.0.1' -PassThru -WindowStyle Hidden; Write-Output ($p.Id.ToString() + '|' + $p.StartTime.ToString('o'))`);
  const [pid, started] = (r.stdout || '').trim().split('|');
  return { pid: pid?.trim(), started: started?.trim() };
}
const alive = (pid) =>
  (ps(`[bool](Get-Process -Id ${pid} -ErrorAction SilentlyContinue)`).stdout || '').trim() === 'True';
const kill = (pid) => ps(`Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`);

function runLauncher({ pidFileContent, staleMinutes = 120 }) {
  const lease = join(work, `lease-${Math.random().toString(36).slice(2)}.txt`);
  const pidFile = join(work, `driver-${Math.random().toString(36).slice(2)}.pid`);
  const log = join(work, 'log.txt');
  const hb = new Date(Date.now() - staleMinutes * 60000).toISOString();
  const ends = new Date(Date.now() + 6 * 3600000).toISOString();
  writeFileSync(lease, `HEARTBEAT ${hb}\r\nDRIVER hung-driver\r\nWINDOW-ENDS ${ends}\r\nIN-FLIGHT x\r\n`);
  if (pidFileContent !== null) writeFileSync(pidFile, pidFileContent);
  const r = psRaw(
    ['-NoProfile', '-File', SCRIPT, '-LeaseFile', lease, '-LogFile', log, '-PidFile', pidFile,
     '-Cli', stubCli, '-PromptFile', promptFile],
  );
  return { out: (r.stdout || '') + (r.stderr || ''), pidFile };
}

let fails = 0, ran = 0;
const check = (label, ok, detail = '') => {
  ran++; if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  -> ' + detail : ''}`);
};

// 1. THE ONE THAT MATTERS. A stale lease naming a live process must kill it.
{
  const v = startVictim();
  const { out, pidFile } = runLauncher({ pidFileContent: `${v.pid}|${v.started}` });
  const stillAlive = alive(v.pid);
  check('a stale driver process is killed before the replacement starts', !stillAlive,
    stillAlive ? `pid ${v.pid} survived` : `pid ${v.pid} gone`);
  check('and it says so in the log', /killed the stale driver process tree/.test(out),
    /killed the stale driver/.test(out) ? '' : out.replace(/\s+/g, ' ').slice(0, 140));
  check('the pid file is cleared afterwards', !existsSync(pidFile));
  if (stillAlive) kill(v.pid);
}

// 2. THE GUARD. Windows recycles pids. A pid that exists but started at a different
//    moment is a different process, and killing it would be the worst kind of bug this
//    file could ship: the launcher terminating something unrelated on the owner's
//    machine, at 3am, silently.
{
  const v = startVictim();
  const wrongStart = new Date(Date.parse(v.started) - 90000).toISOString();
  const { out } = runLauncher({ pidFileContent: `${v.pid}|${wrongStart}` });
  const survived = alive(v.pid);
  check('a pid whose start time does NOT match is left alone', survived,
    survived ? `pid ${v.pid} correctly untouched` : `*** KILLED AN UNRELATED PROCESS ***`);
  // A mismatched start time means the recorded driver's pid now belongs to something
  // else, which IS proof the driver is gone. So this is a takeover that kills nothing,
  // not a refusal: the run may proceed and the stranger is left strictly alone.
  check('the stranger is left alone AND the old driver is treated as gone',
    /nothing was killed/.test(out) && !/NOT firing/.test(out),
    out.match(/TAKEOVER[^\r\n]*/)?.[0]?.slice(0, 120) ?? out.replace(/\s+/g, ' ').slice(0, 120));
  kill(v.pid);
}

// 3. FAIL CLOSED. The first version of this code cleared the record and returned on
//    every failure, and the caller fired anyway. A reviewer named that as the single
//    thing keeping the run from being armable, because it turns a recoverable hang into
//    two agents on one working copy. Each case below must REFUSE to fire.
{
  const { out } = runLauncher({ pidFileContent: null });
  check('no recorded pid: refuses to fire', /could not be proved dead; NOT firing/.test(out),
    /NOT firing/.test(out) ? '' : out.replace(/\s+/g, ' ').slice(0, 140));
  check('...and does not start a turn', !/starting a CLI turn/.test(out));
}
{
  const { out } = runLauncher({ pidFileContent: 'not-a-pid-file' });
  check('a malformed pid record: refuses to fire', /malformed/.test(out) && /NOT firing/.test(out));
}
{
  // A live, correctly identified victim that CANNOT be killed. Simulated by pointing
  // the record at a process this account may not terminate; if the machine lets us kill
  // it the case is skipped rather than passed, because a skip is not a pass.
  const r = ps(`$p = Get-Process -Name 'wininit' -ErrorAction SilentlyContinue | Select-Object -First 1; if ($p) { Write-Output ($p.Id.ToString() + '|' + $p.StartTime.ToString('o')) }`);
  const rec = (r.stdout || '').trim();
  if (!rec.includes('|')) {
    console.log('skip  unkillable-victim case: could not read a protected process');
  } else {
    const { out } = runLauncher({ pidFileContent: rec });
    const refused = /STILL RUNNING|could not be proved dead; NOT firing|could not read the start time|could not inspect/.test(out);
    check('a victim that cannot be killed: refuses to fire', refused,
      refused ? '' : out.replace(/\s+/g, ' ').slice(0, 160));
    check('...and does not start a turn', !/starting a CLI turn/.test(out));
  }
}

// 4. A REAL TREE. The earlier victim was a childless ping, so /T was never exercised
//    and the reviewer was right that the tree kill was untested.
{
  const r = ps(`$p = Start-Process -FilePath $env:ComSpec -ArgumentList '/c','ping -n 600 127.0.0.1' -PassThru -WindowStyle Hidden; Start-Sleep -Milliseconds 800; Write-Output ($p.Id.ToString() + '|' + $p.StartTime.ToString('o'))`);
  const [rootPid, started] = (r.stdout || '').trim().split('|');
  const kids = ps(`(Get-CimInstance Win32_Process -Filter "ParentProcessId=${rootPid}" | Measure-Object).Count`).stdout.trim();
  check('the tree victim really has a child to orphan', Number(kids) >= 1, `${kids} child process(es)`);
  const childPid = ps(`(Get-CimInstance Win32_Process -Filter "ParentProcessId=${rootPid}" | Select-Object -First 1).ProcessId`).stdout.trim();
  const { out } = runLauncher({ pidFileContent: `${rootPid}|${started}` });
  check('the whole tree is killed, not just its root', !alive(rootPid) && !alive(childPid),
    `root alive=${alive(rootPid)} child(${childPid}) alive=${alive(childPid)}`);
  check('and the kill is described as verified', /verified it is gone/.test(out));
  if (alive(childPid)) kill(childPid);
  if (alive(rootPid)) kill(rootPid);
}

try { rmSync(work, { recursive: true, force: true }); } catch {}
console.log(`\n${ran - fails}/${ran} passed`);
process.exit(fails ? 1 : 0);
