#!/usr/bin/env node
// Proves session-recon.mjs surfaces the skills library's update health, is
// SILENT while the library is current, and names a DIFFERENT action for each
// way the updater can refuse. The hook is copied into a throwaway tree so the
// status path it derives from its own location is isolated from the real
// ~/.claude/skills-update.json.
//
// It reds against: a version that reads the status only after the .git check
// (the non-repo case goes quiet), a version with no staleness branch (a
// scheduled task that stopped reads as healthy), a version that mentions the
// library when all is well, and a version that gives every refusal the same
// message (the ahead case is told it is "behind", which is the opposite).
// The norm-block cases (2026-09-24) red against a version with no check, one that
// compares line endings (a CRLF CLAUDE.md reads as drift), one that runs under a
// plugin install or an unknown layout (a false alarm on every session there), one
// that tells only the model, and one that reports a NORMS.md it cannot parse.
// The agent cases (2026-09-28) red against a version with no check, one that compares
// line endings, one that reports agents kept only at user level, one that runs under a
// plugin install or an unknown layout, one that tells only the model, and one that
// gives a missing copy and an old copy the same message.
// Run: node hooks/session-recon.test.mjs
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'session-recon.mjs');
let fails = 0;
const pass = (m) => console.log('PASS  | ' + m);
const fail = (m) => {
  console.log('FAIL  | ' + m);
  fails++;
};

const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();

