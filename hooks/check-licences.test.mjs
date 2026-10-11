#!/usr/bin/env node
// Standalone test for check-licences.mjs. No framework: builds a throwaway
// library per case, mutates exactly one thing, spawns the real check as a child
// process, and asserts both the exit code and the reason it printed.
//   node hooks/check-licences.test.mjs
//
// The reason is asserted as well as the code, as in check-archives.test.mjs: a
// gate that reds for the wrong reason looks like a working one from the exit code
// alone. The no-notice case reproduces the 2026-10-11 defect (an unslop fork with
// an archive, no LICENSE and no Licence section) that the gate exists to catch.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHECK = join(HERE, 'check-licences.mjs');
const NOTICE = 'MIT License\n\nCopyright (c) 2026 Someone\n\nPermission is hereby granted.\n';
const FENCE = '```';

// Two forks and one in-house skill. inline-fork carries its notice in a fenced
// block in UPSTREAM.md and ships no archive (the legal forks' shape). file-fork
// carries it in a LICENSE file and ships an archive (the unslop forks' shape).
// house-skill has no UPSTREAM.md, so it is not a fork and must be ignored.
function build() {
  const root = mkdtempSync(join(tmpdir(), 'check-licences-'));
  mkdirSync(join(root, 'inline-fork'));
  writeFileSync(join(root, 'inline-fork', 'SKILL.md'), '# inline-fork\n');
  writeFileSync(join(root, 'inline-fork', 'UPSTREAM.md'),
    `# Provenance\n\n## Licence\n\n${FENCE}\n${NOTICE}${FENCE}\n\n## Later section\n\nText.\n`);
  mkdirSync(join(root, 'file-fork'));
  writeFileSync(join(root, 'file-fork', 'SKILL.md'), '# file-fork\n');
  writeFileSync(join(root, 'file-fork', 'UPSTREAM.md'), '# Provenance\n\n## Licence\n\nSee LICENSE.\n');
  writeFileSync(join(root, 'file-fork', 'LICENSE'), NOTICE);
  writeFileSync(join(root, 'file-fork', 'file-fork.skill'), 'zip bytes, never read by this gate');
  mkdirSync(join(root, 'house-skill'));
  writeFileSync(join(root, 'house-skill', 'SKILL.md'), '# house-skill\n');
  return root;
}

const cases = [
  { name: 'both fork shapes pass', mutate: () => {}, code: 0, out: 'ok: 2 forks' },
  {
    name: 'the 2026-10-11 defect: archived fork, no LICENSE, no Licence section',
    mutate: (r) => {
      rmSync(join(r, 'file-fork', 'LICENSE'));
      writeFileSync(join(r, 'file-fork', 'UPSTREAM.md'), '# Provenance\n\nForked from somewhere.\n');
    },
    code: 1,
    out: 'file-fork: UPSTREAM.md has no "## Licence" section',
  },
  {
    name: 'archived fork with the notice only in UPSTREAM.md still fails',
    mutate: (r) => {
      rmSync(join(r, 'file-fork', 'LICENSE'));
      writeFileSync(join(r, 'file-fork', 'UPSTREAM.md'), `# P\n\n## Licence\n\n${FENCE}\n${NOTICE}${FENCE}\n`);
    },
    code: 1,
    out: 'file-fork: ships a .skill archive but has no LICENSE file',
  },
  {
    name: 'a Licence heading with no notice under it fails',
    mutate: (r) => writeFileSync(join(r, 'inline-fork', 'UPSTREAM.md'), '# P\n\n## Licence\n\nIt is MIT.\n'),
    code: 1,
    out: 'inline-fork: no notice',
  },
  {
    name: 'a fenced notice in a later section does not count',
    mutate: (r) => writeFileSync(join(r, 'inline-fork', 'UPSTREAM.md'),
      `# P\n\n## Licence\n\nIt is MIT.\n\n## Other\n\n${FENCE}\n${NOTICE}${FENCE}\n`),
    code: 1,
    out: 'inline-fork: no notice',
  },
  {
    name: 'a LICENSE file without a Copyright line does not count',
    mutate: (r) => writeFileSync(join(r, 'file-fork', 'LICENSE'), 'MIT\n'),
    code: 1,
    out: 'file-fork: ships a .skill archive but has no LICENSE file',
  },
  {
    name: 'CRLF line endings still pass',
    mutate: (r) => writeFileSync(join(r, 'inline-fork', 'UPSTREAM.md'),
      `# P\r\n\r\n## Licence\r\n\r\n${FENCE}\r\n${NOTICE.replace(/\n/g, '\r\n')}${FENCE}\r\n`),
    code: 0,
    out: 'ok: 2 forks',
  },
  {
    name: 'no fork at all is a structural failure, never a pass',
    mutate: (r) => {
      rmSync(join(r, 'inline-fork'), { recursive: true });
      rmSync(join(r, 'file-fork'), { recursive: true });
    },
    code: 2,
    out: 'no fork found',
  },
];

let failed = 0;
for (const c of cases) {
  const root = build();
  try {
    c.mutate(root);
    const run = spawnSync(process.execPath, [CHECK, '--root', root], { encoding: 'utf8' });
    const text = `${run.stdout}${run.stderr}`;
    const ok = run.status === c.code && text.includes(c.out);
    console.log(`${ok ? 'PASS' : 'FAIL'} ${c.name}`);
    if (!ok) {
      console.log(`  expected exit ${c.code} with "${c.out}", got exit ${run.status}:\n  ${text.trim()}`);
      failed++;
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// The real library must pass too, or the gate is red on main.
const real = spawnSync(process.execPath, [CHECK], { encoding: 'utf8' });
const realOk = real.status === 0;
console.log(`${realOk ? 'PASS' : 'FAIL'} the real library passes`);
if (!realOk) {
  console.log(`  ${(real.stdout + real.stderr).trim()}`);
  failed++;
}

if (failed) {
  console.log(`${failed} case(s) failed`);
  process.exit(1);
}
console.log(`all ${cases.length + 1} cases passed`);
