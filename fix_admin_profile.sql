-- FIX: Missing Admin Profile
-- Run this in your Supabase SQL Editor to restore your admin access.

INSERT INTO public.profiles (id, email, role, full_name, created_at)
VALUES (
  'e7223ae7-6217-4ebe-b64a-6352705b8744', 
  'ourhometuition.web@gmail.com', 
  'admin', 
  'Admin', 
  now()
)
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', email = 'ourhometuition.web@gmail.com';

-- Also ensure 'robert@ourhometuition.com' record is ready to be linked
-- (This doesn't create the login, just ensures the record exists in 'mentors' table)
-- If Robert Wilson isn't in your table, add him via the UI first.
