#!/usr/bin/env node
// Counts the "none - new candidate" lines in every lessons file a watch config names,
// subtracts each source's baseline from the last sweep, and writes one Markdown report.
// Deterministic: it reads files and counts lines, and never asks a model anything.
//
//   node count.mjs --config <watch.json> [--out <report.md>]
//
// A source is one of:
//   { "name", "type": "github", "repo": "owner/name", "path", "ref"?, "baseline" }
//   { "name", "type": "file", "path" (relative to the config's directory), "baseline" }
//   { "name", "type": "excluded", "reason" }
// "baseline" is the count at the last sweep, or null when nobody knows it. An unknown
// baseline counts as 0 and is labelled, so it overstates rather than hides.
//
// Private GitHub sources need LESSONS_READ_TOKEN in the environment (read-only contents).
//
// Exit 0: every source was read. Exit 1: at least one could not be read, or the config
// is unusable. A source that cannot be read is NEVER counted as zero.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { countCandidates } from './lib.mjs';

const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

async function readGithub(src, token, fetchImpl) {
  if (!REPO.test(src.repo ?? '')) return { error: 'repo is not owner/name' };
  const path = String(src.path ?? '').split('/').map(encodeURIComponent).join('/');
  if (!path) return { error: 'no path' };
  const url = `https://api.github.com/repos/${src.repo}/contents/${path}` + (src.ref ? `?ref=${encodeURIComponent(src.ref)}` : '');
  const headers = { Accept: 'application/vnd.github.raw+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'lessons-watch' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try { res = await fetchImpl(url, { headers }); }
  catch (e) { return { error: `request failed: ${e.message}` }; }
  if (res.status !== 200) {
    const why = res.status === 404 ? ' (missing, or private and the token cannot read it)' : res.status === 401 ? ' (token rejected or expired)' : '';
    return { error: `HTTP ${res.status}${why}` };
  }
  return { text: await res.text() };
}

function readFile(src, root) {
  const p = resolve(root, String(src.path ?? ''));
  if (!src.path || !existsSync(p)) return { error: `no file at ${src.path ?? '(no path)'}` };
  try { return { text: readFileSync(p, 'utf8') }; }
  catch (e) { return { error: `unreadable: ${e.message}` }; }
}

// Pure apart from the injected fetch, so the suite can drive every failure mode.
export async function collect(config, { root, token, fetchImpl = fetch }) {
  const rows = [];
  for (const src of config.sources ?? []) {
    const row = { name: src.name ?? '(unnamed)', type: src.type };
    if (src.type === 'excluded') { row.reason = src.reason || '(no reason given)'; rows.push(row); continue; }
    const got = src.type === 'github' ? await readGithub(src, token, fetchImpl)
      : src.type === 'file' ? readFile(src, root)
      : { error: `unknown type "${src.type}"` };
    if (got.error) { row.error = got.error; rows.push(row); continue; }
    if (got.text.length === 0) { row.error = 'empty file (0 bytes)'; rows.push(row); continue; }
    row.bytes = got.text.length;
    row.current = countCandidates(got.text);
    row.baselineKnown = Number.isInteger(src.baseline);
    row.baseline = row.baselineKnown ? src.baseline : 0;
    row.unswept = row.current - row.baseline;
    rows.push(row);
  }
  return rows;
}

// The copy step's own record, so a stale or partial mirror shows in the report.
export function mirrorNotes(status, now, hasFileSources) {
  const notes = [];
  if (!status) {
    if (hasFileSources) notes.push('No `mirror/STATUS.json`: the local copy step has never pushed, so `file` sources may be out of date.');
    return notes;
  }
  const age = Math.floor((now - Date.parse(status.ranAt)) / 86400000);
  if (!Number.isFinite(age)) notes.push('`mirror/STATUS.json` has no readable `ranAt`.');
  else if (age > 7) notes.push(`The local copy step last pushed ${age} days ago (${status.ranAt}, host ${status.host ?? 'unknown'}). Counts for copied files are that old.`);
  for (const f of status.files ?? []) {
    if (f.state === 'skipped') notes.push(`Not copied: **${f.name}** (${f.reason}). Its count comes from an older copy, or it is missing.`);
    if (f.state === 'missing') notes.push(`Not copied: **${f.name}** (the file was not found on ${status.host ?? 'the machine'}).`);
  }
  return notes;
}

export function report(rows, { threshold = 10, notes = [], now = new Date() } = {}) {
  const read = rows.filter((r) => r.current !== undefined);
  const failed = rows.filter((r) => r.error);
  const below = read.filter((r) => r.unswept < 0);
  const total = read.reduce((n, r) => n + Math.max(0, r.unswept), 0);
  const out = [];
  out.push(`**${total} unswept candidates** across ${read.length} lessons files, as of ${now.toISOString().slice(0, 10)}.`);
  out.push(failed.length ? `**${failed.length} source(s) could not be read, so the total is incomplete.**` : total >= threshold ? `That is at or over the threshold of ${threshold}: a sweep is due.` : `Below the threshold of ${threshold}.`);
  out.push('', '| Source | Now | At last sweep | Unswept | Note |', '|---|---|---|---|---|');
  for (const r of rows) {
    if (r.type === 'excluded') out.push(`| ${r.name} | | | | excluded: ${r.reason} |`);
    else if (r.error) out.push(`| ${r.name} | | | | **NOT READ: ${r.error}** |`);
    else out.push(`| ${r.name} | ${r.current} | ${r.baselineKnown ? r.baseline : 'unknown'} | ${r.unswept} | ${r.unswept < 0 ? '**below its baseline: the baseline is wrong or entries were removed**' : r.baselineKnown ? '' : 'baseline unknown, counted from 0'} |`);
  }
  if (notes.length) out.push('', ...notes.map((n) => `- ${n}`));
  out.push('', 'After a sweep, set each `baseline` in `watch.json` to that source\'s "Now" figure, or this number only grows.');
  const warnings = below.length + notes.length;
  out.push('', `<!-- lessons-watch total=${total} failed=${failed.length} warnings=${warnings} -->`);
  return { text: out.join('\n') + '\n', total, failed: failed.length, warnings };
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const configPath = opt('--config');
  if (!configPath || !existsSync(configPath)) { console.error('usage: node count.mjs --config <watch.json> [--out <report.md>]'); return 1; }
  let config;
  try { config = JSON.parse(readFileSync(configPath, 'utf8')); }
  catch (e) { console.error(`${configPath} is not valid JSON: ${e.message}`); return 1; }
  if (!Array.isArray(config.sources) || config.sources.length === 0) { console.error(`${configPath} lists no sources, so there is nothing to count`); return 1; }
  const root = dirname(resolve(configPath));
  const rows = await collect(config, { root, token: process.env.LESSONS_READ_TOKEN || '' });
  const statusPath = join(root, 'mirror', 'STATUS.json');
  let status = null;
  if (existsSync(statusPath)) { try { status = JSON.parse(readFileSync(statusPath, 'utf8')); } catch { status = { ranAt: 'unreadable' }; } }
  const notes = mirrorNotes(status, Date.now(), config.sources.some((s) => s.type === 'file'));
  const r = report(rows, { threshold: config.threshold, notes });
  const out = opt('--out');
  if (out) writeFileSync(out, r.text, 'utf8'); else process.stdout.write(r.text);
  const summary = `total=${r.total} failed=${r.failed} warnings=${r.warnings}`;
  console.error(summary);
  if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, summary.replace(/ /g, '\n') + '\n', { flag: 'a' });
  return r.failed ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(await main());
