#!/usr/bin/env node
// PreToolUse hook, matcher: Bash. live-data-surgery backstop: logs any shell
// command carrying destructive SQL so an unprotocolled sweep is at least
// visible after the fact. Warn-and-log, fail-open, never blocks (ratified
// R-21: only the push gate blocks; an over-firing hook trains bypass).
// Promotion path per the rating ladder: if the misses log shows this being
// too quiet, promote to permissionDecision "ask".
import { appendFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const DESTRUCTIVE = /\b(DELETE\s+FROM|TRUNCATE\s+(TABLE\s+)?\w|DROP\s+TABLE)\b/i;

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const cmd = evt.tool_input?.command ?? '';
    if (DESTRUCTIVE.test(cmd)) {
      appendFileSync(
        join(homedir(), '.claude', 'skills', 'SURGERY_LOG.jsonl'),
        JSON.stringify({ ts: new Date().toISOString(), cwd: evt.cwd ?? '', command: cmd.slice(0, 500) }) + '\n',
      );
    }
  } catch {}
  process.exit(0);
});
