-- Create brands table
create table public.brands (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  logo_url text not null,
  is_active boolean default true,
  row_category text check (row_category in ('upper', 'lower')) default 'upper'
);

-- Enable RLS
alter table public.brands enable row level security;

-- Create policies
create policy "Enable read access for all users" on public.brands
  for select using (true);

create policy "Enable insert access for authenticated users only" on public.brands
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update access for authenticated users only" on public.brands
  for update using (auth.role() = 'authenticated');

create policy "Enable delete access for authenticated users only" on public.brands
  for delete using (auth.role() = 'authenticated');
