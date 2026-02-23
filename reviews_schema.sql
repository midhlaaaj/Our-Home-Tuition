-- Create the reviews table
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  role text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  message text not null,
  avatar_url text,
  is_active boolean default true
);

-- Enable Row Level Security (RLS)
alter table public.reviews enable row level security;

-- Create Policy: Allow read access to everyone
create policy "Reviews are viewable by everyone"
  on public.reviews for select
  using (true);

-- Create Policy: Allow all access to authenticated users (Simulating Admin for now)
-- In a real prod app, you'd check for a specific role/email.
create policy "Authenticated users can insert reviews"
  on public.reviews for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update reviews"
  on public.reviews for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete reviews"
  on public.reviews for delete
  using (auth.role() = 'authenticated');
