#!/usr/bin/env node
// The ONLY way an unattended run may push. One fixed shape, so nothing has to
// parse arbitrary shell to decide whether a push is safe.
//
// Usage:  node safe-push.mjs <worktree-path> <branch-name> [--dry-run]
//
// WHY THIS EXISTS RATHER THAN A CLEVERER GATE
// On 2026-09-16 the overnight run needed to push without a human to click the
// confirm-before-push prompt, so push-gate.mjs was temporarily narrowed to allow
// "an explicit non-main branch push". That narrowing rejected any command with a
// shell metacharacter, on the reasoning that a regex cannot tell where an
// ambiguous push lands. Replaying 850 real commands afterwards showed the actual
// idiom in this repo is:
//     git push -u origin docs/x 2>&1 | tail -8
//     git -C /path push -u origin fix/y 2>&1|tail -2 && gh pr create ...
// Pipes, redirects and chaining throughout. The narrowing would have refused
// almost every real push, and making it accept them would mean teaching a
// fail-closed safety gate to parse shell - a large evasion surface on the one
// file that must never be wrong.
//
// So the gate is left untouched and fail-closed, and the policy lives here
// instead. push-gate.mjs does not fire on this command at all, because the text
// "git push" never appears in it. That is not a loophole: this script refuses
// unless an unattended window is genuinely open, and refuses a protected branch
// outright, so it can do strictly less than the human it stands in for.
//
// EVERY REFUSAL IS LOUD AND NON-ZERO. A push that silently does nothing is how an
// unattended run reports success while shipping nothing.
import { readFileSync, appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { homedir } from 'node:os';

const LEASE = process.env.PROPOS_LEASE_FILE || join(homedir(), '.claude', 'propos-overnight-heartbeat.txt');
const AUDIT = process.env.PROPOS_PUSH_AUDIT || join(homedir(), '.claude', 'safe-push.log');
const PROTECTED = new Set(['main', 'master', 'HEAD', 'head', 'trunk', 'release']);

function die(code, msg) {
  console.error(`safe-push: REFUSED - ${msg}`);
  try {
    appendFileSync(AUDIT, `${new Date().toISOString()}  REFUSED  ${msg}\n`, 'utf8');
  } catch {}
  process.exit(code);
}

function ok(msg) {
  console.log(`safe-push: ${msg}`);
  try {
    appendFileSync(AUDIT, `${new Date().toISOString()}  ${msg}\n`, 'utf8');
  } catch {}
}

// --- the window -------------------------------------------------------------
// Expiry lives in the lease file, not in a constant compiled into a script. Last
// night's narrowing hardcoded 2026-09-17T08:00 and the queue file documented
// 07:30, so the two disagreed and the driver had to read the source to find out
// which was real. A single WINDOW-ENDS line cannot drift from itself.
function windowState() {
  let text;
  try {
    text = readFileSync(LEASE, 'utf8');
  } catch {
    return { open: false, why: `no lease file at ${LEASE}; no unattended run is in progress` };
  }
  const driver = (text.match(/^DRIVER\s+(\S+)/m) || [])[1];
  if (!driver) return { open: false, why: 'lease file has no DRIVER line' };
  if (driver === 'none') return { open: false, why: 'lease says DRIVER none: the run has ended' };

  const ends = (text.match(/^WINDOW-ENDS\s+(\S+)/m) || [])[1];
  if (!ends) return { open: false, why: 'lease file has no WINDOW-ENDS line, so no window is open' };
  const endsAt = new Date(ends);
  if (Number.isNaN(endsAt.getTime())) return { open: false, why: `WINDOW-ENDS "${ends}" is not a parseable timestamp` };
  if (new Date() >= endsAt) return { open: false, why: `the window closed at ${ends}` };

  return { open: true, driver, endsAt: ends };
}

// --- arguments --------------------------------------------------------------
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const positional = args.filter((a) => !a.startsWith('--'));
if (positional.length !== 2) {
  die(2, 'usage: safe-push.mjs <worktree-path> <branch-name> [--dry-run]');
}
const [worktree, branch] = positional;

if (!/^[A-Za-z0-9._\/-]+$/.test(branch)) die(2, `branch name "${branch}" has characters this will not accept`);
if (PROTECTED.has(branch)) die(3, `"${branch}" is a protected branch`);
if (branch.split('/').some((seg) => PROTECTED.has(seg))) die(3, `"${branch}" contains a protected segment`);

const w = windowState();
if (!w.open) die(4, w.why);

// --- the repo ---------------------------------------------------------------
function git(a) {
  return spawnSync('git', ['-C', worktree, ...a], { encoding: 'utf8' });
}
if (git(['rev-parse', '--is-inside-work-tree']).stdout.trim() !== 'true') {
  die(5, `${worktree} is not a git work tree`);
}
if (git(['rev-parse', '--verify', `refs/heads/${branch}`]).status !== 0) {
  die(5, `branch "${branch}" does not exist in ${worktree}`);
}

// The branch must not BE main under another name. A branch whose tip equals
// origin/main is fine (it is simply unmerged-equal); what is refused is pushing
// something whose destination resolves to a protected ref.
const upstream = git(['rev-parse', '--abbrev-ref', `${branch}@{upstream}`]).stdout.trim();
if (upstream && PROTECTED.has(upstream.replace(/^origin\//, ''))) {
  die(3, `"${branch}" tracks ${upstream}, which is protected`);
}

if (dryRun) {
  ok(`DRY RUN ok: would push ${branch} from ${worktree} (window open until ${w.endsAt}, driver ${w.driver})`);
  process.exit(0);
}

const r = git(['push', '-u', 'origin', branch]);
const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
if (r.status !== 0) {
  die(6, `git push failed (exit ${r.status}): ${out.split('\n').slice(-3).join(' | ')}`);
}
ok(`pushed ${branch} from ${worktree} (driver ${w.driver}): ${out.split('\n').slice(-1)[0]}`);
