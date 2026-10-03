#!/usr/bin/env node
// SessionStart hook. parallel-work-recon's session-start half, mechanised:
// fetch, branch/PR state, and recent cross-ref log, injected as
// additionalContext so every session opens with live repo state instead of a
// stale snapshot. Fail-open: any error or timeout yields no context, never a
// broken session. The pre-commit re-run stays behavioural in the skill —
// this hook only covers session start. It also checks that this machine's
// CLAUDE.md still carries the Layer 1 norm block (normsLine, below), that
// its user-level agents match the library's (agentsLine), and, in a repo with a
// team-loop resume board, how far HEAD has moved past it (nowLine).
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// NORMS.md's block is pasted by hand into each direct-clone machine's CLAUDE.md, and
// nothing checked the paste: on 2026-09-24 the home machine was found with no block at
// all and no record of when it went (LESSONS_LEARNED entry 23). Compare the two, line
// endings aside, and say so when they differ. Only the direct-clone layout is checked,
// the library at <config>/skills beside <config>/CLAUDE.md; a plugin install gets the
// block from norms-inject, and in any other layout CLAUDE.md's place is unknown, so
// both stay silent rather than raise a false alarm. Fail-open.
const NORM_BLOCK = /<!-- BEGIN CLAUDE-SKILLS NORMS([^>]*)-->[\s\S]*?<!-- END CLAUDE-SKILLS NORMS[^>]*-->/;

function normsLine() {
  try {
    if (process.env.CLAUDE_PLUGIN_ROOT) return null;
    const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    if (basename(repo) !== 'skills') return null;
    const normsPath = join(repo, 'NORMS.md');
    const canon = NORM_BLOCK.exec(readFileSync(normsPath, 'utf8').replace(/\r\n/g, '\n'));
    if (!canon) return null;
    const claudeMd = join(repo, '..', 'CLAUDE.md');
    const paste = ' Paste the block from ' + normsPath + ', markers included.';
    if (!existsSync(claudeMd))
      return 'Layer 1 norms: ' + claudeMd + ' does not exist, so the always-on norms are not loaded in this session.' + paste;
    const live = NORM_BLOCK.exec(readFileSync(claudeMd, 'utf8').replace(/\r\n/g, '\n'));
    if (!live)
      return 'Layer 1 norms: ' + claudeMd + ' has no CLAUDE-SKILLS NORMS block, so the always-on norms are not loaded in this session.' + paste;
    if (live[0] === canon[0]) return null;
    const had = live[1].trim() || 'unversioned', want = canon[1].trim();
    return (
      'Layer 1 norms: the block in ' + claudeMd +
      (had === want ? ' differs from NORMS.md under the same marker (' + want + ').' : ' is ' + had + ' but NORMS.md is ' + want + '.') +
      ' Re-paste it from ' + normsPath + '.'
    );
  } catch {
    return null;
  }
}

// agents/*.md are copied by hand into each direct-clone machine's <config>/agents, where
// Claude Code reads user agents, and a README sentence was the only control on the copy:
// the norm block's shape again, repeated on 2026-09-28 (LESSONS_LEARNED entry 26). A copy
// that is missing means the agent does not load; one that differs means an old version
// runs. Those are two failure modes, so they get two clauses. Agents that exist only at
// user level (debugger, refactorer) are machine-local by decision and are not reported.
// Same layout rule and plugin skip as normsLine, since a plugin install loads agents/
// itself. Fail-open.
function agentsLine() {
  try {
    if (process.env.CLAUDE_PLUGIN_ROOT) return null;
    const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    if (basename(repo) !== 'skills') return null;
    const library = join(repo, 'agents');
    if (!existsSync(library)) return null;
    const user = join(repo, '..', 'agents');
    const text = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
    const missing = [], different = [];
    for (const entry of readdirSync(library, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const copy = join(user, entry.name);
      if (!existsSync(copy)) missing.push(entry.name);
      else if (text(copy) !== text(join(library, entry.name))) different.push(entry.name);
    }
    if (!missing.length && !different.length) return null;
    return (
      'Agents: ' +
      (missing.length ? 'Not in ' + user + ', so not loaded this session: ' + missing.sort().join(', ') + '. ' : '') +
      (different.length ? 'Different from the library, so an old version runs: ' + different.sort().join(', ') + '. ' : '') +
      'Copy from ' + library + '.'
    );
  } catch {
    return null;
  }
}

// Under a plugin install the team loop's role agents (agents/tl-*.md) load from the plugin,
// but a project or user agent of the same name wins (sub-agents documentation: project over
// user over plugin) and silently replaces the plugin's role contract. agentsLine is skipped
// under a plugin, so this is that layout's own check. A direct clone copies the tl- agents
// into the user's agents directory like the others, and there this stays silent. The name
// that counts is the frontmatter's, so a file named anything with `name: tl-...` is caught.
// Fail-open.
function shadowLine(cwd) {
  try {
    if (!process.env.CLAUDE_PLUGIN_ROOT) return null;
    const userDir = join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), 'agents');
    const found = [];
    for (const [where, dir] of [['project', join(cwd, '.claude', 'agents')], ['user', userDir]]) {
      if (!existsSync(dir)) continue;
      for (const file of readdirSync(dir)) {
        if (!file.endsWith('.md')) continue;
        const name = /^name:\s*(\S+)/m.exec(readFileSync(join(dir, file), 'utf8'))?.[1] ?? file.slice(0, -3);
        if (/^tl-/i.test(name)) found.push(name + ' (' + where + ', ' + join(dir, file) + ')');
      }
    }
    if (!found.length) return null;
    return (
      'Team-loop agents shadowed: ' + found.join('; ') +
      '. A project or user agent wins over the plugin\'s, so the plugin\'s role contract does not run. Remove or rename them.'
    );
  } catch {
    return null;
  }
}

