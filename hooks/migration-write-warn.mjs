#!/usr/bin/env node
// PreToolUse hook, matcher: Write|Edit. db-migration-verification,
// live-state-first, prove-it-can-fail and enforce-invariants-in-build,
// mechanised at the one moment all four fire: the instant a .sql migration is
// written. Three misses on 2026-07-28 clustered on exactly this moment.
// (1) A guard whose predicate was derived from the bug narrative rather than
// from the actual write, so it could never go red. (2) A migration reviewed
// carefully but never executed before being handed to a production console.
// (3) A premise about the target environment (role attributes, ownership,
// which branch of a shared predicate fires) never probed, so a correct-looking
// guard would have broken a live table. An earlier fourth: a view comment
// stated an allocation rule that nothing enforced, which is why rule 2 exists.
// The moment has no trigger vocabulary for a description to match on (a .sql
// file mentions none of testing, staleness, or verification) but it has a
// perfect deterministic signature: the file path. Warn-only, never blocks
// (ratified R-21: only the push gate blocks; an over-firing hook trains
// bypass). Fail-open: exits 0 on any parse error, and the skills plus their
// norms remain the backstop.

// Rule 1: a migrations directory carrying a .sql file. Deliberately generic
// across repos (supabase/migrations, db/migrations, prisma/migrations), so it
// keys on the path SEGMENT, either slash, either case. "migrations" must be
// followed by a separator, so MIGRATIONS.md and migrations_old/ do not match.
const MIGRATION_PATH = /(^|[\\/])migrations[\\/].*\.sql$/i;

// Rule 2, evaluated only once rule 1 has matched: an invariant asserted in
// prose inside SQL comment syntax. Three shapes carry it. The COMMENT ON
// literal is the worst of them, because it ships to the catalog and still
// reads as official long after the writer has gone.
const COMMENT_SHAPES = [
  /--[^\n]*/g,
  /\/\*[\s\S]*?\*\//g,
  /\bCOMMENT\s+ON\b[\s\S]*?'[\s\S]*?'/gi,
];
const INVARIANT_PROSE =
  /\b(single source of truth|source of truth|must match|must stay in sync|must never|never auto|authoritative)\b/i;

const MESSAGE = [
  'migration-write-warn: this payload is a SQL migration.',
  'Derive every guard predicate from the write it polices, tracing OLD versus NEW to the columns actually changed: a predicate inherited from the bug narrative ships a check that cannot go red.',
  'Probe the target for every environmental premise the change leans on (role attributes, ownership, ACLs, which branch of a shared predicate fires), and read raw inputs rather than verdicts.',
  'Execute it against a throwaway container matched to the live major version BEFORE handing it to a production console.',
  'Ship the catalog-verification query alongside.',
].join(' ');

const INVARIANT_SUFFIX =
  ' This payload also asserts an invariant in a comment: a rule asserted only in a comment is prose, not a control, so back it with a constraint, trigger, or test that can demonstrably go red.';

// The written text, across the shapes the edit tools use.
function payload(input) {
  if (!input) return '';
  const parts = [input.content, input.new_string];
  if (Array.isArray(input.edits)) parts.push(...input.edits.map((e) => e?.new_string));
  return parts.filter((p) => typeof p === 'string').join('\n');
}

// Only the commented spans, so a constraint literally named must_match_check
// does not read as a prose assertion.
function comments(text) {
  return COMMENT_SHAPES.flatMap((re) => text.match(re) ?? []).join('\n');
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw);
    const path = evt.tool_input?.file_path ?? '';
    if (MIGRATION_PATH.test(path)) {
      const message = INVARIANT_PROSE.test(comments(payload(evt.tool_input)))
        ? MESSAGE + INVARIANT_SUFFIX
        : MESSAGE;
      process.stdout.write(
        JSON.stringify({
          systemMessage: message,
          hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: message },
        }),
      );
    }
  } catch {}
  process.exit(0);
});
