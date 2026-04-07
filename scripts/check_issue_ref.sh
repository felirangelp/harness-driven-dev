#!/usr/bin/env bash
#
# check_issue_ref.sh — Git commit-msg hook.
#
# Ensures every commit message contains "Refs DEMO-XXX"
# and does NOT contain "Closes", "Fixes", or "Resolves"
# (which would auto-close issues bypassing the harness gates).
#
# Usage (as commit-msg hook):
#   bash scripts/check_issue_ref.sh "$1"
#
# Where $1 is the path to the commit message file.
#

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

COMMIT_MSG_FILE="${1:-}"

if [ -z "$COMMIT_MSG_FILE" ]; then
    echo -e "${RED}Usage: check_issue_ref.sh <commit-msg-file>${NC}"
    exit 1
fi

if [ ! -f "$COMMIT_MSG_FILE" ]; then
    echo -e "${RED}File not found: $COMMIT_MSG_FILE${NC}"
    exit 1
fi

COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# ── Check 1: Must have "Refs DEMO-XXX" ──

if ! echo "$COMMIT_MSG" | grep -qiE 'Refs [A-Z]+-[0-9]+'; then
    echo ""
    echo -e "${RED}BLOCKED: Commit message must contain 'Refs DEMO-XXX'${NC}"
    echo ""
    echo "  Your message:"
    echo "    $COMMIT_MSG"
    echo ""
    echo -e "${YELLOW}  Fix: Add a reference to the Linear issue, e.g.:${NC}"
    echo "    git commit -m \"Add dark mode toggle"
    echo ""
    echo "    Refs DEMO-1\""
    echo ""
    exit 1
fi

# ── Check 2: Must NOT have "Closes/Fixes/Resolves" ──

if echo "$COMMIT_MSG" | grep -qiE '(Closes|Fixes|Resolves)\s+[A-Z]+-[0-9]+'; then
    echo ""
    echo -e "${RED}BLOCKED: Do not use 'Closes/Fixes/Resolves' keywords${NC}"
    echo ""
    echo "  These keywords auto-close issues and bypass harness gates."
    echo -e "${YELLOW}  Fix: Use 'Refs' instead of 'Closes/Fixes/Resolves'.${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}Issue reference OK${NC}"
exit 0
