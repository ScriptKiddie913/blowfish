# Security Verification Script (PowerShell)
# Run this script to verify all security fixes are in place

Write-Host "Security Verification Check" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

$FAILED = 0

# Check 1: .env file protection
Write-Host "Check 1: .env file in .gitignore"
if (Select-String -Path ".gitignore" -Pattern "^\.env$" -Quiet) {
    Write-Host "✓ PASS - .env is in .gitignore" -ForegroundColor Green
} else {
    Write-Host "✗ FAIL - .env is NOT in .gitignore" -ForegroundColor Red
    $FAILED++
}
Write-Host ""

# Check 2: .env.example exists
Write-Host "Check 2: .env.example template exists"
if (Test-Path ".env.example") {
    Write-Host "✓ PASS - .env.example template found" -ForegroundColor Green
} else {
    Write-Host "✗ FAIL - .env.example template missing" -ForegroundColor Red
    $FAILED++
}
Write-Host ""

# Check 3: No hardcoded API keys in source
Write-Host "Check 3: No hardcoded secrets in source code"
$secrets = Get-ChildItem -Path "src","supabase\functions" -Recurse -Include "*.ts","*.tsx" -ErrorAction SilentlyContinue | 
    Select-String -Pattern "pplx-[A-Za-z0-9]{48}|gsk_[A-Za-z0-9]{48}|npg_[A-Za-z0-9]{12}" -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -notmatch "\.md$" }

if ($secrets) {
    Write-Host "✗ FAIL - Found hardcoded secrets in source!" -ForegroundColor Red
    $secrets | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    $FAILED++
} else {
    Write-Host "✓ PASS - No hardcoded secrets found in source" -ForegroundColor Green
}
Write-Host ""

# Check 4: Security utilities exist
Write-Host "Check 4: Security utilities exist"
if (Test-Path "src\lib\securityUtils.ts") {
    Write-Host "✓ PASS - Security utilities found" -ForegroundColor Green
} else {
    Write-Host "✗ FAIL - Security utilities missing" -ForegroundColor Red
    $FAILED++
}
Write-Host ""

# Check 5: Environment variable validation
Write-Host "Check 5: Environment variable validation in client.ts"
if (Select-String -Path "src\integrations\supabase\client.ts" -Pattern "throw new Error" -Quiet) {
    Write-Host "✓ PASS - Environment validation present" -ForegroundColor Green
} else {
    Write-Host "⚠ WARN - Environment validation might be missing" -ForegroundColor Yellow
}
Write-Host ""

# Check 6: Documentation exists
Write-Host "Check 6: Security documentation"
$docs = @("SECURITY.md", "SECURITY_AUDIT.md", "QUICKSTART_SECURITY.md", "SECURITY_FIXES_SUMMARY.md")
foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "✓ $doc exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $doc missing" -ForegroundColor Red
        $FAILED++
    }
}
Write-Host ""

# Check 7: .env file status
Write-Host "Check 7: .env file status"
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "your_.*_key|YOUR_.*_KEY|your-.*-key") {
        Write-Host "⚠ WARN - .env has placeholder values (replace with real keys)" -ForegroundColor Yellow
    } else {
        Write-Host "✓ INFO - .env file exists (verify keys are correct)" -ForegroundColor Green
    }
} else {
    Write-Host "✗ FAIL - .env file missing (copy from .env.example)" -ForegroundColor Red
    $FAILED++
}
Write-Host ""

# Check 8: Git status check
Write-Host "Check 8: Git status check"
try {
    $gitStatus = git status 2>&1
    if ($gitStatus -match "\.env$") {
        Write-Host "✗ FAIL - .env file is tracked by git!" -ForegroundColor Red
        Write-Host "  Run: git rm --cached .env" -ForegroundColor Yellow
        $FAILED++
    } else {
        Write-Host "✓ PASS - .env is not tracked by git" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ WARN - Unable to check git status" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "==============================" -ForegroundColor Cyan
if ($FAILED -eq 0) {
    Write-Host "✓ ALL CHECKS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT REMINDERS:" -ForegroundColor Yellow
    Write-Host "  1. Rotate all exposed API keys before deployment"
    Write-Host "  2. Set Supabase Edge Function secrets"
    Write-Host "  3. Configure production environment variables"
    Write-Host "  4. Review SECURITY.md for best practices"
    exit 0
} else {
    Write-Host "✗ $FAILED CHECK(S) FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the issues above before deploying."
    Write-Host "See SECURITY.md and QUICKSTART_SECURITY.md for help."
    exit 1
}
