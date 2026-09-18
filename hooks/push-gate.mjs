#!/usr/bin/env node
// PreToolUse hook, matcher: Bash|PowerShell. Mechanical enforcement of confirm-before-push:
// any push, PR merge, or remote branch deletion gets permissionDecision "ask",
// forcing the per-action prompt. NOTE: "ask" does NOT hold in bypassPermissions;
// see the 2026-09-17 SECOND finding below for the measurement and for the lease
// check that covers the unattended case with "deny".
//
// WHAT THIS GATE IS NOT, stated here because on 2026-09-18 it was described in a
// handover as "the only mechanical protection for main" and that reading is too
// strong. It is a COMMAND-TEXT CLASSIFIER. It matches shapes, and a shape it has not
// been taught walks through. An independent review that day found eight routes past
// it; six are now patterns below and asserted in push-gate-bypass-routes.test.mjs.
// TWO REMAIN OPEN AND CANNOT BE CLOSED HERE:
//   bash deploy.sh          (the push lives in a file this never sees)
//   C=push; git $C origin main   (the subcommand is assembled by the shell)
// Closing those needs enforcement somewhere this gate cannot reach: GitHub branch
// protection on the server, or a credential that simply cannot write to main. Until
// one of those exists, treat this as a guard against mistakes, not against a
// determined or confused agent, and do not write that it is complete.
// One of the library's two fail-closed-by-intent gates (proposal doc, Layer 0;
// the other is sql-surgery-warn, promoted 2026-07-29).
// On script error it exits 0 (cannot match what it cannot parse) — the skill
// remains the behavioural backstop for that residual case.
//
// The ask also carries freshness evidence. A session's knowledge of remote state
// is a snapshot whose half-life is however long until another session pushes.
// Measured: on 2026-07-19 a session duplicated a full session's work because the
// start-of-session check was treated as true all day; on 2026-07-28 a push landed
// into a merge queue that a parallel session had already filled. The push prompt
// is the one moment the user already stops to read, so the freshness evidence
// belongs inside it. This adds no new gate (R-21 unchanged); it makes the
// existing ask carry live evidence.
// Latency: the fetch runs only on a matched push/merge command, never on ordinary
// Bash calls. Decoration only: if cwd is not a repo, git is missing, or a probe
// times out, the original reason is emitted unchanged. A failed freshness probe
// must never be the reason this gate does not ask.
//
// 2026-09-17: THIS GATE COST AN ENTIRE UNATTENDED NIGHT, and the cause is worth
// stating precisely because it is not obvious. An overnight run committed a
// handover whose message contained the sentence "gh pr merge was never invoked
// and was never un-gated." The `gh pr merge` pattern matched that PROSE, the gate
// asked, and the session sat on an unanswerable prompt from 19:11 to 09:27 the
// next morning. Fourteen hours, one sentence, and the sentence was true.
// The `git push` pattern had already been hardened against this class (see the
// GIT_GLOBAL_OPT note about `git commit -m "push it"`), but the other two
// patterns were bare regexes with no equivalent guard.
// The fix is stripMessageBodies below. Note what it deliberately does NOT do:
// it does not strip quoted strings generally, because `powershell -c "gh pr
// merge 1"` is a real nested command and must stay caught. Only commit-message
// bodies are removed, which is where prose actually lives.
// 2026-09-17, SECOND finding, and it inverts the header above. The claim that an
// ask fires "regardless of session permission mode" is FALSE, verified with a
// control. In bypassPermissions a hook `ask` is auto-approved and the command
// runs. A hook `deny` does hold. The confound worth recording: the first two
// tests used `git push` and `gh pr merge --help`, and settings.local.json holds
// 1,277 allow rules including Bash(git push *) and Bash(gh pr *), so neither
// proved anything. The decisive case was `git --no-pager push --zzz-not-a-flag`,
// matched by no allow rule, which executed anyway with no prompt.
//
// This matters because an unattended run is told `gh pr merge` is "fully gated".
// Under bypass it was not gated at all, so the only protection on main was the
// driver choosing to comply. Hence the lease check below: when an unattended run
// genuinely owns the lease, these commands are DENIED rather than asked, which is
// the one decision that holds in every mode. Attended sessions are unchanged and
// still get the ask, because a human can answer it.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';

const LEASE = process.env.PROPOS_LEASE_FILE || join(homedir(), '.claude', 'propos-overnight-heartbeat.txt');

// Is an unattended driver holding the lease right now? Anything unreadable,
// missing, `none` or `pending` means no: fall back to the ask, which is the
// attended behaviour and the safe default for an interactive session. This can
// only ever make the gate STRICTER, never looser.
function unattendedDriver() {
  try {
    const text = readFileSync(LEASE, 'utf8');
    const driver = (text.match(/^DRIVER\s+(\S+)/m) || [])[1];
    if (!driver || driver === 'none' || driver === 'pending') return null;
    return driver;
  } catch {
    return null;
  }
}