// <root>/skills/hooks/session-recon.mjs, so the hook resolves its status file to
// <root>/skills-update.json, NORMS.md to <root>/skills/NORMS.md, CLAUDE.md to
// <root>/CLAUDE.md, the library's agents to <root>/skills/agents and the user's to
// <root>/agents, exactly as it does beside the real library. `layout.dir` stages
// another layout; a null normsMd or claudeMd leaves that file out, and
// `layout.agents` maps file names to text under `lib` and `user`.
function stage(status, cwdIsRepo, layout = null) {
  const root = mkdtempSync(join(tmpdir(), 'recon-'));
  const lib = join(root, layout?.dir ?? 'skills');
  mkdirSync(join(lib, 'hooks'), { recursive: true });
  copyFileSync(HOOK, join(lib, 'hooks', 'session-recon.mjs'));
  if (layout?.normsMd != null) writeFileSync(join(lib, 'NORMS.md'), layout.normsMd, 'utf8');
  if (layout?.claudeMd != null) writeFileSync(join(root, 'CLAUDE.md'), layout.claudeMd, 'utf8');
  for (const [where, dir] of [['lib', join(lib, 'agents')], ['user', join(root, 'agents')]]) {
    for (const [name, text] of Object.entries(layout?.agents?.[where] ?? {})) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, name), text, 'utf8');
    }
  }
  if (status !== null) {
    writeFileSync(
      join(root, 'skills-update.json'),
      typeof status === 'string' ? status : JSON.stringify(status),
      'utf8',
    );
  }
  const cwd = join(root, 'session-dir');
  mkdirSync(cwd, { recursive: true });
  if (layout?.prep) layout.prep(root, cwd);
  if (cwdIsRepo) {
    // No remote: `git fetch` fails and the hook ignores it, so this stays offline.
    spawnSync('git', ['init', '-q', '-b', 'main', cwd], { encoding: 'utf8' });
    writeFileSync(join(cwd, 'f.txt'), 'x\n');
    spawnSync('git', ['-C', cwd, 'add', '-A'], { encoding: 'utf8' });
    spawnSync('git', ['-C', cwd, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'init'], {
      encoding: 'utf8',
    });
    if (layout?.repo) layout.repo(cwd, (...args) => spawnSync('git', ['-C', cwd, '-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { encoding: 'utf8' }));
  }
  return { root, hook: join(lib, 'hooks', 'session-recon.mjs'), cwd, env: layout?.env ?? {} };
}

function runHook(s) {
  return new Promise((resolve) => {
    // A plugin marker inherited from whoever runs the suite would skip the norm check.
    const env = { ...process.env, ...s.env };
    if (!('CLAUDE_PLUGIN_ROOT' in s.env)) delete env.CLAUDE_PLUGIN_ROOT;
    const p = spawn(process.execPath, [s.hook], { stdio: ['pipe', 'pipe', 'pipe'], env });
    let out = '';
    p.stdout.on('data', (c) => (out += c));
    p.on('close', (code) => {
      let context = '', system = '';
      try {
        const o = JSON.parse(out);
        context = o.hookSpecificOutput.additionalContext;
        system = o.systemMessage ?? '';
      } catch {}
      resolve({ code, out, context, system });
    });
    p.stdin.end(JSON.stringify({ cwd: s.cwd }));
  });
}

// Each case carries its own fixture: parallel arrays let a case silently run
// against the wrong status file, which is the failure this suite exists to catch
// in other people's code.
const cases = [];
const test = (name, fixture, fn, cwdIsRepo = false, layout = null) => cases.push({ name, fixture, fn, cwdIsRepo, layout });

test('no status file at all stays silent', null, async (r) => {
  if (r.code !== 0) return 'exit ' + r.code;
  if (/skills library/i.test(r.out)) return 'mentioned the library with no status file';
  return true;
});

test('state=current and fresh stays silent', { state: 'current', at: hoursAgo(2) }, async (r) => {
  if (/skills library/i.test(r.out)) return 'mentioned the library while it is current';
  return true;
});

test(
  'state=updated with hooks changed says so',
  { state: 'updated', at: hoursAgo(2), commits: 4, hooksChanged: true, skillsChanged: false },
  async (r) => {
    if (!/skills library/i.test(r.context)) return 'no mention of the update';
    if (!/hooks/i.test(r.context)) return 'did not name hooks as the thing that changed';
    return true;
  },
);

test(
  'state=updated with nothing notable changed stays silent',
  { state: 'updated', at: hoursAgo(2), commits: 4, hooksChanged: false, skillsChanged: false },
  async (r) => {
    if (/skills library/i.test(r.out)) return 'noise for a docs-only fast-forward';
    return true;
  },
);

test('a dirty refusal asks for the action that clears it', { state: 'skipped-dirty', at: hoursAgo(2) }, async (r) => {
  if (!/skills library/i.test(r.context)) return 'refusal not surfaced: ' + r.context;
  if (!/commit or stash/i.test(r.context)) return 'did not name the fix: ' + r.context;
  if (/behind/i.test(r.context)) return 'called a dirty tree "behind": ' + r.context;
  return true;
});

test(
  'an ahead refusal asks to push, and never calls the library behind',
  { state: 'skipped-ahead', at: hoursAgo(2), ahead: 2, behind: 0 },
  async (r) => {
    if (!/push them/i.test(r.context)) return 'did not name the fix: ' + r.context;
    if (/behind/i.test(r.context)) return 'an AHEAD library described as behind: ' + r.context;
    if (!/2 local commit/.test(r.context)) return 'did not carry the count: ' + r.context;
    return true;
  },
);

test(
  'a stale status file is reported even though its state is healthy',
  { state: 'current', at: hoursAgo(48) },
  async (r) => {
    if (!/no update run for/i.test(r.context)) return 'staleness not surfaced: ' + r.context;
    return true;
  },
);

test('a malformed status file fails open and stays quiet', '{ not json', async (r) => {
  if (r.code !== 0) return 'exit ' + r.code + ' (must never break a session)';
  if (/skills library/i.test(r.out)) return 'reported on an unparseable file';
  return true;
});

test(
  'an unhealthy library is reported even when cwd is not a repo',
  { state: 'error', at: hoursAgo(1), reason: 'fetch failed' },
  async (r) => {
    if (!/skills library/i.test(r.context)) return 'silent in a non-repo directory';
    if (!/fetch failed/.test(r.context)) return 'dropped the reason: ' + r.context;
    return true;
  },
);

test(
  'in a repo, both the library line and the repo status appear',
  { state: 'error', at: hoursAgo(1), reason: 'fetch failed' },
  async (r) => {
    if (!/skills library/i.test(r.context)) return 'library line missing';
    if (!/status:/.test(r.context)) return 'repo status missing: ' + r.context;
    return true;
  },
  true,
);

// The norm block, 2026-09-24. Each silent case also stages an unhealthy update status,
// so the hook must visibly run: a crash exits 0 with nothing, which would otherwise
// pass as silence (prove-it-can-fail rule 10).
const block = (v, body = 'norm one\nnorm two') =>
  `<!-- BEGIN CLAUDE-SKILLS NORMS ${v} -->\n${body}\n<!-- END CLAUDE-SKILLS NORMS ${v} -->`;
const NORMS_MD = '# Layer 1 norms\n\n' + block('v2026-07-29') + '\n\nafter the block\n';
const NO_BLOCK = '# Global rules\n\nno norm block here\n';
const unhealthy = { state: 'error', at: hoursAgo(1), reason: 'staged fault' };
const ranAndSaidNothingAboutNorms = (r) => {
  if (r.code !== 0) return 'exit ' + r.code;
  if (!/staged fault/.test(r.context)) return 'the hook produced no context, so silence proves nothing: ' + r.out;
  if (/Layer 1 norms/.test(r.out)) return 'reported the norms: ' + r.context;
  return true;
};

test(
  'a norm block matching NORMS.md stays silent, CRLF line endings included',
  unhealthy,
  async (r) => ranAndSaidNothingAboutNorms(r),
  false,
  { normsMd: NORMS_MD, claudeMd: ('# Global rules\n\n' + block('v2026-07-29') + '\n').replace(/\n/g, '\r\n') },
);

test(
  'no norm block in CLAUDE.md is reported, to the person as well as the model',
  { state: 'current', at: hoursAgo(1) },
  async (r) => {
    if (!/has no CLAUDE-SKILLS NORMS block/.test(r.context)) return 'not reported to the model: ' + r.out;
    if (!/Layer 1 norms/.test(r.system)) return 'no systemMessage for the person: ' + r.out;
    if (!/NORMS\.md/.test(r.context)) return 'did not name the file to paste from: ' + r.context;
    return true;
  },
  false,
  { normsMd: NORMS_MD, claudeMd: NO_BLOCK },
);

test(
  'no CLAUDE.md at all is reported as its own case',
  { state: 'current', at: hoursAgo(1) },
  async (r) => {
    if (!/does not exist/.test(r.context)) return 'a missing file not named as missing: ' + r.out;
    return true;
  },
  false,
  { normsMd: NORMS_MD, claudeMd: null },
);

test(
  'an older block names both versions',
  { state: 'current', at: hoursAgo(1) },
  async (r) => {
    if (!/is v2026-07-23 but NORMS\.md is v2026-07-29/.test(r.context)) return 'versions not named: ' + r.out;
    return true;
  },
  false,
  { normsMd: NORMS_MD, claudeMd: '# Global rules\n\n' + block('v2026-07-23') + '\n' },
);

test(
  'the same marker with edited text is reported as drift',
  { state: 'current', at: hoursAgo(1) },
  async (r) => {
    if (!/differs from NORMS\.md under the same marker \(v2026-07-29\)/.test(r.context)) return 'drift not reported: ' + r.out;
    return true;
  },
  false,
  { normsMd: NORMS_MD, claudeMd: '# Global rules\n\n' + block('v2026-07-29', 'norm one\nnorm TWO') + '\n' },
);

test(
  'a plugin install is skipped, since norms-inject supplies the block there',
  unhealthy,
  async (r) => ranAndSaidNothingAboutNorms(r),
  false,
  { normsMd: NORMS_MD, claudeMd: NO_BLOCK, env: { CLAUDE_PLUGIN_ROOT: 'C:/plugin' } },
);

test(
  'a layout other than <config>/skills is skipped, since CLAUDE.md could be anywhere',
  unhealthy,
  async (r) => ranAndSaidNothingAboutNorms(r),
  false,
  { normsMd: NORMS_MD, claudeMd: NO_BLOCK, dir: 'repo' },
);

test(
  'a NORMS.md without a block fails open and stays quiet',
  unhealthy,
  async (r) => ranAndSaidNothingAboutNorms(r),
  false,
  { normsMd: '# Layer 1 norms, markers lost\n', claudeMd: NO_BLOCK },
);

// The agents, 2026-09-28. Same rule as the norm cases: a silent case stages an unhealthy
// update status, so the hook must visibly run before its silence counts.
const agent = (name, body = 'Review the change.') =>
  `---\nname: ${name}\ndescription: Reviews ${name} changes.\ntools: Read\n---\n\n${body}\n`;
const ranAndSaidNothingAboutAgents = (r) => {
  if (r.code !== 0) return 'exit ' + r.code;
  if (!/staged fault/.test(r.context)) return 'the hook produced no context, so silence proves nothing: ' + r.out;
  if (/Agents:/.test(r.out)) return 'reported the agents: ' + r.context;
  return true;
};

test(
  'library agents with matching copies stay silent, CRLF line endings included',
  unhealthy,
  async (r) => ranAndSaidNothingAboutAgents(r),
  false,
  {
    agents: {
      lib: { 'alpha.md': agent('alpha'), 'beta.md': agent('beta') },
      user: { 'alpha.md': agent('alpha').replace(/\n/g, '\r\n'), 'beta.md': agent('beta') },
    },
  },
);

test(
  'a library agent with no copy is reported as not loaded, to the person as well as the model',
  { state: 'current', at: hoursAgo(1) },
  async (r) => {
    if (!/Not in .+?, so not loaded this session: alpha\.md\./.test(r.context)) return 'missing copy not reported to the model: ' + r.out;
    if (!/Agents:/.test(r.system)) return 'no systemMessage for the person: ' + r.out;
    if (!/Copy from .+agents\./.test(r.context)) return 'did not name the directory to copy from: ' + r.context;
    return true;
  },
  false,
  { agents: { lib: { 'alpha.md': agent('alpha') }, user: {} } },
);

test(
  'a copy that differs from the library is reported as an old version, not as missing',
  { state: 'current', at: hoursAgo(1) },
  async (r) => {
    if (!/Different from the library, so an old version runs: alpha\.md\./.test(r.context)) return 'drift not reported: ' + r.out;
    if (/not loaded/.test(r.context)) return 'an old copy described as missing: ' + r.context;
    return true;
  },
  false,
  { agents: { lib: { 'alpha.md': agent('alpha', 'Review the change, new rules.') }, user: { 'alpha.md': agent('alpha') } } },
);

test(
  'a missing copy and an old copy are named in separate clauses',
  { state: 'current', at: hoursAgo(1) },
  async (r) => {
    if (!/not loaded this session: alpha\.md\. Different from the library, so an old version runs: beta\.md\./.test(r.context))
      return 'the two failure modes were not separated: ' + r.context;
    return true;
  },
  false,
  { agents: { lib: { 'alpha.md': agent('alpha'), 'beta.md': agent('beta', 'New.') }, user: { 'beta.md': agent('beta') } } },
);

test(
  'an agent kept only at user level is not reported, since those are machine-local by decision',
  unhealthy,
  async (r) => ranAndSaidNothingAboutAgents(r),
  false,
  { agents: { lib: { 'alpha.md': agent('alpha') }, user: { 'alpha.md': agent('alpha'), 'debugger.md': agent('debugger') } } },
);

test(
  'a plugin install is skipped, since the plugin loads agents/ itself',
  unhealthy,
  async (r) => ranAndSaidNothingAboutAgents(r),
  false,
  { agents: { lib: { 'alpha.md': agent('alpha') }, user: {} }, env: { CLAUDE_PLUGIN_ROOT: 'C:/plugin' } },
);

test(
  'a layout other than <config>/skills is skipped for agents too',
  unhealthy,
  async (r) => ranAndSaidNothingAboutAgents(r),
  false,
  { agents: { lib: { 'alpha.md': agent('alpha') }, user: {} }, dir: 'repo' },
);

test(
  'a library with no agents/ directory stays silent',
  unhealthy,
  async (r) => ranAndSaidNothingAboutAgents(r),
  false,
  { agents: { user: { 'alpha.md': agent('alpha') } } },
);

test(
  'a norms problem and an agents problem together both reach the person',
  { state: 'current', at: hoursAgo(1) },
  async (r) => {
    if (!/Layer 1 norms/.test(r.system) || !/Agents:/.test(r.system)) return 'the person was not told both: ' + r.out;
    return true;
  },
  false,
  { normsMd: NORMS_MD, claudeMd: NO_BLOCK, agents: { lib: { 'alpha.md': agent('alpha') }, user: {} } },
);

// team/NOW.md cases (2026-10-03). They red against a version with no check, one that
// treats an uncommitted NOW.md as current, one that never counts commits since it,
// one that reports no branch at all or every branch, and one that drops the ask line.
// After cross-agent review (exchange record, 2026-10-03) they also red against a
// version that misses uncommitted edits to a committed NOW.md, splits a parenthesised
// note at its comma, misses a branch written as origin/<name>, or tells a session
// that an empty team/ASK.md is a fault.
const NOW = (extra = '') => '# NOW\n\ntemplate: team-loop NOW v1\nnext: write the tests\n' + extra;
const writeNow = (cwd, text) => {
  mkdirSync(join(cwd, 'team'), { recursive: true });
  writeFileSync(join(cwd, 'team', 'NOW.md'), text, 'utf8');
};
const commitNow = (cwd, g, text) => {
  writeNow(cwd, text);
  g('add', '-A');
  g('commit', '-qm', 'now');
};
const nowCase = (name, repo, check) => test(name, { state: 'current', at: hoursAgo(1) }, check, true, { repo });

nowCase('a repo with no team/NOW.md says nothing about it', () => {}, async (r) => {
  if (/NOW\.md/.test(r.out)) return 'mentioned NOW.md where none exists: ' + r.out;
  return true;
});

nowCase('a committed NOW.md level with HEAD is pointed at, and said to be level', (cwd, g) => commitNow(cwd, g, NOW()), async (r) => {
  if (!/team\/NOW\.md is the resume board/.test(r.context)) return 'no pointer to NOW.md: ' + r.out;
  if (!/level with HEAD/.test(r.context)) return 'not reported level with HEAD: ' + r.context;
  return true;
});

nowCase(
  'commits after NOW.md are counted',
  (cwd, g) => {
    commitNow(cwd, g, NOW());
    for (const n of [1, 2]) {
      writeFileSync(join(cwd, 'later' + n + '.txt'), 'x\n');
      g('add', '-A');
      g('commit', '-qm', 'later ' + n);
    }
  },
  async (r) => {
    if (!/2 commit\(s\) have landed on this branch since/.test(r.context)) return 'did not count the two later commits: ' + r.context;
    return true;
  },
);

nowCase('an uncommitted NOW.md is called out, never read as current', (cwd) => writeNow(cwd, NOW()), async (r) => {
  if (!/is not committed/.test(r.context)) return 'an untracked NOW.md was not called out: ' + r.context;
  if (/level with HEAD/.test(r.context)) return 'an untracked NOW.md was reported level with HEAD';
  return true;
});

nowCase(
  'a branch NOW.md names that is gone is named, and one that exists is not',
  (cwd, g) => commitNow(cwd, g, NOW('branches: `main`, feat/gone (worktree somewhere), none\n')),
  async (r) => {
    if (!/do not exist here[^.]*: feat\/gone\./.test(r.context)) return 'feat/gone not named as missing: ' + r.context;
    if (/do not exist here[^.]*main/.test(r.context)) return 'main reported missing though it exists';
    return true;
  },
);

nowCase(
  'a branches line whose branches all exist adds no warning',
  (cwd, g) => commitNow(cwd, g, NOW('branches: main\n')),
  async (r) => {
    if (/do not exist here/.test(r.context)) return 'warned with every branch present: ' + r.context;
    return true;
  },
);

nowCase(
  'an entry that is not a branch name is reported missing',
  (cwd, g) => commitNow(cwd, g, NOW('branches: --all, a;b\n')),
  async (r) => {
    if (!/do not exist here[^\n]*--all, a;b\./.test(r.context)) return 'junk entries not reported: ' + r.context;
    return true;
  },
);

nowCase(
  'the ask line reaches the session with the unreadable-is-not-empty rule',
  (cwd, g) => commitNow(cwd, g, NOW('ask: https://claude.ai/artifact/EXAMPLE\n')),
  async (r) => {
    if (!/Ask queue: https:\/\/claude\.ai\/artifact\/EXAMPLE/.test(r.context)) return 'ask line not surfaced: ' + r.context;
    if (!/never report it empty/.test(r.context)) return 'the unreadable rule was dropped';
    return true;
  },
);

nowCase(
  'uncommitted edits to a committed NOW.md are called out',
  (cwd, g) => {
    commitNow(cwd, g, NOW());
    writeNow(cwd, NOW('next: something newer\n'));
  },
  async (r) => {
    if (!/uncommitted edits/.test(r.context)) return 'a dirty NOW.md read as clean: ' + r.context;
    return true;
  },
);

nowCase(
  'a comma inside a parenthesised note does not split a branch entry',
  (cwd, g) => commitNow(cwd, g, NOW('branches: main (worktree at ../wt, clean), feat/gone\n')),
  async (r) => {
    if (/clean\)/.test(r.context)) return 'the note was split at its comma: ' + r.context;
    if (!/do not exist here[^.]*: feat\/gone\./.test(r.context)) return 'feat/gone not named: ' + r.context;
    return true;
  },
);

nowCase(
  'a branch written as origin/<name>, or bare, is found on the remote',
  (cwd, g) => {
    g('update-ref', 'refs/remotes/origin/feat-r', 'HEAD');
    commitNow(cwd, g, NOW('branches: origin/feat-r, feat-r\n'));
  },
  async (r) => {
    if (/do not exist here/.test(r.context)) return 'a remote branch was reported missing: ' + r.context;
    return true;
  },
);

nowCase(
  'a file queue reports its open items and is never told empty is a fault',
  (cwd, g) => {
    mkdirSync(join(cwd, 'team'), { recursive: true });
    writeFileSync(join(cwd, 'team', 'ASK.md'), '# ASK\n\n## ASK-0001 · decision\n\n## ASK-0002 · review\n', 'utf8');
    commitNow(cwd, g, NOW('ask: team/ASK.md\n'));
  },
  async (r) => {
    if (!/team\/ASK\.md holds 2 open item\(s\)/.test(r.context)) return 'open items not counted: ' + r.context;
    if (/never report it empty/.test(r.context)) return 'a file queue was given the board rule';
    return true;
  },
);

nowCase(
  'a file queue that does not exist is named',
  (cwd, g) => commitNow(cwd, g, NOW('ask: team/ASK.md\n')),
  async (r) => {
    if (!/names team\/ASK\.md, which does not exist here/.test(r.context)) return 'missing ASK.md not named: ' + r.context;
    return true;
  },
);

// Round 2 of the same review: a parenthesis inside a branch name, and ask: values that
// point outside the repo or at a directory, which once threw and silenced the whole report.
nowCase(
  'a branch whose name holds parentheses is found',
  (cwd, g) => {
    g('branch', 'feat/(legacy)');
    commitNow(cwd, g, NOW('branches: feat/(legacy), main (the trunk)\n'));
  },
  async (r) => {
    if (/do not exist here/.test(r.context)) return 'feat/(legacy) reported missing: ' + r.context;
    return true;
  },
);

nowCase(
  'an ask: path that is a directory is named, and the rest of the report survives',
  (cwd, g) => commitNow(cwd, g, NOW('ask: .\n')),
  async (r) => {
    if (!/team\/NOW\.md is the resume board/.test(r.context)) return 'the NOW report was silenced: ' + r.context;
    if (!/names \., which is neither/.test(r.context)) return 'ask: . not named: ' + r.context;
    return true;
  },
);

nowCase(
  'an ask: path outside the repo is refused, never read',
  (cwd, g) => {
    writeFileSync(join(cwd, '..', 'OUTSIDE.md'), '## ASK-0001\n', 'utf8');
    commitNow(cwd, g, NOW('ask: ../OUTSIDE.md\n'));
  },
  async (r) => {
    if (/holds 1 open item/.test(r.context)) return 'read a file outside the repo: ' + r.context;
    if (!/neither a link nor a \.md file inside this repo/.test(r.context)) return 'the outside path was not refused: ' + r.context;
    return true;
  },
);

// Shadowing cases (2026-10-03, team-loop stage 2). They red against a version with no check,
// one that runs outside a plugin install (a direct clone copies tl- agents to the user dir by
// design), one that reads file names instead of the frontmatter name, one that reports every
// agent, and one that tells only the model.
const tlAgent = (name) => '---\nname: ' + name + '\ndescription: x\n---\nbody\n';
const shadowCase = (name, plugin, files, check) =>
  test(name, { state: 'current', at: hoursAgo(1) }, check, false, {
    prep(root, cwd) {
      this.env = { CLAUDE_CONFIG_DIR: join(root, 'cfg'), ...(plugin ? { CLAUDE_PLUGIN_ROOT: join(root, 'plugin') } : {}) };
      for (const [where, file, text] of files) {
        const dir = where === 'user' ? join(root, 'cfg', 'agents') : join(cwd, '.claude', 'agents');
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, file), text, 'utf8');
      }
    },
  });

