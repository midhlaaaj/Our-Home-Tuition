-- MIGRATION: Profiles Only
-- Run this in your NEW Supabase project's SQL Editor.
-- This script ONLY handles the profiles, assuming auth.users is already done.

--------------------------------------------------------------------------------
-- 1. Ensure Table Structure
--------------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

--------------------------------------------------------------------------------
-- 2. Clean up existing (if any)
--------------------------------------------------------------------------------
DELETE FROM public.profiles WHERE id IN (
  '39fa61f3-d3db-41f7-9a69-52baf2c59198',
  'c5ff29bf-a474-4ef3-9bd4-be68d319cbf9',
  'e7223ae7-6217-4ebe-b64a-6352705b8744',
  'd8f5b447-7069-498e-a8a2-a2df1c339ab5',
  '9d436ee4-fe45-40a1-a2a4-d5576ff8b80c'
);

--------------------------------------------------------------------------------
-- 3. INSERT PROFILES
--------------------------------------------------------------------------------
INSERT INTO public.profiles (id, full_name, role, created_at, phone, address, avatar_url) VALUES 
('39fa61f3-d3db-41f7-9a69-52baf2c59198', 'Midhlaj', 'student', '2026-02-19 11:20:59.187586+00', '+918086623316', 'Kizhakkalachiyil, South Koduvally, Koduvally', 'https://abzwpidnymxfilrkcewh.supabase.co/storage/v1/object/public/avatars/1771500441280.jpeg'),
('c5ff29bf-a474-4ef3-9bd4-be68d319cbf9', 'Shreya', 'mentor', '2026-03-10 15:37:50.61376+00', NULL, NULL, NULL),
('e7223ae7-6217-4ebe-b64a-6352705b8744', 'Admin', 'admin', '2026-02-26 14:25:03.997126+00', NULL, NULL, NULL),
('d8f5b447-7069-498e-a8a2-a2df1c339ab5', 'Muhammed Midhlaj K C', 'student', '2026-02-19 10:32:18.522377+00', '+918086623316', 'Kizhakkalachiyil, South Koduvally, Koduvally', 'https://abzwpidnymxfilrkcewh.supabase.co/storage/v1/object/public/prebuilt-avatars/1772005938000-superhero_7023955.png'),
('9d436ee4-fe45-40a1-a2a4-d5576ff8b80c', 'Muhammed Midhlaj K C', 'student', '2026-03-12 05:17:22.34108+00', '', '', '');

--------------------------------------------------------------------------------
-- 4. Verify
--------------------------------------------------------------------------------
SELECT count(*) FROM public.profiles;
