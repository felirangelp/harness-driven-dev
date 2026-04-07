---
name: status
description: Display project status dashboard — Linear issues, current branch, CI status
user-invocable: true
allowed-tools: Bash(git *) Bash(gh *) Bash(python3 scripts/*)
---

# Project Status

Display a dashboard of the current project state.

## Steps

1. **Linear issues**:
   ```bash
   python3 scripts/linear_client.py list
   ```
   Show all issues grouped by state.

2. **Current branch**:
   ```bash
   git branch --show-current
   ```

3. **Recent commits**:
   ```bash
   git log --oneline -5
   ```

4. **Last CI run**:
   ```bash
   gh run list --limit 1
   ```

5. **Format as dashboard**:
   ```
   ┌──────────────────────────────┐
   │     PROJECT STATUS           │
   ├──────────────────────────────┤
   │ Branch: feat/DEMO-1-...     │
   │                              │
   │ Issues:                      │
   │   DEMO-1  In Progress  ...  │
   │   DEMO-2  To Do        ...  │
   │   DEMO-3  To Do        ...  │
   │                              │
   │ CI: Last run passed (2m ago) │
   └──────────────────────────────┘
   ```

## If an issue ID is provided (`/status DEMO-1`)

Show detailed info for that specific issue:
```bash
python3 scripts/linear_client.py get $0
```
Include: state, description, acceptance criteria, linked PRs.
