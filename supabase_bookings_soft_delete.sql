-- Soft Delete for Bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- function to permanently delete bookings older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_deleted_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.bookings
    WHERE deleted_at IS NOT NULL
    AND deleted_at < now() - INTERVAL '7 days';
END;
$$;

-- Note: In Supabase, you can schedule this using pg_cron if enabled:
-- SELECT cron.schedule('cleanup-bookings', '0 0 * * *', 'SELECT cleanup_deleted_bookings()');
