#!/bin/bash

# simulate-ci.sh
# Script to simulate the automated test pipeline locally
# Run: ./simulate-ci.sh

set -e

echo "🚀 BordadosApp - Local Test Pipeline"
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

# Frontend tests
echo -e "${YELLOW}📦 Frontend Tests${NC}"
cd app
run_check "Vitest" "npm run test -- --run"
cd ..
echo ""

# Backend tests
echo -e "${YELLOW}🐍 Backend Tests${NC}"
cd api
run_check "pytest" "pytest --tb=short"
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
