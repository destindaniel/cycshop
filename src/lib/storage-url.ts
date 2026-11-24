/** Server requests use their own backend origin; browser storage URLs must not. */
export function browserStorageUrl(signedUrl: string) {
  const origin = import.meta.env['VITE_SUPABASE_URL'];
  if (!origin) return signedUrl;
  const url = new URL(signedUrl);
  if (!url.pathname.startsWith('/storage/v1/object/sign/products-images/')) throw new Error('Lien de photo invalide.');
  const browser = new URL(origin);
  return `${browser.origin}${url.pathname}${url.search}`;
}