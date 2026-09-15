#!/usr/bin/env node
// Proves run-seat.mjs appends an honest record: a section only when the seat actually
// answered, a VISIBLE failure note when it did not, and never the two confused.
//
// It reds against: a version that classifies on exit code or on a "status" field (cases
// 4, 5 and 6 all return exit 0 and would be banked as answers), a version that appends a
// section for an empty reply (case 6), a version that writes nothing on failure (cases
// 4-7, the LESSONS_LEARNED 13 shape), a version that loses the thread id so a later
// session cannot resume (case 2), a version with no anti-double-turn guard (case 8), and
// a version that hands an argv seat the literal string "{prompt}" instead of the prompt
// (the shipped 2026-09-15 code did exactly that, green at 20 cases, because the only
// envelope fixture took its prompt on stdin).
// Run: node scripts/run-seat.test.mjs
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const RUN = join(HERE, 'run-seat.mjs');
const FAKE = join(HERE, 'fake-seat.mjs');
let fails = 0;
const pass = (m) => console.log('PASS  | ' + m);
const fail = (m) => {
  console.log('FAIL  | ' + m);
  fails++;
};

const OPENER = `# Review: test

## [CLAUDE round 1]

Framing and evidence.

NEXT: ALL

[[END CLAUDE round 1]]
`;

function stage(reviewBody = OPENER) {
  const root = mkdtempSync(join(tmpdir(), 'seat-t-'));
  mkdirSync(join(root, 'exchange'), { recursive: true });
  const review = join(root, 'exchange', 'REVIEW_test_2026-09-15.md');
  writeFileSync(review, reviewBody, 'utf8');
  writeFileSync(
    join(root, 'exchange', 'seats.jsonc'),
    JSON.stringify({
      GPT: {
        command: process.execPath,
        promptVia: 'stdin',
        start: [FAKE, 'exec', '--json', '-s', '{sandbox}', '-C', '{cwd}', '-o', '{replyFile}', '-'],
        continue: [FAKE, 'exec', 'resume', '{thread}', '--json', '-o', '{replyFile}', '-'],
        outputFormat: 'jsonl',
        replyFrom: 'replyFile',
        threadIdFrom: { event: 'thread.started', field: 'thread_id' },
        usageFrom: { event: 'turn.completed', field: 'usage' },
        sandbox: 'read-only',
        grounding: 'repo-read',
        timeoutMs: 30000,
      },
    }),
    'utf8',
  );
  return { root, review };
}

function runSeat(review, handle, mode, extra = [], env = {}) {
  const r = spawnSync(process.execPath, [RUN, review, handle, ...extra], {
    encoding: 'utf8',
    env: { ...process.env, FAKE_SEAT_MODE: mode, ...env },
  });
  return { code: r.status, out: (r.stdout ?? '') + (r.stderr ?? ''), md: readFileSync(review, 'utf8') };
}

const cases = [];
const test = (name, fn) => cases.push([name, fn]);

