#!/usr/bin/env node
// PreToolUse hook, matcher: Bash|PowerShell. Denies a process kill whose target set is
// chosen by NAME or PATTERN rather than by PID, because on this machine several Claude
// sessions run at once and a pattern reaches processes that are not the agent's own.
//
// The incident (Rimagent LESSONS_LEARNED, 2026-10-03). An agent killed every python.exe
// whose command line held "pytest" and could reach other sessions' test runs. The same
// day a kill matching "*director.py run*" hit the session's own monitor probes, whose
// command lines carried the pattern as text. Rule: kill by PID, or by a command line
// that holds this checkout's own absolute path, never by a bare pattern. Class: a
// destructive action scoped by a pattern on a resource other agents share.
//
// Why deny and not ask. In a bypass-permissions session an "ask" is auto-approved and
// shown to nobody (DECISIONS.md, 2026-09-20, secret-echo-guard). The deny reaches the
// model whatever the permission mode, and the reason carries the safe form.
//
// What is denied, judged from the command string alone:
//   1. Stop-Process / spps with -Name or -ProcessName (and kill -Name), taskkill with
//      /IM or with any /FI that is not "PID eq <digits>", wmic process ... delete or
//      call terminate unless the where-clause is ProcessId=<digits> or holds an
//      absolute path, pkill and killall.
//   2. A process listing not limited to explicit PIDs (Get-Process, gps, ps, Get-CimInstance
//      or Get-WmiObject Win32_Process, GetProcessesByName, pgrep, pidof, tasklist) in the
//      same statement as a kill (Stop-Process, kill, taskkill, .Kill(), .Terminate(),
//      Invoke-CimMethod Terminate, xargs kill), including inside ForEach-Object blocks,
//      $(...) and wrappers, and across statements through a variable the listing
//      assigned (`$p = Get-Process x; $p | Stop-Process`, `for p in $(pgrep x); do kill $p`).
//   3. Rule 2, the wmic form and pkill are exempt when the statement carries an absolute
//      path of at least two segments (C:\a\b, C:/a/b, /c/a/b), the "this checkout's own
//      path" form. pkill takes it only with -f, since without -f the pattern matches names
//      only; killall, Stop-Process -Name and taskkill /IM never take it.
//
// What is allowed: any kill by explicit PID (Stop-Process -Id 1,2, taskkill /PID 9 /T /F,
// kill 9, kill -9 9, kill %1), Stop-Job, and the kill words as text: inside quotes,
// comments, heredoc bodies, or as arguments of a leading-binary denylist command (grep,
// rg, cat, echo, git, Select-String, ...). The denylist is judged per pipeline stage, so
// `git pull && pkill x` and `echo a | xargs pkill x` are still judged.
//
// How a command is read. A quote-aware scanner (single quotes literal; double quotes
// and @"..."@ expanding, so $(...) inside them stays code; backslash, or the backtick
// under the PowerShell tool, escaping) blanks literal text and splits at top-level `;`,
// `&&`, `||` and newline into statements and at `|` into stages. bash -c, sh -c,
// pwsh/powershell -Command and -EncodedCommand, cmd /c, eval, iex are unwrapped and
// analysed the same way, to a depth of four.
//
// Residual, by design: a guard against a routine slip, not a boundary. Passes: a PID list
// assigned outside the command (`Stop-Process -Id $ids` with $ids from an earlier call), a
// script run by name (`node kill.mjs`, `bash x.sh`), kills selected by port (lsof -ti:N |
// xargs kill, Get-NetTCPConnection, npx kill-port), Stop-Service, `kill -9 -1`, a kill
// word built at run time, cmd `for /f` loops over tasklist, a listing written to a file and
// killed from it in the same command (`ps ... >> pids; xargs kill < pids`: no variable, so no
// taint), and a kill inside a $(...) argument of a denylisted command (`echo $(pkill x)`).
// Known false positive, one retry: a Where-Object on PID that the pass cannot prove is
// literal, e.g. `$_.Id -eq $x.Id`. The absolute-path test is syntactic: it cannot tell this
// checkout's path from a shared one (C:\Python312\python.exe, C:\Users\x), and the path may sit
// anywhere in the same statement bar a redirect target or the program's own path. The event
// carries `cwd`, which this hook does not read; a prefix check against it is the tightening.
// Fail-open: any script error exits 0 with no output.
const MAX_DEPTH = 4;
const SEP = '\u0001';
const PIPE = '\u0002';

