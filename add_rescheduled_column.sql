-- Add is_rescheduled column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_rescheduled BOOLEAN DEFAULT FALSE;

-- If you want to track the original date/time for reporting
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS last_rescheduled_at TIMESTAMPTZ;
