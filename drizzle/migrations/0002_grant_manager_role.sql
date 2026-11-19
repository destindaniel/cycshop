
create or replace function public.grant_manager_if_owner() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if lower(new.email) = 'cycyshop242@gmail.com' and new.email_confirmed_at is not null then
    insert into public.user_roles(user_id, role) values (new.id, 'gestionnaire') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_manager after insert or update of email_confirmed_at on auth.users for each row execute function public.grant_manager_if_owner();
insert into public.user_roles(user_id, role) select id, 'gestionnaire' from auth.users where lower(email)='cycyshop242@gmail.com' and email_confirmed_at is not null on conflict do nothing;
