#!/usr/bin/env node
// Proves secret-echo-guard.mjs denies the shapes that print a secret value AND stays
// silent on the safe forms it recommends (prove-it-can-fail: a gate that denies the
// presence-and-length form it prescribes trains bypass; one that misses the two real
// incidents is theatre). Feeds crafted PreToolUse payloads on stdin and asserts the
// decision, the rule named in the reason, and that the reason carries the safe form.
// The two incident commands (18 and 19 September 2026) are the first two deny cases.
// Run: node hooks/secret-echo-guard.test.mjs
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'secret-echo-guard.mjs');

const DENY = [
  // The 19 September incident: a loop over names with an indirect fallback expansion.
  { rule: 1, cmd: 'for v in SUPABASE_ACCESS_TOKEN SUPABASE_SERVICE_ROLE_KEY; do echo "$v=${!v:-unset}"; done' },
  // The 18 September incident: the bare status table prints the stack's keys.
  { rule: 5, cmd: 'npx supabase status' },
  { rule: 1, cmd: 'echo "SUPABASE_ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN:-unset}"' },
  { rule: 1, cmd: "printf '%s\\n' \"${SUPABASE_SERVICE_ROLE_KEY:-}\"" },
  { rule: 1, cmd: 'echo "${STRIPE_SECRET_KEY:+$STRIPE_SECRET_KEY}"' },
  { rule: 2, cmd: 'echo $ANTHROPIC_API_KEY' },
  { rule: 2, cmd: 'echo "${NETLIFY_TOKEN:0:8}..."' },
  { rule: 2, cmd: 'echo "key: $RESEND_API_KEY" | tee log.txt' },
  { rule: 2, tool: 'PowerShell', cmd: 'Write-Host "key: $env:RESEND_API_KEY"' },
  { rule: 2, tool: 'PowerShell', cmd: '$env:ADMIN_SECRET' },
  { rule: 2, tool: 'PowerShell', cmd: '"token is $env:NETLIFY_TOKEN"' },
  { rule: 2, cmd: "node -e 'console.log(process.env.SUPABASE_SERVICE_ROLE_KEY)'" },
  { rule: 2, cmd: 'node -e "console.log(process.env[\'STRIPE_WEBHOOK_SECRET\'])"' },
  { rule: 2, cmd: "python -c \"import os; print(os.environ['STRIPE_SECRET_KEY'])\"" },
  { rule: 2, cmd: 'cat <<EOF\nanthropic=$ANTHROPIC_API_KEY\nEOF' },
  { rule: 4, cmd: 'echo "$(cat .env)"' },
  { rule: 3, cmd: 'env | grep SUPABASE' },
  { rule: 3, cmd: 'printenv' },
  { rule: 3, cmd: 'printenv SUPABASE_ACCESS_TOKEN' },
  { rule: 3, cmd: 'declare -p SUPABASE_ACCESS_TOKEN' },
  { rule: 3, cmd: 'export -p | grep -i supabase' },
  { rule: 3, cmd: 'cmd /c set' },
  { rule: 3, tool: 'PowerShell', cmd: 'Get-ChildItem Env:' },
  { rule: 3, tool: 'PowerShell', cmd: 'gci env:SUPABASE*' },
  { rule: 3, tool: 'PowerShell', cmd: 'Get-Item Env:SUPABASE_SERVICE_ROLE_KEY' },
  { rule: 3, tool: 'PowerShell', cmd: '[Environment]::GetEnvironmentVariable("SUPABASE_ACCESS_TOKEN")' },
  { rule: 3, tool: 'PowerShell', cmd: '[System.Environment]::GetEnvironmentVariables()' },
  { rule: 4, cmd: 'cat .env' },
  { rule: 4, cmd: 'head -20 ../.env' },
  { rule: 4, tool: 'PowerShell', cmd: 'Get-Content .env.local' },
  { rule: 4, tool: 'PowerShell', cmd: 'type C:\\Users\\bengr\\Projects\\ICC\\icc-site\\.env' },
  { rule: 4, cmd: 'grep SUPABASE .env' },
  { rule: 4, cmd: 'grep -n KEY ../.env' },
  { rule: 4, cmd: "grep -o 'SUPABASE_SERVICE_ROLE_KEY=.*' .env" },
  { rule: 5, cmd: 'npx supabase status -o env' },
  { rule: 5, cmd: 'supabase status | head -5' },
  { rule: 6, cmd: 'curl -v -H "Authorization: Bearer $NETLIFY_TOKEN" https://api.netlify.com/api/v1/sites' },
  { rule: 6, cmd: 'curl -sSv https://x.supabase.co/rest/v1/jobs -H "apikey: $KEY"' },
  // A shell wrapper executes its string, so the inside is a command, not text.
  { rule: 4, cmd: 'bash -c "cat .env"' },
  { rule: 2, tool: 'PowerShell', cmd: 'powershell -Command "Write-Host $env:NETLIFY_TOKEN"' },
  { rule: 3, cmd: "sh -c 'env | grep SUPABASE'" },
];

