-- EMERGENCY BUCKET CREATION (IDEMPOTENT)
-- Run this in your Supabase SQL Editor.

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('uploads', 'uploads', true),
  ('avatars', 'avatars', true),
  ('sliders', 'sliders', true),
  ('mentors', 'mentors', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Clear existing policies to avoid "already exists" errors
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Read" ON storage.objects;
    DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
    DROP POLICY IF EXISTS "Debug Public Upload" ON storage.objects;
    DROP POLICY IF EXISTS "Debug Public Update" ON storage.objects;
    DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
    DROP POLICY IF EXISTS "Public Upload to Specific Buckets" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Full Storage Access" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Create Simplified Policies for Testing
CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Debug Public Upload" ON storage.objects FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Debug Public Update" ON storage.objects FOR UPDATE TO public USING (true);
