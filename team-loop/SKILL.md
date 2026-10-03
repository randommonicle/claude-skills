---
name: team-loop
description: Keep a project's resume state in team/NOW.md, overwritten at each routine session end and checked against git at each start, and keep the operator's open decisions in one queue, the Ask board (a private claude.ai artifact, unregulated projects) or team/ASK.md (regulated projects), never both. Triggers when a session starts or resumes in a repo that has team/NOW.md, when work needs an operator decision that cannot be had in the session, when recording an answered Ask item, and when a routine session ends. Does not fire on the dated note for an unusual end (handover owns that) or on spawning agents (commission-the-roster).
---

# Team loop, stage 1: the state layer

Two files and one page give a project a standing operating layer that survives the session:
`team/NOW.md` says where the work is, the Ask queue holds what only the operator can decide,
and effort pins keep each agent on the model and effort its job needs. It works with or
without agents. Stage 2, the loop with role agents, is designed in
`docs/DESIGN_team-loop_2026-10-02.md` section 5 and is not part of this skill yet.

## team/NOW.md: the resume board

- **Overwritten, never appended, at most 40 lines,** from `templates/NOW.md`. It holds the
  current topic, the single next action, in-flight work with exact `file:line` ranges,
  deferred items with their grep anchors, verification still outstanding, and three lines
  that `session-recon` reads: `branches:` (comma-separated, a parenthesised note after a name
  is allowed), `ask:` (the queue's location) and `template:`.
- **The handover skill writes it at every session end,** and the commit that carries the
  session's last change carries it too. An unusual end (the red band, a crash or forced stop,
  a move to another machine, a scheduled run stopped by a usage limit) also gets a dated
  `docs/HANDOVER_*` file in the full handover shape. An amber-band wrap-up is a routine end.
  The history lives in git, so nothing is lost by overwriting.
- **It is described state.** `session-recon` prints how many commits HEAD has moved since
  NOW.md was committed, flags an uncommitted NOW.md or uncommitted edits to it, names any
  branch on its `branches:` line that exists neither locally nor on origin, and counts the
  open items in a `team/ASK.md` queue. Read the print, then check NOW.md against `git log`
  before acting on it (`live-state-first`).

## The Ask queue: one per project

An item is a decision or a build review that only the operator can give. Its shape is the
same in both forms: an id (`ASK-0001` upward, never reused), the project, the kind
(`decision` or `review`), the question, short context, the options with keys, the
recommendation if there is one, an evidence path in the repo, and what it blocks.

**Which form.** An unregulated project uses the Ask board, one board shared by all of them,
each item tagged with its project, so the operator has one link to check from a phone. A
regulated project, PropOS included, uses `team/ASK.md` from `templates/ASK.md`, because
board data sits on claude.ai and a content rule enforced only by care is prose. One form per
project, never both, and NOW.md's `ask:` line says which.

**The lifecycle, the same in both forms:**

1. **Ask once.** Write the item and never edit it afterwards; a changed question is a new
   item. Then park the work it blocks. The lead never builds past an open decision. If
   nothing else is unblocked, overwrite NOW.md (`next:` waiting on the item's id) before
   stopping: a park is a session end like any other.
2. **Read at every start and resume.** Read the answers, and on the board the operator's
   free notes, before starting work.
3. **Record, with the operator's words verbatim.** A decision goes into `DECISIONS.md` with
   the item id in the entry. A build review is not a decision: its answer goes on the PR as a
   comment naming the item id, or on the package's ledger line in stage 2. A free note is
   always recorded, even when it is simply acted on: in DECISIONS.md if it decides something,
   otherwise one line in NOW.md or the WORKLOG saying what was done, either way citing the
   note's document id. Before writing, look for the item or note id where the record would
   land (grep the repo, or read the PR's comments), so a crash between record and delete
   costs a delete next time, never a second entry.
4. **Delete only after the record exists** (`verify-the-effect`): after the commit for a
   decision or a note, after reading the posted comment back for a review. Then delete the
   item and its answer, or the note, on the board; in `team/ASK.md`, delete the item's
   section in a commit, since an uncommitted deletion is undone by the next checkout.

## Reading and writing the board

The board is `team-loop/ask-board.html`, published once as a private artifact with
`capabilities: {"db": {"rules": [{"path": "", "read": "owner", "write": "owner"}]}, "user": {}}`.
The owner-only rule is the privacy control: a read at any lower level sees nothing, so a
mistaken share leaks no rows. **Edit access is still never shared**, because an Editor can
publish a new version of the page with looser rules and then write answers. Its collections:

| Collection | Written by | Holds |
|---|---|---|
| `items` | the lead | one document per open item, id `ASK-nnnn` |
| `answers` | the page | `{item, choice, note, answeredAt, by, via}`, id equal to the item's |
| `notes` | the page | free notes from the operator not tied to an item |
| `meta`, doc `status` | the lead | one line for the operator's phone: what the lead is on, overwritten at each checkpoint |

Rules the probe of 2026-10-03 set (`docs/PROBE_ask-board_2026-10-03.md`):

- **Read `meta/status` first, every time.** A wrong artifact link fails with
  `invalid_argument`, but a wrong collection name on the right board reads as an empty list,
  indistinguishable from no open items. The sentinel document tells the two apart.
- **An unreadable board is not an empty board.** If the read fails, say the queue could not
  be read and ask in the session. Never report "no open decisions", and never fall back to a
  file, which would make two queues.
- **The store records no writer.** A document carries only `version` and `updatedAt`, and
  the page's `by` field is written by the page, so an answer Claude wrote cannot be told from
  one the operator wrote. Hence the next rule.
- **An answer is steering, not authority.** It picks which option gets written up and which
  topic comes next. A push, a merge, a release, a spend or anything outward still needs the
  operator's yes inside the session (`confirm-before-push`), and so does a roster's release of
  spend (`commission-the-roster` Rule 1). A review answer authorises recording the review,
  nothing more.
- **Nothing regulated on the board.** Questions and repo paths only; the evidence field is a
  path, never content.
- **Pin writes.** Pass the version you read as `if_version` on every write to an existing
  document.

## Effort pins

Every agent definition the loop uses pins `model` and `effort` in its frontmatter (`effort`:
`low`, `medium`, `high`, `xhigh` or `max`, per the sub-agents documentation). An unpinned
agent inherits the session's effort, so a reviewer spawned from a low-effort session reviews
at low effort. Reviewers pin `high` or above. An agent that builds regulated work
(migrations, access policies, money, leaseholder-facing output) pins the strong tier
(`commission-the-roster` Rule 2), or is split from its unregulated twin. The library's own
agents are pinned; agents that live only on one machine or in one project are pinned there,
through that project's own change control, and NOW.md lists any still unpinned.

## What this skill does not do

It does not decide when to wrap up (the context bands do) or what a dated handover contains
(`handover`). It does not spawn agents or price a wave (`commission-the-roster`,
`price-the-spend`). It never pushes, merges or spends on a board answer.

## Provenance

Designed in `docs/DESIGN_team-loop_2026-10-02.md` (revision 4, converged under
cross-agent review, record in `docs/REVIEW_team-loop_2026-10-02.md`), prompted by a Reddit
post describing an "agent teams" workflow. Stage 1 built 2026-10-03; the Ask board rules come
from the probe recorded in `docs/PROBE_ask-board_2026-10-03.md`. Candidate tier: admitted by
design review, not by the misses log.
