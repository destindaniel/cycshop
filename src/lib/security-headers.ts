import { synchronizeScriptNonces } from '@/lib/csp-html';

export const isAdminRequest = (path: string) => path === '/admin' || path.startsWith('/admin/') || path === '/gestion-cycy' || path.startsWith('/gestion-cycy/');

/** A per-request nonce permits hydration without allowing arbitrary inline JavaScript. */
export async function secureResponse(request: Request, response: Response, nonce?: string) {
  const headers = new Headers(response.headers);
  const url = new URL(request.url);
  const privatePage = isAdminRequest(url.pathname);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (privatePage) { headers.set('X-Frame-Options', 'DENY'); headers.set('Cache-Control', 'no-store'); }
  if (url.pathname === '/compte') headers.set('Cache-Control', 'no-store');
  if (!headers.get('Content-Type')?.includes('text/html')) return new Response(response.body, { status: response.status, statusText: response.statusText, headers });

  // Finish the SSR stream before assigning CSP so early/late bootstrap scripts
  // and preview entry scripts all receive the same nonce as the response header.
  const source = await response.text();
  const html = nonce ? synchronizeScriptNonces(source, nonce) : source;
  // A cached document must never be combined with a different request's CSP nonce.
  headers.set('Cache-Control', 'no-store');
  const hashes = new Set<string>();
  for (const match of (html ?? '').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = match[1] ?? ''; const body = match[2] ?? '';
    if (!body.trim() || /\bsrc\s*=/i.test(attributes)) continue;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
    hashes.add(`'sha256-${btoa(String.fromCharCode(...new Uint8Array(digest)))}'`);
  }
  const localDevelopment = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  const configuredBackend = import.meta.env['VITE_SUPABASE_URL'];
  const backendOrigin = configuredBackend ? new URL(configuredBackend).origin : '';
  headers.set('Content-Security-Policy', [
    "default-src 'self'",
    `script-src 'self' https://challenges.cloudflare.com ${nonce ? `'nonce-${nonce}'` : [...hashes].join(' ')}`,
    // React and Motion use inline style properties, not executable inline scripts.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: ${backendOrigin} https://storage.googleapis.com`,
    `connect-src 'self' ${backendOrigin} https://challenges.cloudflare.com${localDevelopment ? ' ws://localhost:8080 ws://127.0.0.1:8080' : ''}`,
    "frame-src https://challenges.cloudflare.com",
    `frame-ancestors ${privatePage ? "'none'" : "'self' https://lovable.dev https://*.lovable.dev https://*.lovable.app"}`,
    "object-src 'none'", "base-uri 'none'", "form-action 'self'",
    ...(localDevelopment ? [] : ['upgrade-insecure-requests']),
  ].join('; '));
  headers.delete('Content-Length');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}