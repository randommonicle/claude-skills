#!/usr/bin/env node
// PostToolUse hook, matcher: Read. context-economy's weakness 1, mechanised as
// far as it can be.
//
// The failure it addresses is premature narrowing: reading a slice and missing
// the thing above it that changes the meaning. LESSONS_LEARNED entry 14 is the
// recorded instance - two wrong conclusions written into DECISIONS, two
// CLAUDE.md files, two repos and three pushes inside an hour, because the state
// that would have corrected both was at line 4 of every transcript and every
// read started below it.
//
// Why this SUPPLIES instead of WARNS. A warning has to assert something, and the
// first version of this control asserted "one read would have been cheaper",
// which a cross-agent review showed is false in the common case: content read
// late is re-sent fewer times than content read early, so several late slices
// routinely beat one early whole-file read. This hook asserts nothing. It hands
// back the lines the slice excluded and lets the reader decide. An assertion-free
// control cannot be untruthful, which is the only way past R-21's bypass-training
// objection to an over-firing warn hook.
//
// What it does NOT do: it cannot tell whether the omitted content mattered. That
// judgement stays with the reader, and the general case of weakness 1 stays
// uncovered. This closes one enumerable sub-case - the head of the file - and
// claims nothing beyond it.
//
// Warn-only, never blocks (R-21). Fail-open: exits 0 on any error.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// How many head lines to supply. DERIVED, not picked, from the two shapes this
// is meant to catch: a YAML frontmatter block is 4 lines at minimum (---, name,
// description, ---), and entry 14's missed state sat at line 4. Five covers both
// with one line of slack. Raising it raises the cost of every fire.
const HEAD_LINES = 5;

// The guard follows from HEAD_LINES rather than being a second free parameter:
// a read starting at or before HEAD_LINES + 1 already contains the head, so
// there is nothing to supply and the hook must stay silent. This is also the
// speed guard - PostToolUse/Read is the most frequent tool call in a session,
// so the common path exits before touching the disk.
const MIN_OFFSET = HEAD_LINES + 1;

const STATE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '.read-head-state');
const STATE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Every other state file in this library is append-only and unpruned. This one
// is per session, so it would grow without bound; it prunes its own directory on
// each write. price-the-spend, applied to a file nobody would ever review.
function prune() {
  try {
    const now = Date.now();
    for (const name of readdirSync(STATE_DIR)) {
      const p = join(STATE_DIR, name);
      if (now - statSync(p).mtimeMs > STATE_MAX_AGE_MS) unlinkSync(p);
    }
  } catch {}
}

function seenBefore(sessionId, filePath) {
  const safe = String(sessionId || 'unknown').replace(/[^A-Za-z0-9_-]/g, '');
  const statePath = join(STATE_DIR, `${safe}.json`);
  let seen = [];
  try {
    seen = JSON.parse(readFileSync(statePath, 'utf8'));
    if (!Array.isArray(seen)) seen = [];
  } catch {}
  if (seen.includes(filePath)) return true;
  seen.push(filePath);
  try {
    mkdirSync(STATE_DIR, { recursive: true });
    writeFileSync(statePath, JSON.stringify(seen));
    prune();
  } catch {}
  return false;
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const input = evt.tool_input ?? {};
    const filePath = input.file_path;
    const offset = Number(input.offset);

    // Common path: no offset, or an offset that already includes the head.
    if (!filePath || !Number.isFinite(offset) || offset < MIN_OFFSET) process.exit(0);

    if (seenBefore(evt.session_id, filePath)) process.exit(0);

    const head = readFileSync(filePath, 'utf8')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .slice(0, HEAD_LINES);
    if (head.every((l) => l.trim() === '')) process.exit(0);

    const message = [
      `context-economy: that read of ${filePath} started at line ${offset}, so lines 1-${HEAD_LINES} were not returned.`,
      'They are below, unprompted, because a slice that excludes the head is how a file gets read without its state.',
      'This says nothing about whether the read was wrong; it only supplies what the slice left out.',
      '',
      ...head.map((line, i) => `${String(i + 1).padStart(3)}  ${line}`),
    ].join('\n');

    process.stdout.write(
      JSON.stringify({
        systemMessage: message,
        hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: message },
      }),
    );
  } catch {}
  process.exit(0);
});
