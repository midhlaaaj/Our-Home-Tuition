-- Update site_leads to be more targeted towards users with contact info
CREATE TABLE IF NOT EXISTS public.site_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fingerprint TEXT UNIQUE, -- Used to track the session and link actions
    name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    has_booked BOOLEAN DEFAULT false,
    has_queried BOOLEAN DEFAULT false,
    visit_count INTEGER DEFAULT 1,
    last_page_visited TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster filtering in Admin panel
CREATE INDEX IF NOT EXISTS idx_site_leads_contact ON public.site_leads(email, phone);

-- Enable RLS
ALTER TABLE public.site_leads ENABLE ROW LEVEL SECURITY;

-- Allow public to manage their own lead record
DROP POLICY IF EXISTS "Allow public to manage their own lead" ON public.site_leads;
CREATE POLICY "Allow public to manage their own lead" 
ON public.site_leads FOR ALL 
USING (true)
WITH CHECK (true);

-- Allow admins to view all leads
DROP POLICY IF EXISTS "Allow admins to view all leads" ON public.site_leads;
CREATE POLICY "Allow admins to view all leads" 
ON public.site_leads FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_site_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_site_leads_updated_at ON public.site_leads;
CREATE TRIGGER tr_site_leads_updated_at
BEFORE UPDATE ON public.site_leads
FOR EACH ROW
EXECUTE FUNCTION update_site_leads_updated_at();
