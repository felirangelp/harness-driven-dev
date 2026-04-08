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

> **Important**: The team key determines your issue prefix. Throughout this guide, `DEMO` is used as an example — your team key can be anything (e.g., `HAR`, `EXP`, `PROJ`). The harness scripts detect issue references dynamically using the pattern `[A-Z]+-[0-9]+`, so any team key works automatically.

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
2. In the left sidebar, click **Security & access**
3. Scroll down to **Personal API keys**
4. Click **New API key**
5. Give it a label: `harness-driven-dev`
6. **Copy the key immediately** — it starts with `lin_api_` and won't be shown again

## 6. Save the API Key

### Locally (for development and demo)

```bash
# Copy the example file
cp .env.example .env

# Edit .env and paste your key
# LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### In GitHub (for CI — the Linear Bridge workflow)

The Linear Bridge workflow runs in GitHub Actions and needs the key to create bugs in Linear when CI fails. You must save it as a repository secret.

**Option A: Via terminal (requires [GitHub CLI](https://cli.github.com/))**

```bash
# Make sure you're in the repo directory
cd ~/projects/harness-driven-dev

# Set the secret — it will prompt you to paste the value
gh secret set LINEAR_API_KEY

# Paste your lin_api_xxxxxxxxxx key and press Enter
# Expected output: ✓ Set secret LINEAR_API_KEY for your-user/harness-driven-dev
```

**Option B: Via GitHub web**

1. Go to https://github.com/felirangelp/harness-driven-dev/settings/secrets/actions
   - Or navigate: repo → **Settings** tab → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Fill in:
   - **Name**: `LINEAR_API_KEY`
   - **Secret**: paste the same `lin_api_...` key you put in `.env`
4. Click **Add secret**
5. You should see `LINEAR_API_KEY` listed under Repository secrets

## 7. Create Demo Issues

The demo uses 3 simple features for the Task Board. Each one is small enough to implement in minutes, but complex enough to show the full harness flow.

| Issue | What it does | Why it's in the demo |
|-------|-------------|---------------------|
| **Add dark mode toggle** | Adds a button to switch between light and dark themes | Perfect for the "secret blocked" moment — the agent writes a toggle and we test the full commit → hook → CI flow |
| **Add task counter per column** | Shows "To Do (3)" instead of just "To Do" in column headers | Quick feature that demonstrates `/start-issue` → code → `/close-issue` without drama |
| **Add drag and drop** | Lets users drag tasks between columns instead of clicking arrows | More complex feature, good for showing that the harness scales |

Now that you have the API key configured, you can create these issues from Claude Code, via CLI, or manually.

### Option A: From Claude Code (recommended)

Start Claude Code in the project directory and tell the agent:

```
Create the 3 demo issues
```

Or create them one by one:

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
- [ ] Toggle button visible in the header
- [ ] Dark and light styles applied to the board
- [ ] User preference saved in localStorage"

python3 scripts/linear_client.py create "Add task counter per column" \
  "## Acceptance Criteria
- [ ] Counter number shows in each column header
- [ ] Counter updates when tasks are added, moved, or deleted"

python3 scripts/linear_client.py create "Add drag and drop between columns" \
  "## Acceptance Criteria
- [ ] Tasks can be dragged from one column to another
- [ ] Task state updates on drop"
```

### Option C: Manually in Linear

1. Go to your team view in Linear
2. Click **+ Create issue** (or press `C`)
3. Create each issue with the title and description from the table above

> **Important**: Always include `## Acceptance Criteria` with `- [ ]` checkboxes. The harness gate 3 checks these boxes to verify the Definition of Done.

## 8. Connect Linear with GitHub

This enables automatic status sync (PR → In Progress, merge → Done) via webhook.

> **Important — Multiple Linear Workspaces**: Linear's GitHub App can only be installed **once per GitHub account**. If you already have another Linear workspace connected to the same GitHub account (e.g., a work project), you must **uninstall** the app first and reinstall it for this workspace. See [Troubleshooting: Multiple Workspaces](#multiple-linear-workspaces-on-the-same-github-account) at the bottom of this section.

### Step 8.1: Install the GitHub integration in Linear

1. Go to **Linear → Settings → Integrations** (left sidebar)
2. Find **GitHub** → click **Enable**
3. It will redirect you to GitHub to install the Linear app
4. Select your GitHub account (e.g., `felirangelp`)
5. Under **Repository access**, select **Only select repositories**
6. Choose your repo (e.g., `harness-driven-dev`)
7. Click **Save** / **Install**
8. You'll be redirected back to Linear

### Step 8.2: Connect your personal GitHub account

1. In Linear → **Settings → Integrations → GitHub** (same page)
2. Find **Personal GitHub account not connected** → click **Connected accounts →**
3. Click **Connect** next to GitHub
4. Authorize the connection
5. This syncs attribution of your commits and PRs

