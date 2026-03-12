-- Location-Based Mentor Notifications Schema Update

-- 1. Add location columns to mentors table
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- 2. Add location columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 3. Create booking_offers table for the notification/discovery system
CREATE TABLE IF NOT EXISTS public.booking_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    distance_km DOUBLE PRECISION,
    UNIQUE(booking_id, mentor_id)
);

-- 4. Enable RLS on booking_offers
ALTER TABLE public.booking_offers ENABLE ROW LEVEL SECURITY;

-- 5. Policies for booking_offers
-- Admins can do everything
CREATE POLICY admin_manage_offers ON public.booking_offers
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Mentors can view and update their own offers
CREATE POLICY mentor_view_own_offers ON public.booking_offers
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.mentors 
        WHERE id = booking_offers.mentor_id AND auth_user_id = auth.uid()
    )
);

CREATE POLICY mentor_update_own_offers ON public.booking_offers
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.mentors 
        WHERE id = booking_offers.mentor_id AND auth_user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.mentors 
        WHERE id = booking_offers.mentor_id AND auth_user_id = auth.uid()
    )
);

-- 6. Grant basic permissions
GRANT ALL ON public.booking_offers TO authenticated;
GRANT ALL ON public.booking_offers TO postgres;
GRANT ALL ON public.booking_offers TO service_role;
