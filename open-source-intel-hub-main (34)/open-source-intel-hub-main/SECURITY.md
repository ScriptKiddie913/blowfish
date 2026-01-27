# 🔒 Security Configuration Guide

## ⚠️ CRITICAL SECURITY ISSUES FIXED

This security audit identified and fixed the following critical vulnerabilities:

### 1. ✅ Hardcoded API Keys Removed
- **Issue**: API keys and secrets were hardcoded in source files
- **Fix**: All credentials now loaded from environment variables
- **Files Fixed**: 
  - `src/integrations/supabase/client.ts`
  - `test-credential-search.html`
  - `test-function.html`

### 2. ✅ .env File Protection
- **Issue**: .env file was not in .gitignore and could be committed
- **Fix**: Added comprehensive .env patterns to .gitignore
- **Files Modified**: `.gitignore`

### 3. ✅ XSS Vulnerabilities Fixed
- **Issue**: innerHTML usage without sanitization in test files
- **Fix**: Implemented HTML escaping and safe DOM manipulation
- **Files Fixed**: 
  - `test-credential-search.html`
  - `test-function.html`

### 4. ✅ Input Validation Added
- **Issue**: No input validation for user-provided data
- **Fix**: Created comprehensive security utilities
- **New File**: `src/lib/securityUtils.ts`

## 🔐 Environment Variables Setup

### Step 1: Copy the Template
```bash
cp .env.example .env
```

### Step 2: Fill in Your API Keys

Edit `.env` with your actual credentials:

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here

# Threat Intelligence APIs
VITE_VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
VITE_ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here

# CVE Database
VITE_NVD_API_KEY=your_nvd_api_key_here

# AI/LLM Services
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

### Step 3: Verify .env is Git-Ignored

```bash
git status
# .env should NOT appear in untracked files
```

## 🛡️ Security Best Practices

### API Key Management

1. **Never commit API keys to version control**
   - Always use `.env` files
   - Add `.env*` to `.gitignore`
   - Use `.env.example` as a template

2. **Rotate keys regularly**
   - Change API keys every 90 days
   - Immediately rotate if compromised
   - Use different keys for dev/staging/prod

3. **Limit API key permissions**
   - Use read-only keys where possible
   - Enable IP whitelisting
   - Set up rate limits

### Supabase Edge Functions Security

**Setting Environment Variables for Edge Functions:**

1. **Via Supabase Dashboard**:
   ```
   Project Settings → Edge Functions → Secrets
   ```

2. **Via Supabase CLI**:
   ```bash
   # Set individual secrets
   supabase secrets set VIRUSTOTAL_API_KEY=your_key_here
   supabase secrets set PERPLEXITY_API_KEY=your_key_here
   supabase secrets set NEON_DB_PASSWORD=your_password_here
   
   # List all secrets
   supabase secrets list
   
   # Remove a secret
   supabase secrets unset SECRET_NAME
   ```

3. **Required Edge Function Secrets**:
   - `VIRUSTOTAL_API_KEY` - For threat intelligence
   - `PERPLEXITY_API_KEY` - For AI-powered chat
   - `NEON_DB_PASSWORD` - For leaked credentials database
   - `NEON_DB_HOST` - Database hostname
   - `NEON_DB_USER` - Database username
   - `NEON_DB_NAME` - Database name

See `supabase/.env.example` for complete list.

### Input Validation

All user input should be validated using `src/lib/securityUtils.ts`:

```typescript
import { sanitizeInput, isValidEmail, isValidIP } from '@/lib/securityUtils';

// Sanitize user input
const cleanInput = sanitizeInput(userInput, 500);

// Validate email
if (!isValidEmail(email)) {
  throw new Error('Invalid email format');
}

// Validate IP address
if (!isValidIP(ipAddress)) {
  throw new Error('Invalid IP address');
}
```

### Rate Limiting

Implement rate limiting for API calls:

```typescript
import { RateLimiter } from '@/lib/securityUtils';

const limiter = new RateLimiter(10, 60); // 10 requests per 60 seconds

if (!limiter.isAllowed(userId)) {
  throw new Error('Rate limit exceeded');
}
```

### XSS Prevention

