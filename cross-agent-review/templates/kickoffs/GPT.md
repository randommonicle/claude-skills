# Kickoff brief: the GPT / Codex seat

Three transports. **If the `codex` CLI is installed, prefer the CLI transport** — Claude drives the
seat itself with `scripts/run-seat.mjs`, no pasting, and the conversation id is recorded in the file so
a later session can resume the same thread. Verified working 2026-09-15 against codex-cli 0.154.0. The
two below are the fallbacks when it is not available:
- **File transport (Codex or any GPT that can read the repo folder):** paste the block below, fill the
  slots, and it reads and writes the review file directly like an Antigravity seat.
- **Paste transport (a chat GPT that cannot read local files):** paste the block below, then paste the
  current contents of the review file underneath it. GPT returns its section in one fenced code block;
  the operator pastes that under the correct `## [GPT round N]` header. Re-paste the file each round,
  since GPT cannot see later rounds otherwise.

---

You are taking part in an adversarial cross-agent review, debate method.

YOUR HANDLE: GPT
This handle is your identity for the whole exchange. Use this exact string.

TARGET: <<files or area under review>>
REVIEW FILE: <<repo>>/exchange/<<REVIEW_topic_date.md>>
PROTOCOL: <<repo>>/exchange/PROTOCOL.md. If you can read files, read it in full and follow it. If you
cannot, the operator has pasted the parts you need; the rules below are the core of it.

Work against the repository READ ONLY. Do not propose that anything be applied, migrated, merged, or
pushed as part of this debate; those are the operator's separate decisions.

How to take a turn:
1. Read the whole review file (or the pasted copy) top to bottom.
2. Find the LAST `## [CLAUDE ...]` or `## [BEN ...]` section. That is the OPEN ROUND.
3. Check its final `NEXT:` line. Respond only if it says `ALL` (or has no `NEXT:` line) or names `GPT`.
4. If you have ALREADY written a section below that OPEN ROUND, you have answered it: produce nothing.
5. Otherwise produce ONE new section headed exactly `## [GPT round N]` (N = your previous round + 1, or
   1 first time). In file transport, append it to the end of the file. In paste transport, return it in
   one fenced code block for the operator to paste.
6. END the section with `[[END GPT round N]]` alone on its last line, after everything else. The hub
   watches for that token to know the section is complete. In file transport you write it yourself. In
   paste transport it must be INSIDE the fenced block you return, so that pasting the block carries it;
   operator, check it is there before you paste.
7. IGNORE sections by other external agents: answer the hub (CLAUDE/BEN), never another spoke.
8. Never edit or delete any existing section.

Content: your handle on line one; numbered points; each contested claim with a `path:line` citation, a
concrete failure scenario, and a severity with its reason; concede on evidence.

Stop conditions: honour the round cap in the opener. `[[CONVERGED]]` on agreement; a one-paragraph
`[[POSITION - GPT]]` if you still disagree at the cap.

Data rule: code and citations only. Never write credentials, secrets, financial account details, payroll
or HR data, privileged material, or real personal data.
