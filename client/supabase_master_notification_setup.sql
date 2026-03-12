-- MASTER SETUP: Parent Notification System
-- Run this ONCE in your Supabase SQL Editor to set up everything.

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Clear existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

-- 4. Define Policies
-- Policy: Users can see their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: System/Users can create notifications
-- (Necessary for parents to create their own 'initiated' notifications)
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (true);

-- Policy: Admins have full access
CREATE POLICY "Admins can manage all notifications" ON public.notifications
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 5. Enable Realtime
-- Check if publication exists first to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- 6. Grant Permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
