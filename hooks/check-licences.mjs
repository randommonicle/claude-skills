#!/usr/bin/env node
// Fork-licence gate, NOT an event hook. Run it against a library root:
//   node hooks/check-licences.mjs [--root <dir>]
// Exit 0 when every forked skill carries its upstream's licence notice, exit 1
// with a named reason for each fork that does not, exit 2 when no fork is found
// at all (a gate that finds nothing to check must not pass by default).
//
// Why it exists. A fork is a top-level skill directory with an UPSTREAM.md. The
// README said every fork's UPSTREAM.md records its upstream's terms, and nothing
// checked it: on 2026-10-11 the four legal forks carried their MIT notice and the
// three unslop forks carried none, in the repo or in their .skill archives
// (LESSONS_LEARNED 41). enforce-invariants-in-build: a rule stated only in prose
// breaks, so this states it as a gate. Three invariants, per fork:
//   1. UPSTREAM.md has a "## Licence" section.
//   2. The notice itself is present: a fenced block holding a "Copyright" line
//      inside that section, or a LICENSE file in the directory holding one.
//   3. A fork that ships a .skill archive has a LICENSE file. UPSTREAM.md is never
//      packed (pack-skill.mjs excludes it), so only a LICENSE file can carry the
//      notice into the archive; check-archives.mjs then proves it is in there.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE = 'usage: node hooks/check-licences.mjs [--root <dir>]';

function die(msg) {
  console.error(`error: ${msg}\n${USAGE}`);
  process.exit(2);
}

function parseArgs(argv) {
  const here = dirname(fileURLToPath(import.meta.url));
  const opts = { root: resolve(here, '..') };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') {
      const value = argv[++i];
      if (!value) die('--root needs a directory');
      opts.root = resolve(value);
    } else {
      die(`unknown argument ${argv[i]}`);
    }
  }
  return opts;
}

// The "## Licence" section: from its heading to the next level-2 heading or the
// end of the file. null when the heading is absent.
function licenceSection(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((l) => /^##\s+Licence\s*$/.test(l));
  if (start < 0) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^##\s/.test(l));
  return (end < 0 ? rest : rest.slice(0, end)).join('\n');
}

function fencedNotice(section) {
  const blocks = section.match(/```[^\n]*\n[\s\S]*?\n```/g) ?? [];
  return blocks.some((b) => /Copyright/.test(b));
}

function checkFork(root, name) {
  const dir = join(root, name);
  const reasons = [];
  const section = licenceSection(readFileSync(join(dir, 'UPSTREAM.md'), 'utf8'));
  const licencePath = join(dir, 'LICENSE');
  const licenceFile = existsSync(licencePath) && /Copyright/.test(readFileSync(licencePath, 'utf8'));
  const archived = readdirSync(dir).some((f) => f.endsWith('.skill'));

  if (section === null) reasons.push('UPSTREAM.md has no "## Licence" section');
  else if (!fencedNotice(section) && !licenceFile) {
    reasons.push('no notice: neither a fenced Copyright block under "## Licence" nor a LICENSE file with a Copyright line');
  }
  if (archived && !licenceFile) {
    reasons.push('ships a .skill archive but has no LICENSE file with a Copyright line, so the archive carries no notice');
  }
  return reasons;
}

const { root } = parseArgs(process.argv.slice(2));
const forks = readdirSync(root, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(root, e.name, 'UPSTREAM.md')))
  .map((e) => e.name)
  .sort();

if (forks.length === 0) die(`no fork found under ${root} (no */UPSTREAM.md)`);

let failed = 0;
for (const name of forks) {
  for (const reason of checkFork(root, name)) {
    console.error(`FAIL ${name}: ${reason}`);
    failed++;
  }
}
if (failed) process.exit(1);
console.log(`ok: ${forks.length} forks, each carries its upstream's licence notice`);