// Commands that carry the words as text and never run them. Judged per pipeline stage.
const INERT = new Set([
  'grep', 'rg', 'egrep', 'fgrep', 'cat', 'echo', 'printf', 'sed', 'awk', 'head', 'tail', 'less', 'more',
  'git', 'select-string', 'sls', 'write-output', 'write-host', 'findstr', 'get-content', 'type',
  'which', 'man', 'get-command', 'gcm', 'get-help',
]);
const PREFIX = new Set(['sudo', 'env', 'command', 'time', 'nice', 'nohup', 'exec', 'builtin', 'call']);

const R = String.raw;
const WORD = R`(?<![\w.$-])`; // a command word is not the tail of a longer name, option or variable
const SINK = new RegExp(R`${WORD}(?:Stop-Process|spps|kill|pkill|killall|taskkill(?:\.exe)?)(?![\w.-])|\.(?:Kill|Terminate)\s*\(`, 'i');
const INVOKE_TERMINATE = /Invoke-(?:Cim|Wmi)Method\b[^|;]*\bTerminate\b/i;
const WMIC_PROC = new RegExp(R`${WORD}wmic(?:\.exe)?\s+process\b`, 'i');
const WMIC_KILL = /\b(?:delete|call\s+terminate)\b/i;
const LISTING = new RegExp(R`${WORD}(?:Get-Process|gps|ps|pgrep|pidof|tasklist)(?![\w.-])`, 'i');
const CIM_CMD = new RegExp(R`${WORD}(?:Get-CimInstance|Get-WmiObject|gcim|gwmi)(?![\w-])`, 'i');
const DOTNET_LISTING = /\bGetProcesses(?:ByName)?\s*\(/i;
const TASKKILL = new RegExp(R`${WORD}taskkill(?:\.exe)?(?![\w.-])`, 'i');
const PKILL = new RegExp(R`${WORD}(pkill|killall)(?![\w.-])`, 'i');

const prefixes = (word, min) => Array.from({ length: word.length - min + 1 }, (_, k) => word.slice(0, min + k));
// A name flag AFTER the command word, so `find . -name x -exec kill {} \;` is not read as one.
// Stop-Process accepts -N, -Na, -Proc ...; bash `kill -n 9 1` must stay allowed, hence min 2.
const nameFlag = (cmds, min) => {
  const flags = [...prefixes('name', min), ...prefixes('processname', 4)].join('|');
  return new RegExp(R`${WORD}(?:${cmds})\s+(?:\S+\s+){0,8}?-(?:${flags})(?=[\s:=]|$)`, 'i');
};
const STOP_BY_NAME = nameFlag('Stop-Process|spps', 1);
const KILL_BY_NAME = nameFlag('kill', 2);

// Absolute path of at least two segments: a drive path (C:\a\b, C:/a/b, wmic's C:\\a\\b) or
// a POSIX path (/home/a/b). An MSYS drive (/c/a/b) needs two segments after the drive letter.
const SEG = R`[A-Za-z0-9_.@+-]+`;
const NOT_PATH_TAIL = R`(?<![\w.~$:/\\-])`;
const ABS_PATH = new RegExp(
  R`(?<![A-Za-z0-9])[A-Za-z]:(?:\\{1,2}|/)[^\\/\s'"\x60*?<>|:]+(?:\\{1,2}|/)[^\\/\s'"\x60*?<>|:]+` +
    R`|${NOT_PATH_TAIL}/[A-Za-z]/${SEG}/${SEG}` +
    R`|${NOT_PATH_TAIL}/(?![A-Za-z]/)${SEG}/${SEG}`,
);
const REDIRECT = /[\d*]*>>?&?\s*\S+/g;

// Literal-PID kills are not "fed" by anything. Removed before the sink test so that
// `if (Get-Process x) { Stop-Process -Id 12 }` is not read as a listing feeding a kill.
const LITERAL_KILLS = [
  new RegExp(R`${WORD}(?:Stop-Process|spps|kill)\s+(?:-\w+\s+)*?(?:-Id\s+)?\d+(?:\s*,\s*\d+)*(?=[\s;)}|]|$)`, 'gi'),
  new RegExp(R`${WORD}taskkill(?:\.exe)?\s+(?:(?:/{1,2}|-)[A-Za-z]+\s+)*(?:/{1,2}|-)PID\s+\d+(?:\s+(?:/{1,2}|-)[A-Za-z]+)*`, 'gi'),
];

const WRAPPERS = [
  { re: new RegExp(R`${WORD}(?:ba|z|da|k)?sh(?:\.exe)?\s+(?:-[A-Za-z]+\s+)*-[A-Za-z]*c[A-Za-z]*\s+`, 'gi'), ps: false },
  { re: new RegExp(R`${WORD}(?:pwsh|powershell)(?:\.exe)?\s+(?:\S+\s+){0,8}?-(?:c|co|com|comm|comma|comman|command)\s+`, 'gi'), ps: true },
  { re: new RegExp(R`${WORD}cmd(?:\.exe)?\s+(?:/{1,2}[A-Za-z]\s+)*?/{1,2}[ck]\s+`, 'gi'), ps: false },
  { re: new RegExp(R`${WORD}(?:eval|iex|Invoke-Expression)\s+`, 'gi') },
];
const ENCODED = new RegExp(R`${WORD}(?:pwsh|powershell)(?:\.exe)?\s+(?:\S+\s+){0,8}?-(?:e|ec|en\w*)\s+([A-Za-z0-9+/]{12,}={0,2})`, 'i');

// ---- scanner --------------------------------------------------------------------------

// Returns statements, each a list of pipeline stages { raw, s }. `s` is `raw` with literal
// text blanked (quoted strings, comments, heredoc and here-string bodies), same length.
function scan(cmd, ps) {
  const n = cmd.length;
  const out = cmd.split('');
  const stack = [];
  const heredocs = [];
  const esc = ps ? '`' : '\\';
  let depth = 0;
  let i = 0;
  const blank = (from, to) => {
    for (let k = from; k < to && k < n; k++) out[k] = ' ';
  };
  while (i < n) {
    const c = cmd[i];
    const top = stack[stack.length - 1];
    const inFrame = stack.length > 0;
    if (top?.t === 'sq') {
      if (c === "'") {
        if (ps && cmd[i + 1] === "'") blank(i, (i += 2));
        else stack.pop(), i++;
      } else blank(i, ++i);
      continue;
    }
    if (top?.t === 'hs') {
      if (cmd.startsWith(top.close, i) && (i === 0 || cmd[i - 1] === '\n')) stack.pop(), (i += 2);
      else blank(i, ++i);
      continue;
    }
    if (top?.t === 'dq') {
      if (c === '"') {
        if (ps && cmd[i + 1] === '"') blank(i, (i += 2));
        else stack.pop(), i++;
      } else if (c === esc) blank(i, (i += 2));
      else if (c === '$' && cmd[i + 1] === '(') stack.push({ t: 'sub', open: 1 }), (i += 2);
      else if (!ps && c === '`') stack.push({ t: 'bt' }), i++;
      else blank(i, ++i);
      continue;
    }
    // code: top level, or inside $(...) / backticks
    if (c === esc) {
      blank(i, (i += 2));
    } else if (c === "'") {
      stack.push({ t: 'sq' }), i++;
    } else if (c === '"') {
      stack.push({ t: 'dq' }), i++;
    } else if (ps && c === '@' && (cmd[i + 1] === "'" || cmd[i + 1] === '"') && /^\r?\n/.test(cmd.slice(i + 2, i + 4))) {
      stack.push({ t: 'hs', close: `${cmd[i + 1]}@` }), (i += 2);
    } else if (c === '#' && (i === 0 || /[\s;&|(]/.test(cmd[i - 1]))) {
      while (i < n && cmd[i] !== '\n') out[i++] = ' ';
    } else if (!ps && c === '<' && cmd[i + 1] === '<' && cmd[i + 2] !== '<') {
      const m = /^<<(-?)[ \t]*(?:'([^'\n]*)'|"([^"\n]*)"|\\?([A-Za-z_][\w-]*))/.exec(cmd.slice(i, i + 200));
      if (m) heredocs.push({ tag: m[2] ?? m[3] ?? m[4], dash: m[1] === '-' });
      i += m ? m[0].length : 2;
    } else if (!ps && c === '`') {
      if (top?.t === 'bt') stack.pop();
      else stack.push({ t: 'bt' });
      i++;
    } else if (c === '(') {
      if (top?.t === 'sub') top.open++;
      else if (!inFrame) depth++;
      i++;
    } else if (c === ')') {
      if (top?.t === 'sub') {
        if (--top.open === 0) stack.pop();
      } else if (!inFrame && depth > 0) depth--;
      i++;
    } else if (c === '{' || c === '}') {
      if (!inFrame) depth = Math.max(0, depth + (c === '{' ? 1 : -1));
      i++;
    } else if (c === '\n') {
      let next = i + 1;
      while (heredocs.length) {
        const { tag, dash } = heredocs.shift();
        while (next < n) {
          const end = cmd.indexOf('\n', next);
          const stop = end === -1 ? n : end;
          const line = cmd.slice(next, stop).replace(/\r$/, '');
          blank(next, stop + 1);
          next = stop + 1;
          if ((dash ? line.replace(/^\t+/, '') : line) === tag) break;
        }
      }
      // A line ending in `|`, `&&` or `||` continues onto the next one.
      let k = i - 1;
      while (k >= 0 && /\s/.test(out[k])) k--;
      const continued = k >= 0 && (out[k] === PIPE || (out[k] === SEP && cmd[k] !== ';' && cmd[k] !== '\n'));
      out[i] = !inFrame && depth === 0 && !continued ? SEP : ' ';
      i = next;
    } else if (!inFrame && depth === 0 && c === ';') {
      out[i++] = SEP;
    } else if (!inFrame && depth === 0 && (c === '&' || c === '|') && cmd[i + 1] === c) {
      out[i] = SEP, out[i + 1] = ' ', (i += 2);
    } else if (!inFrame && depth === 0 && c === '|') {
      out[i] = PIPE;
      if (cmd[i + 1] === '&') out[++i] = ' ';
      i++;
    } else {
      i++;
    }
  }
  const s = out.join('');
  const stmts = [];
  let stages = [];
  let start = 0;
  for (let k = 0; k <= n; k++) {
    const ch = k < n ? s[k] : SEP;
    if (ch !== SEP && ch !== PIPE) continue;
    stages.push({ raw: cmd.slice(start, k), s: s.slice(start, k) });
    start = k + 1;
    if (ch === SEP) {
      stmts.push({ stages, raw: stages.map((g) => g.raw).join(' | '), s: stages.map((g) => g.s).join(' | ') });
      stages = [];
    }
  }
  return stmts;
}

// ---- helpers --------------------------------------------------------------------------

function leadingBinary(s) {
  const toks = s.replace(/^[\s({!&]+/, '').split(/\s+/);
  for (let i = 0; i < toks.length; i++) {
    if (/^[A-Za-z_]\w*=/.test(toks[i])) continue;
    const bin = toks[i].replace(/^.*[\\/]/, '').replace(/\.exe$/i, '').toLowerCase();
    if (!PREFIX.has(bin)) return bin;
    while (toks[i + 1]?.startsWith('-')) i++;
  }
  return '';
}

function fragment(text) {
  const one = text.replace(/\s+/g, ' ').trim();
  return one.length > 140 ? `${one.slice(0, 140)} ...` : one;
}

// The text of the argument after a wrapper flag, unescaped by the OUTER shell's rules.
function bodyAt(raw, from, outerPs) {
  const q = raw[from];
  if (q !== '"' && q !== "'") return raw.slice(from);
  let text = '';
  for (let k = from + 1; k < raw.length; k++) {
    const ch = raw[k];
    if (ch === q) {
      if (outerPs && raw[k + 1] === q) text += q, k++;
      else return text;
    } else if (q === '"' && outerPs && ch === '`' && k + 1 < raw.length) text += raw[++k];
    else if (q === '"' && !outerPs && ch === '\\' && k + 1 < raw.length && '$`"\\\n'.includes(raw[k + 1])) text += raw[++k];
    else text += ch;
  }
  return text;
}

function wrapperBodies(g, ps) {
  const bodies = [];
  for (const w of WRAPPERS) {
    for (const m of g.s.matchAll(w.re)) {
      const text = bodyAt(g.raw, m.index + m[0].length, ps);
      if (text) bodies.push({ text, ps: w.ps ?? ps });
    }
  }
  const enc = ENCODED.exec(g.raw);
  if (enc) bodies.push({ text: Buffer.from(enc[1], 'base64').toString('utf16le'), ps: true });
  return bodies;
}

// A redirect target is not a filter, and neither is the path of the program itself
// (/usr/bin/pkill, C:\Windows\System32\...\powershell.exe).
const PROGRAM_PATH = /\S*[\\/](?:pkill|killall|kill|taskkill|pgrep|pidof|ps|xargs|bash|sh|powershell|pwsh|cmd)(?:\.exe)?(?=\s|$)/gi;
const pathExempt = (text) => ABS_PATH.test(text.replace(REDIRECT, ' ').replace(PROGRAM_PATH, ' '));

// A filter clause that names only PIDs: `ProcessId=12 or ProcessId=14`, `$_.Id -eq 12`, `$_.Id -eq $target`
// (a variable is trusted here; one assigned from a listing is caught by the taint pass).
const pidOnly = (text) =>
  text.split(/\s+-?or\s+|\|\|/i).every((c) => /^\(?\s*(?:\$_\.)?(?:ProcessId|Id)\s*(?:=|-eq)\s*(?:\d+|\$\w+)\s*\)?$/i.test(c.trim()));

// The listing in this statement is limited to explicit PIDs: Get-Process -Id 12, ps -p 12,
// -Filter "ProcessId=12", Where-Object { $_.Id -eq 12 }.
function constrained(raw) {
  const filters = [...raw.matchAll(/-Filter\s+(["'])([\s\S]*?)\1/gi)].map((m) => m[2]);
  for (const m of raw.matchAll(/(?:Where-Object|\bwhere\b|\?)\s*(?:-FilterScript\s+)?\{([^{}]*)\}/gi)) filters.push(m[1]);
  const idArg = new RegExp(`${WORD}(?:Get-Process|gps|ps)\\b[^|;]*?\\s-(?:Id|Pid)\\s+[\\d$]`, 'i').test(raw) || /\bps\s+(?:-\S+\s+)*?-p\s*\d/.test(raw);
  return (idArg || filters.length > 0) && filters.every(pidOnly);
}

const selectorIn = (g) =>
  LISTING.test(g.s) ||
  DOTNET_LISTING.test(g.s) ||
  (CIM_CMD.test(g.s) && /Win32_Process\b/i.test(g.raw)) ||
  (WMIC_PROC.test(g.s) && !WMIC_KILL.test(g.raw));

function sinkIn(g) {
  let s = g.s;
  for (const re of LITERAL_KILLS) s = s.replace(re, ' ');
  return SINK.test(s) || INVOKE_TERMINATE.test(g.raw) || (WMIC_PROC.test(g.s) && WMIC_KILL.test(g.raw));
}

// Names a selector statement binds: $p = ..., p=$(...), for p in ..., foreach ($p in ...), read p.
function boundNames(s) {
  const names = [];
  const grab = (re) => {
    for (const m of s.matchAll(re)) names.push(m[1]);
  };
  grab(/\$(?:\w+:)?(\w+)\s*\+?=(?!=)/g);
  grab(/(?:^|[\s;&|(])(?:export\s+|local\s+|readonly\s+|declare\s+(?:-\w+\s+)*)?([A-Za-z_]\w*)=/g);
  grab(/\bfor\s+([A-Za-z_]\w*)\s+in\b/g);
  grab(/\bforeach\s*\(\s*\$(\w+)\s+in\b/gi);
  grab(/\bread\s+(?:-\w+\s+)*([A-Za-z_]\w*)/g);
  return names;
}

// Rules that need only the stage itself.
function direct(g) {
  const { raw, s } = g;
  if (STOP_BY_NAME.test(s)) return 'Stop-Process selects by name';
  if (KILL_BY_NAME.test(s)) return 'kill selects by name';
  if (TASKKILL.test(s)) {
    if (/(?:^|\s)(?:\/{1,2}|-)IM(?=[\s:]|$)/i.test(s)) return 'taskkill selects by image name';
    for (const m of raw.matchAll(/(?:^|\s)(?:\/{1,2}|-)FI\s+(?:"([^"]*)"|'([^']*)'|(\S+))/gi)) {
      if (!/^PID\s+eq\s+\d+$/i.test((m[1] ?? m[2] ?? m[3]).trim())) return 'taskkill selects by a filter';
    }
  }
  if (WMIC_PROC.test(s) && WMIC_KILL.test(raw)) {
    const clause = /\bwhere\b([\s\S]*?)\b(?:delete|call\s+terminate)\b/i.exec(raw)?.[1] ?? '';
    const flat = clause.replace(/["'()\s]/g, '');
    if (!/^processid=\d+(?:orprocessid=\d+)*$/i.test(flat) && !ABS_PATH.test(clause)) return 'wmic process kill selects by a where-clause';
  }
  const pk = PKILL.exec(s);
  if (pk) {
    const full = /\s-(?:[A-Za-z0-9]*f[A-Za-z0-9]*|-full)(?=\s|$)/.test(s);
    if (pk[1].toLowerCase() === 'killall' || !full || !pathExempt(raw)) return `${pk[1].toLowerCase()} selects by pattern`;
  }
  return null;
}

// ---- analysis -------------------------------------------------------------------------

function analyse(cmd, ps, depth) {
  if (depth > MAX_DEPTH) return null;
  const tainted = new Set();
  const sinkStmts = [];
  for (const st of scan(cmd, ps)) {
    const active = st.stages.filter((g) => !INERT.has(leadingBinary(g.s)));
    for (const g of active) {
      for (const b of wrapperBodies(g, ps)) {
        const inner = analyse(b.text, b.ps, depth + 1);
        if (inner) return inner;
      }
      const why = direct(g);
      if (why) return { why, text: fragment(g.raw) };
    }
    const selecting = active.some(selectorIn) && !constrained(st.raw) && !pathExempt(st.raw);
    const sinking = active.some(sinkIn);
    if (selecting && sinking) {
      return { why: 'a process listing not limited to explicit PIDs feeds a kill', text: fragment(st.raw) };
    }
    if (selecting) for (const name of boundNames(st.s)) tainted.add(name);
    if (sinking) sinkStmts.push(st);
  }
  for (const st of sinkStmts) {
    for (const name of tainted) {
      if (new RegExp(`\\$\\{?(?:\\w+:)?${name}\\b`).test(st.raw)) {
        return { why: `$${name} was assigned from a process listing not limited to explicit PIDs`, text: fragment(st.raw) };
      }
    }
  }
  return null;
}

const SAFE_FORM =
  'On a shared machine that can reach other sessions\' processes (a pytest sweep and a "director.py run" sweep both did, 2026-10-03).' +
  ' Kill by PID: list the matches first, for example' +
  ' Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like \'*<this checkout absolute path>*\' -and $_.ProcessId -ne $PID } | Select-Object ProcessId,CommandLine' +
  ' (bash: pgrep -af \'<this checkout absolute path>\'), read each command line, then Stop-Process -Id <pids> (or taskkill /PID <pid> /T /F, kill <pid>).' +
  ' A filter is accepted only when it contains this checkout\'s absolute path written out literally, not as a variable; a bare pattern never is.' +
  ' Exclude your own shell ($PID): its command line holds the filter text, so a text match also kills the probe that ran it.';

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const cmd = evt.tool_input?.command;
    const hit = typeof cmd === 'string' && cmd ? analyse(cmd, evt.tool_name === 'PowerShell', 0) : null;
    if (hit) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: `kill-guard: "${hit.text}" (${hit.why}). ${SAFE_FORM}`,
          },
        }),
      );
    }
  } catch {}
});
