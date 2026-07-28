#!/usr/bin/env node
// Proves schedule-cost-warn.mjs can fire AND can stay quiet (prove-it-can-fail:
// a warn hook that fires on everything trains bypass, one that fires on nothing
// is theatre). Feeds crafted PreToolUse payloads on stdin and asserts each case.
// Run: node hooks/schedule-cost-warn.test.mjs
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'schedule-cost-warn.mjs');

const CASES = [
  ['new scheduled workflow', true, { tool_name: 'Write', tool_input: { file_path: 'C:/r/.github/workflows/smoke.yml', content: 'on:\n  schedule:\n    - cron: "0 3 * * *"\njobs:\n  a:\n    runs-on: ubuntu-latest\n' } }],
  ['cadence change via Edit', true, { tool_name: 'Edit', tool_input: { file_path: 'C:/r/.github/workflows/smoke.yml', new_string: "    - cron: '0 3 * * 1'" } }],
  ['MultiEdit carrying a cron', true, { tool_name: 'MultiEdit', tool_input: { file_path: '.github/workflows/ci.yml', edits: [{ new_string: 'jobs:' }, { new_string: '  - cron: "*/5 * * * *"' }] } }],
  ['vercel.json crons', true, { tool_name: 'Write', tool_input: { file_path: 'C:/r/vercel.json', content: '{ "crons": [{ "path": "/api/warm", "schedule": "*/5 * * * *" }] }' } }],
  ['unrelated step edit in a scheduled workflow', false, { tool_name: 'Edit', tool_input: { file_path: 'C:/r/.github/workflows/smoke.yml', new_string: '      - run: npm test' } }],
  ['prose containing the word scheduled', false, { tool_name: 'Write', tool_input: { file_path: '.github/workflows/ci.yml', content: '# this job is not scheduled, it runs on push\non: [push]\n' } }],
  ['on_schedule is not a schedule key', false, { tool_name: 'Edit', tool_input: { file_path: '.github/workflows/ci.yml', new_string: '  if: env.on_schedule: no' } }],
  ['schedule word in app source', false, { tool_name: 'Write', tool_input: { file_path: 'C:/r/app/src/lib/rota.ts', content: 'export const schedule: string[] = [];\n' } }],
  ['normal source file', false, { tool_name: 'Write', tool_input: { file_path: 'C:/r/app/src/App.tsx', content: 'export default function App() { return null }\n' } }],
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
for (const [name, shouldFire, evt] of CASES) {
  const { out, code } = await run(JSON.stringify(evt));
  const fired = out.includes('price-the-spend');
  const ok = fired === shouldFire && code === 0;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${shouldFire ? 'fires ' : 'quiet '} | ${name}${ok ? '' : ` (fired=${fired}, exit=${code})`}`);
}

// Fail-open: garbage on stdin must exit 0 and say nothing.
const g = await run('not json at all');
const gok = g.code === 0 && g.out === '';
if (!gok) fails++;
console.log(`${gok ? 'PASS' : 'FAIL'}  quiet  | malformed stdin exits 0 silently (exit=${g.code})`);

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
