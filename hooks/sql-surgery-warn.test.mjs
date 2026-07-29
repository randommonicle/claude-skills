#!/usr/bin/env node
// Proves sql-surgery-warn.mjs asks on executed destructive SQL AND stays silent on
// the words appearing as text (prove-it-can-fail: a gate that asks on every grep
// trains bypass, one that asks on nothing is theatre). Feeds crafted PreToolUse
// payloads on stdin, asserts the decision, the reason's three parts, and that the
// JSONL line lands. SURGERY_LOG_PATH is redirected per case so the real
// SURGERY_LOG.jsonl is never touched.
// Run: node hooks/sql-surgery-warn.test.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'sql-surgery-warn.mjs');
const TMP = mkdtempSync(join(tmpdir(), 'sql-surgery-'));

// The fixture the psql -f case points at: two constraint lines in its own header,
// which is the whole point of part 3 (the authoriser reads them at the moment of
// authorisation, not after).
const CONSTRAINT_1 = '-- Constraint: dry-run only, the DELETE runs solely under --apply.';
const CONSTRAINT_2 = '-- Constraint: never match rows where firm_id IS NULL, see the coalesce below.';
mkdirSync(join(TMP, 'docs'), { recursive: true });
writeFileSync(
  join(TMP, 'docs', 'CLEANUP_x.sql'),
  [
    '-- CLEANUP_x.sql: clears the residue of the 2026-06 partial pass.',
    CONSTRAINT_1,
    CONSTRAINT_2,
    '',
    "DELETE FROM demands WHERE coalesce(firm_id::text, '') = '' AND source = 'partial-pass';",
    '',
  ].join('\n'),
);
writeFileSync(join(TMP, 'scripts-cleanup.sql'), 'DELETE FROM demands WHERE 1 = 1;\n');

const CASES = [
  {
    name: 'psql -c carrying DELETE FROM',
    ask: true,
    cmd: `psql "$DATABASE_URL" -c "DELETE FROM demands WHERE created_at < now() - interval '30 days'"`,
    expect: ['DELETE FROM demands', 'read-only inventory first', 'NULL-collapsed'],
  },
  {
    name: 'psql -f naming a script whose header carries the constraints',
    ask: true,
    cwd: TMP,
    cmd: 'psql "$DATABASE_URL" -f docs/CLEANUP_x.sql',
    expect: ["The script's own header says:", CONSTRAINT_1, CONSTRAINT_2, 'read-only inventory first'],
  },
  {
    name: 'bash -c wrapping TRUNCATE',
    ask: true,
    cmd: 'bash -c "psql $DB -c \'TRUNCATE TABLE audit_log_staging\'"',
    expect: ['TRUNCATE TABLE audit_log_staging', 'tamper-evidence'],
  },
  {
    name: 'DROP TABLE heredoc piped into psql',
    ask: true,
    cmd: "psql \"$DATABASE_URL\" <<'SQL'\nDROP TABLE legacy_demands;\nSQL",
    expect: ['DROP TABLE legacy_demands', 'read-only inventory first'],
  },
  {
    name: 'supabase db execute',
    ask: true,
    cmd: 'npx supabase db execute --sql "DELETE FROM audit_log WHERE firm_id = 42"',
    expect: ['DELETE FROM audit_log'],
  },
  {
    name: 'a reader piped straight into a client is still execution',
    ask: true,
    cwd: TMP,
    cmd: 'cat scripts-cleanup.sql | psql "$DATABASE_URL"',
    expect: ['DELETE FROM demands'],
  },
  {
    // The denylist must not become the bypass: a denylisted binary first in a chain.
    name: 'denylisted binary chained into a destructive client call',
    ask: true,
    cmd: 'git pull && psql "$DATABASE_URL" -c "DELETE FROM demands WHERE firm_id = 42"',
    expect: ['DELETE FROM demands'],
  },
  { name: 'grep for the statement in the repo', ask: false, cmd: 'grep -rn "DELETE FROM" docs/' },
  // The denylist is the only thing keeping this one quiet: quoted, and the statement
  // names a table, so both the destructive test and the quoted-SQL context match.
  { name: 'rg for a whole statement, quoted', ask: false, cmd: 'rg -n "TRUNCATE TABLE audit_log" supabase/migrations' },
  { name: 'git commit message mentioning the statement', ask: false, cmd: 'git commit -m "docs: remove DELETE FROM example"' },
  { name: 'echo about the danger', ask: false, cmd: 'echo "TRUNCATE is dangerous"' },
  { name: 'cat of a cleanup script', ask: false, cwd: TMP, cmd: 'cat scripts-cleanup.sql' },
  // Only the execution-context gate keeps this quiet: not a denylisted binary, and the
  // named script really does carry a DELETE. Naming the script is not running it.
  { name: 'inspecting a cleanup script with a non-denylisted tool', ask: false, cwd: TMP, cmd: 'wc -l docs/CLEANUP_x.sql' },
  { name: 'plain test run', ask: false, cmd: 'npm test' },
];

