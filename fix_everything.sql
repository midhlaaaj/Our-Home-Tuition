-- FINAL MISSION: Restore Admin & Create Robert's Account (RESCUE VERSION)
-- Run ALL of this in your Supabase SQL Editor.

--------------------------------------------------------------------------------
-- 1. Create the Backend Function (Required for automation)
--------------------------------------------------------------------------------
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
BEGIN
    -- INSERT into auth.users (gen_salt requires pgcrypto, usually available)
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

    -- Create profile with 'mentor' role
    INSERT INTO public.profiles (id, email, role, created_at)
    VALUES (new_user_id, mentor_email, 'mentor', now())
    ON CONFLICT (id) DO UPDATE SET role = 'mentor';

    -- Link auth_user_id to the mentors table
    UPDATE public.mentors
    SET auth_user_id = new_user_id,
        email = mentor_email
    WHERE id = mentor_id;

    RETURN json_build_object('success', true, 'auth_user_id', new_user_id);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_mentor_account(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_mentor_account(TEXT, TEXT, UUID) TO service_role;

--------------------------------------------------------------------------------
-- 2. Restore Admin Profile
--------------------------------------------------------------------------------
DO $$
DECLARE
    admin_uid UUID;
BEGIN
    SELECT id INTO admin_uid FROM auth.users WHERE email = 'ourhometuition.web@gmail.com' LIMIT 1;
    
    IF admin_uid IS NOT NULL THEN
        INSERT INTO public.profiles (id, email, role, full_name, created_at)
        VALUES (admin_uid, 'ourhometuition.web@gmail.com', 'admin', 'Admin', now())
        ON CONFLICT (id) DO UPDATE SET role = 'admin', email = 'ourhometuition.web@gmail.com';
        RAISE NOTICE '✅ Successfully restored admin profile for UID %', admin_uid;
    ELSE
        RAISE NOTICE '❌ Could not find an auth user with email ourhometuition.web@gmail.com';
    END IF;
END $$;

--------------------------------------------------------------------------------
-- 3. Force Create Robert's account (With Type Casting)
--------------------------------------------------------------------------------
SELECT public.create_mentor_account(
    'robert@ourhometuition.com'::TEXT, 
    '123@ourhometuition'::TEXT, 
    (SELECT id FROM public.mentors WHERE name ilike '%Robert Wilson%' LIMIT 1)::UUID
);

-- Final Check
SELECT * FROM public.profiles WHERE email IN ('ourhometuition.web@gmail.com', 'robert@ourhometuition.com');
