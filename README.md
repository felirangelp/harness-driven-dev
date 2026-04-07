# Harness-Driven Development

[![CI](https://github.com/felirangelp/harness-driven-dev/actions/workflows/ci.yml/badge.svg)](https://github.com/felirangelp/harness-driven-dev/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Linear](https://img.shields.io/badge/Linear-Integrated-5e6ad2)](https://linear.app)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Skills-orange)](https://docs.anthropic.com/en/docs/claude-code)

> Software best practices don't fail because teams don't know them — they fail because nobody enforces them. An AI agent with a harness closes that gap.

[Español](README.es.md) · [Setup Guide](docs/setup-guide.md) · [Linear Guide](docs/guide-linear.md) · [GitHub Guide](docs/guide-github.md) · [Architecture](docs/architecture.md) · [FAQ](docs/faq.md) · [Live Site](https://felirangelp.github.io/harness-driven-dev/)

---

## The Problem

| What we KNOW | What we DO | What gets ENFORCED |
|---|---|---|
| Commit conventions | Sometimes | Almost never |
| No secrets in code | After the incident | Sporadically |
| Tests before merge | On new projects | Until there's pressure |
| Traceable issues | On "important" PRs | When there's an audit |
| Definition of Done | In retros | Never mechanically |

**The gap between knowing and doing is not a knowledge problem — it's an enforcement problem.**

## The Solution

Harness-Driven Development (HDD) connects three systems into one automated flow:

```
Linear (planning) → GitHub (code) → AI Agent (enforcement)
```

The agent doesn't just write code — it **self-enforces** the rules your team already knows but can't consistently follow.

## How It Works

> **Note**: `DEMO-X` is used as an example issue prefix throughout this document. Replace with your actual Linear team key (e.g., `HAR-1`, `EXP-1`). The prefix is determined by the team key you choose when creating your team in Linear.

```
YOU (3 commands):                    THE SYSTEM (15+ automated actions):
─────────────────                    ────────────────────────────────────
1. /start-issue DEMO-1        →     Reads Linear, creates branch,
                                     moves to In Progress

2. "implement dark mode"       →     Writes code, runs tests,
                                     commits with Refs DEMO-1,
                                     hooks validate secrets + ref,
                                     push + PR

3. /close-issue DEMO-1        →     Runs 3 gates, posts evidence,
                                     moves to Done, audit trail
```

## 4 Layers of Enforcement

```
Layer 1: Pre-commit (developer's laptop)
  └─ gitleaks + issue-ref hook
  └─ "Won't let you commit bad code"

Layer 2: CI (GitHub Actions)
  └─ Tests + gitleaks
  └─ "If it fails, auto-creates bug in Linear"

Layer 3: Harness (AI agent)
  └─ close_issue.sh with gates
  └─ "Won't let you close without evidence"

Layer 4: Webhook (GitHub → Linear)
  └─ PR → In Progress, merge → Done
  └─ "Status syncs automatically"
```

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Python](https://python.org/) 3.9+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- [GitHub CLI](https://cli.github.com/) (`gh`)
- A [Linear](https://linear.app/) account with API key

### Setup

```bash
# Clone
git clone https://github.com/felirangelp/harness-driven-dev.git
cd harness-driven-dev

# Python environment
python3 -m venv .venv
source .venv/bin/activate

# Node dependencies
npm install

# Environment variables
cp .env.example .env
# Edit .env and add your LINEAR_API_KEY

# Install pre-commit hooks
pip install pre-commit
pre-commit install --hook-type pre-commit --hook-type commit-msg

# Verify
npm test
```

See the full [Setup Guide](docs/setup-guide.md) for Linear integration and GitHub Actions configuration.

## Demo Project: Task Board

A single-page Kanban board (To Do → In Progress → Done) built with vanilla HTML/CSS/JS. No frameworks, no backend — just enough to demonstrate the harness in action.

Each feature is a Linear issue. The harness enforces the full lifecycle:

1. **Start** → `/start-issue DEMO-1` creates branch + moves issue
2. **Code** → Agent implements, hooks validate every commit
3. **Close** → `/close-issue DEMO-1` runs gates + posts evidence

## Repository Structure

```
harness-driven-dev/
├── .claude/
│   ├── settings.json              # Permissions + hooks
│   └── skills/
│       ├── start-issue/SKILL.md   # /start-issue command
│       ├── close-issue/SKILL.md   # /close-issue command
│       └── status/SKILL.md        # /status command
├── .github/workflows/
│   ├── ci.yml                     # Tests + secret scanning
│   └── linear-bridge.yml          # CI failure → Linear bug
├── scripts/
│   ├── linear_client.py           # Linear GraphQL client
│   ├── close_issue.sh             # 3-gate verification
│   ├── check_issue_ref.sh         # Commit message hook
│   └── ci_failure_bridge.py       # CI → Linear bridge
├── tests/test_app.js              # DOM tests (jsdom)
├── CLAUDE.md                      # Agent rules + skills
├── index.html                     # Task Board UI
├── styles.css                     # Dark theme
└── app.js                         # Board logic
```

## The "Wow Moment": Secret Blocked Live

```
MOMENT 1: "The mistake we've all made"
  → Write LINEAR_API_KEY directly in app.js
  → git commit → BLOCKED by gitleaks
  → "It never reached GitHub"

MOMENT 2: "The fix"
  → Create .env (in .gitignore)
  → Change to process.env.LINEAR_API_KEY
  → git commit → PASSES
  → git push → PR created

MOMENT 3: "Second layer — CI"
  → If someone does --no-verify
  → GitHub Actions runs gitleaks
  → PR blocked + bug auto-created in Linear
```

## Key Lesson: API > Magic Abstractions

```
Problem with MCP:
  - Doesn't assign projects → orphan issues
  - Doesn't preserve markdown → broken descriptions
  - No retry → silent failures

Solution: Own GraphQL client (~170 lines)
  - Full control over payload
  - Automatic project routing
  - Retry + error handling

Message: "Automate with APIs, not magic abstractions."
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
