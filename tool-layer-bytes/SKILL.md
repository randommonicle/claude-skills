---
name: tool-layer-bytes
description: The shell and editing layers between Claude and a file rewrite bytes the author never touched (escapes dropped or turned into control bytes, CRLF turned LF, arguments rewritten), and the transcript still shows the command as written. Route any payload carrying a backslash, a quote of the enclosing kind or a `$'` through the Write or Edit tool, never a heredoc or an inline -e/-c string; never `sed -i` a CRLF file; and prove the bytes after any scripted edit. Triggers when writing code or regex through the shell, editing files with a script, reading or writing files from Python or Node, and checking whether a scripted edit applied. Does not fire on edits made with the Write or Edit tool, which carry bytes as given.
---

# Tool-layer bytes

Between the text Claude writes and the bytes on disk sit layers that rewrite: the Bash tool's
own escaping, the shell's quoting and heredoc rules, MSYS path conversion on Git for Windows,
`sed -i` and Python's newline handling, and git's `core.autocrlf`. Each reports success. A
green run afterwards proves nothing about whether the edit applied, because the run tests the
bytes that landed, not the ones intended.

## The rules

1. **Code through files, not the shell.** Any script or payload carrying a backslash, a quote
   of the kind enclosing it, or a `$'` goes to disk with the Write tool and runs as a file.
   Not a heredoc, not `node -e`, not `python -c`. The Bash tool has dropped one level of
   backslashes, turned `\b` and `\xNN` into raw bytes, and split a heredoc at a `$'`.
2. **No in-place stream edits on Windows checkouts.** `sed -i` and `perl -pi` rewrite the
   whole file and turn CRLF line endings LF; `git diff` under `core.autocrlf=true` cannot see
   it. Use the Edit tool.
3. **Python and Node read and write with the newline mode stated.** Python's default
   `open(p)` turns CRLF into LF on read, so "read normally, write with `newline=''`" still
   writes LF. Read and write with `newline=''`, or bytes.
4. **One input per command.** A heredoc and a later `< file` redirect on one command: the
   later redirect wins and the heredoc never reaches the program.
5. **Paths and revisions through MSYS:** an argument like `origin/main:path` or one starting
   `//` can be rewritten; prefix `MSYS_NO_PATHCONV=1`.

## Prove the bytes after any scripted edit

- `git diff --stat`: a whole-file count for a one-line edit is the tell.
- Line endings: `tr -cd '\r' < f | wc -c` against `wc -l < f`; `git ls-files --eol f`.
- Control bytes: `tr -d '\011\012\015\040-\176\200-\377' < f | wc -c` should print 0.
- Syntax: `node --check f`, or the language's own.
- A mutation test is proved by its red run, read in full; if the mutation script reports it
  made no change, the escape was eaten and the red run never happened.

## The hook

`hooks/byte-layer-warn.mjs` (PreToolUse, Bash) warns, never blocks, on a heredoc or inline
code string carrying a backslash (a `git commit` message is exempt), on `sed -i` and
`perl -pi`, and on a heredoc with a later input redirect. It is the moment-of-use half; this
skill is the rest.

## Provenance

Twelve misses in four repositories, August to October 2026, while the rule lived only in a
machine memory: ICC L-043, L-046, L-083, L-094, L-120 and the session of 22 October 2026
(fifty working-copy files turned LF by Python's default read; three heredocs that dropped
backslashes); AI domain L-122, L-144, L-146; passive income L-084; RimModManager L-011.
`docs/SKILL_PROPOSALS_2026-10-22.md`, Tier 1 item 1.

## Additions from the misses-log sweep (2026-11-01)

Four more layers that rewrite bytes between the thing you typed and the thing that ran.

- **A byte-exact test against a working-tree file needs a `.gitattributes` behind it.** Git's
  `text=auto` normalises to LF in the object store and may hand the working copy CRLF on
  checkout, so a test asserting exact bytes passes on the machine that wrote the file and
  fails on the next clone. Pin the path's `eol` in `.gitattributes` and let the test assert
  against that, or the test is measuring the checkout rather than the content. (PropOS
  2026-07-27. Acted on here: this repository pinned `*.json text eol=lf` on 2026-11-05 after
  the three skill-count files warned on commit.)
- **PowerShell double-quoted strings turn backtick sequences into control bytes.** In
  PowerShell the backtick is the escape character, so `` `n `` becomes a newline, `` `t `` a
  tab and `` `0 `` a null inside `"..."`, before your program sees any of it. Use single
  quotes for a literal, or write the file with a tool rather than through a shell string.
  (Rimagent 2026-10-13.)
- **Git Bash drops `TZ` region names on the way to a Windows program.** `TZ=Europe/London`
  set in Git Bash does not reach a native Windows binary as that zone, so a time read through
  one is not the zone you asked for. Read Windows clock values with PowerShell `Get-Date`
  instead, and see `live-state-first` for how the reading reaches the record. Rule 5 above
  covers the other half of this layer, the `//` and `origin/main:path` rewrite. (ASH
  2026-10-08.)
- **`$'\r'` inside a double-quoted substitution is the two letters, not a carriage return.**
  `grep -c "$'\r'" file` searches for a dollar sign, a quote and the letter r. Bash expands
  `$'...'` only when it is unquoted, so write `grep -c $'\r' file`. The failure is silent and
  reports zero, which reads as a clean file. (Library 35.)
