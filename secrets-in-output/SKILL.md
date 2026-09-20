---
name: secrets-in-output
description: Nothing that can carry a secret value may reach a tool result, because the transcript is a synced file re-sent on every turn. Check an env var by presence and length only, list names not values, read a .env file by its keys, capture provider status output and API responses into a variable and print a named allowlist, and dry-run the output shape on a dummy value first. Triggers on any command, script or API call that names an env var, a .env file, a key, token, password or secret, or a credential-carrying header. Does not fire on whether a changed value is live (env-change-verification) or on comparing a secret (constant-time-secret-compare).
---

# Secrets in output

Two slips in two days, both in the ICC repo, both by an agent doing routine checks. On 18 September
2026 a Sonnet verification agent ran a bare `npx supabase status` and the local stack's keys went
into its transcript. On 19 September the main session ran a loop over `SUPABASE_*` names with
`${!v:-unset}` to learn which were set, and the VALUES of an account-wide personal access token and
another project's service-role key landed in the Claude Code transcript (the local `~/.claude/projects`
JSONL and whatever the desktop app syncs). Nothing in the library covered it; the handover convention
"read the token into a shell variable without printing it" was prose. ICC LESSONS_LEARNED L-045.

The transcript is not a terminal that scrolls away. It is a file, it is synced, it is re-sent to the
model on every later turn, and it outlives the session. Anything that reaches a tool result reaches all
of that.

## The rules

1. **Presence and length, never the value.** The only question a check may answer is "is it set, and
   how long is it".

   ```bash
   [ -n "$SUPABASE_ACCESS_TOKEN" ] && echo "SUPABASE_ACCESS_TOKEN set (${#SUPABASE_ACCESS_TOKEN} chars)" || echo "unset"
   ```

   ```powershell
   if ($env:SUPABASE_ACCESS_TOKEN) { "set ($($env:SUPABASE_ACCESS_TOKEN.Length) chars)" } else { "unset" }
   ```

   Never a `:-` or `-` fallback on a secret (`${X:-unset}` prints X when it IS set, which is the case
   you were checking for), never `echo $X`, never a prefix (`${X:0:6}` is the value too).

2. **Names, not values, when listing.** `env | cut -d= -f1`, `compgen -v | grep SUPABASE`,
   `Get-ChildItem Env: | Select-Object Name`. A bare `env`, `printenv`, `set`, `export -p`,
   `declare -p`, `Get-ChildItem Env:` or `[Environment]::GetEnvironmentVariables()` prints every value
   on the machine, and piping it into `grep` prints the matching lines whole.

3. **A .env file by its keys.** `cut -d= -f1 .env` or `grep -o '^[A-Z_]*=' .env` answers "which keys
   are configured". `cat .env`, `head .env`, `Get-Content .env`, `grep KEY .env` and the Read tool on
   `.env` put the whole file in the transcript. `.env.example` is documentation and is fine.

4. **Provider status and config commands are listings too.** `supabase status` prints the stack's keys
   in its table and `supabase status -o env` prints them as `KEY=value`; capture it (`eval "$(npx supabase
   status -o env)"`, or `> "$TMP/status.env"`) or filter it (`| grep -viE 'key|secret|token|jwt'`).
   `netlify env:list`, `vercel env pull`, `gh secret`, `az keyvault secret show`, `aws ssm get-parameter
   --with-decryption` and `stripe config --list` belong to the same class: know what each prints before
   it runs.

5. **An API response is untrusted output.** A GET of a config endpoint can return the credentials it
   holds: the Supabase Management API's `/config/auth` answers 243 fields including `smtp_pass`, hook
   secrets and provider secrets. Never print a raw response. Parse it into a variable and print a named
   allowlist of the fields you need, as `scripts/supabase-auth-config.mjs` does. Verbose HTTP clients
   echo the request too: `curl -v` prints the `Authorization` header it sends.

6. **Dry-run the output shape on a dummy value first.** Before a command that prints anything derived
   from a secret, run it with the variable pointed at a known string (`X=dummy-value-123`) and read what
   comes out. If the dummy appears, the real one would have.

7. **A value that must be used goes into a variable or a file the tool result never shows.** Read it
   with `X=$(cat file)` or `read -r X < file`, pass it as a header or an env var to the process that
   needs it, and let only that process's non-secret output reach the transcript.

## When it has already happened

Treat the value as exposed the moment it is in a tool result, whatever the permission mode and
whoever was watching. Say so plainly in the same turn: which secret, which scope (a project key or an
account-wide token), and where the transcript lives. Give the rotation steps for that provider. The
owner decides whether to rotate; the record of the decision goes in the repo's lessons file with the
line `skill that should have prevented this: secrets-in-output`.

## The hook

`hooks/secret-echo-guard.mjs` (PreToolUse, `Bash|PowerShell`, plus `Read` for `.env` files) denies
the command-string shapes above before they run and hands back the safe form in its reason. It is a
deny, not an ask, because in a bypass-permissions session an ask is auto-approved and shown to nobody,
and unattended is exactly where the slips happened. What the hook cannot see, this skill still owns: a
value copied into another variable and printed (`k=$KEY; echo $k`), a script that prints
`process.env` from its own source, and every API response.

## Why

A secret in a transcript is not a near miss; it is a disclosure with an unknown audience, and the
only cheap moment to prevent it is before the command runs. Presence-and-length costs nothing, answers
the real question, and cannot leak. Evidence: ICC L-045 (19 September 2026), the 18 September Sonnet
slip recorded in the same repo's 2026-09-18 handover entry.

## Provenance and maintenance

Date stamp: 2026-09-20. Distilled from the two ICC incidents above; the hook's asserted cases are in
`hooks/secret-echo-guard.test.mjs` (the two incident commands are its first two deny cases).

| Fact | Re-verify with | Expected |
|---|---|---|
| The hook is wired for both command tools | `node hooks/check-index.test.mjs` | `PASS  secret-echo-guard.mjs is wired for both Bash and PowerShell` |
| The hook denies the two incident shapes and passes the safe form | `node hooks/secret-echo-guard.test.mjs` | `ALL PASS` |
