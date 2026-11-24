import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { browserStorageUrl } from '@/lib/storage-url';

export function publicCatalogClient() {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Catalogue indisponible');
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key);
    return fetch(input, { ...init, headers });
  } } });
}

/** Only paths selected by the public RLS client may reach this privileged signer. */
export async function signPublicPaths(paths: string[]) {
  const out: Record<string, string> = {};
  if (!paths.length) return out;
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin.storage.from('products-images').createSignedUrls([...new Set(paths)], 600);
  if (error) throw new Error('Photos indisponibles');
  for (const image of data ?? []) if (image.path && image.signedUrl) out[image.path] = browserStorageUrl(image.signedUrl);
  return out;
}