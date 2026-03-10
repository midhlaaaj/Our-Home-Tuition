-- Create contact_queries table
CREATE TABLE IF NOT EXISTS public.contact_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    query TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_queries ENABLE ROW LEVEL SECURITY;

-- Allow public to insert
DROP POLICY IF EXISTS "Allow public to insert contact queries" ON public.contact_queries;
CREATE POLICY "Allow public to insert contact queries" 
ON public.contact_queries FOR INSERT 
WITH CHECK (true);

-- Allow admins to view
DROP POLICY IF EXISTS "Allow admins to view contact queries" ON public.contact_queries;
CREATE POLICY "Allow admins to view contact queries" 
ON public.contact_queries FOR SELECT 
USING (auth.jwt() ->> 'role' = 'admin');

-- Allow admins to delete
DROP POLICY IF EXISTS "Allow admins to delete contact queries" ON public.contact_queries;
CREATE POLICY "Allow admins to delete contact queries" 
ON public.contact_queries FOR DELETE 
USING (auth.jwt() ->> 'role' = 'admin');
