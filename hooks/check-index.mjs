#!/usr/bin/env node
// Library index gate, NOT an event hook. Run it against a library root:
//   node hooks/check-index.mjs [--root <dir>]
// Exit 0 when the index agrees with the disk, exit 1 with a named reason when it
// does not. Nothing here reads the clock or the network, so two runs over the
// same tree print the same rows.
//
// Why it exists. The skill count is stated in three places (README prose,
// .claude-plugin/plugin.json, .claude-plugin/marketplace.json) and the README
// table is the discovery surface, so four sites describe one fact and nothing
// asserted any of them. 1d780cb deleted lint-after-edit on promotion to a hook,
// updated the README table row only, and left the prose at 39 and both manifests
// at 39 against 38 on disk; 385755d then corrected the prose and left the
// manifests, so both shipped wrong by one until a later addition made them
// accidentally right. enforce-invariants-in-build: a count in three files with
// no check is a comment.
//
// The count is the weaker half. The load-bearing invariant is the SET: every
// skill on disk appears in the table, and every name in the table exists on
// disk. A deletion is what broke this, and a deletion is exactly what a
// write-triggered hook cannot see, which is why this is a gate run on push
// rather than a warn fired on edit.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE = 'usage: node hooks/check-index.mjs [--root <dir>]';

// Anthropic built-ins land in ~/.claude/skills beside the library once it is
// installed there. They are not the maintainer's, so they are not indexed and
// must not be counted. Kept in step with the same set in audit-fires.mjs.
const BUILTINS = new Set(['docx', 'pdf', 'pptx', 'xlsx', 'morning', 'skill-creator', 'session-start-hook']);

// Vendor skill packs land beside the library the same way (the Cloudflare pack,
// installed 2026-08-07). Machine-local by decision: never committed, indexed or
// counted, reinstalled per machine from their own source (DECISIONS.md,
// 2026-08-10). Kept in step with the same set in audit-fires.mjs and with the
// vendor block in .gitignore; check-index.test.mjs asserts all three agree.
const VENDOR = new Set([
  'agents-sdk', 'cloudflare', 'cloudflare-email-service', 'cloudflare-one',
  'cloudflare-one-migrations', 'durable-objects', 'sandbox-migrate-to-next',
  'sandbox-next', 'sandbox-stable', 'turnstile-spin', 'web-perf',
  'workers-best-practices', 'wrangler',
]);

// One fact, four sites. Each entry says where a stated count lives and how to read it.
const COUNT_SITES = [
  { file: 'README.md', label: 'README prose', pattern: /so (\d+) skills coexist/ },
  { file: join('.claude-plugin', 'plugin.json'), label: 'plugin.json', pattern: /(\d+) guardrail skills/ },
  { file: join('.claude-plugin', 'marketplace.json'), label: 'marketplace.json', pattern: /(\d+) guardrail skills/ },
];

// A table row's first cell holds the skill name in bold. One row may carry
// several slash-separated names (the unslop forks share a row), so the row is
// never a unit of counting, only a source of names.
const TABLE_ROW = /^\| \*\*([^*]+)\*\* \|/;

const failures = [];

function fail(msg) {
  failures.push(msg);
}

// core.autocrlf=true checks these files out with CRLF on Windows, so every
// pattern here would miss end-of-line anchors without this. Normalise once.
function read(path) {
  return readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

function parseArgs(argv) {
  const here = dirname(fileURLToPath(import.meta.url));
  const opts = { root: resolve(here, '..') };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') {
      const value = argv[++i];
      if (!value) {
        console.error(`error: --root needs a directory\n${USAGE}`);
        process.exit(2);
      }
      opts.root = resolve(value);
    } else {
      console.error(`error: unknown argument ${argv[i]}\n${USAGE}`);
      process.exit(2);
    }
  }
  return opts;
}

// A directory is a skill when it holds a SKILL.md. That is also what makes the
// docs/ and hooks/ directories not skills, without naming them here.
function skillsOnDisk(root) {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !BUILTINS.has(entry.name) && !VENDOR.has(entry.name))
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(root, name, 'SKILL.md')))
    .sort();
}

// A frontmatter value as YAML would resolve it, for the five shapes that reach
// a SKILL.md. Each of these was a real defect found by an adversarial code
// review on 2026-09-16, and each let the gate reach a wrong verdict silently.
//
//   description: ""              was stored as the two quote characters, which
//                                are truthy, so the presence check passed on an
//                                empty description.
//   description: # not yet       was stored as the comment text, same effect.
//   name: "alpha-skill"          kept its quotes and then failed the directory
//                                comparison, rejecting valid YAML.
//
// A comment introducer is ` #` after whitespace, per YAML; a `#` inside a word
// is not one. No current frontmatter contains ` #` (checked across all 44).
function scalar(value) {
  if (value === '' || value.startsWith('#')) return '';
  const quoted = value.match(/^"((?:[^"\\]|\\.)*)"\s*(?:#.*)?$/) || value.match(/^'((?:[^']|'')*)'\s*(?:#.*)?$/);
  if (quoted) {
    return value[0] === '"' ? quoted[1].replace(/\\(.)/g, '$1') : quoted[1].replace(/''/g, "'");
  }
  const comment = value.search(/\s#/);
  return (comment >= 0 ? value.slice(0, comment) : value).trim();
}

