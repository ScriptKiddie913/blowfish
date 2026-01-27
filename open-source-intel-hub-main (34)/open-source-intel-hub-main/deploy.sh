#!/bin/bash

# ==============================================================================
# OSINT Intelligence Hub - Quick Deployment Script
# ==============================================================================
# This script automates the deployment setup process
# Run with: bash deploy.sh
# ==============================================================================

set -e  # Exit on error

echo "=============================================="
echo "🚀 OSINT Intelligence Hub - Deployment Setup"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo "Creating .env from template..."
    cp .env.example .env
    echo -e "${GREEN}✓${NC} Created .env file"
    echo ""
    echo -e "${RED}IMPORTANT: Edit .env file with your actual API keys!${NC}"
    echo "Press Enter to continue after editing .env..."
    read
fi

# Check Node.js
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found!${NC}"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node --version) found"

# Check npm
echo "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} npm $(npm --version) found"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install
echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Check Supabase CLI
echo "Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found${NC}"
    echo "Installing Supabase CLI..."
    npm install -g supabase
    echo -e "${GREEN}✓${NC} Supabase CLI installed"
else
    echo -e "${GREEN}✓${NC} Supabase CLI found"
fi
echo ""

# Check if linked to Supabase project
echo "Checking Supabase project link..."
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠️  Not linked to Supabase project${NC}"
    echo "Please run: supabase link --project-ref your-project-ref"
    echo ""
    read -p "Enter your Supabase project ref: " project_ref
    supabase link --project-ref "$project_ref"
fi
echo -e "${GREEN}✓${NC} Linked to Supabase project"
echo ""

# Deploy Edge Functions
echo "Do you want to deploy Supabase Edge Functions? (y/n)"
read -p "> " deploy_functions

if [ "$deploy_functions" = "y" ]; then
    echo "Deploying Edge Functions..."
    supabase functions deploy threat-intel
    supabase functions deploy phoenix-chat
    supabase functions deploy phoenix-osint-analysis
    supabase functions deploy leaked-credentials-search
    supabase functions deploy threat-sync
    supabase functions deploy send-report
    echo -e "${GREEN}✓${NC} Edge Functions deployed"
    echo ""
fi

# Set Supabase Secrets
echo "Do you want to set Supabase Edge Function secrets? (y/n)"
read -p "> " set_secrets

if [ "$set_secrets" = "y" ]; then
    echo ""
    echo "Setting Supabase secrets..."
    echo "Note: You'll need to enter your API keys"
    echo ""
    
    read -p "Enter VIRUSTOTAL_API_KEY: " vt_key
    supabase secrets set VIRUSTOTAL_API_KEY="$vt_key"
    supabase secrets set VITE_VIRUSTOTAL_API_KEY="$vt_key"
    
    read -p "Enter PERPLEXITY_API_KEY: " perplexity_key
    supabase secrets set PERPLEXITY_API_KEY="$perplexity_key"
    supabase secrets set VITE_PERPLEXITY_API_KEY="$perplexity_key"
    
    read -p "Enter NEON_DB_PASSWORD: " neon_pass
    supabase secrets set NEON_DB_PASSWORD="$neon_pass"
    
    read -p "Enter NEON_DB_HOST: " neon_host
    supabase secrets set NEON_DB_HOST="$neon_host"
    
    supabase secrets set NEON_DB_USER="neondb_owner"
    supabase secrets set NEON_DB_NAME="neondb"
    supabase secrets set NEON_DB_PORT="5432"
    
    echo -e "${GREEN}✓${NC} Secrets configured"
    echo ""
    
    echo "Verifying secrets..."
    supabase secrets list
    echo ""
fi

# Build for production
echo "Building for production..."
npm run build
echo -e "${GREEN}✓${NC} Build completed"
echo ""

# Summary
echo "=============================================="
echo -e "${GREEN}✓ Deployment Setup Complete!${NC}"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Deploy to Vercel: vercel --prod"
echo "   Or Netlify: netlify deploy --prod --dir=dist"
echo ""
echo "Important reminders:"
echo "- Ensure all API keys in .env are valid"
echo "- Configure custom domain in your hosting platform"
echo "- Set up monitoring and error tracking"
echo "- Review DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "- DEPLOYMENT_GUIDE.md - Complete deployment guide"
echo "- SUPABASE_SETUP.md - Supabase configuration"
echo "- SECURITY.md - Security best practices"
echo ""
