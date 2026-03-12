-- Add preferred_date, preferred_time, and session_mode columns to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS preferred_date DATE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS preferred_time TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS session_mode TEXT DEFAULT 'offline';

-- If preferred_time already exists as TIME, convert it to TEXT to support multiple values
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'preferred_time' 
        AND data_type = 'time without time zone'
    ) THEN 
        ALTER TABLE public.bookings ALTER COLUMN preferred_time TYPE TEXT;
    END IF;
END $$;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_session_mode_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_session_mode_check CHECK (session_mode IN ('online', 'offline'));

-- Create index for faster filtering if needed
CREATE INDEX IF NOT EXISTS idx_bookings_preferred_date ON public.bookings(preferred_date);
