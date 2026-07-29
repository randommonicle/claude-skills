#!/usr/bin/env node
// PreToolUse hook, matcher: Write|Edit. price-the-spend trigger, mechanised.
// A cron job never mentions cost, so the skill's description cannot match the
// moment that matters. This fires on the write itself: any payload that lands a
// schedule into a workflow or a scheduling config gets the pricing reminder.
// Warn-only, never blocks (ratified R-21: only the push and surgery gates
// block; an over-firing hook trains bypass). Fail-open: exits 0 on any parse error, and
// the skill plus its norm-adjacent memory entry remain the backstop.

// Rule 1: a GitHub Actions workflow, where the payload itself carries the cadence.
// Editing an unrelated step in a scheduled workflow does NOT fire, only a payload
// that introduces or changes the schedule does.
const WORKFLOW_PATH = /\.github[\\/]workflows[\\/].+\.ya?ml$/i;
const WORKFLOW_CADENCE = /(^|\s)(schedule\s*:|-\s*cron\s*:)/im;

// Rule 2: the scheduling configs of the platforms in use, matched by filename.
const CONFIG_NAME = /(^|[\\/])(vercel\.json|wrangler\.toml|netlify\.toml|crontab|.+\.cron)$/i;
const CONFIG_CADENCE = /\bcrons?\b/i;

const MESSAGE = [
  'price-the-spend: this payload lands a recurring schedule.',
  'Price it BEFORE it ships: billed units per run x runs per month, then as a percentage of the allowance.',
  'GitHub Actions bills per job ROUNDED UP to the whole minute, and private repos are metered.',
  'Actual billable time: gh api repos/OWNER/REPO/actions/runs/RUN_ID/timing',
  'A job that cannot fail anything (continue-on-error, or not a required check) must justify its cost some other way, or run less often.',
].join(' ');

// The written text, across the shapes the edit tools use.
function payload(input) {
  if (!input) return '';
  const parts = [input.content, input.new_string];
  if (Array.isArray(input.edits)) parts.push(...input.edits.map((e) => e?.new_string));
  return parts.filter((p) => typeof p === 'string').join('\n');
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const path = evt.tool_input?.file_path ?? '';
    const text = payload(evt.tool_input);
    const hit =
      (WORKFLOW_PATH.test(path) && WORKFLOW_CADENCE.test(text)) ||
      (CONFIG_NAME.test(path) && CONFIG_CADENCE.test(text));
    if (hit) {
      process.stdout.write(
        JSON.stringify({
          systemMessage: MESSAGE,
          hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: MESSAGE },
        }),
      );
    }
  } catch {}
  process.exit(0);
});
