#!/usr/bin/env node
// Wrapper to adapt Claude Code hook scripts to Antigravity 2.0 hook payloads.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const hookScript = process.argv[2];
if (!hookScript) {
  console.error('Usage: agy-wrapper.mjs <script-path>');
  process.exit(1);
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const agyInput = JSON.parse(raw);
    
    // Map Antigravity input to Claude input
    const claudeInput = {
      cwd: agyInput.workspacePaths?.[0] || process.cwd(),
      tool_input: {}
    };

    if (agyInput.toolCall) {
      // Map run_command -> Bash
      if (agyInput.toolCall.name === 'run_command') {
        claudeInput.tool_input.command = agyInput.toolCall.args.CommandLine;
      } else if (agyInput.toolCall.name === 'write_to_file' || agyInput.toolCall.name.includes('replace_file_content')) {
        claudeInput.tool_input.file_path = agyInput.toolCall.args.TargetFile;
        claudeInput.tool_input.file_text = agyInput.toolCall.args.CodeContent || agyInput.toolCall.args.ReplacementContent;
      }
    }
    
    // Run the Claude script
    const r = spawnSync(process.execPath, [resolve(hookScript)], {
      input: JSON.stringify(claudeInput),
      encoding: 'utf8'
    });

    if (r.stdout) {
      try {
        const claudeOutput = JSON.parse(r.stdout);
        const agyOutput = {};

        // Map Claude output to Antigravity output
        if (claudeOutput.hookSpecificOutput) {
          const hso = claudeOutput.hookSpecificOutput;
          if (hso.permissionDecision) {
            agyOutput.decision = hso.permissionDecision;
            if (hso.permissionDecisionReason) {
              agyOutput.reason = hso.permissionDecisionReason;
            }
          }
          if (hso.additionalContext) {
            agyOutput.injectSteps = [{ ephemeralMessage: hso.additionalContext }];
          }
        }
        
        process.stdout.write(JSON.stringify(agyOutput));
        process.exit(0);
      } catch (e) {
        // If the script outputs non-JSON or nothing, just exit gracefully
        process.stdout.write(JSON.stringify({ decision: 'allow' }));
        process.exit(0);
      }
    } else {
      process.stdout.write(JSON.stringify({ decision: 'allow' }));
      process.exit(0);
    }
  } catch (e) {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  }
});
