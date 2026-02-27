---
name: debug-guide
description: Systematic debugging strategies — reproducing issues, isolating root causes, using breakpoints and logs. Use when investigating bugs, troubleshooting errors, or diagnosing performance issues.
---

# Debug Guide

## Instructions

Follow this systematic approach when debugging:

### 1. Reproduce First
- Get a reliable reproduction before changing anything
- Document exact steps, inputs, and environment
- If intermittent, identify patterns (timing, load, specific data)

### 2. Isolate the Layer
Narrow down where the bug lives:
- **Frontend**: Check browser console, network tab, component state
- **API**: Check request/response in network tab, validate with curl
- **Backend**: Check logs, add targeted logging around the suspect area
- **Database**: Check queries, data integrity, indexes

### 3. Binary Search
When you don't know where the bug is:
- Add a log/breakpoint at the midpoint of the suspected code path
- Determine which half contains the bug
- Repeat until isolated

### 4. Read the Error
Before Googling or guessing:
- Read the full stack trace, not just the first line
- Check the originating file and line number
- Look at variable values at the crash point

### 5. Common Patterns

| Symptom | Likely Cause |
|---------|-------------|
| Works locally, fails in CI | Environment/config difference |
| Works first time, fails after | State mutation, caching |
| Intermittent failures | Race condition, timing |
| Silent failure | Swallowed exception, missing await |
| Wrong data displayed | Stale cache, wrong query, mapping error |

### 6. Fix and Verify
- Fix the root cause, not the symptom
- Verify the original reproduction no longer fails
- Consider adding a test that would have caught this
