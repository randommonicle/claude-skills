#!/usr/bin/env node
// PostToolUse hook, matcher: Skill. The rating system's fire log (README,
// "The rating system"): one JSONL line per skill invocation, machine-local.
//
// Fail-open by design: a broken fire log must never break a session. It must
// also never fail SILENTLY. The original read only `tool_input.skill` and, when
// that was empty, wrote the sentinel 'unknown'. Across 2026-08-10..09-13 every
// one of 508 lines was 'unknown' and nothing distinguished the sentinel from a
// real reading, so the rating system was blind for a month (LESSONS_LEARNED 11).
// Those events were not Skill calls at all: an Antigravity port of the plugin
// had wired this script to Antigravity's `view_file` tool through a wrapper
// that passes `{cwd, tool_input: {}}`, so every file view in that project became
// one 'unknown' line, while the Claude Code side was never wired.
//
// Two defences now. A fire line is written only for a `Skill` tool event, the
// one class this log measures; a wrapper shape or a loosened matcher is not a
// fire and must not count as one. And whatever cannot be read, a non-Skill
// event or a Skill event with no name, has its SHAPE captured once per shape to
// FIRE_LOG_DEBUG.jsonl (keys only, never the loaded skill text), so an
// unreadable payload is a recorded question rather than an invisible default.
// Delete that file to re-arm the capture.
import { appendFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// The Skill tool's input is {skill, args}; nothing else carries the name.
function readSkillName(evt) {
  const ti = evt.tool_input;
  return ti && typeof ti === 'object' && typeof ti.skill === 'string' ? ti.skill : null;
}

// One debug line per (reason, tool_name) so the file cannot flood, yet a second
// unreadable shape is still recorded after the first.
function captureShape(dir, ts, evt, reason) {
  const debug = join(dir, 'FIRE_LOG_DEBUG.jsonl');
  const toolName = typeof evt.tool_name === 'string' ? evt.tool_name : null;
  if (existsSync(debug)) {
    const seen = readFileSync(debug, 'utf8')
      .split('\n')
      .filter(Boolean)
      .some((line) => {
        try {
          const j = JSON.parse(line);
          return j.reason === reason && (j.tool_name ?? null) === toolName;
        } catch {
          return false;
        }
      });
    if (seen) return;
  }
  const ti = evt.tool_input;
  appendFileSync(
    debug,
    JSON.stringify({
      ts,
      reason,
      event_keys: Object.keys(evt),
      tool_name: toolName,
      tool_input_type: typeof ti,
      tool_input_keys: ti && typeof ti === 'object' ? Object.keys(ti) : null,
      tool_input_sample: JSON.stringify(ti ?? null).slice(0, 300),
      tool_response_keys:
        evt.tool_response && typeof evt.tool_response === 'object'
          ? Object.keys(evt.tool_response)
          : null,
      tool_use_id: evt.tool_use_id ?? null,
      cwd: evt.cwd ?? null,
    }) + '\n',
  );
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const dir = join(homedir(), '.claude', 'skills');
    mkdirSync(dir, { recursive: true }); // plugin installs don't create this dir
    const ts = new Date().toISOString();
    const isSkillEvent = evt.tool_name === 'Skill';
    const skill = isSkillEvent ? readSkillName(evt) : null;

    if (skill === null) captureShape(dir, ts, evt, isSkillEvent ? 'no-skill-name' : 'not-a-skill-event');

    if (isSkillEvent) {
      const ti = evt.tool_input;
      appendFileSync(
        join(dir, 'FIRE_LOG.jsonl'),
        JSON.stringify({
          ts,
          skill: skill ?? 'unknown',
          args: ti && typeof ti === 'object' ? ti.args ?? null : null,
          cwd: evt.cwd ?? process.cwd(),
        }) + '\n',
      );
    }
  } catch {}
  process.exit(0);
});
