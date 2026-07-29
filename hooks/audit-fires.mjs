#!/usr/bin/env node
// CLI analysis tool, NOT an event hook. Run it on the machine where the data
// lives: node hooks/audit-fires.mjs [--fire-log <path>] [--repo <path>]...
//
// Scores the rating system (README, "The rating system") by reading the fire log
// that skill-fire-log.mjs appends against the misses log carried in each repo's
// docs/LESSONS_LEARNED.md. Fires alone can never demote a skill, because the fire
// log is structurally blind to three layers: the six always-on norms are
// CLAUDE.md text and never a Skill call, the hooks enforce without one, and
// knowledge applied from memory leaves no line at all. So every never-fired
// skill prints with its layer tag, and a zero cannot be misread as dormancy.
//
// Fail-open per line, fail-loud per file: a malformed JSONL line is skipped and
// counted, a missing log prints a notice and the run continues. Nothing here
// reads the clock, so two runs over the same data print the same rows.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE = 'usage: node hooks/audit-fires.mjs [--fire-log <path>] [--repo <path>]...';

// Anthropic built-ins land in ~/.claude/skills beside the library once it is
// installed there. They are not the maintainer's, so they stay out of the
// inventory and out of the never-fired list.
const BUILTINS = new Set(['docx', 'pdf', 'pptx', 'xlsx', 'morning', 'skill-creator', 'session-start-hook']);

// The layers this log cannot see, hardcoded because that is what makes a zero readable.
const NORMS = new Set([
  'verify-the-effect',
  'live-state-first',
  'no-silent-data-drop',
  'honest-failure-surfacing',
  'prove-it-can-fail',
  'findings-are-evidence',
]);
const HOOK_BACKED = new Set(['confirm-before-push', 'price-the-spend']);
const NORM_TAG = 'norm: always-on, invisible to this log';
const HOOK_TAG = 'hook-backed: enforced without a Skill call';

const MISS_LINE = /skill that should have prevented this:\s*(.+)/i;

function layerTag(skill) {
  if (NORMS.has(skill)) return NORM_TAG;
  if (HOOK_BACKED.has(skill)) return HOOK_TAG;
  return '';
}

function notice(msg) {
  console.log(`notice: ${msg}`);
}

function reason(err) {
  return err.code === 'ENOENT' ? 'file not found' : err.message;
}

function parseArgs(argv) {
  const opts = { fireLog: join(homedir(), '.claude', 'skills', 'FIRE_LOG.jsonl'), repos: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--fire-log' || arg === '--repo') {
      const value = argv[++i];
      if (!value) die(`${arg} needs a path`);
      if (arg === '--repo') opts.repos.push(value);
      else opts.fireLog = value;
    } else if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else {
      die(`unknown argument: ${arg}`);
    }
  }
  return opts;
}

function die(msg) {
  console.error(`audit-fires: ${msg}\n${USAGE}`);
  process.exit(1);
}

// The inventory is the library root's own subdirectories, so it cannot drift from
// what is installed. A directory without a SKILL.md (docs/, hooks/) is not a skill.
function inventory(root) {
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch (err) {
    notice(`skill inventory unreadable at ${root}: ${reason(err)}`);
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !BUILTINS.has(e.name))
    .map((e) => e.name)
    .filter((name) => existsSync(join(root, name, 'SKILL.md')))
    .sort();
}

function readFires(path) {
  const perSkill = new Map();
  const sessions = new Set();
  const result = { perSkill, sessions, total: 0, skipped: 0, read: false };
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (err) {
    notice(`fire log not read at ${path}: ${reason(err)} (every skill will show as never fired)`);
    return result;
  }
  result.read = true;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue; // a blank line is not a malformed one
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      result.skipped++;
      continue;
    }
    if (!rec || typeof rec.skill !== 'string' || !rec.skill.trim()) {
      result.skipped++;
      continue;
    }
    const skill = rec.skill.trim();
    const ts = typeof rec.ts === 'string' ? rec.ts : '';
    const cwd = typeof rec.cwd === 'string' ? rec.cwd : '';
    let row = perSkill.get(skill);
    if (!row) {
      row = { skill, count: 0, first: '', last: '', cwds: new Set() };
      perSkill.set(skill, row);
    }
    row.count++;
    // ISO 8601 UTC strings sort chronologically as strings, so no clock is needed.
    if (ts && (!row.first || ts < row.first)) row.first = ts;
    if (ts && ts > row.last) row.last = ts;
    if (cwd) row.cwds.add(cwd);
    // Session proxy: one calendar day in one working directory.
    sessions.add(`${ts.slice(0, 10) || 'no-date'}|${cwd || 'no-cwd'}`);
    result.total++;
  }
  return result;
}

