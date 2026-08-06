#!/usr/bin/env node
// Standalone test for check-archives.mjs. No framework: builds a throwaway skill
// library per case, packs it with the real pack-skill.mjs so the fixture starts
// consistent, mutates exactly one thing, spawns the real check as a child
// process, and asserts both the exit code and the reason it printed.
//   node hooks/check-archives.test.mjs
//
// Asserting the reason and not only the code is the point, exactly as in
// check-index.test.mjs: a gate that reds for the wrong reason is
// indistinguishable from a working one if you watch the exit code alone. Every
// red case below pins the substring that identifies its own defect, and the
// stale-archive case reproduces the 2026-08-06 drift the gate exists to catch.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHECK = join(HERE, 'check-archives.mjs');
const PACK = join(HERE, 'pack-skill.mjs');

function skillMd(name) {
  return `---\nname: ${name}\ndescription: Does the ${name} thing. Triggers on ${name} work.\n---\n\n# ${name}\n\nBody.\n`;
}

// Build a two-skill library and pack both, so a fresh fixture is already
// archive-consistent. alpha-skill exercises the full shape: references/, scripts/
// and the three files that are present on disk but excluded from the archive
// (README.md, UPSTREAM.md, references/.gitkeep). beta-skill is the SKILL.md-only
// shape. docs/ carries no .skill, so it must be skipped by the archive discovery.
function build() {
  const root = mkdtempSync(join(tmpdir(), 'check-archives-'));

  mkdirSync(join(root, 'alpha-skill', 'references'), { recursive: true });
  mkdirSync(join(root, 'alpha-skill', 'scripts'), { recursive: true });
  writeFileSync(join(root, 'alpha-skill', 'SKILL.md'), skillMd('alpha-skill'));
  writeFileSync(join(root, 'alpha-skill', 'references', 'one.md'), '# one\n\nFirst reference.\n');
  writeFileSync(join(root, 'alpha-skill', 'references', 'two.md'), '# two\n\nSecond reference.\n');
  writeFileSync(join(root, 'alpha-skill', 'scripts', 'run.py'), 'import sys\n\nprint("scan")\n');
  writeFileSync(join(root, 'alpha-skill', 'README.md'), '# alpha-skill\n\nMaintainer notes, not bundled.\n');
  writeFileSync(join(root, 'alpha-skill', 'UPSTREAM.md'), '# provenance\n\nNot bundled.\n');
  writeFileSync(join(root, 'alpha-skill', 'references', '.gitkeep'), '');

  mkdirSync(join(root, 'beta-skill'));
  writeFileSync(join(root, 'beta-skill', 'SKILL.md'), skillMd('beta-skill'));

  mkdirSync(join(root, 'docs'));
  writeFileSync(join(root, 'docs', 'NOTES.md'), 'not a skill\n');

  for (const skill of ['alpha-skill', 'beta-skill']) {
    const run = spawnSync(process.execPath, [PACK, join(root, skill)], { encoding: 'utf8' });
    if (run.status !== 0) {
      throw new Error(`fixture pack of ${skill} failed (exit ${run.status}): ${run.stdout}${run.stderr}`);
    }
  }
  return root;
}

function patch(path, from, to) {
  writeFileSync(path, readFileSync(path, 'utf8').replace(from, to));
}

// A minimal STORED (uncompressed) zip, used only to fake archive layouts the
// packer never emits: directory entries. CRC is left 0 because check-archives.mjs
// reads member content by recorded size and never validates the CRC.
function storedZip(entries) {
  const local = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt32LE(data.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    local.push(lh, nameBuf, data);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt32LE(data.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);
    offset += lh.length + nameBuf.length + data.length;
  }
  const centralStart = offset;
  const centralLen = central.reduce((sum, c) => sum + c.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralLen, 12);
  eocd.writeUInt32LE(centralStart, 16);
  return Buffer.concat([...local, ...central, eocd]);
}

let failed = 0;

