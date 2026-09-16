#!/usr/bin/env node
// Standalone test for read-head-supply.mjs. No framework: writes a fixture file,
// pipes one PostToolUse event to the real hook as a child process, and asserts
// on what it wrote to stdout.
//   node hooks/read-head-supply.test.mjs
//
// The first case is the one that decides whether this hook ships. It reproduces
// LESSONS_LEARNED entry 14: the state that would have prevented two wrong
// conclusions sat at line 4, and every read that night started below it. If the
// hook does not surface line 4 for that shape, it does not address the incident
// it was built for and there is no reason to install it.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const HOOK = join(HERE, 'read-head-supply.mjs');
const STATE_DIR = join(HERE, '..', '.read-head-state');

let failed = 0;

// Entry 14's shape: the meaning-changing state on line 4 of a long file.
const TRANSCRIPT = [
  '{"type":"summary","leafUuid":"abc"}',
  '{"type":"user","message":"start"}',
  '{"type":"assistant","message":"ok"}',
  '{"type":"environment","cwd":"C:\\\\Users\\\\ben\\\\society","gitRepo":false}',
  '{"type":"user","message":"the junction question"}',
  ...Array.from({ length: 200 }, (_, i) => `{"type":"filler","n":${i}}`),
].join('\n');

// The hook writes a JSON envelope, so the message is JSON-encoded inside it.
// Decode before asserting: matching against the raw stdout would pass or fail on
// quote escaping rather than on content, which is a test that reds for the wrong
// reason.
function run(event) {
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(event), encoding: 'utf8' });
  const raw = r.stdout ?? '';
  let message = '';
  try {
    message = JSON.parse(raw).systemMessage ?? '';
  } catch {}
  return { code: r.status, out: raw, message };
}

function check(name, event, expect) {
  rmSync(STATE_DIR, { recursive: true, force: true });
  const dir = mkdtempSync(join(tmpdir(), 'read-head-'));
  try {
    const file = join(dir, 'transcript.jsonl');
    writeFileSync(file, TRANSCRIPT);
    const evt = typeof event === 'function' ? event(file) : event;
    const results = Array.isArray(evt) ? evt.map(run) : [run(evt)];
    const last = results[results.length - 1];

    const problems = [];
    if (last.code !== 0) problems.push(`exit ${last.code}, wanted 0 (fail-open)`);
    if (expect.silent && last.out.trim() !== '') problems.push(`wanted silence, got ${last.out.slice(0, 120)}`);
    for (const needle of expect.contains ?? []) {
      if (!last.message.includes(needle)) problems.push(`message missing ${JSON.stringify(needle)}`);
    }

    if (problems.length === 0) {
      console.log(`PASS  ${name}`);
    } else {
      failed++;
      console.log(`FAIL  ${name}`);
      for (const p of problems) console.log(`        ${p}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(STATE_DIR, { recursive: true, force: true });
  }
}

// THE GATING CASE. Entry 14: read starts at line 40, the state is on line 4.
check(
  'entry 14: a read below the head surfaces line 4, the state that was missed',
  (file) => ({ session_id: 's1', tool_name: 'Read', tool_input: { file_path: file, offset: 40, limit: 60 } }),
  { contains: ['"type":"environment"', 'society', 'lines 1-5 were not returned'] },
);

check(
  'a read with no offset is silent (the common path)',
  (file) => ({ session_id: 's1', tool_name: 'Read', tool_input: { file_path: file } }),
  { silent: true },
);

check(
  'a read at offset 1 is silent: the head is already in it',
  (file) => ({ session_id: 's1', tool_name: 'Read', tool_input: { file_path: file, offset: 1 } }),
  { silent: true },
);

check(
  'a read at offset 5 is silent: still inside the head window',
  (file) => ({ session_id: 's1', tool_name: 'Read', tool_input: { file_path: file, offset: 5 } }),
  { silent: true },
);

check(
  'the second sliced read of the same file in one session is silent',
  (file) => [
    { session_id: 's2', tool_name: 'Read', tool_input: { file_path: file, offset: 40 } },
    { session_id: 's2', tool_name: 'Read', tool_input: { file_path: file, offset: 90 } },
  ],
  { silent: true },
);

check(
  'a different session fires again for the same file',
  (file) => [
    { session_id: 's3', tool_name: 'Read', tool_input: { file_path: file, offset: 40 } },
    { session_id: 's4', tool_name: 'Read', tool_input: { file_path: file, offset: 40 } },
  ],
  { contains: ['"type":"environment"'] },
);

check(
  'a missing file fails open and silent, never crashes the tool call',
  () => ({ session_id: 's5', tool_name: 'Read', tool_input: { file_path: join(tmpdir(), 'no-such-file-xyz'), offset: 40 } }),
  { silent: true },
);

check('malformed stdin fails open', { not: 'an event' }, { silent: true });

// Not a behaviour case: proof that the assertion-free promise is kept. The whole
// reason this hook supplies instead of warns is that a claim about whether the
// read was wasteful would be false in the common case. If someone later adds one,
// this goes red.
{
  rmSync(STATE_DIR, { recursive: true, force: true });
  const dir = mkdtempSync(join(tmpdir(), 'read-head-'));
  const file = join(dir, 'transcript.jsonl');
  writeFileSync(file, TRANSCRIPT);
  const { message } = run({ session_id: 's6', tool_name: 'Read', tool_input: { file_path: file, offset: 40 } });
  const banned = ['cheaper', 'wasteful', 'should have', 'inefficient', 'you may be missing'];
  const hit = banned.filter((w) => message.toLowerCase().includes(w));
  if (hit.length === 0) {
    console.log('PASS  the message asserts nothing about whether the read was wasteful');
  } else {
    failed++;
    console.log(`FAIL  the message asserts nothing about whether the read was wasteful`);
    console.log(`        found claim words: ${hit.join(', ')}`);
  }
  rmSync(dir, { recursive: true, force: true });
  rmSync(STATE_DIR, { recursive: true, force: true });
}

if (failed > 0) {
  console.log(`\n${failed} case${failed === 1 ? '' : 's'} failed`);
  process.exit(1);
}
console.log('\nall cases passed');
