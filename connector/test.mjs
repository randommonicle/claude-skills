// Tests for the connector, run with: npm test (builds first). Node only, no
// network. A fake D1 records every statement so logging and the report queue
// are checked by what was written, not by what the code says it wrote.

import worker, { handleMessage } from './src/index.js';
import { SKILLS } from './src/skills.generated.js';
import { searchSkills } from './src/search.js';

let fails = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  | ${name}${ok || !detail ? '' : ` (${detail})`}`);
  if (!ok) fails++;
}

function fakeDb({ missesToday = 0 } = {}) {
  const writes = [];
  const stmt = (sql) => ({
    sql,
    args: [],
    bind(...a) {
      this.args = a;
      return this;
    },
    async run() {
      writes.push({ sql: this.sql, args: this.args });
      return { success: true };
    },
    async first() {
      return { n: missesToday };
    },
  });
  return {
    writes,
    prepare: stmt,
    async batch(list) {
      for (const s of list) writes.push({ sql: s.sql, args: s.args });
      return [];
    },
  };
}

const pending = [];
const ctx = { waitUntil: (p) => pending.push(p) };
const settle = async () => {
  await Promise.all(pending.splice(0));
};
const call = (env, name, args, id = 1) =>
  handleMessage({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } }, env, ctx);
const out = (r) => r.result?.content?.[0]?.text ?? '';

// --- protocol ---
const init = await handleMessage(
  { jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } },
  {},
  ctx,
);
check('initialize echoes a supported protocol version', init.result.protocolVersion === '2025-06-18');
check('initialize declares tools and carries instructions', !!init.result.capabilities.tools && init.result.instructions.includes('search_skills'));
const unknownVer = await handleMessage({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '1999-01-01' } }, {}, ctx);
check('an unknown protocol version gets the newest supported one', unknownVer.result.protocolVersion === '2025-11-25');
check('a notification gets no reply', (await handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }, {}, ctx)) === null);
const list = await handleMessage({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, {}, ctx);
check('tools/list returns the five tools', list.result.tools.map((t) => t.name).join() === 'search_skills,get_skill,get_skill_file,list_skills,report_miss');
const badMethod = await handleMessage({ jsonrpc: '2.0', id: 3, method: 'nope' }, {}, ctx);
check('an unknown method is a JSON-RPC error, not a crash', badMethod.error?.code === -32601);
const badTool = await call({}, 'nope', {});
check('an unknown tool is an invalid-params error', badTool.error?.code === -32602);

// --- HTTP layer ---
const post = (body) => worker.fetch(new Request('https://x/mcp', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }), {}, ctx);
check('GET /mcp is 405', (await worker.fetch(new Request('https://x/mcp'), {}, ctx)).status === 405);
check('malformed JSON is a 400 parse error', (await post('{not json')).status === 400);
check('a notification over HTTP is 202 with no body', (await post({ jsonrpc: '2.0', method: 'notifications/initialized' })).status === 202);
const ping = await post({ jsonrpc: '2.0', id: 9, method: 'ping' });
check('ping over HTTP is 200 JSON', ping.status === 200 && ping.headers.get('content-type') === 'application/json');
const about = await (await worker.fetch(new Request('https://x/'), {}, ctx)).text();
check('the root page carries the privacy note', about.includes('Not logged: IP addresses'));

// --- the skills ---
check('all 60 skills are bundled', SKILLS.length === 60, String(SKILLS.length));
check('no vendor pack leaked into the bundle', !SKILLS.some((s) => ['wrangler', 'cloudflare', 'agents-sdk'].includes(s.name)));
const db = fakeDb();
const got = await call({ DB: db }, 'get_skill', { name: 'verify-the-effect' });
check('get_skill returns the SKILL.md text', out(got).includes('name: verify-the-effect'));
const gotRefs = await call({ DB: db }, 'get_skill', { name: 'unslop-text' });
check('get_skill lists reference files', out(gotRefs).includes('references/tells.md'));
const file = await call({ DB: db }, 'get_skill_file', { name: 'unslop-text', path: 'references/tells.md' });
check('get_skill_file returns a listed file', out(file).length > 500 && !file.result.isError);
const escape = await call({ DB: db }, 'get_skill_file', { name: 'unslop-text', path: '../../hooks/push-gate.mjs' });
check('get_skill_file refuses a path it did not list', escape.result.isError === true);
const proto = await call({ DB: db }, 'get_skill_file', { name: 'unslop-text', path: '__proto__' });
check('get_skill_file refuses an inherited property name', proto.result.isError === true);
const missing = await call({ DB: db }, 'get_skill', { name: 'not-a-skill' });
check('get_skill on an unknown name is a tool error', missing.result.isError === true);

// --- search quality: each query must find the skill a reader would expect ---
const expect = [
  ['write an integration test against the database', ['prove-it-can-fail', 'safe-smokes']],
  ['push a branch and merge a pull request', ['confirm-before-push']],
  ['run a database migration', ['db-migration-verification']],
  ['delete rows from production data', ['live-data-surgery']],
  ['print an API key from the environment', ['secrets-in-output']],
  ['handle webhooks that arrive out of order', ['unordered-events']],
  ['cite a statute in a document', ['verified-citations', 'legal-citation-integrity']],
  ['tell the user the deploy is done', ['verify-the-effect', 'one-real-ride']],
  ['review a lease for the landlord', ['contract-review']],
  ['remove AI writing tells from prose', ['unslop-text']],
];
for (const [q, want] of expect) {
  const names = searchSkills(SKILLS, q, 5).map((s) => s.name);
  check(`search "${q}" finds ${want.join(' or ')}`, want.some((w) => names.includes(w)), names.join(', ') || 'nothing');
}
const top3 = (q) => searchSkills(SKILLS, q, 3).map((s) => s.name);
check('"write a test" puts prove-it-can-fail in the top three', top3('write a test').includes('prove-it-can-fail'), top3('write a test').join(', '));
check('"add a cron job" puts price-the-spend first', top3('add a cron job')[0] === 'price-the-spend', top3('add a cron job').join(', '));
check('"build a chatbot feature" finds ai-surface-discipline in the top three', top3('build a chatbot feature').includes('ai-surface-discipline'), top3('build a chatbot feature').join(', '));
check('"the change is finished" finds verify-the-effect or one-real-ride', searchSkills(SKILLS, 'the change is finished', 5).some((s) => ['verify-the-effect', 'one-real-ride'].includes(s.name)));
check('a query of only stop words returns nothing', searchSkills(SKILLS, 'the and of', 5).length === 0);

// --- logging: names and search text only ---
const logDb = fakeDb();
await call({ DB: logDb }, 'search_skills', { query: 'run a database migration' });
await settle();
const ev = logDb.writes.find((w) => w.sql.startsWith('INSERT INTO events'));
check('a search writes one event row', !!ev && ev.args[1] === 'search_skills' && ev.args[3] === 'run a database migration');
check('the event row has exactly five fields', ev?.args.length === 5, String(ev?.args.length));
check('the monthly total is upserted', logDb.writes.some((w) => w.sql.startsWith('INSERT INTO monthly') && w.sql.includes('ON CONFLICT')));
const failingDb = { ...fakeDb(), batch: async () => { throw new Error('d1 down'); } };
const stillWorks = await call({ DB: failingDb }, 'get_skill', { name: 'plan-first' });
await settle();
check('a logging failure does not break the answer', out(stillWorks).includes('name: plan-first'));

// --- report_miss ---
const qDb = fakeDb();
const ok = await call({ DB: qDb }, 'report_miss', {
  what_happened: 'The agent emailed ben@example.com a summary and quoted the key sk_live_abcdefghijklmnop1234 in the log; call 07700 900123.',
  skill: 'secrets-in-output',
});
const row = qDb.writes.find((w) => w.sql.startsWith('INSERT INTO misses'));
check('report_miss stores a row', !ok.result.isError && !!row);
check('report_miss removes an email address', !row.args[1].includes('ben@example.com'));
check('report_miss removes a key-shaped string', !row.args[1].includes('sk_live_'));
check('report_miss removes a phone number', !row.args[1].includes('900123'), row.args[1]);
check('report_miss keeps the substance', row.args[1].includes('quoted the key'));
const dated = fakeDb();
await call({ DB: dated }, 'report_miss', { what_happened: 'A migration ran on 2026-11-18 10:00 against the wrong project entirely.', skill: 'none' });
check('report_miss leaves a date and time intact', dated.writes.find((w) => w.sql.startsWith('INSERT INTO misses')).args[1].includes('2026-11-18 10:00'));
const short = await call({ DB: fakeDb() }, 'report_miss', { what_happened: 'bad', skill: 'none' });
check('a near-empty report is refused', short.result.isError === true);
const full = await call({ DB: fakeDb({ missesToday: 100 }) }, 'report_miss', { what_happened: 'A long enough description of a real problem.', skill: 'none' });
check('the daily cap refuses report 101', full.result.isError === true);
const long = fakeDb();
await call({ DB: long }, 'report_miss', { what_happened: 'x'.repeat(5000), skill: 'none' });
check('a long report is cut to 2000 characters', long.writes.find((w) => w.sql.startsWith('INSERT INTO misses')).args[1].length === 2000);

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
