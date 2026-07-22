---
name: lint-after-edit
description: Run the project's linter after editing source files in a JavaScript or TypeScript project. Use after any edit to .js, .ts, .jsx, or .tsx files. Detects which linter the project uses (ESLint, Biome, or none) and runs it on the specific file edited. Reports any issues to the user but does not block the edit.
---

# Lint after edit

After editing any JavaScript or TypeScript source file (.js, .ts, .jsx, .tsx), run the project's linter on that specific file. This catches issues that Prettier's auto-format does not, such as unused imports, undefined variables, and code smells.

## Detection

Check what the project uses, in this order:

1. Look for `eslint.config.js`, `eslint.config.ts`, or `.eslintrc*` files in the project root or workspace root. If found, the project uses ESLint.
2. Look for `biome.json` or `biome.jsonc` in the same locations. If found, the project uses Biome.
3. Look in `package.json` for a `lint` script under `scripts`. If found, prefer that (it's the project's canonical lint command).
4. If none of the above, do not run anything. State that the project does not appear to have a linter configured.

## What to run

If ESLint is detected, run:
    npx eslint --fix "<file-path>"

If Biome is detected, run:
    npx @biomejs/biome check --write "<file-path>"

If a lint script exists in package.json, run:
    npm run lint -- "<file-path>"

The --fix and --write flags auto-correct trivially fixable issues (formatting, import ordering, unused semicolons). Non-fixable issues are reported back.

## After running

If the linter reported issues that could not be auto-fixed, summarise them briefly to the user. Do not list every warning; group them by file and by type. Mention the count.

If there were no issues or all issues were auto-fixed, do not mention the lint run unless asked. The user does not need a confirmation for the happy path.

## What this does not do

Type checking is separate. Do not run `tsc` from this skill. If TypeScript errors matter for the work, the user will say so or a separate skill will handle it.

This skill runs on individual files. Project-wide lints (which often flood the context with errors unrelated to the current edit) are not in scope.