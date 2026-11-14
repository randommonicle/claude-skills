# lessons-watch

A weekly count of the lessons this library has not yet learned from, delivered as one GitHub
issue, with your computer switched off.

Every lessons entry written under the [norms](../NORMS.md) closes with a line naming the skill
that should have prevented it, or `none - new candidate`. Those candidate lines are the misses
log. A sweep reads them and proposes skills. Nothing told anyone when a sweep was due, so sweeps
happened when someone remembered. This counts the candidate lines written since the last sweep
and tells you the number.

It is not a skill and no model is involved. It is two small scripts and a workflow template.

## What it does

- `count.mjs` reads every lessons file named in a `watch.json`, counts candidate lines, subtracts
  each file's count at the last sweep, and writes a report. A file it cannot read fails the run.
  It is never counted as zero.
- `workflow.template.yml` runs that weekly on GitHub Actions in a private repository of yours and
  keeps one issue current. It comments, mentioning you, only when the figures change.
- `mirror.mjs` is optional. It copies lessons files that live only on your machine (no git, or
  no remote) into that private repository, so the weekly count can see them. Only the lessons
  file travels. A file that matches a secret shape is not copied, and the report names it.

## Set it up

1. **Create a private repository**, for example `lessons-watch`. Check it is private before
   anything is pushed to it: `gh repo view <you>/lessons-watch --json visibility`.
2. **Write `watch.json`** at its root, one entry per lessons file:

   ```json
   {
     "threshold": 10,
     "sources": [
       { "name": "my-app", "type": "github", "repo": "you/my-app", "path": "LESSONS_LEARNED.md", "baseline": 0 },
       { "name": "local-thing", "type": "file", "path": "mirror/local-thing/LESSONS_LEARNED.md", "baseline": null },
       { "name": "my-app-v2", "type": "excluded", "reason": "second checkout of my-app" }
     ]
   }
   ```

   `baseline` is the file's candidate count at your last sweep. Use `null` when you do not know
   it: the file is then counted from zero and labelled, which overstates the figure where a
   guess would hide entries. List every lessons file you have, and mark the ones you leave out
   as `excluded` with a reason, so the report shows the decision.
3. **Copy `workflow.template.yml`** to `.github/workflows/lessons-watch.yml` and replace
   `REPLACE_WITH_A_FULL_COMMIT_SHA` with a commit of this repository you have read.
4. **If any `github` source is private**, create a fine-grained personal access token with
   `Contents: Read-only` on exactly those repositories, and store it yourself so the value never
   passes through an agent's transcript:

   ```bash
   gh secret set LESSONS_READ_TOKEN --repo <you>/lessons-watch
   ```

   The token expires. When it does, the run fails and the issue says `HTTP 401` beside each
   source it could not read.
5. **Run it once by hand** from the repository's Actions tab, then check three things: the issue
   exists, its table lists every source, and a notification reached you. A green run is not
   proof of the third.

## Files that are not on GitHub (optional)

Clone your private repository locally, then create `lessons-watch.json` beside this library's
clone (for a direct clone at `~/.claude/skills`, that is `~/.claude/lessons-watch.json`):

```json
{
  "clone": "C:/Users/you/lessons-watch",
  "origin": "https://github.com/you/lessons-watch.git",
  "files": [
    { "name": "local-thing", "file": "C:/Users/you/Projects/local-thing/LESSONS_LEARNED.md" }
  ]
}
```

Try it without writing anything, read what it says it would copy, then run it for real:

```bash
node ~/.claude/skills/lessons-watch/mirror.mjs --dry-run
```

```bash
node ~/.claude/skills/lessons-watch/mirror.mjs
```

Then schedule the second command daily (Task Scheduler on Windows, cron elsewhere). It refuses
to run when the clone's origin is not the one the config names. With no config file it does
nothing and says so, which is the state every install starts in.

Be clear about what this is: an unattended push of text from your machine to a repository, on
your own git credentials. It is the only part of this library that sends file content anywhere.
Keep the repository private, and expect a lessons file to quote errors, paths and commands.

## After a sweep

Set each source's `baseline` in `watch.json` to the "Now" figure from the issue. Skip this and
the number only grows.

## What it cannot tell you

- A candidate line is counted when the two words `new candidate` appear on a line. Real files
  do not keep to one form, so the count can include a sentence of prose. It errs high.
- It counts lines, not lessons worth a skill. Ten candidates from one bad afternoon in one
  project are not ten skills.
- It sees GitHub's copy of a file, so an unpushed entry is invisible until it is pushed.

## Checking it

```bash
node lessons-watch/watch.test.mjs
```

Judge it by exit code. The suite covers each unreadable-source case, the planted secret shapes
against an innocent corpus, and the mirror against a throwaway origin.
