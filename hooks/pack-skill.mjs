#!/usr/bin/env node
// Rebuild a skill's .skill archive from its directory, so fixing the drift that
// check-archives.mjs catches is one command:
//   node hooks/pack-skill.mjs <skill-dir>...      # e.g. unslop-ui unslop-code
//   node hooks/pack-skill.mjs --all [--root <dir>] # every */*.skill in the tree
// Writes <skill-dir>/<skill-dir-name>.skill and prints what it bundled.
//
// The membership rule (which files belong, which are excluded) MUST match
// check-archives.mjs exactly — the two are a matched pair, a writer and its
// checker. The check's baseline test (pack a fixture, then run the check, expect
// a pass) reds the moment they disagree, which is the enforcement that keeps this
// comment honest rather than aspirational.
//
// Output is deterministic: members sorted by name, a fixed 1980-01-01 timestamp
// (no clock read), and CRLF normalised to LF, so the same directory packs to the
// same bytes on Windows and on Linux and a rebuild only rewrites the file when
// its content actually changed.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const USAGE = 'usage: node hooks/pack-skill.mjs <skill-dir>... | --all [--root <dir>]';

// Mirror of the same two sets in check-archives.mjs.
const EXCLUDED_BASENAMES = new Set(['README.md', 'UPSTREAM.md', '.gitkeep', '.DS_Store']);
const EXCLUDED_DIRNAMES = new Set(['__pycache__']);
const isJunkFile = (name) => name.endsWith('.pyc');

function die(msg) {
  console.error(`error: ${msg}\n${USAGE}`);
  process.exit(2);
}

function parseArgs(argv) {
  const here = dirname(fileURLToPath(import.meta.url));
  const opts = { all: false, root: resolve(here, '..'), dirs: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--all') {
      opts.all = true;
    } else if (argv[i] === '--root') {
      const value = argv[++i];
      if (!value) die('--root needs a directory');
      opts.root = resolve(value);
    } else if (argv[i].startsWith('--')) {
      die(`unknown argument ${argv[i]}`);
    } else {
      opts.dirs.push(argv[i]);
    }
  }
  if (opts.all && opts.dirs.length > 0) die('--all takes no directory arguments');
  if (!opts.all && opts.dirs.length === 0) die('name at least one skill directory, or pass --all');
  return opts;
}

function normalize(buf) {
  return Buffer.from(buf.toString('latin1').replace(/\r\n/g, '\n'), 'latin1');
}

// The bundled files under a skill directory, sorted by member name for a stable
// archive layout. Member name is the directory name plus the forward-slash
// relative path, matching how check-archives.mjs reads them back.
function bundledMembers(dir, dirName) {
  const members = [];
  const walk = (abs) => {
    const entries = readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRNAMES.has(entry.name)) walk(join(abs, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      if (EXCLUDED_BASENAMES.has(entry.name) || isJunkFile(entry.name) || entry.name.endsWith('.skill')) {
        continue;
      }
      const full = join(abs, entry.name);
      const rel = relative(dir, full).split(sep).join('/');
      members.push({ name: `${dirName}/${rel}`, content: normalize(readFileSync(full)) });
    }
  };
  walk(dir);
  return members.sort((a, b) => a.name.localeCompare(b.name));
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 1);
  return (c ^ 0xffffffff) >>> 0;
}

// Assemble a store-nothing-fancy zip: one deflate-compressed local entry per
// member, a central directory, and an end-of-central-directory record. Fixed
// DOS date 1980-01-01, so nothing here reads the clock.
function buildZip(members) {
  const DOS_DATE = 0x0021; // 1980-01-01
  const DOS_TIME = 0x0000;
  const local = [];
  const central = [];
  let offset = 0;
  for (const { name, content } of members) {
    const nameBuf = Buffer.from(name, 'utf8');
    const comp = deflateRawSync(content);
    const crc = crc32(content);

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4); // version needed
    lh.writeUInt16LE(0, 6); // flags
    lh.writeUInt16LE(8, 8); // deflate
    lh.writeUInt16LE(DOS_TIME, 10);
    lh.writeUInt16LE(DOS_DATE, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(content.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    local.push(lh, nameBuf, comp);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4); // version made by
    cd.writeUInt16LE(20, 6); // version needed
    cd.writeUInt16LE(0, 8); // flags
    cd.writeUInt16LE(8, 10); // deflate
    cd.writeUInt16LE(DOS_TIME, 12);
    cd.writeUInt16LE(DOS_DATE, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(comp.length, 20);
    cd.writeUInt32LE(content.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);

    offset += lh.length + nameBuf.length + comp.length;
  }

  const centralStart = offset;
  const centralLen = central.reduce((sum, c) => sum + c.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(members.length, 8);
  eocd.writeUInt16LE(members.length, 10);
  eocd.writeUInt32LE(centralLen, 12);
  eocd.writeUInt32LE(centralStart, 16);
  return Buffer.concat([...local, ...central, eocd]);
}

function skillDirsFromRoot(root) {
  const dirs = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(root, entry.name);
    if (readdirSync(dir).some((name) => name.endsWith('.skill'))) dirs.push(dir);
  }
  return dirs.sort();
}

const opts = parseArgs(process.argv.slice(2));
const targets = opts.all
  ? skillDirsFromRoot(opts.root)
  : opts.dirs.map((d) => resolve(d));

if (targets.length === 0) die(`no skill directories found under ${opts.root}`);

let changed = 0;
for (const dir of targets) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) die(`${dir} is not a directory`);
  const dirName = basename(dir);
  const members = bundledMembers(dir, dirName);
  if (members.length === 0) die(`${dirName}: no bundled files to pack (only excluded files present?)`);

  const outPath = join(dir, `${dirName}.skill`);
  const next = buildZip(members);
  const prev = existsSync(outPath) ? readFileSync(outPath) : null;
  if (prev && prev.equals(next)) {
    console.log(`unchanged: ${dirName}.skill (${members.length} members)`);
    continue;
  }
  writeFileSync(outPath, next);
  changed++;
  console.log(`packed: ${dirName}.skill (${members.length} members)`);
  for (const m of members) console.log(`    + ${m.name}`);
}

console.log(`\n${changed} archive${changed === 1 ? '' : 's'} rewritten, ${targets.length - changed} already current`);