// update-skills.mjs writes this beside the repo after each unattended run. Stay
// SILENT while the library is current: a line appears only when something wants
// a human, so a stopped updater cannot read as a healthy one. A missing file is
// not a fault (the scheduled task is per-machine and may never have been set up);
// a STALE one is, because it means the task ran once and then stopped.
const STALE_HOURS = 36;

function skillsUpdateLine() {
  try {
    const statusPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'skills-update.json');
    if (!existsSync(statusPath)) return null;
    const s = JSON.parse(readFileSync(statusPath, 'utf8'));
    const ageHours = (Date.now() - Date.parse(s.at)) / 3600000;

    if (!Number.isFinite(ageHours)) return 'skills library: update status file is unreadable (' + statusPath + ').';
    if (ageHours > STALE_HOURS)
      return (
        'skills library: no update run for ' + Math.round(ageHours) + 'h (last state: ' + s.state + '). ' +
        'The scheduled task may have stopped - run: node hooks/update-skills.mjs'
      );
    if (s.state === 'current') return null;
    if (s.state === 'updated') {
      const what = [s.hooksChanged ? 'hooks' : null, s.skillsChanged ? 'skills' : null].filter(Boolean).join(' and ');
      if (!what) return null;
      return (
        'skills library: fast-forwarded ' + s.commits + ' commit(s) at ' + s.at + '; ' + what +
        ' changed, so this session is the first to load them.'
      );
    }
    // One message per failure mode: these four states want four different
    // actions, and "the library may be behind" is simply untrue of an ahead one.
    const advice = {
      'skipped-ahead':
        (s.ahead ?? '?') + ' local commit(s) are not on origin, so the update is holding off. ' +
        'Push them, or the other machine never sees them.',
      'skipped-dirty': 'uncommitted changes are blocking the fast-forward. Commit or stash them.',
      'skipped-diverged':
        'local and origin have diverged (' + (s.ahead ?? '?') + ' ahead, ' + (s.behind ?? '?') + ' behind). ' +
        'Reconcile by hand; the updater will not touch it.',
      error: 'the updater could not run' + (s.reason ? ' - ' + s.reason : '') + '.',
    };
    return 'skills library: ' + (advice[s.state] ?? 'unrecognised update state "' + s.state + '".') +
      ' (last run ' + s.at + ')';
  } catch {
    return null;
  }
}

// team/NOW.md is the team-loop resume board (team-loop/SKILL.md): described state, so a
// session that resumes from it must check it against git first (live-state-first). This
// does the mechanical half: whether NOW.md is committed, whether the working copy differs
// from that commit, how many commits HEAD has moved since, and which branches on its
// `branches:` line exist neither locally nor on origin. It surfaces the `ask:` line too,
// because the operator's answers are read at session start. Four git calls of at most
// 1.5 s each, whatever NOW.md says, so a long branches line cannot push the hook past its
// timeout. Silent when the repo has no team/NOW.md. Fail-open.
const LOCAL_GIT_MS = 1500;
// A file queue lives inside the repo: a relative .md path with no '..' segment.
const ASK_FILE = /^(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._\/-]+\.md$/;

