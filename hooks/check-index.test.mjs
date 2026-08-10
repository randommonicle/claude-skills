#!/usr/bin/env node
// Standalone test for check-index.mjs. No framework: builds a throwaway fixture
// library per case, mutates exactly one thing, spawns the real check as a child
// process, and asserts both the exit code and the reason it printed.
//   node hooks/check-index.test.mjs
//
// Asserting the reason and not only the code is the point. A gate that reds for
// the wrong reason is indistinguishable from a working one if you watch the exit
// code alone, and prove-it-can-fail is about watching the named case rather than
// the suite total. Every red case below therefore pins the substring that
// identifies its own defect.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECK = join(dirname(fileURLToPath(import.meta.url)), 'check-index.mjs');

// Three skills, and the third is named ONLY inside a shared slash-separated row,
// which is the shape the real README uses for the unslop forks. If the parser
// ever stops splitting that cell, the baseline case goes red.
const SKILLS = ['alpha-skill', 'beta-skill', 'gamma-skill'];

function skillFile(name) {
  return `---\nname: ${name}\ndescription: Does the ${name} thing. Triggers on ${name} work.\n---\n\n# ${name}\n\nBody.\n`;
}

function readme(count) {
  return [
    '# claude-skills',
    '',
    `Four-layer architecture so ${count} skills coexist without diluting description-trigger matching.`,
    '',
    '| Skill | Layer / role | What it does |',
    '|-------|--------------|--------------|',
    '| **alpha-skill** | norm | Alpha. |',
    '| **beta-skill / gamma-skill** | leaf / forks | Beta and gamma share a row. |',
    '',
  ].join('\n');
}

function build() {
  const root = mkdtempSync(join(tmpdir(), 'check-index-'));
  for (const skill of SKILLS) {
    mkdirSync(join(root, skill));
    writeFileSync(join(root, skill, 'SKILL.md'), skillFile(skill));
  }
  // Non-skill directories, present to prove they are excluded by the SKILL.md
  // test rather than by being named in the check.
  mkdirSync(join(root, 'docs'));
  writeFileSync(join(root, 'docs', 'NOTES.md'), 'notes\n');
  mkdirSync(join(root, 'hooks'));
  writeFileSync(join(root, 'hooks', 'a-hook.mjs'), '// hook\n');

  writeFileSync(join(root, 'README.md'), readme(SKILLS.length));
  mkdirSync(join(root, '.claude-plugin'));
  writeFileSync(
    join(root, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ description: `ASH engineering skills: ${SKILLS.length} guardrail skills in four layers.` }, null, 2),
  );
  writeFileSync(
    join(root, '.claude-plugin', 'marketplace.json'),
    JSON.stringify({ plugins: [{ description: `${SKILLS.length} guardrail skills plus hooks and norms.` }] }, null, 2),
  );
  return root;
}

function patch(path, from, to) {
  writeFileSync(path, readFileSync(path, 'utf8').replace(from, to));
}

let failed = 0;

