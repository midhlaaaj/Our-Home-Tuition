-- Fix Notifications RLS: Allow authenticated users to insert notifications
-- This is needed so parents can notify themselves of booking initiation,
-- and mentors can notify parents of confirmations.

DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (true);

-- Ensure authenticated users have insert permission on the table
GRANT INSERT ON public.notifications TO authenticated;
