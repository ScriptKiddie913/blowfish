-- Create tables for Breach Data Management

-- 1. Breach Datasets (The containers)
CREATE TABLE IF NOT EXISTS public.breach_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Breach Entries (The actual data)
CREATE TABLE IF NOT EXISTS public.breach_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES public.breach_datasets(id) ON DELETE CASCADE,
    url TEXT,
    email TEXT,
    password TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Access Requests (SOC requesting access to datasets)
CREATE TABLE IF NOT EXISTS public.breach_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES public.breach_datasets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')) DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(dataset_id, user_id)
);

-- Enable RLS
ALTER TABLE public.breach_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breach_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breach_access_requests ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Admins: Full Access to everything
CREATE POLICY "Admins full access datasets" ON public.breach_datasets
    FOR ALL TO authenticated
    USING (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));

CREATE POLICY "Admins full access entries" ON public.breach_entries
    FOR ALL TO authenticated
    USING (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));

CREATE POLICY "Admins full access requests" ON public.breach_access_requests
    FOR ALL TO authenticated
    USING (exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'));

-- SOC Analysts:
-- 1. Can view all datasets (Title/Description) to request access
CREATE POLICY "SOC view datasets" ON public.breach_datasets
    FOR SELECT TO authenticated
    USING (exists (select 1 from user_roles where user_id = auth.uid() and role = 'soc'));

-- 2. Can view entries ONLY if they have an 'approved' request for that dataset
CREATE POLICY "SOC view entries if approved" ON public.breach_entries
    FOR SELECT TO authenticated
    USING (
        exists (
            select 1 from public.breach_access_requests 
            where user_id = auth.uid() 
            and dataset_id = public.breach_entries.dataset_id 
            and status = 'approved'
        )
        AND
        exists (select 1 from user_roles where user_id = auth.uid() and role = 'soc')
    );

-- 3. Can manage their own access requests (create, view)
CREATE POLICY "SOC manage own requests" ON public.breach_access_requests
    FOR ALL TO authenticated
    USING (
        user_id = auth.uid() 
        AND exists (select 1 from user_roles where user_id = auth.uid() and role = 'soc')
    );

-- Users: No access defined (Implicit deny)
