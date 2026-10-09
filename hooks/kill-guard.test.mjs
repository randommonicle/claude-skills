#!/usr/bin/env node
// Proves kill-guard.mjs denies a kill chosen by name or pattern AND stays silent on kills
// chosen by PID, on a path-scoped filter, and on the kill words appearing as text
// (prove-it-can-fail: a guard that denies every grep trains bypass, one that denies nothing
// is theatre). Feeds crafted PreToolUse payloads on stdin and asserts the decision and the
// reason's safe form. Dialect-neutral commands run under both tool names; PowerShell syntax
// runs under 'PowerShell', bash syntax under 'Bash'. Node only: this suite runs on Linux CI.
// Run: node hooks/kill-guard.test.mjs
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'kill-guard.mjs');
const BOTH = ['Bash', 'PowerShell'];
const PS = ['PowerShell'];
const SH = ['Bash'];
const R = String.raw;

const CASES = [];
const deny = (name, cmd, tools = BOTH) => CASES.push({ name, cmd, tools, deny: true });
const allow = (name, cmd, tools = BOTH) => CASES.push({ name, cmd, tools, deny: false });

const WT = R`C:\Users\bengr\Rimagent\.claude\worktrees\handover-session-00d3c9`;
const WT_FWD = 'C:/Users/bengr/Rimagent/.claude/worktrees/handover-session-00d3c9';
const WT_POSIX = '/c/Users/bengr/Rimagent/.claude/worktrees/handover-session-00d3c9';

// ---- DENY: PowerShell, a kill selected by name ---------------------------------------
deny('Stop-Process -Name', 'Stop-Process -Name python', PS);
deny('Stop-Process -ProcessName with -Force', 'Stop-Process -ProcessName python -Force', PS);
deny('Stop-Process -Name abbreviated (-Na)', 'Stop-Process -Na python', PS);
deny('spps -Name', 'spps -Name pytest', PS);
deny('kill alias with -Name', 'kill -Name python', PS);
deny('Stop-Process -Name behind other flags', 'Stop-Process -Force -Confirm:$false -Name python', PS);
// ---- DENY: PowerShell, a filtered listing feeds a kill -------------------------------
deny('Get-Process <wildcard> | Stop-Process', 'Get-Process python* | Stop-Process', PS);
deny('Get-Process -Name | Stop-Process -Force', 'Get-Process -Name pytest | Stop-Process -Force', PS);
deny('gps <name> | spps', 'gps python | spps', PS);
deny('ps alias, name argument, | kill', 'ps python | kill', PS);
deny('Where-Object filter on Get-Process', "Get-Process | Where-Object { $_.Name -like 'py*' } | Stop-Process", PS);
deny('? alias filter, kill alias sink', "Get-Process | ? { $_.ProcessName -match 'pytest' } | kill", PS);
deny('simplified ? syntax, no scriptblock', "gps | ? Name -like 'py*' | kill", PS);
deny(
  'Win32_Process Where-Object into ForEach-Object { Stop-Process -Id $_.ProcessId }',
  "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*pytest*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }",
  PS,
);
deny(
  'Win32_Process -Filter into taskkill /PID $_',
  `Get-CimInstance Win32_Process -Filter "CommandLine like '%pytest%'" | ForEach-Object { taskkill /PID $_.ProcessId /F }`,
  PS,
);
deny(
  'Get-WmiObject Win32_Process, .Terminate()',
  `Get-WmiObject Win32_Process -Filter "name='python.exe'" | ForEach-Object { $_.Terminate() }`,
  PS,
);
deny(
  'Get-CimInstance Win32_Process | Invoke-CimMethod -MethodName Terminate',
  `Get-CimInstance Win32_Process -Filter "name='python.exe'" | Invoke-CimMethod -MethodName Terminate`,
  PS,
);
deny('(Get-Process <name>).Kill()', '(Get-Process python).Kill()', PS);
deny('foreach over a name listing, $p.Kill()', 'foreach ($p in Get-Process python*) { $p.Kill() }', PS);
deny(
  'filter inside ForEach-Object, .Kill()',
  "Get-Process | ForEach-Object { if ($_.Name -like 'py*') { $_.Kill() } }",
  PS,
);
deny(
  '.NET GetProcessesByName, .Kill()',
  "[System.Diagnostics.Process]::GetProcessesByName('python') | ForEach-Object { $_.Kill() }",
  PS,
);
deny('Stop-Process -Id (Get-Process <name>).Id', 'Stop-Process -Id (Get-Process python).Id', PS);
deny('multi-line scriptblock, Where-Object then Stop-Process', "Get-Process |\n  Where-Object { $_.Name -like 'py*' } |\n  Stop-Process", PS);
// across statements: the variable carries the filtered listing
deny('variable assigned from a name listing, piped to Stop-Process', '$p = Get-Process python*; $p | Stop-Process', PS);
deny(
  'variable of ProcessIds from a filtered Win32_Process listing',
  "$ids = (Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*pytest*' }).ProcessId\nStop-Process -Id $ids",
  PS,
);
deny('variable assigned from a listing, $p.Kill()', '$procs = Get-Process python; $procs.Kill()', PS);

