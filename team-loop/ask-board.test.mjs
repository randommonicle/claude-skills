// Stub-DOM cases for ask-board.html's script: node team-loop/ask-board.test.mjs
// Each case boots a fresh copy of the page against a fake store. Node stdlib only.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.env.BOARD || fileURLToPath(new URL('./ask-board.html', import.meta.url)), 'utf8');
const code = /<script>([\s\S]*)<\/script>/.exec(html)[1];
const tick = () => new Promise((r) => setTimeout(r, 5));

class N {
  constructor(tag) {
    Object.assign(this, { tag, children: [], parent: null, listeners: {}, _text: '', className: '', hidden: false, id: '', value: '', checked: false, disabled: false, title: '', attrs: {} });
    const self = this;
    this.classList = { toggle(c, on) { const s = new Set(self.className.split(' ').filter(Boolean)); on ? s.add(c) : s.delete(c); self.className = [...s].join(' '); } };
  }
  append(...xs) { for (const x of xs) { const n = typeof x === 'string' ? Object.assign(new N('#t'), { _text: x }) : x; if (n.parent) n.remove(); n.parent = this; this.children.push(n); } }
  replaceChildren(...xs) { for (const c of this.children) c.parent = null; this.children = []; this.append(...xs); }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); }
  set textContent(t) { for (const c of this.children) c.parent = null; this.children = []; this._text = String(t); }
  remove() { if (this.parent) { this.parent.children = this.parent.children.filter((c) => c !== this); this.parent = null; } }
  insertBefore(n, ref) { if (n.parent) n.remove(); const i = ref ? this.children.indexOf(ref) : this.children.length; this.children.splice(i, 0, n); n.parent = this; }
  replaceWith(n) { const p = this.parent, i = p.children.indexOf(this); p.children[i] = n; n.parent = p; this.parent = null; }
  contains(n) { return n === this || this.children.some((c) => c.contains(n)); }
  addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }
  setAttribute(k, v) { this.attrs[k] = v; }
  fire(t) { return Promise.all((this.listeners[t] || []).map((f) => f())); }
  find(pred, out = []) { if (pred(this)) out.push(this); this.children.forEach((c) => c.find(pred, out)); return out; }
}

async function boot() {
  const reg = {};
  for (const id of ['strip', 'lead', 'leadAt', 'leadText', 'state', 'list', 'noteBox', 'noteText', 'noteSend', 'noteMsg', 'noteList']) { reg[id] = new N('div'); reg[id].id = id; }
  reg.noteBox.hidden = true; reg.lead.hidden = true;
  const document = { getElementById: (id) => reg[id], createElement: (t) => new N(t), activeElement: null };
  const colls = {}, sets = [];
  const mk = (key) => (colls[key] ||= []);
  const db = {
    collection(name) { return { onSnapshot(cb, err) { mk(name).push({ cb, err }); }, add: async () => {} }; },
    doc(path) { return { onSnapshot(cb, err) { mk(path).push({ cb, err }); }, set(body) { return new Promise((res, rej) => sets.push({ path, body, res, rej })); } }; },
  };
  const window = { claude: { use: async (n) => (n === 'db' ? db : { id: async () => 'u1' }) } };
  new Function('window', 'document', code)(window, document);
  await tick();
  const snap = (key, docs) => { for (const { cb } of mk(key)) cb({ docs: docs.map(([id, d]) => ({ id, data: () => d })), exists: docs.length > 0, data: () => docs[0] && docs[0][1], metadata: { fromCache: false, hasPendingWrites: false } }); };
  const fail = (key, e) => { for (const { err } of mk(key)) err && err(e); };
  const card = () => reg.list.children[0];
  return { reg, sets, snap, fail, card };
}

const item = { question: 'Q?', options: [{ key: 'a', label: 'Yes' }, { key: 'b', label: 'No' }], askedAt: '2026-10-03T10:00:00Z' };
const cases = [];
const test = (name, fn) => cases.push({ name, fn });
const check = (cond, msg) => { if (!cond) throw new Error(msg); };

test('empty queue before meta/status is read is not called empty', async () => {
  const p = await boot();
  p.snap('items', []); p.snap('answers', []);
  check(!/No open decisions/.test(p.reg.state.textContent), p.reg.state.textContent);
});

test('empty queue with a failed meta/status read is not called empty', async () => {
  const p = await boot();
  p.fail('meta/status', { code: 'permission_denied' });
  p.snap('items', []); p.snap('answers', []);
  check(/could not be read/.test(p.reg.state.textContent), p.reg.state.textContent);
});

test('empty queue with meta/status present says no open decisions', async () => {
  const p = await boot();
  p.snap('meta/status', [['status', { text: 'hi' }]]);
  p.snap('items', []); p.snap('answers', []);
  check(/No open decisions/.test(p.reg.state.textContent), p.reg.state.textContent);
});

test('a changed answer, confirmed without an echo, shows the new choice', async () => {
  const p = await boot();
  p.snap('meta/status', [['status', { text: 'hi' }]]);
  p.snap('items', [['ASK-0001', item]]);
  p.snap('answers', [['ASK-0001', { item: 'ASK-0001', choice: 'a', answeredAt: '2026-10-03T11:00:00Z' }]]);
  await p.card().find((n) => n.tag === 'button')[0].fire('click');
  const rb = p.card().find((n) => n.tag === 'input' && n.value === 'b')[0]; rb.checked = true; await rb.fire('change');
  p.card().find((n) => n.tag === 'button')[0].fire('click'); await tick();
  p.sets[p.sets.length - 1].res(); await tick();
  check(/Answered No/.test(p.card().textContent), p.card().textContent.slice(0, 90));
});

test('an edit while a write is in flight does not re-arm Send or allow a second write', async () => {
  const p = await boot();
  p.snap('meta/status', [['status', { text: 'hi' }]]);
  p.snap('items', [['ASK-0001', item]]); p.snap('answers', []);
  const r = p.card().find((n) => n.tag === 'input')[0]; r.checked = true; await r.fire('change');
  const send = p.card().find((n) => n.tag === 'button')[0];
  send.fire('click'); await tick();
  const ta = p.card().find((n) => n.tag === 'textarea')[0]; ta.value = 'x'; await ta.fire('input');
  check(send.disabled, 'Send re-enabled mid-flight');
  send.fire('click'); await tick();
  check(p.sets.length === 1, 'writes sent: ' + p.sets.length);
});

let failed = 0;
for (const c of cases) {
  try { await c.fn(); console.log('ok   ' + c.name); }
  catch (e) { failed++; console.log('FAIL ' + c.name + ': ' + e.message); }
}
console.log(failed ? `${failed} of ${cases.length} failed` : `all ${cases.length} passed`);
process.exit(failed ? 1 : 0);
