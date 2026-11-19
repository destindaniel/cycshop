-- Public (anon) reads no longer evaluate the role-check function, so it can be closed to anonymous callers.
drop policy if exists "Public categories" on public.categories;
create policy "Public categories" on public.categories for select to anon using (is_public);
create policy "Authenticated categories" on public.categories for select to authenticated using (is_public or public.has_role(auth.uid(),'gestionnaire'));

drop policy if exists "Active products" on public.products;
create policy "Active products" on public.products for select to anon using (is_active);
create policy "Authenticated products" on public.products for select to authenticated using (is_active or public.has_role(auth.uid(),'gestionnaire'));

drop policy if exists "Active promotions" on public.promotions;
create policy "Active promotions" on public.promotions for select to anon using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy "Authenticated promotions" on public.promotions for select to authenticated using ((is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())) or public.has_role(auth.uid(),'gestionnaire'));

-- Only signed-in sessions may ask whether an account is a manager.
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role, postgres;