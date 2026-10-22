#!/usr/bin/env node
// Proves byte-layer-warn.mjs fires on each rule and stays quiet on the near-misses
// (prove-it-can-fail: a warn hook that fires on everything trains bypass, one that fires on
// nothing is theatre). The commands are the shapes from the misses log.
// Run: node hooks/byte-layer-warn.test.mjs
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'byte-layer-warn.mjs');
const MARKERS = {
  A: 'carries backslashes through a heredoc or an inline -e/-c string',
  B: 'an in-place stream edit rewrites the whole file',
  C: 'the later redirect wins',
};
const BS = String.fromCharCode(92); // a backslash, built so this file's own bytes stay plain
const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } });

// [name, expected rules (empty = quiet), event]
const CASES = [
  ['python heredoc with a regex escape', ['A'], bash(`python - <<'EOF'\nimport re\nprint(re.sub(r"${BS}s+", " ", "a  b"))\nEOF`)],
  ['cat > file heredoc writing a JS escape', ['A'], bash(`cat > x.js <<'EOF'\nconst nl = "${BS}n";\nEOF`)],
  ['node -e with a backslash', ['A'], bash(`node -e "console.log('a${BS}tb')"`)],
  ['python -I -c with a backslash', ['A'], bash(`python -I -c "print('${BS}u00e9')"`)],
  ['sed -i on a file', ['B'], bash(`sed -i 's/foo/bar/' DECISIONS.md`)],
  ['sed -i.bak and perl -pi', ['B'], bash(`sed -i.bak 's/a/b/' x.md && perl -pi -e 's/c/d/' y.md`)],
  ['heredoc with a later redirect (L-120)', ['C'], bash(`python - <<EOF < /dev/null\nprint(1)\nEOF`)],
  ['heredoc with a backslash and a later redirect', ['A', 'C'], bash(`python - <<'EOF' < /dev/null\nprint("${BS}n")\nEOF`)],

  ['git commit through a heredoc with a backslash', [], bash(`git commit -q -F - <<'EOF'\nfix: the path C:${BS}Users is quoted\nEOF`)],
  ['heredoc with no backslash', [], bash(`python - <<'EOF'\nprint("plain")\nEOF`)],
  ['node script file with a Windows path argument', [], bash(`node scripts/x.mjs C:${BS}Users${BS}ben${BS}key.json`)],
  ['grep for a backslash pattern', [], bash(`grep -n "${BS}${BS}n" file.js`)],
  ['sed without -i', [], bash(`sed -n 1,20p file.md`)],
  ['an ordinary command with a stderr redirect', [], bash(`node --test 2>/dev/null | tail -3`)],
  ['a here-string', [], bash(`cat <<< "x"`)],
  ['a here-string carrying a backslash', [], bash(`grep -c x <<< "a${BS}tb"`)],
];

function run(stdin) {
  return new Promise((resolve) => {
    const p = spawn('node', [HOOK], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (c) => (out += c));
    p.on('close', (code) => resolve({ out, code }));
    p.stdin.end(stdin);
  });
}

let fails = 0;
for (const [name, expected, evt] of CASES) {
  const { out, code } = await run(JSON.stringify(evt));
  const seen = Object.keys(MARKERS).filter((k) => out.includes(MARKERS[k]));
  const ok = code === 0 && seen.join(',') === expected.join(',') && (expected.length > 0 || out === '');
  if (!ok) fails++;
  const label = expected.length ? `fires ${expected.join('+')}` : 'quiet  ';
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label} | ${name}${ok ? '' : ` (saw=${seen.join('+') || 'nothing'}, exit=${code})`}`);
}

const g = await run('not json at all');
const gok = g.code === 0 && g.out === '';
if (!gok) fails++;
console.log(`${gok ? 'PASS' : 'FAIL'}  quiet   | malformed stdin exits 0 silently (exit=${g.code})`);

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
