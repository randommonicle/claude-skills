#!/usr/bin/env node
// PostToolUse hook, matcher: Bash|PowerShell. After a `git commit`, reads the commit that landed
// and compares the time stamps it added to record files with the clock the commit itself carries.
// A stamp later than its own commit cannot have been read from a clock: it was typed ahead of the
// write, as a forecast. The class recurred four times between 27 October and 15 November 2026
// (passive income L-093, L-102, L-107; AI domain L-166), each entry a recurrence of an earlier
// lesson, while the rule was prose (live-state-first: a time is read from a command, never
// composed). docs/SKILL_PROPOSALS_2026-11-23.md, Tier 1 item 1.
//
// What it reads, and nothing more:
//   - the commit's subject, unless it speaks of a correction (it then quotes the wrong stamp:
//     passive income e0db827), and the lines the commit ADDED that are a heading (`#`) or an
//     `updated:` line, in a record file (HANDOVER, DECISIONS, LESSONS, NOW, REPORTED, WORKLOG,
//     CHECKPOINT, NEXT_SESSION, REVIEW: see RECORD);
//   - only the record-stamp form, a date followed by a time (`2026-11-23 09:57`). A narrated time
//     ("at 12:50 the probe ran") and a planned one ("the 16:00 run") carry no date beside them and
//     are not stamps. Body text is not read: a record narrates times by the dozen.
// What it says: the stamp is in the future of its commit, by how much. One minute ahead passes as
// rounding. An old stamp is not a finding: a heading about yesterday is ordinary, and the two
// cannot be told apart. So a stamp that went stale before its commit (the second half of L-102)
// and one carrying yesterday's date (L-107) are NOT caught.
//
// A stamp with no zone may be local or UTC, so it is judged by the earlier of the two readings.
// PostToolUse rather than PreToolUse because `git add && git commit` in one command has staged
// nothing when PreToolUse runs; the landed commit is the artefact. Warn-only (R-21). Fail-open:
// any error exits 0 silently. A HEAD older than FRESH_MS is not the commit this command made (the
// commit failed, or ran in another repository), and is not judged.

import { execFileSync } from 'node:child_process';
import { basename, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PREFIX = 'record-time-warn:';
const FRESH_MS = 120000;
const MINUTE = 60000;
const ROUNDING = 1; // minutes ahead that pass
const PLANNED = 240; // further ahead than this is a deadline or a plan (passive income 1fd9231), not a clock slip
const CORRECTION = /\bcorrect/i;

const RECORD = /^(?:HANDOVER|DECISIONS|LESSONS|NOW|REPORTED|WORKLOG|CHECKPOINT|NEXT_SESSION|REVIEW)(?:[_.-][\w.-]*)?\.md$/i;
const STAMP = /\b(20\d\d)-(\d\d)-(\d\d)(?:[ T]|, ?| at )([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\s*(UTC|GMT|BST|Z)?(?![\w:])/g;
const GIT_COMMIT = /(?:^|[\s;&|(])git\s+(?:-C\s+(?:"([^"]+)"|'([^']+)'|(\S+))\s+)?(?:-c\s+\S+\s+)*commit(?![\w-])/;
const CD = /(?:^|[;&|]\s*|\s)cd\s+(?:"([^"]+)"|'([^']+)'|([^\s;&|]+))/;

export const isRecord = (path) => RECORD.test(basename(path));

/** Stamps in one line that lie after `commitMs`, each with the minutes ahead. */
export function ahead(line, commitMs) {
  const out = [];
  for (const m of line.matchAll(STAMP)) {
    const [y, mo, d, h, mi] = m.slice(1, 6).map(Number);
    const utc = Date.UTC(y, mo - 1, d, h, mi);
    const local = new Date(y, mo - 1, d, h, mi).getTime();
    const zone = m[6];
    const at = zone === 'BST' ? utc - 60 * MINUTE : zone ? utc : Math.min(utc, local);
    const floor = Math.floor(commitMs / MINUTE) * MINUTE;
    const minutes = Math.round((at - floor) / MINUTE);
    if (minutes > ROUNDING && minutes <= PLANNED) out.push({ stamp: m[0].trim(), minutes });
  }
  return out;
}

/** The lines of a `git show -U0` patch that are added headings or `updated:` lines of records. */
export function recordLines(patch) {
  const out = [];
  let file = null;
  let inHunk = false;
  for (const l of patch.split(/\r?\n/)) {
    if (l.startsWith('diff --git ')) { file = null; inHunk = false; continue; }
    if (!inHunk && l.startsWith('+++ ')) { const p = l.slice(4).replace(/^b\//, '').replace(/^"|"$/g, '').trim(); file = isRecord(p) ? p : null; continue; }
    if (l.startsWith('@@')) { inHunk = true; continue; }
    if (file && inHunk && l.startsWith('+') && /^(?:\s{0,3}#{1,6}\s|updated:)/i.test(l.slice(1))) out.push({ file, line: l.slice(1) });
  }
  return out;
}

export function judge({ subject, patch, commitMs }) {
  const found = [];
  if (!CORRECTION.test(subject)) for (const s of ahead(subject, commitMs)) found.push({ where: 'the commit subject', ...s });
  for (const { file, line } of recordLines(patch)) for (const s of ahead(line, commitMs)) found.push({ where: file, ...s });
  return found;
}

/** The folder the command committed in: its own -C, else its cd, else the event's cwd. */
export function commitDir(command, cwd) {
  const g = GIT_COMMIT.exec(command);
  if (!g) return null;
  const pick = (m) => m && (m[1] ?? m[2] ?? m[3]);
  const c = pick(CD.exec(command.slice(0, g.index + 1)));
  const win = (p) => (process.platform === 'win32' ? p.replace(/^\/([a-zA-Z])\//, '$1:/') : p);
  let dir = cwd || process.cwd();
  for (const p of [c, pick(g)]) if (p) dir = isAbsolute(win(p)) ? win(p) : resolve(dir, win(p));
  return dir;
}

function main(raw) {
  const evt = JSON.parse(raw);
  const cmd = typeof evt.tool_input?.command === 'string' ? evt.tool_input.command : '';
  const dir = commitDir(cmd, evt.cwd);
  if (!dir) return;
  const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 8000, stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
  const [ct, ...rest] = git('log', '-1', '--format=%ct%n%s').split(/\r?\n/);
  const commitMs = Number(ct) * 1000;
  if (!(Math.abs(Date.now() - commitMs) <= FRESH_MS)) return;
  const patch = git('show', '-U0', '--format=', '--no-color', '--no-ext-diff', '--diff-merges=first-parent', 'HEAD', '--', '*.md');
  const found = judge({ subject: rest[0] || '', patch, commitMs });
  if (!found.length) return;
  const message = [
    `${PREFIX} this commit carries ${found.length === 1 ? 'a time stamp' : 'time stamps'} later than the commit itself, so ${found.length === 1 ? 'it was' : 'they were'} typed ahead of the write and not read from a clock:`,
    ...found.map((f) => `  ${f.where}: "${f.stamp}" is ${f.minutes} min after the commit`),
    'Read the clock, correct the record in a follow-up commit, and take the stamp from the clock in the command that writes it (live-state-first).',
  ].join('\n');
  process.stdout.write(JSON.stringify({ systemMessage: message, hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: message } }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let raw = '';
  process.stdin.on('data', (c) => (raw += c));
  process.stdin.on('end', () => {
    try { main(raw); } catch {}
    process.exit(0);
  });
}
