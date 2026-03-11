-- Add 'awaiting_approval' to the status check constraint for bookings
-- First, drop the existing constraint (we need to know its name, usually 'bookings_status_check')
-- If we don't know the exact name, we can recreate the table check or use a dynamic approach.
-- Based on common Supabase patterns, it might be named 'bookings_status_check'.

DO $$ 
BEGIN 
    ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
EXCEPTION 
    WHEN undefined_object THEN 
        -- Constraint not found, ignore
END $$;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check  
CHECK (status IN ('pending', 'awaiting_approval', 'confirmed', 'cancelled', 'completed'));

-- Update any existing unassigned assignments (optional, but good for consistency)
-- UPDATE public.bookings SET status = 'awaiting_approval' WHERE status = 'pending' AND assigned_mentor_id IS NOT NULL;
