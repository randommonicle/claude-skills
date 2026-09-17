#!/usr/bin/env node
// Pre-flight for an UNATTENDED run: replay real commands through the really-wired
// PreToolUse hooks and report everything that would stop and wait for a human.
//
// Why this exists. On 2026-09-16 an overnight run was gated by push-gate.mjs on the
// phrase "gh pr merge" inside a commit message and sat on an unanswerable prompt for
// fourteen hours. The gate had been tested that evening against 64 hand-written
// commands and passed all of them. Not one of those 64 was a PowerShell multi-line
// block with a here-string, which is what the driver actually emits. The test corpus
// was invented; the failure was in the gap between invented and real.
//
// So this tool takes its corpus from session transcripts - commands that were really
// issued - and discovers its hooks from settings.json rather than a hardcoded list,
// so it tests what is actually wired rather than what someone remembered to add.
//
// Usage:
//   node hooks/preflight-unattended.mjs <session.jsonl> [more.jsonl ...]
//   node hooks/preflight-unattended.mjs --dir <projects dir> --since 2026-09-16
//
// Exit code is the number of distinct commands that would block, so it can gate CI.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';

const SETTINGS = [
  join(homedir(), '.claude', 'settings.json'),
  join(process.cwd(), '.claude', 'settings.json'),
];

// Hooks that can stop a command: PreToolUse entries whose matcher covers a shell tool.
function wiredHooks() {
  const found = [];
  for (const path of SETTINGS) {
    if (!existsSync(path)) continue;
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(path, 'utf8'));
    } catch {
      console.error(`  ! could not parse ${path}, skipping`);
      continue;
    }
    for (const entry of cfg.hooks?.PreToolUse ?? []) {
      const matcher = entry.matcher ?? '';
      if (!/Bash|PowerShell/.test(matcher)) continue;
      for (const h of entry.hooks ?? []) {
        const m = (h.command ?? '').match(/"?([^"\s]+\.mjs)"?\s*$/);
        if (m) found.push({ file: m[1].replace(/\$\{CLAUDE_PROJECT_DIR:-\.\}/g, process.cwd()), from: path, matcher });
      }
    }
  }
  return found;
}

// Every shell command really issued, from newest transcripts.
function harvest(files) {
  const cmds = new Map(); // command -> {count, when}
  for (const f of files) {
    let lines;
    try {
      lines = readFileSync(f, 'utf8').split('\n');
    } catch {
      continue;
    }
    for (const line of lines) {
      if (!line) continue;
      let o;
      try {
        o = JSON.parse(line);
      } catch {
        continue;
      }
      const content = o?.message?.content;
      if (!Array.isArray(content)) continue;
      for (const c of content) {
        if (c.type !== 'tool_use') continue;
        if (!/^(Bash|PowerShell)$/.test(c.name)) continue;
        const cmd = c.input?.command;
        if (typeof cmd !== 'string' || !cmd.trim()) continue;
        const prev = cmds.get(cmd);
        if (prev) prev.count++;
        else cmds.set(cmd, { count: 1, when: o.timestamp ?? '?' });
      }
    }
  }
  return cmds;
}

// cwd is deliberately NOT a git repo. push-gate decorates its ask with a live
// `git fetch`, which costs seconds per match and would make a large corpus take
// hours. The decoration is cosmetic; outside a work tree freshness() returns ''
// immediately and the ask/allow decision is unchanged.
function verdict(hookFile, cmd, cwd) {
  const r = spawnSync(process.execPath, [hookFile], {
    input: JSON.stringify({ tool_name: 'PowerShell', tool_input: { command: cmd }, cwd }),
    encoding: 'utf8',
    timeout: 20000,
  });
  const out = r.stdout ?? '';
  const matched = (out.match(/Matched: \\"([^\\"]*)\\"/) || [])[1] || null;
  if (out.includes('"deny"')) return { verdict: 'DENY', matched };
  if (out.includes('"ask"')) return { verdict: 'ASK', matched };
  return null;
}

const args = process.argv.slice(2);
let files = [];
const dirIdx = args.indexOf('--dir');
if (dirIdx !== -1) {
  const dir = args[dirIdx + 1];
  const sinceIdx = args.indexOf('--since');
  const since = sinceIdx !== -1 ? new Date(args[sinceIdx + 1]) : new Date(0);
  files = readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => join(dir, f))
    .filter((f) => statSync(f).mtime >= since);
} else {
  files = args.filter((a) => a.endsWith('.jsonl'));
}

if (!files.length) {
  console.error('No transcripts given. Pass .jsonl paths, or --dir <dir> [--since YYYY-MM-DD].');
  process.exit(2);
}

const hooks = wiredHooks();
const cmds = harvest(files);
const cwd = tmpdir(); // NOT a repo: see verdict()

console.log(`Pre-flight for unattended running`);
console.log(`  transcripts : ${files.length}`);
console.log(`  commands    : ${cmds.size} distinct`);
console.log(`  hooks wired : ${hooks.length}`);
for (const h of hooks) console.log(`                ${h.file}  [matcher: ${h.matcher}]`);
if (!hooks.length) {
  console.log('\nNo shell PreToolUse hooks are wired. Nothing can block on a prompt.');
  process.exit(0);
}

const blockers = [];
for (const [cmd, meta] of cmds) {
  for (const h of hooks) {
    const v = verdict(h.file, cmd, cwd);
    if (v) blockers.push({ cmd, meta, hook: h.file.split(/[\\/]/).pop(), verdict: v.verdict, matched: v.matched });
  }
}

console.log(`\n${blockers.length} command(s) would stop and wait for a human:\n`);
const byHook = new Map();
for (const b of blockers) {
  if (!byHook.has(b.hook)) byHook.set(b.hook, []);
  byHook.get(b.hook).push(b);
}
for (const [hook, list] of byHook) {
  console.log(`--- ${hook} (${list.length}) ---`);
  for (const b of list) {
    const first = b.cmd.split('\n')[0].slice(0, 110);
    const extra = b.cmd.includes('\n') ? ` [+${b.cmd.split('\n').length - 1} more lines]` : '';
    console.log(`  ${b.verdict}  matched=${JSON.stringify(b.matched)}  x${b.meta.count}  ${b.meta.when}`);
    console.log(`        ${first}${extra}`);
  }
  console.log();
}

if (!blockers.length) {
  console.log('Nothing in this corpus would block. That is necessary, not sufficient:');
  console.log('the corpus only covers commands that have already been issued.');
}
console.log(
  'Each blocker is either a genuinely gated action (expected - decide how the run handles it)\n' +
    'or a false positive like the 2026-09-16 commit-message match (a bug - fix the hook).',
);
process.exit(Math.min(blockers.length, 250));
