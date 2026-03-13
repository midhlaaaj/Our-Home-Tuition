-- User Import Template for New Supabase Project
-- Instructions:
-- 1. Export CSVs from your OLD project using the queries in the implementation plan.
-- 2. Use a tool or manually format the data into the INSERT statements below.
-- 3. Run these in the NEW project's SQL Editor.

--------------------------------------------------------------------------------
-- 1. DATA PREPARATION (Internal Auth Schema)
--------------------------------------------------------------------------------

-- IMPORTANT: You may need to disable triggers temporarily if you hit errors
-- ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- INSERT INTO auth.users
-- Paste your formatted user data here. 
-- Example format:
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
-- VALUES ('uuid-here', 'email@example.com', 'hashed-password', now(), now(), now(), '{"provider":"email"}', '{"full_name":"Name"}', 'authenticated', 'authenticated');

--------------------------------------------------------------------------------
-- 2. IDENTITIES (Internal Auth Schema)
--------------------------------------------------------------------------------

-- INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
-- VALUES ('uuid-here', 'user-uuid-here', '{"sub":"uuid-here"}', 'email', now(), now(), now(), 'uuid-here');

-- ALTER TABLE auth.users ENABLE TRIGGER ALL;

--------------------------------------------------------------------------------
-- 3. PUBLIC PROFILES
--------------------------------------------------------------------------------

-- INSERT INTO public.profiles (id, full_name, role, created_at, phone, address)
-- VALUES ('user-uuid-here', 'Full Name', 'student', now(), 'phone', 'address')
-- ON CONFLICT (id) DO NOTHING;