> If "Connected accounts" appears greyed out, complete Step 8.1 first. The personal account connection only works after the workspace integration is enabled.

### Step 8.3: Configure PR Automations

1. Go to **Linear → Settings → Teams → [Your Team] → Workflows & automations**
2. Under **Pull request and commit automations**, configure:

| Event | Action |
|-------|--------|
| On draft PR open, move to... | **No action** |
| On PR open, move to... | **In Progress** |
| On PR review request or activity, move to... | **In Review** |
| On PR ready for merge, move to... | **In Review** |
| On PR merge, move to... | **Done** |

> **Why these settings?** The harness uses `Refs DEMO-XXX` (not `Closes`) in commits and PR descriptions. The webhook detects the issue identifier in the branch name (e.g., `feat/HAR-5-dark-mode`) and automatically updates the status.

### Step 8.4: Enable additional features (optional)

In the GitHub integration settings, enable:
- **View pull requests in Linear** (Alpha) — toggle ON
- **Pull request notifications** — All activity by people

### Troubleshooting: Multiple Linear Workspaces on the Same GitHub Account

**The problem**: Linear's GitHub App can only be installed once per GitHub account/organization. If you have two Linear workspaces (e.g., `ExpertIA` for work and `Harness Driven Dev` for this demo) using the same GitHub account, you'll get this error:

> *"Error while connecting with GitHub. Unable to connect with GitHub. Make sure you haven't connected another Linear account with this GitHub installation."*

**The solution**: Uninstall the app from the other workspace first, then install it for this one.

**Step by step**:

1. **Uninstall the existing Linear app from GitHub**:
   - Go to `https://github.com/settings/installations`
   - Find **Linear** → click **Configure**
   - Scroll to **Danger zone** → click **Uninstall**
   - Confirm

2. **Install for the new workspace**:
   - Go to your new Linear workspace → **Settings → Integrations → GitHub → Enable**
   - It will ask you to install the app on GitHub → select your account
   - Choose **Only select repositories** → select the repo for this project
   - Click **Save**
   - Back in Linear, it should connect without error

3. **Complete the setup** (Steps 8.2, 8.3, 8.4 above)

4. **Reconnect the other workspace later** (when you're done):
   - Go to the other Linear workspace → **Settings → Integrations → GitHub → Enable**
   - Install the app again → select the repos for that project
   - The previous workspace will be disconnected, but you can switch back any time

**The impact of switching**: While a workspace is disconnected, PRs won't automatically move issues in Linear. But if that project uses harness scripts (like this one does), the scripts move issues via the API directly — so the impact is minimal.

**Alternative — Use a GitHub Organization**: If you don't want to switch back and forth, create a free GitHub Organization for this project. The Linear app installs per org, so two orgs can connect to two different Linear workspaces without conflict.

## 9. Verify Everything Works

```bash
# Activate virtual environment
source .venv/bin/activate

# Test: list all issues
python3 scripts/linear_client.py list

# Expected output (your team key prefix will vary):
#   HAR-5  [To Do]  Add dark mode toggle
#   HAR-6  [To Do]  Add task counter per column
#   HAR-7  [To Do]  Add drag and drop between columns

# Test: get a specific issue (use your actual issue ID)
python3 scripts/linear_client.py get HAR-5

# Test: move an issue (then move it back)
python3 scripts/linear_client.py move HAR-5 "In Progress"
python3 scripts/linear_client.py move HAR-5 "To Do"
```

If you get errors:

| Error | Cause | Fix |
|-------|-------|-----|
| `LINEAR_API_KEY not set` | `.env` file missing or empty | Check your `.env` file has the key |
| `Issue not found` | Wrong team key | Verify `LINEAR_TEAM_KEY` in `.env` matches your team |
| `HTTP 401` | API key invalid or from wrong workspace | Create a new key from the correct workspace |
| `State 'Todo' not found` | Wrong state name | Use `"To Do"` (with space), not `"Todo"` |
| `Team 'DEMO' not found` | Default team key doesn't match | Set `LINEAR_TEAM_KEY` in `.env` to your team key |
| Shows issues from wrong workspace | Shell env overrides `.env` | The script prioritizes `.env` over shell, but verify with `echo $LINEAR_API_KEY` |

## 10. Keyword Policy

The Linear-GitHub integration responds to keywords in commits and PRs:

| Keyword | Use? | Why |
|---------|------|-----|
| `Refs HAR-XXX` | **Always** | Links commit to issue without closing |
| `Closes HAR-XXX` | **Never** | Auto-closes issue, bypasses harness gates |
| `Fixes HAR-XXX` | **Never** | Same as Closes |
| `Resolves HAR-XXX` | **Never** | Same as Closes |

> **Note**: Replace `HAR` with your actual team key prefix. The `check_issue_ref.sh` hook accepts any team key matching the pattern `[A-Z]+-[0-9]+`.

The `check_issue_ref.sh` hook enforces this automatically on every commit.
