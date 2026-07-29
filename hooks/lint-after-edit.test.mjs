#!/usr/bin/env node
// Proves lint-after-edit.mjs can fire AND can stay quiet (prove-it-can-fail: a
// hook that lints everything floods the context, one that lints nothing is
// theatre). Feeds crafted PostToolUse payloads on stdin against throwaway fixture
// projects and asserts each case.
//
// The linters are stubs: a two-line POSIX sh script on the project's own
// node_modules/.bin, exiting 1 with a finding when the target file contains the
// string BAD and 0 in silence otherwise. So this suite needs no ESLint, no Biome
// and no network, and it still exercises the real detection walk, the real
// binary resolution, and the real spawn.
//
// Not covered here: the win32 branch of resolveBin (eslint.cmd before eslint).
// The stubs are sh scripts, which cmd.exe cannot execute, and this machine is
// Linux, so the branch cannot be exercised without a Windows runner. It is two
// existsSync calls in preference order, and a wrong answer there fails open to a
// silent skip, which is the same outcome as no linter installed.
//
// Run: node hooks/lint-after-edit.test.mjs
import { spawn } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'lint-after-edit.mjs');
const ROOT = mkdtempSync(join(tmpdir(), 'lint-after-edit-'));

const PKG = '{ "name": "fixture", "version": "1.0.0" }\n';
const DIRTY = 'export const x = "BAD";\n';
const CLEAN = 'export const x = 1;\n';

// Stub ESLint: finding on stdout. Non-flag arguments are the file list.
const STUB_ESLINT = `#!/bin/sh
for a in "$@"; do
  case "$a" in -*) continue ;; esac
  if grep -q BAD "$a" 2>/dev/null; then
    echo "$a"
    echo "  1:1  error  BAD is not allowed  stub-finding/no-bad"
    exit 1
  fi
done
exit 0
`;

// Stub Biome: finding on STDERR, so the capture of both streams is asserted, and
// the routine one-line summary on a clean run, so the benign-summary filter is
// asserted too (real biome check prints that summary and exits 0).
const STUB_BIOME = `#!/bin/sh
for a in "$@"; do
  case "$a" in -*|check) continue ;; esac
  if grep -q BAD "$a" 2>/dev/null; then
    echo "$a lint/suspicious/noBad  stub-finding/no-bad" >&2
    exit 1
  fi
done
echo "Checked 1 file in 3ms. No fixes applied."
exit 0
`;

// Stub for an ESLint major predating --no-warn-ignored: rejects the flag as a
// usage error, which must earn one plain retry rather than a reported finding.
const STUB_ESLINT_LEGACY = `#!/bin/sh
for a in "$@"; do
  if [ "$a" = "--no-warn-ignored" ]; then
    echo "error: unknown option '--no-warn-ignored'" >&2
    exit 2
  fi
done
for a in "$@"; do
  case "$a" in -*) continue ;; esac
  if grep -q BAD "$a" 2>/dev/null; then
    echo "  1:1  error  BAD is not allowed  stub-finding/legacy-retry"
    exit 1
  fi
done
exit 0
`;

// Stub that floods, for the 30-line cap.
const STUB_ESLINT_VERBOSE = `#!/bin/sh
i=1
while [ $i -le 50 ]; do
  echo "stub-line $i BAD"
  i=$((i + 1))
done
exit 1
`;

function write(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function project(name, files, bins = {}) {
  const dir = join(ROOT, name);
  for (const [rel, content] of Object.entries(files)) write(join(dir, rel), content);
  for (const [bin, script] of Object.entries(bins)) {
    const path = join(dir, 'node_modules', '.bin', bin);
    write(path, script);
    chmodSync(path, 0o755);
  }
  return dir;
}

function run(stdin) {
  return new Promise((resolve) => {
    const p = spawn('node', [HOOK], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (c) => (out += c));
    p.on('close', (code) => resolve({ out, code }));
    p.stdin.end(stdin);
  });
}

const evt = (file) => JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: file }, cwd: ROOT });

let fails = 0;

