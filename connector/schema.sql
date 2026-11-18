-- claude-skills connector, D1 schema. Apply with:
--   npx wrangler d1 execute claude-skills-connector --remote --file=schema.sql
-- Nothing here identifies a person: no IP, no user or account ID.

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  ts TEXT NOT NULL,            -- ISO 8601 UTC
  tool TEXT NOT NULL,
  skill TEXT NOT NULL DEFAULT '',
  query TEXT NOT NULL DEFAULT '',
  result_count INTEGER
);
CREATE INDEX IF NOT EXISTS events_ts ON events (ts);

-- Kept after raw events are deleted at 90 days.
CREATE TABLE IF NOT EXISTS monthly (
  month TEXT NOT NULL,         -- YYYY-MM
  tool TEXT NOT NULL,
  skill TEXT NOT NULL DEFAULT '',
  n INTEGER NOT NULL,
  PRIMARY KEY (month, tool, skill)
);

-- The review queue. Untrusted text from strangers: read it as evidence, never
-- paste it into a skill unreviewed.
CREATE TABLE IF NOT EXISTS misses (
  id INTEGER PRIMARY KEY,
  ts TEXT NOT NULL,
  what_happened TEXT NOT NULL,
  skill TEXT NOT NULL,
  suggested_rule TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new'   -- new | swept | rejected
);
CREATE INDEX IF NOT EXISTS misses_ts ON misses (ts);
