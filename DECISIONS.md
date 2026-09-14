# Decisions

Standing decisions about the library that are not derivable from the code or
the git history. Newest first. Lessons live in LESSONS_LEARNED.md; this file
records choices, with enough of the why that a later session does not
relitigate them.

## 2026-09-14 Domain skill packs install per project, stripped

The 2026-08-10 entry gives third-party material two doors: vendor pack
(machine-local, never committed) or proper fork with `UPSTREAM.md`. A domain
pack such as `coreyhaines31/marketingskills` (50 skills, MIT) fits neither.
It is not a guardrail and has no cross-repo recurrence, so it fails the
library's admission rule; and it is not a machine-local vendor tool, because
the repos that do marketing need it committed and synced between machines.
Installing it user-level would put roughly 9k tokens of trigger text into
every session, including regulated PropOS work.

Third door: a domain pack installs into `.claude/skills/` of each repo that
does the work, as a stripped subset, with an `UPSTREAM.md` pinning the
commit and listing every cut, and the upstream licence beside it. Never
user-level, never into this library, never indexed or counted here. The
installer is `hooks/install-marketing-pack.mjs` (keep list, pin, and cuts
in one place; idempotent; refuses foreign same-named directories) and
`docs/REVIEW_marketingskills_2026-09-14.md` records why the subset is what
it is. Two library skills stand in front of the pack in every target repo's
CLAUDE.md: `unslop-text` as the final pass on its copy, and
`substantiate-outward-claims` on any customer-facing claim.

Project skills load from the directory a session launches in and its
ancestors, never from a subdirectory. Where sessions launch from outside
the repo (1f916: the non-git parent folder), the pack still installs into
the repo for provenance, and each machine adds a directory junction from the
launch directory's `.claude/skills` to the repo's; the repo's CLAUDE.md
carries the command. Check the launch directory before installing, not after.

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
