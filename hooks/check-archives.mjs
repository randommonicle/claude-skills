#!/usr/bin/env node
// Skill-archive freshness gate, NOT an event hook. Run it against a library root:
//   node hooks/check-archives.mjs [--root <dir>]
// Exit 0 when every bundled .skill archive matches its skill directory on disk,
// exit 1 with a named reason for every stale/missing/orphaned member, exit 2 for
// a structural problem (no archives, a corrupt zip, an unsupported format). It
// reads only the files and never the clock or the network, so two runs over the
// same tree print the same rows.
//
// Why it exists. Each */*.skill archive is a plain zip of that skill's bundled
// files (SKILL.md, references/*, scripts/*), committed beside the directory it
// mirrors. Nothing regenerates it when the directory changes, so the two drift
// silently: the archive keeps shipping the old bytes while the directory moves
// on. On 2026-08-06 all three unslop-* archives were found stale at once — their
// archived scan scripts predated local patches recorded in the UPSTREAM.md
// files, and unslop-text's archived SKILL.md had drifted from the directory too
// — and had to be rebuilt by hand (0e2cac7). enforce-invariants-in-build: "the
// archive mirrors the directory" was a convention nothing asserted, so it broke.
//
// Like the index gate, the load-bearing invariant is the SET in both directions:
// every bundled file on disk appears in the archive, every archive member exists
// on disk, and the two copies of each file carry the same content. A file added
// to a directory but not the archive is exactly the drift a Write/Edit hook
// cannot see (the write lands on the directory file, not the stale archive),
// which is why this is a gate run on push/CI rather than a warn fired on edit.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const USAGE = 'usage: node hooks/check-archives.mjs [--root <dir>]';

// Files that live in a skill directory but are deliberately NOT bundled into the
// archive. README.md and UPSTREAM.md are maintainer-facing provenance; .gitkeep
// only exists to track an otherwise-empty references/ or scripts/ directory. The
// .skill archive itself lives in the directory too and never bundles a copy of
// itself. Kept in step with the same set in pack-skill.mjs — the test's baseline
// case (pack, then check passes) reds if the two ever disagree.
const EXCLUDED_BASENAMES = new Set(['README.md', 'UPSTREAM.md', '.gitkeep', '.DS_Store']);

// Untracked build junk that can appear on disk (see .gitignore) after the python
// scanners run. It is never committed and never in the archive, so it must not be
// mistaken for a bundled file the archive is missing.
const EXCLUDED_DIRNAMES = new Set(['__pycache__']);
const isJunkFile = (name) => name.endsWith('.pyc');

const failures = [];
const fail = (msg) => failures.push(msg);

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

// CRLF vs LF is a checkout-time artefact: .gitattributes forces *.md to LF but
// leaves scripts on text=auto, so the same .py is CRLF on a Windows working tree
// and LF on Linux/CI. The archive carries whatever the packer's machine had.
// Normalising both sides means this gate compares content, which is what
// "stale" means here, and never reds on an end-of-line difference that varies by
// who checked the tree out. Done at the byte level (latin1 is a lossless 1:1
// byte<->char map) so a non-text member is compared exactly rather than mangled.
function normalize(buf) {
  return Buffer.from(buf.toString('latin1').replace(/\r\n/g, '\n'), 'latin1');
}

// Every */*.skill: a *.skill file one directory deep. The skill directory is the
// file's parent, and its members are stored under that directory's name as the
// path prefix (unslop-ui/SKILL.md), so the prefix is derived, never assumed to
// equal the archive's basename.
function findArchives(root) {
  const archives = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dirName = entry.name;
    const dir = join(root, dirName);
    for (const child of readdirSync(dir, { withFileTypes: true })) {
      if (child.isFile() && child.name.endsWith('.skill')) {
        archives.push({ dirName, dir, skillFile: join(dir, child.name) });
      }
    }
  }
  return archives.sort((a, b) => a.skillFile.localeCompare(b.skillFile));
}

// The bundled files on disk, as a Map of archive-member-name -> raw bytes. The
// member name is the directory name plus the forward-slash relative path, which
// is exactly how the archive stores it.
function bundledOnDisk(dir, dirName) {
  const members = new Map();
  const walk = (abs) => {
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
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
      members.set(`${dirName}/${rel}`, readFileSync(full));
    }
  };
  walk(dir);
  return members;
}

// A minimal zip reader over the central directory. It resolves member content
// from the recorded compression method (0 stored / 8 raw deflate) and ignores
// directory entries, which some of these archives carry as zero-byte members and
// some do not. Throws (never fails soft) on anything it cannot read, so a corrupt
// archive is a structural exit 2 rather than a silent pass.
function readArchive(skillFile) {
  const buf = readFileSync(skillFile);
  const EOCD = 0x06054b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (i >= 0 && buf.readUInt32LE(i) === EOCD) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('no end-of-central-directory record (not a zip?)');
  const count = buf.readUInt16LE(eocd + 10);
  const cdSize = buf.readUInt32LE(eocd + 12);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
    throw new Error('zip64 archives are not supported by this gate');
  }

  const members = new Map();
  let p = cdOffset;
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`corrupt central directory at byte ${p}`);
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const uncompSize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith('/')) continue; // directory entry, carries no content

    // The local header's own name/extra lengths locate the data; its size and
    // crc fields may be zeroed under a data descriptor, so the central
    // directory's compSize (read above) is the authority for how much to read.
    if (buf.readUInt32LE(localOffset) !== 0x04034b50) throw new Error(`corrupt local header for ${name}`);
    const localNameLen = buf.readUInt16LE(localOffset + 26);
    const localExtraLen = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);
    let content;
    if (method === 0) content = Buffer.from(raw);
    else if (method === 8) content = inflateRawSync(raw);
    else throw new Error(`${name}: unsupported compression method ${method}`);
    if (content.length !== uncompSize) throw new Error(`${name}: inflated size ${content.length} != recorded ${uncompSize}`);
    members.set(name, content);
  }
  return members;
}

const { root } = parseArgs(process.argv.slice(2));

if (!existsSync(root) || !statSync(root).isDirectory()) die(`root ${root} is not a directory`);

const archives = findArchives(root);
if (archives.length === 0) {
  die(`no */*.skill archives found under ${root}, refusing to assert an up-to-date set`);
}

let memberCount = 0;
for (const { dirName, dir, skillFile } of archives) {
  const label = relative(root, skillFile).split(sep).join('/');
  const disk = bundledOnDisk(dir, dirName);

  let archive;
  try {
    archive = readArchive(skillFile);
  } catch (err) {
    // A member is unreadable/corrupt: the gate cannot judge freshness, so this
    // is structural (exit 2), reported for every archive before exiting.
    die(`${label}: ${err.message}`);
  }

  memberCount += archive.size;

  for (const [member, diskBytes] of disk) {
    if (!archive.has(member)) {
      fail(`${label}: ${member} is bundled on disk but missing from the archive`);
      continue;
    }
    if (!normalize(diskBytes).equals(normalize(archive.get(member)))) {
      fail(`${label}: ${member} differs — the archive is stale relative to the file on disk`);
    }
  }
  for (const member of archive.keys()) {
    if (!disk.has(member)) {
      fail(`${label}: ${member} is in the archive but not a bundled file on disk (orphaned member)`);
    }
  }
}

if (failures.length > 0) {
  console.log(`FAIL: ${failures.length} archive problem${failures.length === 1 ? '' : 's'} under ${root}`);
  for (const problem of failures.sort()) console.log(`  - ${problem}`);
  process.exit(1);
}

console.log(`ok: ${archives.length} archives, ${memberCount} members, all match their skill directories`);