// Only the leading frontmatter block, so a fenced example inside the body can
// never be read as the skill's own metadata.
//
// Block scalars are handled because three shipped skills use them. A value of
// `>-` (or `|`, `>`, `|-`, `>+`, `|+`) is a YAML indicator, not the value: the
// value is on the indented lines below it. Reading the indicator as the value
// made `unslop-code`, `unslop-text` and `unslop-ui` present a description of the
// literal string ">-", which is truthy, so the presence check below passed over
// three descriptions it had never read. A check that cannot go red for the case
// it exists to catch is not a check (prove-it-can-fail).
//
// A blank line inside a block scalar is a paragraph break, NOT the end of it.
// Ending there truncated the value at the first blank line and reported what was
// left as if it were the whole thing, which is the exact shape no-silent-data-drop
// exists to stop, inside the gate that enforces it. The scalar ends at the first
// non-blank line that is not indented.
function frontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fields = {};
  const lines = match[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const field = lines[i].match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!field) continue;
    const [, key, raw] = field;
    const value = raw.trim();
    if (/^[>|][-+]?$/.test(value)) {
      const folded = [];
      while (i + 1 < lines.length) {
        if (lines[i + 1].trim() === '') {
          let j = i + 2;
          while (j < lines.length && lines[j].trim() === '') j++;
          if (j >= lines.length || !/^\s+\S/.test(lines[j])) break;
          i++;
          continue;
        }
        if (!/^\s+\S/.test(lines[i + 1])) break;
        folded.push(lines[++i].trim());
      }
      fields[key] = folded.join(' ').trim();
    } else {
      fields[key] = scalar(value);
    }
  }
  return fields;
}

function indexedNames(readmeText) {
  const names = new Set();
  for (const line of readmeText.split('\n')) {
    const row = line.match(TABLE_ROW);
    if (!row) continue;
    for (const name of row[1].split('/')) {
      const trimmed = name.trim();
      if (trimmed) names.add(trimmed);
    }
  }
  return names;
}

const { root } = parseArgs(process.argv.slice(2));

for (const required of ['README.md', ...COUNT_SITES.map((site) => site.file)]) {
  if (!existsSync(join(root, required))) {
    console.error(`error: ${required} not found under ${root}\n${USAGE}`);
    process.exit(2);
  }
}

const disk = skillsOnDisk(root);
if (disk.length === 0) {
  console.error(`error: no skills found under ${root}, refusing to assert an empty library\n${USAGE}`);
  process.exit(2);
}

// 1 and 2. The set, in both directions.
const indexed = indexedNames(read(join(root, 'README.md')));
for (const skill of disk) {
  if (!indexed.has(skill)) {
    fail(`${skill} has a SKILL.md but no README table row, so it is undiscoverable in the index`);
  }
}
for (const name of [...indexed].sort()) {
  if (!disk.includes(name)) {
    fail(`README table lists ${name} but no ${name}/SKILL.md exists, so the row is stale`);
  }
}

// 3 and 4. Each skill's frontmatter, which is what the harness matches on.
for (const skill of disk) {
  const fields = frontmatter(read(join(root, skill, 'SKILL.md')));
  if (!fields) {
    fail(`${skill}/SKILL.md has no frontmatter block`);
    continue;
  }
  if (fields.name !== skill) {
    fail(`${skill}/SKILL.md declares name: ${fields.name || '(missing)'}, which does not match its directory`);
  }
  if (!fields.description) {
    fail(`${skill}/SKILL.md has no description, so nothing can trigger it`);
  }
}

// 5. The stated counts, the half that drifted twice.
for (const site of COUNT_SITES) {
  const match = read(join(root, site.file)).match(site.pattern);
  if (!match) {
    fail(`${site.label} no longer states a skill count where this check reads it (${site.pattern})`);
    continue;
  }
  const stated = Number(match[1]);
  if (stated !== disk.length) {
    fail(`${site.label} states ${stated} skills, ${disk.length} on disk`);
  }
}

if (failures.length > 0) {
  console.log(`FAIL: ${failures.length} index problem${failures.length === 1 ? '' : 's'} under ${root}`);
  for (const problem of failures) console.log(`  - ${problem}`);
  process.exit(1);
}

console.log(`ok: ${disk.length} skills, all indexed, all named, all three counts agree`);
