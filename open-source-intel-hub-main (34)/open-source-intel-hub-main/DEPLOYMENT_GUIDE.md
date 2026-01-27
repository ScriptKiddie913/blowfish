# 🚀 Deployment Guide - OSINT Intelligence Hub

## Pre-Deployment Checklist

Before deploying your application, complete these steps:

### ✅ Step 1: Rotate ALL Exposed API Keys

**CRITICAL**: The following API keys were found in the repository and MUST be rotated:

```bash
# These keys are COMPROMISED - Generate new ones immediately:
❌ VirusTotal API Key
❌ Groq API Key  
❌ Perplexity API Keys (2 instances)
❌ NVD API Key
❌ AbuseIPDB API Key
❌ Neon Database Password
❌ Supabase Keys (if exposed)
```

### ✅ Step 2: Configure Frontend Environment Variables

```bash
# Copy the template
cp .env.example .env

# Edit .env with your NEW API keys
nano .env  # or use your preferred editor
```

**Required Variables** (Application won't start without these):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_new_anon_key
VITE_VIRUSTOTAL_API_KEY=your_new_virustotal_key
VITE_GROQ_API_KEY=your_new_groq_key
VITE_PERPLEXITY_API_KEY=your_new_perplexity_key
VITE_NVD_API_KEY=your_new_nvd_key
VITE_ABUSEIPDB_API_KEY=your_new_abuseipdb_key
```

### ✅ Step 3: Configure Supabase Edge Function Secrets

Edge functions need their own environment variables set in Supabase:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set required secrets for edge functions
supabase secrets set VIRUSTOTAL_API_KEY=your_new_key
supabase secrets set VITE_VIRUSTOTAL_API_KEY=your_new_key
supabase secrets set PERPLEXITY_API_KEY=your_new_key
supabase secrets set VITE_PERPLEXITY_API_KEY=your_new_key

# Set Neon DB credentials for leaked credentials search
supabase secrets set NEON_DB_USER=neondb_owner
supabase secrets set NEON_DB_PASSWORD=your_new_password
supabase secrets set NEON_DB_NAME=neondb
supabase secrets set NEON_DB_HOST=your-neon-host.neon.tech
supabase secrets set NEON_DB_PORT=5432

# Verify all secrets are set
supabase secrets list
```

### ✅ Step 4: Deploy Supabase Edge Functions

```bash
# Deploy all edge functions
supabase functions deploy threat-intel
supabase functions deploy phoenix-chat
supabase functions deploy phoenix-osint-analysis
supabase functions deploy leaked-credentials-search
supabase functions deploy threat-sync
supabase functions deploy send-report

# Verify deployments
supabase functions list
```

### ✅ Step 5: Configure Supabase Database

Ensure your Supabase database has all required tables:

```sql
-- User management tables
user_roles
profiles
admin_messages

-- Monitoring & alerts
monitoring_items
monitoring_alerts
search_history

-- Threat intelligence
leaked_credentials (if using Neon DB, this might be external)
threat_data
cve_data
```

**Enable Row Level Security (RLS):**
- Navigate to: Supabase Dashboard → Authentication → Policies
- Enable RLS for all tables
- Create appropriate policies for user access

### ✅ Step 6: Test Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test in browser
# Open http://localhost:5173
```

**Test these features:**
- [ ] User authentication (sign up / sign in)
- [ ] Threat intelligence search (IP, domain, etc.)
- [ ] Phoenix Chat (AI assistant)
- [ ] Leaked credentials search
- [ ] CVE vulnerability search
- [ ] Dashboard loads without errors

---

## Deployment Options

### Option 1: Vercel (Recommended)

**Best for**: Quick deployment, automatic scaling, edge optimization

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Project Settings → Environment Variables
```

**Environment Variables to Set in Vercel:**
- All `VITE_*` variables from your `.env` file
- Set for Production, Preview, and Development environments

**Vercel Configuration** (vercel.json):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Option 2: Netlify

**Best for**: Simple deployment, built-in forms, good for static sites

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables
netlify env:set VITE_SUPABASE_URL "your_value"
netlify env:set VITE_SUPABASE_ANON_KEY "your_value"
# ... repeat for all VITE_* variables
```

### Option 3: Docker + Cloud Provider

**Best for**: Full control, custom infrastructure

**Create Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Deploy to Cloud:**
```bash
# Build Docker image
docker build -t osint-hub .

# Deploy to AWS/GCP/Azure/DigitalOcean
# (Follow provider-specific instructions)
```

### Option 4: Static Hosting (AWS S3, Cloudflare Pages, GitHub Pages)

```bash
# Build for production
npm run build

# Upload 'dist' folder to your static hosting provider
```

---

## Post-Deployment Steps

### ✅ Step 1: Configure Production URLs

Update these settings in your deployment platform:

1. **Supabase Dashboard** → Authentication → URL Configuration:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: Add your production domain

2. **CORS Configuration**:
   - Update allowed origins in Supabase edge functions
   - Update CORS headers in vercel.json if needed

### ✅ Step 2: Enable HTTPS

- **Vercel/Netlify**: Automatic SSL
- **Custom Domain**: Set up SSL certificate (Let's Encrypt recommended)

### ✅ Step 3: Configure Custom Domain

**Vercel:**
```bash
vercel domains add your-domain.com
```

**Netlify:**
- Dashboard → Domain Settings → Add custom domain

### ✅ Step 4: Set Up Monitoring

1. **Error Tracking**: 
   - Add Sentry: `npm install @sentry/react`
   - Configure in `main.tsx`

2. **Analytics**:
   - Google Analytics
   - Plausible (privacy-friendly)

3. **Performance Monitoring**:
   - Vercel Analytics (automatic)
   - Lighthouse CI

### ✅ Step 5: Configure Rate Limiting

**For API endpoints:**
- Use Cloudflare rate limiting
- Or implement in Supabase Edge Functions
- Consider adding Upstash Redis for rate limit tracking

---

## Environment-Specific Configuration

### Development Environment
```env
VITE_SUPABASE_URL=http://localhost:54321
# Use local Supabase instance
```

### Staging Environment
```env
VITE_SUPABASE_URL=https://staging-project.supabase.co
# Use separate Supabase project for staging
```

### Production Environment
```env
VITE_SUPABASE_URL=https://production-project.supabase.co
# Use production Supabase project
# All API keys should be production-grade
```

---

## Security Best Practices for Production

### ✅ Enable Security Headers

Add to your hosting configuration:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### ✅ API Key Rotation Schedule

- **Every 90 days**: Rotate all API keys
- **Immediately**: If keys are suspected to be compromised
- **Use different keys**: For dev/staging/production

### ✅ Monitor API Usage

Set up alerts for:
- Unusual API call patterns
- Rate limit exceeded
- Authentication failures
- Database errors

### ✅ Backup Strategy

- **Database**: Daily automated backups via Supabase
- **Configuration**: Store infrastructure as code (Terraform/Pulumi)
- **Secrets**: Use secret management service (AWS Secrets Manager, Vault)

---

## Troubleshooting Deployment Issues

### Issue: "Missing environment variables"
**Solution**: Verify all VITE_* variables are set in your hosting platform

### Issue: "Supabase connection failed"
**Solution**: 
- Check VITE_SUPABASE_URL is correct
- Verify VITE_SUPABASE_ANON_KEY is valid
- Ensure Supabase project is not paused

### Issue: "Edge functions not working"
**Solution**:
- Run `supabase secrets list` to verify secrets are set
- Check function logs: `supabase functions logs <function-name>`
- Verify CORS headers are configured

### Issue: "API calls returning 401/403"
**Solution**:
- Verify API keys are correctly set
- Check if API keys have proper permissions
- Ensure keys are not expired or rate-limited

### Issue: "Database queries failing"
**Solution**:
- Check Supabase RLS policies
- Verify user authentication
- Check database connection in Supabase dashboard

---

## Performance Optimization

### 1. Enable Caching
```typescript
// Already implemented in lib/database.ts
// Verify cache TTL settings are appropriate
```

### 2. Code Splitting
```typescript
// Already implemented with React.lazy()
// Verify all large components are lazy-loaded
```

### 3. Image Optimization
- Use WebP format
- Implement lazy loading for images
- Use CDN for static assets

### 4. API Request Optimization
- Batch similar requests
- Implement request deduplication
- Use Supabase realtime subscriptions where appropriate

---

## Scaling Considerations

### Database Scaling (Supabase)
- **Free tier**: Up to 500MB
- **Pro tier**: Up to 8GB, better performance
- **Team tier**: 100GB+ with dedicated resources

### Edge Function Scaling
- Automatically scales with Deno Deploy
- Monitor execution time and optimize long-running functions
- Consider caching frequently accessed data

### Frontend Scaling
- Use CDN (Vercel Edge Network, Cloudflare)
- Enable gzip/brotli compression
- Implement service workers for offline support

---

## Maintenance Checklist

### Weekly
- [ ] Review error logs
- [ ] Check API usage metrics
- [ ] Monitor database size

### Monthly
- [ ] Review and optimize slow queries
- [ ] Update dependencies: `npm update`
- [ ] Review security advisories: `npm audit`

### Quarterly
- [ ] Rotate all API keys
- [ ] Review and update documentation
- [ ] Performance audit with Lighthouse
- [ ] Security audit with npm audit
- [ ] Database cleanup and optimization

---

## Support & Resources

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Supabase Docs**: https://supabase.com/docs
- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev

- **Security Guide**: [SECURITY.md](SECURITY.md)
- **API Documentation**: Check individual service documentation
- **Troubleshooting**: [SECURITY_AUDIT.md](SECURITY_AUDIT.md)

---

## Quick Deploy Commands

```bash
# One-line deployment (after configuration)

# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist

# Manual (build + upload)
npm run build && rsync -avz dist/ user@server:/var/www/html/
```

---

**Last Updated**: January 27, 2026  
**Status**: Ready for deployment after key rotation  
**Next Steps**: Follow checklist above sequentially
