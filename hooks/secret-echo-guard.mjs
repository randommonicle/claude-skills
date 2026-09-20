#!/usr/bin/env node
// PreToolUse hook, matcher: Bash|PowerShell, plus Read for .env files. Mechanises
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
// Rules. A statement is one command between newlines, `;`, `&&` and `||`.
//   1. A fallback expansion of a secret-named variable inside a print: ${X:-word},
//      ${X-word}, ${X:=word}, ${X=word}, ${X:+...$...}, and any indirect ${!v:-word}
//      inside a print (a loop over names is a listing of values).
//   2. A print of a secret-named variable: echo, printf, Write-Output, Write-Host,
//      Out-Host, console.log(...), print(...) carrying $X, ${X}, $env:X, process.env.X,
//      os.environ["X"], os.getenv("X") or GetEnvironmentVariable("X"); a heredoc `cat <<`
//      to stdout whose body expands one; a bare PowerShell expression or string that is
//      one ($env:X on its own, "...$env:X...").
//   3. An environment listing: printenv, env, set, export -p, declare -p/-x, typeset -p/-x,
//      Get-ChildItem/gci/ls/dir Env:, [Environment]::GetEnvironmentVariables(), bare or
//      with a wildcard, or naming a secret-named variable (printenv X, Get-Item Env:X,
//      GetEnvironmentVariable("X")), unless piped into a names-only sink (cut -d= -f1,
//      awk -F=, sed 's/=.*//', grep -o '^[^=]*', Select-Object Name).
//   4. A .env file read whole (cat, type, less, more, head, tail, bat, Get-Content, gc)
//      outside a command substitution, or grep/rg/Select-String/findstr over one without
//      -c, -l, -L, -q or a keys-only -o. .env.example, .sample, .template and .dist pass.
//   5. `supabase status` not captured (> file, $(...), backticks) and not filtered of key
//      lines (the default table prints the stack's keys, and -o env prints them too).
//   6. curl -v/--verbose/--trace on a request carrying Authorization, apikey or x-api-key
//      (the verbose log echoes the request headers).
//   Read: the Read tool on a .env file (not the documentation variants).
// Allowed by name: a presence or length form (${#X}, [ -n "$X" ], test -z "$X",
// $env:X.Length, IsNullOrEmpty($env:X), if ($env:X), -eq/-ne/-not), an assignment
// (X=..., export X=..., $env:X = ...), and a publishable name (PUBLIC, PUBLISHABLE, ANON).
//
// Residual gaps, stated plainly: a value copied into another variable and printed
// (`k=$KEY; echo $k`), a script file that prints process.env inside its own source, and
// an API response that returns a credential (the Supabase Management API's auth GET
// answers 243 fields including smtp_pass) are not command-string shapes. The
// secrets-in-output skill is the backstop for all three: print a named allowlist of
// fields, never a raw response, and dry-run the output shape on a dummy value first.
// Fail-open on script error: exit 0 with no output; the skill remains the control.

const SECRET_NAME =
  /(?:^|_)(?:KEYS?|TOKENS?|SECRETS?|PASSWORD|PASSWD|PASS|CREDENTIALS?|PRIVATE|AUTH|COOKIE|SESSION|DSN)(?:_|$)|(?:DATABASE|DB)_URL$|CONN(?:ECTION)?_STR(?:ING)?$/i;
const PUBLISHABLE_NAME = /(?:^|_)(?:PUBLIC|PUBLISHABLE|ANON)(?:_|$)|(?:^|_)(?:SOCK|SOCKET|PID)$/i; // SSH_AUTH_SOCK is a path
const NAME = '[A-Za-z_][A-Za-z0-9_]*';
const SEP = '(?:^|[\\s;&|(])';

const isSecretName = (name) => SECRET_NAME.test(name) && !PUBLISHABLE_NAME.test(name);

