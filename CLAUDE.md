# CLAUDE.md — Harness-Driven Development

## Project

This is a demo Task Board (vanilla HTML/CSS/JS) used to demonstrate
Harness-Driven Development: an approach where an AI agent enforces
software best practices mechanically via scripts, hooks, and gates.

The harness connects Linear (project management) with GitHub (code)
through automated enforcement.

## Skills

The agent has 4 skills that connect with the harness:

| Skill | When to use |
|-------|-------------|
| `/create-issue <title>` | Create a new issue in Linear with acceptance criteria. |
| `/start-issue DEMO-X` | ALWAYS before writing code. Reads Linear issue, creates branch, moves to In Progress. |
| `/close-issue DEMO-X` | ALWAYS to finish work. Runs 3 gates (tests + CI + criteria), posts evidence, moves to Done. |
| `/status` | Check project dashboard: issues, branch, CI status. |

> **Note**: `DEMO-X` is used as an example. Replace with your actual Linear team key prefix (e.g., `HAR-5`, `EXP-1`). The team key is set when you create your team in Linear.

## Harness Rules

1. **No code without issue**: Before touching code, run `/start-issue`.
2. **Refs, never Closes**: Commit messages MUST contain `Refs DEMO-XXX`.
   NEVER use `Closes`, `Fixes`, or `Resolves` — they bypass harness gates.
3. **Mechanical Definition of Done**: Use `/close-issue` to close issues.
   NEVER close manually in Linear. The harness runs 3 gates first.
4. **No secrets in code**: gitleaks blocks commits with secrets automatically.
5. **Evidence always**: Every issue closure includes an audit trail comment in Linear.

## Commit Message Format

```
<type>: <short description>

<optional body>

Refs DEMO-XXX
```

Types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/linear_client.py` | GraphQL client for Linear API (get, move, comment, list) |
| `scripts/close_issue.sh` | Gate script: tests + CI + acceptance criteria |
| `scripts/check_issue_ref.sh` | Commit-msg hook: enforces `Refs DEMO-XXX` |
| `scripts/ci_failure_bridge.py` | Auto-creates Linear bug when CI fails |

## Tech Stack

- Frontend: HTML + CSS + vanilla JS (no frameworks)
- Tests: Node.js + jsdom
- Harness scripts: Python 3 (stdlib only) + Bash
- CI: GitHub Actions
- Project management: Linear
