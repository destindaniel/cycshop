import { createServerFn } from '@tanstack/react-start';

/** Signs images of public categories server-side, so visitors never read storage directly. */
export const signPublicCategoryImages = createServerFn({ method: 'GET' }).handler(async () => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin.from('categories').select('image_url').eq('is_public', true);
  if (error) throw new Error('Images indisponibles');
  const paths = (data ?? []).map((c) => c.image_url).filter((p): p is string => !!p && !p.startsWith('http'));
  if (!paths.length) return {} as Record<string, string>;
  const { data: signed } = await supabaseAdmin.storage.from('products-images').createSignedUrls(paths, 60 * 10);
  const out: Record<string, string> = {};
  for (const it of signed ?? []) if (it.path && it.signedUrl) out[it.path] = it.signedUrl;
  return out;
});
