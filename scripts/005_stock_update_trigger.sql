-- Trigger to update inventory stock on sale
create or replace function public.update_stock_on_sale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inventory
  set stock = stock - new.quantity,
      updated_at = now()
  where id = new.inventory_id;
  
  return new;
end;
$$;

drop trigger if exists on_sale_created on public.sales;

create trigger on_sale_created
  after insert on public.sales
  for each row
  execute function public.update_stock_on_sale();