function nowLine(cwd) {
  try {
    const rel = 'team/NOW.md';
    const path = join(cwd, 'team', 'NOW.md');
    if (!existsSync(path)) return null;
    const text = readFileSync(path, 'utf8');
    const git = (...args) => run('git', ['-C', cwd, ...args], LOCAL_GIT_MS);
    const out = [];
    const last = git('log', '-1', '--format=%h %cs', '--', rel);
    if (!last) {
      out.push(rel + ' exists but is not committed, so no other checkout or machine sees it. Read it, then commit it.');
    } else {
      const [sha, date] = last.split(' ');
      const count = git('rev-list', '--count', sha + '..HEAD');
      const behind = count === null ? NaN : Number(count);
      const dirty = git('status', '--porcelain', '--', rel);
      out.push(
        rel + ' is the resume board: read it first. Last committed at ' + sha + ' on ' + date +
          (!Number.isFinite(behind)
            ? '; how far HEAD has moved since could not be counted, so check it against git log before acting on it.'
            : behind > 0
              ? '; ' + behind + ' commit(s) have landed on this branch since, so check it against git log before acting on it.'
              : ', level with HEAD.') +
          (dirty ? ' Its working copy has uncommitted edits, so other checkouts still see the committed version.' : ''),
      );
    }
    const branches = /^branches:[ \t]*(.*)$/im.exec(text);
    if (branches) {
      // One listing, so each entry is a set lookup and no entry ever reaches git.
      const refs = git('for-each-ref', '--format=%(refname:short)', 'refs/heads', 'refs/remotes/origin');
      if (refs === null) out.push('The branches NOW.md names could not be checked: git for-each-ref failed.');
      else {
        const known = new Set(refs.split('\n').map((s) => s.trim()).filter(Boolean));
        const missing = [];
        // A note after a name, "name (note)", may hold commas, so notes go before the split.
        // Only a note after whitespace: "feat/(legacy)" is a valid branch name.
        for (const entry of branches[1].replace(/\s\([^)]*\)/g, '').split(',')) {
          const name = entry.trim().split(/\s/)[0].replace(/`/g, '');
          if (!name || /^none$/i.test(name)) continue;
          if (!known.has(name) && !known.has('origin/' + name)) missing.push(name);
        }
        if (missing.length) out.push('Branches NOW.md names that do not exist here, locally or on origin: ' + missing.join(', ') + '.');
      }
    }
    const ask = /^ask:[ \t]*(\S.*)$/im.exec(text);
    if (ask) {
      const where = ask[1].trim();
      if (/^https?:\/\//i.test(where)) {
        out.push(
          'Ask queue: ' + where + '. Read its meta/status, answers and notes before starting work; if it cannot be read, say so and ask in the session, never report it empty.',
        );
      } else if (!ASK_FILE.test(where)) {
        out.push('Ask queue: NOW.md names ' + where + ', which is neither a link nor a .md file inside this repo.');
      } else {
        const file = join(cwd, ...where.split('/'));
        let open = null;
        try {
          if (statSync(file).isFile()) open = (readFileSync(file, 'utf8').match(/^## ASK-\d+/gm) || []).length;
        } catch {}
        out.push(
          open === null
            ? 'Ask queue: NOW.md names ' + where + ', which does not exist here or cannot be read.'
            : 'Ask queue: ' + where + ' holds ' + open + ' open item(s); read their answers before starting work.',
        );
      }
    }
    return out.join(' ');
  } catch {
    return null;
  }
}

// argv form, never a shell string. cwd is untrusted text: a directory name may
// legally contain a double quote on POSIX, and interpolating it into a shell
// command made this hook injectable. The .git test below is not a defence, since
// a crafted directory can hold a .git entry, and a ';' payload executes
// regardless of git's exit status. Same rule lint-after-edit already states.
function run(bin, args, timeout = 6000) {
  const r = spawnSync(bin, args, { timeout, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  if (r.error || r.status !== 0) return null;
  return r.stdout.trim();
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const cwd = evt.cwd ?? process.cwd();
    const parts = [];

    // Read first: the library's own health matters wherever the session opens,
    // including a directory that is not a repo at all.
    const norms = normsLine();
    if (norms) parts.push(norms);
    const agents = agentsLine();
    if (agents) parts.push(agents);
    const shadow = shadowLine(cwd);
    if (shadow) parts.push(shadow);
    const toPerson = [norms, agents, shadow].filter(Boolean).join('\n');
    const update = skillsUpdateLine();
    if (update) parts.push(update);

    if (existsSync(join(cwd, '.git'))) {
      run('git', ['-C', cwd, 'fetch', '--quiet'], 8000);
      const status = run('git', ['-C', cwd, 'status', '-sb']);
      const log = run('git', ['-C', cwd, 'log', '--oneline', '--decorate', '--all', '-8']);
      const prs = run('gh', ['pr', 'list', '--state', 'open', '--limit', '10'], 8000);

      if (status) parts.push(`status:\n${status}`);
      if (log) parts.push(`recent commits (all refs, post-fetch):\n${log}`);
      if (prs) parts.push(`open PRs:\n${prs}`);
      const now = nowLine(cwd);
      if (now) parts.push(now);
    }
    if (!parts.length) process.exit(0);

    process.stdout.write(
      JSON.stringify({
        // Missing norms and stale agents are shown to the person too: the model-only
        // context is where this drift went unnoticed.
        ...(toPerson ? { systemMessage: toPerson } : {}),
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext:
            'parallel-work-recon (SessionStart hook) — live repo state at session start. ' +
            'This is a snapshot, not a lease: re-run fetch + pr list immediately before any commit or merge.\n\n' +
            parts.join('\n\n'),
        },
      }),
    );
  } catch {}
  process.exit(0);
});
