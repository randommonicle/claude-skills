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
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
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

test("only named ARTIFACT_ files in the working folder are attached", () => {
  const dir = mkdtempSync(join(tmpdir(), "ds-art-"));
  writeFileSync(join(dir, "ARTIFACT_a.diff"), "A");
  const found = namedArtifacts("see C:/elsewhere/ARTIFACT_a.diff and ../ARTIFACT_missing.diff and /etc/passwd.", dir);
  assert.deepEqual(found, [join(dir, "ARTIFACT_a.diff")]);
  rmSync(dir, { recursive: true, force: true });
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
