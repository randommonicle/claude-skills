#!/usr/bin/env node
// PreToolUse hook, matcher: Bash|PowerShell, plus Read for secret files. Mechanises
// secrets-in-output at the one moment it can be mechanised: a command whose OUTPUT
// would carry a secret value is denied before it runs, and the reason hands the model
// the safe form (presence and length, names not values, keys not lines).
//
// Why deny and not ask. In a bypass-permissions session an "ask" is auto-approved and
// its reason is shown to nobody, and an unattended run is exactly where this slipped:
// on 18 September 2026 a Sonnet verification agent ran a bare `npx supabase status`
// and printed the local stack's keys; on 19 September the main session printed
// `${SUPABASE_ACCESS_TOKEN:-unset}` and `${SUPABASE_SERVICE_ROLE_KEY:-unset}` to learn
// whether they were set, and both VALUES (an account-wide personal access token and
// another project's service-role key) landed in the transcript (ICC LESSONS_LEARNED
// L-045). A deny reaches the model with the reason whatever the permission mode, and
// the rewrite is one line. The command set is kept narrow so the deny cannot train
// bypass: every rule names one shape that PRINTS a value, never one that only uses it
// (a curl header, an assignment, a presence test, a script that reads process.env).
//
// What this is and is not (cross-agent review, GPT via codex, 20 Sept 2026, two rounds,
// `exchange/REVIEW_secret-echo-guard_2026-09-20.md`). It is a guard against ROUTINE
// slips by an agent doing ordinary work, judged from the command string. It is not an
// exfiltration boundary: a command string cannot predict what a program prints, so a
// value copied into another variable and printed (`k=$KEY; echo $k`), any script file
// run by name (`bash phase.sh`, `node x.mjs`: its contents are never read, so even an
// `echo $KEY` inside one passes, measured 24 Sept 2026; only the inline wrappers listed
// below are analysed), a recursive grep over a folder holding a secret file
// (`grep -rn TOKEN .`: only a file named in the command counts), a secret under a name
// the classifier does not know, an encoding the reader set does not name, and an API
// response that returns a credential (the Supabase Management API's auth GET answers
// 243 fields including smtp_pass) all pass.
// The secrets-in-output skill is the control for those: print a named allowlist of
// fields, never a raw response, and dry-run the output shape on a dummy value first. A
// script written to batch work therefore reads no secrets; those stay visible commands.
//
// How a command is read. A scanner walks the string once with shell quoting rules
// (single quotes literal; double quotes and PowerShell @"..."@ expanding; backslash, or
// the backtick under the PowerShell tool, escaping; $(...), `...`, <(...) substitutions;
// ${...} braces) and yields statements split only at top-level newlines, `;`, `&&`
// and `||`, each with three views: the text, the EXPANSION view (literal text blanked,
// so a `'$X'` or `\$X` is not a reference), and the STRUCTURE view (all quoted text
// without a substitution blanked, so a `|` inside a commit message is not a pipe).
// Rules 1 and 2 read the expansion view; rules 3 to 6 read the structure view; names
// that sit inside quotes are read from the text.
//
// Rules:
//   1. A fallback or indirect expansion of a secret-named variable inside a print:
//      ${X:-word}, ${X-word}, ${X:=word}, ${X=word}, ${X:+...$...}, ${!v}, ${!v:-word}.
//   2. A print of a secret-named variable: echo, printf (not printf -v), the PowerShell
//      Write-*/Out-*/Format-* cmdlets, console.log/error/warn/info, process.stdout.write,
//      print(...), sys.stdout.write, carrying $X, ${X}, $env:X, ${env:X}, process.env.X,
//      process.env?.X, os.environ["X"], os.getenv("X") or GetEnvironmentVariable("X"); a
//      heredoc or here-string fed to a printing filter whose body expands one; a bare
//      PowerShell expression, string, here-string or pipeline that starts with one. Each
//      occurrence is judged on its own (`echo "${#X}:$X"` prints X) and inside a print
//      only ${#X}, ${X:+word} without a `$`, and $env:X.Length are safe; a printed string
//      that merely LOOKS like a test (`echo [ -n "$X"`) prints X. A print whose stdout
//      goes to a file, or to a hash/count consumer (sha256sum, wc, Measure-Object), is
//      not a print. Also `set -x`, `bash -x`/`-xc` tracing in a command that uses a secret
//      after it (`set +x` ends it): the trace prints the expanded command.
//   3. An environment listing in command position: printenv, env (options only), set,
//      export -p, declare -p/-x, typeset -p/-x, Get-ChildItem/gci/ls/dir Env:[\/],
//      [Environment]::GetEnvironmentVariables(), a read of /proc/*/environ, bare or with
//      a wildcard, or naming a secret-named variable (printenv X, Get-Item Env:X,
//      Get-Variable X, GetEnvironmentVariable("X"[, scope])), unless piped into a sink
//      that keeps names and drops values (cut -d= -f1 exactly, awk printing $1 only,
//      sed 's/=.*//', grep -o '^[^=]*', Select-Object Name alone, ForEach-Object { $_.Name })
//      with no tee before it.
//   4. A secret file written to the transcript in command position (cat, type, less,
//      more, head, tail, bat, Get-Content, gc, and the printing filters sed, awk, base64,
//      xxd, od, hexdump, jq, strings, cp to /dev/stdout; also via xargs or find -exec, or
//      `< file`): .env, .env.*, *.env, .envrc, *.pem, id_rsa/id_ed25519, *.key (not pub),
//      credentials(.json), service-account*.json, .npmrc, .netrc, .pgpass,
//      .git-credentials, .htpasswd; case-insensitive; .env.example, .sample, .template
//      and .dist pass. A grep/rg/Select-String/findstr over one without a quiet flag of
//      its own, read from its pipe segment and per tool (grep -c -l -L -q, rg -c -l -q,
//      --quiet, --count, ...; Select-String -Quiet; findstr none), not feeding a grep
//      that has one, and without a keys-only -o (^[^=]* or ending in =).
//      A reader counts only in the pipeline segment that names the file (after a pipe it
//      reads stdin); a substitution ending in a count consumer yields a number; a `\.env`
//      escaped inside a regex is a pattern, not a path (four ICC false positives, 20 Sept).
//      A grep's PATTERN is text whatever it contains (`grep -n "process.env" f.mjs`,
//      24 Sept): only a token proven to be the pattern is exempt, so a secret file as an
//      operand, an option's value, via xargs or `<`, or after an option the parser does
//      not know, still counts (grepPatternSpans).
//   5. A provider command that prints secret values, in command position or inside a
//      substitution that is itself printed: supabase status (the table and -o env both
//      print the stack's keys), supabase projects api-keys / secrets list, aws ssm
//      get-parameter(s) --with-decryption, aws secretsmanager get-secret-value, az
//      keyvault secret show, gcloud secrets versions access, vault kv get, op read / op
//      item get, doppler secrets, netlify env:list/get, heroku config, stripe config
//      --list; unless stdout is captured (a file redirect that is not undone by a later
//      >&2, an enclosing $(...) or backticks that are not printed), a names-only sink, a
//      --query that selects no Value/SecretString, or a publishable name after env:get.
//   6. curl -v/--verbose/--trace on a request carrying Authorization, apikey or x-api-key.
//   Wrappers: sudo, env VAR=x, sh/bash/zsh -c, pwsh/powershell -Command, cmd /c, eval,
//   Invoke-Expression/iex: the quoted string is analysed as a command of its own.
//   Read: the Read tool on a secret file (the same set as rule 4).
// Fail-open on script error: exit 0 with no output; the skill remains the control.

