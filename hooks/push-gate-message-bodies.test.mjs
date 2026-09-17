#!/usr/bin/env node
// Regression suite for push-gate.mjs. Run: node push-gate.test.mjs
//
// Exists because on 2026-09-17 this gate matched the phrase "gh pr merge" inside a
// COMMIT MESSAGE and asked for permission nobody was awake to give, costing a
// fourteen-hour unattended run. Case 1 below is that exact command, captured
// verbatim from the session transcript.
//
// The suite tests the real hook through its real entry path (spawn + stdin), not
// an imported function, so it exercises what the harness actually runs.
//
// Two halves, and BOTH matter:
//   ASK  cases - the gate must still stop real pushes, merges and ref deletions.
//   ALLOW cases - the gate must not stop prose that merely mentions them.
// A change that makes every ALLOW pass by never asking is not a fix, so the ASK
// half is what keeps this suite honest.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'push-gate.mjs');

// The verbatim command that froze the 2026-09-16 overnight run.
const FROZEN_2026_09_16 = `$W='C:\\Users\\ben\\Projects\\PropOS\\.claude\\worktrees\\overnight'
git -C $W add docs/HANDOVER_2026-09-17_overnight.md
git -C $W commit -m @'
docs(handover): state main-untouched as a verified negative, not an assumption

Checked after a fresh fetch: main and origin/main are both 20e438ba, identical
to session start, git log since 17:00 returns nothing, and the main worktree is
clean and still on main. gh pr merge was never invoked and was never un-gated.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
'@`;

const CASES = [
  // --- the incident, and the class it belongs to ---
  ['ALLOW', FROZEN_2026_09_16, 'THE 2026-09-16 INCIDENT: "gh pr merge" inside a here-string commit message'],
  ['ALLOW', `git commit -m "explain why gh pr merge is gated"`, 'prose in a double-quoted -m'],
  ['ALLOW', `git commit -m 'note: git push origin main is blocked'`, 'prose in a single-quoted -m'],
  ['ALLOW', `gh pr create --title x --body "we never ran gh pr merge here"`, 'prose in a --body'],
  ['ALLOW', "git commit -F - <<'EOF'\nthis mentions gh pr merge and git push\nEOF", 'prose in a heredoc body'],

  // --- the gate must still fire on real operations ---
  ['ASK', 'git push origin main', 'plain push to main'],
  ['ASK', 'git push', 'bare push'],
  ['ASK', 'git push -u origin fix/some-branch', 'push to a feature branch'],
  ['ASK', 'git -C C:/repo push origin docs/x', 'push via -C'],
  ['ASK', 'git push --force origin fix/x', 'force push'],
  ['ASK', 'gh pr merge 322 --squash', 'real merge'],
  ['ASK', 'gh api -X DELETE /repos/o/r/git/refs/heads/x', 'remote ref deletion'],

  // --- evasion: a real command must not hide behind a stripped body ---
  ['ASK', `git commit -m "harmless text" ; gh pr merge 1`, 'real merge AFTER a stripped -m'],
  ['ASK', `git commit -m "harmless text"\ngit push origin main`, 'real push on a later line'],
  ['ASK', `powershell -c "gh pr merge 1"`, 'nested command in a NON-message quote must stay caught'],
  ['ASK', `bash -c "git push origin main"`, 'nested push in a NON-message quote must stay caught'],
  ['ASK', "git commit -F - <<'EOF'\nprose only\nEOF\ngit push origin main", 'real push after a heredoc'],
  // Quote-escape evasion. An early draft of stripMessageBodies honoured \' and \"
  // as escapes, so the stripper ran PAST the real end of the string and ate the
  // live command sitting after it. Neither shell works that way.
  [
    'ASK',
    `git commit -m 'x\\' ; gh pr merge 1 ; echo 'a'`,
    'EVASION: backslash before a single quote must not extend the message',
  ],
  [
    'ASK',
    `git commit -m "x\\" ; git push origin main ; echo "a"`,
    'EVASION: backslash before a double quote must not extend the message',
  ],
  ['ASK', `git commit -m @'\nprose mentioning nothing\n'@\ngit push origin feat/x`, 'real push after a here-string'],

  // --- ordinary commands stay silent ---
  ['ALLOW', 'git status -sb', 'status'],
  ['ALLOW', 'gh pr create --title x --body y', 'opening a PR is not gated'],
  ['ALLOW', 'git log --grep push', 'grep for push'],
];

function ask(cmd) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ tool_name: 'PowerShell', tool_input: { command: cmd }, cwd: 'C:/Users/ben/AppData/Local/Temp' }),
    encoding: 'utf8',
  });
  return (r.stdout || '').includes('"ask"') ? 'ASK' : 'ALLOW';
}

let fails = 0;
for (const [want, cmd, label] of CASES) {
  const got = ask(cmd);
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  want=${want.padEnd(5)} got=${got.padEnd(5)}  ${label}`);
}
console.log(`\n${CASES.length - fails}/${CASES.length} passed`);
process.exit(fails ? 1 : 0);
