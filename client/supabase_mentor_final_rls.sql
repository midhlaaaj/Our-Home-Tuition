-- Final Mentor RLS & Sync Fix

-- 1. Ensure RLS is enabled
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Admins have full access to mentors" ON public.mentors;
DROP POLICY IF EXISTS "Mentors can view their own profile" ON public.mentors;
DROP POLICY IF EXISTS "Mentors can update their own profile" ON public.mentors;
DROP POLICY IF EXISTS "Active mentors are publicly visible" ON public.mentors;

-- 3. Define Admin Policy (Full Access)
CREATE POLICY "Admins have full access to mentors" ON public.mentors
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 4. Define Mentor Policies (Self-Manage)
CREATE POLICY "Mentors can view their own profile" ON public.mentors
FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());

CREATE POLICY "Mentors can update their own profile" ON public.mentors
FOR UPDATE TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- 5. Define Public Visibility (For Homepage & Listings)
-- Allows both authenticated and anonymous users to see active mentors
CREATE POLICY "Active mentors are publicly visible" ON public.mentors
FOR SELECT TO public
USING (is_active = true);

-- 6. Grant basic permissions
GRANT SELECT, UPDATE ON public.mentors TO authenticated;
GRANT SELECT ON public.mentors TO anon;
