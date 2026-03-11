-- RLS FIX: Allow mentors to view bookings and queries assigned to them

-- 0. Ensure missing columns exist
ALTER TABLE public.contact_queries 
ADD COLUMN IF NOT EXISTS assigned_mentor_id UUID REFERENCES public.mentors(id);

-- 1. Bookings Policies
DROP POLICY IF EXISTS "Mentors can view assigned bookings" ON public.bookings;
CREATE POLICY "Mentors can view assigned bookings" 
ON public.bookings FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.mentors 
        WHERE mentors.auth_user_id = auth.uid() 
        AND mentors.id = public.bookings.assigned_mentor_id
    )
);

DROP POLICY IF EXISTS "Mentors can update assigned bookings" ON public.bookings;
CREATE POLICY "Mentors can update assigned bookings"
ON public.bookings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.mentors
        WHERE mentors.auth_user_id = auth.uid()
        AND mentors.id = public.bookings.assigned_mentor_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.mentors
        WHERE mentors.auth_user_id = auth.uid()
        AND mentors.id = public.bookings.assigned_mentor_id
    )
);

-- 2. Contact Queries Policies
DROP POLICY IF EXISTS "Mentors can view assigned queries" ON public.contact_queries;
CREATE POLICY "Mentors can view assigned queries" 
ON public.contact_queries FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.mentors 
        WHERE mentors.auth_user_id = auth.uid() 
        AND mentors.id = public.contact_queries.assigned_mentor_id
    )
);

DROP POLICY IF EXISTS "Mentors can update assigned queries" ON public.contact_queries;
CREATE POLICY "Mentors can update assigned queries"
ON public.contact_queries FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.mentors
        WHERE mentors.auth_user_id = auth.uid()
        AND mentors.id = public.contact_queries.assigned_mentor_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.mentors
        WHERE mentors.auth_user_id = auth.uid()
        AND mentors.id = public.contact_queries.assigned_mentor_id
    )
);
