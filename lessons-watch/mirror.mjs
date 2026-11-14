#!/usr/bin/env node
// Copies lessons files that exist only on this machine into a private watch repository
// and pushes them, so the weekly count can read them with the computer switched off.
// Run unattended by a scheduled task. Deterministic: git and file copies, no model.
//
//   node mirror.mjs [--config <lessons-watch.json>] [--dry-run]
//
// OPT-IN. With no config file it does nothing and says so. The config is machine-local
// and lives beside the skills repo (default ../../lessons-watch.json from this file):
//   { "clone":  "<path to a local clone of the private watch repo>",
//     "origin": "<the exact origin URL that clone must have>",
//     "files":  [ { "name": "Project", "file": "<absolute path to its lessons file>" } ] }
//
// Only the named files travel, never the projects around them. A file that matches a
// secret shape is NOT copied; its name and the shape's name go into mirror/STATUS.json,
// which the weekly report reads, so a skipped file is visible rather than silently absent.
//
// Exit 0: every file copied or unchanged, and the push landed (or nothing to do).
// Exit 1: anything a person should look at (a skip, a missing file, a failed push).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostname } from 'node:os';
import { scanSecrets, SAFE_NAME } from './lib.mjs';

// argv form, never a shell string: paths are untrusted text (same rule as update-skills).
function git(cwd, args, timeout = 60000) {
  const r = spawnSync('git', ['-C', cwd, ...args], { timeout, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return { ok: !r.error && r.status === 0, out: (r.stdout ?? '').trim(), err: r.error ? String(r.error.message) : (r.stderr ?? '').trim() };
}

function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry-run');
  const ci = args.indexOf('--config');
  const here = dirname(fileURLToPath(import.meta.url));
  const configPath = ci >= 0 ? args[ci + 1] : resolve(here, '..', '..', 'lessons-watch.json');
  if (!configPath || !existsSync(configPath)) {
    console.log(`lessons-watch mirror: not configured (no ${configPath}), nothing done`);
    return 0;
  }
  let cfg;
  try { cfg = JSON.parse(readFileSync(configPath, 'utf8')); }
  catch (e) { console.error(`lessons-watch mirror: ${configPath} is not valid JSON: ${e.message}`); return 1; }
  if (!cfg.clone || !cfg.origin || !Array.isArray(cfg.files)) { console.error('lessons-watch mirror: the config needs "clone", "origin" and "files"'); return 1; }
  const clone = resolve(cfg.clone);
  const origin = git(clone, ['remote', 'get-url', 'origin']);
  if (!origin.ok) { console.error(`lessons-watch mirror: ${clone} is not a git clone with an origin: ${origin.err}`); return 1; }
  // The one check that keeps lessons text from going somewhere it was never meant to.
  if (origin.out !== cfg.origin) { console.error(`lessons-watch mirror: ${clone} has origin ${origin.out}, the config expects ${cfg.origin}; nothing copied or pushed`); return 1; }

  if (!dry) {
    const pull = git(clone, ['pull', '--ff-only', '--quiet']);
    if (!pull.ok) { console.error(`lessons-watch mirror: could not fast-forward ${clone}: ${pull.err}`); return 1; }
  }

  const files = [];
  let bad = 0;
  for (const f of cfg.files) {
    const rec = { name: String(f.name ?? '') };
    files.push(rec);
    if (!SAFE_NAME.test(rec.name)) { rec.state = 'skipped'; rec.reason = 'name must be letters, digits, dot, dash or underscore'; bad++; continue; }
    if (!f.file || !existsSync(f.file)) { rec.state = 'missing'; bad++; continue; }
    const text = readFileSync(f.file, 'utf8').replace(/\r\n/g, '\n');
    const shapes = scanSecrets(text);
    if (shapes.length) { rec.state = 'skipped'; rec.reason = `matches secret shape: ${shapes.join(', ')}`; bad++; continue; }
    const rel = join('mirror', rec.name, basename(f.file));
    const dest = join(clone, rel);
    rec.path = rel.replace(/\\/g, '/');
    rec.bytes = Buffer.byteLength(text);
    if (existsSync(dest) && readFileSync(dest, 'utf8') === text) { rec.state = 'unchanged'; continue; }
    rec.state = 'copied';
    if (!dry) { mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, text, 'utf8'); }
  }
  for (const r of files) console.log(`${dry ? 'would be ' : ''}${r.state}: ${r.name}${r.reason ? ` (${r.reason})` : ''}`);
  if (dry) { console.log('dry run: nothing written, committed or pushed'); return bad ? 1 : 0; }

  const status = { ranAt: new Date().toISOString(), host: hostname(), files };
  mkdirSync(join(clone, 'mirror'), { recursive: true });
  writeFileSync(join(clone, 'mirror', 'STATUS.json'), JSON.stringify(status, null, 2) + '\n', 'utf8');
  const add = git(clone, ['add', '--', 'mirror']);
  const commit = add.ok ? git(clone, ['commit', '--quiet', '-m', `mirror: ${status.ranAt.slice(0, 10)} from ${status.host}`]) : add;
  if (!commit.ok) { console.error(`lessons-watch mirror: commit failed: ${commit.err || commit.out}`); return 1; }
  const push = git(clone, ['push', '--quiet', 'origin', 'HEAD']);
  if (!push.ok) { console.error(`lessons-watch mirror: push failed, the copies are committed locally only: ${push.err}`); return 1; }
  console.log(`pushed to ${cfg.origin}`);
  return bad ? 1 : 0;
}

process.exit(main());
