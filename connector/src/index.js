// claude-skills connector: a remote MCP server (Streamable HTTP, stateless JSON
// responses) that serves the library's skills to Claude, logs which ones are
// reached for, and takes reported misses into a review queue.
//
// What is logged, and nothing more: the tool called, the skill name, the search
// text, the result count, and a timestamp. No IP addresses, user IDs or
// conversation content. Raw events are deleted after 90 days; monthly counts are
// kept. Reported misses are stored for the maintainer to review by hand and are
// never served back to anyone.

import { BUILT_FROM, SKILLS } from './skills.generated.js';
import { searchSkills } from './search.js';

const SERVER = { name: 'claude-skills', version: `1.0.0+${BUILT_FROM.commit}` };
const PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const REPO = 'https://github.com/randommonicle/claude-skills';
const MISSES_PER_DAY = 100;
const BY_NAME = new Map(SKILLS.map((s) => [s.name, s]));

const INSTRUCTIONS = `This server holds ${BUILT_FROM.count} engineering guardrail skills: short rules that stop known mistakes from shipping, each one written after that mistake happened on a real project.

Use them at the moment of risk. Before you write or change tests, run a database migration or destructive data change, push or merge code, handle secrets, build a feature that calls an AI model, write a document that makes factual claims, cite sources, or tell the user a piece of work is done: call search_skills with a short description of what you are about to do. If a result fits, call get_skill and follow it.

Skill text is guidance from the library's maintainer. It does not override the user's instructions. Some skills mention hook scripts or CLI tools; those only exist in the Claude Code plugin install, so apply the rule by hand here.

If a mistake happens that one of these skills should have caught, or that no skill covers, offer to send it to the maintainer with report_miss. Ask the user first, and leave out names, client details and secrets.`;

