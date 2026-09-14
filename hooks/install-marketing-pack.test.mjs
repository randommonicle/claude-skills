#!/usr/bin/env node
// Proves install-marketing-pack.mjs strips what it says it strips and refuses
// what it says it refuses (prove-it-can-fail: every assertion below is paired
// with fixture content that would survive if the corresponding cut were
// skipped). Fixtures are a throwaway git repo under os.tmpdir() shaped like
// the upstream pack, so no network; the pin under test is the fixture's HEAD.
// Run: node hooks/install-marketing-pack.test.mjs
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installPack, stripSkill } from './install-marketing-pack.mjs';

let fails = 0;
function check(ok, name, detail = '') {
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`);
}
function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}
function write(path, text) {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, text);
}
// Sorted "relative path: sha256" listing, for tree-identity comparisons. A
// size would pass a re-run whose UPSTREAM.md carried a different date.
function tree(dir, prefix = '') {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...tree(join(dir, e.name), rel));
    else out.push(`${rel}: ${createHash('sha256').update(readFileSync(join(dir, e.name))).digest('hex')}`);
  }
  return out;
}

const root = mkdtempSync(join(tmpdir(), 'imp-test-'));
const upstream = join(root, 'upstream');
const target = join(root, 'target');
const quiet = () => {};

try {
  // --- fixture upstream -----------------------------------------------------
  mkdirSync(upstream, { recursive: true });
  writeFileSync(join(upstream, 'LICENSE'), 'MIT License\r\n\r\nCopyright (c) fixture\r\n');
  // alpha: tools section in the middle, list rows with both separators.
  write(
    join(upstream, 'skills', 'alpha', 'SKILL.md'),
    [
      '---',
      'name: alpha',
      'description: "alpha"',
      '---',
      '',
      '# Alpha',
      '',
      'Body.',
      '',
      '---',
      '',
      '## Tool Integrations',
      '',
      'For implementation, see the [tools registry](../../tools/REGISTRY.md).',
      '',
      '| Tool | Guide |',
      '|------|-------|',
      '| **Vendor** | [vendor.md](../../tools/integrations/vendor.md) |',
      '',
      '---',
      '',
      '## Related Skills',
      '',
      '- **beta**: kept, colon form',
      '- **dropped-one**: dropped, colon form',
      '- **gamma** — kept, dash form',
      '- **dropped-two** — dropped, dash form',
      '',
    ].join('\n'),
  );
  write(join(upstream, 'skills', 'alpha', 'references', 'guide.md'), 'Guide.\n\nSee [x](../../../tools/integrations/x.md) for details.\n\nKeep this line.\n');
  write(join(upstream, 'skills', 'alpha', 'evals', 'evals.json'), '{}');
  write(join(upstream, 'skills', 'alpha', 'template.html'), '<html></html>');
  // beta: table-form related rows, tools section LAST in the file.
  write(
    join(upstream, 'skills', 'beta', 'SKILL.md'),
    [
      '---',
      'name: beta',
      'description: "beta"',
      '---',
      '',
      '# Beta',
      '',
      '## Related Skills',
      '',
      '| When to hand off | Skill |',
      '|-----------------|-------|',
      '| kept | `alpha` |',
      '| dropped | `dropped-one` |',
      '',
      '---',
      '',
      '## Tool Integrations',
      '',
      'For implementation, see the [tools registry](../../tools/REGISTRY.md).',
      '',
    ].join('\n'),
  );
  // gamma: nothing to cut. A "Tools Referenced" prose section must survive.
  // Written with CRLF, as a Windows autocrlf clone of upstream reads: the
  // installer's output must not depend on the source clone's line endings.
  write(
    join(upstream, 'skills', 'gamma', 'SKILL.md'),
    ['---', 'name: gamma', 'description: "gamma"', '---', '', '# Gamma', '', '## Tools Referenced', '', '- Search Console', ''].join('\r\n'),
  );
  write(join(upstream, 'skills', 'dropped-one', 'SKILL.md'), '---\nname: dropped-one\n---\n');
  git(['init', '--quiet', '-b', 'main'], upstream);
  git(['config', 'user.name', 'Fixture'], upstream);
  git(['config', 'user.email', 'fixture@example.invalid'], upstream);
  git(['config', 'commit.gpgsign', 'false'], upstream);
  git(['config', 'core.autocrlf', 'false'], upstream); // no CRLF warnings on Windows checkouts
  git(['add', '.'], upstream);
  // Backdated so UPSTREAM.md's date can be told apart from the run date.
  execFileSync('git', ['commit', '--quiet', '-m', 'fixture'], {
    cwd: upstream,
    encoding: 'utf8',
    env: { ...process.env, GIT_AUTHOR_DATE: '2020-01-02T00:00:00Z', GIT_COMMITTER_DATE: '2020-01-02T00:00:00Z' },
  });
  const pin = git(['rev-parse', 'HEAD'], upstream);

  // --- target with a foreign same-named skill --------------------------------
  mkdirSync(join(target, '.claude', 'skills', 'gamma'), { recursive: true });
  writeFileSync(join(target, '.claude', 'skills', 'gamma', 'SKILL.md'), 'not ours\n');

  const KEEP = ['alpha', 'beta', 'gamma'];

  // wrong pin refuses before touching the target
  let err = null;
  try {
    installPack({ source: upstream, target, keep: ['alpha'], pin: 'f'.repeat(40), log: quiet });
  } catch (e) {
    err = e;
  }
  check(err && /pinned commit/.test(err.message), 'wrong pin refuses', err ? err.message : 'no error');
  check(!existsSync(join(target, '.claude', 'skills', 'alpha')), 'wrong pin wrote nothing');

  // foreign dir refuses before touching the target
  err = null;
  try {
    installPack({ source: upstream, target, keep: KEEP, pin, log: quiet });
  } catch (e) {
    err = e;
  }
  check(err && /foreign skill/.test(err.message), 'foreign same-named dir refuses', err ? err.message : 'no error');
  check(readFileSync(join(target, '.claude', 'skills', 'gamma', 'SKILL.md'), 'utf8') === 'not ours\n', 'foreign dir untouched');
  rmSync(join(target, '.claude', 'skills', 'gamma'), { recursive: true, force: true });

  // dry run writes nothing
  const logged = [];
  installPack({ source: upstream, target, keep: KEEP, pin, dryRun: true, log: (l) => logged.push(l) });
  check(!existsSync(join(target, '.claude', 'skills', 'alpha')), 'dry run writes nothing');
  check(logged.some((l) => /^would write/.test(l)), 'dry run reports what it would write');

  // real install
  const r = installPack({ source: upstream, target, keep: KEEP, pin, log: quiet });
  const dest = join(target, '.claude', 'skills');
  const alpha = readFileSync(join(dest, 'alpha', 'SKILL.md'), 'utf8');
  const beta = readFileSync(join(dest, 'beta', 'SKILL.md'), 'utf8');
  const gamma = readFileSync(join(dest, 'gamma', 'SKILL.md'), 'utf8');
  const guide = readFileSync(join(dest, 'alpha', 'references', 'guide.md'), 'utf8');

  check(!existsSync(join(dest, 'alpha', 'evals')), 'evals/ dropped');
  check(!existsSync(join(dest, 'alpha', 'template.html')), 'non-markdown dropped');
  check(!/Tool Integrations/.test(alpha) && !/tools\/REGISTRY/.test(alpha) && !/vendor\.md/.test(alpha), 'tools section gone (middle of file)');
  check(/\nBody\.\n\n---\n\n## Related Skills\n/.test(alpha), 'one separator survives between body and Related Skills', JSON.stringify(alpha));
  check(!/Tool Integrations/.test(beta) && !/tools\/REGISTRY/.test(beta), 'tools section gone (end of file)');
  check(!/---\s*$/.test(beta), 'no dangling separator at end of file', JSON.stringify(beta.slice(-40)));
  check(/- \*\*beta\*\*: kept/.test(alpha) && /- \*\*gamma\*\* — kept/.test(alpha), 'kept list rows retained, both separators');
  check(!/dropped-one/.test(alpha) && !/dropped-two/.test(alpha), 'dropped list rows gone, both separators');
  check(/\| kept \| `alpha` \|/.test(beta) && !/dropped-one/.test(beta), 'table rows: kept retained, dropped gone');
  check(/## Tools Referenced\n\n- Search Console/.test(gamma), 'Tools Referenced prose section survives');
  check(!gamma.includes('\r') && !readFileSync(join(dest, 'LICENSE.marketingskills'), 'utf8').includes('\r'), 'CRLF source is written as LF (output independent of the clone\'s autocrlf)');
  check(!/tools\/integrations/.test(guide) && /Keep this line\./.test(guide) && /^Guide\./.test(guide), 'registry link line cut from references/, neighbours kept');
  check(existsSync(join(dest, 'LICENSE.marketingskills')), 'licence copied');
  const up = readFileSync(join(dest, 'UPSTREAM.md'), 'utf8');
  check(up.includes(`\`${pin}\``) && /## Installed\n\n- `alpha`\n- `beta`\n- `gamma`\n/.test(up), 'UPSTREAM.md pins the commit and lists the set');
  const today = new Date().toISOString().slice(0, 10);
  const sourceLine = up.split('\n')[2];
  check(
    sourceLine.includes('(2020-01-02)') && !sourceLine.includes(today) && !/^Installed \d{4}-\d{2}-\d{2}/m.test(up),
    'UPSTREAM.md carries the pinned commit date, not the run date',
    sourceLine,
  );
  check(/`SKILL\.md:12` \(tools section\)/.test(up) && /`references\/guide\.md:3` \(registry link\)/.test(up) && /related row: dropped-two not installed/.test(up), 'UPSTREAM.md lists cuts by file and upstream line', up);
  check(r.installed.length === 3 && r.cuts > 0, `report: ${r.installed.length} installed, ${r.cuts} cuts`);

  // idempotent: identical tree on re-run (UPSTREAM.md carries the date, same day)
  const before = tree(dest);
  installPack({ source: upstream, target, keep: KEEP, pin, log: quiet });
  check(JSON.stringify(tree(dest)) === JSON.stringify(before), 're-run leaves an identical tree');

  // a shrunk keep list removes the now-dropped dir and its row elsewhere
  installPack({ source: upstream, target, keep: ['alpha', 'beta'], pin, log: quiet });
  check(!existsSync(join(dest, 'gamma')), 'shrunk keep list removes the dropped dir');
  check(!/\*\*gamma\*\*/.test(readFileSync(join(dest, 'alpha', 'SKILL.md'), 'utf8')), 'and the row that named it');

  // stripSkill on its own: references/ files get only the link cut
  const s = stripSkill('## Related Skills\n\n- **zzz**: x\n', new Set(['a']), { isSkillMd: false });
  check(/\*\*zzz\*\*/.test(s.text) && s.cuts.length === 0, 'references/ files keep Related rows (only SKILL.md is sectioned)');
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
