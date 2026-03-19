-- Create profiles table for user management with approval workflow
create table if not exists public.profiles (
  id uuid primary key,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user', 'owner', 'manager', 'staff', 'main admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'disabled')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);