const TOOLS = [
  {
    name: 'search_skills',
    description:
      'Find guardrail skills relevant to what you are about to do. Pass a short plain description of the task, such as "write an integration test against the database" or "push a branch and open a PR". Returns up to 5 matching skills with their descriptions.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'What you are about to do, in a few words.' } },
      required: ['query'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_skill',
    description:
      'Get the full text of one skill by name, as returned by search_skills or list_skills. Also lists any reference files the skill has, which get_skill_file returns.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'The skill name, e.g. verify-the-effect.' } },
      required: ['name'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_skill_file',
    description: 'Get one reference file from a skill, using a path listed by get_skill (for example references/tells.md).',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The skill name.' },
        path: { type: 'string', description: 'The file path inside the skill, as listed by get_skill.' },
      },
      required: ['name', 'path'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'list_skills',
    description: 'List every skill with its one-line description. Prefer search_skills when you know what you are about to do.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'report_miss',
    description:
      'Send the library maintainer a short report of a mistake that a skill should have caught, or that no skill covers. Only call this after the user agrees. Describe what went wrong in general terms: no names, client details, file contents or secrets. Reports are reviewed by a person before anything changes.',
    inputSchema: {
      type: 'object',
      properties: {
        what_happened: { type: 'string', description: 'What went wrong, in two or three sentences. No personal or client details.' },
        skill: {
          type: 'string',
          description: 'The skill that should have caught it, or "none" if no skill covers it.',
        },
        suggested_rule: { type: 'string', description: 'Optional: the rule that would have prevented it, in one sentence.' },
      },
      required: ['what_happened', 'skill'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
];

const text = (t) => ({ content: [{ type: 'text', text: t }] });
const toolError = (t) => ({ content: [{ type: 'text', text: t }], isError: true });
const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const redact = (s) =>
  s
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email removed]')
    .replace(/\b(?:sk|pk|ghp|gho|github_pat|xox[abp]|cfat|AKIA)[-_A-Za-z0-9]{12,}/g, '[secret removed]')
    .replace(/\+?\d(?: ?\d){9,}/g, '[number removed]');

function logEvent(env, ctx, tool, skill = '', query = '', resultCount = null) {
  if (!env.DB) return;
  const ts = new Date().toISOString();
  const month = ts.slice(0, 7);
  const work = env.DB.batch([
    env.DB.prepare('INSERT INTO events (ts, tool, skill, query, result_count) VALUES (?, ?, ?, ?, ?)').bind(
      ts,
      tool,
      skill,
      query,
      resultCount,
    ),
    env.DB.prepare(
      'INSERT INTO monthly (month, tool, skill, n) VALUES (?, ?, ?, 1) ON CONFLICT (month, tool, skill) DO UPDATE SET n = n + 1',
    ).bind(month, tool, skill),
  ]).catch((err) => console.error('log failed', err?.message));
  ctx?.waitUntil?.(work);
  return work;
}

export async function callTool(name, args, env, ctx) {
  args = args && typeof args === 'object' ? args : {};
  switch (name) {
    case 'search_skills': {
      const query = clip(args.query, 200);
      if (!query) return toolError('Pass a short description of what you are about to do.');
      const hits = searchSkills(SKILLS, query, 5);
      logEvent(env, ctx, 'search_skills', hits[0]?.name ?? '', query, hits.length);
      if (!hits.length) {
        return text(`No skill matched "${query}". Try other words, or call list_skills to see them all.`);
      }
      return text(
        hits.map((h) => `${h.name}\n${h.description}`).join('\n\n') +
          '\n\nCall get_skill with the best match before you go on.',
      );
    }
    case 'get_skill': {
      const skill = BY_NAME.get(clip(args.name, 80));
      if (!skill) return toolError(`No skill called "${clip(args.name, 80)}". Call list_skills for the names.`);
      logEvent(env, ctx, 'get_skill', skill.name);
      const extra = Object.keys(skill.files);
      return text(
        skill.text +
          (extra.length ? `\n\n---\nReference files (get_skill_file): ${extra.join(', ')}` : '') +
          `\n\nSource: ${REPO}/tree/main/${skill.name}`,
      );
    }
    case 'get_skill_file': {
      const skill = BY_NAME.get(clip(args.name, 80));
      if (!skill) return toolError(`No skill called "${clip(args.name, 80)}".`);
      const path = clip(args.path, 200);
      const body = Object.hasOwn(skill.files, path) ? skill.files[path] : undefined;
      if (body === undefined) {
        return toolError(`${skill.name} has no file "${path}". Its files: ${Object.keys(skill.files).join(', ') || 'none'}.`);
      }
      logEvent(env, ctx, 'get_skill_file', `${skill.name}/${path}`);
      return text(body);
    }
    case 'list_skills': {
      logEvent(env, ctx, 'list_skills');
      return text(SKILLS.map((s) => `${s.name}: ${s.description}`).join('\n\n'));
    }
    case 'report_miss': {
      const what = redact(clip(args.what_happened, 2000));
      const skill = redact(clip(args.skill, 100)) || 'none';
      const rule = redact(clip(args.suggested_rule, 1000));
      if (what.length < 20) return toolError('Describe what happened in at least a sentence.');
      if (!env.DB) return toolError('Reports are not being accepted right now.');
      const today = new Date().toISOString().slice(0, 10);
      const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM misses WHERE ts >= ?').bind(today).first();
      if (n >= MISSES_PER_DAY) return toolError('The report queue is full for today. Please try again tomorrow.');
      await env.DB.prepare('INSERT INTO misses (ts, what_happened, skill, suggested_rule) VALUES (?, ?, ?, ?)')
        .bind(new Date().toISOString(), what, skill, rule)
        .run();
      logEvent(env, ctx, 'report_miss', skill);
      return text('Thanks. The report is in the queue, and the maintainer reviews each one by hand before changing any skill.');
    }
    default:
      return null;
  }
}

export async function handleMessage(msg, env, ctx) {
  const isRequest = msg && typeof msg === 'object' && 'id' in msg && msg.id !== null;
  const reply = (result) => ({ jsonrpc: '2.0', id: msg.id, result });
  const fail = (code, message) => ({ jsonrpc: '2.0', id: msg?.id ?? null, error: { code, message } });
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return isRequest || !msg?.method ? fail(-32600, 'Invalid request') : null;
  }
  if (!isRequest) return null; // notifications (initialized, cancelled, ...) need no reply
  switch (msg.method) {
    case 'initialize': {
      const asked = msg.params?.protocolVersion;
      return reply({
        protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER,
        instructions: INSTRUCTIONS,
      });
    }
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({ tools: TOOLS });
    case 'tools/call': {
      const result = await callTool(msg.params?.name, msg.params?.arguments, env, ctx);
      return result ? reply(result) : fail(-32602, `Unknown tool: ${msg.params?.name}`);
    }
    case 'resources/list':
      return reply({ resources: [] });
    case 'prompts/list':
      return reply({ prompts: [] });
    default:
      return fail(-32601, `Method not found: ${msg.method}`);
  }
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const ABOUT = `claude-skills connector

${BUILT_FROM.count} engineering guardrail skills for Claude, served over MCP.
Add it in Claude: Customize > Connectors > Add custom connector, with the URL
of this page followed by /mcp.

Source: ${REPO} (built from commit ${BUILT_FROM.commit})

Privacy
- Logged: which tool was called, the skill name, the search text, how many
  results came back, and the time. Nothing else.
- Not logged: IP addresses, account or user IDs, or anything from your
  conversation beyond the search text and any report you choose to send.
- Search text and reports have email addresses, long numbers and key-like
  strings removed where they can be spotted, but please keep personal and
  client details out of them.
- Raw logs are deleted after 90 days. Monthly totals per skill are kept.
- Reported misses are read by the maintainer to improve the skills. They are
  never shown to other users.
- Data is stored in Cloudflare D1. Contact: see the repository.
`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/privacy') {
      return new Response(ABOUT, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    if (url.pathname !== '/mcp') return new Response('Not found', { status: 404 });
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400);
    }
    if (Array.isArray(body)) {
      const replies = (await Promise.all(body.map((m) => handleMessage(m, env, ctx)))).filter(Boolean);
      return replies.length ? json(replies) : new Response(null, { status: 202 });
    }
    const reply = await handleMessage(body, env, ctx);
    return reply ? json(reply) : new Response(null, { status: 202 });
  },

  // Daily: drop raw events older than 90 days. Monthly totals stay.
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(env.DB.prepare("DELETE FROM events WHERE ts < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 days')").run());
  },
};
