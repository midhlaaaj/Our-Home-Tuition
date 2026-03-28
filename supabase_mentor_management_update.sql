-- BUG FIX / ENHANCEMENT: Automated Mentor Management Setup

-- 1. Update 'mentors' table with expanded fields
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS contact_no TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS qualification TEXT,
ADD COLUMN IF NOT EXISTS work_history TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS birth_year INTEGER,
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- 2. Create 'mentor_availability' table
CREATE TABLE IF NOT EXISTS public.mentor_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Update 'bookings' table to support assignment
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS assigned_mentor_id UUID REFERENCES public.mentors(id);

-- 4. Create Postgres function for automated mentor account creation
-- This function skips manual intervention by creating auth user and profile in one go.
CREATE OR REPLACE FUNCTION public.create_mentor_account(
    mentor_email TEXT,
    mentor_password TEXT,
    mentor_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- 1. Security Check: Only allow if calling user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RETURN json_build_object('error', 'Unauthorized: Only admins can create mentor accounts');
    END IF;

    -- 2. Create user in auth.users
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at, confirmation_token, email_change, 
        email_change_token_new, recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 
        'authenticated', 'authenticated', mentor_email, 
        crypt(mentor_password, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', 
        jsonb_build_object('role', 'mentor'), now(), now(), '', '', '', ''
    )
    RETURNING id INTO new_user_id;

    -- 2.1 INSERT into auth.identities (Required for password sign-in)
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, 
        last_sign_in_at, created_at, updated_at, provider_id
    ) VALUES (
        new_user_id, new_user_id, 
        jsonb_build_object('sub', new_user_id, 'email', mentor_email), 
        'email', now(), now(), now(), mentor_email
    );

    -- 3. Create profile with 'mentor' role (lowercase for consistency)
    INSERT INTO public.profiles (id, email, role, created_at)
    VALUES (new_user_id, mentor_email, 'mentor', now())
    ON CONFLICT (id) DO UPDATE SET role = 'mentor';

    -- 4. Link auth_user_id to the mentors table
    UPDATE public.mentors
    SET auth_user_id = new_user_id,
        email = mentor_email
    WHERE id = mentor_id;

    RETURN json_build_object('success', true, 'auth_user_id', new_user_id, 'email', mentor_email);

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Grant execution to authenticated users (admin check is inside)
GRANT EXECUTE ON FUNCTION public.create_mentor_account(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_mentor_account(TEXT, TEXT, UUID) TO service_role;
