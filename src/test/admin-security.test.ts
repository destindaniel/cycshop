import { describe, expect, it } from 'vitest';
import { ADMIN_SESSION_SECONDS, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_SECONDS, adminWriteSchema, imagePathsSchema, sessionIsCurrent } from '@/lib/admin-security';
import { secureResponse } from '@/lib/security-headers';

describe('Administration security rules', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  it('limits manager sessions to exactly seven days even with renewed access tokens', () => {
    const start = Date.parse('2026-11-01T00:00:00Z');
    expect(ADMIN_SESSION_SECONDS).toBe(604800);
    expect(sessionIsCurrent('2026-11-01T00:00:00Z', start + 604799000)).toBe(true);
    expect(sessionIsCurrent('2026-11-01T00:00:00Z', start + 604800000)).toBe(false);
    expect(sessionIsCurrent('invalid', start)).toBe(false);
  });
  it('uses five attempts in a fifteen minute window', () => {
    expect(LOGIN_MAX_ATTEMPTS).toBe(5);
    expect(LOGIN_WINDOW_SECONDS).toBe(900);
  });
  it('does not accept arbitrary tables, roles or order prices from a browser', () => {
    expect(adminWriteSchema.safeParse({ kind: 'delete', table: 'user_roles', id }).success).toBe(false);
    expect(adminWriteSchema.safeParse({ kind: 'order-status', id, status: 'livree', total: 1 }).success).toBe(true);
    const accepted = adminWriteSchema.parse({ kind: 'order-status', id, status: 'livree', total: 1 });
    expect(accepted).not.toHaveProperty('total');
    expect(adminWriteSchema.safeParse({ kind: 'stock', id, stock: -1 }).success).toBe(false);
    expect(adminWriteSchema.safeParse({ kind: 'stock', id, stock: 3 }).success).toBe(true);
  });
  it('does not permit remote image URLs or path traversal as storage paths', () => {
    expect(imagePathsSchema.safeParse(['../private.png']).success).toBe(false);
    expect(imagePathsSchema.safeParse(['https://example.com/image.png']).success).toBe(false);
    expect(imagePathsSchema.safeParse(['categories/photo.webp']).success).toBe(true);
  });
  it('denies framing for both the old and new administration paths', async () => {
    for (const path of ['/admin', '/admin/dashboard', '/gestion-cycy']) {
      const response = await secureResponse(new Request(`https://cycshop.lovable.app${path}`), new Response('ok'));
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    }
    const storefront = await secureResponse(new Request('https://cycshop.lovable.app/'), new Response('ok'));
    expect(storefront.headers.get('X-Frame-Options')).toBeNull();
  });
  it('applies CSP with no executable inline-script wildcard and standard security headers', async () => {
    const response = await secureResponse(new Request('https://cycshop.lovable.app/gestion-cycy'), new Response('<html><script>window.test=1</script></html>', { headers: { 'Content-Type': 'text/html' } }), 'test-nonce');
    const policy = response.headers.get('Content-Security-Policy') ?? '';
    expect(policy).toContain("script-src 'self' https://challenges.cloudflare.com 'nonce-test-nonce'");
    expect(policy.split(';').find((part) => part.includes('script-src'))).not.toContain('unsafe-inline');
    expect(policy).toContain("frame-ancestors 'none'");
    expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });
});