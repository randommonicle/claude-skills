# Review: coreyhaines31/marketingskills, strip-and-use assessment (2026-09-14)

> **Outcome, 2026-09-14 evening.** Ben's answers to the four open decisions: keep list is the 12
> plus both optionals (14); targets icc-site, 1f916, and PropOS (PropOS on his call against the
> recommendation; the cost is 10,096 characters of descriptions, about 2.5k tokens, in every
> session's skill listing); install by script; DECISIONS third door written. What landed:
>
> - `hooks/install-marketing-pack.mjs` (in `hooks/`, not `scripts/`: that is where this repo keeps
>   tooling and where CI runs `*.test.mjs`) with `install-marketing-pack.test.mjs`, 27 cases, each
>   cut and refusal proven red under mutation. Commits `7703777`, `1ba24e5` (LF regardless of the
>   source clone's autocrlf). DECISIONS entry `b7c264d`. Measured on the real pack: 14 skills, 71
>   lines cut, 59 files, raw-byte identical across the three targets.
> - icc-site: `7976d1c` on `chore/marketing-skills-pack`, fast-forwarded into local `main` (its
>   CLAUDE.md rule: branch, merge on go-ahead). Pack live in the checkout. Not pushed; local main
>   was already 34 ahead of origin before this.
> - 1f916 (`society`): `780b2a13` on `chore/marketing-skills-pack`, fast-forwarded into local
>   `main`. Sessions launch from the non-git parent folder, so a directory junction
>   `<parent>\.claude\skills -> society\.claude\skills` was created (mklink /J) and the parent's
>   CLAUDE.md carries the rules; `society/CLAUDE.md` (new) records the junction command for the
>   other machine. Not pushed.
> - PropOS: `8b46fe9` on `chore/marketing-pack` in worktree `.claude/worktrees/marketing-pack`
>   off `origin/main`; the main checkout (86 behind origin) untouched. Not pushed, no PR; both are
>   Ben's per-action call.
> - Step 5 (CLAUDE.md lines) done by hand in each target, as the recipe said.
>
> Not done, by design: prose mentions of dropped skills outside Related Skills rows stay as
> written (UPSTREAM.md says so). The real ride, a session in one of the targets invoking a pack
> skill, needs Ben to open one; frontmatter of all 14 passes the index gate's checks.

Source: `https://github.com/coreyhaines31/marketingskills`, reviewed at commit
`5b2c000` (2026-09-04, "feat: ai-seo 2.5.0"), MIT licence (`LICENSE`, copyright
Corey Haines 2025). Clone read in full for structure; every skill's frontmatter, size and non-markdown
content measured. Read in part: `product-marketing` lines 1 to 120 of 255, `copywriting`
headings plus lines 8 to 70 of 256, `cro` grepped for the claims cited below. Nothing else
was read line by line.

## Verdict

Usable, in a stripped and project-scoped form. Do not put it in this library.

- **Not library material.** The README's admission rule is engineering guardrails with
  recurrence across repos, and the four-layer design exists "so 43 skills coexist without
  diluting description-trigger matching". None of the 50 is a guardrail and the domain is
  orthogonal. DECISIONS.md (2026-08-10) gives third-party material two doors: vendor pack
  (machine-local, never committed) or proper fork with `UPSTREAM.md`. A domain pack the
  library does not guard belongs at neither door here.
- **Not user-level either.** All 50 descriptions total 35,693 characters (median 659, max
  1,014), roughly 9k tokens of system prompt in every session including PropOS regulated
  work, plus 50 entries across the three kept-in-step VENDOR sites. A 12-skill subset is
  about 8k characters, and only in the repos that do marketing.
- **Where it goes:** `.claude/skills/` inside each repo that does marketing work
  (Intelligent Carpet Cleaning; a PropOS marketing surface if one exists; 1f916.ai),
  committed there with an `UPSTREAM.md` pinning `5b2c000` and listing every cut, and the
  upstream `LICENSE` alongside. That is the `unslop-*` precedent applied per project.
  `product-marketing` is project-scoped by construction anyway: it writes
  `.agents/product-marketing.md` and every other skill reads that first.

## What the pack is

50 skills, one `SKILL.md` each (15,196 lines total), each with a `references/` folder
(2 to 9 files) and an `evals/evals.json`. Frontmatter is `name`, `description`,
`metadata.version`; the descriptions are long trigger-phrase lists, which is why they
run to 1k characters. Content is mechanical playbooks (steps, section checklists, output
formats), not personas. `product-marketing` is the hub: it drafts a positioning document
from the repo (README, landing pages, meta descriptions) and the others consume it.

Sponsor material is real but contained. The README leads with two paid "Verified
Partners" (Converly, Ploy) and a `tools/` layer of 100+ vendor integration notes; skills
reach it only through a closing "For implementation, see the tools registry" section.
In the proposed keep set that section exists in `ai-seo` (1 link), `emails` (7) and
`analytics` (6); nothing else in the set links out. Nothing executable ships anywhere in
`skills/` (all 50 checked): the only non-markdown files are one `.html` template under
`ad-creative`, one `.csv` template under `directory-submissions`, both dropped, and the
50 `evals/evals.json` prompt files.

## Proposed subset (Ben decides)

Keep, 12 of 50. Sizes are `SKILL.md` lines / `references/` files.

| Skill | Why | Size |
|---|---|---|
| `product-marketing` | Required hub; the others read its output first | 255 / 1 |
| `copywriting` | Site and landing copy | 256 / 3 |
| `copy-editing` | Editing pass on existing copy | 457 / 4 |
| `cro` | Landing page structure and conversion review | 187 / 3 |
| `seo-audit` | Technical and on-page audit; the carpet-cleaning site's main need | 499 / 3 |
| `site-architecture` | URL and navigation structure | 357 / 4 |
| `schema` | Structured data; `LocalBusiness` markup is a concrete win for a service firm | 179 / 2 |
| `ai-seo` | Being cited by LLM answers; topical, strip its tools section | 488 / 9 |
| `content-strategy` | Editorial planning | 439 / 3 |
| `pricing` | PropOS pricing page | 295 / 5 |
| `emails` | Lifecycle email copy; strip its tools section (delivery is already covered by `email-delivery-verification`) | 311 / 4 |
| `analytics` | GA4 / Plausible setup; strip its tools section | 310 / 4 |

Optional: `customer-research` (305 / 3), `offers` (155 / 9). Both B2B-SaaS-shaped but
harmless.

Drop, 36: the paid-ads family (`ads`, `ad-creative`, `attribution`, `ab-testing`),
outbound (`cold-email`, `prospecting`, `sales-enablement`, `revops`), SaaS lifecycle
(`onboarding`, `signup`, `paywalls`, `popups`, `churn-prevention`, `referrals`,
`free-tools`, `lead-magnets`, `marketing-loops`), channels Ben does not run (`sms`,
`social`, `video`, `image`, `influencer-marketing`, `co-marketing`,
`community-marketing`, `events`, `public-relations`, `aso`), strategy scaffolding
(`marketing-plan`, `marketing-ideas`, `marketing-psychology`, `marketing-council`,
`launch`, `competitors`, `competitor-profiling`, `programmatic-seo`), and
`directory-submissions`, which is Product Hunt / G2 / BetaList submissions, not the local
citations a service business wants.

## Strip recipe

Per target repo, from a clone pinned at `5b2c000`:

1. Copy `skills/<name>/` for each kept name into `<repo>/.claude/skills/<name>/`,
   `references/` included; drop `evals/`.
2. Do not copy `tools/`. In `ai-seo`, `emails` and `analytics`, delete the closing
   "For implementation, see the tools registry" section and any table row linking to
   `../../tools/integrations/*.md`.
3. In each kept skill's "Related Skills" section, delete the rows that name a dropped
   skill (30 such rows across the 12-skill keep set, measured; e.g. `cro -> ab-testing`,
   `emails -> churn-prevention`; the count moves if the set does), so the model is never
   pointed at a skill that is not there.
4. Write `<repo>/.claude/skills/UPSTREAM.md`: source URL, commit `5b2c000`, date, MIT,
   the keep list, and each cut from steps 2 and 3. Copy upstream `LICENSE` beside it.
5. Add two lines to the repo's `CLAUDE.md`: copy produced through these skills gets
   `unslop-text` as the final pass, and any customer-facing claim, statistic or
   certification goes through `substantiate-outward-claims` before it ships.

If Ben confirms the subset, a small script in this repo (`scripts/install-marketing-pack.mjs
<target-repo>`) can do steps 1 to 4 idempotently so both machines and later upstream
bumps produce the same tree. Not built until the subset is confirmed.

## Two flags

- **House style collides with the pack's prose.** The skills are written in exactly the
  register `unslop-text` strips: em dashes throughout, antithesis ("Clarity is not just
  tidier" and on, `copywriting/SKILL.md` under "Clarity Over Cleverness"), sections
  instructing the model to "Pepper in Humor" and "Use Rhetorical Questions", US spelling.
  The skills' own text is not rewritten (that is what `UPSTREAM.md` provenance is for),
  but their output must pass `unslop-text` and Ben's no-em-dash rule stands. Step 5 above
  makes that a project rule rather than a hope.
- **Claims discipline.** `copywriting` carries "Honest over sensational", with fabricated
  statistics and testimonials named as a trust and legal liability (its Core Principles,
  item 6), which is compatible with the library. But the same skill cites "+81%
  conversions, a 38% shorter sales cycle" with no source, and `cro` builds pages around
  social proof and attributed testimonials (its section 5, "Trust Signals and Social Proof"). For ASH- or PropOS-branded output, `substantiate-outward-claims`
  sits in front of these skills, not behind them.

## Open decisions for Ben

1. Confirm or edit the keep list (12, plus the two optionals).
2. Name the target repos.
3. Whether to build the install script or do the copy by hand once.
4. DECISIONS.md: record "domain skill packs install per project, stripped, with UPSTREAM.md;
   never user-level, never in this library" as the third door beside the two in the
   2026-08-10 entry.
