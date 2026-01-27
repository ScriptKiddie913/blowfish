# 🚀 Quick Start After Security Audit

## ⚠️ CRITICAL: API Keys Need Rotation

**All API keys found in this repository have been EXPOSED and must be rotated immediately before deployment!**

---

## Step 1: Rotate All API Keys

### Keys That MUST Be Rotated:

1. **VirusTotal**: https://www.virustotal.com/gui/my-apikey
   - Old: `5b1f66e3...` (EXPOSED)
   - Generate new key

2. **Groq**: https://console.groq.com/keys
   - Old: `gsk_fIscX2...` (EXPOSED)
   - Generate new key

3. **Perplexity**: https://www.perplexity.ai/settings/api
   - Old: `pplx-xiNp9Mg3...` and `pplx-g85EJczoz6...` (EXPOSED)
   - Generate new key

4. **NVD**: https://nvd.nist.gov/developers/request-an-api-key
   - Old: `f4a31bb5...` (EXPOSED)
   - Request new key

5. **AbuseIPDB**: https://www.abuseipdb.com/account/api
   - Old: `65ff4439...` (EXPOSED)
   - Generate new key

6. **Neon Database**: https://console.neon.tech
   - Old password: `npg_sMO8u1jAXDRB` (EXPOSED)
   - Reset password

7. **Supabase**: https://supabase.com/dashboard
   - Reset project keys if they were exposed

---

## Step 2: Configure Environment Variables

### Frontend Environment (.env)

```bash
# Copy template
cp .env.example .env

# Edit .env and add your NEW keys
nano .env
```

### Supabase Edge Functions

```bash
# Set secrets for edge functions
supabase secrets set VIRUSTOTAL_API_KEY=your_new_key
supabase secrets set PERPLEXITY_API_KEY=your_new_key
supabase secrets set NEON_DB_PASSWORD=your_new_password
supabase secrets set NEON_DB_HOST=your_db_host
supabase secrets set NEON_DB_USER=neondb_owner
supabase secrets set NEON_DB_NAME=neondb

# Verify secrets are set
supabase secrets list
```

---

## Step 3: Verify Security

```bash
# 1. Check .env is ignored
git status
# .env should NOT appear in untracked files

# 2. If .env is tracked, remove it
git rm --cached .env
git commit -m "Remove .env from tracking"

# 3. Ensure no secrets in code
grep -r "EXPOSED\|pplx-\|gsk_\|npg_" src/
# Should return no results

# 4. Install dependencies
npm install

# 5. Start dev server
npm run dev

# 6. Verify app loads without errors
# Check browser console for any missing env var errors
```

---

## Step 4: Test the Application

1. **Test Authentication**
   - Sign up / Sign in
   - Verify session persistence

2. **Test Threat Intelligence**
   - Search for an IP address
   - Verify VirusTotal integration works

3. **Test AI Features**
   - Use Phoenix Chat
   - Verify Perplexity API works

4. **Test Leaked Credentials**
   - Search leaked credentials
   - Verify database connection works

---

## Step 5: Deploy

```bash
# Build for production
npm run build

# Deploy to your platform
# (Vercel, Netlify, etc.)

# Set environment variables on deployment platform
# Copy all values from .env to platform environment variables
```

---

## 🔒 Security Checklist

- [ ] All API keys rotated
- [ ] `.env` file contains only NEW keys
- [ ] `.env` is in `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] Supabase Edge Function secrets configured
- [ ] Application tested locally with new keys
- [ ] All features working properly
- [ ] Production environment variables set
- [ ] Security documentation reviewed
- [ ] Team aware of security practices

---

## 📚 Documentation

- [`SECURITY.md`](SECURITY.md) - Comprehensive security guide
- [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md) - Detailed audit report
- [`.env.example`](.env.example) - Frontend environment template
- [`supabase/.env.example`](supabase/.env.example) - Edge functions template

---

## 🆘 Troubleshooting

### App won't start

**Error**: "Missing required Supabase environment variables"
- **Fix**: Ensure `.env` file exists and contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### API calls failing

**Error**: "API key not configured"
- **Fix**: Check that API keys are set in `.env` for frontend or Supabase secrets for edge functions

### Database connection failed

**Error**: "Database password not configured"
- **Fix**: Set `NEON_DB_PASSWORD` in Supabase Edge Function secrets

---

## ✅ All Set!

Once you've completed all steps above, your application is secure and ready for production deployment!

**Remember**: Security is an ongoing process. Review the [SECURITY.md](SECURITY.md) file regularly and keep all dependencies updated.

---

**Last Updated**: January 27, 2026  
**Status**: Ready for deployment after key rotation
