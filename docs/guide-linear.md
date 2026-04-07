# Linear Setup Guide

[Español](guide-linear.es.md)

Complete guide to configure Linear for Harness-Driven Development.

## 1. Create a Linear Account

If you don't have one, sign up at [linear.app](https://linear.app/). The free plan works for demos.

## 2. Create a Team

The team is the container for all your issues. The team key becomes the prefix for issue IDs (e.g., `DEMO-1`).

1. Go to **Linear → Settings → Teams** (left sidebar)
2. Click **Create team**
3. Configure:
   - **Team name**: `Demo` (or your project name)
   - **Team key**: `DEMO` (this becomes the issue prefix)
   - **Description**: optional
4. Click **Create team**

> **Important**: The team key (`DEMO`) must match what the harness scripts expect. If you use a different key, update `scripts/linear_client.py` line 131 where `team_key="DEMO"` is set.

## 3. Configure Workflow States

Linear comes with default states. Verify they match what the harness expects:

| State | Type | Required by |
|-------|------|-------------|
| **Todo** | Unstarted | `/start-issue` moves FROM here |
| **In Progress** | Started | `/start-issue` moves TO here |
| **In Review** | Started | GitHub webhook moves here on PR review |
| **Done** | Completed | `/close-issue` moves TO here |

To check or edit states:
1. Go to **Settings → Teams → [Your Team] → Workflow**
2. Verify the 4 states above exist
3. If a state is missing, click **+ Add state**

## 4. Create a Project (optional)

Projects group related issues. For the demo:

1. Go to **Linear → Projects** (left sidebar)
2. Click **+ Create project**
3. Configure:
   - **Name**: `HDD Demo`
   - **Team**: `Demo`
   - **Status**: Active
4. Click **Create**

## 5. Create an API Key

The API key allows the harness scripts to interact with Linear. **You need this before creating issues via CLI or Claude Code.**

1. Click your **avatar** (bottom-left) → **Settings**
2. In the left sidebar, go to **Security & access** (under your account settings)
   - Alternatively: go to **Settings → API** and click the **"security & access settings"** link in the Member API keys section
3. Scroll to **Personal API keys**
4. Click **Create key**
5. Give it a name: `harness-driven-dev`
6. Click **Create**
7. **Copy the key immediately** — it starts with `lin_api_` and won't be shown again

## 6. Save the API Key

### Locally (for development and demo)

```bash
# Copy the example file
cp .env.example .env

# Edit .env and paste your key
# LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### In GitHub (for CI — the Linear Bridge workflow)

```bash
# This will prompt you to paste the key
gh secret set LINEAR_API_KEY
```

Or manually:
1. Go to your repo on GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `LINEAR_API_KEY`
4. Value: paste your `lin_api_...` key
5. Click **Add secret**

## 7. Create Demo Issues

Now that you have the API key configured, you can create issues directly from Claude Code, via CLI, or manually.

### Option A: From Claude Code (recommended)

Start Claude Code in the project directory and ask:

```
/create-issue Add dark mode toggle
/create-issue Add task counter per column
/create-issue Add drag and drop between columns
```

The agent will create each issue in Linear with acceptance criteria automatically.

### Option B: Via CLI script

```bash
source .venv/bin/activate

python3 scripts/linear_client.py create "Add dark mode toggle" \
  "## Acceptance Criteria
- [ ] Toggle button visible
- [ ] Dark/light styles applied
- [ ] Preference saved in localStorage"

python3 scripts/linear_client.py create "Add task counter per column" \
  "## Acceptance Criteria
- [ ] Counter shows in column header
- [ ] Updates on add/move/delete"

python3 scripts/linear_client.py create "Add drag and drop between columns" \
  "## Acceptance Criteria
- [ ] Tasks draggable between columns
- [ ] State updates on drop"
```

### Option C: Manually in Linear

1. Go to your team view in Linear
2. Click **+ Create issue** (or press `C`)
3. Create each issue with a title and description

> **Important**: Always include `## Acceptance Criteria` with `- [ ]` checkboxes. The harness gate 3 checks these boxes to verify Definition of Done.

## 8. Connect Linear with GitHub

This enables automatic status sync (PR → In Progress, merge → Done).

### Step 8.1: Install the GitHub integration in Linear

1. Go to **Linear → Settings → Integrations** (left sidebar, under Organization)
2. Find **GitHub** under Essentials
3. Click **Connect** / **Enable**
4. Authorize Linear to access your GitHub account
5. Select the repository: `harness-driven-dev`

### Step 8.2: Connect your personal GitHub account

1. Go to **Linear → Settings → Account → Connected accounts**
2. Find **GitHub** and click **Connect**
3. Authorize the connection
4. This syncs attribution of your commits and PRs

### Step 8.3: Configure PR Automations

1. Go to **Linear → Settings → Teams → [Your Team] → Workflows & automations**
2. Under **Pull request and commit automations**, configure:

| Event | Action |
|-------|--------|
| On draft PR open, move to... | **No action** |
| On PR or commit open, move to... | **In Progress** |
| On PR review request or activity, move to... | **In Review** |
| On PR ready for merge, move to... | **In Review** |
| On PR or commit merge, move to... | **Done** |

> **Why these settings?** The harness uses `Refs DEMO-XXX` (not `Closes`) in commits and PR descriptions. The webhook detects the issue identifier in the branch name (`feat/DEMO-1-dark-mode`) and automatically updates the status.

### Step 8.4: Enable additional features

In the GitHub integration settings, enable:
- **View pull requests in Linear** (Alpha) — toggle ON
- **Pull request notifications** — All activity by people

## 9. Verify Everything Works

```bash
# Activate virtual environment
source .venv/bin/activate

# Test: list all issues
python3 scripts/linear_client.py list

# Expected output:
#   DEMO-1  [Todo]  Add dark mode toggle
#   DEMO-2  [Todo]  Add task counter per column
#   DEMO-3  [Todo]  Add drag and drop

# Test: get a specific issue
python3 scripts/linear_client.py get DEMO-1

# Test: move an issue (then move it back)
python3 scripts/linear_client.py move DEMO-1 "In Progress"
python3 scripts/linear_client.py move DEMO-1 "Todo"
```

If you get errors:
- `LINEAR_API_KEY not set` → Check your `.env` file
- `Issue not found` → Verify the team key matches (`DEMO`)
- `HTTP 401` → Your API key is invalid or expired, create a new one

## 10. Keyword Policy

The Linear-GitHub integration responds to keywords in commits and PRs:

| Keyword | Use? | Why |
|---------|------|-----|
| `Refs DEMO-XXX` | **Always** | Links without closing |
| `Closes DEMO-XXX` | **Never** | Auto-closes, bypasses harness gates |
| `Fixes DEMO-XXX` | **Never** | Same as Closes |
| `Resolves DEMO-XXX` | **Never** | Same as Closes |

The `check_issue_ref.sh` hook enforces this automatically on every commit.