// Split a miss value on top-level "/" only, so an aside like "(app/tests half)"
// survives as one part.
function splitTop(value) {
  const parts = [];
  let buf = '';
  let depth = 0;
  for (const ch of value) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === '/' && depth === 0) {
      parts.push(buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  parts.push(buf);
  return parts.filter((p) => p.trim());
}

// One part of a miss value: a named skill, a new candidate, or unparsable.
function classify(part) {
  const aside = /\(([^)]*)\)/.exec(part);
  const bare = part
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[`*_]/g, ' ')
    .trim();
  if (!bare || /^none\b/i.test(bare)) {
    return { kind: 'candidate', slug: aside ? aside[1].trim() : '(no slug given)' };
  }
  const name = /^([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/i.exec(bare);
  if (name) return { kind: 'skill', name: name[1].toLowerCase() };
  return { kind: 'unparsed', text: part.trim() };
}

function readMisses(repo) {
  const path = join(repo, 'docs', 'LESSONS_LEARNED.md');
  const label = basename(repo) || repo;
  const result = { repo, path, label, named: new Map(), candidates: new Map(), unparsed: [], lines: 0, read: false };
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (err) {
    notice(`misses log not read at ${path}: ${reason(err)} (no misses counted for ${label})`);
    return result;
  }
  result.read = true;
  for (const line of text.split(/\r?\n/)) {
    const m = MISS_LINE.exec(line);
    if (!m) continue;
    result.lines++;
    const seen = new Set(); // a line names a given skill once, however often it repeats
    for (const part of splitTop(m[1])) {
      const item = classify(part);
      if (item.kind === 'skill') {
        if (seen.has(item.name)) continue;
        seen.add(item.name);
        result.named.set(item.name, (result.named.get(item.name) ?? 0) + 1);
      } else if (item.kind === 'candidate') {
        result.candidates.set(item.slug, (result.candidates.get(item.slug) ?? 0) + 1);
      } else {
        result.unparsed.push(item.text);
      }
    }
  }
  return result;
}

function printTable(headers, rows, align = '') {
  const widths = headers.map((h, i) =>
    Math.max(String(h).length, ...rows.map((r) => String(r[i] ?? '').length)),
  );
  const fmt = (cells) =>
    cells
      .map((c, i) => (align[i] === 'r' ? String(c ?? '').padStart(widths[i]) : String(c ?? '').padEnd(widths[i])))
      .join('  ')
      .trimEnd();
  console.log(`  ${fmt(headers)}`);
  console.log(`  ${widths.map((w) => '-'.repeat(w)).join('  ')}`);
  for (const row of rows) console.log(`  ${fmt(row)}`);
}

function section(title) {
  console.log(`\n${title}`);
}

const opts = parseArgs(process.argv.slice(2));
const libraryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const skills = inventory(libraryRoot);

console.log('audit-fires: the rating system scorecard, fires against misses.');
console.log(`fire log: ${opts.fireLog}`);
console.log(`library:  ${libraryRoot} (${skills.length} skills in inventory, built-ins excluded)`);
console.log('This log cannot see three layers, so a zero is not dormancy: the six always-on');
console.log('norms are CLAUDE.md text and never a Skill call, the hooks enforce without one,');
console.log('and knowledge applied without loading a skill leaves no line.');
console.log('');

const fires = readFires(opts.fireLog);
if (!opts.repos.length) notice('no --repo given, so no misses log was read (sections 3 and 4 count zero misses)');
const misses = opts.repos.map(readMisses);

// 1. Fires per skill.
section('1. FIRES PER SKILL');
const fireRows = [...fires.perSkill.values()].sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
if (fireRows.length) {
  printTable(
    ['skill', 'fires', 'first ts', 'last ts', 'cwds'],
    fireRows.map((r) => [r.skill, r.count, r.first || '(no ts)', r.last || '(no ts)', r.cwds.size]),
    'lrllr',
  );
} else {
  console.log('  (no fires recorded)');
}
console.log(`  malformed lines skipped: ${fires.skipped}`);
const strangers = fireRows.map((r) => r.skill).filter((s) => !skills.includes(s));
if (strangers.length) console.log(`  fired but outside the inventory (built-in or retired): ${strangers.join(', ')}`);

// 2. Never fired, each with its layer tag.
section('2. NEVER FIRED (zero lines in the fire log)');
const never = skills.filter((s) => !fires.perSkill.has(s));
if (never.length) {
  printTable(
    ['skill', 'why a zero may be expected'],
    never.map((s) => [s, layerTag(s) || 'no layer tag: a zero here is a real question']),
  );
} else {
  console.log('  (every inventoried skill has fired at least once)');
}

// 3. Misses per skill, from each repo's lessons log.
section('3. MISSES PER SKILL (docs/LESSONS_LEARNED.md)');
const namedTotals = new Map();
const candidateRows = [];
let missLines = 0;
for (const m of misses) {
  missLines += m.lines;
  for (const [skill, n] of m.named) {
    const row = namedTotals.get(skill) ?? { count: 0, repos: new Set() };
    row.count += n;
    row.repos.add(m.label);
    namedTotals.set(skill, row);
  }
  for (const [slug, n] of m.candidates) candidateRows.push([slug, m.label, n]);
}
if (misses.length) {
  console.log(`  misses logs scanned: ${misses.map((m) => m.path).join(', ')}`);
  console.log(`  miss lines matched: ${missLines}`);
}
const namedRows = [...namedTotals.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));
if (namedRows.length) {
  printTable(
    ['skill', 'misses', 'repos', 'note'],
    namedRows.map(([skill, row]) => [
      skill,
      row.count,
      [...row.repos].sort().join(', '),
      skills.includes(skill) ? '' : 'not in inventory',
    ]),
    'lrll',
  );
} else {
  console.log('  (no named misses)');
}
console.log('');
console.log('  new candidates (no existing skill would have prevented it):');
if (candidateRows.length) {
  printTable(
    ['slug', 'repo', 'times'],
    candidateRows.sort((a, b) => b[2] - a[2] || String(a[0]).localeCompare(String(b[0]))),
    'llr',
  );
} else {
  console.log('  (none)');
}
const unparsed = misses.flatMap((m) => m.unparsed);
if (unparsed.length) {
  console.log('');
  console.log(`  miss values that did not parse (${unparsed.length}), counted nowhere:`);
  for (const u of unparsed) console.log(`    ${u}`);
}

// 4. Summary, plus the only cross-reference that can move a tier.
section('4. SUMMARY');
const namedMisses = namedRows.reduce((sum, [, row]) => sum + row.count, 0);
const candidateMisses = candidateRows.reduce((sum, row) => sum + row[2], 0);
const sessionCount = fires.sessions.size;
const perSession = sessionCount ? (fires.total / sessionCount).toFixed(1) : 'n/a';
printTable(
  ['measure', 'value'],
  [
    ['total fires', fires.total],
    ['sessions (proxy: date + cwd, not a real session id)', sessionCount],
    ['fires per session', perSession],
    ['named misses', namedMisses],
    ['new-candidate misses', candidateMisses],
    ['total misses', namedMisses + candidateMisses],
    ['skills never fired', never.length],
  ],
  'lr',
);
console.log('');
console.log('  loads vs misses (skills appearing in both logs, the promotion/prune signal):');
const bothRows = namedRows
  .filter(([skill]) => fires.perSkill.has(skill))
  .map(([skill, row]) => [skill, fires.perSkill.get(skill).count, row.count, layerTag(skill) || '']);
if (bothRows.length) {
  printTable(['skill', 'fires', 'misses', 'layer'], bothRows, 'lrrl');
} else {
  console.log('  (no skill appears in both logs)');
}
