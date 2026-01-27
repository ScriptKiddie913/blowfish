# 🗄️ Supabase Setup Guide

Complete guide to setting up Supabase for the OSINT Intelligence Hub.

---

## Prerequisites

- Supabase account: https://supabase.com
- Supabase CLI installed: `npm install -g supabase`
- Git installed

---

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in details:
   - **Name**: osint-intel-hub
   - **Database Password**: (generate strong password - save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for project to be created (~2 minutes)

---

## Step 2: Get Project Credentials

1. Go to **Project Settings** → **API**
2. Copy these values to your `.env` file:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_SUPABASE_PROJECT_ID=xxxxx
```

---

## Step 3: Run Database Migrations

### Option A: Using Supabase CLI (Recommended)

```bash
# Navigate to your project
cd /path/to/osint-intel-hub

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Verify tables were created
supabase db ls
```

### Option B: Using SQL Editor in Dashboard

1. Go to **SQL Editor** in Supabase Dashboard
2. Create the following tables:

**User Roles Table:**
```sql
-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'soc', 'admin')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own role
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can manage all roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

**Profiles Table:**
```sql
-- User profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view and update own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Admin Messages Table:**
```sql
-- Admin messages table
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own messages
CREATE POLICY "Users can view own messages" ON public.admin_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can send messages
CREATE POLICY "Admins can send messages" ON public.admin_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

**Monitoring Tables:**
```sql
-- Monitoring items table
CREATE TABLE IF NOT EXISTS public.monitoring_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_value TEXT NOT NULL,
  threshold JSONB,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_checked TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.monitoring_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own monitoring items" ON public.monitoring_items
  FOR ALL USING (auth.uid() = user_id);

-- Monitoring alerts table
CREATE TABLE IF NOT EXISTS public.monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monitoring_item_id UUID REFERENCES public.monitoring_items(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  alert_data JSONB,
  severity TEXT CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON public.monitoring_alerts
  FOR SELECT USING (auth.uid() = user_id);
```

**Search History Table:**
```sql
-- Search history table
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_type TEXT NOT NULL,
  search_query TEXT NOT NULL,
  results_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own search history" ON public.search_history
  FOR ALL USING (auth.uid() = user_id);
```

---

## Step 4: Deploy Edge Functions

```bash
# Make sure you're in the project directory
cd /path/to/osint-intel-hub

# Deploy individual functions
supabase functions deploy threat-intel
supabase functions deploy phoenix-chat
supabase functions deploy phoenix-osint-analysis
supabase functions deploy leaked-credentials-search
supabase functions deploy threat-sync
supabase functions deploy send-report

# Or deploy all at once
supabase functions deploy
```

---

## Step 5: Set Edge Function Secrets

```bash
# Required secrets for edge functions
supabase secrets set VIRUSTOTAL_API_KEY="your_new_virustotal_key"
supabase secrets set VITE_VIRUSTOTAL_API_KEY="your_new_virustotal_key"
supabase secrets set PERPLEXITY_API_KEY="your_new_perplexity_key"
supabase secrets set VITE_PERPLEXITY_API_KEY="your_new_perplexity_key"

# Neon DB credentials (for leaked credentials)
supabase secrets set NEON_DB_USER="neondb_owner"
supabase secrets set NEON_DB_PASSWORD="your_new_neon_password"
supabase secrets set NEON_DB_NAME="neondb"
supabase secrets set NEON_DB_HOST="your-neon-host.neon.tech"
supabase secrets set NEON_DB_PORT="5432"

# Verify secrets are set
supabase secrets list
```

---

## Step 6: Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure email settings:
   - Enable email confirmations
   - Set confirmation URL: `https://your-domain.com/auth/callback`
3. Configure OAuth providers (optional):
   - GitHub
   - Google
   - etc.

---

## Step 7: Configure Storage (Optional)

If your app needs file storage:

1. Go to **Storage**
2. Create a bucket: `user-uploads`
3. Set bucket policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own files
CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## Step 8: Set Up Realtime (Optional)

Enable realtime for tables that need live updates:

```sql
-- Enable realtime for monitoring alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.monitoring_alerts;

-- Enable realtime for admin messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_messages;
```

---

## Step 9: Configure Rate Limiting

In Supabase Dashboard → **Database** → **Extensions**:

Enable `pg_cron` for scheduled tasks:
```sql
-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup of old data
SELECT cron.schedule(
  'cleanup-old-search-history',
  '0 0 * * *', -- Run daily at midnight
  $$
    DELETE FROM public.search_history
    WHERE created_at < NOW() - INTERVAL '90 days'
  $$
);
```

---

## Step 10: Verify Setup

### Check Tables
```bash
supabase db ls
```

Should show:
- user_roles
- profiles
- admin_messages
- monitoring_items
- monitoring_alerts
- search_history

### Check Edge Functions
```bash
supabase functions list
```

Should show all deployed functions.

### Check Secrets
```bash
supabase secrets list
```

Should show all required secrets (values hidden).

### Test Database Connection

```bash
# Test query
supabase db query "SELECT COUNT(*) FROM public.user_roles;"
```

---

## Troubleshooting

### Issue: "Project ref not found"
```bash
# Re-link your project
supabase link --project-ref your-project-ref
```

### Issue: "Permission denied" on RLS
- Check RLS policies are created correctly
- Verify user is authenticated
- Test policies in SQL Editor

### Issue: "Edge function not responding"
```bash
# Check function logs
supabase functions logs threat-intel --tail

# Redeploy function
supabase functions deploy threat-intel
```

### Issue: "Secrets not working"
```bash
# List secrets
supabase secrets list

# Re-set secret
supabase secrets set KEY_NAME="new_value"
```

---

## Useful Supabase CLI Commands

```bash
# Start local Supabase (for development)
supabase start

# Stop local Supabase
supabase stop

# View local dashboard
supabase status

# Run migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > src/integrations/supabase/types.ts

# View function logs
supabase functions logs <function-name>

# Delete a function
supabase functions delete <function-name>

# Database backup
supabase db dump -f backup.sql
```

---

## Security Best Practices

1. **Enable RLS on all tables**
   - Never disable RLS in production
   - Test policies thoroughly

2. **Use service role key carefully**
   - Only use in edge functions
   - Never expose to frontend

3. **Rotate secrets regularly**
   - Every 90 days minimum
   - Immediately if compromised

4. **Monitor usage**
   - Set up billing alerts
   - Monitor API usage in dashboard

5. **Backup regularly**
   - Supabase does automatic backups
   - Keep local backups for critical data

---

## Next Steps

1. ✅ Complete this Supabase setup
2. ✅ Configure frontend `.env` file
3. ✅ Test locally with `npm run dev`
4. ✅ Deploy to production (see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md))

---

**Documentation**: https://supabase.com/docs  
**Support**: https://supabase.com/support  
**Status**: https://status.supabase.com
