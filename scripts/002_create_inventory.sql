-- Create inventory table
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  buy_price decimal(10,2) not null,
  gst_percentage decimal(5,2) not null default 18.00,
  stock integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.inventory enable row level security;

-- Allow approved users to view inventory
create policy "inventory_select_approved"
  on public.inventory for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'approved'
    )
  );

-- Allow admins to insert inventory
create policy "inventory_insert_admin"
  on public.inventory for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and status = 'approved'
    )
  );

-- Allow admins to update inventory
create policy "inventory_update_admin"
  on public.inventory for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and status = 'approved'
    )
  );
