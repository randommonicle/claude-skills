#!/usr/bin/env node
// Installs a stripped, project-scoped subset of coreyhaines31/marketingskills
// into a target repo's .claude/skills/. Not a hook; lives here because the
// repo keeps its tooling in hooks/ and CI runs hooks/*.test.mjs.
//
// The pack is a domain pack, not library material (docs/REVIEW_marketingskills
// _2026-09-14.md, DECISIONS 2026-09-14): it installs per project, stripped,
// with UPSTREAM.md provenance, never user-level and never into this library.
//
// What "stripped" means, per kept skill:
//   - SKILL.md and references/*.md copied; evals/ and any non-markdown dropped.
//   - The "## Tool Integrations" section deleted (sponsor/vendor registry).
//   - Any line linking tools/integrations/ or tools/REGISTRY.md deleted, in
//     SKILL.md and in references/ (four such lines live in references/).
//   - Related Skills rows naming a skill outside the keep set deleted, so the
//     model is never pointed at a skill that is not there. Three row forms
//     exist upstream: "- **x**: ...", "- **x** — ..." and "| ... | `x` |".
// Prose mentions of dropped skills outside those rows are left as written and
// UPSTREAM.md says so.
//
// Idempotent: a re-run removes every directory the existing UPSTREAM.md lists
// as installed, then installs afresh, so a changed keep list converges. A
// same-named directory the pack did not install is refused, never overwritten.
//
// Usage: node hooks/install-marketing-pack.mjs <target-repo> [--source <clone>] [--dry-run]
//   --source  an existing clone; its HEAD must equal PIN. Without it the script
//             clones into a temp dir and checks out PIN.
//   --dry-run print every action and cut, write nothing.
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const UPSTREAM_URL = 'https://github.com/coreyhaines31/marketingskills';
export const PIN = '5b2c0007766c6a1cf1d53fd8fc73e979e0821022'; // 2026-09-04, "feat: ai-seo 2.5.0"
export const KEEP = [
  'product-marketing',
  'copywriting',
  'copy-editing',
  'cro',
  'seo-audit',
  'site-architecture',
  'schema',
  'ai-seo',
  'content-strategy',
  'pricing',
  'emails',
  'analytics',
  'customer-research',
  'offers',
];

