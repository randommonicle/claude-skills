#!/usr/bin/env node
// Proves lint-after-edit.mjs can fire AND can stay quiet (prove-it-can-fail: a
// hook that lints everything floods the context, one that lints nothing is
// theatre). Feeds crafted PostToolUse payloads on stdin against throwaway fixture
// projects and asserts each case.
//
// The linters are stubs: a node script on the project's own node_modules/.bin,
// exiting 1 with a finding when the target file contains the string BAD and 0 in
// silence otherwise, plus, on win32, the .cmd shim npm would have written beside
// it. So this suite needs no ESLint, no Biome and no network, and it still
// exercises the real detection walk, the real binary resolution on both
// platforms, and the real spawn.
//
// The win32 branch is the one that mattered. resolveBin prefers eslint.cmd there,
// and Node refuses to spawn a .cmd without a shell (EINVAL, since 20.12), so the
// hook skipped silently on every Windows project from 2026-09-14 until run()
// learned to go through cmd.exe on 2026-09-15. The stubs were POSIX sh until
// then, which cmd.exe cannot execute either, so the six "fires" cases were red
// on Windows for the fixture's reason and could not show the hook's. Node
// scripts run the same on both platforms; the shim is the only per-platform
// piece, exactly as with a real install.
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

// The stubs set process.exitCode rather than calling process.exit: stdout to a
// pipe is asynchronous on Windows, and an immediate exit can drop the finding.
const STUB_HEAD = `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const has = (a) => { try { return fs.readFileSync(a, 'utf8').includes('BAD'); } catch { return false; } };
`;

// Stub ESLint: finding on stdout. Non-flag arguments are the file list.
const STUB_ESLINT = `${STUB_HEAD}
for (const a of args) {
  if (a.startsWith('-')) continue;
  if (has(a)) {
    process.stdout.write(a + '\\n  1:1  error  BAD is not allowed  stub-finding/no-bad\\n');
    process.exitCode = 1;
    break;
  }
}
`;

// Stub Biome: finding on STDERR, so the capture of both streams is asserted, and
// the routine one-line summary on a clean run, so the benign-summary filter is
// asserted too (real biome check prints that summary and exits 0).
const STUB_BIOME = `${STUB_HEAD}
let dirty = false;
for (const a of args) {
  if (a.startsWith('-') || a === 'check') continue;
  if (has(a)) {
    process.stderr.write(a + ' lint/suspicious/noBad  stub-finding/no-bad\\n');
    dirty = true;
    break;
  }
}
if (dirty) process.exitCode = 1;
else process.stdout.write('Checked 1 file in 3ms. No fixes applied.\\n');
`;

// Stub for an ESLint major predating --no-warn-ignored: rejects the flag as a
// usage error, which must earn one plain retry rather than a reported finding.
const STUB_ESLINT_LEGACY = `${STUB_HEAD}
if (args.includes('--no-warn-ignored')) {
  process.stderr.write("error: unknown option '--no-warn-ignored'\\n");
  process.exitCode = 2;
} else {
  for (const a of args) {
    if (a.startsWith('-')) continue;
    if (has(a)) {
      process.stdout.write('  1:1  error  BAD is not allowed  stub-finding/legacy-retry\\n');
      process.exitCode = 1;
      break;
    }
  }
}
`;

// Stub that floods, for the 30-line cap.
const STUB_ESLINT_VERBOSE = `${STUB_HEAD}
let out = '';
for (let i = 1; i <= 50; i++) out += 'stub-line ' + i + ' BAD\\n';
process.stdout.write(out);
process.exitCode = 1;
`;

function write(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

// What npm writes on Windows beside the extensionless script: a .cmd shim that
// hands the arguments to node. resolveBin prefers it there, so the hook's cmd.exe
// route is what the win32 run of this suite exercises.
const shim = (bin) => `@echo off\r\nnode "%~dp0${bin}" %*\r\nexit /b %ERRORLEVEL%\r\n`;

function project(name, files, bins = {}) {
  const dir = join(ROOT, name);
  for (const [rel, content] of Object.entries(files)) write(join(dir, rel), content);
  for (const [bin, script] of Object.entries(bins)) {
    const path = join(dir, 'node_modules', '.bin', bin);
    write(path, script);
    chmodSync(path, 0o755);
    if (process.platform === 'win32') write(`${path}.cmd`, shim(bin));
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

  // A project whose path has a space: the input that breaks a cmd.exe /s /c line
  // unless every token is quoted and the whole line wrapped once more. Trivial on
  // POSIX, and it should stay that way.
  const spaceProject = project(
    'space project',
    { 'package.json': PKG, 'eslint.config.js': 'export default [];\n', 'src/dirty.ts': DIRTY },
    { eslint: STUB_ESLINT },
  );

  const CASES = [
    ['dirty .ts in an ESLint project', true, ['eslint', 'dirty.ts', 'stub-finding/no-bad'], join(eslintProject, 'src/dirty.ts')],
    ['dirty .ts in a project whose path has a space', true, ['dirty.ts', 'stub-finding/no-bad'], join(spaceProject, 'src/dirty.ts')],
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
