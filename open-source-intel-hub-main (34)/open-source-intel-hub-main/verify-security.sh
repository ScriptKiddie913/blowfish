#!/bin/bash
# Security Verification Script
# Run this script to verify all security fixes are in place

echo "🔒 Security Verification Check"
echo "=============================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Check 1: .env file protection
echo "📋 Check 1: .env file in .gitignore"
if grep -q "^\.env$" .gitignore; then
    echo -e "${GREEN}✓ PASS${NC} - .env is in .gitignore"
else
    echo -e "${RED}✗ FAIL${NC} - .env is NOT in .gitignore"
    FAILED=$((FAILED + 1))
fi
echo ""

# Check 2: .env.example exists
echo "📋 Check 2: .env.example template exists"
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓ PASS${NC} - .env.example template found"
else
    echo -e "${RED}✗ FAIL${NC} - .env.example template missing"
    FAILED=$((FAILED + 1))
fi
echo ""

# Check 3: No hardcoded API keys in source
echo "📋 Check 3: No hardcoded secrets in source code"
if grep -r "pplx-[A-Za-z0-9]\{48\}\|gsk_[A-Za-z0-9]\{48\}\|npg_[A-Za-z0-9]\{12\}" src/ supabase/functions/ 2>/dev/null | grep -v ".md" | grep -v "Binary"; then
    echo -e "${RED}✗ FAIL${NC} - Found hardcoded secrets in source!"
    FAILED=$((FAILED + 1))
else
    echo -e "${GREEN}✓ PASS${NC} - No hardcoded secrets found in source"
fi
echo ""

# Check 4: Security utilities exist
echo "📋 Check 4: Security utilities exist"
if [ -f "src/lib/securityUtils.ts" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Security utilities found"
else
    echo -e "${RED}✗ FAIL${NC} - Security utilities missing"
    FAILED=$((FAILED + 1))
fi
echo ""

# Check 5: Environment variable validation
echo "📋 Check 5: Environment variable validation in client.ts"
if grep -q "throw new Error" src/integrations/supabase/client.ts; then
    echo -e "${GREEN}✓ PASS${NC} - Environment validation present"
else
    echo -e "${YELLOW}⚠ WARN${NC} - Environment validation might be missing"
fi
echo ""

# Check 6: Documentation exists
echo "📋 Check 6: Security documentation"
DOCS=("SECURITY.md" "SECURITY_AUDIT.md" "QUICKSTART_SECURITY.md")
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✓${NC} $doc exists"
    else
        echo -e "${RED}✗${NC} $doc missing"
        FAILED=$((FAILED + 1))
    fi
done
echo ""

# Check 7: .env file has placeholder values
echo "📋 Check 7: .env file status"
if [ -f ".env" ]; then
    if grep -q "your_.*_key\|YOUR_.*_KEY\|your-.*-key" .env; then
        echo -e "${YELLOW}⚠ WARN${NC} - .env has placeholder values (replace with real keys)"
    else
        echo -e "${GREEN}✓ INFO${NC} - .env file exists (verify keys are correct)"
    fi
else
    echo -e "${RED}✗ FAIL${NC} - .env file missing (copy from .env.example)"
    FAILED=$((FAILED + 1))
fi
echo ""

# Check 8: Test for exposed secrets in git
echo "📋 Check 8: Git status check"
if git status 2>/dev/null | grep -q ".env$"; then
    echo -e "${RED}✗ FAIL${NC} - .env file is tracked by git!"
    echo "  Run: git rm --cached .env"
    FAILED=$((FAILED + 1))
else
    echo -e "${GREEN}✓ PASS${NC} - .env is not tracked by git"
fi
echo ""

# Summary
echo "=============================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED${NC}"
    echo ""
    echo "⚠️  IMPORTANT REMINDERS:"
    echo "  1. Rotate all exposed API keys before deployment"
    echo "  2. Set Supabase Edge Function secrets"
    echo "  3. Configure production environment variables"
    echo "  4. Review SECURITY.md for best practices"
    exit 0
else
    echo -e "${RED}✗ $FAILED CHECK(S) FAILED${NC}"
    echo ""
    echo "Please fix the issues above before deploying."
    echo "See SECURITY.md and QUICKSTART_SECURITY.md for help."
    exit 1
fi
