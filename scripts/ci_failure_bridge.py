#!/usr/bin/env python3
"""
CI Failure Bridge — When CI fails, auto-create a bug in Linear.
Triggered by: .github/workflows/linear-bridge.yml

Usage:
  python scripts/ci_failure_bridge.py <run_id>
"""
import os
import sys
import json
import subprocess

# Add scripts dir to path for linear_client import
sys.path.insert(0, os.path.dirname(__file__))
from linear_client import _query, add_comment, get_issue


def get_failed_jobs(run_id):
    """Get failed job names from a GitHub Actions run."""
    try:
        result = subprocess.run(
            ["gh", "run", "view", str(run_id), "--json", "jobs"],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode != 0:
            print(f"gh CLI error: {result.stderr}", file=sys.stderr)
            return []
        jobs = json.loads(result.stdout).get("jobs", [])
        return [j["name"] for j in jobs if j.get("conclusion") == "failure"]
    except FileNotFoundError:
        print("gh CLI not found. Install: https://cli.github.com/", file=sys.stderr)
        return []


def get_repo_url():
    """Get the GitHub repo URL from git remote."""
    try:
        result = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            capture_output=True, text=True, timeout=10,
        )
        url = result.stdout.strip()
        # Convert SSH to HTTPS format
        if url.startswith("git@github.com:"):
            url = url.replace("git@github.com:", "https://github.com/").rstrip(".git")
        return url.rstrip(".git")
    except Exception:
        return "https://github.com/OWNER/REPO"


def create_ci_bug(run_id, failed_jobs, branch):
    """Create a bug in Linear for the CI failure (idempotent)."""
    repo_url = get_repo_url()
    title = f"[CI-BRIDGE] CI failed on {branch}"
    description = f"""## CI Failure Report

**Run ID**: {run_id}
**Branch**: `{branch}`
**Failed jobs**: {', '.join(failed_jobs) if failed_jobs else 'unknown'}

[View run on GitHub]({repo_url}/actions/runs/{run_id})
"""

    # Check for existing open bridge issue (idempotent — no duplicates)
    existing = _query("""
        query {
            issueSearch(query: "[CI-BRIDGE] state:started,unstarted", first: 1) {
                nodes { id identifier }
            }
        }
    """)
    nodes = existing.get("data", {}).get("issueSearch", {}).get("nodes", [])

    if nodes:
        # Add comment to existing issue instead of creating duplicate
        issue_id = nodes[0]["identifier"]
        add_comment(
            issue_id,
            f"CI failed again on `{branch}`\n\n**Jobs**: {', '.join(failed_jobs)}\n\n"
            f"[Run {run_id}]({repo_url}/actions/runs/{run_id})"
        )
        print(f"Updated existing issue {issue_id}")
    else:
        # Create new bug issue
        _query("""
            mutation($title: String!, $description: String!) {
                issueCreate(input: {
                    title: $title
                    description: $description
                    teamId: "REPLACE_WITH_TEAM_ID"
                    priority: 1
                }) {
                    success
                    issue { identifier url }
                }
            }
        """, {"title": title, "description": description})
        print(f"Created new CI bridge issue: {title}")


def main():
    if len(sys.argv) < 2:
        print(__doc__.strip())
        sys.exit(1)

    run_id = sys.argv[1]
    branch = os.environ.get("GITHUB_HEAD_REF", "unknown")
    failed = get_failed_jobs(run_id)

    if failed:
        print(f"CI failed on {branch}. Failed jobs: {', '.join(failed)}")
        create_ci_bug(run_id, failed, branch)
    else:
        print(f"No failed jobs found for run {run_id}. Creating generic bridge issue.")
        create_ci_bug(run_id, ["unknown"], branch)


if __name__ == "__main__":
    main()
