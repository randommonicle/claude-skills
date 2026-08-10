# Decisions

Standing decisions about the library that are not derivable from the code or
the git history. Newest first. Lessons live in LESSONS_LEARNED.md; this file
records choices, with enough of the why that a later session does not
relitigate them.

## 2026-08-10 Vendor skill packs are machine-local

Third-party skill packs installed beside the library in `~/.claude/skills`
(today that is the Cloudflare pack: agents-sdk, cloudflare,
cloudflare-email-service, cloudflare-one, cloudflare-one-migrations,
durable-objects, sandbox-migrate-to-next, sandbox-next, sandbox-stable,
turnstile-spin, web-perf, workers-best-practices, wrangler) are never
committed, indexed, or counted. They are not the maintainer's content, they
are not committee-ratified guardrails, and committing them would make the
`ash` plugin redistribute someone else's material. Each machine reinstalls
them from their own source instead.

The Anthropic built-ins already followed this pattern via the `BUILTINS` set
in the gate scripts. Vendor packs get the same treatment via a `VENDOR` set,
stated in three kept-in-step sites: `hooks/check-index.mjs`,
`hooks/audit-fires.mjs`, and the vendor block in `.gitignore`.
`check-index.test.mjs` asserts all three agree, so adding a fourteenth vendor
skill to one site and not the others goes red in CI.

Third-party material the library does adopt is forked properly instead, with
an `UPSTREAM.md` recording provenance and local patches, as the three
`unslop-*` skills do.
