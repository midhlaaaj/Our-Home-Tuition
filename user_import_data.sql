-- User Migration Data Script
-- Run this in your NEW Supabase project's SQL Editor.

-- Disabling triggers on auth.users often requires superuser privileges 
-- which the SQL Editor doesn't have. We will skip that and use 
-- ON CONFLICT to handle trigger-generated profiles.

--------------------------------------------------------------------------------
-- 1. Migrate auth.users
--------------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, 
  raw_user_meta_data, created_at, updated_at, is_anonymous
) VALUES 
('00000000-0000-0000-0000-000000000000', '39fa61f3-d3db-41f7-9a69-52baf2c59198', 'authenticated', 'authenticated', 'midhlaj@gmail.com', '$2a$10$9MRoKhhVdaToJj5ym6zBUeGJzpm8UDoDW8DF0gVDY3VZJCsLoDo82', '2026-02-19 11:20:59.211188+00', '2026-03-13 09:15:53.832213+00', '{"provider":"email","providers":["email"]}', '{"role":"Student","class":"","phone":"+918086623316","address":"Kizhakkalachiyil, South Koduvally, Koduvally","full_name":"Midhlaj","avatar_url":"https://cskuylvbuswawhalnkty.supabase.co/storage/v1/object/public/avatars/1771500441280.jpeg","email_verified":true}', '2026-02-19 11:20:59.187586+00', '2026-03-13 09:15:53.900948+00', false),

('00000000-0000-0000-0000-000000000000', 'c5ff29bf-a474-4ef3-9bd4-be68d319cbf9', 'authenticated', 'authenticated', 'shreya@ourhometuition.com', '$2a$06$uBNj8uUlr5nolG.D4kiMUu3K8AvMebyXtNDiowZMColWVh4zZIFHa', '2026-03-10 15:37:50.61376+00', '2026-03-13 09:17:37.055522+00', '{"provider":"email","providers":["email"]}', '{"role":"mentor"}', '2026-03-10 15:37:50.61376+00', '2026-03-13 09:17:37.083406+00', false),

('00000000-0000-0000-0000-000000000000', 'e7223ae7-6217-4ebe-b64a-6352705b8744', 'authenticated', 'authenticated', 'admin@oht.com', '$2a$10$4qVHg7KYyj.RX5/TJdAl/u6Y8GtSBwtIPMlDZ.khFArRVSF6N4coW', '2026-02-26 14:25:04.017777+00', '2026-02-26 14:25:46.76119+00', '{"provider":"email","providers":["email"]}', '{"email_verified":true}', '2026-02-26 14:25:03.997126+00', '2026-03-11 05:20:31.803905+00', false),

('00000000-0000-0000-0000-000000000000', 'd8f5b447-7069-498e-a8a2-a2df1c339ab5', 'authenticated', 'authenticated', 'admin@gmail.com', '$2a$10$zx.5bRB1fTNAJD1CQHS/Jur83MuSOjfg6ZRMVWU3mA6VIC/OkB.I6', '2026-02-19 10:32:18.56398+00', '2026-03-13 09:21:48.013515+00', '{"provider":"email","providers":["email"]}', '{"role":"Student","class":"","phone":"+918086623316","address":"Kizhakkalachiyil, South Koduvally, Koduvally","full_name":"Muhammed Midhlaj K C","avatar_url":"https://cskuylvbuswawhalnkty.supabase.co/storage/v1/object/public/prebuilt-avatars/1772005938000-superhero_7023955.png","email_verified":true}', '2026-02-19 10:32:18.522377+00', '2026-03-13 09:21:48.038873+00', false),

('00000000-0000-0000-0000-000000000000', '9d436ee4-fe45-40a1-a2a4-d5576ff8b80c', 'authenticated', 'authenticated', 'midhlajmidhu004@gmail.com', '$2a$10$tVF5oj1mFgH3.J2asCv/G.EU9.fXJg8W2BthEIam1KDUEaOc2Gpqm', '2026-03-12 05:17:43.214421+00', '2026-03-13 09:35:59.424567+00', '{"provider":"email","providers":["email"]}', '{"sub":"9d436ee4-fe45-40a1-a2a4-d5576ff8b80c","email":"midhlajmidhu004@gmail.com","phone":"","address":"","full_name":"Muhammed Midhlaj K C","email_verified":true,"phone_verified":false}', '2026-03-12 05:17:22.34108+00', '2026-03-13 09:35:59.459075+00', false)
ON CONFLICT (id) DO NOTHING;

