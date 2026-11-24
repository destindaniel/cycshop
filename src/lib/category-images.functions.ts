import { createServerFn } from '@tanstack/react-start';

/** Signs images of public categories server-side, so visitors never read storage directly. */
export const signPublicCategoryImages = createServerFn({ method: 'GET' }).handler(async () => {
  const { publicCatalogClient, signPublicPaths } = await import('@/lib/public-images.server');
  const { data, error } = await publicCatalogClient().from('categories').select('image_url').eq('is_public', true);
  if (error) throw new Error('Images indisponibles');
  const paths = (data ?? []).map((c) => c.image_url).filter((p): p is string => !!p && !p.startsWith('http'));
  return signPublicPaths(paths);
});