const SECRET_NAME =
  /(?:^|_)(?:KEYS?|TOKENS?|SECRETS?|PASS|PAT|SK|PK|CREDENTIALS?|CREDS|PRIVATE|AUTH|COOKIE|SESSION|DSN|WEBHOOK|SIGNING|SERVICE_ROLE)(?:_|$)|PASSWORD|PASSWD|PASSPHRASE|SECRET|(?:DATABASE|DB)_URL$|CONN(?:ECTION)?_STR(?:ING)?$/i;
const PUBLISHABLE_NAME = /(?:^|_)(?:PUBLIC|PUBLISHABLE|ANON|PUB)(?:_|$)|(?:^|_)(?:SOCK|SOCKET|PID|HASH|COUNT|SIZE)$/i;
const NAME = '[A-Za-z_][A-Za-z0-9_]*';

const isSecretName = (name) => SECRET_NAME.test(name) && !PUBLISHABLE_NAME.test(name);

// ---------------------------------------------------------------------------
// The scanner: statements with region maps.
// ---------------------------------------------------------------------------

// Walks the command once. Returns statements, each { text, lit, dq, sub, start } where
// lit[i] = the char is literal (single-quoted, ANSI-C, or escaped), dq[i] = the char is
// inside an expanding string, sub[i] = substitution depth at the char ($( `` <( >( ).
// Splits at top-level `\n`, `;`, `&&`, `||` only. `ps` selects PowerShell escaping
// (backtick) and @"..."@ here-strings; otherwise bash rules.
function scan(cmd, ps) {
  const stmts = [];
  let text = '', lit = [], dq = [], sub = [];
  let inS = false, inD = false, here = false, esc = false, tick = false;
  let depth = 0, brace = 0;
  const push = () => {
    if (text.trim()) {
      const lead = text.length - text.trimStart().length;
      stmts.push({ text: text.trim(), lit: lit.slice(lead, lead + text.trim().length), dq: dq.slice(lead, lead + text.trim().length), sub: sub.slice(lead, lead + text.trim().length) });
    }
    text = ''; lit = []; dq = []; sub = [];
  };
  const emit = (c, l, d) => { text += c; lit.push(l ? 1 : 0); dq.push(d ? 1 : 0); sub.push(depth + (tick ? 1 : 0)); };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i], n = cmd[i + 1];
    if (esc) { emit(c, true, inD || here); esc = false; continue; }
    if (inS) { if (c === "'") { inS = false; emit(c, false, false); } else emit(c, true, false); continue; }
    if (!ps && c === '\\') { emit(c, false, inD || here); esc = true; continue; }
    if (ps && c === '`') { emit(c, false, inD || here); esc = true; continue; }
    if (here) { if (c === '"' && n === '@' && (i === 0 || cmd[i - 1] === '\n')) { emit(c, false, false); emit(n, false, false); i++; here = false; } else emit(c, false, true); continue; }
    if (ps && c === '@' && n === '"' && (i === 0 || /[\s=(|,]/.test(cmd[i - 1]))) { emit(c, false, false); emit(n, false, false); i++; here = true; continue; }
    if (c === '"') { inD = !inD; emit(c, false, false); continue; }
    if (c === "'" && !inD) { inS = true; emit(c, false, false); continue; }
    if (!ps && c === '`' && !inD) { tick = !tick; emit(c, false, false); continue; }
    if (!ps && c === '`' && inD) { tick = !tick; emit(c, false, true); continue; }
    if (c === '$' && n === '(') { depth++; emit(c, false, inD); emit(n, false, inD); i++; continue; }
    if ((c === '<' || c === '>') && n === '(' && !inD) { depth++; emit(c, false, false); emit(n, false, false); i++; continue; }
    if (c === '$' && n === '{') { emit(c, false, inD); emit(n, false, inD); brace++; i++; continue; }
    if (c === '}' && brace > 0) { brace--; emit(c, false, inD); continue; }
    if (c === ')' && depth > 0) { emit(c, false, inD); depth--; continue; }
    if (!inD && depth === 0 && !tick && brace === 0) {
      if (c === '\n' || c === ';') { push(); continue; }
      if ((c === '&' || c === '|') && n === c) { push(); i++; continue; }
    }
    emit(c, false, inD);
  }
  push();
  return stmts;
}

// The expansion view: literal chars blanked (quotes kept, so positions hold).
const expansionView = (s) => [...s.text].map((c, i) => (s.lit[i] ? ' ' : c)).join('');
// The top-level view: the structure view with substitution bodies blanked too, so a
// pipe or redirect inside `$(...)` is not this statement's pipe or redirect.
const topView = (s, structural) => [...structural].map((c, i) => (s.sub[i] ? ' ' : c)).join('');
// The structure view: literal chars and quoted text without a substitution blanked.
function structureView(s) {
  const out = [...s.text];
  for (let i = 0; i < out.length; i++) {
    if (s.lit[i]) out[i] = ' ';
    else if (s.dq[i] && !s.sub[i]) out[i] = ' ';
  }
  return out.join('');
}

