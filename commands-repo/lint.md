---
description: Check code formatting and lint issues — runs project linter and reports fixable problems
---

1. **Detect the project's linter** — look for `.eslintrc*`, `biome.json`, `.prettierrc*`, `ruff.toml`, or similar config files
2. **Run the linter** — use the project's configured lint/format command (check `package.json` scripts or Makefile)
3. **Report results** — show errors grouped by file, with auto-fixable issues noted
4. **Offer to fix** — if auto-fix is available, ask before running it