// ---- DENY: cmd, any shell -------------------------------------------------------------
deny('taskkill /F /IM', 'taskkill /F /IM python.exe');
deny('taskkill //F //IM (Git Bash form)', 'taskkill //F //IM python.exe');
deny('taskkill dash form -im', 'taskkill -f -im python.exe');
deny('taskkill /IM then /T /F', 'taskkill /IM python.exe /T /F');
deny('taskkill /FI IMAGENAME', 'taskkill /F /FI "IMAGENAME eq python.exe"');
deny('taskkill /FI WINDOWTITLE', "taskkill /FI 'WINDOWTITLE eq pytest*' /F");
deny('taskkill /FI PID plus a second non-PID /FI', 'taskkill /FI "PID eq 12" /FI "IMAGENAME eq node.exe"');
deny('taskkill /PID with /IM as well', 'taskkill /PID 12 /IM python.exe');
deny('wmic process where name ... delete', `wmic process where "name='python.exe'" delete`);
deny('wmic process where commandline like ... call terminate', `wmic process where "commandline like '%pytest%'" call terminate`);

// ---- DENY: bash -------------------------------------------------------------------------
deny('pkill <pattern>', 'pkill pytest', SH);
deny('pkill -f <pattern>', 'pkill -f pytest', SH);
deny('pkill -9 -f quoted pattern', 'pkill -9 -f "director.py run"', SH);
deny('killall <name>', 'killall python', SH);
deny('killall -9', 'killall -9 node', SH);
deny('sudo pkill', 'sudo pkill -f pytest', SH);
deny('env prefix, pkill', 'env FOO=1 pkill -f pytest', SH);
deny('kill $(pgrep ...)', 'kill $(pgrep -f pytest)', SH);
deny('kill -9 $(pidof ...)', 'kill -9 $(pidof python)', SH);
deny('kill with backtick substitution', 'kill `pgrep -f pytest`', SH);
deny('kill with quoted substitution', 'kill "$(pgrep -f pytest)"', SH);
deny('pgrep | xargs kill', 'pgrep -f pytest | xargs kill', SH);
deny('ps | grep | awk | xargs kill -9', "ps aux | grep pytest | grep -v grep | awk '{print $2}' | xargs kill -9", SH);
deny('ps -ef | grep | xargs -r kill', "ps -ef | grep python | awk '{print $2}' | xargs -r kill", SH);
deny('kill $(ps | grep | awk)', "kill $(ps aux | grep pytest | awk '{print $2}')", SH);
deny('PIDs assigned then killed', 'pids=$(pgrep -f pytest); kill $pids', SH);
deny('for over $(pgrep), kill $p', 'for p in $(pgrep -f pytest); do kill -9 $p; done', SH);
deny('pgrep | while read, kill $p', 'pgrep -f pytest | while read p; do kill $p; done', SH);
deny('ps -W | grep | xargs taskkill', "ps -W | grep python | awk '{print $1}' | xargs -I{} taskkill //PID {} //F", SH);
deny('multi-line for loop over pgrep', 'for p in $(pgrep -f pytest)\ndo\n  kill $p\ndone', SH);

