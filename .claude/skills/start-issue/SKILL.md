---
name: start-issue
description: Start work on a Linear issue — fetch details, create branch, move to In Progress
user-invocable: true
allowed-tools: Bash(git *) Bash(python3 scripts/*)
argument-hint: "<ISSUE_ID> (e.g., DEMO-1)"
---

# Start Issue

Begin work on Linear issue `$ARGUMENTS`.

## Steps

1. **Fetch issue from Linear**:
   ```bash
   python3 scripts/linear_client.py get $0
   ```
   Show the user: title, description, acceptance criteria.

2. **Create a feature branch** from the issue metadata:
   ```bash
   git checkout -b feat/$0-<slugified-title>
   ```
   Use the issue title to generate a short kebab-case slug.

3. **Move to In Progress** in Linear:
   ```bash
   python3 scripts/linear_client.py move $0 "In Progress"
   ```

4. **Confirm** to the user:
   ```
   Issue $0 started.
   Branch: feat/$0-<slug>
   Status: In Progress
   ```

## Rules

- NEVER start coding without running this skill first.
- If the issue does not exist, stop and inform the user.
- If already on a feature branch for this issue, skip branch creation.