shadowCase('a user agent named tl-builder under a plugin install is reported to the person', true, [['user', 'tl-builder.md', tlAgent('tl-builder')]], async (r) => {
  if (!/Team-loop agents shadowed: tl-builder \(user/.test(r.system)) return 'the person was not told: ' + r.out;
  return true;
});

shadowCase('a project agent whose frontmatter name is tl-* is caught whatever its file name', true, [['project', 'mine.md', tlAgent('tl-researcher')]], async (r) => {
  if (!/tl-researcher \(project/.test(r.context)) return 'frontmatter name not read: ' + r.out;
  return true;
});

shadowCase('a quoted frontmatter name is caught', true, [['project', 'q.md', tlAgent('"tl-builder"')]], async (r) => {
  if (!/Team-loop agents shadowed: tl-builder \(project/.test(r.system)) return 'a quoted name slipped past: ' + r.out;
  return true;
});

shadowCase('outside a plugin install a user tl- agent is expected and stays silent', false, [['user', 'tl-builder.md', tlAgent('tl-builder')]], async (r) => {
  if (/shadowed/.test(r.out)) return 'reported a direct-clone copy as shadowing: ' + r.out;
  return true;
});

shadowCase('other user agents under a plugin install are not reported', true, [['user', 'code-reviewer.md', tlAgent('code-reviewer')]], async (r) => {
  if (/shadowed/.test(r.out)) return 'reported a non-tl agent: ' + r.out;
  return true;
});
// Round 3 stand-in (code-reviewer subagent, 2026-10-03): a failed git call read as "not
// committed", a branch shadowed by a same-named tag, a failed fetch reported as fact about
// origin, a recreated NOW.md called committed, and ask: dressing refused.
test(
  'a git failure is reported as an unreadable check, never as "not committed"',
  { state: 'current', at: hoursAgo(1) },
  async (r) => {
    if (/is not committed/.test(r.context)) return 'a git failure read as not committed: ' + r.context;
    if (!/could not be read/.test(r.context)) return 'the failure was not named: ' + r.context;
    return true;
  },
  true,
  { repo: (cwd, g) => commitNow(cwd, g, NOW()), env: { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'log.date', GIT_CONFIG_VALUE_0: 'bogus' } },
);

nowCase(
  'a branch that shares its name with a tag is found',
  (cwd, g) => {
    g('branch', 'v1');
    g('tag', 'v1');
    commitNow(cwd, g, NOW('branches: v1\n'));
  },
  async (r) => (/do not exist here/.test(r.context) ? 'v1 reported missing: ' + r.context : true),
);

nowCase(
  'when the fetch fails, a missing branch is not claimed absent from origin',
  (cwd, g) => {
    g('remote', 'add', 'origin', join(cwd, '..', 'no-such-remote'));
    commitNow(cwd, g, NOW('branches: feat/elsewhere\n'));
  },
  async (r) => {
    if (/locally or on origin/.test(r.context)) return 'asserted origin state after a failed fetch: ' + r.context;
    if (!/The fetch failed/.test(r.context)) return 'the failed fetch was not named: ' + r.context;
    return true;
  },
);

nowCase(
  'a NOW.md deleted in a commit and recreated untracked is not called committed',
  (cwd, g) => {
    commitNow(cwd, g, NOW());
    g('rm', '-q', 'team/NOW.md');
    g('commit', '-qm', 'drop now');
    writeNow(cwd, NOW());
  },
  async (r) => (/is not committed/.test(r.context) ? true : 'a recreated NOW.md read as committed: ' + r.context),
);

nowCase(
  'a committed NOW.md missing from the working copy is reported, not silent',
  (cwd, g) => {
    commitNow(cwd, g, NOW());
    rmSync(join(cwd, 'team', 'NOW.md'));
  },
  async (r) => (/missing from the working copy/.test(r.context) ? true : 'a deleted resume board went unreported: ' + r.context),
);

nowCase(
  'a committed NOW.md replaced by a directory is reported, not silent',
  (cwd, g) => {
    commitNow(cwd, g, NOW());
    rmSync(join(cwd, 'team', 'NOW.md'));
    mkdirSync(join(cwd, 'team', 'NOW.md'));
  },
  async (r) => (/team\/NOW\.md is committed but/.test(r.context) ? true : 'a resume board obstructed by a directory went unreported: ' + r.context),
);

nowCase(
  'an ask: path in backticks with a note is read, and ask: none is silent',
  (cwd, g) => {
    mkdirSync(join(cwd, 'team'), { recursive: true });
    writeFileSync(join(cwd, 'team', 'ASK.md'), '# ASK\n\n## ASK-0001 · decision\n', 'utf8');
    commitNow(cwd, g, NOW('ask: `team/ASK.md` (regulated)\n'));
  },
  async (r) => (/team\/ASK\.md holds 1 open item/.test(r.context) ? true : 'dressed ask: not read: ' + r.context),
);

nowCase('ask: none says nothing about a queue', (cwd, g) => commitNow(cwd, g, NOW('ask: none\n')), async (r) =>
  /Ask queue/.test(r.context) ? 'reported a queue for ask: none: ' + r.context : true,
);

const run = async () => {
  for (const c of cases) {
    const s = stage(c.fixture, c.cwdIsRepo, c.layout);
    try {
      const r = await c.fn(await runHook(s));
      if (r === true) pass(c.name);
      else fail(c.name + ' -> ' + r);
    } catch (e) {
      fail(c.name + ' -> threw ' + e.message);
    } finally {
      try {
        rmSync(s.root, { recursive: true, force: true });
      } catch {}
    }
  }
  console.log(fails ? '\n' + fails + ' case(s) failed' : '\nall cases passed');
  process.exit(fails ? 1 : 0);
};
run();
