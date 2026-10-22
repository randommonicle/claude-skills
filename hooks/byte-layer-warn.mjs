#!/usr/bin/env node
// PreToolUse hook, matcher: Bash. tool-layer-bytes, mechanised at the moment a shell command is
// about to carry text through a layer that rewrites it. The class recurred twelve times in four
// repositories between August and October 2026 (docs/SKILL_PROPOSALS_2026-10-22.md, Tier 1 item
// 1) while the only control was a machine memory, which by passive income L-084's own account
// does not stop a recurrence: ICC L-094 (backslashes rewritten ten times in six days), L-046
// (`sed -i` turned a CRLF file LF, invisible to `git diff`), L-120 (`python - <<EOF ... <
// /dev/null` never ran the heredoc), AI domain L-122 (a quote ending `node -e`), RimModManager
// L-011, and on 22 October 2026 three heredocs that dropped backslashes.
//
// Three rules, each a line naming the safe route:
//   A. a heredoc or an inline-code flag (`node -e`/`--eval`/`-p`, `python -c`, `python -`,
//      `perl -e`, `ruby -e`) whose command carries a backslash: write the script with the
//      Write tool and run the file.
//   B. an in-place stream edit (`sed -i`, `perl -pi`): on Git for Windows it rewrites CRLF
//      line endings across the whole file; use the Edit tool, or prove the bytes after.
//   C. a heredoc and a later `< file` redirect on the same command: the later redirect wins
//      and the heredoc's body never reaches the program.
// Warn-only (ratified R-21: only the push gate blocks; an over-firing hook trains bypass), so
// it says once and lets the command run. `git commit` is exempt from A, because a commit
// message's backslashes are text, not code. Fail-open: any parse error exits 0 silently.

const PREFIX = 'byte-layer-warn:';

const HEREDOC = /(?<!<)<<(?!<)-?\s*['"]?[A-Za-z_]/; // a here-string (<<<) is not one
const INLINE_CODE = /(^|[\s;&|(])(?:node(?:\.exe)?\s+(?:-e|--eval|-p|--print)\b|python3?(?:\.exe)?\s+(?:-[IuB]+\s+)*(?:-c\b|-\s)|perl\s+-e\b|ruby\s+-e\b)/;
const IN_PLACE = /(^|[\s;&|(])(?:sed\s+(?:-[a-zA-Z]*i|--in-place)|perl\s+-[a-zA-Z]*i)/;
// The heredoc's own line carrying a later input redirect, the shape of L-120.
const HEREDOC_THEN_REDIRECT = /<<-?\s*['"]?[A-Za-z_]\w*['"]?[^\n]*\s<\s*[^<\s]/;
const GIT_COMMIT = /(^|[\s;&|(])git\s+(?:-C\s+\S+\s+)?commit\b/;

const RULES = [
  {
    hit: (c) => (HEREDOC.test(c) || INLINE_CODE.test(c)) && c.includes('\\') && !GIT_COMMIT.test(c),
    line: 'this command carries backslashes through a heredoc or an inline -e/-c string, and the Bash tool layer has rewritten them before (ICC L-094: escapes dropped or turned into bytes). Write the script with the Write tool and run the file, then check the bytes landed (tool-layer-bytes).',
  },
  {
    hit: (c) => IN_PLACE.test(c),
    line: 'an in-place stream edit rewrites the whole file, and under Git for Windows it turns CRLF line endings LF unseen by git diff (ICC L-046). Use the Edit tool, or read `git diff --stat` after: a whole-file count is the tell (tool-layer-bytes).',
  },
  {
    hit: (c) => HEREDOC_THEN_REDIRECT.test(c),
    line: 'a heredoc and a later `<` redirect on one command: the later redirect wins, so the heredoc never reaches the program and the step silently does nothing (ICC L-120). Drop the redirect or write the script to a file.',
  },
];

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const cmd = typeof evt.tool_input?.command === 'string' ? evt.tool_input.command : '';
    const lines = RULES.filter((r) => r.hit(cmd)).map((r) => `${PREFIX} ${r.line}`);
    if (lines.length) {
      const message = lines.join('\n');
      process.stdout.write(
        JSON.stringify({ systemMessage: message, hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: message } }),
      );
    }
  } catch {}
  process.exit(0);
});
