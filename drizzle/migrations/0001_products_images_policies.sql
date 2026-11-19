
create policy "Product images readable" on storage.objects for select to anon, authenticated using (bucket_id = 'products-images');
create policy "Manager uploads product images" on storage.objects for insert to authenticated with check (bucket_id = 'products-images' and public.has_role(auth.uid(),'gestionnaire'));
create policy "Manager updates product images" on storage.objects for update to authenticated using (bucket_id = 'products-images' and public.has_role(auth.uid(),'gestionnaire')) with check (bucket_id = 'products-images' and public.has_role(auth.uid(),'gestionnaire'));
create policy "Manager deletes product images" on storage.objects for delete to authenticated using (bucket_id = 'products-images' and public.has_role(auth.uid(),'gestionnaire'));
