#!/usr/bin/env node
// Proves deepseek-seat.mjs prices every call at the rate of its moment, keeps the spend in its
// ledger, names a failure instead of returning an empty answer, and attaches only the named
// ARTIFACT_* files from its working folder. A fake DeepSeek on localhost stands in for the API,
// so the suite needs no key and costs nothing.
//
// It reds against: a version that prices at one rate whatever the hour (the peak cases), that
// counts cache hits at the miss rate, that writes nothing to the ledger, that answers SUCCESS on
// an empty reply cut off by max_tokens (the 2026-10-25 shape: finish "length"), that reads a file
// outside its folder because the prompt named it, or that loses the thread on continue.
// Run: node scripts/deepseek-seat.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isPeak, costOf, namedArtifacts } from "./deepseek-seat.mjs";

const SEAT = join(dirname(fileURLToPath(import.meta.url)), "deepseek-seat.mjs");

test("peak is 01:00-04:00 and 06:00-10:00 UTC on weekdays only", () => {
  assert.equal(isPeak(new Date("2026-10-26T01:00:00Z")), true, "Monday 01:00");
  assert.equal(isPeak(new Date("2026-10-26T03:59:00Z")), true);
  assert.equal(isPeak(new Date("2026-10-26T04:00:00Z")), false, "Monday 04:00 is off-peak");
  assert.equal(isPeak(new Date("2026-10-26T09:59:00Z")), true);
  assert.equal(isPeak(new Date("2026-10-26T10:00:00Z")), false);
  assert.equal(isPeak(new Date("2026-10-25T07:00:00Z")), false, "Sunday is off-peak all day");
  assert.equal(isPeak(new Date("2026-10-24T02:00:00Z")), false, "Saturday is off-peak all day");
});

test("the cost uses the hit, miss and output rates of the moment, peak double", () => {
  const u = { prompt_cache_hit_tokens: 1_000_000, prompt_cache_miss_tokens: 1_000_000, completion_tokens: 1_000_000 };
  assert.equal(costOf("deepseek-v4-pro", u, new Date("2026-10-25T12:00:00Z")), 0.022 + 0.66 + 1.98);
  assert.equal(costOf("deepseek-v4-pro", u, new Date("2026-10-26T07:00:00Z")), 0.044 + 1.32 + 3.96);
  assert.equal(costOf("deepseek-flash", u, new Date("2026-10-25T12:00:00Z")), 0.003 + 0.15 + 0.6);
  assert.equal(costOf("deepseek-v4-pro", { prompt_tokens: 143, completion_tokens: 60 }, new Date("2026-10-25T19:17:00Z")), 0.000213, "the first real probe's figure");
  assert.equal(costOf("some-other-model", u, new Date()), null, "an unknown model is unpriced, never priced at zero");
});

test("named artifacts resolve as written under the working folder; missing and outside ones are reported, never dropped", () => {
  const dir = mkdtempSync(join(tmpdir(), "ds-art-"));
  mkdirSync(join(dir, "exchange"));
  writeFileSync(join(dir, "ARTIFACT_a.diff"), "A");
  writeFileSync(join(dir, "exchange", "ARTIFACT_b.txt"), "B");
  const got = namedArtifacts("see ARTIFACT_a.diff, `exchange/ARTIFACT_b.txt`, exchange\\ARTIFACT_b.txt. Then C:/elsewhere/ARTIFACT_a.diff, ../ARTIFACT_up.diff, /etc/ARTIFACT_root.diff and ARTIFACT_gone.txt.", dir);
  assert.deepEqual(got.found, [join(dir, "ARTIFACT_a.diff"), join(dir, "exchange", "ARTIFACT_b.txt")]);
  assert.deepEqual(got.missing, ["ARTIFACT_gone.txt"]);
  assert.deepEqual(got.refused, ["C:/elsewhere/ARTIFACT_a.diff", "../ARTIFACT_up.diff", "/etc/ARTIFACT_root.diff"]);
  rmSync(dir, { recursive: true, force: true });
});