const ALLOW = [
  // The presence-and-length form the reason prescribes (used in this library's own sessions).
  'if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then echo "SUPABASE_ACCESS_TOKEN set (${#SUPABASE_ACCESS_TOKEN} chars)"; else echo "SUPABASE_ACCESS_TOKEN unset"; fi',
  '[ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "set (${#SUPABASE_SERVICE_ROLE_KEY} chars)"',
  'test -z "$ANTHROPIC_API_KEY" && echo "ANTHROPIC_API_KEY missing"',
  'echo "${SUPABASE_ACCESS_TOKEN:+set}"',
  { tool: 'PowerShell', cmd: 'if ($env:SUPABASE_ACCESS_TOKEN) { "set ($($env:SUPABASE_ACCESS_TOKEN.Length) chars)" } else { "unset" }' },
  { tool: 'PowerShell', cmd: '[string]::IsNullOrEmpty($env:NETLIFY_TOKEN)' },
  { tool: 'PowerShell', cmd: '$env:ICC_HOSTED_IT = "1"; node --test test/hosted-auth-settings.test.js; Remove-Item Env:ICC_HOSTED_IT' },
  // Names, not values.
  'env | cut -d= -f1 | grep SUPABASE',
  'printenv | sort | cut -d= -f1',
  "env | awk -F= '{print $1}' | grep -i key",
  { tool: 'PowerShell', cmd: "Get-ChildItem Env: | Where-Object Name -like 'SUPABASE*' | Select-Object Name" },
  { tool: 'PowerShell', cmd: 'gci env: | select -ExpandProperty Name' },
  'compgen -v | grep SUPABASE',
  // .env by its keys, and the documentation variants.
  'cut -d= -f1 .env',
  "grep -o '^[A-Z_]*=' .env",
  'grep -c SUPABASE .env',
  'grep -q SUPABASE_URL .env && echo present',
  'cat .env.example',
  { tool: 'PowerShell', cmd: 'Get-Content .env.template' },
  'git check-ignore .env',
  'ls -la .env',
  'cp .env .env.bak',
  'export $(cat .env | xargs)',
  'set -a; . ./.env; set +a',
  // supabase status captured, not printed.
  'eval "$(npx supabase status -o env)"',
  'npx supabase status -o env > "$TMP/status.env"',
  "npx supabase status | grep -viE 'key|secret|token|jwt'",
  // A secret USED is not a secret PRINTED.
  'curl -sS -H "Authorization: Bearer $NETLIFY_TOKEN" https://api.netlify.com/api/v1/sites',
  'SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=$LOCAL_SERVICE_KEY node scripts/erase-job.js abc',
  'export STRIPE_SECRET_KEY=$(cat "$TMP/stripe.key")',
  "node -e 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY; console.log(\"HTTP\", 200)'",
  'node scripts/supabase-auth-config.mjs --apply --disable-signups',
  // Not secrets.
  'echo "SUPABASE_URL=$SUPABASE_URL"',
  'echo "anon: $SUPABASE_ANON_KEY"',
  'echo "$SSH_AUTH_SOCK"',
  'printenv PATH',
  { tool: 'PowerShell', cmd: 'Get-Item Env:PATH' },
  'echo "token: ${#NETLIFY_TOKEN} chars"',
  // Ordinary work that merely mentions the words (the first is the commit that the hook
  // itself denied on its first live run: prose in a heredoc written to a message file).
  "cat > \"$SCR/msg.txt\" <<'EOF'\nfeat(hooks): a bare supabase status and cat .env are denied; curl -v with Authorization too\n\necho $KEY is the shape.\nEOF\ngit add -A && git commit -q -F \"$SCR/msg.txt\"",
  'git commit -m "docs: cat .env is denied; npx supabase status too; env | grep KEY as well"',
  'echo "run npx supabase status yourself, then cat .env"',
  'grep -rn "supabase status" hooks/',
  'set -euo pipefail',
  'env NODE_ENV=test node --test',
  'git commit -m "docs: never echo a TOKEN or KEY value"',
  'grep -rn "sb_secret_" --include=*.md .',
  'echo done',
  'npm run build --prefix site',
];

