-- Create mentor_assignment_offers table to track direct requests from Admin to Mentors
CREATE TABLE IF NOT EXISTS mentor_assignment_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
    offered_payout DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mentor_assignment_offers ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to assignment offers"
ON mentor_assignment_offers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Mentors can view their own offers
CREATE POLICY "Mentors can view their own assignment offers"
ON mentor_assignment_offers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM mentors
    WHERE mentors.id = mentor_assignment_offers.mentor_id
    AND mentors.auth_user_id = auth.uid()
  )
);

-- Mentors can update their own offers (to accept/reject)
CREATE POLICY "Mentors can update their own assignment offers"
ON mentor_assignment_offers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM mentors
    WHERE mentors.id = mentor_assignment_offers.mentor_id
    AND mentors.auth_user_id = auth.uid()
  )
);

-- Create a trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mentor_assignment_offers_updated_at
    BEFORE UPDATE ON mentor_assignment_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