// ---- DENY: wrappers ---------------------------------------------------------------------
deny('bash -c wrapping pkill', 'bash -c "pkill -f pytest"', SH);
deny('bash -lc wrapping pkill', "bash -lc 'pkill -f pytest'", SH);
deny('sh -c wrapping killall', "sh -c 'killall python'", SH);
deny('bash -c with escaped inner quotes', 'bash -c "pkill -f \\"director.py run\\""', SH);
deny('pwsh -Command wrapping a listing pipeline', `pwsh -Command "Get-Process python | Stop-Process"`);
deny('powershell -NoProfile -Command wrapping Stop-Process -Name', `powershell -NoProfile -Command "Stop-Process -Name python"`);
deny(
  'powershell -Command with single-quoted filter in a double-quoted body',
  `powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*pytest*' } | ForEach-Object { Stop-Process -Id $_.ProcessId }"`,
);
deny('powershell -ExecutionPolicy Bypass -Command', `powershell -NoProfile -ExecutionPolicy Bypass -Command "Stop-Process -Name python"`);
deny('pwsh -c with single-quoted body', "pwsh -c 'Stop-Process -Name python'");
deny('cmd /c taskkill /IM (unquoted body)', 'cmd /c taskkill /F /IM python.exe');
deny('cmd //c quoted body (Git Bash form)', 'cmd //c "taskkill //F //IM python.exe"');
deny('two wrappers deep', `bash -c "pwsh -Command 'Stop-Process -Name python'"`, SH);
deny('eval wrapping pkill', 'eval "pkill -f pytest"', SH);
deny('Invoke-Expression wrapping Stop-Process -Name', `Invoke-Expression "Stop-Process -Name python"`, PS);
deny(
  'powershell -EncodedCommand carrying Stop-Process -Name',
  `powershell -NoProfile -EncodedCommand ${Buffer.from('Stop-Process -Name python', 'utf16le').toString('base64')}`,
);

// ---- DENY: a denylisted binary does not shield a real kill ------------------------------
deny('git pull && pkill', 'git pull && pkill -f pytest', SH);
deny('echo ...; taskkill /IM', 'echo done; taskkill /F /IM node.exe');
deny('grep | xargs pkill', 'grep -l x files.txt | xargs pkill -f pytest', SH);
deny('echo | pkill (denylisted first stage)', 'echo go | pkill -f pytest', SH);
deny('newline after a denylisted line', 'git status\npkill -f pytest', SH);
deny('cd then Get-Process pipeline in a later statement', "cd C:\\tmp; Get-Process python | Stop-Process", PS);

// ---- DENY: scanner edges (continuations, substitutions, program paths) ---------------------
deny('line ending in a pipe continues the pipeline (bash)', 'pgrep -f pytest |\n  xargs kill', SH);
deny('line ending in && continues the command', 'git pull &&\n  pkill -f pytest', SH);
deny('backtick continuation (PowerShell)', 'Get-Process python `\n  | Stop-Process', PS);
deny('$(...) inside a double-quoted string is code (PowerShell)', '"$(Get-Process python | Stop-Process)"', PS);
deny('a Where-Object that is not PID-only', "Get-Process | Where-Object { $_.Id -eq 99 -or $_.Name -like 'x*' } | Stop-Process", PS);
deny('the program path is not a filter path (/usr/bin/pkill)', '/usr/bin/pkill -f pytest', SH);
// (A backslash path unquoted is mangled by bash itself, so the backslash forms run as PowerShell.)
deny('a full-path taskkill.exe is still taskkill', R`C:\Windows\System32\taskkill.exe /F /IM python.exe`, PS);
deny('a full-path taskkill.exe, MSYS form', '/c/Windows/System32/taskkill.exe //F //IM python.exe', SH);
deny('a full-path powershell.exe wrapper is still unwrapped', R`C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -Command "Get-Process python | Stop-Process"`, PS);
deny('a full-path powershell.exe wrapper, MSYS form', '/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -Command "Get-Process python | Stop-Process"', SH);
deny('2> after Stop-Process is a redirect, not a PID', 'Get-Process python | Stop-Process 2> err.txt', PS);

