-- Trigger to auto-create profile on signup
-- First user becomes admin and is auto-approved
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count integer;
begin
  select count(*) into user_count from public.profiles;
  
  if user_count = 0 then
    -- First user becomes admin and is auto-approved
    insert into public.profiles (id, email, role, status)
    values (
      new.id,
      new.email,
      'admin',
      'approved'
    )
    on conflict (id) do nothing;
  else
    -- Subsequent users are pending approval
    insert into public.profiles (id, email, role, status)
    values (
      new.id,
      new.email,
      'user',
      'pending'
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
