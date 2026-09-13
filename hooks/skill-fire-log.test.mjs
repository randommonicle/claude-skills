#!/usr/bin/env node
// Proves skill-fire-log.mjs records a real skill name when the event carries one,
// writes a fire line ONLY for a Skill tool event, and captures the SHAPE of
// anything it cannot read to FIRE_LOG_DEBUG.jsonl instead of silently logging
// 'unknown'. Case 2 is the exact payload Antigravity's agy-wrapper.mjs emitted
// for every `view_file` in one project, 508 times over 2026-08-10..09-13, and the
// original hook logged each as a fire; it reds against that hook and against
// any version without the Skill gate (LESSONS_LEARNED 11).
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

// Run the hook once per event, all in one isolated HOME so sequences (the
// once-per-shape capture) are real, never the real ~/.claude/skills.
// os.homedir() reads USERPROFILE on Windows, HOME on posix, so set both.
function runHook(events) {
  const home = mkdtempSync(join(tmpdir(), 'fire-log-'));
  const one = (event) =>
    new Promise((resolve) => {
      const p = spawn(process.execPath, [HOOK], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, HOME: home, USERPROFILE: home },
      });
      p.on('close', resolve);
      p.stdin.end(typeof event === 'string' ? event : JSON.stringify(event));
    });
  return (async () => {
    const codes = [];
    for (const e of events) codes.push(await one(e));
    const skillsDir = join(home, '.claude', 'skills');
    const readJsonl = (name) => {
      const f = join(skillsDir, name);
      return existsSync(f)
        ? readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
        : [];
    };
    const res = { codes, log: readJsonl('FIRE_LOG.jsonl'), debug: readJsonl('FIRE_LOG_DEBUG.jsonl') };
    try {
      rmSync(home, { recursive: true, force: true });
    } catch {}
    return res;
  })();
}

// The payload agy-wrapper.mjs builds for a `view_file` event: no tool_name, no
// hook_event_name, an empty tool_input, and the workspace path as cwd.
const WRAPPER_VIEW_FILE = { cwd: 'c:/Users/x/Projects/p', tool_input: {} };

const run = async () => {
  // 1. Explicit Skill call: the name is read from tool_input.skill, no debug capture.
  {
    const r = await runHook([
      {
        hook_event_name: 'PostToolUse',
        tool_name: 'Skill',
        tool_input: { skill: 'unslop-text', args: null },
        cwd: '/repo/x',
      },
    ]);
    if (r.log.length === 1 && r.log[0].skill === 'unslop-text' && r.log[0].cwd === '/repo/x')
      pass('explicit Skill call logs the real skill name');
    else fail('explicit Skill call should log skill=unslop-text, got ' + JSON.stringify(r.log));
    if (r.debug.length === 0) pass('explicit Skill call writes no debug capture');
    else fail('explicit Skill call should not write a debug capture, got ' + JSON.stringify(r.debug));
  }

  // 2. The wrapper shape, twice, then a non-Skill Claude Code tool: no fire
  //    lines at all, and one debug line per distinct shape (the repeat is
  //    deduped, the different tool_name is not).
  {
    const r = await runHook([
      WRAPPER_VIEW_FILE,
      WRAPPER_VIEW_FILE,
      { hook_event_name: 'PostToolUse', tool_name: 'ListSkills', tool_input: {}, cwd: '/repo/z' },
    ]);
    if (r.log.length === 0) pass('non-Skill events write no fire line (the 508-line failure class)');
    else fail('non-Skill events should write no fire line, got ' + JSON.stringify(r.log));
    const reasons = r.debug.map((d) => d.reason + ':' + d.tool_name);
    if (reasons.length === 2 && reasons[0] === 'not-a-skill-event:null' && reasons[1] === 'not-a-skill-event:ListSkills')
      pass('each unreadable shape is captured once (repeat deduped, new tool_name recorded)');
    else fail('expected two not-a-skill-event captures [null, ListSkills], got ' + JSON.stringify(reasons));
    if (r.debug[0] && r.debug[0].cwd === 'c:/Users/x/Projects/p' && JSON.stringify(r.debug[0].tool_input_keys) === '[]')
      pass('wrapper capture records the empty tool_input and the producing cwd');
    else fail('wrapper capture should record tool_input_keys=[] and the cwd, got ' + JSON.stringify(r.debug[0]));
  }

  // 3. A Skill event with no name: still counts as a fire (skill=unknown) AND
  //    captures the shape, keys only.
  {
    const r = await runHook([
      {
        hook_event_name: 'PostToolUse',
        tool_name: 'Skill',
        tool_input: {},
        tool_response: { content: 'SECRET SKILL BODY' },
        tool_use_id: 'toolu_1',
        cwd: '/repo/y',
      },
    ]);
    if (r.log.length === 1 && r.log[0].skill === 'unknown')
      pass('nameless Skill event still logs a fire line (skill=unknown)');
    else fail('nameless Skill event should log skill=unknown, got ' + JSON.stringify(r.log));
    if (r.debug.length === 1 && r.debug[0].reason === 'no-skill-name' && r.debug[0].tool_name === 'Skill')
      pass('nameless Skill event captures the event shape (loud, not silent)');
    else fail('nameless Skill event should write one no-skill-name capture, got ' + JSON.stringify(r.debug));
    if (JSON.stringify(r.debug).indexOf('SECRET SKILL BODY') === -1)
      pass('debug capture records keys only, not tool_response content');
    else fail('debug capture leaked tool_response content');
  }

  // 4. Fail-open: malformed stdin must not crash the session.
  {
    const r = await runHook(['not json at all']);
    if (r.codes[0] === 0) pass('malformed stdin exits 0 (fail-open)');
    else fail('malformed stdin should exit 0, got code ' + r.codes[0]);
  }

  console.log(fails ? `\n${fails} case(s) failed` : '\nall cases passed');
  process.exit(fails ? 1 : 0);
};
run();
