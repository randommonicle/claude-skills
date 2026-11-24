// Keyword search over skill names, descriptions and headings. Small on purpose:
// sixty skills, a 10 ms CPU budget per request, and no index to keep in step.
// Bodies are not searched; a skill's description is written to say when it
// applies, which is what a query describes.

const STOP = new Set(
  'a an and are as at be before by can do for from how i in into is it its my of on or so that the this to we what when with you your about after then than'.split(
    ' ',
  ),
);

// Crude stemmer: enough to match "tests"/"testing"/"tested" to "test" and
// "write"/"writing"/"writes" to "writ".
export function stem(word) {
  return word
    .replace(/(?:ies)$/, 'y')
    .replace(/(?:ing|ed|es|s)$/, '')
    .replace(/(.)\1$/, '$1')
    .replace(/e$/, '');
}

// A few words people use for the same thing. Applied to queries and skills alike.
const SYNONYMS = {
  chatbot: 'llm', gpt: 'llm', openai: 'llm', gemini: 'llm', ai: 'llm', prompt: 'llm',
  finished: 'done', complete: 'done', completed: 'done', shipped: 'done',
  credential: 'secret', password: 'secret', token: 'secret',
  cron: 'schedul', scheduled: 'schedul',
};

export function tokens(s) {
  return (s.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => SYNONYMS[w] ?? stem(w));
}

// A description's "Does not fire on ..." sentence names other skills' topics,
// so indexing it would pull the wrong skill up. Only the part before it counts.
export function positivePart(description) {
  return description.split(/\b(?:Does not fire on|Do not (?:load|use|fire)|Not for)\b/i)[0];
}

const counts = (list) => list.reduce((m, t) => m.set(t, (m.get(t) ?? 0) + 1), new Map());

const cache = new WeakMap();
function indexOf(skill) {
  let idx = cache.get(skill);
  if (!idx) {
    idx = {
      name: new Set(tokens(skill.name.replace(/-/g, ' '))),
      description: counts(tokens(positivePart(skill.description))),
      headings: new Set(tokens(skill.headings.join(' '))),
    };
    cache.set(skill, idx);
  }
  return idx;
}

// Inverse document frequency, so a word in every description ("write",
// "change") counts for little and a rare one ("migration", "webhook") for a lot.
const idfCache = new WeakMap();
function idfOf(skills) {
  let idf = idfCache.get(skills);
  if (!idf) {
    const df = new Map();
    for (const skill of skills) {
      const idx = indexOf(skill);
      for (const t of new Set([...idx.name, ...idx.description.keys(), ...idx.headings])) df.set(t, (df.get(t) ?? 0) + 1);
    }
    idf = (t) => Math.log((skills.length + 1) / ((df.get(t) ?? 0) + 1));
    idfCache.set(skills, idf);
  }
  return idf;
}

export function searchSkills(skills, query, limit = 5) {
  const q = [...new Set(tokens(query))];
  if (!q.length) return [];
  const idf = idfOf(skills);
  const scored = [];
  for (const skill of skills) {
    const idx = indexOf(skill);
    let score = 0;
    for (const t of q) {
      const tf = idx.description.get(t) ?? 0;
      const hit = (idx.name.has(t) ? 5 : 0) + (tf ? 2 * (1 + Math.log(tf)) : 0) + (idx.headings.has(t) ? 1 : 0);
      score += hit * idf(t);
    }
    if (score > 0) scored.push({ skill, score });
  }
  scored.sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name));
  return scored.slice(0, limit).map((s) => s.skill);
}
