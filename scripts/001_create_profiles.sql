-- Create profiles table for user management with approval workflow
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'disabled')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Allow users to view their own profile
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Allow admins to view all profiles
create policy "profiles_select_admin"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow admins to update any profile (for approval/disable)
create policy "profiles_update_admin"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow insert for new users (via trigger)
create policy "profiles_insert_trigger"
  on public.profiles for insert
  with check (true);
