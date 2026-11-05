---
name: enumerate-the-set
description: A change, reset, guard or proof that touches some members of a set silently leaves the rest as they were, and the member nobody listed is the one that breaks. Name the set, list it from its source — the type, the schema, the catalogue, the directory, the enum — rather than from the change in front of you, then decide every member explicitly in the code and in a test; give every start condition a matching end; and ask a reviewer which member is not covered rather than whether the change is right. Triggers when resetting, clearing, migrating, widening or tearing down state; when handling a kind, type, status, mode or variant and the handler mentions some of them; when writing a guard, filter or visibility rule over a set of statuses; when a feature has more than one anchor, leg, write or exit path; and whenever the words "and the others", "etc", "the main case" or "the normal path" appear. Does not fire on the places a single fact is duplicated (blast-radius-grep) or on the ordering of external events (unordered-events).
---

# Enumerate the set

Eight failures, one shape: somebody changed, reset, guarded or proved *some* members of a set
and the rest kept their old behaviour without saying so. An episode reset named four fields
and left the event cursor pointing into the previous episode. A handover step consumed the
pending wait request, because only the normal step kind had been tested. A visibility rule
listed the statuses it would show and missed one, so work in that status became invisible. Two
accounting anchors each closed honestly and the general-ledger leg was never written at all,
so client money was absent from every accounting report. A relay supervisor was proven on its
clean exit and on no other.

The set was always knowable. It was in a type, an enum, a schema, a directory listing, a state
diagram — somewhere a program could have printed it. In each case it was taken instead from
the change under the author's nose, which contains exactly the members that happened to come
to mind.

## The rules

1. **Name the set out loud before you touch it.** "The fields of the episode state file."
   "The step kinds." "The statuses a writer can produce." "The exit paths of this supervisor."
   "The accounting legs of a receipt." "The anchors over this feature." If you cannot name the
   set in one phrase, you do not yet know what you are changing, and the member you have not
   thought of is already excluded.
2. **List it from its source, never from the change.** Read the enum, the type, the schema,
   the catalogue, the directory, the switch statement — and prefer a listing a command
   produces to one you typed. A list assembled from the diff in front of you reproduces the
   diff's blind spot. Where the source is a hand-kept list, that list's own omissions are the
   risk (`prove-it-can-pass` rule 6).
3. **Decide every member explicitly, including the ones you are leaving alone.** "Unchanged"
   is a decision and is recorded as one, in a comment or a table, so the next reader can tell
   a considered exclusion from an oversight. An exhaustive `switch` with no default, a
   discriminated union the compiler checks, or a test parameterised over the listed set turns
   the decision into something a build can enforce (`enforce-invariants-in-build`).
4. **Every member gets a case, not just the representative one.** A test over the normal step
   kind proves the normal step kind. The handover step was the one that broke. Parameterise
   over the enumerated set so that adding a member to the source makes the suite demand a case
   — the only arrangement where the next member added cannot be forgotten. Library 44 is this
   rule inside a single test: a can-fail proof on one alternative of a pattern says nothing
   about the pattern's other alternatives.
5. **A start names its end, and an open names its close.** Anything that begins a state — a
   fight start, a lock, a tuning override, an episode, a held resource — is written together
   with the condition that ends it, and the end is tested. Mod-settings tuning outlived its
   colony and a fight start was widened with no matching end: both are a set of size two with
   one member written.
6. **Every leg of a multi-leg write is a member.** A transaction with two sides, an action
   with a ledger entry, a status change with an audit row: the set is the legs, and a leg that
   is never written fails silently because each individual step reports success. Where money
   is involved this is the expensive one — two anchors closed honestly while the general-ledger
   leg was never written, and client money was absent from every accounting report.
7. **Exit paths are a set.** Clean exit, error exit, timeout, kill, parent death, restart. A
   supervisor, teardown, cleanup handler or `finally` block proven on the clean path is proven
   on one member of six. List the paths and drive each one.
8. **Two constraints over the same set must be read together.** A pair of rules can each be
   reasonable and jointly permit nothing: two sound constraints whose permitted transitions do
   not intersect meant the documented reversal could not be made by anybody. When a second
   constraint is added over a set the first already governs, compute the intersection and
   check the operations you intend are still in it.
9. **Ask a reviewer the enumerating question.** "Is this right?" invites a reader to check the
   members in front of them. "Which member of this set is not covered?" forces them to fetch
   the set. Give them the set's source in the request, and the same question works on
   yourself.

## Relationship to the neighbouring skills

`blast-radius-grep` enumerates the *places* one fact lives; this skill enumerates the
*members* one change must decide. `unordered-events` enumerates (event, state) pairs for
external signals and explicitly excludes in-process calls; this skill covers the in-process
sets it leaves out — fields, kinds, statuses, legs, exit paths, anchors, constraints.
`prove-it-can-pass` rule 6 is this rule applied to a gate's own curated configuration.
`enforce-invariants-in-build` is how a decision over a set stops being prose.

## Provenance

Rimagent 2026-10-04 (an episode reset named four fields and kept the event cursor), 2026-10-12
(a handover step consumed the pending wait request; only the normal step kind was tested),
2026-10-13 twice (a fight start widened with no matching end; a visibility rule listed the
statuses it showed and missed `between_steps`), 2026-10-16 (mod-settings tuning outlived its
colony). PropOS 2026-09-21 (two anchors each closed honestly and the general-ledger leg was
never written, so client money was absent from every accounting report), 2026-09-21 (two sound
constraints whose permitted transitions do not intersect, so the documented reversal cannot be
made), 2026-09-28 (a relay supervisor proven on its clean exit only). Library 44 is the same
shape inside a test and stays a `prove-it-can-fail` row rather than being duplicated here.
`docs/SKILL_PROPOSALS_2026-11-01.md`, Tier 1 item 2, admitted by Ben 2026-11-05. The PropOS
instances are summarised as that document records them; the originals are in that repository's
own lessons file and were not read for this build.