// expect: 'ok' for exit 0, or { code?, contains?: [...], absent?: [...] }. Every
// string in contains must appear; every string in absent must not.
function check(name, mutate, expect) {
  const root = build();
  try {
    mutate(root);
    const run = spawnSync(process.execPath, [CHECK, '--root', root], { encoding: 'utf8' });
    const out = `${run.stdout}${run.stderr}`;
    const wantCode = expect === 'ok' ? 0 : expect.code ?? 1;
    const wantStrings = expect === 'ok' ? ['ok:'] : expect.contains ?? [];
    const bannedStrings = expect === 'ok' ? [] : expect.absent ?? [];

    const problems = [];
    if (run.status !== wantCode) problems.push(`exit ${run.status}, wanted ${wantCode}`);
    for (const needle of wantStrings) {
      if (!out.includes(needle)) problems.push(`output missing ${JSON.stringify(needle)}`);
    }
    for (const needle of bannedStrings) {
      if (out.includes(needle)) problems.push(`output unexpectedly contains ${JSON.stringify(needle)}`);
    }

    if (problems.length === 0) {
      console.log(`PASS  ${name}`);
    } else {
      failed++;
      console.log(`FAIL  ${name}`);
      for (const problem of problems) console.log(`        ${problem}`);
      console.log(`        --- output ---\n${out.trimEnd().replace(/^/gm, '        ')}`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// The baseline. Proves the packer and the checker agree on membership: the
// SKILL.md-only skill, the full references+scripts skill, the excluded
// README/UPSTREAM/.gitkeep on disk, and the non-skill docs/ directory all land
// where they should.
check('baseline: freshly packed archives pass, exclusions and non-skill dirs handled', () => {}, 'ok');

// The regression case, in the shape of the 2026-08-06 incident: a script in the
// directory is patched (as the UPSTREAM.md patches were re-applied) but the
// archive is not repacked, so it keeps shipping the old bytes.
check(
  'incident 2026-08-06: a script patched on disk but not repacked is caught as stale',
  (root) => patch(join(root, 'alpha-skill', 'scripts', 'run.py'), 'print("scan")', 'sys.stdout.reconfigure(encoding="utf-8")\nprint("scan")'),
  { contains: ['alpha-skill/scripts/run.py differs — the archive is stale relative to the file on disk'] },
);

check(
  'a SKILL.md edited on disk but not repacked is caught as stale',
  (root) => patch(join(root, 'beta-skill', 'SKILL.md'), 'Body.', 'Body, revised.'),
  { contains: ['beta-skill/SKILL.md differs — the archive is stale relative to the file on disk'] },
);

check(
  'a new bundled file added on disk but not into the archive is caught as missing',
  (root) => writeFileSync(join(root, 'alpha-skill', 'references', 'three.md'), '# three\n\nAdded later.\n'),
  { contains: ['alpha-skill/references/three.md is bundled on disk but missing from the archive'] },
);

check(
  'a file removed from disk but still in the archive is caught as an orphaned member',
  (root) => rmSync(join(root, 'alpha-skill', 'references', 'two.md')),
  { contains: ['alpha-skill/references/two.md is in the archive but not a bundled file on disk (orphaned member)'] },
);

// The exclusions are real, not incidental: editing an excluded file must not be
// read as archive drift, or the gate would demand the impossible (an archive
// that bundles files it is defined never to bundle).
check(
  'editing an excluded README.md does not red the archive',
  (root) => patch(join(root, 'alpha-skill', 'README.md'), 'Maintainer notes', 'Maintainer notes, edited'),
  'ok',
);

// Per-archive isolation and "for every */*.skill": staling one archive names
// that archive and only that archive.
check(
  'with two archives, only the stale one is named',
  (root) => patch(join(root, 'alpha-skill', 'SKILL.md'), 'Body.', 'Body, changed.'),
  { contains: ['alpha-skill/SKILL.md differs'], absent: ['beta-skill/'] },
);

// A layout the packer never emits but the real archives have carried: zero-byte
// directory entries. The checker must ignore them, or it would report every one
// as an orphaned member.
check(
  'zero-byte directory entries in an archive are tolerated, not flagged as orphans',
  (root) => {
    mkdirSync(join(root, 'gamma-skill'));
    const body = skillMd('gamma-skill');
    writeFileSync(join(root, 'gamma-skill', 'SKILL.md'), body);
    writeFileSync(
      join(root, 'gamma-skill', 'gamma-skill.skill'),
      storedZip([
        { name: 'gamma-skill/', data: Buffer.alloc(0) },
        { name: 'gamma-skill/SKILL.md', data: Buffer.from(body) },
      ]),
    );
  },
  'ok',
);

// Guard the guard: a tree with no archives must not be reported as an up-to-date
// set of archives.
check(
  'a tree with no .skill archives exits 2 rather than passing',
  (root) => {
    rmSync(join(root, 'alpha-skill', 'alpha-skill.skill'));
    rmSync(join(root, 'beta-skill', 'beta-skill.skill'));
  },
  { code: 2, contains: ['refusing to assert an up-to-date set'] },
);

// A corrupt archive is a structural failure (exit 2), distinct from staleness
// (exit 1): the gate cannot judge freshness of something it cannot read, and
// must say so rather than pass.
check(
  'a corrupt archive exits 2 rather than passing or reporting staleness',
  (root) => writeFileSync(join(root, 'alpha-skill', 'alpha-skill.skill'), Buffer.from('not a zip at all')),
  { code: 2, contains: ['not a zip'] },
);

if (failed > 0) {
  console.log(`\n${failed} case${failed === 1 ? '' : 's'} failed`);
  process.exit(1);
}
console.log('\nall cases passed');