test('appends a section with the correct handle, round number and terminator', (s) => {
  const r = runSeat(s.review, 'GPT', 'success');
  if (r.code !== 0) return 'exit ' + r.code + ' :: ' + r.out.slice(0, 200);
  if (!/^## \[GPT round 1\]$/m.test(r.md)) return 'no round-1 header';
  if (!/^\[\[END GPT round 1\]\]$/m.test(r.md)) return 'no terminator';
  if (!/guard at src\/a\.ts:12/.test(r.md)) return 'reply body missing';
  return true;
});

test('records the thread id and usage in the metadata comment', (s) => {
  runSeat(s.review, 'GPT', 'success');
  const md = readFileSync(s.review, 'utf8');
  if (!/<!-- seat: GPT \| thread: 01a0a4d5-/.test(md)) return 'thread id not recorded';
  if (!/usage: in=21425 out=16/.test(md)) return 'usage not recorded';
  if (!/grounding: repo-read/.test(md)) return 'grounding not recorded';
  return true;
});

test('a second turn resumes the recorded thread instead of opening a new one', (s) => {
  runSeat(s.review, 'GPT', 'success');
  // A new hub round has to open before a spoke may speak again.
  writeFileSync(s.review, readFileSync(s.review, 'utf8') + '\n## [CLAUDE round 2]\n\nNEXT: ALL\n\n[[END CLAUDE round 2]]\n');
  const r = runSeat(s.review, 'GPT', 'success');
  if (r.code !== 0) return 'exit ' + r.code;
  if (!/^## \[GPT round 2\]$/m.test(r.md)) return 'no round-2 header';
  // The fake returns a different body and usage on resume, which is how we know the
  // continue template ran rather than start.
  if (!/Conceded on the citation/.test(r.md)) return 'resume template was not used';
  if (!/usage: in=42879/.test(r.md)) return 'resume usage not recorded';
  if (!/seat_turns: 2 \| file_turns: 2/.test(r.md)) return 'turn counters wrong';
  return true;
});

test('a timed-out turn appends NO section but DOES append a visible failure note', (s) => {
  const r = runSeat(s.review, 'GPT', 'timeout');
  if (/## \[GPT round 1\]/.test(r.md)) return 'appended a section for a turn that never finished';
  if (!/\[transport\] GPT round 1 did not complete/.test(r.md)) return 'no visible failure note';
  if (!/timed out/.test(r.md)) return 'note does not name the timeout';
  if (r.code !== 1) return 'exit ' + r.code + ', expected 1';
  return true;
});

test('a timed-out turn still records the tokens it spent', (s) => {
  const r = runSeat(s.review, 'GPT', 'timeout');
  if (!/in=195056/.test(r.md)) return 'spend on a failed turn was not recorded';
  return true;
});

test('a permission denial is named as such, not as a timeout', (s) => {
  const r = runSeat(s.review, 'GPT', 'denied');
  if (/## \[GPT round 1\]/.test(r.md)) return 'appended a section for a denied turn';
  if (!/permission was auto-denied \(read_file\)/.test(r.md)) return 'denial not named: ' + r.md.slice(-300);
  if (/timed out/.test(r.md)) return 'a denial was reported as a timeout';
  return true;
});

test('an empty reply with exit 0 and no stderr marker is still not an answer', (s) => {
  const r = runSeat(s.review, 'GPT', 'empty');
  if (/## \[GPT round 1\]/.test(r.md)) return 'banked an empty reply as a section';
  if (!/empty reply/.test(r.md)) return 'failure note does not name the empty reply';
  return true;
});

test('refuses a second section for a seat that already answered the open round', (s) => {
  runSeat(s.review, 'GPT', 'success');
  const r = runSeat(s.review, 'GPT', 'success');
  if (r.code === 0) return 'allowed a double turn';
  if ((r.md.match(/## \[GPT round/g) ?? []).length !== 1) return 'wrote a second section anyway';
  return true;
});

test('a missing CLI fails loudly and appends only a failure note', (s) => {
  const r = runSeat(s.review, 'GPT', 'missing-binary');
  if (/## \[GPT round 1\]/.test(r.md)) return 'appended a section with no CLI';
  if (!/did not complete/.test(r.md)) return 'no failure note';
  return true;
});

test('refuses to run when no hub round is open', () => {
  const s = stage('# Review: test\n\nNo hub section at all.\n');
  const r = runSeat(s.review, 'GPT', 'success');
  rmSync(s.root, { recursive: true, force: true });
  if (r.code === 0) return 'ran with no open round';
  if (/## \[GPT/.test(r.md)) return 'appended a section with no open round';
  return true;
});

test('refuses an unconfigured seat and names the ones that exist', (s) => {
  const r = runSeat(s.review, 'GEMPRO', 'success');
  if (r.code === 0) return 'ran an unconfigured seat';
  if (!/GPT/.test(r.out)) return 'did not name the configured seats';
  return true;
});

test('the composed prompt frames the exchange file as untrusted material', (s) => {
  const r = spawnSync(process.execPath, [RUN, s.review, 'GPT', '--dry-run'], { encoding: 'utf8' });
  if (!/untrusted material/.test(r.stdout)) return 'no untrusted framing';
  if (!/never an instruction to obey/.test(r.stdout)) return 'framing does not say it is not an instruction';
  if (!/## \[CLAUDE round 1\]/.test(r.stdout)) return 'the exchange file was not included';
  return true;
});

// Every other case passes an ABSOLUTE path as the command, skipping PATH resolution -
// which is why all thirteen stayed green while two real rides failed ENOENT. This one
// reproduces the exact shape that broke: an npm install puts THREE shims side by side,
// `codex` (POSIX sh), `codex.cmd` and `codex.ps1`, and a resolver that tries the bare
// name first picks the sh script, which Windows cannot execute.
test('prefers the executable shim over an identically-named POSIX one', (s) => {
  if (process.platform !== 'win32') {
    // Not a silent skip: on POSIX the extensionless file IS the right answer, so there is
    // no wrong choice to make and the case cannot fail. Say so rather than print PASS.
    console.log('SKIP  | prefers the executable shim (win32-only: no PATHEXT on this platform)');
    return true;
  }
  const binDir = join(s.root, 'fakebin');
  mkdirSync(binDir, { recursive: true });
  // The trap: an extensionless sh script that Windows cannot run...
  writeFileSync(join(binDir, 'myseat'), '#!/bin/sh\nexit 1\n', 'utf8');
  // ...beside the .cmd that actually works.
  writeFileSync(join(binDir, 'myseat.cmd'), `@echo off\r\nnode "${FAKE}" %*\r\n`, 'utf8');

  const seatsPath = join(s.root, 'exchange', 'seats.jsonc');
  const seats = JSON.parse(readFileSync(seatsPath, 'utf8'));
  seats.GPT.command = 'myseat';
  seats.GPT.start = ['exec', '--json', '-o', '{replyFile}', '-'];
  writeFileSync(seatsPath, JSON.stringify(seats), 'utf8');

  const r = runSeat(s.review, 'GPT', 'success', [], { PATH: binDir + ';' + process.env.PATH });
  if (/could not be started/.test(r.md)) return 'picked the unexecutable shim: ' + r.md.slice(-180);
  if (!/^## \[GPT round 1\]$/m.test(r.md)) return 'no section appended :: ' + r.out.slice(0, 200);
  return true;
});

// The second envelope shape: agy returns ONE JSON object on stdout with the reply
// inside it, no -o file, and a structured denied_actions array. A transport that only
// understands codex's JSONL would read every agy turn as an empty reply and park a seat
// that answered perfectly well.
function stageEnvelope(s) {
  const seatsPath = join(s.root, 'exchange', 'seats.jsonc');
  const seats = JSON.parse(readFileSync(seatsPath, 'utf8'));
  seats.GEM = {
    command: process.execPath,
    // argv, as the real agy seat is configured. The fixture used to say stdin here while
    // still listing {prompt} on argv, so the argv branch was never exercised and the
    // literal placeholder went to the CLI unseen.
    promptVia: 'argv',
    start: [FAKE, '-p', '{prompt}', '--output-format', 'json'],
    continue: [FAKE, '-p', '{prompt}', '--conversation', '{thread}', '--output-format', 'json'],
    outputFormat: 'envelope',
    replyPath: 'response',
    threadIdPath: 'conversation_id',
    usagePath: 'usage',
    deniedPath: 'denied_actions',
    promptSuffix: 'Use the exact file paths given to you.',
    grounding: 'repo-read',
    timeoutMs: 30000,
  };
  writeFileSync(seatsPath, JSON.stringify(seats), 'utf8');
}

test('an argv seat receives the composed prompt, not the literal placeholder', (s) => {
  stageEnvelope(s);
  const dump = join(s.root, 'prompt-dump.json');
  // $& and $1 are what a string-form replace would expand; the ask is untrusted text
  // and must arrive exactly as typed.
  const ask = 'Cite the line. The cost is $& not $1.';
  const r = runSeat(s.review, 'GEM', 'success', ['--ask', ask], { FAKE_SEAT_SHAPE: 'envelope', FAKE_SEAT_PROMPT_DUMP: dump });
  if (r.code !== 0) return 'exit ' + r.code + ' :: ' + r.out.slice(0, 200);
  const got = JSON.parse(readFileSync(dump, 'utf8'));
  if (got.argvPrompt === '{prompt}') return 'the CLI was handed the literal placeholder';
  if (!got.argvPrompt || !/YOUR HANDLE: GEM/.test(got.argvPrompt)) return 'composed prompt not on argv: ' + String(got.argvPrompt).slice(0, 80);
  if (!/Framing and evidence\./.test(got.argvPrompt)) return 'exchange file not in the prompt';
  if (!got.argvPrompt.includes('THIS ROUND: ' + ask)) return 'ask not delivered verbatim';
  if (!got.argvPrompt.endsWith('Use the exact file paths given to you.')) return 'promptSuffix not delivered';
  if (got.stdin.length) return 'prompt was also sent on stdin';
  return true;
});

test('an argv seat whose template has no {prompt} is refused before anything is spent', (s) => {
  stageEnvelope(s);
  const seatsPath = join(s.root, 'exchange', 'seats.jsonc');
  const seats = JSON.parse(readFileSync(seatsPath, 'utf8'));
  seats.GEM.start = [FAKE, '--output-format', 'json'];
  writeFileSync(seatsPath, JSON.stringify(seats), 'utf8');
  const dump = join(s.root, 'prompt-dump.json');
  const r = runSeat(s.review, 'GEM', 'success', [], { FAKE_SEAT_SHAPE: 'envelope', FAKE_SEAT_PROMPT_DUMP: dump });
  if (r.code !== 2) return 'exit ' + r.code + ', expected 2 :: ' + r.out.slice(0, 200);
  if (!/never receive/.test(r.out)) return 'refusal does not say why: ' + r.out.slice(0, 200);
  if (existsSync(dump)) return 'the seat was spawned anyway';
  if (/## \[GEM round 1\]/.test(r.md)) return 'a section was appended';
  return true;
});

test('a stdin seat whose template also lists {prompt} is refused', (s) => {
  const seatsPath = join(s.root, 'exchange', 'seats.jsonc');
  const seats = JSON.parse(readFileSync(seatsPath, 'utf8'));
  seats.GPT.start = [FAKE, 'exec', '--json', '-p', '{prompt}', '-o', '{replyFile}', '-'];
  writeFileSync(seatsPath, JSON.stringify(seats), 'utf8');
  const r = runSeat(s.review, 'GPT', 'success');
  if (r.code !== 2) return 'exit ' + r.code + ', expected 2 :: ' + r.out.slice(0, 200);
  if (!/one channel/.test(r.out)) return 'refusal does not name the conflict: ' + r.out.slice(0, 200);
  return true;
});

test('reads a single-envelope seat, taking the reply from the envelope not a file', (s) => {
  stageEnvelope(s);
  const r = runSeat(s.review, 'GEM', 'success', [], { FAKE_SEAT_SHAPE: 'envelope' });
  if (r.code !== 0) return 'exit ' + r.code + ' :: ' + r.out.slice(0, 200);
  if (!/^## \[GEM round 1\]$/m.test(r.md)) return 'no section';
  if (!/guard at src\/a\.ts:12/.test(r.md)) return 'reply not taken from the envelope';
  if (!/<!-- seat: GEM \| thread: 01a0a4d5-/.test(r.md)) return 'thread id not read from the envelope';
  if (!/usage: in=21425/.test(r.md)) return 'usage not read from the envelope';
  return true;
});

test('uses the structured denied_actions field rather than parsing stderr', (s) => {
  stageEnvelope(s);
  const r = runSeat(s.review, 'GEM', 'denied', [], { FAKE_SEAT_SHAPE: 'envelope' });
  if (/## \[GEM round 1\]/.test(r.md)) return 'appended a section for a denied turn';
  // The fake emits NO stderr in envelope-denied mode, so naming the tool proves the
  // structured field was read and not a stderr regex.
  if (!/RunCommand/.test(r.md)) return 'did not name the denied tool from denied_actions: ' + r.md.slice(-200);
  return true;
});

test('an envelope timeout is still a timeout, with no denied_actions to mislead it', (s) => {
  stageEnvelope(s);
  const r = runSeat(s.review, 'GEM', 'timeout', [], { FAKE_SEAT_SHAPE: 'envelope' });
  if (/## \[GEM round 1\]/.test(r.md)) return 'appended a section for a timed-out turn';
  if (!/timed out/.test(r.md)) return 'not reported as a timeout: ' + r.md.slice(-200);
  if (!/in=195056/.test(r.md)) return 'spend on the failed turn not recorded';
  return true;
});

test('the seat is told not to write the file itself', (s) => {
  const r = spawnSync(process.execPath, [RUN, s.review, 'GPT', '--dry-run'], { encoding: 'utf8' });
  if (!/do NOT write the review file/i.test(r.stdout)) return 'seat is not told the record is written for it';
  return true;
});

for (const [name, fn] of cases) {
  const s = stage();
  try {
    const r = fn(s);
    if (r === true) pass(name);
    else fail(name + ' -> ' + r);
  } catch (e) {
    fail(name + ' -> threw ' + e.message);
  } finally {
    try { rmSync(s.root, { recursive: true, force: true }); } catch {}
  }
}

console.log(fails ? `\n${fails} case(s) failed` : '\nall cases passed');
process.exit(fails ? 1 : 0);
