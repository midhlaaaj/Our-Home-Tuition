-- Create bookings table
create table public.bookings (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    class_id integer not null,
    curriculum text not null,
    selected_units jsonb not null default '[]',
    primary_student jsonb not null default '{}',
    class_type text not null check (class_type in ('individual', 'group')),
    additional_students jsonb not null default '[]',
    status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- Enable RLS
alter table public.bookings enable row level security;

-- Create policies
create policy "Users can view their own bookings"
on public.bookings for select
using (auth.uid() = user_id);

create policy "Users can insert their own bookings"
on public.bookings for insert
with check (auth.uid() = user_id);

create policy "Users can update their own bookings"
on public.bookings for update
using (auth.uid() = user_id);

-- Admin policies (assuming meta_role/role in auth.users.raw_user_meta_data or a profiles table)
-- For now, let's stick to the profiles table pattern seen in AuthContext
create policy "Admins can view all bookings"
on public.bookings for select
using (
    exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    )
);
