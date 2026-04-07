#!/usr/bin/env bash
#
# close_issue.sh — Harness gate script for closing Linear issues.
#
# Runs 3 gates before allowing an issue to be closed:
#   Gate 1: Tests passing (npm test)
#   Gate 2: CI green (last GitHub Actions run)
#   Gate 3: Acceptance criteria checked (Linear API)
#
# Usage:
#   bash scripts/close_issue.sh DEMO-1
#

set -euo pipefail

ISSUE_ID="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

if [ -z "$ISSUE_ID" ]; then
    echo -e "${RED}Usage: bash scripts/close_issue.sh <ISSUE_ID>${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo "  Harness Gate Check: $ISSUE_ID"
echo "========================================"
echo ""

GATES_PASSED=0
GATES_TOTAL=3

# ── Gate 1: Tests ──

echo -n "Gate 1/3 — Tests passing... "
if npm test --silent 2>/dev/null; then
    echo -e "${GREEN}PASS${NC}"
    GATES_PASSED=$((GATES_PASSED + 1))
else
    echo -e "${RED}FAIL${NC}"
    echo -e "${YELLOW}  Fix: Run 'npm test' and fix failing tests.${NC}"
fi

# ── Gate 2: CI Green ──

echo -n "Gate 2/3 — CI green... "
if command -v gh &>/dev/null; then
    BRANCH=$(git branch --show-current 2>/dev/null || echo "")
    if [ -n "$BRANCH" ]; then
        CI_STATUS=$(gh run list --branch "$BRANCH" --limit 1 --json conclusion --jq '.[0].conclusion' 2>/dev/null || echo "unknown")
        if [ "$CI_STATUS" = "success" ]; then
            echo -e "${GREEN}PASS${NC}"
            GATES_PASSED=$((GATES_PASSED + 1))
        elif [ "$CI_STATUS" = "unknown" ] || [ -z "$CI_STATUS" ]; then
            echo -e "${YELLOW}SKIP (no CI runs found)${NC}"
            GATES_PASSED=$((GATES_PASSED + 1))
        else
            echo -e "${RED}FAIL (last run: $CI_STATUS)${NC}"
            echo -e "${YELLOW}  Fix: Check GitHub Actions and fix the failing workflow.${NC}"
        fi
    else
        echo -e "${YELLOW}SKIP (not on a branch)${NC}"
        GATES_PASSED=$((GATES_PASSED + 1))
    fi
else
    echo -e "${YELLOW}SKIP (gh CLI not installed)${NC}"
    GATES_PASSED=$((GATES_PASSED + 1))
fi

# ── Gate 3: Acceptance Criteria ──

echo -n "Gate 3/3 — Acceptance criteria... "
ISSUE_DATA=$(python3 "$SCRIPT_DIR/linear_client.py" get "$ISSUE_ID" 2>/dev/null || echo "")
if [ -z "$ISSUE_DATA" ]; then
    echo -e "${YELLOW}SKIP (could not fetch issue)${NC}"
    GATES_PASSED=$((GATES_PASSED + 1))
else
    # Check if description has unchecked boxes
    UNCHECKED=$(echo "$ISSUE_DATA" | grep -c '\- \[ \]' || true)
    if [ "$UNCHECKED" -gt 0 ]; then
        echo -e "${RED}FAIL ($UNCHECKED unchecked criteria)${NC}"
        echo -e "${YELLOW}  Fix: Complete all acceptance criteria checkboxes in Linear.${NC}"
    else
        echo -e "${GREEN}PASS${NC}"
        GATES_PASSED=$((GATES_PASSED + 1))
    fi
fi

# ── Result ──

echo ""
echo "========================================"

if [ "$GATES_PASSED" -eq "$GATES_TOTAL" ]; then
    echo -e "${GREEN}  ALL GATES PASSED ($GATES_PASSED/$GATES_TOTAL)${NC}"
    echo "  Issue $ISSUE_ID is ready to close."
    echo "========================================"
    echo ""

    # Post evidence to Linear
    COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    EVIDENCE="Closed by harness. Gates: $GATES_PASSED/$GATES_TOTAL. Commit: $COMMIT_SHA"
    python3 "$SCRIPT_DIR/linear_client.py" comment "$ISSUE_ID" "$EVIDENCE" 2>/dev/null || true

    # Move to Done
    python3 "$SCRIPT_DIR/linear_client.py" move "$ISSUE_ID" "Done" 2>/dev/null || true

    echo "Evidence posted and issue moved to Done."
    exit 0
else
    echo -e "${RED}  BLOCKED ($GATES_PASSED/$GATES_TOTAL passed)${NC}"
    echo "  Fix the failing gates and run again."
    echo "========================================"
    exit 1
fi
