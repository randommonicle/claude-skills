#!/usr/bin/env node
// PostToolUse hook, matcher: Skill. The rating system's fire log (README,
// "The rating system"): one JSONL line per skill invocation, machine-local.
//
// Fail-open by design: a broken fire log must never break a session. It must
// also never fail SILENTLY. The original read only `tool_input.skill` and, when
// that was empty, wrote the sentinel 'unknown'; across 2026-08-10..09-09 every
// one of 503 lines was 'unknown', and nothing distinguished the sentinel from a
// real reading, so the rating system was blind for a month (LESSONS_LEARNED 11).
// When no name can be read now, the event SHAPE (keys only, never the loaded
// skill text) is captured once to FIRE_LOG_DEBUG.jsonl, so an unreadable payload
// is a recorded question rather than an invisible default. Delete that file to
// re-arm the capture; once the true key is known, add it to readSkillName below.
import { appendFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Explicit Skill() tool_use carries the name in tool_input.skill. Auto-activated
// skills arrive as a different event class whose payload shape is not yet pinned
// (2026-08 data: 503 fires, none with tool_input.skill); the alternates below
// are cheap guesses, and the debug capture records the true shape the first time
// all of them miss.
function readSkillName(evt) {
  const ti = evt.tool_input;
  if (ti && typeof ti === 'object') {
    if (typeof ti.skill === 'string') return ti.skill;
    if (typeof ti.name === 'string') return ti.name;
    if (typeof ti.skill_name === 'string') return ti.skill_name;
  }
  if (typeof evt.skill === 'string') return evt.skill;
  if (typeof evt.skill_name === 'string') return evt.skill_name;
  return null;
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const dir = join(homedir(), '.claude', 'skills');
    mkdirSync(dir, { recursive: true }); // plugin installs don't create this dir
    const ts = new Date().toISOString();
    const skill = readSkillName(evt);

    if (skill === null) {
      // Capture the shape ONCE so the file does not flood with identical events.
      // Keys only: tool_response is the loaded skill body and may be regulated
      // content, so it is never written, only its key set.
      const debug = join(dir, 'FIRE_LOG_DEBUG.jsonl');
      if (!existsSync(debug) || statSync(debug).size === 0) {
        const ti = evt.tool_input;
        appendFileSync(
          debug,
          JSON.stringify({
            ts,
            reason: 'no-skill-name',
            event_keys: Object.keys(evt),
            tool_name: evt.tool_name ?? null,
            tool_input_type: typeof evt.tool_input,
            tool_input_keys: ti && typeof ti === 'object' ? Object.keys(ti) : null,
            tool_input_sample: JSON.stringify(ti ?? null).slice(0, 300),
            tool_response_keys:
              evt.tool_response && typeof evt.tool_response === 'object'
                ? Object.keys(evt.tool_response)
                : null,
            tool_use_id: evt.tool_use_id ?? null,
          }) + '\n',
        );
      }
    }

    const ti = evt.tool_input;
    const args = ti && typeof ti === 'object' ? ti.args ?? null : null;
    appendFileSync(
      join(dir, 'FIRE_LOG.jsonl'),
      JSON.stringify({
        ts,
        skill: skill ?? 'unknown',
        args,
        cwd: evt.cwd ?? process.cwd(),
      }) + '\n',
    );
  } catch {}
  process.exit(0);
});
