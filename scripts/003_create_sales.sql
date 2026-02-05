-- Create sales table
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.inventory(id),
  user_id uuid not null references auth.users(id),
  quantity integer not null,
  sale_price decimal(10,2) not null,
  total_amount decimal(10,2) not null,
  gst_amount decimal(10,2) not null,
  profit decimal(10,2) not null,
  sale_date date not null default current_date,
  created_at timestamp with time zone default now()
);

alter table public.sales enable row level security;

-- Allow approved users to view all sales
create policy "sales_select_approved"
  on public.sales for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'approved'
    )
  );

-- Allow approved users to insert sales
create policy "sales_insert_approved"
  on public.sales for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'approved'
    )
    and auth.uid() = user_id
  );
