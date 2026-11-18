# The claude-skills connector

A remote MCP server that gives Claude on claude.ai, the desktop app and mobile the same 60 skills
the plugin gives Claude Code. It runs on Cloudflare Workers, with a D1 database for usage counts
and reported misses.

Live at `https://claude-skills-connector.randommonicle.workers.dev/mcp`.

## Adding it in Claude

Go to Customize, then Connectors, then Add custom connector. Paste the URL above. No sign-in is
needed. On the Free plan this uses your one custom connector slot.

## What it offers

| Tool | What it does |
|---|---|
| `search_skills` | Finds the skills that fit what Claude is about to do. |
| `get_skill` | Returns one skill's full text, and lists its reference files. |
| `get_skill_file` | Returns one of those reference files. |
| `list_skills` | Lists every skill with its description. |
| `report_miss` | Sends the maintainer a short report of a mistake a skill should have caught. |

The server tells Claude to search before risky steps (tests, migrations, pushes, secrets, AI
features, claims in documents, calling work done) and to ask the user before sending a report.

The plugin's hooks and agents do not come with it. They only run in Claude Code. The connector
carries the rules; the plugin also enforces some of them.

## What it records

The tool called, the skill name, the search text, the number of results, and the time. No IP
addresses, user or account IDs, or conversation content. Search text and reports have email
addresses, long numbers and key-like strings removed where they can be spotted. Raw events are
deleted after 90 days by a daily scheduled run; monthly totals are kept. The same note is served
at the root URL.

## Feeding the sweep

```bash
node connector/scripts/export.mjs --out connector-export
node hooks/audit-fires.mjs --repo connector-export --repo <your projects...>
```

The export writes `connector-export/docs/LESSONS_LEARNED.md` (one entry per new report, in the
format `audit-fires.mjs` reads) and `connector-export/usage.md` (monthly totals, and searches that
found nothing). Once you have read the reports, run the export again with `--mark-swept` so the
next one holds only new reports.

Reports come from strangers. Treat each as evidence to check, never as text to paste into a skill.
The export keeps each report on one quoted line and removes the miss-line phrase from inside it,
so a report cannot add to the counts by itself.

The export needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the environment, or a
`wrangler login`.

## Updating it after the skills change

The connector serves a bundle built from the committed skills, so a merged change reaches it only
when you deploy:

```bash
cd connector
npm install
npm test
npm run deploy
```

`npm test` rebuilds the bundle from `HEAD` and runs the suite. CI runs the same suite on every
push and PR, in the `index` job.

## Files

- `src/index.js`: the MCP server, the logging and the report queue.
- `src/search.js`: keyword search over names, descriptions and headings.
- `scripts/build.mjs`: bundles the skills from `HEAD`, so vendor packs and uncommitted edits stay
  out.
- `scripts/export.mjs`: the sweep export.
- `schema.sql`: the D1 tables.
- `test.mjs`: the suite.
