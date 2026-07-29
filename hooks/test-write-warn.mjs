#!/usr/bin/env node
// PreToolUse hook, matcher: Write|Edit. safe-smokes plus prove-it-can-fail
// triggers, mechanised. Writing a test is never a request for test-safety
// advice, so neither skill's description can match the moment that matters: the
// prompt says "add a smoke for the demand gate", the risk arrives silently in
// the payload. This fires on the write itself.
//
// Measured misses (both after the skills existed, both from the misses log):
// 2026-07-24, a smoke's service-role anchor was cross-tenant, safe-smokes named
// as the skill that should have prevented it. 2026-07-27,
// expect(error).not.toBeNull() shipped as a security assertion, when an error
// having occurred proves nothing about WHICH error occurred.
//
// Standing norm restated in the message, not argued: destructive operations
// against shared or live data in tests are never acceptable; flip-and-restore in
// try/finally. Warn-only, never blocks (ratified R-21: only the push gate
// blocks; an over-firing hook trains bypass). Fail-open: exits 0 on any parse
// error, and the two skills remain the backstop.

// Gate 1, the path is test-shaped. Filename carries .spec. or .test., or a path
// segment names a test tree. Both slash styles, because the payload arrives with
// whatever separator the caller typed.
const TEST_FILENAME = /\.(spec|test)\./i;
const TEST_SEGMENT = /(^|[\\/])(tests?|smokes?|e2e)[\\/]/i;

// Gate 2, rule A: a delete aimed at a database, not at a collection. A test that
// calls .delete( on a Map or a Set is ordinary and must stay quiet, so the bare
// call is never enough: the payload must also name a database client. Array.from
// and Buffer.from are excluded from the .from( signal because they are the
// common way a test builds the very Map whose .delete( would otherwise pair with
// them.
const DELETE_CALL = /\.delete\s*\(/;
const DB_CONTEXT =
  /(?<!Array|Buffer)\.from\s*\(|supabase|\bknex\b|\bprisma\b|new\s+Pool\s*\(|\b(?:pool|client|db|conn)\s*\.\s*query\s*\(|from\s+['"]pg['"]|require\(\s*['"]pg['"]/i;
// Raw SQL needs no client to be destructive. A word character after the keyword
// keeps a truncate(str, n) helper out of it.
const RAW_DESTRUCTIVE = /\bDELETE\s+FROM\s+["'`\w]|\bTRUNCATE\s+(?:TABLE\s+)?["'`\w]/i;

// Rule B: any spelling of the service-role credential.
const SERVICE_ROLE = /service_?role/i;

// Rule C: an assertion that an error exists and nothing more. The subject must be
// a bare error identifier, so expect(error.code).toBe(...) is identity done right
// and stays quiet. toBeNull only counts under .not, because expect(error)
// .toBeNull() is the happy-path assertion, the opposite failure.
const ERROR_IDENTITY_FREE =
  /expect\s*\(\s*(?:[\w$]+\s*\.\s*)*(?:error|err|e)\s*\)\s*\.\s*(?:not\s*\.\s*toBeNull|toBeTruthy|toBeDefined)\s*\(/i;

const PREFIX = 'test-write-warn:';

// One line per rule, in rule order, so a payload that trips two carries both.
const RULES = [
  {
    hit: (t) => (DELETE_CALL.test(t) && DB_CONTEXT.test(t)) || RAW_DESTRUCTIVE.test(t),
    line: 'if this touches a shared or live database, flip-and-restore in try/finally instead of deleting; seed in beforeAll, restore exactly as found in afterAll.',
  },
  {
    hit: (t) => SERVICE_ROLE.test(t),
    line: 'a service-role client bypasses RLS, so every anchor it fetches is cross-tenant; pin the tenant explicitly, and a spec that skips without the key is a skip, not a pass.',
  },
  {
    hit: (t) => ERROR_IDENTITY_FREE.test(t),
    line: 'assert which error (code or message), not that one occurred; the wrong failure also produces an error, so this assertion cannot distinguish the guard from a typo.',
  },
];

// The written text, across the shapes the edit tools use.
function payload(input) {
  if (!input) return '';
  const parts = [input.content, input.new_string];
  if (Array.isArray(input.edits)) parts.push(...input.edits.map((e) => e?.new_string));
  return parts.filter((p) => typeof p === 'string').join('\n');
}

function testShaped(path) {
  return TEST_FILENAME.test(path) || TEST_SEGMENT.test(path);
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const path = evt.tool_input?.file_path ?? '';
    const text = payload(evt.tool_input);
    if (testShaped(path)) {
      const lines = RULES.filter((r) => r.hit(text)).map((r) => `${PREFIX} ${r.line}`);
      if (lines.length) {
        const message = lines.join('\n');
        process.stdout.write(
          JSON.stringify({
            systemMessage: message,
            hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: message },
          }),
        );
      }
    }
  } catch {}
  process.exit(0);
});
