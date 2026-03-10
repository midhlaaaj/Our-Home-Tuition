-- Create jobs table
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  class_id integer not null, -- 1 to 10
  subject_id uuid references public.class_subjects(id) on delete set null,
  is_active boolean default true
);

-- Create job_applications table
create table public.job_applications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  job_id uuid references public.jobs(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null,
  experience text,
  class_ids integer[] default '{}', -- For general applications
  subject_ids uuid[] default '{}',   -- For general applications
  cv_url text,
  video_url text
);

-- Enable RLS
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;

-- Create policies for jobs
create policy "Enable read access for all users" on public.jobs
  for select using (true);

create policy "Enable all access for authenticated users" on public.jobs
  for all using (auth.role() = 'authenticated');

-- Create policies for job_applications
create policy "Enable insert for all users" on public.job_applications
  for insert with check (true);

create policy "Enable read for authenticated users only" on public.job_applications
  for select using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only" on public.job_applications
  for delete using (auth.role() = 'authenticated');
