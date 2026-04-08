# GitHub Setup Guide

[Español](guide-github.es.md)

Complete guide to configure GitHub for Harness-Driven Development.

## 1. Create the Repository

If you're starting from scratch:

```bash
# Option A: Fork this repo
# Go to https://github.com/felirangelp/harness-driven-dev → Fork

# Option B: Clone and push to your own repo
git clone https://github.com/felirangelp/harness-driven-dev.git
cd harness-driven-dev
git remote set-url origin https://github.com/YOUR_USER/harness-driven-dev.git
git push -u origin main
```

## 2. Configure Repository Secrets

Secrets are environment variables that GitHub Actions can use securely.

### 2.1 LINEAR_API_KEY (required)

This allows the Linear Bridge workflow to create bugs in Linear when CI fails.

**Via CLI:**
```bash
gh secret set LINEAR_API_KEY
# Paste your lin_api_... key when prompted
```

**Via web:**
1. Go to your repo → **Settings** tab
2. Left sidebar: **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Fill in:
   - **Name**: `LINEAR_API_KEY`
   - **Secret**: your `lin_api_xxxxxxxxxx` key
5. Click **Add secret**

### 2.2 GITHUB_TOKEN (automatic)

GitHub provides this automatically — no configuration needed. It's used by the gitleaks action for secret scanning.

## 3. Verify GitHub Actions Workflows

The repo includes 2 workflows that run automatically:

### 3.1 CI Workflow (`.github/workflows/ci.yml`)

**Triggers**: on push to `main`, on pull requests to `main`

**Jobs:**
| Job | What it does | How to verify |
|-----|-------------|---------------|
| **Tests** | Runs `npm ci` + `npm test` | Push any commit and check Actions tab |
| **Secret Scanning** | Runs gitleaks to detect secrets | Automatically scans all commits |

**To verify it works:**
1. Go to your repo → **Actions** tab
2. You should see the "CI" workflow
3. Click on the latest run to see results

### 3.2 Linear Bridge Workflow (`.github/workflows/linear-bridge.yml`)

**Triggers**: runs automatically after the CI workflow completes with failure

**What it does:**
1. Detects that CI failed
2. Runs `scripts/ci_failure_bridge.py`
3. Creates a bug in Linear with:
   - Failed job names
   - Branch name
   - Link to the GitHub Actions run
4. If a bridge bug already exists, adds a comment instead of duplicating

**To verify it works:**
- This only runs when CI fails — you'll see it in action during the demo when a secret gets pushed

## 4. Configure GitHub Pages

This publishes the landing page and slides.

**Via CLI:**
```bash
gh api repos/YOUR_USER/harness-driven-dev/pages \
  -X POST \
  --input - <<< '{"source":{"branch":"main","path":"/docs"}}'
```

**Via web:**
1. Go to your repo → **Settings** tab
2. Left sidebar: **Pages**
3. Under **Source**, select:
   - **Branch**: `main`
   - **Folder**: `/docs`
4. Click **Save**
5. Wait 1-2 minutes for the site to build

**Your site will be at:**
```
https://YOUR_USER.github.io/harness-driven-dev/
```

## 5. Install Pre-commit Hooks Locally

These hooks run on your machine before each commit.

```bash
# Install pre-commit (if not already installed)
pip install pre-commit

# Install the hooks defined in .pre-commit-config.yaml
pre-commit install --hook-type pre-commit --hook-type commit-msg
```

This installs:

| Hook | When it runs | What it does |
|------|-------------|-------------|
| **gitleaks** | Before each commit | Scans staged files for secrets (API keys, passwords, tokens) |
| **check-issue-ref** | On commit message | Verifies `Refs DEMO-XXX` is present, blocks `Closes/Fixes/Resolves` |

### Verify hooks work

```bash
# Test gitleaks (should pass on clean code)
pre-commit run gitleaks --all-files

# Test issue-ref check (should BLOCK — no issue ref)
echo "test commit message" > /tmp/test-msg.txt
bash scripts/check_issue_ref.sh /tmp/test-msg.txt
# Expected: BLOCKED

# Test with valid message (should PASS)
echo "feat: add feature

Refs DEMO-1" > /tmp/test-msg.txt
bash scripts/check_issue_ref.sh /tmp/test-msg.txt
# Expected: Issue reference OK
```

## 6. Install GitHub CLI (`gh`)

The harness uses `gh` to check CI status and view runs.

**macOS:**
```bash
brew install gh
gh auth login
```

**Linux:**
```bash
# Debian/Ubuntu
sudo apt install gh
gh auth login
```

**Windows:**
```bash
winget install GitHub.cli
gh auth login
```

**Verify:**
```bash
gh --version
gh run list --limit 1
```

## 7. Branch Naming Convention

The Linear-GitHub webhook detects issue identifiers in branch names to auto-link PRs.

**Pattern:** `{type}/DEMO-{N}-{slug}`

| Example | Detected? | Result |
|---------|-----------|--------|
| `feat/DEMO-1-dark-mode` | Yes | PR linked to DEMO-1 |
| `fix/DEMO-2-counter-bug` | Yes | PR linked to DEMO-2 |
| `my-feature-branch` | No | No auto-linking |

**Types:** `feat`, `fix`, `docs`, `test`, `chore`, `refactor`

## 8. Repository Settings (recommended)

### 8.1 Branch Protection (optional for demo)

1. Go to **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main`
3. Enable:
   - **Require a pull request before merging**
   - **Require status checks to pass before merging**
   - Select checks: `Tests`, `Secret Scanning`

### 8.2 Topics

Add topics to make the repo discoverable:

```bash
gh repo edit --add-topic harness-driven-development \
  --add-topic linear --add-topic claude-code \
  --add-topic ai-agents --add-topic devops
```

## 9. Complete Verification Checklist

Run through this checklist to verify everything is configured:

```bash
# 1. Git remote is set
git remote -v
# Should show your repo URL

# 2. GitHub CLI is authenticated
gh auth status
# Should show "Logged in to github.com"

# 3. Secrets are configured
gh secret list
# Should show LINEAR_API_KEY

# 4. CI workflow exists and runs
gh run list --limit 3
# Should show recent runs

# 5. GitHub Pages is active
gh api repos/YOUR_USER/harness-driven-dev/pages --jq '.html_url'
# Should show your pages URL

# 6. Pre-commit hooks are installed
pre-commit run --all-files
# Should run gitleaks and pass

# 7. Issue-ref hook works
echo "bad message" > /tmp/test.txt
bash scripts/check_issue_ref.sh /tmp/test.txt
# Should show BLOCKED
```

## Troubleshooting

**"gh: command not found"**
- Install GitHub CLI: https://cli.github.com/

**"pre-commit: command not found"**
- Run `pip install pre-commit` inside your virtual environment

**CI workflow doesn't appear in Actions tab**
- Push a commit to `main` — workflows activate on first push

**GitHub Pages shows 404**
- Verify source is set to `main` branch, `/docs` folder
- Wait 2-3 minutes after enabling
- Check the Actions tab for a "pages-build-deployment" workflow

**Linear Bridge doesn't create bugs**
- Verify `LINEAR_API_KEY` is set as a repository secret
- The bridge only runs when CI actually fails

**`/close-issue` Gate 2 shows "FAIL (last run: skipped)" even though CI passed**
- This happens when the Linear Bridge workflow (which runs after CI) is picked up instead of the actual CI workflow
- The `close_issue.sh` script filters by `--workflow ci.yml` to avoid this
- If you still see the issue, wait a few seconds and try again — the CI run may still be in progress
- Verify manually: `gh run list --workflow ci.yml --branch main --limit 1`
