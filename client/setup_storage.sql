-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Create 'avatars' bucket for user uploads
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Create 'prebuilt-avatars' bucket for admin uploads
insert into storage.buckets (id, name, public)
values ('prebuilt-avatars', 'prebuilt-avatars', true)
on conflict (id) do nothing;

-- 3. Policies for 'avatars'
create policy "Public Read Avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Authenticated Upload Avatars"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- 4. Policies for 'prebuilt-avatars'
create policy "Public Read Prebuilt"
  on storage.objects for select
  using ( bucket_id = 'prebuilt-avatars' );

create policy "Authenticated Admin Prebuilt"
  on storage.objects for all
  using ( bucket_id = 'prebuilt-avatars' and auth.role() = 'authenticated' );
