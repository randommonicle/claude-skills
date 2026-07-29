#!/usr/bin/env node
// Proves test-write-warn.mjs fires on each rule, composes both lines when two
// rules hit, and stays quiet on the near-misses (prove-it-can-fail: a warn hook
// that fires on everything trains bypass, one that fires on nothing is theatre).
// The negative controls are the load-bearing half here, because rule A's whole
// difficulty is telling a Map .delete( from a database one.
// Run: node hooks/test-write-warn.test.mjs
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'test-write-warn.mjs');

// Distinctive substrings of each rule's line, so a case asserts WHICH rule fired.
const MARKERS = {
  A: 'flip-and-restore in try/finally instead of deleting',
  B: 'a service-role client bypasses RLS',
  C: 'assert which error (code or message)',
};

// [name, expected rules (empty = quiet), event]
const CASES = [
  ['supabase delete in a smoke spec', ['A'], { tool_name: 'Write', tool_input: { file_path: 'app/tests/smoke/financial.spec.ts', content: "const { error } = await supabase.from('transactions').delete().eq('id', id);\nexpect(error.code).toBe(undefined);\n" } }],
  ['raw TRUNCATE in a smoke spec', ['A'], { tool_name: 'Write', tool_input: { file_path: 'app/tests/smoke/reset.spec.ts', content: "await pgClient.query('TRUNCATE TABLE audit_log');\n" } }],
  ['Edit adds a service-role client', ['B'], { tool_name: 'Edit', tool_input: { file_path: 'app/tests/smoke/c1-demand.spec.ts', new_string: 'const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);' } }],
  ['error-existence assertion', ['C'], { tool_name: 'Write', tool_input: { file_path: 'app/tests/smoke/rls-block.spec.ts', content: "const { error } = await anon.rpc('post_demand');\nexpect(error).not.toBeNull();\n" } }],
  ['toBeTruthy variant with whitespace', ['C'], { tool_name: 'Edit', tool_input: { file_path: 'app/tests/unit/guard.test.ts', new_string: 'expect( err ) . toBeTruthy( );' } }],
  ['service-role teardown delete hits A and B', ['A', 'B'], { tool_name: 'Write', tool_input: { file_path: 'app/tests/smoke/c1-audit.spec.ts', content: "const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);\nawait admin.from('audit_log').delete().eq('firm_id', firmId);\n" } }],
  ['MultiEdit carrying a service-role key', ['B'], { tool_name: 'MultiEdit', tool_input: { file_path: 'app/tests/smoke/c1-ledger.spec.ts', edits: [{ new_string: 'const url = process.env.SUPABASE_URL!;' }, { new_string: 'const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;' }] } }],
  ['Windows path, backslashes throughout', ['B'], { tool_name: 'Write', tool_input: { file_path: 'C:\\r\\app\\tests\\smoke\\x.spec.ts', content: 'const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;\n' } }],
  ['Windows path, segment gate only, no .spec. in the name', ['C'], { tool_name: 'Write', tool_input: { file_path: 'C:\\r\\app\\e2e\\login-flow.ts', content: 'expect(error).toBeDefined();\n' } }],

  ['app source with map.delete, not test-shaped', [], { tool_name: 'Write', tool_input: { file_path: 'app/src/lib/cache.ts', content: 'export function evict(map: Map<string, number>, key: string) {\n  map.delete(key);\n}\n' } }],
  ['plain Map delete in a unit test', [], { tool_name: 'Write', tool_input: { file_path: 'app/tests/unit/shape.test.ts', content: "const seen = new Map();\nseen.set('a', 1);\nseen.delete('a');\nexpect(seen.size).toBe(0);\n" } }],
  ['Array.from beside a Map delete', [], { tool_name: 'Write', tool_input: { file_path: 'app/tests/unit/rows.test.ts', content: 'const rows = Array.from(new Set(ids));\nconst seen = new Map(ids.map((i) => [i, 0]));\nseen.delete(ids[0]);\nexpect(rows.length).toBe(2);\n' } }],
  ['error identity done right', [], { tool_name: 'Write', tool_input: { file_path: 'app/tests/smoke/rls.spec.ts', content: "const { error } = await anon.from('demands').update({ x: 1 }).eq('id', id);\nexpect(error.code).toBe('42501');\n" } }],
  ['happy-path expect(error).toBeNull()', [], { tool_name: 'Edit', tool_input: { file_path: 'app/tests/smoke/post.spec.ts', new_string: 'expect(error).toBeNull();' } }],
  ['truncate string helper under test', [], { tool_name: 'Write', tool_input: { file_path: 'app/tests/unit/text.test.ts', content: "expect(truncate('abcdef', 3)).toBe('abc');\n" } }],
  ['ordinary assertion-only spec', [], { tool_name: 'Write', tool_input: { file_path: 'app/tests/unit/rounding.test.ts', content: "expect(toPounds('12.005')).toBe('12.01');\n" } }],
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
for (const [name, expected, evt] of CASES) {
  const { out, code } = await run(JSON.stringify(evt));
  const seen = Object.keys(MARKERS).filter((k) => out.includes(MARKERS[k]));
  const ok = code === 0 && seen.join(',') === expected.join(',') && (expected.length > 0 || out === '');
  if (!ok) fails++;
  const label = expected.length ? `fires ${expected.join('+')}` : 'quiet  ';
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label} | ${name}${ok ? '' : ` (saw=${seen.join('+') || 'nothing'}, exit=${code})`}`);
}

// Fail-open: garbage on stdin must exit 0 and say nothing.
const g = await run('not json at all');
const gok = g.code === 0 && g.out === '';
if (!gok) fails++;
console.log(`${gok ? 'PASS' : 'FAIL'}  quiet   | malformed stdin exits 0 silently (exit=${g.code})`);

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
