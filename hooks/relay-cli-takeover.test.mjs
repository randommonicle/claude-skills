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
const work = mkdtempSync(join(tmpdir(), 'takeover-'));

const ps = (script) =>
  spawnSync('powershell', ['-NoProfile', '-Command', script], { encoding: 'utf8' });

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
  const r = spawnSync(
    'powershell',
    ['-NoProfile', '-File', SCRIPT, '-LeaseFile', lease, '-LogFile', log, '-PidFile', pidFile,
     '-Cli', stubCli, '-PromptFile', promptFile],
    { encoding: 'utf8' },
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
  check('and the refusal is logged as a FAULT', /is a different process and will NOT be killed/.test(out),
    /different process/.test(out) ? '' : out.replace(/\s+/g, ' ').slice(0, 140));
  kill(v.pid);
}

// 3. Housekeeping cases: nothing recorded, and a pid that has already exited.
{
  const { out } = runLauncher({ pidFileContent: null });
  check('no recorded pid is handled quietly', /no recorded driver process to stop/.test(out));
}
{
  const v = startVictim();
  kill(v.pid);
  const { out } = runLauncher({ pidFileContent: `${v.pid}|${v.started}` });
  check('a pid that already exited is handled quietly', /already gone|different process/.test(out));
}
{
  const { out } = runLauncher({ pidFileContent: 'not-a-pid-file' });
  check('a malformed pid file kills nothing and says so', /malformed/.test(out));
}

try { rmSync(work, { recursive: true, force: true }); } catch {}
console.log(`\n${ran - fails}/${ran} passed`);
process.exit(fails ? 1 : 0);