// Statements, each flagged `quoted` when it sits inside a double-quoted string that an
// earlier separator split (`git commit -m "a; grep KEY .env; b"` splits at both `;`, and
// both inner fragments are text, not commands). Parity is cumulative across fragments.
function statements(cmd) {
  const out = [];
  let quotes = 0;
  for (const piece of cmd.split(/\r?\n|;|&&|\|\|/)) {
    const text = piece.trim();
    if (text) out.push({ text, quoted: quotes % 2 === 1 });
    quotes += (piece.match(/"/g) || []).length;
  }
  return out;
}

// Sinks that keep names and drop values.
const NAMES_ONLY_SINK =
  /\|\s*(?:cut\s+-d\s*['"]?=['"]?\s*-f\s*1\b|awk\s+-F\s*['"]?=|sed\s+(?:-n\s+)?(?:-E\s+)?['"]s\/=\.\*\/\/|grep\s+-o[a-zA-Z]*\s+['"]\^\[\^=\]\*|Select-Object\s+(?:-ExpandProperty\s+)?Name\b|select\s+(?:-ExpandProperty\s+)?Name\b|ForEach-Object\s+(?:\{\s*\$_\.)?Name\b|%\s*(?:\{\s*\$_\.)?Name\b)|-replace\s+['"]=\.\*['"]|-split\s+['"]=['"]\)\s*\[0\]/i;

// Presence, length, comparison and assignment forms never print the value.
function safeUse(stmt, name) {
  const re = new RegExp(
    `\\$\\{#${name}\\}|\\$\\{${name}:\\+[^}$]*\\}|\\[\\[?\\s+-[nz]\\s+["']?\\$\\{?${name}\\}?|\\btest\\s+-[nz]\\s+["']?\\$\\{?${name}\\}?|\\$env:${name}\\.Length\\b|IsNullOrEmpty\\(\\s*\\$env:${name}\\s*\\)|\\bif\\s*\\(\\s*!?\\s*\\$env:${name}\\s*\\)|\\$env:${name}\\s*-(?:eq|ne|match|notmatch|like)\\b|-not\\s+\\$env:${name}\\b|\\$env:${name}\\s*=[^=]|(?:^|(?:export|local|readonly|declare(?:\\s+-\\w+)*)\\s+)${name}=`,
  );
  return re.test(stmt);
}

const REF = new RegExp(
  `\\$\\{!?(${NAME})|\\$env:(${NAME})|\\$(${NAME})\\b|process\\.env\\.(${NAME})|process\\.env\\[["'](${NAME})["']\\]|os\\.environ(?:\\.get\\(|\\[)["'](${NAME})["']|os\\.getenv\\(["'](${NAME})["']|GetEnvironmentVariable\\(\\s*["'](${NAME})["']`,
  'g',
);
function referencedNames(text) {
  const names = new Set();
  for (const m of text.matchAll(REF)) {
    const n = m.slice(1).find(Boolean);
    if (n && n !== 'env') names.add(n);
  }
  return [...names];
}

// The spans of a statement whose contents are printed: a shell printer's arguments to
// the end of the statement or the next pipe, and the parenthesised argument of
// console.log( / print(.
const SHELL_PRINTER = new RegExp(`${SEP}(?:echo|printf|Write-Output|Write-Host|Out-Host)(?![A-Za-z0-9_-])`, 'gi');
const CALL_PRINTER = /(?:console\.log|print)\s*\(/g;
function printSpans(stmt) {
  const spans = [];
  for (const m of stmt.matchAll(SHELL_PRINTER)) {
    const rest = stmt.slice(m.index + m[0].length);
    const pipe = rest.search(/\|/);
    spans.push(pipe >= 0 ? rest.slice(0, pipe) : rest);
  }
  for (const m of stmt.matchAll(CALL_PRINTER)) {
    let depth = 1;
    let i = m.index + m[0].length;
    const start = i;
    for (; i < stmt.length && depth > 0; i++) {
      if (stmt[i] === '(') depth++;
      else if (stmt[i] === ')') depth--;
    }
    spans.push(stmt.slice(start, depth === 0 ? i - 1 : stmt.length));
  }
  // PowerShell: a bare expression or string on its own is output.
  if (/^\s*(?:\$env:[A-Za-z_]\w*|["'].*)$/.test(stmt) && !/^\s*\$env:\w+\s*=[^=]/.test(stmt)) spans.push(stmt);
  return spans;
}

const ENV_WORDS = new RegExp(`${SEP}(printenv|env|set|export\\s+-p|declare\\s+-[px]|typeset\\s+-[px]|\\[(?:System\\.)?Environment\\]::GetEnvironmentVariables?\\()(?![A-Za-z0-9_:-])`, 'i');
const ENV_PS = new RegExp(`${SEP}(Get-ChildItem\\s+Env:|gci\\s+Env:|ls\\s+Env:|dir\\s+Env:|Get-Item\\s+Env:)`, 'i');
const DOTENV_FILE = /(?:^|[\s'"=/\\])(?:[\w./~\\-]*[/\\])?\.env(?:\.[\w.-]+)?(?=$|[\s'";|)>])/;
const DOTENV_DOC = /\.env\.(?:example|sample|template|dist)\b/i;
const DOTENV_READER = new RegExp(`${SEP}(?:cat|type|less|more|head|tail|bat|Get-Content|gc)\\s`, 'i');
const DOTENV_GREP = new RegExp(`${SEP}(?:grep|rg|egrep|fgrep|Select-String|sls|findstr)\\s`, 'i');
const GREP_QUIET = /\s-[a-zA-Z]*[cLlq][a-zA-Z]*\b/;
const GREP_KEYS_ONLY = /\s-[a-zA-Z]*o[a-zA-Z]*\b(?![^'"]*['"][^'"]*=[^'"$]+['"])/; // -o whose pattern does not carry =<something>

function fragment(text) {
  const one = text.replace(/\s+/g, ' ').trim();
  return one.length > 100 ? `${one.slice(0, 100)} ...` : one;
}

function listingTarget(stmt) {
  // The token after a listing command: '' for bare, '*' for a wildcard, else a name.
  const w = ENV_WORDS.exec(stmt);
  const p = ENV_PS.exec(stmt);
  const m = w ?? p;
  if (!m) return null;
  // A listing word counts only in command position (statement start, after a pipe or a
  // wrapper), so `-o env` and `npm set x` are arguments, not listings.
  if (w && !/(?:^|[|(;&]|\b(?:sudo|command|nice|time|exec)|\/c|-c\s+["']?)\s*$/.test(stmt.slice(0, m.index + (m[0].length - m[1].length)))) return null;
  const after = stmt.slice(m.index + m[0].length);
  if (w && /^\s*(?:$|\||\)|\))/.test(after)) return '';
  if (/^\s*(?:$|\|)/.test(after)) return '';
  const tok = /^\s*(?:\\)?([^\s|)]+)/.exec(after)?.[1] ?? '';
  if (w && w[1].toLowerCase() === 'set') return null; // `set -e`, `set -o pipefail`: not a listing
  if (w && w[1].toLowerCase() === 'env' && !/^\s*\|/.test(after)) return null; // `env VAR=x cmd`: a prefix
  if (/[*?]/.test(tok)) return '*';
  if (/^GetEnvironmentVariable\(/i.test(m[1])) return (/\(\s*["']([^"']+)["']/.exec(stmt)?.[1]) ?? '';
  return tok.replace(/^["']|["']$/g, '');
}

// Heredoc bodies that go to a file or another process (`cat > msg <<'EOF'`, `git commit -F - <<EOF`)
// are text, not commands: a commit message that mentions `supabase status` must not fire rule 5.
// The stdout form (`cat <<EOF` with no redirect) is handled by the rule-2 heredoc check instead.
function stripHeredocBodies(cmd) {
  return cmd.replace(/^([^\n]*<<-?\s*['"]?(\w+)['"]?[^\n]*)\n[\s\S]*?\n\2[ \t]*(?=\n|$)/gm, '$1');
}

// The first real word of a statement, past env-var prefixes and wrappers, lower-cased.
function leadingBinary(stmt) {
  for (const token of stmt.trim().split(/\s+/)) {
    if (/^\w+=/.test(token)) continue;
    const bin = token.replace(/^.*[\\/]/, '').replace(/\.exe$/i, '').toLowerCase();
    if (['sudo', 'env', 'command', 'time', 'nice', 'exec', 'npx'].includes(bin)) continue;
    return bin;
  }
  return '';
}


function findLeak(rawCmd) {
  // Rule 2, heredoc form: `cat <<TAG` to stdout, checked over the raw command because
  // the body spans lines.
  for (const m of rawCmd.matchAll(/(?:^|[\s;&|(])cat\s*<<-?\s*['"]?(\w+)['"]?[^\n]*$/gm)) {
    if (/>\s*\S/.test(m[0])) continue;
    const bodyStart = m.index + m[0].length;
    const end = rawCmd.indexOf(`\n${m[1]}`, bodyStart);
    const body = rawCmd.slice(bodyStart, end < 0 ? rawCmd.length : end);
    for (const name of referencedNames(body)) {
      if (isSecretName(name) && !safeUse(body, name)) return { rule: 2, what: `the heredoc prints ${name}`, stmt: m[0] };
    }
  }
  for (const { text: wrapped, quoted } of statements(stripHeredocBodies(rawCmd))) {
    // `sh -c "..."` / `powershell -Command "..."` execute their string: evaluate the inside.
    const stmt = (/^(?:\w+=\S+\s+)*(?:(?:ba|z|k)?sh\s+-l?c|pwsh\s+-c(?:ommand)?|powershell(?:\.exe)?\s+-c(?:ommand)?)\s+(["'])([\s\S]*)\1\s*$/i.exec(wrapped) || [null, null, wrapped])[2];
    const spans = printSpans(stmt);
    const lead = leadingBinary(stmt);
    // Inside a quoted string, or a fragment left with an unbalanced quote, is text.
    const commandText = !quoted && (stmt.match(/"/g) || []).length % 2 === 0;
    // Rule 5: supabase in command position.
    if (commandText && lead === 'supabase' && /^(?:\w+=\S+\s+)*(?:sudo\s+|npx\s+)?supabase\s+status\b/i.test(stmt)) {
      const captured = />\s*\S|\$\(|`/.test(stmt);
      const filtered = NAMES_ONLY_SINK.test(stmt) || /\|\s*grep\s+-v[a-zA-Z]*\s+\S*(?:key|secret|token)/i.test(stmt);
      if (!captured && !filtered) return { rule: 5, what: 'supabase status prints the local stack keys', stmt };
    }
    // Rule 6: curl in command position.
    if (commandText && lead === 'curl' && /(?:^|\s)(?:-[a-zA-Z]*v[a-zA-Z]*|--verbose|--trace(?:-ascii)?)\b/.test(stmt) && /Authorization|apikey|x-api-key/i.test(stmt)) {
      return { rule: 6, what: 'curl -v prints the Authorization header', stmt };
    }
    // Rule 4: a reader or grep in command position (statement start or after a pipe).
    if (commandText && DOTENV_FILE.test(stmt) && !DOTENV_DOC.test(stmt)) {
      const reader = DOTENV_READER.exec(stmt);
      const readerLeads = reader && (reader.index === 0 || /[|(]\s*$/.test(stmt.slice(0, reader.index + 1)) || /^(?:cat|type|less|more|head|tail|bat|get-content|gc)$/.test(lead));
      if (reader && readerLeads) {
        const inSubstitution = /\$\(|`/.test(stmt.slice(0, reader.index + 1)) && spans.length === 0;
        if (!inSubstitution && !NAMES_ONLY_SINK.test(stmt)) return { rule: 4, what: 'the whole .env file would print', stmt };
      }
      const grep = DOTENV_GREP.exec(stmt);
      const grepLeads = grep && (grep.index === 0 || /[|(]\s*$/.test(stmt.slice(0, grep.index + 1)) || /^(?:grep|rg|egrep|fgrep|select-string|sls|findstr)$/.test(lead));
      if (grep && grepLeads && !GREP_QUIET.test(stmt) && !GREP_KEYS_ONLY.test(stmt)) return { rule: 4, what: 'a grep over .env prints KEY=value lines', stmt };
    }
    // Rule 3.
    const target = commandText ? listingTarget(stmt) : null;
    if (target !== null && !NAMES_ONLY_SINK.test(stmt)) {
      if (target === '' || target === '*') return { rule: 3, what: 'an environment listing prints every value', stmt };
      const name = target.replace(/^Env:\\?/i, '');
      if (isSecretName(name)) return { rule: 3, what: `the value of ${name} would print`, stmt };
    }
    // Rules 1 and 2.
    for (const span of spans) {
      if (/\$\{!\w+:?-/.test(span)) return { rule: 1, what: 'an indirect ${!name:-word} expansion inside a print lists values', stmt };
      for (const name of referencedNames(span)) {
        if (!isSecretName(name) || safeUse(span, name)) continue;
        const fallback = new RegExp(`\\$\\{${name}(?::?[-=])|\\$\\{${name}:\\+[^}]*\\$`);
        if (fallback.test(span)) return { rule: 1, what: `a fallback expansion of ${name} prints its value when set`, stmt };
        return { rule: 2, what: `printing ${name} puts its value in the transcript`, stmt };
      }
    }
  }
  return null;
}

function readLeak(filePath) {
  const base = String(filePath).replace(/^.*[\\/]/, '');
  if (/^\.env(?:\..+)?$/.test(base) && !DOTENV_DOC.test(base)) return { rule: 'Read', what: `${base} would land whole in the transcript`, stmt: String(filePath) };
  return null;
}

function reason(hit) {
  const safe =
    'Print presence and length only: [ -n "$X" ] && echo "X set (${#X} chars)" (PowerShell: if ($env:X) { "X set ($($env:X.Length) chars)" }); ' +
    'list names, not values: env | cut -d= -f1, Get-ChildItem Env: | Select-Object Name; ' +
    'read a .env file by its keys: cut -d= -f1 .env; capture supabase status into a variable or file; ' +
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
      if (cmd) hit = findLeak(cmd);
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