const UPSTREAM_FILE = 'UPSTREAM.md';
const LICENSE_FILE = 'LICENSE.marketingskills';
const INSTALLED_HEADING = '## Installed';
const REGISTRY_LINK = /tools\/(?:integrations\/|REGISTRY\.md)/;
const TOOLS_HEADING = /^## Tool Integrations\s*$/;
const RELATED_HEADING = /^## Related Skills\s*$/;
const ANY_HEADING = /^## /;
// "- **name**: ..." and "- **name** — ..." share the prefix; the table form
// ends in a backticked name cell.
const LIST_ROW = /^- \*\*([a-z0-9-]+)\*\*/;
const TABLE_ROW = /^\|.*\|\s*`([a-z0-9-]+)`\s*\|\s*$/;

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${(r.stderr || r.stdout).trim()}`);
  return r.stdout.trim();
}

// Splits SKILL.md text into lines, applies the three cuts, returns the new
// text and a list of {line, why, text} for UPSTREAM.md. Line numbers are the
// upstream file's, so a reader can check each cut against the pinned commit.
export function stripSkill(text, keepSet, { isSkillMd }) {
  // LF in, LF out, whatever the source clone's autocrlf did: the output is a
  // function of the pin and the keep list, not of the machine that ran this.
  text = text.replace(/\r\n/g, '\n');
  const src = text.split('\n');
  const cuts = [];
  const out = [];
  let inTools = false;
  let inRelated = false;
  for (let i = 0; i < src.length; i++) {
    const line = src[i];
    const n = i + 1;
    if (isSkillMd && TOOLS_HEADING.test(line)) {
      inTools = true;
      inRelated = false;
      cuts.push({ line: n, why: 'tools section', text: line });
      continue;
    }
    if (inTools) {
      if (ANY_HEADING.test(line)) {
        inTools = false;
        // The section's closing "---" was cut with it; the one before the
        // heading survives, so the next section still has its separator.
      } else {
        if (line.trim() !== '' && line.trim() !== '---') cuts.push({ line: n, why: 'tools section', text: line });
        continue;
      }
    }
    if (REGISTRY_LINK.test(line)) {
      cuts.push({ line: n, why: 'registry link', text: line });
      continue;
    }
    if (isSkillMd && RELATED_HEADING.test(line)) {
      inRelated = true;
      out.push(line);
      continue;
    }
    if (inRelated) {
      if (ANY_HEADING.test(line)) inRelated = false;
      else {
        const m = LIST_ROW.exec(line) || TABLE_ROW.exec(line);
        if (m && !keepSet.has(m[1])) {
          cuts.push({ line: n, why: `related row: ${m[1]} not installed`, text: line });
          continue;
        }
      }
    }
    out.push(line);
  }
  // A tools section that closed the file leaves a dangling "---".
  while (out.length && (out[out.length - 1].trim() === '' || out[out.length - 1].trim() === '---')) {
    if (out[out.length - 1].trim() === '---' && !inTools) break;
    out.pop();
  }
  return { text: out.join('\n') + (text.endsWith('\n') ? '\n' : ''), cuts };
}

function readInstalled(upstreamPath) {
  if (!existsSync(upstreamPath)) return [];
  const lines = readFileSync(upstreamPath, 'utf8').split('\n');
  const start = lines.findIndex((l) => l.trim() === INSTALLED_HEADING);
  if (start < 0) return [];
  const names = [];
  for (const l of lines.slice(start + 1)) {
    if (ANY_HEADING.test(l)) break;
    const m = /^- `([a-z0-9-]+)`/.exec(l);
    if (m) names.push(m[1]);
  }
  return names;
}

function markdownFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name)
    .sort();
}

// Returns the clone plus the pinned commit's date, so UPSTREAM.md is a pure
// function of the pin and the keep list: the same install on the second
// machine, or a re-run next month, writes byte-identical files.
function resolveSource(source, pin, log) {
  let dir = source;
  let cleanup = () => {};
  if (source) {
    const head = git(['rev-parse', 'HEAD'], source);
    if (head !== pin) throw new Error(`--source HEAD is ${head.slice(0, 7)}, pinned commit is ${pin.slice(0, 7)}; refusing`);
  } else {
    dir = mkdtempSync(join(tmpdir(), 'marketingskills-'));
    log(`cloning ${UPSTREAM_URL} into ${dir}`);
    git(['clone', '--quiet', UPSTREAM_URL, dir], tmpdir());
    git(['checkout', '--quiet', pin], dir);
    cleanup = () => rmSync(dir, { recursive: true, force: true });
  }
  const pinDate = git(['log', '-1', '--format=%cs', pin], dir);
  return { dir, cleanup, pinDate };
}

export function installPack({ source, target, keep = KEEP, pin = PIN, dryRun = false, log = console.log }) {
  if (!existsSync(target) || !statSync(target).isDirectory()) throw new Error(`target is not a directory: ${target}`);
  const keepSet = new Set(keep);
  const dest = join(target, '.claude', 'skills');
  const upstreamPath = join(dest, UPSTREAM_FILE);
  const previouslyInstalled = readInstalled(upstreamPath);
  const owned = new Set(previouslyInstalled);

  // Refuse before any write: a same-named directory the pack did not put there.
  for (const name of keep) {
    const d = join(dest, name);
    if (existsSync(d) && !owned.has(name)) {
      throw new Error(`${relative(target, d)} exists and is not listed in ${UPSTREAM_FILE}; refusing to overwrite a foreign skill`);
    }
  }

  const { dir: src, cleanup, pinDate } = resolveSource(source, pin, log);
  try {
    const srcHead = git(['rev-parse', 'HEAD'], src);
    for (const name of keep) {
      if (!existsSync(join(src, 'skills', name, 'SKILL.md'))) throw new Error(`upstream has no skills/${name}/SKILL.md at ${pin.slice(0, 7)}`);
    }
    const licenseSrc = join(src, 'LICENSE');
    if (!existsSync(licenseSrc)) throw new Error('upstream LICENSE missing');

    const act = (what, fn) => {
      log(`${dryRun ? 'would ' : ''}${what}`);
      if (!dryRun) fn();
    };

    for (const name of previouslyInstalled) {
      const d = join(dest, name);
      if (existsSync(d)) act(`remove ${relative(target, d)} (listed in existing ${UPSTREAM_FILE})`, () => rmSync(d, { recursive: true, force: true }));
    }

    const report = []; // per skill: {name, files, cuts:[{file,line,why,text}]}
    for (const name of keep) {
      const from = join(src, 'skills', name);
      const to = join(dest, name);
      const entry = { name, files: [], cuts: [] };
      const plan = [['SKILL.md', join(from, 'SKILL.md'), join(to, 'SKILL.md'), true]];
      for (const f of markdownFiles(join(from, 'references'))) {
        plan.push([`references/${f}`, join(from, 'references', f), join(to, 'references', f), false]);
      }
      for (const [rel, s, d, isSkillMd] of plan) {
        const { text, cuts } = stripSkill(readFileSync(s, 'utf8'), keepSet, { isSkillMd });
        entry.files.push(rel);
        for (const c of cuts) entry.cuts.push({ file: rel, ...c });
        act(`write ${relative(target, d)}${cuts.length ? ` (${cuts.length} line${cuts.length === 1 ? '' : 's'} cut)` : ''}`, () => {
          mkdirSync(join(d, '..'), { recursive: true });
          writeFileSync(d, text);
        });
      }
      const skipped = existsSync(from)
        ? readdirSync(from, { withFileTypes: true })
            .filter((e) => !(e.isFile() && e.name === 'SKILL.md') && !(e.isDirectory() && e.name === 'references'))
            .map((e) => e.name)
        : [];
      if (skipped.length) log(`  skipped in ${name}/: ${skipped.join(', ')}`);
      report.push(entry);
    }

    act(`write ${relative(target, join(dest, LICENSE_FILE))}`, () =>
      writeFileSync(join(dest, LICENSE_FILE), readFileSync(licenseSrc, 'utf8').replace(/\r\n/g, '\n')),
    );
    act(`write ${relative(target, upstreamPath)}`, () => writeFileSync(upstreamPath, renderUpstream({ srcHead, pinDate, keep, report })));

    const totalCuts = report.reduce((n, e) => n + e.cuts.length, 0);
    log(`${dryRun ? 'dry run: ' : ''}${keep.length} skills, ${totalCuts} lines cut, target ${relative(target, dest) || dest}`);
    return { installed: keep.slice(), cuts: totalCuts, report };
  } finally {
    cleanup();
  }
}

function renderUpstream({ srcHead, pinDate, keep, report }) {
  const lines = [
    '# UPSTREAM: marketingskills (stripped subset)',
    '',
    `Source: ${UPSTREAM_URL} at commit \`${srcHead}\` (${pinDate}), MIT licence (\`${LICENSE_FILE}\` beside this file).`,
    'Installed by `hooks/install-marketing-pack.mjs` from randommonicle/claude-skills; re-run it to',
    'reinstall or to change the set. Do not edit the installed skills in place: edits are lost on the',
    'next run. To change one, change it upstream or fork it out of this list.',
    '',
    'A domain pack installs per project, stripped, with this provenance file; never user-level and',
    'never into the guardrail library (its DECISIONS.md, 2026-09-14).',
    '',
    INSTALLED_HEADING,
    '',
    ...keep.map((n) => `- \`${n}\``),
    '',
    '## Cuts',
    '',
    'Dropped from every kept skill: `evals/`, the `## Tool Integrations` section (vendor registry),',
    'every line linking `tools/integrations/` or `tools/REGISTRY.md`, and Related Skills rows naming a',
    'skill that is not installed. Line numbers are the upstream file\'s at the pinned commit. Prose',
    'mentions of uninstalled skills outside those rows are left as written.',
    '',
  ];
  for (const e of report) {
    lines.push(`### ${e.name}`, '');
    if (!e.cuts.length) {
      lines.push('No cuts.', '');
      continue;
    }
    for (const c of e.cuts) lines.push(`- \`${c.file}:${c.line}\` (${c.why}): \`${c.text.replace(/`/g, "'").trim().slice(0, 120)}\``);
    lines.push('');
  }
  lines.push(
    '## House rules in front of these skills',
    '',
    'Copy produced through these skills gets `unslop-text` as the final pass (the pack is written in the',
    'register that skill strips, em dashes included). Any customer-facing claim, statistic or',
    'certification goes through `substantiate-outward-claims` before it ships.',
    '',
  );
  return lines.join('\n');
}

function main(argv) {
  const args = argv.slice(2);
  let target = null;
  let source = null;
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source') source = args[++i];
    else if (args[i] === '--dry-run') dryRun = true;
    else if (args[i].startsWith('--')) throw new Error(`unknown flag ${args[i]}`);
    else target = args[i];
  }
  if (!target) {
    console.error('usage: node hooks/install-marketing-pack.mjs <target-repo> [--source <clone>] [--dry-run]');
    process.exit(2);
  }
  installPack({ source, target, dryRun });
}

if (process.argv[1] && basename(fileURLToPath(import.meta.url)) === basename(process.argv[1])) {
  try {
    main(process.argv);
  } catch (e) {
    console.error(`install-marketing-pack: ${e.message}`);
    process.exit(1);
  }
}
