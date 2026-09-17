#!/usr/bin/env node
// A SEARCH PATTERN IS NOT A COMMAND.
//
// Found 2026-09-17 by preflight-unattended.mjs replaying 530 real commands: a
// read-only `git diff | grep -v "...gh pr merge..."` pipeline was gated, because
// the gated text appeared inside a grep pattern. Same class as the 2026-09-16
// incident that cost fourteen hours, and not covered by stripMessageBodies,
// which only removes here-strings, heredocs and message-flag arguments.
//
// Run: node hooks/push-gate-search-patterns.test.mjs
//
// THE HALF THAT MATTERS MOST is the second block. Loosening a fail-closed gate
// is how the class of bug ABOVE this one gets created, so every case that must
// STILL be caught is asserted here too. If this file only proved the false
// positives were gone it would be worthless.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const GATE = join(dirname(fileURLToPath(import.meta.url)), 'push-gate.mjs');
// A scratch cwd that is not a repo, so the freshness probe is skipped and these
// stay fast and offline. The decision under test is made before it anyway.
const work = mkdtempSync(join(tmpdir(), 'pgs-'));
let fails = 0;

function decision(command) {
  const r = spawnSync(process.execPath, [GATE], {
    input: JSON.stringify({ tool_name: 'Bash', cwd: work, tool_input: { command } }),
    encoding: 'utf8',
    // no lease, so the attended `ask` path is what is measured
    env: { ...process.env, PROPOS_LEASE_FILE: join(work, 'no-such-lease') },
  });
  if (!r.stdout.trim()) return 'silent';
  try {
    return JSON.parse(r.stdout).hookSpecificOutput.permissionDecision;
  } catch {
    return 'UNPARSEABLE';
  }
}

function want(label, command, expected) {
  const got = decision(command);
  const ok = got === expected;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  (got ${got}, want ${expected})`}`);
}

try {
  console.log('--- must be SILENT: the pattern is data, not a command ---');
  // The exact command from the 2026-09-17 pre-flight, trimmed to its shape.
  want(
    'the real blocker: git diff piped into grep -v with a merge string',
    `git -C $W diff -- docs/q.md | grep -E "^[-+]" | grep -v "0.6\\|push-gate\\|gh pr merge\\|DRIVER none" | head -40`,
    'silent',
  );
  want('grep for a push string', `git log | grep "git push"`, 'silent');
  want('grep -n single-quoted', `cat f | grep -n 'gh pr merge'`, 'silent');
  want('rg with flags', `rg --no-heading -i "gh pr merge" docs/`, 'silent');
  want('findstr', `type f.txt | findstr "git push"`, 'silent');
  want('Select-String', `Get-Content f | Select-String "gh pr merge"`, 'silent');
  want('grep at the very start of the command', `grep "git push" notes.md`, 'silent');
  want('grep after a pipe with no space', `cat f|grep "gh pr merge"`, 'silent');

  console.log('\n--- must STILL be caught: loosening this gate is the worse bug ---');
  want('a real push, plainly', 'git push -u origin fix/x', 'ask');
  want('a real merge, plainly', 'gh pr merge 333 --squash', 'ask');
  // The one the file's own comments insist on: a nested real command in quotes.
  want('nested real command under powershell -c', `powershell -c "gh pr merge 1"`, 'ask');
  want('nested real push under bash -c', `bash -c "git push origin main"`, 'ask');
  // Only the FIRST quoted argument after grep goes, so a chained real command
  // stays fully visible. This is the property that makes the rule fail closed.
  want('grep pattern then a chained real merge', `grep "x" f && gh pr merge 1`, 'ask');
  want('grep pattern then a chained real push', `grep -v "gh pr merge" f; git push origin main`, 'ask');
  want('grep pattern, then a real push later in the pipeline', `cat f | grep "foo" | xargs git push origin`, 'ask');
  // grep is not a magic prefix: an unquoted pattern is not stripped, so a real
  // command after it on the same line is still seen.
  want('unquoted grep pattern does not swallow what follows', `grep foo f && git push origin main`, 'ask');

  console.log('\n--- unchanged behaviour ---');
  want('ordinary command', 'npm test', 'silent');
  want('the 2026-09-16 killer: prose in a commit message', `git commit -m "gh pr merge was never invoked"`, 'silent');
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
