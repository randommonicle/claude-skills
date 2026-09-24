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
  // Found by the cross-agent review (GPT via codex, 20 Sept 2026, round 1): each was
  // silent before the rewrite. Sinks that select or expose values:
  { rule: 3, cmd: "env | awk -F= '{print $2}'" },
  { rule: 4, cmd: "cat .env | awk -F= '{print $2}'" },
  { rule: 4, cmd: "grep -o '[^=]*$' .env" },
  { rule: 3, cmd: 'env | cut -d= -f1-' },
  { rule: 3, tool: 'PowerShell', cmd: 'Get-ChildItem Env: | Select-Object Name,Value' },
  { rule: 3, cmd: 'env | tee /dev/stderr | cut -d= -f1' },
  { rule: 5, cmd: 'npx supabase status | tee /dev/stderr | cut -d= -f1' },
  // One safe occurrence must not excuse an unsafe one of the same name:
  { rule: 2, cmd: 'echo "${#NETLIFY_TOKEN}:$NETLIFY_TOKEN"' },
  { rule: 2, tool: 'PowerShell', cmd: 'Write-Host "$($env:NETLIFY_TOKEN.Length) $env:NETLIFY_TOKEN"' },
  // Other output primitives and reference syntaxes:
  { rule: 2, cmd: 'node -e "process.stdout.write(process.env.ANTHROPIC_API_KEY)"' },
  { rule: 2, cmd: "python -c \"import os,sys; sys.stdout.write(os.getenv('STRIPE_SECRET_KEY'))\"" },
  { rule: 2, cmd: 'base64 <<< "$ANTHROPIC_API_KEY"' },
  { rule: 2, cmd: 'tee /dev/stderr <<< "$ANTHROPIC_API_KEY"' },
  { rule: 2, tool: 'PowerShell', cmd: '$env:NETLIFY_TOKEN | Out-String' },
  { rule: 2, tool: 'PowerShell', cmd: 'Write-Verbose $env:NETLIFY_TOKEN -Verbose' },
  { rule: 3, tool: 'PowerShell', cmd: 'Get-Variable -Name NETLIFY_TOKEN -ValueOnly' },
  { rule: 2, tool: 'PowerShell', cmd: 'Write-Output ${env:NETLIFY_TOKEN}' },
  { rule: 1, cmd: 'for v in SUPABASE_ACCESS_TOKEN SUPABASE_SERVICE_ROLE_KEY; do echo "${!v}"; done' },
  // Listing variants:
  { rule: 3, cmd: 'env -0' },
  { rule: 3, cmd: 'printenv -0' },
  { rule: 3, tool: 'PowerShell', cmd: 'Get-ChildItem Env:\\' },
  { rule: 3, tool: 'PowerShell', cmd: 'Get-ChildItem Env:/' },
  { rule: 3, cmd: 'cat /proc/self/environ' },
  { rule: 3, tool: 'PowerShell', cmd: "[Environment]::GetEnvironmentVariable('NETLIFY_TOKEN','User')" },
  // Names the first classifier missed:
  { rule: 2, cmd: 'echo "$PGPASSWORD"' },
  { rule: 2, cmd: 'echo "$GH_PAT"' },
  { rule: 2, cmd: 'echo "$STRIPE_SK"' },
  { rule: 2, cmd: 'echo "$SUPABASE_SERVICE_ROLE"' },
  // A stderr redirect or an unrelated substitution is not a capture:
  { rule: 5, cmd: 'npx supabase status 2>err.txt' },
  { rule: 5, cmd: 'npx supabase status --workdir "$(pwd)"' },
  { rule: 2, cmd: 'cat <<EOF 2>/dev/null\n$ANTHROPIC_API_KEY\nEOF' },
  { rule: 2, cmd: 'tee /dev/stderr <<EOF\n$ANTHROPIC_API_KEY\nEOF' },
  // Secret files: case, wrappers, other names:
  { rule: 4, tool: 'PowerShell', cmd: 'type .ENV' },
  { rule: 4, cmd: 'xargs cat .env' },
  { rule: 4, cmd: 'find . -name .env -exec cat {} \\;' },
  { rule: 4, cmd: 'cat .envrc' },
  { rule: 4, cmd: 'cat ~/.ssh/id_rsa' },
  { rule: 4, cmd: 'cat service-account-prod.json' },
  // Tracing prints the expanded command:
  { rule: 2, cmd: 'set -x; curl -H "Authorization: Bearer $NETLIFY_TOKEN" https://example.invalid' },
  { rule: 2, cmd: "bash -x -c 'curl -H \"Authorization: Bearer $NETLIFY_TOKEN\" https://example.invalid'" },
  // A double quote inside single quotes must not flip the parser's quote state:
  { rule: 5, cmd: "printf '\"'; npx supabase status" },
  // The provider class beyond supabase:
  { rule: 5, cmd: 'aws ssm get-parameter --name /prod/db --with-decryption --query Parameter.Value --output text' },
  { rule: 5, cmd: 'az keyvault secret show --vault-name v --name n' },
  { rule: 5, cmd: 'netlify env:list' },
  // Round 2 of the same review. A printed string that merely looks like a test:
  { rule: 2, cmd: 'echo [ -n "$NETLIFY_TOKEN"' },
  { rule: 2, cmd: 'echo "$NETLIFY_TOKEN -eq nope"' },
  { rule: 2, tool: 'PowerShell', cmd: 'Write-Output "IsNullOrEmpty($env:NETLIFY_TOKEN)"' },
  // A provider inside a printed substitution, a process substitution, eval:
  { rule: 5, cmd: 'echo "$(npx supabase status)"' },
  { rule: 5, cmd: 'echo `npx supabase status`' },
  { rule: 5, cmd: 'cat <(npx supabase status)' },
  { rule: 5, cmd: 'eval "npx supabase status"' },
  // Wrappers:
  { rule: 3, cmd: 'cmd /c "set"' },
  { rule: 4, cmd: 'cmd /c "type .env"' },
  { rule: 3, tool: 'PowerShell', cmd: 'Invoke-Expression "Get-ChildItem Env:"' },
  { rule: 4, cmd: 'eval "cat .env"' },
  { rule: 4, cmd: "sudo sh -c 'cat .env'" },
  { rule: 4, cmd: "env FOO=1 bash -c 'cat .env'" },
  // Redirects read left to right: a later >&2 undoes the capture.
  { rule: 5, cmd: 'npx supabase status >status.txt 1>&2' },
  { rule: 2, cmd: 'cat <<EOF >status.txt 1>&2\n$ANTHROPIC_API_KEY\nEOF' },
  // Call printers: a `)` inside a string, an expanding script string, optional chaining.
  { rule: 2, cmd: "node -e 'console.log(\")\", process.env.ANTHROPIC_API_KEY)'" },
  { rule: 2, cmd: "node -e \"console.log('$ANTHROPIC_API_KEY')\"" },
  { rule: 2, cmd: "python -c \"print('$ANTHROPIC_API_KEY')\"" },
  { rule: 2, cmd: "node -e 'console.log(process.env?.ANTHROPIC_API_KEY)'" },
  // Sinks and filters that still pass values:
  { rule: 3, tool: 'PowerShell', cmd: 'Get-ChildItem Env: | ForEach-Object { $_.Name, $_.Value }' },
  { rule: 5, cmd: 'aws ssm get-parameter --name /prod/db --with-decryption --query Parameter.Value --output text | grep -v token' },
  // PowerShell here-string and backtick escape:
  { rule: 2, tool: 'PowerShell', cmd: '@"\n$env:NETLIFY_TOKEN\n"@' },
  { rule: 5, tool: 'PowerShell', cmd: 'Write-Output "`""; npx supabase status' },
  { rule: 2, cmd: "bash -xc 'echo \"$ANTHROPIC_API_KEY\"'" },
  // Other readers and encoders of a secret file:
  { rule: 4, cmd: "sed -n 'p' .env" },
  { rule: 4, cmd: "awk '1' .env" },
  { rule: 4, cmd: 'base64 .env' },
  { rule: 4, cmd: 'jq . credentials.json' },
  { rule: 4, cmd: 'cp .env /dev/stdout' },
  { rule: 5, cmd: 'npx supabase status >&2' },
  // Only a grep's PATTERN is exempt from the secret-file scan (24 September 2026). A secret
  // file as a file operand, an option's value, fed by xargs or a redirect, inside a pattern
  // that runs a command, or behind an option the parser does not know, stays denied.
  { rule: 4, cmd: 'grep KEY .env' },
  { rule: 4, cmd: 'grep -n "x" .env.local' },
  { rule: 4, cmd: 'grep -rn TOKEN config/app.env' },
  { rule: 4, cmd: 'cat .env | grep X' },
  { rule: 4, cmd: 'rg SECRET .env' },
  { rule: 4, tool: 'PowerShell', cmd: 'Select-String -Path .env -Pattern X' },
  { rule: 4, cmd: 'grep "process.env" .env' },
  { rule: 4, cmd: 'grep -e "process.env" .env' },
  { rule: 4, cmd: 'grep -- "process.env" .env' },
  { rule: 4, cmd: 'grep -r KEY --include=.env .' },
  { rule: 4, cmd: 'rg -g .env KEY' },
  { rule: 4, cmd: 'rg -T js KEY .env' },
  { rule: 4, cmd: 'grep -f .env app.log' },
  { rule: 4, cmd: 'grep -T KEY .env' },
  { rule: 4, cmd: 'grep -m 5 KEY .env' },
  { rule: 4, cmd: 'grep -5 KEY .env' },
  { rule: 4, cmd: 'grep -k KEY .env' },
  { rule: 4, cmd: 'grep "$(cat .env)" app.js' },
  { rule: 4, cmd: 'grep KEY < .env' },
  { rule: 4, cmd: 'find . -name .env | xargs grep KEY' },
  { rule: 4, cmd: 'grep -n rg .env' },
  { rule: 4, cmd: 'findstr KEY .env' },
  { rule: 4, tool: 'PowerShell', cmd: "Select-String -Path .env -Pattern 'process.env'" },
  { rule: 4, tool: 'PowerShell', cmd: 'Get-Content .env | Select-String KEY' },
  // Quiet flags count only on the grep's own segment, per tool (24 September 2026). Each of
  // these printed a secret file's lines and passed: a -c belonging to head, tr, cut or uniq
  // after the pipe read as grep's, rg -L follows symlinks, and a Select-String parameter
  // whose name happens to contain c, l or q read as a cluster of quiet flags.
  { rule: 4, cmd: 'grep KEY .env | head -c 500' },
  { rule: 4, cmd: "grep KEY .env | tr -cd '[:print:]'" },
  { rule: 4, cmd: 'grep KEY .env | cut -c 1-40' },
  { rule: 4, cmd: 'grep KEY .env | uniq -c' },
  { rule: 4, cmd: 'findstr KEY .env | head -c 50' },
  { rule: 4, cmd: 'rg -L KEY .env' },
  { rule: 4, cmd: 'grep -c x app.js | grep KEY .env' },
  { rule: 4, tool: 'PowerShell', cmd: 'Select-String -Path .env -Pattern KEY -AllMatches' },
  { rule: 4, tool: 'PowerShell', cmd: 'Select-String -Path .env -Pattern KEY -SimpleMatch' },
  { rule: 4, tool: 'PowerShell', cmd: 'Select-String -LiteralPath .env -Pattern KEY' },
  { rule: 4, tool: 'PowerShell', cmd: 'Select-String -Path .env -Pattern KEY -NotMatch' },
  { rule: 4, tool: 'PowerShell', cmd: 'Select-String -Path .env -Pattern KEY -Encoding utf8' },
  { rule: 4, tool: 'PowerShell', cmd: 'Select-String -Path .env -Pattern KEY -Quiet:$false' },
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
  // From the cross-agent review round 1: literals, assignments and quiet long options
  // that the first version denied.
  "printf -v copy '%s' \"$ANTHROPIC_API_KEY\"",
  "echo '$ANTHROPIC_API_KEY'",
  'echo "\\$ANTHROPIC_API_KEY"',
  "python -c 'print(\"$ANTHROPIC_API_KEY\")'",
  { tool: 'PowerShell', cmd: "Write-Output '$env:NETLIFY_TOKEN'" },
  "git commit -m 'docs: echo $ANTHROPIC_API_KEY would leak'",
  'git commit -m "docs: a; env | grep KEY; b"',
  'grep --quiet SUPABASE .env',
  'rg --count SUPABASE .env',
  'cat public.key',
  'curl -v https://example.invalid',
  'head README.md',
  { tool: 'PowerShell', cmd: 'type README.md' },
  'for v in A_KEY B_TOKEN; do echo "$v ${#v}"; done',
  // Round 2: captured, digested, projected or literal.
  'npx supabase status 1>status.txt',
  'cat .env >snapshot.txt',
  'grep KEY .env >matches.txt',
  "x=$(printf ')' | cat .env)",
  'x=`printf foo; npx supabase status`',
  'set -x; set +x; curl -H "Authorization: Bearer $NETLIFY_TOKEN" https://example.invalid',
  "printf '%s' \"$NETLIFY_TOKEN\" | sha256sum",
  "printf '%s' \"$NETLIFY_TOKEN\" | wc -c",
  { tool: 'PowerShell', cmd: 'Write-Output $env:NETLIFY_TOKEN | Measure-Object -Character' },
  'aws ssm get-parameter --name /prod/db --with-decryption --query Parameter.Name --output text',
  'netlify env:get PUBLIC_URL',
  'echo "${NETLIFY_TOKEN:+aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa}"',
  'echo ${NETLIFY_TOKEN:+safe;word}',
  "echo $'$ANTHROPIC_API_KEY'",
  'docker run -e NETLIFY_TOKEN="$NETLIFY_TOKEN" img',
  'set -euo pipefail',
  'env NODE_ENV=test node --test',
  'git commit -m "docs: never echo a TOKEN or KEY value"',
  'grep -rn "sb_secret_" --include=*.md .',
  'echo done',
  'npm run build --prefix site',
  // Four false positives from the ICC session of 20 September 2026, each denied as rule 4
  // although no value could reach the transcript. (a) a keys-only grep followed by
  // filters that read STDIN, not the file: a reader after a pipe is not reading the file;
  // (d) the same shape, `--env-file` loads the file into a child's environment and the
  // filters after the pipe read the child's output; (b) a count consumer inside a printed
  // substitution prints a number; (c) an escaped dot inside a quoted grep REGEX is not a
  // path (`\.env` after `|` or a quote is a pattern; after a path component it is Windows).
  "grep -oE '^[A-Z_]+=' ../../../.env | tr -d '=' | tr '\\n' ' '",
  'node --env-file="C:/Users/bengr/Projects/ICC/icc-site/.env" scripts/delete-booking.js --all 2>&1 | sed -E \'s/email=[^ ]*@/email=…@/\' | head -40',
  'echo "CR bytes: $(tr -cd \'\\r\' < ../../../.env | wc -c), lines: $(wc -l < ../../../.env)"',
  'sed -n 1,60p scripts/db-env.sh | grep -n "env\\|ENV\\|\\.env" | head -12',
  // The pattern is not a file (24 September 2026). Each was denied as rule 4: the grep's
  // pattern read as a file named `process.env`, or, with the dot escaped, as `.env` in a
  // folder named `process`. The first three are the live repro, a read-only search of
  // this suite; the fourth and fifth passed already and pin the repro's edges.
  'grep -n "process\\.env" f.test.mjs',
  'grep -n "process.env from" f.test.mjs',
  'grep -n "process\\.env from" f.test.mjs',
  'grep -n -c "process\\.env from" f.test.mjs',
  'grep -n "from process" f.test.mjs',
  'grep -rn "process.env" src/',
  'grep -rn --include=*.ts "process.env" .',
  'grep -e "process.env" -n app.js',
  "grep -n 'process.env' f.mjs",
  'grep -n process.env f.mjs',
  'grep -rn ".env" --include=*.js .',
  'cat app.js | grep "process.env"',
  'rg -n "process.env" src',
  'rg "process\\.env" src',
  'findstr /C:"process.env" app.js',
  { tool: 'PowerShell', cmd: "Select-String -Pattern 'process.env' -Path app.js" },
  { tool: 'PowerShell', cmd: "Select-String 'process.env' app.js" },
  // Options each tool's own --help lists, so the pattern after them is proven (checked
  // against GNU grep 3.0 and ripgrep 14.1.1): grep's -NUM context shorthand, a digit
  // inside a cluster, --binary, and rg's -. for hidden files.
  'grep -5 "process.env" f.mjs',
  'grep -n2 "process.env" f.mjs',
  'grep --binary "process.env" f.mjs',
  'rg -. "process.env" src',
  // Quiet by the grep's own flags, or feeding a grep that is quiet (24 September 2026).
  // Select-String -Quiet returns True or False; it was denied before.
  { tool: 'PowerShell', cmd: 'Select-String -Path .env -Pattern KEY -Quiet' },
  'grep KEY .env | grep -c x',
  'grep -l KEY .env',
  'rg -c KEY .env',
  'rg -lq KEY .env',
  'find . -name .env | xargs grep -c KEY',
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
