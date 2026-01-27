# ==============================================================================
# OSINT Intelligence Hub - Quick Deployment Script (PowerShell)
# ==============================================================================
# This script automates the deployment setup process
# Run with: .\deploy.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "OSINT Intelligence Hub - Deployment Setup" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env from template..."
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] Created .env file" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Edit .env file with your actual API keys!" -ForegroundColor Red
    Write-Host "Press Enter to continue after editing .env..."
    Read-Host
}

# Check Node.js
Write-Host "Checking Node.js installation..."
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org"
    exit 1
}

# Check npm
Write-Host "Checking npm installation..."
try {
    $npmVersion = npm --version
    Write-Host "[OK] npm $npmVersion found" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] npm not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..."
npm install
Write-Host "[OK] Dependencies installed" -ForegroundColor Green
Write-Host ""

# Check Supabase CLI
Write-Host "Checking Supabase CLI..."
try {
    $supabaseVersion = supabase --version 2>$null
    Write-Host "[OK] Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Supabase CLI not found" -ForegroundColor Yellow
    Write-Host "Installing Supabase CLI..."
    npm install -g supabase
    Write-Host "[OK] Supabase CLI installed" -ForegroundColor Green
}
Write-Host ""

# Check if linked to Supabase project
Write-Host "Checking Supabase project link..."
if (-not (Test-Path "supabase\config.toml")) {
    Write-Host "WARNING: Not linked to Supabase project" -ForegroundColor Yellow
    $projectRef = Read-Host "Enter your Supabase project ref"
    supabase link --project-ref $projectRef
}
Write-Host "[OK] Linked to Supabase project" -ForegroundColor Green
Write-Host ""

# Deploy Edge Functions
$deployFunctions = Read-Host "Do you want to deploy Supabase Edge Functions? (y/n)"

if ($deployFunctions -eq "y") {
    Write-Host "Deploying Edge Functions..."
    supabase functions deploy threat-intel
    supabase functions deploy phoenix-chat
    supabase functions deploy phoenix-osint-analysis
    supabase functions deploy leaked-credentials-search
    supabase functions deploy threat-sync
    supabase functions deploy send-report
    Write-Host "[OK] Edge Functions deployed" -ForegroundColor Green
    Write-Host ""
}

# Set Supabase Secrets
$setSecrets = Read-Host "Do you want to set Supabase Edge Function secrets? (y/n)"

if ($setSecrets -eq "y") {
    Write-Host ""
    Write-Host "Setting Supabase secrets..."
    Write-Host "Note: You'll need to enter your API keys"
    Write-Host ""
    
    $vtKey = Read-Host "Enter VIRUSTOTAL_API_KEY"
    supabase secrets set "VIRUSTOTAL_API_KEY=$vtKey"
    supabase secrets set "VITE_VIRUSTOTAL_API_KEY=$vtKey"
    
    $perplexityKey = Read-Host "Enter PERPLEXITY_API_KEY"
    supabase secrets set "PERPLEXITY_API_KEY=$perplexityKey"
    supabase secrets set "VITE_PERPLEXITY_API_KEY=$perplexityKey"
    
    $neonPass = Read-Host "Enter NEON_DB_PASSWORD" -AsSecureString
    $neonPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($neonPass))
    supabase secrets set "NEON_DB_PASSWORD=$neonPassPlain"
    
    $neonHost = Read-Host "Enter NEON_DB_HOST"
    supabase secrets set "NEON_DB_HOST=$neonHost"
    
    supabase secrets set "NEON_DB_USER=neondb_owner"
    supabase secrets set "NEON_DB_NAME=neondb"
    supabase secrets set "NEON_DB_PORT=5432"
    
    Write-Host "[OK] Secrets configured" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Verifying secrets..."
    supabase secrets list
    Write-Host ""
}

# Build for production
Write-Host "Building for production..."
npm run build
Write-Host "[OK] Build completed" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Deployment Setup Complete!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Test locally: npm run dev"
Write-Host "2. Deploy to Vercel: vercel --prod"
Write-Host "   Or Netlify: netlify deploy --prod --dir=dist"
Write-Host ""
Write-Host "Important reminders:"
Write-Host "- Ensure all API keys in .env are valid"
Write-Host "- Configure custom domain in your hosting platform"
Write-Host "- Set up monitoring and error tracking"
Write-Host "- Review DEPLOYMENT_GUIDE.md for detailed instructions"
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Blue
Write-Host "- DEPLOYMENT_GUIDE.md - Complete deployment guide"
Write-Host "- SUPABASE_SETUP.md - Supabase configuration"
Write-Host "- SECURITY.md - Security best practices"
Write-Host ""
