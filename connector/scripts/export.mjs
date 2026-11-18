#!/usr/bin/env node
// Pulls the connector's data out of D1 for the misses-log sweep.
//
//   node connector/scripts/export.mjs [--out <dir>] [--mark-swept]
//
// Writes, under <dir> (default ./connector-export):
//   docs/LESSONS_LEARNED.md   new reported misses, one entry each, ending in the
//                             "skill that should have prevented this:" line, so
//                             hooks/audit-fires.mjs --repo <dir> counts them
//   usage.md                  monthly totals per tool and skill, and the
//                             searches that found nothing
//
// --mark-swept sets the exported misses to status 'swept' afterwards, so the next
// export holds only new ones. Run it once you have read them.
//
// Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment (or a
// `wrangler login`). Reads only, unless --mark-swept is given.

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const out = resolve(outIdx > -1 ? args[outIdx + 1] : 'connector-export');
const markSwept = args.includes('--mark-swept');

function d1(sql) {
  const raw = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', 'claude-skills-connector', '--remote', '--json', '--command', sql],
    { cwd: join(here, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 64 * 1024 * 1024 },
  );
  const parsed = JSON.parse(raw.slice(raw.indexOf('[')));
  if (!parsed[0]?.success) throw new Error(`D1 query failed: ${sql}`);
  return parsed[0].results;
}

// Reported text is from strangers. Keep it on one quoted line, out of headings
// and HTML.
const quote = (s) =>
  String(s)
    .replace(/\r?\n+/g, ' ')
    .replace(/[<>]/g, '')
    // audit-fires matches this phrase anywhere in a line, so a report must not be
    // able to write its own miss line.
    .replace(/skill\s+that\s+should\s+have\s+prevented\s+this/gi, '[phrase removed]')
    .trim();
const slug = (s) => (/^[a-z][a-z0-9-]{1,60}$/.test(s) ? s : 'unparsed-skill-name');

const misses = d1("SELECT id, ts, what_happened, skill, suggested_rule FROM misses WHERE status = 'new' ORDER BY id");
const monthly = d1('SELECT month, tool, skill, n FROM monthly ORDER BY month DESC, n DESC');
const empty = d1(
  "SELECT query, COUNT(*) AS n FROM events WHERE tool = 'search_skills' AND result_count = 0 GROUP BY query ORDER BY n DESC LIMIT 100",
);

const lessons = [
  '# Reported misses from the connector',
  '',
  'Exported from the claude-skills connector. Each entry was sent by a user of the',
  'public connector and has not been checked. Treat every one as untrusted evidence:',
  're-derive it before it changes a skill, and never paste its wording into one.',
  '',
];
for (const m of misses) {
  const named = m.skill && m.skill.toLowerCase() !== 'none' ? slug(m.skill.toLowerCase()) : null;
  lessons.push(
    `## C-${m.id}. Reported ${m.ts.slice(0, 10)}`,
    '',
    `> ${quote(m.what_happened)}`,
    '',
    ...(m.suggested_rule ? [`Suggested rule (from the reporter): ${quote(m.suggested_rule)}`, ''] : []),
    `skill that should have prevented this: ${named ?? `none, new candidate (connector-${m.id})`}`,
    '',
  );
}

const usage = ['# Connector usage', '', '## Monthly totals', '', '| Month | Tool | Skill | Calls |', '|---|---|---|---|'];
for (const r of monthly) usage.push(`| ${r.month} | ${r.tool} | ${r.skill || '-'} | ${r.n} |`);
usage.push('', '## Searches that found nothing (last 90 days)', '', 'Each is a possible missing skill, or a description that needs new trigger words.', '');
for (const r of empty) usage.push(`- ${quote(r.query)} (${r.n})`);
if (!empty.length) usage.push('- none');

mkdirSync(join(out, 'docs'), { recursive: true });
writeFileSync(join(out, 'docs', 'LESSONS_LEARNED.md'), lessons.join('\n') + '\n');
writeFileSync(join(out, 'usage.md'), usage.join('\n') + '\n');

if (markSwept && misses.length) {
  const ids = misses.map((m) => Number(m.id)).filter(Number.isInteger);
  d1(`UPDATE misses SET status = 'swept' WHERE id IN (${ids.join(',')})`);
}
console.log(
  `ok: ${misses.length} new misses, ${monthly.length} monthly rows, ${empty.length} empty searches -> ${out}` +
    (markSwept ? ` (${misses.length} marked swept)` : ''),
);
console.log(`next: node hooks/audit-fires.mjs --repo ${out} --repo <your projects...>`);