// Heredoc bodies fed to something other than a printing filter, or written to a file,
// are text (a commit message that mentions `supabase status` must not fire rule 5).
// The printing forms are checked by heredocLeak() over the raw command.
function stripHeredocBodies(cmd) {
  return cmd.replace(/^([^\n]*<<-?\s*['"]?(\w+)['"]?[^\n]*)\n[\s\S]*?\n\2[ \t]*(?=\n|$)/gm, '$1');
}

const WRAPPERS = new Set(['sudo', 'env', 'command', 'time', 'nice', 'exec', 'npx', 'xargs', 'builtin']);
function leadingBinary(text) {
  for (const token of text.trim().split(/\s+/)) {
    if (/^\w+=/.test(token)) continue;
    const bin = token.replace(/^.*[\\/]/, '').replace(/\.exe$/i, '').toLowerCase();
    if (WRAPPERS.has(bin)) continue;
    return bin;
  }
  return '';
}

// Where does this statement's stdout go, reading its redirects left to right in the
// structure view: 'file' (captured), 'stderr' (>&2, the transcript sees it), 'pipe'
// (the consumer decides), or '' (the transcript).
function stdoutTarget(structural) {
  let target = '';
  for (const m of structural.matchAll(/(?:^|[^\w&])(?:(\d)?(>>?|>\|)|(&>))\s*(\S+)/g)) {
    const fd = m[1];
    if (fd && fd !== '1') continue; // 2> and friends do not move stdout
    const dest = m[4];
    if (/^&2$/.test(dest) || /^\/dev\/(?:stdout|stderr|tty|fd\/[12])$/.test(dest) || /^\/proc\/self\/fd\/[12]$/.test(dest)) target = 'stderr';
    else if (/^&1$/.test(dest)) continue;
    else target = 'file';
  }
  if (!target && /\|/.test(structural.replace(/\|\|/g, '  '))) target = 'pipe';
  return target;
}

// Consumers that print a digest or a count, never the input.
const SAFE_CONSUMERS = /^(?:sha\d*sum|shasum|md5sum|b2sum|cksum|wc|Measure-Object|measure|Get-FileHash|openssl\s+dgst|true|:|\s*>)/i;
// Sinks that keep names and drop values. Field-exact.
const NAMES_ONLY_CORE =
  `(?:cut\\s+-d\\s*['"]?=['"]?\\s*-f\\s*1(?![-,0-9])|awk\\s+-F\\s*['"]?=['"]?\\s+['"]\\{\\s*print\\s+\\$1\\s*\\}['"]|sed\\s+(?:-[nE]\\s+)*['"]s\\/=\\.\\*\\/\\/g?['"]|grep\\s+-o[a-zA-Z]*\\s+['"]\\^\\[\\^=\\]\\*['"]|(?:Select-Object|select)\\s+(?:-ExpandProperty\\s+)?Name(?!\\s*,)\\b|ForEach-Object\\s+(?:\\{\\s*\\$_\\.Name\\s*\\}|-MemberName\\s+Name\\b|Name\\b)|%\\s*(?:\\{\\s*\\$_\\.Name\\s*\\}|Name\\b))`;
const NAMES_ONLY_SINK = new RegExp(`\\|\\s*${NAMES_ONLY_CORE}`, 'i');
// The same projection as the command itself: `cut -d= -f1 .env` is the prescribed form.
const NAMES_ONLY_COMMAND = new RegExp(`^(?:\\w+=\\S+\\s+)*${NAMES_ONLY_CORE}`, 'i');
// The pipeline segment after `from`: what the consumer is, and whether it keeps the
// value out of the transcript.
function consumerKeepsSecret(text, structural, from) {
  const rest = structural.slice(from);
  const pipe = rest.search(/\|(?!\|)/);
  if (pipe < 0) return false;
  const after = text.slice(from + pipe + 1).trimStart();
  if (SAFE_CONSUMERS.test(after)) return true;
  const m = NAMES_ONLY_SINK.exec(text.slice(from));
  if (m && !/\btee\b/.test(text.slice(from, from + m.index))) return true;
  return false;
}

// ---------------------------------------------------------------------------
// References and safe uses, per occurrence.
// ---------------------------------------------------------------------------

const REF = new RegExp(
  `\\$\\{env:(${NAME})\\}|\\$\\{!?(${NAME})|\\$env:(${NAME})|\\$(${NAME})\\b|process\\.env\\??\\.(${NAME})|process\\.env\\??\\.?\\[["'](${NAME})["']\\]|os\\.environ(?:\\.get\\(|\\[)["'](${NAME})["']|os\\.getenv\\(["'](${NAME})["']|GetEnvironmentVariable\\(\\s*["'](${NAME})["']`,
  'gi',
);
function references(text) {
  const refs = [];
  for (const m of text.matchAll(REF)) {
    const name = m.slice(1).find(Boolean);
    if (!name || name.toLowerCase() === 'env') continue;
    refs.push({ name, index: m.index, end: m.index + m[0].length, text: m[0] });
  }
  return refs;
}

// The `}` matching the `${` that opens at `open`.
function closingBrace(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return i;
  }
  return -1;
}

// Inside a PRINT, only these forms keep the value out: ${#X} (never a reference at all),
// ${X:+word} whose word carries no expansion, and $env:X.Length.
function printedOccurrenceSafe(text, ref) {
  const after = text.slice(ref.end, ref.end + 12);
  if (/^\}?\.Length\b/.test(after)) return true;
  if (ref.text.startsWith('${') && /^:\+/.test(after)) {
    const close = closingBrace(text, ref.index + 1);
    const word = close < 0 ? text.slice(ref.end + 2) : text.slice(ref.end + 2, close);
    return !/[$`]/.test(word);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Printers and their spans.
// ---------------------------------------------------------------------------

const SHELL_PRINTER = /(?:^|[\s;&|(])(echo|printf(?!\s+-v\b)|Write-Output|Write-Host|Write-Verbose|Write-Debug|Write-Information|Write-Warning|Write-Error|Out-String|Out-Host|Out-Default|Format-List|Format-Table|Format-Wide|Format-Custom|fl|ft)(?![A-Za-z0-9_-])/gi;
const CALL_PRINTER = /(?:console\.(?:log|error|warn|info|debug|table)|process\.(?:stdout|stderr)\.write|sys\.(?:stdout|stderr)\.write|print|System\.out\.print(?:ln)?|fmt\.Print(?:ln|f)?)\s*\(/g;
const PRINTING_FILTERS = new Set(['cat', 'tee', 'base64', 'base32', 'od', 'xxd', 'hexdump', 'rev', 'tr', 'fold', 'sed', 'awk', 'cut', 'grep', 'strings', 'jq', 'head', 'tail', 'less', 'more', 'uniq', 'sort', 'type', 'bat', 'get-content', 'gc']);

// The matching `)` of a call, skipping string literals inside the code.
function callEnd(text, start) {
  let depth = 1, q = null;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return i;
  }
  return text.length;
}

// Printed spans of a statement: { text, code, literal }. `code` spans come from a call
// printer inside a script string and only code-style references count in them unless
// the script string expands (`literal` false: double-quoted or bare, so the shell
// substitutes `$X` before the interpreter runs).
function printSpans(s, expansion, structural, top) {
  const spans = [];
  for (const m of structural.matchAll(SHELL_PRINTER)) {
    const at = m.index + (m[0].length - m[1].length);
    if (s.sub[at]) continue; // a printer inside $(...) is captured, not printed
    const target = stdoutTarget(top.slice(at));
    if (target === 'file') continue;
    if (target === 'pipe' && consumerKeepsSecret(s.text, top, at)) continue;
    const rest = expansion.slice(at + m[1].length);
    const pipe = top.slice(at + m[1].length).search(/\|(?!\|)/);
    spans.push({ text: pipe >= 0 ? rest.slice(0, pipe) : rest, code: false });
  }
  for (const m of s.text.matchAll(CALL_PRINTER)) {
    const start = m.index + m[0].length;
    const end = callEnd(s.text, start);
    spans.push({ text: s.text.slice(start, end), code: true, literal: !!s.lit[m.index] });
  }
  const here = /<<<\s*(.*)$/.exec(expansion);
  if (here && PRINTING_FILTERS.has(leadingBinary(structural)) && stdoutTarget(top) !== 'file') spans.push({ text: here[1], code: false });
  if (/^\s*(?:\$\{?env:[A-Za-z_]\w*\}?|@?"[^"]*"|@"[\s\S]*"@)(?:\s*\|.*|\s*\.\w+.*)?$/i.test(expansion) && !/^\s*\$\{?env:\w+\}?\s*=[^=]/i.test(expansion)) {
    if (!(stdoutTarget(top) === 'pipe' && consumerKeepsSecret(s.text, top, 0))) spans.push({ text: expansion, code: false });
  }
  return spans;
}

// ---------------------------------------------------------------------------
// Listings, files, providers.
// ---------------------------------------------------------------------------

const ENV_WORDS = /(?:^|[\s;&|(])(printenv|env|set|export\s+-p|declare\s+-[px]|typeset\s+-[px]|Get-Variable|gv|\[(?:System\.)?Environment\]::GetEnvironmentVariables?\()(?![A-Za-z0-9_:-])/i;
const ENV_PS = /(?:^|[\s;&|(])((?:Get-ChildItem|gci|ls|dir|Get-Item|gi)\s+Env:[\\/]?)/i;
const PROC_ENVIRON = /\/proc\/(?:self|\d+|\$\$)\/environ\b/;
const COMMAND_POSITION = /(?:^|[|(;&`]|\b(?:sudo|command|nice|time|exec|xargs)|-exec|\/c|-c\s+["']?)\s*$/;

// The token after a listing command: '' for bare, '*' for a wildcard, else a name; null
// when the word is not a listing here (`set -e`, `env VAR=x cmd`, `-o env`).
function listingTarget(structural, raw) {
  const w = ENV_WORDS.exec(structural);
  const p = ENV_PS.exec(structural);
  const m = w ?? p;
  if (!m) return null;
  const before = structural.slice(0, m.index + (m[0].length - m[1].length));
  if (!COMMAND_POSITION.test(before)) return null;
  const word = m[1].toLowerCase();
  const afterAt = m.index + m[0].length;
  const after = structural.slice(afterAt);
  if (/GetEnvironmentVariable\(/i.test(m[1])) {
    if (/GetEnvironmentVariables\(/i.test(m[1])) return '';
    return (/^\s*["']([^"']+)["']/.exec(raw.slice(afterAt))?.[1]) ?? '';
  }
  if (word === 'set') return /^\s*(?:$|\||\))/.test(after) ? '' : null;
  let tokens = after.trim().split(/\s+/).filter(Boolean);
  const stop = tokens.findIndex((t) => t.startsWith('|') || t.startsWith(')'));
  if (stop >= 0) tokens = tokens.slice(0, stop);
  while (tokens.length && /^-/.test(tokens[0]) && !/^-(?:Name|ValueOnly)$/i.test(tokens[0])) tokens.shift();
  if (word === 'env' && tokens.length) return null;
  if (word === 'get-variable' || word === 'gv') {
    const nameOpt = /-Name\s+(\S+)/i.exec(after);
    return ((nameOpt ? nameOpt[1] : tokens[0]) ?? '').replace(/^["']|["']$/g, '');
  }
  if (!tokens.length) return '';
  const tok = tokens[0].replace(/^["']|["']$/g, '');
  return /[*?]/.test(tok) ? '*' : tok;
}

const SECRET_FILE = /(?:^|[\\/])(?:\.env(?:\.[\w.-]+)?|[\w.-]*\.env|\.envrc|[\w.-]*\.pem|id_(?:rsa|ed25519|ecdsa|dsa)|[\w.-]*\.key|\.?credentials(?:\.json)?|service-account[\w.-]*\.json|\.npmrc|\.netrc|\.pgpass|\.git-credentials|\.htpasswd)$/i;
const SECRET_FILE_IN_CMD = /(?:^|[\s'"=<\\/])((?:[\w.~:-]*[\\/])*(?:\.env(?:\.[\w.-]+)?|[\w.-]*\.env|\.envrc|[\w.-]*\.pem|id_(?:rsa|ed25519|ecdsa|dsa)|[\w.-]*\.key|\.?credentials(?:\.json)?|service-account[\w.-]*\.json|\.npmrc|\.netrc|\.pgpass|\.git-credentials|\.htpasswd))(?=$|[\s'";|)>])/i;
const DOC_FILE = /\.env(?:\.[\w.-]+)?\.(?:example|sample|template|dist)$|(?:^|[\\/])[\w.-]*pub[\w.-]*\.key$/i;
function secretFileIn(text, exempt = []) {
  // A backslash before the name is a Windows separator after a path component
  // (`C:\...\icc-site\.env`) but a regex escape after anything else (`"env\|ENV\|\.env"`,
  // ICC 20 Sept 2026): only the former names a file. `exempt` holds the spans of grep
  // patterns (grepPatternSpans), which are text whatever they contain.
  const re = new RegExp(SECRET_FILE_IN_CMD.source, 'gi');
  for (const m of text.matchAll(re)) {
    if (DOC_FILE.test(m[1])) continue;
    const index = m.index + (m[0].length - m[1].length);
    if (text[index - 1] === '\\' && !/[\w:.~]/.test(text[index - 2] || '')) continue;
    if (exempt.some(([from, to]) => index >= from && index + m[1].length <= to)) continue;
    return { name: m[1], index };
  }
  return null;
}
const READER_WORDS = new Set(['cat', 'type', 'less', 'more', 'head', 'tail', 'bat', 'get-content', 'gc', 'strings', 'sed', 'awk', 'base64', 'base32', 'xxd', 'od', 'hexdump', 'jq', 'tee', 'rev', 'fold', 'tr', 'cut', 'uniq', 'sort', 'nl', 'tac', 'python', 'python3', 'perl', 'ruby']);
const READERS = /(?:^|[\s;&|(])(cat|type|less|more|head|tail|bat|Get-Content|gc|strings|sed|awk|base64|base32|xxd|od|hexdump|jq|tee|rev|fold|tr|cut|uniq|sort|nl|tac)\s/i;
const GREP_WORDS = new Set(['grep', 'rg', 'egrep', 'fgrep', 'select-string', 'sls', 'findstr']);
const GREPS = /(?:^|[\s;&|(])(grep|rg|egrep|fgrep|Select-String|sls|findstr)\s/i;
// Quiet flags, read from the grep's OWN pipeline segment and per tool (24 Sept 2026). Read
// statement-wide, a `head -c 500` after the pipe made `grep KEY .env` quiet; `rg -L` follows
// symlinks rather than listing files; and Select-String parameters such as -AllMatches,
// -LiteralPath or -NotMatch are words, not clusters of short flags. findstr has none here.
const GREP_QUIET = {
  grep: /\s-[a-zA-Z]*[cLlq][a-zA-Z]*\b|\s--(?:quiet|silent|count|files-with-matches|files-without-match|files-with-match)\b/,
  rg: /\s-[a-zA-Z]*[clq][a-zA-Z]*\b|\s--(?:quiet|count|count-matches|files-with-matches|files-without-match)\b/,
  sls: /\s-q(?:u(?:i(?:e(?:t)?)?)?)?(?=\s|$|:(?!\s*\$false))/i,
  findstr: /(?!)/,
};
const grepTool = (word) => ({ rg: 'rg', findstr: 'findstr', 'select-string': 'sls', sls: 'sls' })[word.toLowerCase()] ?? 'grep';
function grepQuiet(structural, at, word) {
  const end = structural.slice(at).search(/\|(?!\|)/);
  return GREP_QUIET[grepTool(word)].test(end < 0 ? structural.slice(at) : structural.slice(at, at + end));
}
// A grep whose output feeds a quiet grep puts only that grep's count or names on screen.
function feedsQuietGrep(structural, at) {
  const pipe = structural.slice(at).search(/\|(?!\|)/);
  if (pipe < 0) return false;
  const next = at + pipe + 1;
  const m = /^\s*(grep|rg|egrep|fgrep|Select-String|sls|findstr)\s/i.exec(structural.slice(next));
  return !!m && grepQuiet(structural, next + m[0].length - m[1].length - 1, m[1]);
}
function grepKeysOnly(text) {
  if (!/\s-[a-zA-Z]*o[a-zA-Z]*\b|\s--only-matching\b/.test(text)) return false;
  const pat = /(?:^|\s)(?:-[a-zA-Z]+\s+)*['"]([^'"]*)['"]/.exec(text.replace(/(?:^|\s)-[a-zA-Z]+\b/g, ' '))?.[1];
  return !!pat && /^(?:\^\[\^=\]\*|\^[\[\]A-Za-z0-9_*+?.\\-]*=)$/.test(pat);
}
function readerInPosition(structural, m, lead, words) {
  const before = structural.slice(0, m.index + (m[0].length - m[1].length - 1));
  return words.has(lead) || /^\s*$/.test(before) || COMMAND_POSITION.test(before);
}

// Which argument of a grep is its PATTERN (24 Sept 2026). A secret-file name inside the
// pattern is text, not a file: `grep -n "process\.env" f.mjs` was denied as a read of `.env`
// in a folder named `process`, and `"process.env"` as a file of that name. Only a token
// proven to be the pattern is exempt from the scan: an -e/--regexp, /C: or -Pattern value,
// else the first operand. An option these tables do not know ends the proof, and every
// token stays a possible file, as before. A flag wrongly listed as valued would skip the
// real pattern and exempt the file after it, so `valued` and `longValued` hold only what
// each tool's own --help gives an argument (GNU grep 3.0, ripgrep 14.1.1, checked 24 Sept
// 2026); a valued option wrongly listed as a flag costs a false positive. grep's -NUM
// context shorthand is a run of digit flags.
const GREP_OPTIONS = {
  grep: {
    flags: 'abcEFGHhIiLlnoPqRrsTUuVvwxyZz0123456789', valued: 'ABCDdefm',
    long: /^--(?:basic-regexp|binary|byte-offset|colou?r|count|dereference-recursive|extended-regexp|files-with-matches|files-without-match|fixed-strings|ignore-case|initial-tab|invert-match|line-buffered|line-number|line-regexp|no-filename|no-ignore-case|no-messages|null|null-data|only-matching|perl-regexp|quiet|recursive|silent|text|unix-byte-offsets|with-filename|word-regexp)$/,
    longValued: /^--(?:after-context|before-context|binary-files|context|devices|directories|exclude|exclude-dir|exclude-from|include|label|max-count)$/,
  },
  rg: {
    flags: 'abcFHhIiLlNnoPpqSsUuVvwxz.0', valued: 'ABCdEefgjMmrTt',
    long: /^--(?:byte-offset|case-sensitive|column|count|count-matches|files-with-matches|files-without-match|fixed-strings|follow|heading|hidden|ignore-case|invert-match|json|line-number|line-regexp|multiline|no-filename|no-heading|no-ignore|no-line-number|no-messages|null|only-matching|pcre2|pretty|quiet|search-zip|smart-case|stats|text|trim|unrestricted|vimgrep|with-filename|word-regexp)$/,
    longValued: /^--(?:after-context|before-context|colors?|context|context-separator|encoding|engine|glob|iglob|ignore-file|max-columns|max-count|max-depth|max-filesize|path-separator|pre|pre-glob|replace|sortr?|threads|type|type-add|type-not)$/,
  },
};
// Select-String parameters and the common ones seen with it; any unique prefix binds.
const SLS_VALUED = ['pattern', 'path', 'literalpath', 'pspath', 'lp', 'include', 'exclude', 'encoding', 'context', 'culture', 'inputobject', 'erroraction', 'ea', 'warningaction', 'wa', 'outvariable', 'ov'];
const SLS_SWITCHES = ['simplematch', 'casesensitive', 'notmatch', 'allmatches', 'list', 'quiet', 'raw', 'noemphasis', 'verbose', 'vb', 'debug', 'db'];
const part = (t, k) => ({ start: t.start + k, end: t.end, hasSub: t.hasSub });
// The words after a command, split where the shell splits them (whitespace outside quotes
// and substitutions), up to this segment's pipe, redirect or closing parenthesis.
function argTokens(s, from) {
  const base = s.sub[from - 1] ?? 0;
  const tokens = [];
  let start = -1, i = from;
  const close = () => {
    if (start >= 0) tokens.push({ start, end: i, raw: s.text.slice(start, i), hasSub: s.sub.slice(start, i).some((d) => d > base) });
    start = -1;
  };
  for (; i < s.text.length; i++) {
    const bare = !s.lit[i] && !s.dq[i] && s.sub[i] === base;
    if (bare && /[|;&<>)]/.test(s.text[i])) break;
    if (bare && /\s/.test(s.text[i])) close();
    else if (start < 0) start = i;
  }
  close();
  return tokens;
}
function grepPattern(tokens, table) {
  const explicit = [], operands = [];
  let fromFile = false, options = true;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i], a = t.raw;
    if (!options || a === '-' || !a.startsWith('-')) { operands.push(t); continue; }
    if (a === '--') { options = false; continue; }
    if (a.startsWith('--')) {
      const eq = a.indexOf('='), name = eq < 0 ? a : a.slice(0, eq);
      if (name === '--regexp') { explicit.push(eq < 0 ? tokens[++i] : part(t, eq + 1)); continue; }
      if (name === '--file') { fromFile = true; if (eq < 0) i++; continue; }
      if (eq >= 0 || table.long.test(name)) continue;
      if (table.longValued.test(name)) { i++; continue; }
      return null;
    }
    for (let j = 1; j < a.length; j++) {
      if (table.valued.includes(a[j])) {
        const attached = j + 1 < a.length;
        if (a[j] === 'e') explicit.push(attached ? part(t, j + 1) : tokens[i + 1]);
        if (a[j] === 'f') fromFile = true;
        if (!attached) i++;
        break;
      }
      if (!table.flags.includes(a[j])) return null;
    }
  }
  return explicit.length || fromFile ? explicit : operands.slice(0, 1);
}
function findstrPattern(tokens) {
  const explicit = [], operands = [];
  let fromFile = false;
  for (const t of tokens) {
    const o = /^\/([a-z]+)(:?)/i.exec(t.raw);
    if (!o) { operands.push(t); continue; }
    const name = o[1].toLowerCase();
    if (name === 'c' && o[2]) explicit.push(part(t, o[0].length));
    else if (name === 'g') fromFile = true;
    else if (!/^(?:[abdefilmnoprsvx]|off(?:line)?)$/.test(name)) return null;
  }
  return explicit.length || fromFile ? explicit : operands.slice(0, 1);
}
function slsPattern(tokens) {
  const explicit = [], operands = [];
  const names = [...SLS_VALUED, ...SLS_SWITCHES];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const o = /^-([a-z]+)(:?)/i.exec(t.raw);
    if (!o) { operands.push(t); continue; }
    const p = o[1].toLowerCase();
    const hit = names.includes(p) ? [p] : names.filter((n) => n.startsWith(p));
    if (hit.length !== 1) return null;
    if (SLS_SWITCHES.includes(hit[0])) continue;
    const value = o[2] ? part(t, o[0].length) : tokens[++i];
    if (hit[0] === 'pattern') explicit.push(value);
  }
  return explicit.length ? explicit : operands.slice(0, 1);
}
function grepPatternSpans(s, structural) {
  const spans = [];
  for (const m of structural.matchAll(new RegExp(GREPS.source, 'gi'))) {
    const at = m.index + (m[0].length - m[1].length - 1);
    // Strictly in command position: a grep word that is another command's argument
    // (`grep -n rg .env`) must not donate an exemption to the file after it.
    const before = structural.slice(0, at);
    if (!/^\s*$/.test(before) && !COMMAND_POSITION.test(before)) continue;
    const tool = grepTool(m[1]);
    const args = argTokens(s, at + m[1].length);
    const found = tool === 'findstr' ? findstrPattern(args) : tool === 'sls' ? slsPattern(args) : grepPattern(args, GREP_OPTIONS[tool]);
    for (const t of found ?? []) if (t && !t.hasSub) spans.push([t.start, t.end]);
  }
  return spans;
}

const PROVIDER = /(?:^|[\s;&|(`])((?:\w+=\S+\s+)*(?:sudo\s+|npx\s+)?(?:supabase\s+(?:status|projects\s+api-keys|secrets\s+list)|aws\s+(?:ssm\s+get-parameters?(?:-by-path)?\b(?=.*--with-decryption)|secretsmanager\s+get-secret-value)|az\s+keyvault\s+secret\s+show|gcloud\s+secrets\s+versions\s+access|vault\s+kv\s+get|op\s+(?:read|item\s+get)|doppler\s+secrets\b|netlify\s+env:(?:list|get)|heroku\s+config(?::get)?\b|stripe\s+config\s+--list))/i;
// A projection or a publishable name keeps the value out.
function providerSafeProjection(text) {
  const q = /--query\s+['"]?([^'"\s]+)/i.exec(text);
  if (q && !/Value|Secret/i.test(q[1])) return true;
  if (/--only-names\b/.test(text)) return true;
  const get = /(?:env:get|config:get|secrets\s+get)\s+(\S+)/i.exec(text);
  if (get && !isSecretName(get[1].replace(/^["']|["']$/g, ''))) return true;
  return false;
}

// Rewrite `X=$(...)` style capture: a command inside a substitution that is NOT printed
// is captured. `printedSubstitution` says whether the substitution at `index` is inside a
// printed span at depth 0.
function substitutionIsPrinted(s, structural, top, index) {
  if (!s.sub[index]) return false;
  // A process substitution `<(...)` feeds the outer command; a printing filter prints it.
  const opener = structural.lastIndexOf('<(', index);
  if (opener >= 0 && !structural.slice(opener, index).includes(')') && PRINTING_FILTERS.has(leadingBinary(structural)) && stdoutTarget(top) !== 'file') return true;
  for (const m of structural.matchAll(SHELL_PRINTER)) {
    const at = m.index + (m[0].length - m[1].length);
    if (s.sub[at]) continue;
    const pipe = top.slice(at).search(/\|(?!\|)/);
    const end = pipe >= 0 ? at + pipe : structural.length;
    if (index > at && index < end && stdoutTarget(top.slice(at)) !== 'file') return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Rules.
// ---------------------------------------------------------------------------

function fragment(text) {
  const one = text.replace(/\s+/g, ' ').trim();
  return one.length > 100 ? `${one.slice(0, 100)} ...` : one;
}

// Rule 2, heredoc form: a printing filter fed a heredoc whose tag is unquoted (so the
// body expands), with stdout reaching the transcript.
function heredocLeak(cmd, ps) {
  for (const m of cmd.matchAll(/^([^\n]*?)<<-?\s*(['"]?)(\w+)\2([^\n]*)$/gm)) {
    if (m[2]) continue;
    if (!PRINTING_FILTERS.has(leadingBinary(m[1]))) continue;
    const head = scan(m[1] + m[4], ps)[0];
    if (head && stdoutTarget(structureView(head)) === 'file') continue;
    const bodyStart = m.index + m[0].length;
    const end = cmd.indexOf(`\n${m[3]}`, bodyStart);
    const body = cmd.slice(bodyStart, end < 0 ? cmd.length : end).replace(/\\\$/g, '  ');
    for (const ref of references(body)) {
      if (isSecretName(ref.name) && !printedOccurrenceSafe(body, ref)) return { rule: 2, what: `the heredoc prints ${ref.name}`, stmt: m[0] };
    }
  }
  return null;
}

// Wrappers whose quoted argument is a command: analysed on their own.
const WRAPPER = /^(?:(?:sudo|command|exec|nice|time)\s+|env\s+(?:-\S+\s+|\w+=\S*\s+)*)*(?:(?:(?:ba|z|k|da)?sh)\s+((?:-\S+\s+)*)-?\S*c\S*\s+|pwsh\s+-c(?:ommand)?\s+|powershell(?:\.exe)?\s+(?:-\S+\s+)*-c(?:ommand)?\s+|cmd(?:\.exe)?\s+\/[ck]\s+|eval\s+|Invoke-Expression\s+|iex\s+)(["'])([\s\S]*)\2\s*$/i;

function statementLeak(s, ps, depth) {
  const text = s.text;
  const expansion = expansionView(s);
  const structural = structureView(s);
  const lead = leadingBinary(structural);
  const wrap = WRAPPER.exec(text);
  if (wrap && depth < 2) {
    const head = text.slice(0, wrap.index + text.indexOf(wrap[2]));
    const tracing = /(?:^|\s)-[a-wyz]*x[a-z]*\b|\s-o\s+xtrace\b/.test(head) && /\b(?:ba|z|k|da)?sh\b/.test(head);
    if (tracing && references(wrap[3]).some((r) => isSecretName(r.name))) return { rule: 2, what: 'shell tracing prints the expanded command, secret included', stmt: text };
    const innerPs = ps || /^(?:pwsh|powershell)|Invoke-Expression|iex/i.test(head);
    return analyse(wrap[3], innerPs, depth + 1);
  }
  const top = topView(s, structural);
  const spans = printSpans(s, expansion, structural, top);
  const out = stdoutTarget(top);
  // Whether output produced at `at` reaches the transcript: inside a substitution only
  // when that substitution is printed; at the top level unless captured or consumed safely.
  // Inside a substitution, a pipeline that ends in a count or digest consumer
  // (`$(tr -cd '\r' < .env | wc -c)`) yields a number, not the file (ICC, 20 Sept 2026).
  const printed = (at) => (s.sub[at] ? (substitutionIsPrinted(s, structural, top, at) && !consumerKeepsSecret(text, structural, at)) : (out !== 'file' && !(out === 'pipe' && consumerKeepsSecret(text, top, at))));
  // Rule 5: provider commands.
  for (const m of structural.matchAll(new RegExp(PROVIDER.source, 'gi'))) {
    const at = m.index + (m[0].length - m[1].length);
    const positioned = COMMAND_POSITION.test(structural.slice(0, at)) || /^\s*$/.test(structural.slice(0, at));
    if (!positioned) continue;
    if (!printed(at)) continue;
    if (providerSafeProjection(text.slice(at))) continue;
    if (/supabase\s+status/i.test(m[1]) && /\|\s*grep\s+-v[a-zA-Z]*\s+\S*(?:key|secret|token)/i.test(text)) continue;
    return { rule: 5, what: `${fragment(m[1])} prints secret values`, stmt: text };
  }
  // Rule 6: verbose curl carrying a credential header.
  if (lead === 'curl' && /(?:^|\s)(?:-[a-zA-Z]*v[a-zA-Z]*|--verbose|--trace(?:-ascii)?)\b/.test(structural) && /Authorization|apikey|x-api-key/i.test(text)) {
    return { rule: 6, what: 'curl -v prints the Authorization header', stmt: text };
  }
  // Rule 4: a secret file written to the transcript. A grep's pattern is text, not a file.
  const file = secretFileIn(text, grepPatternSpans(s, structural));
  if (file && !NAMES_ONLY_COMMAND.test(text)) {
    const cp = /(?:^|[\s;&|(])(cp|mv|install)\s[^|;]*\/dev\/(?:stdout|stderr|tty)\b/i.exec(structural);
    if (cp) return { rule: 4, what: `the whole of ${file.name} would print`, stmt: text };
    // A reader counts only when the secret file is an operand of ITS pipeline segment: a
    // reader after a pipe (`... .env | tr -d '='`, `node --env-file=.env x | sed | head`)
    // reads stdin, not the file (ICC, 20 September 2026: two false positives).
    for (const r of structural.matchAll(new RegExp(READERS.source, 'gi'))) {
      const at = r.index + (r[0].length - r[1].length - 1);
      if (!readerInPosition(structural, r, lead, READER_WORDS)) continue;
      const segEnd = (() => { const p = structural.slice(at).search(/\|(?!\|)/); return p < 0 ? structural.length : at + p; })();
      const segStart = (() => { const before = structural.slice(0, at); const p = before.search(/\|(?!\|)[^|]*$/); return p < 0 ? 0 : p + 1; })();
      if (file.index < segStart || file.index >= segEnd) continue;
      if (printed(at)) return { rule: 4, what: `the whole of ${file.name} would print`, stmt: text };
    }
    if (/(?:^|[^<])<\s*[^<(]/.test(top) && READER_WORDS.has(lead) && printed(0)) {
      return { rule: 4, what: `the whole of ${file.name} would print`, stmt: text };
    }
    // Every grep in the statement, not only the first, each judged by its own quiet flags:
    // in `grep -c x app.js | grep KEY .env` the second one prints the file.
    for (const g of structural.matchAll(new RegExp(GREPS.source, 'gi'))) {
      const at = g.index + (g[0].length - g[1].length - 1);
      if (!readerInPosition(structural, g, lead, GREP_WORDS) || !printed(at)) continue;
      if (grepQuiet(structural, at, g[1]) || feedsQuietGrep(structural, at) || grepKeysOnly(text)) continue;
      return { rule: 4, what: `a grep over ${file.name} prints KEY=value lines`, stmt: text };
    }
  }
  if (PROC_ENVIRON.test(structural) && READERS.test(structural) && printed(0)) {
    return { rule: 3, what: '/proc/*/environ is the whole environment', stmt: text };
  }
  // Rule 3: environment listings.
  const target = listingTarget(structural, text);
  if (target !== null && printed(0)) {
    if (target === '' || target === '*') return { rule: 3, what: 'an environment listing prints every value', stmt: text };
    const name = target.replace(/^Env:[\\/]?/i, '');
    if (isSecretName(name)) return { rule: 3, what: `the value of ${name} would print`, stmt: text };
  }
  // Rules 1 and 2: expansions and prints, per occurrence.
  for (const span of spans) {
    if (!span.code && /\$\{!\w+(?::?-[^}]*)?\}/.test(span.text)) return { rule: 1, what: 'an indirect ${!name} expansion inside a print lists values', stmt: text };
    for (const ref of references(span.text)) {
      if (span.code && span.literal && ref.text.startsWith('$')) continue; // `"$X"` inside a single-quoted script is a literal
      if (!isSecretName(ref.name) || printedOccurrenceSafe(span.text, ref)) continue;
      const fallback = new RegExp(`^\\$\\{${ref.name}(?::?[-=])|^\\$\\{${ref.name}:\\+`, 'i');
      if (fallback.test(span.text.slice(ref.index))) return { rule: 1, what: `a fallback expansion of ${ref.name} prints its value when set`, stmt: text };
      return { rule: 2, what: `printing ${ref.name} puts its value in the transcript`, stmt: text };
    }
  }
  return null;
}

function analyse(cmd, ps, depth = 0) {
  const here = heredocLeak(cmd, ps);
  if (here) return here;
  let tracing = false;
  for (const s of scan(stripHeredocBodies(cmd), ps)) {
    if (/^set\s+(?:-[a-wyz]*x[a-z]*|-o\s+xtrace)\b/.test(s.text)) { tracing = true; continue; }
    if (/^set\s+(?:\+[a-wyz]*x[a-z]*|\+o\s+xtrace)\b/.test(s.text)) { tracing = false; continue; }
    if (tracing && references(expansionView(s)).some((r) => isSecretName(r.name))) {
      return { rule: 2, what: 'set -x prints every expanded command, secret included', stmt: s.text };
    }
    const hit = statementLeak(s, ps, depth);
    if (hit) return hit;
  }
  return null;
}

function readLeak(filePath) {
  const p = String(filePath);
  if (SECRET_FILE.test(p) && !DOC_FILE.test(p)) return { rule: 'Read', what: `${p.replace(/^.*[\\/]/, '')} would land whole in the transcript`, stmt: p };
  return null;
}

function reason(hit) {
  const safe =
    'Print presence and length only: [ -n "$X" ] && echo "X set (${#X} chars)" (PowerShell: if ($env:X) { "X set ($($env:X.Length) chars)" }); ' +
    'list names, not values: env | cut -d= -f1, Get-ChildItem Env: | Select-Object Name; ' +
    'read a secret file by its keys: cut -d= -f1 .env; capture a provider status into a variable or file; ' +
    'never put a :- fallback on a secret. A value that must be used goes into a variable or a file the tool result never shows.';
  return `secret-echo-guard (rule ${hit.rule}): this command would print a secret value into the transcript, ${hit.what}: "${fragment(hit.stmt)}". ${safe}`;
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const tool = String(evt.tool_name ?? '');
    let hit = null;
    if (tool === 'Read') hit = readLeak(evt.tool_input?.file_path ?? '');
    else {
      const cmd = String(evt.tool_input?.command ?? '');
      if (cmd) hit = analyse(cmd, tool === 'PowerShell');
    }
    if (hit) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason(hit) },
        }),
      );
    }
  } catch {
    // fail-open: a hook that crashes must not block ordinary work; the skill is the backstop
  }
  process.exit(0);
});
