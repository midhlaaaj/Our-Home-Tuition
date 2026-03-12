-- 1. Enable RLS on bookings and contact_queries if not already enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_queries ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts (optional, but safer for re-running)
DROP POLICY IF EXISTS "Admins have full access to bookings" ON public.bookings;
DROP POLICY IF EXISTS "Students can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Mentors can view assigned bookings" ON public.bookings;

DROP POLICY IF EXISTS "Admins have full access to contact_queries" ON public.contact_queries;
DROP POLICY IF EXISTS "Mentors can view assigned contact_queries" ON public.contact_queries;

-- 3. Define Policies for "bookings" table

-- ADMIN: Full access base on 'admin' role in profiles
CREATE POLICY "Admins have full access to bookings" ON public.bookings
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- STUDENT: See their own bookings
CREATE POLICY "Students can view their own bookings" ON public.bookings
FOR SELECT USING (
    auth.uid() = user_id
);

-- MENTOR: See bookings where they are assigned
CREATE POLICY "Mentors can view assigned bookings" ON public.bookings
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM mentors
        WHERE mentors.id = bookings.assigned_mentor_id
        AND mentors.auth_user_id = auth.uid()
    )
);


-- 4. Define Policies for "contact_queries" table

-- ADMIN: Full access
CREATE POLICY "Admins have full access to contact_queries" ON public.contact_queries
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- MENTOR: See queries where they are assigned
CREATE POLICY "Mentors can view assigned contact_queries" ON public.contact_queries
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM mentors
        WHERE mentors.id = contact_queries.assigned_mentor_id
        AND mentors.auth_user_id = auth.uid()
    )
);

-- 5. Grant necessary permissions (usually already there for authenticated users)
GRANT SELECT ON public.bookings TO authenticated;
GRANT SELECT ON public.contact_queries TO authenticated;
GRANT SELECT ON public.mentors TO authenticated;
