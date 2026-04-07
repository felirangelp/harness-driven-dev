---
name: close-issue
description: Close a Linear issue with evidence — runs 3 gates (tests, CI, acceptance criteria) before closing
user-invocable: true
allowed-tools: Bash(git *) Bash(gh *) Bash(npm test*) Bash(python3 scripts/*) Bash(bash scripts/*)
argument-hint: "<ISSUE_ID> (e.g., DEMO-1)"
---

# Close Issue

Close Linear issue `$ARGUMENTS` with mechanical verification.

## Steps

1. **Run the harness gate script**:
   ```bash
   bash scripts/close_issue.sh $0
   ```
   This runs 3 gates:
   - **Gate 1**: Tests passing? (`npm test`)
   - **Gate 2**: CI green? (`gh run list`)
   - **Gate 3**: Acceptance criteria all checked? (Linear API)

2. **If ALL gates pass**:
   The script automatically:
   - Posts evidence comment to the Linear issue
   - Moves issue to "Done"
   - Report: `Issue $0 closed with evidence.`

3. **If ANY gate fails**:
   - Report which gate failed and why
   - Do NOT close the issue
   - Suggest what the user needs to fix

## Rules

- NEVER close an issue if a gate fails.
- NEVER use workarounds to bypass gates.
- NEVER close issues manually in Linear — always use this skill.
- The user must fix the root cause, then run `/close-issue` again.