// expect: 'ok' for exit 0, or an array of substrings every one of which must
// appear in a failing run's output.
function check(name, mutate, expect) {
  const root = build();
  try {
    mutate(root);
    const run = spawnSync(process.execPath, [CHECK, '--root', root], { encoding: 'utf8' });
    const out = `${run.stdout}${run.stderr}`;
    const wantCode = expect === 'ok' ? 0 : expect.code ?? 1;
    const wantStrings = expect === 'ok' ? ['ok:'] : expect.contains;

    const problems = [];
    if (run.status !== wantCode) problems.push(`exit ${run.status}, wanted ${wantCode}`);
    for (const needle of wantStrings) {
      if (!out.includes(needle)) problems.push(`output missing ${JSON.stringify(needle)}`);
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

// The baseline. Also the proof that a skill named only in a shared slash row
// counts as indexed, and that docs/ and hooks/ are not counted as skills.
check('baseline: a consistent library passes, shared row and non-skill dirs handled', () => {}, 'ok');

check(
  'a skill on disk with no table row is caught',
  (root) => {
    mkdirSync(join(root, 'delta-skill'));
    writeFileSync(join(root, 'delta-skill', 'SKILL.md'), skillFile('delta-skill'));
  },
  // Adding a skill moves the disk count too, so the counts red as well. The
  // named substring is what pins this case to its own defect.
  { contains: ['delta-skill has a SKILL.md but no README table row'] },
);

// The exclusion sets: a vendor pack or an Anthropic built-in lands beside the
// library with a SKILL.md of its own, but is not the maintainer's, so it is
// neither indexed nor counted and the fixture passes with both present.
// delta-skill above is the discriminator: a directory in neither set still reds.
check(
  'a vendor pack and a built-in beside the library are excluded, not required in the index',
  (root) => {
    for (const name of ['wrangler', 'pdf']) {
      mkdirSync(join(root, name));
      writeFileSync(join(root, name, 'SKILL.md'), skillFile(name));
    }
  },
  'ok',
);

check(
  'a table row naming a skill that is not on disk is caught',
  (root) => patch(join(root, 'README.md'), '| **alpha-skill** | norm | Alpha. |', '| **alpha-skill** | norm | Alpha. |\n| **ghost-skill** | leaf | Never existed. |'),
  { contains: ['README table lists ghost-skill but no ghost-skill/SKILL.md exists'] },
);

check(
  'frontmatter name drifting from the directory is caught',
  (root) => patch(join(root, 'beta-skill', 'SKILL.md'), 'name: beta-skill', 'name: beta-skil'),
  { contains: ['beta-skill/SKILL.md declares name: beta-skil, which does not match its directory'] },
);

check(
  'a missing description is caught',
  (root) => patch(join(root, 'gamma-skill', 'SKILL.md'), /description: .*\n/, ''),
  { contains: ['gamma-skill/SKILL.md has no description'] },
);

check(
  'a missing frontmatter block is caught',
  (root) => writeFileSync(join(root, 'alpha-skill', 'SKILL.md'), '# alpha-skill\n\nNo frontmatter at all.\n'),
  { contains: ['alpha-skill/SKILL.md has no frontmatter block'] },
);

check(
  'README prose count drift is caught',
  (root) => patch(join(root, 'README.md'), 'so 3 skills coexist', 'so 4 skills coexist'),
  { contains: ['README prose states 4 skills, 3 on disk'] },
);

check(
  'plugin.json count drift is caught',
  (root) => patch(join(root, '.claude-plugin', 'plugin.json'), '3 guardrail skills', '4 guardrail skills'),
  { contains: ['plugin.json states 4 skills, 3 on disk'] },
);

check(
  'marketplace.json count drift is caught',
  (root) => patch(join(root, '.claude-plugin', 'marketplace.json'), '3 guardrail skills', '4 guardrail skills'),
  { contains: ['marketplace.json states 4 skills, 3 on disk'] },
);

// The regression case, named for the commit that produced the defect. A skill is
// deleted and only its table row is removed, which is precisely what 1d780cb did.
// All three counts must red together, because that is the drift that shipped.
check(
  'regression 1d780cb: deleting a skill and only its row reds all three counts',
  (root) => {
    rmSync(join(root, 'gamma-skill'), { recursive: true, force: true });
    patch(join(root, 'README.md'), '| **beta-skill / gamma-skill** | leaf / forks | Beta and gamma share a row. |', '| **beta-skill** | leaf | Beta. |');
  },
  {
    contains: [
      'README prose states 3 skills, 2 on disk',
      'plugin.json states 3 skills, 2 on disk',
      'marketplace.json states 3 skills, 2 on disk',
    ],
  },
);

// The half of 1d780cb that the README table row removal DID cover, isolated: if
// the row survives the deletion, the stale row is named too.
check(
  'a deleted skill whose row survives is named as stale',
  (root) => rmSync(join(root, 'alpha-skill'), { recursive: true, force: true }),
  { contains: ['README table lists alpha-skill but no alpha-skill/SKILL.md exists'] },
);

check(
  'a count site that stops stating a count at all is caught, not skipped',
  (root) => patch(join(root, '.claude-plugin', 'plugin.json'), '3 guardrail skills', 'a library of guardrail skills'),
  { contains: ['plugin.json no longer states a skill count'] },
);

// Guard the guard: an empty tree must not be reported as a clean library.
check(
  'an empty library exits 2 rather than passing',
  (root) => {
    for (const skill of SKILLS) rmSync(join(root, skill), { recursive: true, force: true });
  },
  { code: 2, contains: ['refusing to assert an empty library'] },
);

check(
  'a missing manifest exits 2 rather than passing',
  (root) => rmSync(join(root, '.claude-plugin', 'plugin.json'), { force: true }),
  { code: 2, contains: ['plugin.json not found'] },
);

// Guard the kept-in-step comments: BUILTINS and VENDOR are each stated in two
// scripts, and VENDOR a third time as the vendor block in .gitignore. A comment
// is not a check (enforce-invariants-in-build), so read the sources and diff
// the sets themselves.
{
  const HOOKS_DIR = dirname(CHECK);
  const names = (src, setName) => {
    const m = src.match(new RegExp(`const ${setName} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
    return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort() : null;
  };
  const indexSrc = readFileSync(join(HOOKS_DIR, 'check-index.mjs'), 'utf8');
  const auditSrc = readFileSync(join(HOOKS_DIR, 'audit-fires.mjs'), 'utf8');
  const gitignore = readFileSync(join(HOOKS_DIR, '..', '.gitignore'), 'utf8');
  const problems = [];
  for (const setName of ['BUILTINS', 'VENDOR']) {
    const a = names(indexSrc, setName);
    const b = names(auditSrc, setName);
    if (!a || !b) problems.push(`${setName} set not found in ${!a ? 'check-index.mjs' : 'audit-fires.mjs'}`);
    else if (a.join(',') !== b.join(',')) problems.push(`${setName} differs: check-index [${a}] vs audit-fires [${b}]`);
  }
  for (const name of names(indexSrc, 'VENDOR') ?? []) {
    if (!gitignore.split(/\r?\n/).includes(`${name}/`)) problems.push(`.gitignore has no ${name}/ line for VENDOR member ${name}`);
  }
  const label = 'kept-in-step: BUILTINS and VENDOR agree across check-index.mjs, audit-fires.mjs, .gitignore';
  if (problems.length === 0) {
    console.log(`PASS  ${label}`);
  } else {
    failed++;
    console.log(`FAIL  ${label}`);
    for (const problem of problems) console.log(`        ${problem}`);
  }
}

if (failed > 0) {
  console.log(`\n${failed} case${failed === 1 ? '' : 's'} failed`);
  process.exit(1);
}
console.log('\nall cases passed');