test("a named artifact that is missing is NO_ARTIFACT, and nothing reaches DeepSeek", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ds-noart-"));
  mkdirSync(join(dir, "exchange"));
  writeFileSync(join(dir, "key"), "sk-" + "a".repeat(32));
  writeFileSync(join(dir, "exchange", "ARTIFACT_x.txt"), "THE DRAFT");
  const fake = await fakeDeepSeek(() => reply("A confident review of nothing."));
  const env = { DEEPSEEK_KEY_FILE: join(dir, "key"), DEEPSEEK_API_URL: fake.url };
  try {
    const a = await run(["start"], "Review ARTIFACT_x.txt please.", env, dir);
    assert.equal(a.env.status, "NO_ARTIFACT");
    assert.match(a.env.error, /ARTIFACT_x\.txt/);
    assert.equal(fake.seen.length, 0, "no call was made with the prompt alone");
    const b = await run(["start"], "Review exchange/ARTIFACT_x.txt please.", env, dir);
    assert.equal(b.env.status, "SUCCESS");
    assert.match(fake.seen[0].body.messages.at(-1).content, /THE DRAFT/, "the path as written is attached");
  } finally { fake.server.close(); rmSync(dir, { recursive: true, force: true }); }
});

function fakeDeepSeek(answer) {
  const seen = [];
  const server = createServer((req, res) => {
    let s = ""; req.on("data", (d) => (s += d)); req.on("end", () => {
      seen.push({ auth: req.headers.authorization, body: JSON.parse(s) });
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(answer(seen.length)));
    });
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok({ server, seen, url: `http://127.0.0.1:${server.address().port}/chat/completions` })));
}
function run(args, input, env, cwd) {
  return new Promise((ok) => {
    const p = spawn(process.execPath, [SEAT, ...args], { cwd, env: { ...process.env, ...env } });
    let out = ""; p.stdout.on("data", (d) => (out += d));
    p.on("close", (code) => ok({ code, env: out ? JSON.parse(out) : null }));
    p.stdin.end(input);
  });
}
const reply = (content, finish = "stop") => ({ model: "deepseek-v4-pro", choices: [{ message: { content }, finish_reason: finish }],
  usage: { prompt_tokens: 1000, prompt_cache_hit_tokens: 0, prompt_cache_miss_tokens: 1000, completion_tokens: 500, completion_tokens_details: { reasoning_tokens: 400 } } });

test("an answer is SUCCESS with its cost, ledgered, and continue replays the thread", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ds-run-"));
  writeFileSync(join(dir, "key"), "sk-" + "a".repeat(32));
  writeFileSync(join(dir, "ARTIFACT_x.diff"), "THE DIFF");
  const fake = await fakeDeepSeek((n) => reply(n === 1 ? "First answer." : "Second answer."));
  const env = { DEEPSEEK_KEY_FILE: join(dir, "key"), DEEPSEEK_API_URL: fake.url };
  try {
    const a = await run(["start"], "Review ARTIFACT_x.diff please.", env, dir);
    assert.equal(a.code, 0);
    assert.equal(a.env.status, "SUCCESS");
    assert.equal(a.env.response, "First answer.");
    assert.equal(typeof a.env.usage.cost_usd, "number");
    assert.equal(a.env.usage.input_tokens, 1000, "the key run-seat's metadata line reads");
    assert.match(fake.seen[0].body.messages.at(-1).content, /THE DIFF/, "the named artifact is attached");
    assert.equal(fake.seen[0].auth, "Bearer sk-" + "a".repeat(32));
    const b = await run(["continue", a.env.conversation_id], "And now?", env, dir);
    assert.equal(b.env.response, "Second answer.");
    assert.equal(b.env.num_turns, 2);
    assert.equal(fake.seen[1].body.messages.filter((m) => m.role === "assistant")[0].content, "First answer.", "the thread is replayed");
    const ledger = readFileSync(join(dir, "deepseek-spend.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
    assert.equal(ledger.length, 2);
    assert.ok(ledger.every((r) => typeof r.cost_usd === "number" && r.cost_usd > 0));
    assert.ok(!JSON.stringify(ledger).includes("sk-"), "the key never reaches the ledger");
  } finally { fake.server.close(); rmSync(dir, { recursive: true, force: true }); }
});

test("a reply cut off mid-thought is EMPTY with its reason, still ledgered; no key is NO_KEY", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ds-empty-"));
  writeFileSync(join(dir, "key"), "sk-" + "b".repeat(32));
  const fake = await fakeDeepSeek(() => reply("", "length"));
  try {
    const a = await run(["start"], "Review.", { DEEPSEEK_KEY_FILE: join(dir, "key"), DEEPSEEK_API_URL: fake.url }, dir);
    assert.equal(a.env.status, "EMPTY");
    assert.match(a.env.error, /finish: length/);
    assert.ok(existsSync(join(dir, "deepseek-spend.jsonl")), "the tokens spent are recorded even with no answer");
    const none = await run(["start"], "Review.", { DEEPSEEK_KEY_FILE: join(dir, "absent"), DEEPSEEK_API_URL: fake.url }, dir);
    assert.equal(none.env.status, "NO_KEY");
    assert.equal(fake.seen.length, 1, "no call without a key");
  } finally { fake.server.close(); rmSync(dir, { recursive: true, force: true }); }
});

