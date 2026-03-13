-- FINAL SYSTEM CLEANUP & STORAGE SETUP
-- Run this in your Supabase SQL Editor as 'postgres' role.

--------------------------------------------------------------------------------
-- 1. STORAGE BUCKETS SETUP
-- This ensures all required buckets exist and are public.
--------------------------------------------------------------------------------
-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('uploads', 'uploads', true),
  ('prebuilt-avatars', 'prebuilt-avatars', true),
  ('resumes', 'resumes', true),
  ('intro-videos', 'intro-videos', true),
  ('avatars', 'avatars', true),
  ('mentor-docs', 'mentor-docs', true),
  ('sliders', 'sliders', true),
  ('brands', 'brands', true),
  ('partners', 'partners', true),
  ('mentors', 'mentors', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Note: In Supabase, RLS on storage.objects is enabled by default.
-- If you get an 'owner' error, it means we don't need to touch the table structure.

-- DROP existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Debug Public Upload" ON storage.objects;

-- Create CLEAN policies for storage
-- Everyone can VIEW any object in any bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (true);

-- Authenticated users (mentors/admins) can UPLOAD to any bucket
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can UPDATE their own (or any for now to debug)
CREATE POLICY "Authenticated Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (true);

-- Authenticated users can DELETE
CREATE POLICY "Authenticated Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (true);

--------------------------------------------------------------------------------
-- 2. ADMIN PROFILE CLEANUP
-- This ensures any account with your email is recognized as an admin.
--------------------------------------------------------------------------------

-- Ensure ALL profiles with your email are marked as admin 
-- (This fixes the duplicate issue without risk of deleting your current active session)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'ourhometuition.web@gmail.com';

-- Just in case, insert the known ID from migration
INSERT INTO public.profiles (id, email, role, full_name, created_at)
VALUES (
  'e7223ae7-6217-4ebe-b64a-6352705b8744', 
  'ourhometuition.web@gmail.com', 
  'admin', 
  'Admin', 
  now()
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

--------------------------------------------------------------------------------
-- 3. RLS FIX FOR PROFILES (Public Read)
--------------------------------------------------------------------------------
-- Ensure people can see profiles (required for frontend to check roles etc)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Ensure admins can update anything
DROP POLICY IF EXISTS "Admins can update everything" ON public.profiles;
CREATE POLICY "Admins can update everything"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

--------------------------------------------------------------------------------
-- 4. FINAL VERIFICATION
--------------------------------------------------------------------------------
SELECT name, public FROM storage.buckets;
SELECT email, role FROM public.profiles;
