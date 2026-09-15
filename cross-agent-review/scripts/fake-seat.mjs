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
const isResume = argv.includes('resume');
const thread = isResume ? argv[argv.indexOf('resume') + 1] : '01a0a4d5-3e2a-7e42-93d4-49cb6405bdb5';
const mode = process.env.FAKE_SEAT_MODE ?? 'success';

// Drain stdin: the real CLI reads the prompt there, and a test that never reads it can
// deadlock on a large prompt.
let stdin = '';
process.stdin.on('data', (c) => (stdin += c));
process.stdin.on('end', () => {
  const emit = (o) => process.stdout.write(JSON.stringify(o) + '\n');
  const usage = { input_tokens: isResume ? 42879 : 21425, cached_input_tokens: 0, output_tokens: 16 };

  if (mode === 'missing-binary') process.exit(127);

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
