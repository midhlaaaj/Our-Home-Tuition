-- RESCUE ADMIN ACCESS & SYNC PROFILES (V2 - COLLISION SAFE)
-- Run this in your Supabase SQL Editor as 'postgres' role.

--------------------------------------------------------------------------------
-- 1. Resolve Auth User Collision & Update
--------------------------------------------------------------------------------

DO $$
DECLARE
    target_uid UUID;
    existing_id UUID;
BEGIN
    -- STEP A: Find if the email already exists in auth.users
    SELECT id INTO existing_id FROM auth.users WHERE email = 'ourhometuition.web@gmail.com' LIMIT 1;
    
    -- STEP B: Find if there's a legacy admin ID or email wandering around
    IF existing_id IS NULL THEN
        SELECT id INTO target_uid FROM auth.users WHERE email = 'admin@oht.com' LIMIT 1;
        IF target_uid IS NULL THEN
            SELECT id INTO target_uid FROM auth.users WHERE id = 'e7223ae7-6217-4ebe-b64a-6352705b8744' LIMIT 1;
        END IF;
    ELSE
        target_uid := existing_id;
    END IF;

    -- STEP C: Update the winner
    IF target_uid IS NOT NULL THEN
        UPDATE auth.users 
        SET 
            email = 'ourhometuition.web@gmail.com',
            encrypted_password = crypt('Ourhometuition@123', gen_salt('bf')),
            email_confirmed_at = now(),
            updated_at = now(),
            raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
        WHERE id = target_uid;

        -- Update identity
        UPDATE auth.identities
        SET 
            identity_data = jsonb_build_object('sub', target_uid, 'email', 'ourhometuition.web@gmail.com'),
            provider_id = 'ourhometuition.web@gmail.com'
        WHERE user_id = target_uid;

        RAISE NOTICE '✅ Successfully updated auth.users for UID %', target_uid;
    ELSE
        -- STEP D: Create fresh if really nothing exists
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at, confirmation_token, email_change, 
            email_change_token_new, recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000', 'e7223ae7-6217-4ebe-b64a-6352705b8744', 
            'authenticated', 'authenticated', 'ourhometuition.web@gmail.com', 
            crypt('Ourhometuition@123', gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}', 
            '{"role":"admin"}', now(), now(), '', '', '', ''
        );
        
        INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
        VALUES (
            'e7223ae7-6217-4ebe-b64a-6352705b8744', 'e7223ae7-6217-4ebe-b64a-6352705b8744', 
            '{"sub":"e7223ae7-6217-4ebe-b64a-6352705b8744","email":"ourhometuition.web@gmail.com"}', 'email', 
            now(), now(), now(), 'ourhometuition.web@gmail.com'
        );

        target_uid := 'e7223ae7-6217-4ebe-b64a-6352705b8744';
        RAISE NOTICE '✅ Successfully created NEW admin user';
    END IF;

    -- STEP E: Sync public profiles for this specific UID
    -- First, remove any other profiles claiming this email to prevent collisions there
    DELETE FROM public.profiles WHERE email = 'ourhometuition.web@gmail.com' AND id != target_uid;

    INSERT INTO public.profiles (id, email, role, full_name, created_at)
    VALUES (target_uid, 'ourhometuition.web@gmail.com', 'admin', 'Admin', now())
    ON CONFLICT (id) DO UPDATE SET 
        role = 'admin', 
        email = 'ourhometuition.web@gmail.com';

END $$;

--------------------------------------------------------------------------------
-- 2. FINAL VERIFICATION
--------------------------------------------------------------------------------
SELECT id, email, created_at FROM auth.users WHERE email = 'ourhometuition.web@gmail.com';
SELECT id, email, role FROM public.profiles WHERE email = 'ourhometuition.web@gmail.com';
