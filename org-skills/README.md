# Organisational skills (claude.ai chat and Cowork)

Source of truth for skills uploaded to the ASH organisation on claude.ai. These are **not** Claude
Code skills and are not installed by this plugin.

## Why they live one level down

Anthropic's enterprise guidance states plainly that *"Custom Skills do not sync across surfaces.
Skills uploaded to the API are not available on claude.ai or in Claude Code, and vice versa. Each
surface requires separate uploads and management"*, and recommends holding the source files in Git
as the single source of truth. So these are versioned here and uploaded by hand.

They sit at `org-skills/<name>/SKILL.md` rather than at the repository root so that the Claude Code
plugin loader and `hooks/check-index.mjs` do not treat them as library skills. The two halves of
that claim rest on very different evidence, so they are stated separately.

**`check-index.mjs`: verified.** Its `skillsOnDisk()` enumerates with `readdirSync(root)` and keeps
only entries where `root/<name>/SKILL.md` exists, so a second level cannot be reached. This was
established by reading the function, not by inferring it from a passing run. It reported
`ok: 44 skills` on 2026-09-16 with `working-lean` present and never named it.

**The plugin loader: unconfirmed.** In the authoring session on 2026-09-16, writing
`context-economy/SKILL.md` registered that skill immediately, and writing
`org-skills/working-lean/SKILL.md` did not register anything. That is one uncontrolled observation,
not a controlled test: the harness appears to rescan on its own schedule rather than on file
creation, and a live-session rescan is not the same code path as `"skills": "./"` in `plugin.json`
on a fresh `/plugin install`. **Check this on the next fresh install on a new machine.**

Either way the symptom is the same and it is cheap to spot: if `working-lean` ever appears in a
Claude Code session's skill list, the loader recurses and this directory must move out of the
repository.

## Current skills

| Skill | Audience | Purpose |
|---|---|---|
| [working-lean](working-lean/SKILL.md) | All ASH staff | Keep each conversation to one matter and send only the material that bears on it, for accuracy as much as for allowance. |

## Packaging and upload

Uploads are `.zip` files containing a `SKILL.md`. Only **organisation owners** can add or remove
organisation-wide skills.

**Do not use `Compress-Archive` on its own.** On Windows PowerShell 5.1 it writes entry paths with
a **backslash** (`working-lean\SKILL.md`). The ZIP specification requires forward slashes, and a
server-side extractor is entitled to reject it or to treat the whole thing as one oddly-named file
at the root. Measured on this machine 2026-09-16. It is only safe for a flat zip, where there is
no separator at all.

Build both shapes from the repository root:

```bash
powershell -NoProfile -Command "Set-Location '.'; Add-Type -AssemblyName System.IO.Compression.FileSystem; \$out=(Join-Path (Get-Location).Path 'org-skills\working-lean.zip'); if (Test-Path \$out) { [System.IO.File]::Delete(\$out) }; \$zip=[System.IO.Compression.ZipFile]::Open(\$out,'Create'); \$e=\$zip.CreateEntry('working-lean/SKILL.md','Optimal'); \$s=[System.IO.File]::OpenRead((Resolve-Path 'org-skills\working-lean\SKILL.md').Path); \$d=\$e.Open(); \$s.CopyTo(\$d); \$d.Dispose(); \$s.Dispose(); \$zip.Dispose()"
```

```bash
powershell -NoProfile -Command "Compress-Archive -Path 'org-skills/working-lean/*' -DestinationPath 'org-skills/working-lean-flat.zip' -Force"
```

Always list the entries before uploading, because this is exactly the step that fails silently:

```bash
powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path 'org-skills/working-lean.zip').Path).Entries | ForEach-Object { \$_.FullName }"
```

Expected: `working-lean/SKILL.md`, with a forward slash. A backslash means re-read the warning above.

Then upload at **claude.ai > Organization settings > Skills**
(`https://claude.ai/admin-settings/skills`).

**Which shape, still unconfirmed.** The support article says a `.zip` "containing a SKILL.md file"
without stating whether `SKILL.md` sits at the zip root or inside a folder. Try
`working-lean.zip` (folder shape, matches the on-disk convention and the Skills API). If it is
rejected, try `working-lean-flat.zip`. Record which one worked here, so the next skill skips this.

The `.zip` files are build artefacts and are gitignored, so they cannot be committed by accident.

## Before uploading: evaluation queries

Anthropic's enterprise guidance asks for 3-5 representative queries per skill covering
should-trigger, should-not-trigger and ambiguous cases, and says **authors should not be their own
reviewers**. This skill was drafted by Claude in a Claude Code session, so someone other than its
author should run these in a claude.ai chat with the skill provisioned.

**Should trigger:**

1. "I've attached the full lease for Flat 12 — can you tell me who's responsible for the windows?"
   (large document, narrow question)
2. "This chat's got really long and it keeps mixing up the two blocks. What should I do?"
   (long-conversation symptoms)
3. "I've hit my limit again and I've barely asked anything today. Why?"
   (usage question)
4. "I'm setting up a Cowork task — should I point it at the whole client folder?"
   (Cowork scoping)

**Should not trigger:**

5. "What's the consultation threshold for qualifying works?"
   (ordinary domain question, no context-size dimension)
6. "Draft a letter to the RMC directors about the cyclical decorations."
   (ordinary drafting task)

**Ambiguous, judgement call either way:**

7. "Summarise these four service charge accounts."
   (multiple attachments, but the task genuinely needs all four — the skill should not tell the
   user to send fewer when fewer would not answer the question)

**The one that matters most:**

8. "Here's the lease for Flat 3. Am I right that the landlord has to repair the roof?"
   (lease interpretation, whole document attached)

   The skill must **not** suggest trimming to the repairing covenant, extracting clauses, or
   sending less. A repairing covenant's meaning depends on the definitions, the extent of the
   demise, the landlord's reciprocal covenants, the service charge schedule and any deed of
   variation. If the skill fires here and nudges towards an extract, it is causing the exact
   professional harm it was corrected for on 2026-09-16, and it must not be uploaded until that
   is fixed. Ideally it either stays quiet or reinforces sending the whole lease.

Cases 7 and 8 are the pair to watch, and they test the same thing from two directions. A skill
about sending less has failed, not succeeded, if it tells someone to withhold material the
question needs.

## Environment, confirmed

Confirmed by Ben Graham (AI Lead) on 2026-09-16, from the admin console rather than from
documentation:

- **Cowork is on for ASH.** The earlier search-summary claim about default states is moot.
- **User-created skills are enabled.** Staff can write their own, so this skill competes for
  triggers with whatever they create. If recall degrades later, that is the first place to look.
- **Organisation-wide skill upload is available and has been used before.** The path and the
  owner-only restriction are not new ground.

Still open:

- **Skill and plugin security scanning.** Available to Enterprise organisations at the same
  settings page. It does not cover skills already present when it is turned on, so turning it on
  after this upload will not scan this skill. Turn it on first if it is going on at all.

## Suggested addition to the organisation instructions — not applied

A skill only loads when its description matches what someone is doing. The always-on habits have
no trigger moment, so they belong in the organisation instructions rather than here. This
paragraph is offered for Ben to decide on, not added by anyone else:

> Keep each conversation to one matter and start a fresh one when the subject changes: the whole
> conversation is re-sent with every message, so a long mixed thread is both slower and less
> accurate. Attach the pages that bear on the question rather than the whole document, and in
> Cowork point at a folder scoped to the task.

The first two clauses are the efficiency point. The third is already an ASH rule for data
protection reasons and is repeated here only because it happens to be the same instruction.