--------------------------------------------------------------------------------
-- 2. Migrate auth.identities
--------------------------------------------------------------------------------
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id) VALUES 
('39fa61f3-d3db-41f7-9a69-52baf2c59198', '39fa61f3-d3db-41f7-9a69-52baf2c59198', '{"sub":"39fa61f3-d3db-41f7-9a69-52baf2c59198","email":"midhlaj@gmail.com"}', 'email', '2026-03-13 09:15:53.832213+00', '2026-02-19 11:20:59.187586+00', '2026-03-13 09:15:53.832213+00', 'midhlaj@gmail.com'),
('c5ff29bf-a474-4ef3-9bd4-be68d319cbf9', 'c5ff29bf-a474-4ef3-9bd4-be68d319cbf9', '{"sub":"c5ff29bf-a474-4ef3-9bd4-be68d319cbf9","email":"shreya@ourhometuition.com"}', 'email', '2026-03-13 09:17:37.055522+00', '2026-03-10 15:37:50.61376+00', '2026-03-13 09:17:37.055522+00', 'shreya@ourhometuition.com'),
('e7223ae7-6217-4ebe-b64a-6352705b8744', 'e7223ae7-6217-4ebe-b64a-6352705b8744', '{"sub":"e7223ae7-6217-4ebe-b64a-6352705b8744","email":"admin@oht.com"}', 'email', '2026-02-26 14:25:46.76119+00', '2026-02-26 14:25:03.997126+00', '2026-02-26 14:25:46.76119+00', 'admin@oht.com'),
('d8f5b447-7069-498e-a8a2-a2df1c339ab5', 'd8f5b447-7069-498e-a8a2-a2df1c339ab5', '{"sub":"d8f5b447-7069-498e-a8a2-a2df1c339ab5","email":"admin@gmail.com"}', 'email', '2026-03-13 09:21:48.013515+00', '2026-02-19 10:32:18.522377+00', '2026-03-13 09:21:48.013515+00', 'admin@gmail.com'),
('9d436ee4-fe45-40a1-a2a4-d5576ff8b80c', '9d436ee4-fe45-40a1-a2a4-d5576ff8b80c', '{"sub":"9d436ee4-fe45-40a1-a2a4-d5576ff8b80c","email":"midhlajmidhu004@gmail.com"}', 'email', '2026-03-13 09:35:59.424567+00', '2026-03-12 05:17:22.34108+00', '2026-03-13 09:35:59.424567+00', 'midhlajmidhu004@gmail.com')
ON CONFLICT (id) DO NOTHING;

--------------------------------------------------------------------------------
-- 3. Migrate public.profiles
--------------------------------------------------------------------------------
-- Ensure the profiles table has the necessary columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

INSERT INTO public.profiles (id, full_name, role, created_at, phone, address, avatar_url) VALUES 
('39fa61f3-d3db-41f7-9a69-52baf2c59198', 'Midhlaj', 'student', '2026-02-19 11:20:59.187586+00', '+918086623316', 'Kizhakkalachiyil, South Koduvally, Koduvally', 'https://cskuylvbuswawhalnkty.supabase.co/storage/v1/object/public/avatars/1771500441280.jpeg'),
('c5ff29bf-a474-4ef3-9bd4-be68d319cbf9', 'Shreya', 'mentor', '2026-03-10 15:37:50.61376+00', NULL, NULL, NULL),
('e7223ae7-6217-4ebe-b64a-6352705b8744', 'Admin', 'admin', '2026-02-26 14:25:03.997126+00', NULL, NULL, NULL),
('d8f5b447-7069-498e-a8a2-a2df1c339ab5', 'Muhammed Midhlaj K C', 'student', '2026-02-19 10:32:18.522377+00', '+918086623316', 'Kizhakkalachiyil, South Koduvally, Koduvally', 'https://cskuylvbuswawhalnkty.supabase.co/storage/v1/object/public/prebuilt-avatars/1772005938000-superhero_7023955.png'),
('9d436ee4-fe45-40a1-a2a4-d5576ff8b80c', 'Muhammed Midhlaj K C', 'student', '2026-03-12 05:17:22.34108+00', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Re-enabling triggers (skipped to avoid permission issues)
-- ALTER TABLE auth.users ENABLE TRIGGER ALL;