// ---- DENY: the absolute-path exemption does not stretch -----------------------------------
deny('one-segment drive path is not enough', R`Get-Process | Where-Object { $_.Path -like 'C:\Windows*' } | Stop-Process`, PS);
deny('one segment after an MSYS drive is not enough', 'pgrep -f /c/Users | xargs kill', SH);
deny('relative path is not absolute', 'pgrep -f proj/venv/bin | xargs kill', SH);
deny('a URL is not a drive path (bash)', 'pgrep -f https://example.com/api/health | xargs kill', SH);
deny(
  'a URL is not a drive path (PowerShell filter)',
  "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*https://x.y/a/b*' } | Stop-Process",
  PS,
);
deny('a drive-letter lookalike with // is not a drive path', 'pgrep -f "s://h/a/b" | xargs kill', SH);
deny(
  'a PID variable assigned from a name listing still taints the PID filter',
  '$target = (Get-Process python*).Id; Get-Process | Where-Object { $_.Id -eq $target } | Stop-Process',
  PS,
);
deny('a PID property of a listing variable is not a literal PID', '$x = Get-Process python*; Get-Process | Where-Object { $_.Id -eq $x.Id } | Stop-Process', PS);
deny('a path in another statement does not scope the kill', `cd ${WT_FWD}; pkill -f pytest`, SH);
deny('a path as a redirect target does not scope the kill', `Get-Process python | Stop-Process 2> ${WT}\\err.txt`, PS);
deny('Stop-Process -Name is never path-scoped', R`Stop-Process -Name python # C:\Users\bengr\x`, PS);
deny('taskkill /IM is never path-scoped', `taskkill /IM python.exe /FI "WINDOWTITLE eq ${WT_FWD}"`);
deny('killall is never path-scoped', `killall -r ${WT_POSIX}/venv`, SH);
deny('pkill without -f matches names only, so a path does not scope it', `pkill ${WT_POSIX}/venv`, SH);