// A value-taking git global option (-C <path>, -c <k>=<v>, --git-dir[=]<p>,
// --work-tree[=]<p>, --namespace, --exec-path, --super-prefix, --config-env),
// or any bare flag (--no-pager, -p, --bare ...). Subcommands never start with
// `-`, so `git log --grep push` and `git commit -m "push it"` stay unmatched.
const GIT_GLOBAL_OPT =
  String.raw`(?:-[Cc]\s+(?:"[^"]*"|'[^']*'|\S+)|--(?:git-dir|work-tree|namespace|exec-path|super-prefix|config-env)(?:=|\s+)(?:"[^"]*"|'[^']*'|\S+)|--?[A-Za-z][\w-]*)`;

// Any write method, long or short form. `-X DELETE` was the only shape covered until
// 2026-09-18; `--method DELETE` walked straight past it.
const GH_WRITE_METHOD = String.raw`(?:-X|--method)\s+(?:DELETE|PATCH|POST|PUT)`;

const GATED = [
  // includes --force and push-based remote branch deletion; `git -C <path> push`
  // (the parallel-work-recon idiom) walked past the bare `git\s+push` on 2026-09-14.
  // `git.exe` walked past it too until 2026-09-18.
  new RegExp(String.raw`\bgit(?:\.exe)?(?:\s+${GIT_GLOBAL_OPT})*\s+push\b`),

  // Everything below was found by an independent reviewer on 2026-09-18, against a
  // gate whose author had just written that it was "the only mechanical protection for
  // main". It was, and it had six ways round it. A command-text classifier can never be
  // complete; these close the routes a driver might plausibly reach for, and the
  // residual limit is stated in the header rather than pretended away.

  // Plumbing that publishes without ever containing the word "push".
  new RegExp(String.raw`\bgit(?:\.exe)?(?:\s+${GIT_GLOBAL_OPT})*\s+send-pack\b`),

  // An alias defined inline is a push under another name: `git -c alias.zz=push zz`.
  // The -c value is matched as a global option, so the subcommand is no longer "push".
  /\bgit(?:\.exe)?\s+(?:-c|--config-env)(?:=|\s+)["']?alias\./i,

  /\bgh\s+pr\s+merge\b/,

  // ...and the same merge through the REST API, which `gh pr merge` does not cover.
  /\bgh\s+api\b[\s\S]*\/pulls\/[^\s"']*\/merge\b/i,
  /\bgh\s+api\b[\s\S]*\/merges\b/i,

  // Any write method against a ref: delete it, or force main to an arbitrary sha.
  // Both orderings, because the method can precede or follow the path on the line.
  new RegExp(String.raw`\bgh\s+api\b[\s\S]*${GH_WRITE_METHOD}[\s\S]*\/git\/refs\/`, 'i'),
  new RegExp(String.raw`\bgh\s+api\b[\s\S]*\/git\/refs\/[\s\S]*${GH_WRITE_METHOD}`, 'i'),

  // Defining a gh alias is the same trick as the git one.
  /\bgh\s+alias\s+set\b/i,
];

const REASON =
  'confirm-before-push: pushes, PR merges and remote branch deletion need per-action confirmation. Branch deletion also needs the preflight (gh pr list --head/--base, git log main..branch).';

// Remove the places a commit message legally lives, so prose inside one cannot be
// read as a command. Each body is replaced by a single placeholder token rather
// than deleted, so surrounding structure (and therefore any REAL command before
// or after it) is preserved exactly.
//
// Scope is deliberately narrow. A blanket "strip everything quoted" would open an
// evasion: `powershell -c "git push origin main"` would become invisible. So the
// only things removed are here-string / heredoc bodies and the argument to the
// message-carrying flags.
const MSG_PLACEHOLDER = ' "<message-body>" ';
function stripMessageBodies(cmd) {
  let s = cmd;
  // PowerShell here-strings: @'...'@ and @"..."@
  s = s.replace(/@'[\s\S]*?'@/g, () => MSG_PLACEHOLDER);
  s = s.replace(/@"[\s\S]*?"@/g, () => MSG_PLACEHOLDER);
  // POSIX heredocs: <<TAG ... TAG, <<'TAG' ... TAG, <<-"TAG" ... TAG
  s = s.replace(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1\r?\n[\s\S]*?\r?\n[ \t]*\2\b/g, () => MSG_PLACEHOLDER);
  // -m / --message / -F with a quoted argument, on git or gh alike.
  //
  // NOTE THE DELIBERATELY NAIVE QUOTE MATCHING, [^"]* and [^']*, with no escape
  // handling. An earlier draft honoured \" and \' as escapes and that was a
  // security hole of exactly the kind this file exists to prevent:
  //   git commit -m 'x\' ; gh pr merge 1 ; echo 'a'
  // Neither bash nor PowerShell has backslash escapes inside SINGLE quotes (bash
  // needs '\'', PowerShell doubles ''), and PowerShell's double-quote escape is a
  // backtick, not a backslash. So honouring \" or \' makes the stripper consume
  // PAST the real end of the string and swallow a live command with it.
  // Naive matching can only stop SHORT of a string's true end, which leaves more
  // text visible to the gate, not less. That direction fails closed.
  s = s.replace(
    /(^|\s)(-m|--message|-F|--body|--notes)\s+("[^"]*"|'[^']*')/g,
    (_m, lead, flag) => `${lead}${flag}${MSG_PLACEHOLDER}`,
  );
  // A SEARCH PATTERN IS NOT A COMMAND. Found 2026-09-17 by the unattended
  // pre-flight, replaying 530 real commands: this read-only pipeline was blocked
  //     git -C $W diff -- <file> | grep -v "0.6\|push-gate\|gh pr merge\|..."
  // because the text "gh pr merge" appears in a grep pattern. It is the same
  // class as the 2026-09-16 incident (prose read as a command) which the message
  // stripping above was written for, and the pre-flight is exactly how it was
  // meant to be caught: the corpus was real, so the shape was real.
  //
  // Scope is deliberately as narrow as the -m rule, and for the same reason. Only
  // the FIRST quoted argument after a grep-family command and its flags is
  // removed, so `grep "x" && gh pr merge 1` still leaves the merge fully visible,
  // and `powershell -c "gh pr merge 1"` is untouched because the command is not
  // grep. Quote matching stays naive for the reason given above: stopping short
  // of a string's true end leaves MORE visible to the gate, which fails closed.
  s = s.replace(
    /(^|[\s|;(])((?:grep|egrep|fgrep|rg|findstr|Select-String)(?:\s+-{1,2}[A-Za-z][\w-]*)*)\s+("[^"]*"|'[^']*')/g,
    (_m, lead, head) => `${lead}${head}${MSG_PLACEHOLDER}`,
  );
  return s;
}

// argv form, never a shell string. cwd is untrusted text: a directory name may
// legally contain a double quote on POSIX, and interpolating it into a shell
// command made this hook injectable, since a ';' payload executes regardless of
// git's exit status and the strict 'true' test below runs only afterwards. Same
// rule lint-after-edit already states for the edited path.
function run(args, timeout = 6000, withStderr = false) {
  const r = spawnSync('git', args, {
    timeout,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', withStderr ? 'pipe' : 'ignore'],
  });
  if (r.error || r.status !== 0) return null;
  return `${r.stdout}${withStderr ? r.stderr : ''}`.trim();
}

// Live remote state for the prompt. '' on anything short of two clean probes:
// the caller must be able to append this unconditionally, so it never throws.
// The strict 'true' test is what keeps a surprising cwd out of the later probes.
function freshness(cwd) {
  try {
    if (run(['-C', cwd, 'rev-parse', '--is-inside-work-tree']) !== 'true') return '';
    const fetched = run(['-C', cwd, 'fetch'], 6000, true); // ref updates print to stderr
    const status = run(['-C', cwd, 'status', '-sb']);
    if (fetched === null || status === null) return '';
    const moved = fetched
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => !l.startsWith('From ') && (l.includes('..') || l.includes('->')));
    return (
      '\n\nFreshness, probed now rather than at session start: ' +
      (moved.length
        ? `origin moved during this session:\n${moved.slice(0, 5).join('\n')}`
        : 'origin unchanged at fetch time') +
      `\n${status.split('\n')[0]}`
    );
  } catch {
    return '';
  }
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const cmd = evt.tool_input?.command ?? '';
    // Match against the command with message bodies removed. On any failure in
    // the stripper, fall back to the raw command: this gate must fail CLOSED.
    let scanned = cmd;
    try {
      scanned = stripMessageBodies(cmd);
    } catch {
      scanned = cmd;
    }
    // Report WHAT matched, not just that something did. After the 2026-09-17
    // incident the first question on any ask is "is this a real command or has it
    // matched prose again?", and the prompt is the only place that can answer it
    // cheaply. It also gives the unattended pre-flight something to triage.
    let hit = null;
    for (const re of GATED) {
      const m = scanned.match(re);
      if (m) {
        hit = m[0];
        break;
      }
    }
    if (hit) {
      // An unattended driver cannot answer an ask, and in bypassPermissions an ask
      // is not even posed. Deny is the only decision that holds in both modes, so
      // that is what a live lease gets. safe-push.mjs remains the one legitimate
      // door for a branch push and is deliberately not matched by any pattern here.
      const driver = unattendedDriver();
      if (driver) {
        process.stdout.write(
          JSON.stringify({
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'deny',
              permissionDecisionReason:
                `confirm-before-push: DENIED. An unattended run holds the lease (driver ${driver}), ` +
                `so there is nobody to answer a prompt.\n\nMatched: "${hit}"\n\n` +
                'Nothing merges to main unattended. To push a non-protected branch use the one door: ' +
                'node ~/.claude/skills/hooks/safe-push.mjs <worktree-path> <branch-name>',
            },
          }),
        );
        process.exit(0);
      }
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'ask',
            permissionDecisionReason:
              `${REASON}\n\nMatched: "${hit}"` + freshness(evt.cwd ?? process.cwd()),
          },
        }),
      );
    }
  } catch {}
  process.exit(0);
});
