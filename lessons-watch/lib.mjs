// Shared by count.mjs and mirror.mjs. Node stdlib only, no network, no model.

// The misses-log line a lessons entry closes with when no skill covered it:
//   "skill that should have prevented this: none - new candidate"
// Real files do not keep to that. Measured over 19 files on 2026-11-14: "none, new
// candidate", "none for (1) and (2), new candidate", a wrapped "New candidate: <slug>."
// on its own line, and en or em dashes. A pattern tied to "none - " missed 9 of 160,
// so the two words alone are the match. That can count a sentence of prose that happens
// to say "new candidate"; overstating by one is the safe direction for a number whose
// only job is to say a sweep is due.
const CANDIDATE = /\bnew candidate\b/i;
// A quoted template ("<name> / none - new candidate") is an instruction, not an entry.
const TEMPLATE = /<[a-z][a-z -]*>\s*\/\s*none/i;

export function countCandidates(text) {
  let n = 0;
  for (const line of String(text).split(/\r?\n/)) {
    if (CANDIDATE.test(line) && !TEMPLATE.test(line)) n++;
  }
  return n;
}

// Value-shaped secrets. A lessons file quotes errors, commands and paths, and now and
// then a token someone pasted while debugging. mirror.mjs refuses to copy a file that
// matches any of these, and reports the pattern's NAME, never the matched text.
const SECRET_SHAPES = [
  ['github-token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['github-fine-grained-token', /\bgithub_pat_[A-Za-z0-9_]{40,}\b/],
  ['api-key-sk', /\bsk-(?:ant-|proj-|or-)?[A-Za-z0-9_-]{32,}\b/],
  ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/],
  ['slack-token', /\bxox[abprs]-[A-Za-z0-9-]{20,}\b/],
  ['private-key-block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['jwt', /\beyJ[A-Za-z0-9_-]{16,}\.eyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/],
  ['supabase-token', /\bsb[ps]_[A-Za-z0-9]{36,}\b/],
  ['stripe-live-key', /\b[sr]k_live_[A-Za-z0-9]{20,}\b/],
  ['stripe-webhook-secret', /\bwhsec_[A-Za-z0-9]{24,}\b/],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['resend-key', /\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}\b/],
];

// Returns the names of every shape found, empty when the text is clean.
export function scanSecrets(text) {
  const s = String(text);
  return SECRET_SHAPES.filter(([, re]) => re.test(s)).map(([name]) => name);
}

export const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
