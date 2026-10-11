# Review: the Cloudflare vendor pack against this library's rules, 2026-10-12

The pack is machine-local and never committed (DECISIONS.md, 2026-08-10), so the paths below
point into `~/.claude/skills/` on a machine that has it, not into this repo. `cf/` is short for
`cloudflare/references/`.

**Method.** One read-only subagent (Sonnet) cloned `https://github.com/cloudflare/skills` into a
scratch folder, hash-matched every local file against its history, and swept the 13 skills for
instructions that conflict with seven of this library's rules. It read six SKILL.md files in full
and grep-swept the rest, about 300 reference files, so a conflict that matches none of its patterns
may be missed. Its findings are evidence: the three marked **verified** were re-read from the
file by the lead session; the rest are as reported.

## Source and freshness

- Source: `cloudflare/skills`. All 375 local files match commit `f96bff7` (2026-08-07)
  exactly. **verified** for `wrangler/SKILL.md`.
- Upstream head on 2026-10-12: `c430dd9`, 210 commits ahead. All 13 skills changed upstream
  (the `cloudflare` references pruned from 320 files to 185; `wrangler/SKILL.md` cut by about
  850 lines); four skills are new upstream (`basin`, `k2`, `nextjs-on-cloudflare`,
  `workers-profiling`).
- Upstream's install routes: `/plugin marketplace add cloudflare/skills` then
  `/plugin install cloudflare@cloudflare`; `npx skills add https://github.com/cloudflare/skills`;
  or clone and copy. Which one installed this copy is not recorded; the files are plain copies.

## Conflicts with this library's rules

Where a vendor skill's example and a library guardrail disagree, the guardrail is the one this
library has ratified. Most severe first within each rule.

**secrets-in-output**
- `cf/r2-sql/gotchas.md:32`: `echo $WRANGLER_R2_SQL_AUTH_TOKEN` prints a token.
- `cf/ai-gateway/troubleshooting.md:69`: `curl -v` with a Bearer header echoes it.
- `wrangler/SKILL.md:775`, `cf/secrets-store/configuration.md:103`: `secrets-store secret get`.
  Reported as printing the value; not verified, since Secrets Store may return metadata only.
- Secret values piped through `echo` in six reference files (`cf/wrangler/patterns.md:28`,
  `cf/pages/configuration.md:49`, `cf/pages/README.md:53`, `cf/pages-functions/configuration.md:80`,
  `cf/pages-functions/gotchas.md:34`, `cf/secrets-store/gotchas.md:46`), against the pack's own
  `wrangler/SKILL.md:243`.

**confirm-before-push (outward actions without an ask)**
- `cloudflare-email-service/SKILL.md:27`: tells the agent to run `wrangler email sending enable`,
  which adds DNS records. **verified**.
- `cf/d1/gotchas.md:13,78`: remote migrations "for production"; `cf/c3/patterns.md:7,10`:
  `--deploy` at creation; `cf/bindings/gotchas.md:85`: a deploy given as a fix.
- Clean: cloudflare-one, cloudflare-one-migrations and turnstile-spin gate on approval;
  sandbox-migrate-to-next asks before a production cutover.

**live-data-surgery**
- `cf/kv/configuration.md:87`: `kv bulk delete ... --force`, no inventory first.
- `cf/queues/configuration.md:142` (purge), `cf/d1/patterns.md:184,188` (time-travel restore,
  remote file), `cf/pipelines/gotchas.md:19-21` (delete and recreate), and bucket, database and
  index deletes in `wrangler/SKILL.md`.

**guard-the-spend-paths**
- `cloudflare-email-service/references/sending.md:32-41`: a public fetch handler sends one email
  per request with no auth or cap; the skill never mentions a per-IP limit.
- `cf/turnstile/patterns.md:190-193`: the always-pass test secret unless `NODE_ENV` is
  `production`, so an unset variable fails open.
- `agents-sdk/SKILL.md:133`: a public route into a model call, with no rate limit anywhere in
  that skill.

**constant-time-secret-compare**
- `cf/stream/patterns.md:133`: `return hex === parts.sig1;`, an HMAC compared with `===`.
  **verified**. Also `cf/snippets/patterns.md:116` and `cf/workers-playground/patterns.md:108`.
  workers-best-practices teaches `timingSafeEqual` correctly.

**price-the-spend**: recurring work with no cost note in `agents-sdk/SKILL.md:159`
(`scheduleEvery(30, ...)`), `cf/cron-triggers/configuration.md:72,77` and
`cf/containers/configuration.md:14-15`.

**verify-the-effect**: none found.

## What follows

Nothing in the pack is edited: it is not this library's content, and a reinstall would overwrite
any edit. Open with Ben on 2026-10-12: reinstall at upstream head (fresher, and some lines above
may be gone), and whether to write down that the library's guardrails outrank a vendor skill's
examples.
