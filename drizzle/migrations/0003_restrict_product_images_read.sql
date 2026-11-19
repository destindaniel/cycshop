DROP POLICY IF EXISTS "Product images readable" ON storage.objects;
CREATE POLICY "Active product images readable" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'products-images' AND EXISTS (SELECT 1 FROM public.products p WHERE p.is_active AND storage.objects.name = ANY(p.images)));
CREATE POLICY "Manager reads product images" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'products-images' AND public.has_role(auth.uid(), 'gestionnaire'::public.app_role));