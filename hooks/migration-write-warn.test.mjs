#!/usr/bin/env node
// Proves migration-write-warn.mjs can fire AND can stay quiet (prove-it-can-fail:
// a warn hook that fires on everything trains bypass, one that fires on nothing
// is theatre). Also proves rule 2 discriminates: a plain-DDL migration gets the
// base message and NOT the invariant suffix. Feeds crafted PreToolUse payloads
// on stdin and asserts each case.
// Run: node hooks/migration-write-warn.test.mjs
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'migration-write-warn.mjs');

// [name, shouldFire, wantInvariantSuffix, event]
const CASES = [
  ['plain DDL migration via Write', true, false, { tool_name: 'Write', tool_input: { file_path: 'supabase/migrations/00150_lane_guard.sql', content: "alter table public.demand add column lane text not null default 'a';\ncreate index on public.demand (lane);\n" } }],
  ['Edit new_string touching a migration', true, false, { tool_name: 'Edit', tool_input: { file_path: 'supabase/migrations/00150_lane_guard.sql', new_string: 'create trigger t_lane before update on public.demand for each row execute function f_lane();' } }],
  ['MultiEdit carrying migration SQL', true, false, { tool_name: 'MultiEdit', tool_input: { file_path: 'db/migrations/0042_rls.sql', edits: [{ new_string: 'alter table public.payment enable row level security;' }, { new_string: 'create policy p_read on public.payment for select using (firm_id = current_firm());' }] } }],
  ['Windows path, back slashes', true, false, { tool_name: 'Write', tool_input: { file_path: 'C:\\r\\supabase\\migrations\\00151_x.sql', content: 'alter table public.tenancy add column reviewed_at timestamptz;\n' } }],
  ['COMMENT ON VIEW asserting an invariant', true, true, { tool_name: 'Write', tool_input: { file_path: 'supabase/migrations/00152_v_alloc.sql', content: "create view v_allocation as select * from allocation;\ncomment on view v_allocation is 'the single source of truth for allocations';\n" } }],
  ['line comment asserting counts must stay in sync', true, true, { tool_name: 'Write', tool_input: { file_path: 'supabase/migrations/00153_counts.sql', content: '-- the cached count and the row count must stay in sync\nupdate public.block set unit_count = 4 where id = 1;\n' } }],
  // Fires the base message but NOT the suffix: rule 2 reads comments only, so a
  // constraint name and a string literal carrying the same words are not prose.
  ['invariant words outside comment syntax', true, false, { tool_name: 'Write', tool_input: { file_path: 'supabase/migrations/00154_alloc.sql', content: "alter table public.allocation add constraint alloc_must_match_check check (net + vat = gross);\ninsert into public.rule_note (body) values ('the cached count must stay in sync with the rows');\n" } }],
  ['app source file', false, false, { tool_name: 'Write', tool_input: { file_path: 'app/src/lib/matchingEngine.ts', content: 'export function match() { return null }\n' } }],
  ['.sql outside any migrations directory', false, false, { tool_name: 'Write', tool_input: { file_path: 'docs/CLEANUP_sca_residue.sql', content: 'delete from public.sca_residue where firm_id is null;\n' } }],
  ['prose document about migrations', false, false, { tool_name: 'Write', tool_input: { file_path: 'docs/MIGRATIONS.md', content: '# Migrations\n\nEvery migration ships a catalog-verification query.\n' } }],
  ['Edge Function beside the migrations', false, false, { tool_name: 'Edit', tool_input: { file_path: 'supabase/functions/x/index.ts', new_string: 'const sql = "alter table public.demand add column lane text";' } }],
];

function run(stdin) {
  return new Promise((resolve) => {
    const p = spawn('node', [HOOK], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (c) => (out += c));
    p.on('close', (code) => resolve({ out, code }));
    p.stdin.end(stdin);
  });
}

let fails = 0;
for (const [name, shouldFire, wantInvariant, evt] of CASES) {
  const { out, code } = await run(JSON.stringify(evt));
  const fired = out.includes('migration-write-warn:');
  const invariant = out.includes('prose, not a control');
  const ok = fired === shouldFire && invariant === wantInvariant && code === 0;
  if (!ok) fails++;
  const label = shouldFire ? (wantInvariant ? 'fires+inv' : 'fires    ') : 'quiet    ';
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label} | ${name}${ok ? '' : ` (fired=${fired}, invariant=${invariant}, exit=${code})`}`);
}

// The output contract: one JSON object, warn-only, no permissionDecision anywhere.
const c = await run(JSON.stringify({ tool_name: 'Write', tool_input: { file_path: 'supabase/migrations/00150_lane_guard.sql', content: 'select 1;' } }));
let cok = false;
try {
  const j = JSON.parse(c.out);
  cok =
    j.hookSpecificOutput?.hookEventName === 'PreToolUse' &&
    j.hookSpecificOutput.additionalContext === j.systemMessage &&
    !c.out.includes('permissionDecision');
} catch {}
if (!cok) fails++;
console.log(`${cok ? 'PASS' : 'FAIL'}  contract  | one JSON object, warn-only, never blocks`);

// Fail-open: garbage on stdin must exit 0 and say nothing.
const g = await run('not json at all');
const gok = g.code === 0 && g.out === '';
if (!gok) fails++;
console.log(`${gok ? 'PASS' : 'FAIL'}  quiet     | malformed stdin exits 0 silently (exit=${g.code})`);

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