function run(stdin, logPath) {
  return new Promise((resolve) => {
    const p = spawn('node', [HOOK], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, SURGERY_LOG_PATH: logPath } });
    let out = '';
    p.stdout.on('data', (c) => (out += c));
    p.on('close', (code) => resolve({ out, code }));
    p.stdin.end(stdin);
  });
}

function logLines(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

let fails = 0;
let i = 0;
for (const c of CASES) {
  const logPath = join(TMP, `log-${i++}.jsonl`);
  const evt = { tool_name: 'Bash', cwd: c.cwd ?? '/workspace/PropOS', tool_input: { command: c.cmd } };
  const { out, code } = await run(JSON.stringify(evt), logPath);
  const reason = out ? JSON.parse(out).hookSpecificOutput?.permissionDecisionReason ?? '' : '';
  const asked = out ? JSON.parse(out).hookSpecificOutput?.permissionDecision === 'ask' : false;
  const logged = logLines(logPath);

  const why = [];
  if (asked !== c.ask) why.push(`asked=${asked}`);
  if (code !== 0) why.push(`exit=${code}`);
  if (c.ask) {
    if (!reason.startsWith('live-data-surgery: "')) why.push('reason missing part 1');
    for (const want of c.expect ?? []) if (!reason.includes(want)) why.push(`reason missing ${JSON.stringify(want)}`);
    if (logged.length !== 1) why.push(`log lines=${logged.length}`);
    else if (logged[0].command !== c.cmd.slice(0, 500)) why.push('logged command mismatch');
  } else {
    if (out !== '') why.push('emitted output');
    if (logged.length !== 0) why.push(`logged ${logged.length} line(s) for a silent case`);
  }

  const ok = why.length === 0;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.ask ? 'asks  ' : 'silent'} | ${c.name}${ok ? '' : ` (${why.join(', ')})`}`);
}

// Part 3 fails open: the same command against a missing script keeps the ask, drops
// the header quietly, and never mentions the unreadable file.
{
  const logPath = join(TMP, 'log-missing.jsonl');
  const evt = { tool_name: 'Bash', cwd: TMP, tool_input: { command: 'psql "$DB" -c "DELETE FROM demands" -f docs/GONE.sql' } };
  const { out, code } = await run(JSON.stringify(evt), logPath);
  const reason = out ? JSON.parse(out).hookSpecificOutput?.permissionDecisionReason ?? '' : '';
  const ok = code === 0 && reason.includes('DELETE FROM demands') && !reason.includes("script's own header");
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  asks   | unreadable .sql keeps the ask and omits the header (exit=${code})`);
}

// Fail-open: garbage on stdin must exit 0, say nothing, and log nothing.
{
  const logPath = join(TMP, 'log-garbage.jsonl');
  const g = await run('not json at all', logPath);
  const ok = g.code === 0 && g.out === '' && logLines(logPath).length === 0;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  silent | malformed stdin exits 0 silently (exit=${g.code})`);
}

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
