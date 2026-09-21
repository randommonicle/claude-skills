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

// @win32-only -- the marker the hooks-windows CI job discovers this suite by.
//
// Windows PowerShell only. It skips loudly off win32 rather than failing: in the
// Linux-only hooks job `powershell` does not exist, and this suite crashed there on every
// run from 2026-09-18 to 2026-09-21 while passing on the maintainer's machine.
//
// It carried NO marker until 2026-09-21, because case 3 pointed the launcher at
// wininit.exe and relied on this account being unable to terminate it, while a hosted
// Windows runner is elevated and the launcher's kill is a real `taskkill /T /F`. That
// case now manufactures the condition with a stub instead of borrowing it from the OS,
// so nothing here touches a process this suite did not start, and the marker is safe.
// The old arrangement was worse than unsafe: it SKIPPED on the maintainer's non-admin
// machine, so it ran nowhere at all. See DECISIONS.md 2026-09-21.
if (process.platform !== 'win32') {
  console.log(`SKIP  relay-cli-takeover.test.mjs: needs Windows PowerShell, platform is ${process.platform}`);
  console.log('SKIP  not a pass. This suite is executed by the hooks-windows CI job.');
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

function runLauncher({ pidFileContent, staleMinutes = 120, taskkill = null }) {
  const lease = join(work, `lease-${Math.random().toString(36).slice(2)}.txt`);
  const pidFile = join(work, `driver-${Math.random().toString(36).slice(2)}.pid`);
  const log = join(work, 'log.txt');
  const hb = new Date(Date.now() - staleMinutes * 60000).toISOString();
  const ends = new Date(Date.now() + 6 * 3600000).toISOString();
  writeFileSync(lease, `HEARTBEAT ${hb}\r\nDRIVER hung-driver\r\nWINDOW-ENDS ${ends}\r\nIN-FLIGHT x\r\n`);
  if (pidFileContent !== null) writeFileSync(pidFile, pidFileContent);
  const r = psRaw(
    ['-NoProfile', '-File', SCRIPT, '-LeaseFile', lease, '-LogFile', log, '-PidFile', pidFile,
     '-Cli', stubCli, '-PromptFile', promptFile,
     ...(taskkill ? ['-Taskkill', taskkill] : [])],
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
  // A live, correctly identified victim that CANNOT be killed. The condition is
  // MANUFACTURED, with a taskkill stub that reports success and kills nothing, against a
  // victim this suite started itself.
  //
  // It used to be borrowed from the OS: the record pointed at wininit.exe and the case
  // relied on this account being unable to terminate it. That never ran anywhere. On the
  // maintainer's non-admin machine Get-Process could not even read wininit's StartTime,
  // so the case printed "skip" and passed the suite; on a hosted Windows runner, which is
  // elevated, the same code would have force-killed a critical system process. A case
  // that either skips or destroys is not a test, and it is why this suite was kept out of
  // CI until 2026-09-21.
  // The stub is stubCli itself: it is already an @echo off / exit /b 0 .cmd, which is
  // exactly a taskkill that reports success and kills nothing. Reused rather than
  // written fresh because building a .cmd's CRLF escapes from a generator is how
  // LESSONS_LEARNED entry 9's heredoc trap bites, and it bit again writing this line.
  const noopKill = stubCli;
  const v = startVictim();
  const { out } = runLauncher({ pidFileContent: `${v.pid}|${v.started}`, taskkill: noopKill });
  const survived = alive(v.pid);
  // Guard the premise. If the stub did not hold the victim alive, the assertions below
  // would pass for the wrong reason, which is the shape of the bug this whole file exists
  // to catch.
  check('the stub really did leave the victim alive', survived,
    survived ? `pid ${v.pid} still running, as the stub intended` : `pid ${v.pid} died anyway; premise broken`);
  const refused = /STILL RUNNING/.test(out);
  check('a victim that cannot be killed: refuses to fire', refused,
    refused ? '' : out.replace(/\s+/g, ' ').slice(0, 160));
  check('...and does not start a turn', !/starting a CLI turn/.test(out));
  kill(v.pid);
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
