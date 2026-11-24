import { createServerFn } from '@tanstack/react-start';

/** Signs images of active products server-side with a short lifetime; visitors never read storage directly. */
export const signActiveProductImages = createServerFn({ method: 'GET' }).handler(async () => {
  const { publicCatalogClient, signPublicPaths } = await import('@/lib/public-images.server');
  const { data, error } = await publicCatalogClient().from('products').select('images').eq('is_active', true);
  if (error) throw new Error('Images indisponibles');
  const paths = [...new Set((data ?? []).flatMap((p) => p.images))];
  return signPublicPaths(paths);
});
