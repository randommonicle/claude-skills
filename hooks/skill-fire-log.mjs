#!/usr/bin/env node
// PostToolUse hook, matcher: Skill. The rating system's fire log (proposal doc,
// "The rating system"): one JSONL line per skill invocation, machine-local.
// Fail-open by design — a broken fire log must never break a session.
import { appendFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      skill: evt.tool_input?.skill ?? 'unknown',
      args: evt.tool_input?.args ?? null,
      cwd: evt.cwd ?? process.cwd(),
    });
    const dir = join(homedir(), '.claude', 'skills');
    mkdirSync(dir, { recursive: true }); // plugin installs don't create this dir
    appendFileSync(join(dir, 'FIRE_LOG.jsonl'), line + '\n');
  } catch {}
  process.exit(0);
});
