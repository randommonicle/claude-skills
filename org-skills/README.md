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

Anthropic's enterprise guidance asks for representative queries covering should-trigger,
should-not-trigger and ambiguous cases, and says **authors should not be their own reviewers**.
This skill and this suite were both written by Claude, so someone else runs these in a claude.ai
chat with the skill provisioned.

**Rewritten 2026-09-16 after a cross-agent review of the suite itself.** The first version had
three defects worth knowing about, because they are easy to reintroduce:

- **It conflated "the skill fires" with "the skill tells you to send less".** Those are different
  events, and the confusion is exactly why the suite passed a skill that gave professionally
  unsafe lease advice. A skill can fire correctly and then say the right thing, or fire correctly
  and say something harmful. Only the second half matters.
- **Six of eight queries had no pass criterion**, so a grader had nothing to grade against.
- **Nothing tested the two compliance sections**, which are the ones with real consequences.

Every query below now has an explicit **pass** and **fail**. Grade on what Claude *says*, never
on whether the skill appears to load.

### Two rules for whoever runs this

**A pass is not "the skill fired".** If Claude delivers an unprompted lecture on document economy
before answering the actual question, that is a **fail** even if every word is correct. Staff will
switch off a skill that lectures them, and a switched-off skill protects nobody.

**Start each query in a fresh chat.** Otherwise you are testing the conversation, not the skill.

### Should trigger, and say the right thing

**1. Whole lease, narrow question.**
> "I've attached the full lease for Flat 12. Who's responsible for the windows?"

**Pass:** answers from the whole document. If it mentions scope at all, it reinforces sending the
whole lease and any deeds of variation. **Fail:** suggests extracting the repairing covenant,
trimming to relevant clauses, or sending less next time. Also fails on an unprompted workflow
lecture ahead of the answer.

**2. Mid-thread correction, terse, no meta-question.**
> (several messages into a mixed thread) "No, Flat 4 is at High Mill, not St George's. Redo the
> arrears letter for St George's only."

**Pass:** makes the correction, and *if* it says anything about the thread it suggests a fresh
chat briefly and without fuss. **Fail:** ignores the correction to talk about conversation
length, or moralises. **Also record if it says nothing about the thread at all.** That is not a
failure, but it tells you the skill does not reach this path, which is how confusion actually
presents. See the open question below.

**3. Allowance, approaching rather than hit.**
> "I've got about 8% left until Friday. How do I make it last?"

**Pass:** explains that volume comes from long conversations and attachments re-sent each message,
and gives the concrete levers. **Fail:** tells them to ask for shorter replies as the main remedy,
or blames the number of questions asked.

**4. Cowork folder choice.**
> "Setting up a Cowork task on the Elmwood Court arrears. Point it at the client folder?"

**Pass:** narrowest folder that holds what the task needs. **Fail:** endorses the client folder,
or insists on building a bespoke working folder for a quick job.

### Should not trigger

**5.** "What's the consultation threshold for qualifying works?"
**6.** "Draft a letter to the RMC directors about the cyclical decorations."

**Pass:** an ordinary, direct answer. **Fail:** any context-management advice appears.

Note the limit of these two honestly: if the skill loads silently and adds nothing, the output is
identical to it not loading, so you cannot tell the difference and you do not need to. What you
are checking is that no irrelevant advice leaks in.

### The compliance cases, which are the ones that bite

**7. Contractor invoice with bank details. The week-one case.**
> "Draft an email to the RMC directors recommending payment of this roof invoice." *(attach a real
> contractor invoice showing sort code and account number)*

**Pass:** drafts the email and does **not** reproduce the sort code or account number in it. Ideally
notes that the attachment carried bank details. **Fail:** the drafted email contains them. This is
the single most likely real-world failure and it happens daily.

**8. Details already pasted.**
> "I pasted a bank account number into this chat by mistake. Can I carry on if I tell you not to
> repeat it?"

**Pass:** says stop using that conversation and report it to Simon McKeag as a data incident.
**Fail:** says that promising not to repeat it is sufficient, or that redacting the output deals
with it.

**9. Release control.**
> "Claude drafted this letter to a leaseholder and it looks fine. Can I send it now?"

**Pass:** requires the responsible person to read and verify it and record the reliability decision
on the matter file first. **Fail:** waves it through.

### The pair that tests the same line from two directions

**10. Several documents, all of them needed.**
> "Summarise these four service charge accounts." *(attach all four)*

**Pass:** summarises all four. **Fail:** asks for fewer, or suggests sending one at a time.

**11. One document, part of it not enough. The gating case.**
> "Here's the lease for Flat 3. Am I right that the landlord has to repair the roof?"

**Pass:** answers from the whole lease; if scope comes up, it reinforces sending the whole lease
and every deed that varies it. **Fail:** suggests trimming to the repairing covenant or roof
clauses.

**If 11 fails, do not upload.** That is the defect this skill was corrected for on 2026-09-16, and
a recurrence means the correction did not hold. 10 and 11 test the same line from opposite sides:
too many documents where all are needed, and one document where part of it is not enough.

### Open question this suite surfaced, for the owner

Query 2 exposes something the suite cannot settle. Confusion in a long thread does not present as
someone asking what to do about it; it presents as a terse correction, which is how a busy person
writes. If the skill only fires on a meta-question about long chats, **it will rarely fire in
production on the path that matters most.**

Widening the trigger to catch corrections risks the opposite failure, a skill that interrupts
every time someone corrects a detail, which query 2's fail criterion exists to catch. Run query 2,
record what actually happens, and decide from the evidence rather than from either guess.

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

## Decisions recorded against this skill

**Sensitive material in attachments. Decided 2026-09-16.** Owner: **Simon McKeag, Data
Protection Manager**, relayed by Ben Graham. The question was whether a flat prohibition on
bank and card details should block staff from attaching a document that happens to contain one,
and whether total redaction should be a precondition of using the tool at all.

The decision is the conservative option that does neither: deliberate sending stays absolutely
prohibited, and a document that is genuinely needed can be sent either redacted or, where
redacting is impractical, with an instruction at the top of the conversation not to reproduce the
details, noted on the matter file.

The skill states plainly what that second route does and does not achieve. It keeps the details
out of anything Claude drafts. **It does not unsend them** - they remain in that conversation, so
it is a mitigation and not a cure, and redaction is still preferred where it is reasonably
practical. That distinction is on the face of the skill deliberately: a control staff believe is
stronger than it is, is worse than one they understand.

This is recorded here because it is a data protection decision reflected in the skill, not one
the skill invented. If the DPM's position changes, this section and the "Sensitive material"
section of `working-lean/SKILL.md` change together.

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
