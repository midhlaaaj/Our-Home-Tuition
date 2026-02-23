-- 1. Create the 'mentors' table
create table if not exists mentors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subject text not null,
  description text not null,
  image_url text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Turn on Row Level Security (RLS)
alter table mentors enable row level security;

-- 3. Create policies for the 'mentors' TABLE

-- Allow public read access (everyone can see mentors)
create policy "Mentors Public Read"
on mentors for select
using ( true );

-- Allow authenticated insert/update/delete (only logged in users/admin)
create policy "Mentors Authenticated Insert"
on mentors for insert
with check ( auth.role() = 'authenticated' );

create policy "Mentors Authenticated Update"
on mentors for update
with check ( auth.role() = 'authenticated' );

create policy "Mentors Authenticated Delete"
on mentors for delete
using ( auth.role() = 'authenticated' );


-- 4. Create a storage bucket for 'mentors' images
insert into storage.buckets (id, name, public)
values ('mentors', 'mentors', true)
on conflict (id) do nothing;

-- 5. Set up security policies for the 'mentors' BUCKET

-- ALLOW PUBLIC READ ACCESS (Anyone can view mentor images)
drop policy if exists "Mentors Bucket Public Access" on storage.objects;
create policy "Mentors Bucket Public Access"
on storage.objects for select
using ( bucket_id = 'mentors' );

-- ALLOW AUTHENTICATED UPLOAD ACCESS (Only logged-in users can upload)
drop policy if exists "Mentors Bucket Auth Upload" on storage.objects;
create policy "Mentors Bucket Auth Upload"
on storage.objects for insert
with check ( bucket_id = 'mentors' and auth.role() = 'authenticated' );

-- ALLOW AUTHENTICATED UPDATE ACCESS
drop policy if exists "Mentors Bucket Auth Update" on storage.objects;
create policy "Mentors Bucket Auth Update"
on storage.objects for update
with check ( bucket_id = 'mentors' and auth.role() = 'authenticated' );

-- ALLOW AUTHENTICATED DELETE ACCESS
drop policy if exists "Mentors Bucket Auth Delete" on storage.objects;
create policy "Mentors Bucket Auth Delete"
on storage.objects for delete
using ( bucket_id = 'mentors' and auth.role() = 'authenticated' );