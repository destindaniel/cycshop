alter table public.orders alter column user_id drop not null;
grant execute on function public.place_order(jsonb,text,text,text,text,text,text,text) to anon;