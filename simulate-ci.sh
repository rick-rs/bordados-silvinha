#!/bin/bash

# simulate-ci.sh
# Script to simulate the CI pipeline locally
# Run: ./simulate-ci.sh

set -e

echo "🚀 BordadosApp - Local CI Simulation"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
FAILED=0

run_check() {
    local name=$1
    local command=$2
    
    echo -n "⏳ $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
    else
        echo -e "${RED}❌ FAILED${NC}"
        FAILED=$((FAILED + 1))
        echo "  Command: $command"
    fi
}

# Frontend checks
echo -e "${YELLOW}📦 Frontend Checks${NC}"
cd app
run_check "ESLint" "npm run lint"
run_check "TypeScript Build" "npm run build"
cd ..
echo ""

# Backend checks
echo -e "${YELLOW}🐍 Backend Checks${NC}"
cd api

if command -v black &> /dev/null; then
    run_check "Black (formatting)" "black --check ."
    run_check "isort (imports)" "isort --check-only ."
    run_check "Flake8 (linting)" "flake8 ."
    # run_check "mypy (type checking)" "mypy ."
else
    echo -e "${YELLOW}⚠️  Python tools not installed. Skipping backend checks.${NC}"
    echo "   Run: pip install -r requirements-dev.txt"
fi

cd ..
echo ""

# Summary
echo "===================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED check(s) failed${NC}"
    exit 1
fi