1. **Never use `innerHTML` with user data**
   ```typescript
   // ❌ WRONG
   element.innerHTML = userInput;
   
   // ✅ CORRECT
   element.textContent = userInput;
   // OR
   import { escapeHtml } from '@/lib/securityUtils';
   element.innerHTML = escapeHtml(userInput);
   ```

2. **Use React's built-in XSS protection**
   ```tsx
   // React automatically escapes content
   <div>{userInput}</div>
   ```

3. **Avoid `dangerouslySetInnerHTML`**
   - Only use when absolutely necessary
   - Always sanitize content first

### SQL Injection Prevention

1. **Use parameterized queries**
   ```typescript
   // ✅ CORRECT - Supabase automatically parameterizes
   const { data } = await supabase
     .from('table')
     .select()
     .eq('column', userInput);
   
   // ❌ WRONG - Raw SQL with user input
   const query = `SELECT * FROM table WHERE column = '${userInput}'`;
   ```

2. **Validate database identifiers**
   ```typescript
   import { isValidDatabaseIdentifier } from '@/lib/securityUtils';
   
   if (!isValidDatabaseIdentifier(tableName)) {
     throw new Error('Invalid table name');
   }
   ```

## 🔍 Security Checklist

### Before Deployment

- [ ] All API keys are in `.env` file
- [ ] `.env` is in `.gitignore`
- [ ] No hardcoded secrets in source code
- [ ] Input validation is implemented
- [ ] Rate limiting is configured
- [ ] CORS is properly configured
- [ ] HTTPS is enforced
- [ ] Security headers are set
- [ ] Authentication is required for sensitive endpoints
- [ ] Role-based access control (RBAC) is implemented

### Code Review Checklist

- [ ] No `innerHTML` with user data
- [ ] No `eval()` or `Function()` constructor
- [ ] All user input is validated and sanitized
- [ ] API keys are never logged
- [ ] Errors don't expose sensitive information
- [ ] SQL queries are parameterized
- [ ] File uploads are validated
- [ ] Sessions expire after inactivity
- [ ] Passwords are hashed (never stored plain text)

## 🚨 What to Do If Keys Are Compromised

1. **Immediately rotate all API keys**
   - Supabase: Project Settings → API → Reset anon key
   - VirusTotal: Account → API Key → Regenerate
   - Other services: Follow their key rotation process

2. **Check access logs**
   - Review Supabase logs for suspicious activity
   - Check API usage for anomalies

3. **Update all environments**
   - Update `.env` files in all deployments
   - Restart all services

4. **Audit recent changes**
   - Review git history
   - Check for data breaches

## 🔗 Getting API Keys

### Supabase
1. Visit: https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy `Project URL` and `anon/public` key

### VirusTotal
1. Visit: https://www.virustotal.com/gui/my-apikey
2. Sign up/Login
3. Copy API key from dashboard

### AbuseIPDB
1. Visit: https://www.abuseipdb.com/account/api
2. Create account
3. Generate API key

### NVD (National Vulnerability Database)
1. Visit: https://nvd.nist.gov/developers/request-an-api-key
2. Request API key via email
3. Receive key in email

### Groq
1. Visit: https://console.groq.com/keys
2. Sign up for account
3. Create new API key

### Perplexity
1. Visit: https://www.perplexity.ai/settings/api
2. Sign up for account
3. Generate API key

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [API Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)

## 🛠️ Security Utilities

All security utilities are available in `src/lib/securityUtils.ts`:

- `sanitizeInput()` - Clean user input
- `isValidEmail()` - Validate email format
- `isValidIP()` - Validate IP addresses
- `isValidDomain()` - Validate domain names
- `isValidURL()` - Validate URLs
- `isValidCVE()` - Validate CVE IDs
- `RateLimiter` - Rate limiting class
- `escapeHtml()` - Prevent XSS
- `maskApiKey()` - Safely log API keys
- `safeJSONParse()` - Prevent prototype pollution

## ⚡ Quick Start

1. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Add your API keys to `.env`**

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Verify security**:
   - Check that `.env` is git-ignored
   - Test that app loads with your keys
   - Verify no errors in console

---

**Last Updated**: January 27, 2026  
**Security Audit Date**: January 27, 2026  
**Status**: ✅ All critical vulnerabilities fixed
