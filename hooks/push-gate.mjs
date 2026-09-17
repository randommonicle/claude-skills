#!/usr/bin/env node
// PreToolUse hook, matcher: Bash|PowerShell. Mechanical enforcement of confirm-before-push:
// any push, PR merge, or remote branch deletion gets permissionDecision "ask",
// forcing the per-action prompt regardless of session permission mode.
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
import { spawnSync } from 'node:child_process';

// A value-taking git global option (-C <path>, -c <k>=<v>, --git-dir[=]<p>,
// --work-tree[=]<p>, --namespace, --exec-path, --super-prefix, --config-env),
// or any bare flag (--no-pager, -p, --bare ...). Subcommands never start with
// `-`, so `git log --grep push` and `git commit -m "push it"` stay unmatched.
const GIT_GLOBAL_OPT =
  String.raw`(?:-[Cc]\s+(?:"[^"]*"|'[^']*'|\S+)|--(?:git-dir|work-tree|namespace|exec-path|super-prefix|config-env)(?:=|\s+)(?:"[^"]*"|'[^']*'|\S+)|--?[A-Za-z][\w-]*)`;

const GATED = [
  // includes --force and push-based remote branch deletion; `git -C <path> push`
  // (the parallel-work-recon idiom) walked past the bare `git\s+push` on 2026-09-14
  new RegExp(String.raw`\bgit(?:\s+${GIT_GLOBAL_OPT})*\s+push\b`),
  /\bgh\s+pr\s+merge\b/,
  /\bgh\s+api\b.*-X\s+DELETE.*\/git\/refs\//,
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
