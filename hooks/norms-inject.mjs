#!/usr/bin/env node
// SessionStart hook (plugin install only). Injects the Layer 1 norm block from
// NORMS.md as session context, so plugin machines get the always-on norms with
// zero manual CLAUDE.md editing — and NORMS.md stays the single source (R-20).
// Direct-clone machines use the copied CLAUDE.md block instead and do NOT wire
// this hook (see HOOKS.md). Fail-open: any error yields no context.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

try {
  const here = dirname(fileURLToPath(import.meta.url));
  const norms = readFileSync(join(here, '..', 'NORMS.md'), 'utf8');
  const m = norms.match(/<!-- BEGIN CLAUDE-SKILLS NORMS[^>]*-->([\s\S]*?)<!-- END CLAUDE-SKILLS NORMS/);
  if (m) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: m[1].trim(),
        },
      }),
    );
  }
} catch {}
process.exit(0);