// ---- ALLOW: a kill by PID ---------------------------------------------------------------
allow('Stop-Process -Id <digits>', 'Stop-Process -Id 1234');
allow('Stop-Process -Id <digits>,<digits> -Force', 'Stop-Process -Id 1234,5678 -Force');
allow('Stop-Process -Force -Id <digits>', 'Stop-Process -Force -Id 1234', PS);
allow('Stop-Process -Id $variable not assigned from a listing', 'Stop-Process -Id $pid_var', PS);
allow('Stop-Process -Id $PID', 'Stop-Process -Id $PID', PS);
allow('spps -Id', 'spps -Id 4242', PS);
allow('taskkill /PID', 'taskkill /PID 1234');
allow('taskkill /PID /T /F', 'taskkill /PID 1234 /T /F');
allow('taskkill //PID //F (Git Bash form)', 'taskkill //PID 1234 //F');
allow('taskkill /F /T /PID in another order', 'taskkill /F /T /PID 1234');
allow('taskkill /FI "PID eq <digits>"', 'taskkill /F /FI "PID eq 1234"');
allow('taskkill with two PID filters', "taskkill /FI 'PID eq 12' /FI 'PID eq 14'");
allow('kill <digits>', 'kill 1234', SH);
allow('kill %1', 'kill %1', SH);
allow('kill -9 <digits>', 'kill -9 1234', SH);
allow('kill -s TERM <digits>', 'kill -s TERM 1234', SH);
allow('kill -n <sig> <digits> (bash, not a -Name)', 'kill -n 9 1234', SH);
allow('kill -l', 'kill -l', SH);
allow('kill -0 $pid', 'kill -0 $pid', SH);
allow('sudo kill <digits>', 'sudo kill 1234', SH);
allow('kill of a PID read from a file', 'kill $(cat app.pid)', SH);
allow('kill of a PID variable not assigned from a listing', 'pid=$!; kill $pid', SH);
allow('Stop-Job', 'Stop-Job -Name build', PS);
allow('Get-Job | Stop-Job', 'Get-Job | Stop-Job', PS);
allow('Get-Process -Id <digits> | Stop-Process', 'Get-Process -Id 1234 | Stop-Process', PS);
allow('Get-Process -Id $x | Stop-Process', 'Get-Process -Id $x | Stop-Process', PS);
allow('(Get-Process -Id <digits>).Kill()', '(Get-Process -Id 1234).Kill()', PS);
allow('GetProcessById(<digits>).Kill()', '[System.Diagnostics.Process]::GetProcessById(1234).Kill()', PS);
allow(
  'Win32_Process -Filter "ProcessId=<digits>" | Terminate',
  `Get-CimInstance Win32_Process -Filter "ProcessId=1234" | Invoke-CimMethod -MethodName Terminate`,
  PS,
);
allow(
  'Win32_Process Where-Object { $_.ProcessId -eq <digits> } | Stop-Process',
  'Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -eq 1234 } | ForEach-Object { Stop-Process -Id $_.ProcessId }',
  PS,
);
allow('Where-Object { $_.Id -eq $variable } | Stop-Process', 'Get-Process | Where-Object { $_.Id -eq $target } | Stop-Process', PS);
allow('wmic process where ProcessId=<digits> delete', 'wmic process where "ProcessId=1234" delete');
allow('wmic process where processid=<digits> call terminate', 'wmic process where processid=1234 call terminate');
allow('a listing and a literal-PID kill in one block', 'if (Get-Process node -ErrorAction SilentlyContinue) { Stop-Process -Id 1234 }', PS);
allow('a variable assigned from a literal, then Stop-Process -Id', '$ids = 12,14; Stop-Process -Id $ids', PS);
allow('a listing variable not used by the kill', 'pids=$(pgrep -f pytest); echo $pids; kill 1234', SH);
allow('xargs kill after a PID file, no listing', 'cat app.pid | xargs kill', SH);

// ---- ALLOW: listing without a kill ------------------------------------------------------
allow('Get-Process by name, no kill', 'Get-Process python', PS);
allow('Win32_Process Where-Object ... Select-Object (the safe listing)', "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*pytest*' } | Select-Object ProcessId,CommandLine", PS);
allow('pgrep -af', 'pgrep -af pytest', SH);
allow('ps aux | grep', 'ps aux | grep pytest', SH);
allow('tasklist /FI', 'tasklist /FI "IMAGENAME eq python.exe"');
allow('a variable assigned from a listing, only counted', '$p = Get-Process python*; $p.Count', PS);