function report(name, shouldFire, out, code, expected = []) {
  const fired = out.includes('lint-after-edit:');
  const missing = expected.filter((s) => !out.includes(s));
  const ok = code === 0 && fired === shouldFire && (shouldFire ? missing.length === 0 : out === '');
  if (!ok) fails++;
  const why = ok ? '' : ` (fired=${fired}, exit=${code}, missing=${JSON.stringify(missing)}, out=${JSON.stringify(out.slice(0, 160))})`;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${shouldFire ? 'fires ' : 'quiet '} | ${name}${why}`);
}

try {
  const eslintProject = project(
    'eslint-project',
    {
      'package.json': PKG,
      'eslint.config.js': 'export default [];\n',
      'src/dirty.ts': DIRTY,
      'src/clean.ts': CLEAN,
      'src/deep/nested/unit.ts': DIRTY,
      'src/notes.md': 'BAD prose is still prose.\n',
      'dist/bundle.js': DIRTY,
      'node_modules/vendored/index.ts': DIRTY,
    },
    { eslint: STUB_ESLINT },
  );

  const biomeProject = project(
    'biome-project',
    { 'package.json': PKG, 'biome.json': '{ "linter": { "enabled": true } }\n', 'src/dirty.tsx': DIRTY, 'src/clean.tsx': CLEAN },
    { biome: STUB_BIOME },
  );

  // A binary IS installed here, so silence can only be the detection step.
  const bareProject = project('bare-project', { 'package.json': PKG, 'src/dirty.ts': DIRTY }, { eslint: STUB_ESLINT });

  // Config present, nothing installed: must never reach for npx or an install.
  const noBinaryProject = project('no-binary-project', {
    'package.json': PKG,
    'eslint.config.mjs': 'export default [];\n',
    'src/dirty.ts': DIRTY,
  });

  const pkgKeyProject = project(
    'pkgkey-project',
    { 'package.json': '{ "name": "fixture", "eslintConfig": { "rules": {} } }\n', 'src/dirty.js': DIRTY },
    { eslint: STUB_ESLINT },
  );

  const legacyProject = project(
    'legacy-project',
    { 'package.json': PKG, '.eslintrc.json': '{ "rules": {} }\n', 'src/dirty.js': DIRTY },
    { eslint: STUB_ESLINT_LEGACY },
  );

  const verboseProject = project(
    'verbose-project',
    { 'package.json': PKG, 'eslint.config.js': 'export default [];\n', 'src/dirty.ts': DIRTY },
    { eslint: STUB_ESLINT_VERBOSE },
  );

  const CASES = [
    ['dirty .ts in an ESLint project', true, ['eslint', 'dirty.ts', 'stub-finding/no-bad'], join(eslintProject, 'src/dirty.ts')],
    ['clean .ts in the same project', false, [], join(eslintProject, 'src/clean.ts')],
    ['nested file resolves the root upward', true, ['unit.ts', 'stub-finding/no-bad'], join(eslintProject, 'src/deep/nested/unit.ts')],
    ['dirty .tsx in a Biome project', true, ['biome', 'dirty.tsx', 'stub-finding/no-bad'], join(biomeProject, 'src/dirty.tsx')],
    ['clean file in the Biome project (summary is not a finding)', false, [], join(biomeProject, 'src/clean.tsx')],
    ['eslintConfig key in package.json', true, ['eslint', 'dirty.js'], join(pkgKeyProject, 'src/dirty.js')],
    ['legacy ESLint rejecting --no-warn-ignored retries plainly', true, ['stub-finding/legacy-retry'], join(legacyProject, 'src/dirty.js')],
    ['no linter configured', false, [], join(bareProject, 'src/dirty.ts')],
    ['config present but no binary installed', false, [], join(noBinaryProject, 'src/dirty.ts')],
    ['.md file', false, [], join(eslintProject, 'src/notes.md')],
    ['path under node_modules', false, [], join(eslintProject, 'node_modules/vendored/index.ts')],
    ['path under dist', false, [], join(eslintProject, 'dist/bundle.js')],
    ['file_path that does not exist', false, [], join(eslintProject, 'src/ghost.ts')],
  ];

  for (const [name, shouldFire, expected, file] of CASES) {
    const { out, code } = await run(evt(file));
    report(name, shouldFire, out, code, expected);
  }

  // The 30-line cap on additionalContext, against a stub that emits 50.
  const flood = await run(evt(join(verboseProject, 'src/dirty.ts')));
  let capOk = flood.code === 0;
  let lines = -1;
  try {
    const parsed = JSON.parse(flood.out);
    lines = parsed.hookSpecificOutput.additionalContext.split('\n').filter((l) => l.startsWith('stub-line')).length;
    capOk = capOk && lines === 30 && parsed.hookSpecificOutput.hookEventName === 'PostToolUse' && parsed.systemMessage.startsWith('lint-after-edit:');
  } catch {
    capOk = false;
  }
  if (!capOk) fails++;
  console.log(`${capOk ? 'PASS' : 'FAIL'}  fires  | 50-line report is capped at 30 lines${capOk ? '' : ` (lines=${lines}, exit=${flood.code})`}`);

  // Fail-open: garbage on stdin must exit 0 and say nothing.
  const garbage = await run('not json at all');
  const garbageOk = garbage.code === 0 && garbage.out === '';
  if (!garbageOk) fails++;
  console.log(`${garbageOk ? 'PASS' : 'FAIL'}  quiet  | malformed stdin exits 0 silently (exit=${garbage.code})`);
} finally {
  rmSync(ROOT, { recursive: true, force: true });
}

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