function run(stdin) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [HOOK], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (c) => (out += c));
    p.on('close', (code) => resolve({ out, code }));
    p.stdin.end(stdin);
  });
}

let fails = 0;
function report(ok, label, why) {
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : ` (${why})`}`);
}

for (const c of DENY) {
  const evt = { tool_name: c.tool ?? 'Bash', cwd: 'C:/work', tool_input: { command: c.cmd } };
  const { out, code } = await run(JSON.stringify(evt));
  const o = out ? JSON.parse(out).hookSpecificOutput : null;
  const why = [];
  if (code !== 0) why.push(`exit=${code}`);
  if (!o || o.permissionDecision !== 'deny') why.push(`decision=${o?.permissionDecision ?? 'none'}`);
  const reason = o?.permissionDecisionReason ?? '';
  if (!reason.startsWith(`secret-echo-guard (rule ${c.rule}):`)) why.push(`rule mismatch: ${reason.slice(0, 40)}`);
  if (!reason.includes('${#X}')) why.push('reason lacks the safe form');
  report(why.length === 0, `deny   | ${c.cmd.replace(/\n/g, '\\n')}`, why.join(', '));
}

for (const a of ALLOW) {
  const c = typeof a === 'string' ? { cmd: a } : a;
  const evt = { tool_name: c.tool ?? 'Bash', cwd: 'C:/work', tool_input: { command: c.cmd } };
  const { out, code } = await run(JSON.stringify(evt));
  const why = [];
  if (code !== 0) why.push(`exit=${code}`);
  if (out !== '') why.push(`emitted ${out.slice(0, 80)}`);
  report(why.length === 0, `silent | ${c.cmd}`, why.join(', '));
}

// The Read tool: a .env file is denied, its documentation variant is not.
{
  const d = await run(JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'C:/Users/bengr/Projects/ICC/icc-site/.env' } }));
  const o = d.out ? JSON.parse(d.out).hookSpecificOutput : null;
  report(d.code === 0 && o?.permissionDecision === 'deny' && o.permissionDecisionReason.startsWith('secret-echo-guard (rule Read):'), 'deny   | Read .env', `decision=${o?.permissionDecision ?? 'none'}`);
  const a = await run(JSON.stringify({ tool_name: 'Read', tool_input: { file_path: '/repo/.env.example' } }));
  report(a.code === 0 && a.out === '', 'silent | Read .env.example', `emitted ${a.out.slice(0, 60)}`);
}

// Fail-open: garbage on stdin exits 0 and says nothing.
{
  const g = await run('not json at all');
  report(g.code === 0 && g.out === '', 'silent | malformed stdin exits 0 silently', `exit=${g.code} out=${g.out.slice(0, 40)}`);
}

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