// ---- ALLOW: the kill words as text ------------------------------------------------------
allow('git commit -m naming taskkill', 'git commit -m "taskkill /IM foo"');
allow('git commit -m naming pkill and killall with a semicolon', 'git commit -m "fix: pkill -f pytest; killall python"');
allow('git commit -m with escaped quotes inside', 'git commit -m "guard against \\"Stop-Process -Name x\\" in a loop"', SH);
allow('grep for Stop-Process -Name', 'grep -n "Stop-Process -Name" file');
allow('grep -rn unquoted pkill', 'grep -rn pkill hooks/');
allow('rg for taskkill', 'rg "taskkill /IM" .');
allow('echo pkill', 'echo pkill');
allow('echo quoted Stop-Process -Name', 'echo "Stop-Process -Name x"');
allow('printf quoted killall', "printf '%s\\n' 'killall python'");
allow('cat of a file named kill', 'cat kill-notes.md');
allow('sed print of pkill lines', "sed -n '/pkill/p' notes.md");
allow('head of pkill.log', 'head -5 pkill.log');
allow('git log --grep=pkill', 'git log --grep=pkill --oneline');
allow('git diff piped to head', 'git diff -- hooks/kill-guard.mjs | head -20');
allow('Select-String for Stop-Process -Name', 'Select-String -Pattern "Stop-Process -Name" -Path hooks/x.ps1', PS);
allow('Write-Output taskkill /IM', 'Write-Output "taskkill /IM foo"', PS);
allow('Get-Content kill.log', 'Get-Content kill.log', PS);
allow('Get-Command taskkill', 'Get-Command taskkill', PS);
allow('which pkill', 'which pkill', SH);
allow('a trailing comment naming pkill', 'ls hooks # then pkill -f pytest', SH);
allow('a heredoc body naming pkill', "cat <<'EOF' > notes.md\npkill -f pytest\ntaskkill /IM x.exe\nEOF", SH);
allow(
  'git commit with a heredoc message naming pkill',
  'git commit -m "$(cat <<\'EOF\'\nfix: stop using\npkill -f pytest\nEOF\n)"',
  SH,
);
allow('a PowerShell here-string naming Stop-Process -Name', "@'\nStop-Process -Name x\n'@ | Set-Content notes.txt", PS);
allow('node -e carrying a kill in a quoted string', `node -e "require('child_process').exec('taskkill /IM x.exe')"`);
allow('python -c carrying os.kill in a quoted string', `python -c "import os; os.kill(1234, 9)"`);
allow('npm run kill-port (a script name, not the kill word)', 'npm run kill-port');
allow('find -name ... -exec kill (the -name belongs to find)', 'find . -name "*.pid" -exec kill {} \\;', SH);
allow('git push to a branch named pkill-fix', 'git push origin pkill-fix', SH);
allow('plain test run', 'npm test');
allow('node test suite', 'node hooks/kill-guard.test.mjs');
allow('a script run by name is not read (documented residual)', 'bash cleanup.sh', SH);
allow('a pipe inside a quoted string is not a stage break', 'echo "a | pkill x" | wc -c', SH);
allow('a semicolon inside a quoted string is not a statement break', "git commit -m 'a; pkill x; b'");
allow('ls piped to grep naming ps', 'ls -la | grep ps', SH);
allow('a plain /usr/bin/kill by PID', '/usr/bin/kill 1234', SH);
allow('2>&1 after a PID kill', 'Stop-Process -Id 12 2>&1', PS);

// ---- ALLOW: an absolute path in the filter is the safe form --------------------------------
allow(
  'Win32_Process filtered on this worktree path, excluding $PID, then Stop-Process -Id',
  `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${WT}*' -and $_.ProcessId -ne $PID } | ForEach-Object { Stop-Process -Id $_.ProcessId }`,
  PS,
);
allow(
  'forward-slash drive path in the filter',
  `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${WT_FWD}*' } | ForEach-Object { $_.Terminate() }`,
  PS,
);
allow(
  'Win32_Process -Filter carrying the worktree path',
  `Get-CimInstance Win32_Process -Filter "CommandLine like '%${WT.replace(/\\/g, '\\\\')}%'" | Invoke-CimMethod -MethodName Terminate`,
  PS,
);
allow('pgrep -f <absolute /c/ path> | xargs kill', `pgrep -f ${WT_POSIX} | xargs kill`, SH);
allow('kill $(pgrep -f <absolute path>)', `kill $(pgrep -f "${WT_POSIX}")`, SH);
allow('ps | grep <absolute path> | xargs kill', `ps aux | grep ${WT_POSIX} | awk '{print $2}' | xargs kill`, SH);
allow('PIDs assigned from an absolute-path pgrep, then killed', `pids=$(pgrep -f ${WT_POSIX}); kill $pids`, SH);
allow('pkill -f <absolute path>', `pkill -f ${WT_POSIX}`, SH);
allow('/usr/bin/pkill -f <absolute path>', `/usr/bin/pkill -f ${WT_POSIX}`, SH);
allow('pkill -9 -f quoted absolute path', `pkill -9 -f "${WT_POSIX}/venv/bin/python"`, SH);
allow(
  'wmic where-clause carrying an absolute path',
  `wmic process where "commandline like '%${WT.replace(/\\/g, '\\\\')}%'" delete`,
);
allow('Get-Process Path filter on an absolute path', `Get-Process | Where-Object { $_.Path -like '${WT}\\venv\\*' } | Stop-Process`, PS);

