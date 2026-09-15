#!/usr/bin/env node
// A fake agent CLI that speaks codex's interface, so every branch of run-seat.mjs has a
// red case without spending money on a real model.
//
// The failure shapes here are not invented. Each was observed on this machine on
// 2026-09-15 and is reproduced exactly, including the parts that lie: a print timeout
// and a permission denial BOTH return exit code 0 with an empty reply, which is why
// run-seat classifies on the reply body and stderr rather than on the exit code.
//
// Mode comes from FAKE_SEAT_MODE. Argv is parsed the way codex's is, so the seat config
// templates can be used unchanged.
import { writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const outIdx = argv.indexOf('-o');
const outFile = outIdx >= 0 ? argv[outIdx + 1] : null;
// A resume is `exec resume <id>` in codex's shape and `--conversation <id>` in agy's. The
// fake read only the first until the seat_turns work of 2026-09-15, so an envelope-shaped
// resume never counted as one and num_turns stayed at 1: the fixture differed from the
// real CLI on the dimension under test.
const resumeIdx = argv.includes('resume') ? argv.indexOf('resume') : argv.indexOf('--conversation');
const isResume = resumeIdx >= 0;
const thread = isResume ? argv[resumeIdx + 1] : '01a0a4d5-3e2a-7e42-93d4-49cb6405bdb5';
const mode = process.env.FAKE_SEAT_MODE ?? 'success';

// Drain stdin: the real CLI reads the prompt there, and a test that never reads it can
// deadlock on a large prompt.
let stdin = '';
process.stdin.on('data', (c) => (stdin += c));
process.stdin.on('end', () => {
  const emit = (o) => process.stdout.write(JSON.stringify(o) + '\n');
  const usage = { input_tokens: isResume ? 42879 : 21425, cached_input_tokens: 0, output_tokens: 16 };

  // What the seat was actually asked, on each channel, for the test that proves the
  // composed prompt arrived where the config says it goes. Without this a fixture is
  // green whether the CLI got the prompt or the literal string "{prompt}" - which is
  // what the real agy seat was handed on 2026-09-15 while every case passed.
  if (process.env.FAKE_SEAT_PROMPT_DUMP) {
    const pIdx = argv.indexOf('-p');
    writeFileSync(
      process.env.FAKE_SEAT_PROMPT_DUMP,
      JSON.stringify({ argvPrompt: pIdx >= 0 ? argv[pIdx + 1] : null, argv, stdin }),
      'utf8',
    );
  }

  // A seat that never answers within the transport's timeoutMs. spawnSync then kills it
  // and reports ETIMEDOUT, which is a different failure from a CLI that could not start.
  if (mode === 'hang') { setTimeout(() => process.exit(0), 5000); return; }

  if (mode === 'exit-127') process.exit(127);

  // agy's shape: ONE envelope on stdout, the reply inside it, no -o file, and a
  // structured denied_actions array on a denial (but never on a timeout - verified
  // against a real run on 2026-09-15).
  if (process.env.FAKE_SEAT_SHAPE === 'envelope') {
    // num_turns is the CLI's own count of conversation turns (measured 2026-09-15: 1 on a
    // tool-using start, 2 after one resume). Overridable so a test can make it disagree
    // with the file, which is the one thing the transport's integrity check must notice.
    const numTurns = process.env.FAKE_SEAT_NUM_TURNS ? Number(process.env.FAKE_SEAT_NUM_TURNS) : isResume ? 2 : 1;
    const env = { conversation_id: thread, status: 'SUCCESS', num_turns: numTurns, usage };
    if (mode === 'denied') {
      env.response = '';
      env.denied_actions = [{ action: 'unsandboxed', display_name: 'RunCommand' }];
    } else if (mode === 'timeout') {
      env.response = '';
      env.usage = { ...usage, input_tokens: 195056 };
      process.stderr.write('[agy] print timeout after 5m30s with turn in progress; returning partial output\n');
    } else if (mode === 'empty') {
      env.response = '';
    } else {
      env.response = 'The guard at src/a.ts:12 is present four lines above where the report says it is missing.\n';
    }
    process.stdout.write(JSON.stringify(env) + '\n');
    process.exit(0);
  }

  emit({ type: 'thread.started', thread_id: thread });
  emit({ type: 'turn.started' });

  switch (mode) {
    // Observed: [agy] print timeout after 5m30s with turn in progress; returning
    // partial output - with status SUCCESS, an empty response and exit code 0.
    case 'timeout':
      process.stderr.write('[agy] print timeout after 5m30s with turn in progress; returning partial output\n');
      emit({ type: 'turn.completed', usage: { ...usage, input_tokens: 195056, output_tokens: 2662 } });
      process.exit(0);

    // Observed twice, wanting a different permission each time for the same task.
    case 'denied':
      process.stderr.write(
        'jetski: no output produced - a tool required the "read_file" permission that headless mode ' +
          'cannot prompt for, so it was auto-denied.\n',
      );
      emit({ type: 'turn.completed', usage });
      process.exit(0);

    // Exit 0, no stderr marker, nothing written. The residual case that only the
    // empty-reply check catches.
    case 'empty':
      emit({ type: 'turn.completed', usage });
      process.exit(0);

    case 'crash':
      process.stderr.write('internal error: model provider unavailable\n');
      process.exit(3);

    // A stale reply file left by an earlier turn must not be banked as this turn's
    // answer, so the success path proves the file is written fresh every time.
    case 'success':
    default:
      if (outFile) {
        writeFileSync(
          outFile,
          isResume
            ? 'Conceded on the citation. My round 1 claim about src/a.ts:12 was wrong.\n'
            : 'The guard at src/a.ts:12 is present four lines above where the report says it is missing.\n',
          'utf8',
        );
      }
      emit({ type: 'item.completed' });
      emit({ type: 'turn.completed', usage });
      process.exit(0);
  }
});
