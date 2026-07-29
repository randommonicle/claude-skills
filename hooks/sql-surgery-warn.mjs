#!/usr/bin/env node
// PreToolUse hook, matcher: Bash. Mechanises live-data-surgery at the moment of
// authorisation: a shell command that would EXECUTE destructive SQL is logged and
// then handed back as permissionDecision "ask", carrying the matched statement, the
// protocol in one line, and the target script's own header comments.
//
// Promoted from warn-and-log on evidence, along the path HOOKS.md always reserved
// for exactly this case. The log-only version wrote to a file nobody reads
// mid-session: a destructive live-data delete was pre-authorised without the
// authoriser reading the two constraints written in the very script being
// authorised. The gap was the moment, not the skill, so the fix has to arrive in
// the moment. Destructive SQL inside a Bash command is rare, so this ask cannot
// train bypass (the R-21 concern); it is a deliberate, ratified second blocking
// gate, alongside push-gate.
//
// Discrimination, in order. A leading-binary denylist (grep, rg, cat, echo, sed,
// awk, head, tail, less, git) is checked FIRST, against the first token past any
// env-var prefix or sudo/env wrapper, so grepping the repo for "DELETE FROM" or
// committing a message that mentions it stays silent AND unlogged. Only then does
// the destructive-statement test run, and only in an execution context: a SQL
// client as a command word, an sh -c / bash -c wrapper, a heredoc, SQL passed via
// -c / -e / --sql, quoted SQL handed to something, or a .sql script named on the
// command line, whose first bytes are read for the statement because psql -f
// cleanup.sql carries none itself.
//
// Residual gap, stated plainly: node scripts/cleanup.mjs carries no SQL in the
// command string, so it stays invisible here. The live-data-surgery skill remains
// the backstop for that case, and for anything else that reaches the data another
// way. Accepted cost in the other direction: the quoted-SQL rule cannot tell --sql
// from --grep, so a test run filtering on "DELETE FROM demands" gets one prompt.
// That is the right direction to be wrong in, and it is rare.
// Fail-open: any script error exits 0 with no output. SURGERY_LOG_PATH overrides
// the log location for tests; the default is unchanged.
import { appendFileSync, closeSync, mkdirSync, openSync, readSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';

const DESTRUCTIVE = /\b(DELETE\s+FROM\s+\S|TRUNCATE\s+(TABLE\s+)?\S|DROP\s+TABLE\s+\S)/i;

// Commands that read or carry the words as text. They never execute them, and
// searching the repo for a destructive statement is routine work.
const DENY = new Set(['grep', 'rg', 'cat', 'echo', 'sed', 'awk', 'head', 'tail', 'less', 'git']);
const PREFIX = new Set(['sudo', 'env', 'command', 'time', 'nice']);
// One exception, or the denylist becomes the bypass: a denylisted binary that pipes
// or chains into a client is execution. Covers cat x.sql | psql and git pull && psql.
const CHAINED_TO_CLIENT = /[|;&]\s*(?:\w+=\S+\s+)*(?:sudo\s+|npx\s+)?(?:psql|mysql|mariadb|sqlite3|supabase)\b/i;

const EXECUTION = [
  /(^|[\s;&|(])(?:\w+=\S+\s+)*(?:npx\s+)?(?:psql|mysql|mariadb|sqlite3)\b/i, // client as a command word
  /\bsupabase\b[^|;&]*\bdb\b/i, // supabase db execute / db query / db reset
  /\b(?:ba|z|k)?sh\s+-c\b/, // sh -c "..." wrapping anything
  /<<-?\s*['"]?\w/, // heredoc piping SQL into a client
  /(^|\s)-{1,2}(?:c|e|sql|command|execute)(?:\s+|=)['"]/i, // SQL passed as a flag value
  /['"][^'"]{0,200}?\b(?:DELETE\s+FROM|TRUNCATE\b|DROP\s+TABLE)/i, // quoted SQL handed to something
];

const PROTOCOL =
  'Protocol before this runs: read-only inventory first (count, sample, walk the FK graph);' +
  ' BEGIN ... ROLLBACK dry run; complement-count proof with NULL-collapsed predicates (kept + deleted = total);' +
  ' a self-check that re-runs EVERY predicate individually, not one combined check;' +
  ' confirm the markers sit on disposable rows, by content, because a name is not a disposability proof;' +
  ' and gate anything that resets audit trails, sequence baselines or tamper-evidence on its own confirmation.';

// First real token, past env-var assignments and sudo/env style wrappers.
function leadingBinary(cmd) {
  for (const token of cmd.trim().split(/\s+/)) {
    if (/^\w+=/.test(token)) continue;
    const bin = token.replace(/^.*[\\/]/, '').replace(/\.exe$/i, '').toLowerCase();
    if (PREFIX.has(bin)) continue;
    return bin;
  }
  return '';
}

// Bounded read: a .sql argument can be a multi-gigabyte dump, and this hook sits in
// front of the tool call.
function scriptHead(cmd, cwd) {
  const token = cmd.match(/(?:^|[\s'"<=])([\w.~@+/\\-]+\.sql)(?=$|[\s'";)])/i)?.[1];
  if (!token) return { text: '', comments: [] };
  const path = isAbsolute(token) ? token : resolve(cwd || process.cwd(), token);
  let fd;
  try {
    fd = openSync(path, 'r');
    const buf = Buffer.alloc(8192);
    const n = readSync(fd, buf, 0, 8192, 0);
    const lines = buf.subarray(0, n).toString('utf8').split(/\r?\n/).slice(0, 40);
    return {
      text: lines.join('\n'),
      comments: lines.filter((l) => /^\s*(--|\/\*|\*|#)/.test(l)).slice(0, 8).map((l) => l.trim()),
    };
  } catch {
    return { text: '', comments: [] }; // unreadable file: omit part 3, say nothing about it
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

function fragment(text, hit) {
  const one = text.slice(hit.index).replace(/\s+/g, ' ').trim();
  return one.length > 120 ? `${one.slice(0, 120)} ...` : one;
}

function logSurgery(cmd, cwd) {
  try {
    const path = process.env.SURGERY_LOG_PATH || join(homedir(), '.claude', 'skills', 'SURGERY_LOG.jsonl');
    mkdirSync(dirname(path), { recursive: true }); // plugin installs don't create this dir
    appendFileSync(
      path,
      JSON.stringify({ ts: new Date().toISOString(), cwd, command: cmd.slice(0, 500) }) + '\n',
    );
  } catch {} // an unwritable log must not swallow the ask
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const cmd = evt.tool_input?.command ?? '';
    const cwd = evt.cwd ?? '';
    const routine = DENY.has(leadingBinary(cmd)) && !CHAINED_TO_CLIENT.test(cmd);
    if (cmd && !routine) {
      const script = scriptHead(cmd, cwd);
      const inCmd = DESTRUCTIVE.exec(cmd);
      const inScript = script.text ? DESTRUCTIVE.exec(script.text) : null;
      const hit = inCmd ?? inScript;
      if (hit && EXECUTION.some((re) => re.test(cmd))) {
        logSurgery(cmd, cwd);
        const parts = [`live-data-surgery: "${fragment(inCmd ? cmd : script.text, hit)}"`, PROTOCOL];
        if (script.comments.length) {
          parts.push(`The script's own header says: ${script.comments.join(' | ')}`);
        }
        process.stdout.write(
          JSON.stringify({
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'ask',
              permissionDecisionReason: parts.join(' '),
            },
          }),
        );
      }
    }
  } catch {}
  process.exit(0);
});
