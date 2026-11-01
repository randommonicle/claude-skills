#!/usr/bin/env node
// Not a hook: a CLI, and the port step of update-skills.mjs. Refreshes a port, a
// copy of this library laid out for another agent's plugin format (today an
// Antigravity plugin, .agents/plugins/<name>), from the library's committed HEAD.
// The port in the AI domain project went two months stale because nothing did
// this (2026-11-01: its push gate still let `git -C <path> push` through).
//
//   node hooks/sync-port.mjs <port-dir> [--repo <path>] [--dry-run]
//
// What reaches the port, all read from HEAD (never the working tree, so an
// uncommitted edit cannot ship):
//   skills/<s>/   every skill whose SKILL.md is tracked, so the gitignored vendor
//                 packs drop out by construction; each folder is made to hold
//                 exactly the tracked files, which removes files deleted upstream
//   ports/antigravity/**  the port's own files (plugin.json, hooks.json, wrapper)
//   hooks/<h>.mjs  only the hooks that hooks.json wires
//   rules/NORMS.md
// A skill folder in the port that the library does not have is left alone.
// Exit 0: current | synced.   Exit 1: error.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT_SRC = 'ports/antigravity/';

// argv form, never a shell string (see update-skills.mjs).
function git(cwd, args, encoding = 'utf8') {
  const r = spawnSync('git', ['-C', cwd, ...args], { encoding, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error || r.status !== 0) throw new Error(`git ${args[0]} failed: ${r.error?.message ?? String(r.stderr).trim()}`);
  return r.stdout;
}

// The id git gives a blob, so a port file compares against HEAD without reading HEAD.
const blobId = (buf) => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const idOf = (path) => (existsSync(path) && statSync(path).isFile() ? blobId(readFileSync(path)) : null);

function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? filesUnder(join(dir, e.name)).map((f) => e.name + '/' + f) : [e.name],
  );
}

const inside = (child, parent) => {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith(sep) && !/^[A-Za-z]:/.test(rel));
};

export function syncPort(repoIn, portIn, { dryRun = false } = {}) {
  const base = { kind: 'port', path: portIn };
  try {
    const repo = realpathSync(resolve(repoIn));
    if (!existsSync(portIn)) return { ...base, state: 'error', reason: 'port folder does not exist' };
    const port = realpathSync(resolve(portIn));
    if (inside(port, repo)) return { ...base, state: 'error', reason: 'refusing: the port is inside the library' };
    // Guard: this deletes and rewrites folders without asking, so the target must
    // look like a plugin, never an arbitrary folder someone typed by mistake.
    if (!existsSync(join(port, 'plugin.json'))) return { ...base, state: 'error', reason: 'refusing: no plugin.json in the port' };

    const head = git(repo, ['rev-parse', 'HEAD']).trim();
    const tree = new Map(); // path -> blob id, HEAD only
    for (const line of git(repo, ['ls-tree', '-r', '-z', 'HEAD']).split('\0').filter(Boolean)) {
      const [meta, path] = line.split('\t');
      const [, type, id] = meta.split(' ');
      if (type === 'blob') tree.set(path, id);
    }
    if (![...tree.keys()].some((p) => p.startsWith(PORT_SRC))) {
      return { ...base, state: 'error', reason: `the library has no ${PORT_SRC} at ${head.slice(0, 7)}` };
    }

    const want = new Map(); // port-relative path -> blob id
    const skills = [...tree.keys()].map((p) => p.match(/^([^/]+)\/SKILL\.md$/)?.[1]).filter(Boolean);
    for (const [path, id] of tree) {
      const top = path.split('/')[0];
      if (skills.includes(top)) want.set('skills/' + path, id);
      else if (path.startsWith(PORT_SRC)) want.set(path.slice(PORT_SRC.length), id);
    }
    if (tree.has('NORMS.md')) want.set('rules/NORMS.md', tree.get('NORMS.md'));
    const hooksJson = tree.get(PORT_SRC + 'hooks.json');
    if (hooksJson) {
      const wired = new Set([...git(repo, ['cat-file', 'blob', hooksJson]).matchAll(/\.\/hooks\/([\w.-]+\.mjs)/g)].map((m) => m[1]));
      for (const name of wired) {
        if (want.has('hooks/' + name)) continue; // supplied by the port itself (the wrapper)
        const id = tree.get('hooks/' + name);
        if (!id) return { ...base, state: 'error', reason: `hooks.json wires hooks/${name}, which the library does not have` };
        want.set('hooks/' + name, id);
      }
    }

    // A skill folder that differs at all is rewritten whole, so it ends holding
    // exactly the tracked files; other files are rewritten one by one.
    const changed = [];
    const staleDirs = [];
    for (const s of skills) {
      const have = filesUnder(join(port, 'skills', s));
      const wanted = [...want.keys()].filter((k) => k.startsWith(`skills/${s}/`)).map((k) => k.slice(`skills/${s}/`.length));
      const same = have.length === wanted.length && wanted.every((f) => idOf(join(port, 'skills', s, f)) === want.get(`skills/${s}/${f}`));
      if (!same) staleDirs.push(s);
    }
    const writes = [...want].filter(([rel, id]) => {
      const s = rel.startsWith('skills/') ? rel.split('/')[1] : null;
      return s ? staleDirs.includes(s) : idOf(join(port, rel)) !== id;
    });
    for (const s of staleDirs) changed.push('skills/' + s + '/');
    for (const [rel] of writes) if (!rel.startsWith('skills/')) changed.push(rel);

    if (changed.length === 0) return { ...base, state: 'current', from: head, count: 0 };
    if (dryRun) return { ...base, state: 'synced', dryRun: true, from: head, count: changed.length, changed: changed.slice(0, 40) };

    for (const s of staleDirs) rmSync(join(port, 'skills', s), { recursive: true, force: true });
    for (const [rel, id] of writes) {
      const dest = join(port, rel);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, git(repo, ['cat-file', 'blob', id], 'buffer'));
    }
    // verify-the-effect: a write that returned is a proxy. Re-hash what landed.
    const wrong = writes.filter(([rel, id]) => idOf(join(port, rel)) !== id).map(([rel]) => rel);
    if (wrong.length) return { ...base, state: 'error', from: head, reason: 'written files do not match HEAD: ' + wrong.slice(0, 5).join(', ') };
    return { ...base, state: 'synced', from: head, count: changed.length, changed: changed.slice(0, 40) };
  } catch (e) {
    return { ...base, state: 'error', reason: e.message };
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const repoArg = argv.includes('--repo') ? argv[argv.indexOf('--repo') + 1] : null;
  const port = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--repo');
  if (!port) {
    console.error('usage: node hooks/sync-port.mjs <port-dir> [--repo <path>] [--dry-run]');
    process.exit(2);
  }
  const repo = repoArg ?? join(dirname(fileURLToPath(import.meta.url)), '..');
  const record = syncPort(repo, port, { dryRun: argv.includes('--dry-run') });
  console.log(JSON.stringify(record, null, 2));
  process.exitCode = record.state === 'error' ? 1 : 0;
}
