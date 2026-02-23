-- Create sliders table
create table public.sliders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  subtitle text,
  type text check (type in ('image', 'video', 'text')) default 'text',
  media_url text,
  is_active boolean default true
);

-- Enable RLS
alter table public.sliders enable row level security;

-- Create policies
create policy "Enable read access for all users" on public.sliders
  for select using (true);

create policy "Enable insert access for authenticated users only" on public.sliders
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update access for authenticated users only" on public.sliders
  for update using (auth.role() = 'authenticated');

create policy "Enable delete access for authenticated users only" on public.sliders
  for delete using (auth.role() = 'authenticated');
