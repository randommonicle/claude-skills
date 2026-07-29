#!/usr/bin/env node
// PostToolUse hook, matcher: Write|Edit. The lint-after-edit skill, mechanised;
// this file retires it (the skill directory is deleted separately).
//
// That skill was structurally untriggerable. Its moment is the edit itself, and
// no prompt names it at that moment: the request is "fix the demand gate", and
// the lint debt arrives silently in the payload. A description cannot match a
// moment nobody says out loud, so the skill sat unfired while the behaviour it
// describes is worth having on every edit.
//
// PostToolUse, not PreToolUse, because a linter reads the file from disk: the
// edited content has to have landed before the binary can see it.
//
// Warn-only, never blocks (ratified R-21: only the push gate blocks; an
// over-firing hook trains bypass). Fail-open everywhere: no linter, no binary, a
// crash, a timeout, or garbage on stdin all exit 0 in silence. A hook that can
// break an edit is worse than a lint finding that arrives one turn late.
//
// Speed is the other constraint, since this runs on EVERY matching write. Each
// guard that can rule the file out is a cheap existsSync; the linter runs on the
// one edited file and never on the project; the binary is resolved strictly from
// the project's own node_modules/.bin, never via npx (which downloads on a cold
// cache) and never installing anything; the run is capped at 15 seconds.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';

// Guard 1: only real source extensions. JSON, Markdown, YAML and the rest are
// somebody else's linter.
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

// Guard 2: generated and vendored trees. Linting them is slow and the findings
// are not the author's to fix. Both separators, because the payload arrives with
// whatever the caller typed.
const SKIP_SEGMENTS = new Set(['node_modules', 'dist', 'build', '.git']);

// Detection: nearest ancestor holding package.json is the project. The cap stops
// a pathological path from walking a deep tree on every single edit.
const MAX_LEVELS = 12;

const BIOME_CONFIGS = ['biome.json', 'biome.jsonc'];
const ESLINT_CONFIGS = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.mjs',
  '.eslintrc.json',
  '.eslintrc.yaml',
  '.eslintrc.yml',
];

const TIMEOUT_MS = 15000;
const MAX_BUFFER = 8 * 1024 * 1024;
const MAX_LINES = 30;
const PREFIX = 'lint-after-edit:';

// Biome prints a one-line summary on a clean run, so non-empty output is not by
// itself a finding. Exit code is the primary signal; on exit 0 these lines are
// stripped and anything left over still counts as something to report.
const BENIGN = [/^checked \d+ file/i, /^no fixes applied/i, /^skipped \d+/i, /^formatted \d+ file/i];

// ESLint gained --no-warn-ignored in v9. Older majors reject it as an unknown
// option, which is a usage error and not a finding, so it earns one plain retry.
const UNKNOWN_OPTION = /(unknown|invalid|unrecogni[sz]ed)\s+option/i;

function skipPath(file) {
  return file.split(/[\\/]/).some((seg) => SKIP_SEGMENTS.has(seg));
}

function isFile(file) {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

function projectRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < MAX_LEVELS; i++) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null; // filesystem root
    dir = parent;
  }
  return null;
}

// package.json can carry ESLint's legacy config inline, with no config file on
// disk. Unparseable package.json is not fatal here: it just means no key.
function hasEslintConfigKey(projectDir) {
  try {
    return 'eslintConfig' in JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf8'));
  } catch {
    return false;
  }
}

// Biome first: a project migrating off ESLint often still has both configs, and
// the one it actually runs is the newer of the two.
function detect(projectDir) {
  if (BIOME_CONFIGS.some((f) => existsSync(join(projectDir, f)))) return 'biome';
  if (ESLINT_CONFIGS.some((f) => existsSync(join(projectDir, f)))) return 'eslint';
  if (hasEslintConfigKey(projectDir)) return 'eslint';
  return null;
}

// Strictly the project's installed binary. Absent means the project cannot lint
// itself, which is a silent skip, never an install.
function resolveBin(projectDir, name) {
  const dir = join(projectDir, 'node_modules', '.bin');
  // On Windows the shim is eslint.cmd; the extensionless sibling is a shell
  // script that cmd.exe cannot execute, hence .cmd first.
  const candidates = process.platform === 'win32' ? [`${name}.cmd`, name] : [name];
  for (const candidate of candidates) {
    const bin = join(dir, candidate);
    if (existsSync(bin)) return bin;
  }
  return null;
}

// No shell: the edited path is untrusted text and goes across as one argv entry,
// so quotes and metacharacters in a filename cannot become a command. Returns
// null for anything that is not a completed run, which the caller treats as a
// silent skip.
function run(bin, args, cwd) {
  const r = spawnSync(bin, args, {
    cwd,
    timeout: TIMEOUT_MS,
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER,
    windowsHide: true,
  });
  if (r.error || r.signal || typeof r.status !== 'number') return null;
  return { status: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

function runEslint(bin, file, cwd) {
  const first = run(bin, ['--no-warn-ignored', file], cwd);
  if (first && first.status !== 0 && UNKNOWN_OPTION.test(first.out) && first.out.includes('no-warn-ignored')) {
    return run(bin, [file], cwd);
  }
  return first;
}

// Non-zero exit with no output at all is a crash this hook cannot describe, so
// it stays silent rather than reporting "the linter failed" with no findings.
function findings(status, out) {
  const text = out.replace(/\r\n/g, '\n').trim();
  if (status !== 0) return text || null;
  const left = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !BENIGN.some((b) => b.test(line)));
  return left.length ? left.join('\n') : null;
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const given = evt.tool_input?.file_path;
    if (typeof given !== 'string' || !given) process.exit(0);
    // The payload may be relative; resolve it against the session's cwd so the
    // existence guard tests the file the tool actually wrote.
    const file = resolve(evt.cwd ?? process.cwd(), given);

    if (!EXTENSIONS.has(extname(file).toLowerCase())) process.exit(0);
    if (skipPath(file)) process.exit(0);
    if (!isFile(file)) process.exit(0);

    const projectDir = projectRoot(dirname(file));
    if (!projectDir) process.exit(0);
    const linter = detect(projectDir);
    if (!linter) process.exit(0);
    const bin = resolveBin(projectDir, linter);
    if (!bin) process.exit(0);

    const result = linter === 'biome' ? run(bin, ['check', file], projectDir) : runEslint(bin, file, projectDir);
    if (!result) process.exit(0);
    const found = findings(result.status, result.out);
    if (!found) process.exit(0);

    const message = `${PREFIX} ${linter} flagged ${basename(file)}. The edit stands; fix these or say why they hold.`;
    const head = found.split('\n').slice(0, MAX_LINES).join('\n');
    process.stdout.write(
      JSON.stringify({
        systemMessage: message,
        hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: `${message}\n\n${head}` },
      }),
    );
  } catch {}
  process.exit(0);
});
