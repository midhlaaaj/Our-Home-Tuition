-- RLS RECURSION FIX
-- This script fixes the infinite loop causing the 401/500 errors.

--------------------------------------------------------------------------------
-- 1. Fix the is_admin function to avoid recursion
--------------------------------------------------------------------------------
-- We use a "subquery" approach that PostgreSQL can optimize or a direct JWT check.
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  -- Check JWT metadata first (faster, no recursion)
  IF (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Fallback to profile check but carefully
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

--------------------------------------------------------------------------------
-- 2. Update Profiles Policies to break the loop
--------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon select" ON public.profiles;

-- New non-recursive policies
CREATE POLICY "Profiles are viewable by owners" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Profiles are updatable by owners" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- For admin access, we check the JWT directly to avoid hitting the same table and looping
CREATE POLICY "Admins have full access to profiles" 
ON public.profiles FOR ALL 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
  OR 
  (auth.jwt() ->> 'role' = 'service_role')
);

-- Public read for certain profiles (like mentors) if needed
CREATE POLICY "Public can view mentor profiles"
ON public.profiles FOR SELECT
USING (role = 'mentor');

--------------------------------------------------------------------------------
-- 3. Ensure auth metadata matches profiles
--------------------------------------------------------------------------------
-- This ensures the JWT contains the 'admin' role so the policy works
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE id IN (SELECT id FROM public.profiles WHERE role = 'admin');

UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "mentor"}'::jsonb
WHERE id IN (SELECT id FROM public.profiles WHERE role = 'mentor');
