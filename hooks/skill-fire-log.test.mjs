#!/usr/bin/env node
// Proves skill-fire-log.mjs records a real skill name when the event carries one
// AND that when it cannot read a name it captures the event SHAPE to
// FIRE_LOG_DEBUG.jsonl instead of silently logging 'unknown'. The nameless-event
// case (2) reds against the original hook, which wrote no debug line: that is the
// prove-it-can-fail case the original lacked, and the reason 503 'unknown' lines
// went undetected for a month (LESSONS_LEARNED 11).
// Run: node hooks/skill-fire-log.test.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'skill-fire-log.mjs');
let fails = 0;
const pass = (m) => console.log('PASS  | ' + m);
const fail = (m) => {
  console.log('FAIL  | ' + m);
  fails++;
};

// Run the hook with an isolated HOME so it writes into a throwaway dir, never the
// real ~/.claude/skills. os.homedir() reads USERPROFILE on Windows, HOME on
// posix, so set both.
function runHook(event) {
  return new Promise((resolve) => {
    const home = mkdtempSync(join(tmpdir(), 'fire-log-'));
    const p = spawn(process.execPath, [HOOK], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, HOME: home, USERPROFILE: home },
    });
    p.on('close', (code) => {
      const skillsDir = join(home, '.claude', 'skills');
      const readJsonl = (name) => {
        const f = join(skillsDir, name);
        return existsSync(f)
          ? readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
          : [];
      };
      const res = { code, log: readJsonl('FIRE_LOG.jsonl'), debug: readJsonl('FIRE_LOG_DEBUG.jsonl') };
      try {
        rmSync(home, { recursive: true, force: true });
      } catch {}
      resolve(res);
    });
    p.stdin.end(typeof event === 'string' ? event : JSON.stringify(event));
  });
}

const run = async () => {
  // 1. Explicit call: the name is read from tool_input.skill, no debug capture.
  {
    const r = await runHook({
      hook_event_name: 'PostToolUse',
      tool_name: 'Skill',
      tool_input: { skill: 'unslop-text', args: null },
      cwd: '/repo/x',
    });
    if (r.log.length === 1 && r.log[0].skill === 'unslop-text' && r.log[0].cwd === '/repo/x')
      pass('explicit call logs the real skill name');
    else fail('explicit call should log skill=unslop-text, got ' + JSON.stringify(r.log));
    if (r.debug.length === 0) pass('explicit call writes no debug capture');
    else fail('explicit call should not write a debug capture, got ' + JSON.stringify(r.debug));
  }

  // 2. Nameless event (the real failure class): logs 'unknown' AND captures the
  //    shape. The pre-fix hook wrote no debug line, so this case reds against it.
  {
    const r = await runHook({
      hook_event_name: 'PostToolUse',
      tool_name: 'Skill',
      tool_input: {},
      tool_response: { content: 'SECRET SKILL BODY' },
      tool_use_id: 'toolu_1',
      cwd: '/repo/y',
    });
    if (r.log.length === 1 && r.log[0].skill === 'unknown')
      pass('nameless event still logs a line (skill=unknown)');
    else fail('nameless event should log skill=unknown, got ' + JSON.stringify(r.log));
    if (r.debug.length === 1 && r.debug[0].reason === 'no-skill-name')
      pass('nameless event captures the event shape (loud, not silent)');
    else fail('nameless event should write one debug capture, got ' + JSON.stringify(r.debug));
    if (JSON.stringify(r.debug).indexOf('SECRET SKILL BODY') === -1)
      pass('debug capture records keys only, not tool_response content');
    else fail('debug capture leaked tool_response content');
  }

  // 3. Fail-open: malformed stdin must not crash the session.
  {
    const r = await runHook('not json at all');
    if (r.code === 0) pass('malformed stdin exits 0 (fail-open)');
    else fail('malformed stdin should exit 0, got code ' + r.code);
  }

  console.log(fails ? `\n${fails} case(s) failed` : '\nall cases passed');
  process.exit(fails ? 1 : 0);
};
run();
