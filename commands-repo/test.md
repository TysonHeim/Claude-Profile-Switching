---
description: Run tests related to the current changes — finds affected test files and executes them
---

Before running tests:

1. **Identify changed files** — run `git diff --name-only` to see what's modified
2. **Find related tests** — for each changed file, look for corresponding `.test.*` or `.spec.*` files
3. **Run targeted tests** — execute only the relevant test files, not the full suite
4. **Report results** — show pass/fail counts and any failure details

If no test files exist for the changed code, note this as a gap.