// ---- ALLOW: not a command we judge ---------------------------------------------------------
allow('empty command', '');

// ---- the runner -------------------------------------------------------------------------------

function run(stdin) {
  return new Promise((resolve) => {
    const p = spawn('node', [HOOK], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (c) => (out += c));
    p.on('close', (code) => resolve({ out, code }));
    p.stdin.end(stdin);
  });
}

const jobs = CASES.flatMap((c) => c.tools.map((tool) => ({ ...c, tool })));

async function judge(job) {
  const evt = { tool_name: job.tool, cwd: '/workspace/Rimagent', tool_input: { command: job.cmd } };
  const { out, code } = await run(JSON.stringify(evt));
  const why = [];
  if (code !== 0) why.push(`exit=${code}`);
  if (job.deny) {
    let parsed = null;
    try {
      parsed = JSON.parse(out).hookSpecificOutput;
    } catch {
      why.push('no JSON decision');
    }
    if (parsed) {
      if (parsed.hookEventName !== 'PreToolUse') why.push('hookEventName');
      if (parsed.permissionDecision !== 'deny') why.push(`decision=${parsed.permissionDecision}`);
      const reason = parsed.permissionDecisionReason ?? '';
      if (!reason.startsWith('kill-guard: "')) why.push('reason missing the matched fragment');
      for (const want of ['Kill by PID', 'Get-CimInstance Win32_Process', 'Select-Object ProcessId,CommandLine', 'absolute path', '$PID']) {
        if (!reason.includes(want)) why.push(`reason missing ${JSON.stringify(want)}`);
      }
    }
  } else if (out !== '') {
    why.push(`denied: ${out.slice(0, 160)}`);
  }
  return why;
}

// 8 at a time: a node start is ~50 ms, and results print in case order.
const results = new Array(jobs.length);
let next = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (next < jobs.length) {
      const k = next++;
      results[k] = await judge(jobs[k]);
    }
  }),
);

let fails = 0;
jobs.forEach((job, k) => {
  const why = results[k];
  if (why.length) fails++;
  console.log(`${why.length ? 'FAIL' : 'PASS'}  ${job.deny ? 'denies' : 'silent'} | ${job.name} [${job.tool}]${why.length ? ` (${why.join(', ')})` : ''}`);
});

// Output shape and the reason's safe form, once, on a known deny.
{
  const { out, code } = await run(JSON.stringify({ tool_name: 'Bash', cwd: '/w', tool_input: { command: 'pkill -f pytest' } }));
  const parsed = JSON.parse(out).hookSpecificOutput;
  const ok =
    code === 0 &&
    parsed.permissionDecision === 'deny' &&
    parsed.permissionDecisionReason.includes('kill-guard: "pkill -f pytest" (pkill selects by pattern)') &&
    parsed.permissionDecisionReason.includes('2026-10-03');
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  denies | the reason names the matched command, the rule and the incident date`);
}

// Fail-open: unreadable or oddly shaped input must exit 0 and say nothing.
const ODD = [
  ['malformed stdin', 'not json at all'],
  ['empty stdin', ''],
  ['no tool_input', JSON.stringify({ tool_name: 'Bash' })],
  ['command is not a string', JSON.stringify({ tool_name: 'Bash', tool_input: { command: 42 } })],
  ['command missing', JSON.stringify({ tool_name: 'Bash', tool_input: {} })],
  ['JSON null', 'null'],
  ['a deeply nested wrapper chain is cut off, not followed forever', JSON.stringify({ tool_name: 'Bash', tool_input: { command: `${'bash -c "'.repeat(9)}x` } })],
];
for (const [name, stdin] of ODD) {
  const { out, code } = await run(stdin);
  const ok = code === 0 && out === '';
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  silent | ${name} exits 0 with no decision (exit=${code})`);
}

const total = jobs.length + 1 + ODD.length;
console.log(fails === 0 ? `\nALL PASS (${total} cases)` : `\n${fails} FAILED of ${total} cases`);
process.exit(fails === 0 ? 0 : 1);
