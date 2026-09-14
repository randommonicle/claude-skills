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

The pack installs into the repo, even where sessions launch from outside it
(1f916: sessions run from the non-git parent folder). A session's opening
listing is built from the `.claude/skills/` of the directory it launched
in, plus the user level; nothing below the launch directory is in it. So
from that parent folder the pack is reached through a directory junction,
`<parent>\.claude\skills` to `society\.claude\skills` (`mklink /J`, once
per machine, command in `society/CLAUDE.md`), and the callable names are
the bare ones (`seo-audit`, `pricing`), which is what the two 1f916 test
sessions of 2026-09-14 opened with (98 skills, pack unscoped) and invoked.

**This paragraph was written three times on 2026-09-14, and the second
version was wrong.** `2bb59bc` said the harness never reaches a
subdirectory and prescribed the junction. `40fc7e4` said it does, by path
scope, and removed the junction, citing a listing of all 14 as
`society:ai-seo` and so on (transcript `2ee45744`, line 148). That line is
real and was captured mid-session: a `dynamic_skill` event at 20:13:18Z,
in the second after a `Write` under `society/`, with the junction still in
place. The twin session `df64a87c` made the same kind of `Write` and got
no such event, and the first fresh parent-folder session without the
junction (`57894514`, 21:22Z) listed none of the pack and was refused
`Unknown skill: society:seo-audit`. The junction went back at 21:31Z.
Subdirectory discovery therefore exists, is lazy, fired in one of two like
cases, and is not relied on; expect a session that touches `society/`
files to list the pack a second time as `society:*`. LESSONS 14.

Two further observations, recorded as observations. A skill directory that
appears at the launch directory mid-session can be picked up: after the
junction was recreated, the stale session `57894514` loaded bare
`seo-audit` (21:34Z) although its opening listing had none of the pack.
And `change_directory` did not rebuild the listing, twice: the two icc-site test
sessions launched in a stub folder with no `.claude/skills/`, switched to
the real repo mid-session, and were refused before and after the switch;
the "installed mid-session" account of those refusals in `40fc7e4` was
wrong, the pack had been on disk 44 minutes before they started. The safe
practice is unchanged, launch in the directory whose skills you need and
use a fresh session, but it is practice, not a harness rule. LESSONS 13
(corrected) and 14.

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