// A fake that writes a raw body on its own schedule: steps are [delayMs, text] pairs, then it ends.
function scriptedDeepSeek(contentType, steps) {
  const server = createServer((req, res) => {
    req.resume();
    req.on("end", async () => {
      res.writeHead(200, { "Content-Type": contentType });
      for (const [delay, text] of steps) {
        await new Promise((ok) => setTimeout(ok, delay));
        if (res.destroyed) return;
        res.write(text);
      }
      res.end();
    });
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok({ server, url: `http://127.0.0.1:${server.address().port}/chat/completions` })));
}
const sse = (o) => `data: ${JSON.stringify(o)}\n\n`;

test("a streamed reply is assembled, its usage ledgered, and a slow but live stream is not a stall", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ds-stream-"));
  writeFileSync(join(dir, "key"), "sk-" + "c".repeat(32));
  // 6 chunks 300 ms apart: 1.8 s in all, well past the 1 s idle limit, never silent for 1 s.
  const steps = [
    [300, sse({ model: "deepseek-v4-pro", choices: [{ delta: { reasoning_content: "thinking" } }] })],
    [300, sse({ choices: [{ delta: { reasoning_content: " more" } }] })],
    [300, sse({ choices: [{ delta: { content: "Streamed " } }] })],
    [300, sse({ choices: [{ delta: { content: "answer." } }] })],
    [300, sse({ choices: [{ delta: {}, finish_reason: "stop" }] })],
    [300, sse({ choices: [], usage: { prompt_tokens: 100, prompt_cache_miss_tokens: 100, completion_tokens: 50 } }) + "data: [DONE]\n\n"],
  ];
  const fake = await scriptedDeepSeek("text/event-stream", steps);
  try {
    const a = await run(["start"], "Review.", { DEEPSEEK_KEY_FILE: join(dir, "key"), DEEPSEEK_API_URL: fake.url, DEEPSEEK_IDLE_MS: "1000" }, dir);
    assert.equal(a.env.status, "SUCCESS");
    assert.equal(a.env.response, "Streamed answer.", "reasoning is not part of the answer");
    assert.equal(a.env.usage.input_tokens, 100);
    const ledger = readFileSync(join(dir, "deepseek-spend.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
    assert.equal(ledger[0].finish, "stop");
    assert.equal(ledger[0].served_by, "deepseek-v4-pro");
  } finally { fake.server.close(); rmSync(dir, { recursive: true, force: true }); }
});

test("a body still arriving at the time limit is TIMEOUT, silence is STALLED, a broken body is BAD_BODY; never EMPTY", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ds-timeout-"));
  writeFileSync(join(dir, "key"), "sk-" + "d".repeat(32));
  // The 2026-10-26 shape: headers at once, keep-alive lines, the answer after the cap.
  const late = await scriptedDeepSeek("application/json", [[0, "\n"], [200, "\n"], [200, "\n"], [200, "\n"], [200, "\n"], [3000, JSON.stringify(reply("late"))]]);
  const silent = await scriptedDeepSeek("text/event-stream", [[0, ": open\n\n"], [3000, sse({ choices: [{ delta: { content: "x" } }] })]]);
  const broken = await scriptedDeepSeek("application/json", [[0, "{\"choices\": [ not json"]]);
  try {
    const env = { DEEPSEEK_KEY_FILE: join(dir, "key") };
    const t = await run(["start"], "Review.", { ...env, DEEPSEEK_API_URL: late.url, DEEPSEEK_TIMEOUT_MS: "1500", DEEPSEEK_IDLE_MS: "1000" }, dir);
    assert.equal(t.env.status, "TIMEOUT", t.env.error);
    const s = await run(["start"], "Review.", { ...env, DEEPSEEK_API_URL: silent.url, DEEPSEEK_IDLE_MS: "800" }, dir);
    assert.equal(s.env.status, "STALLED", s.env.error);
    const b = await run(["start"], "Review.", { ...env, DEEPSEEK_API_URL: broken.url }, dir);
    assert.equal(b.env.status, "BAD_BODY", b.env.error);
  } finally { for (const f of [late, silent, broken]) f.server.close(); rmSync(dir, { recursive: true, force: true }); }
});
