import { createServerFn } from '@tanstack/react-start';
import { getRequestIP, getRequestUrl, setResponseHeader } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import { LOGIN_ERROR, loginSchema } from '@/lib/admin-security';

export const getLoginProtection = createServerFn({ method: 'GET' }).handler(() => {
  setResponseHeader('Cache-Control', 'no-store');
  return { siteKey: process.env['TURNSTILE_SITE_KEY'] ?? '' };
});

export const adminLogin = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => loginSchema.parse(input))
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'no-store');
    // Never trust X-Forwarded-For supplied by a caller. When no trusted peer IP
    // is available, use a shared fail-closed bucket instead of letting callers bypass limits.
    const ip = getRequestIP({ xForwardedFor: false }) ?? 'unknown-peer';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`cycy-login:${ip}`));
    const ipHash = [...new Uint8Array(digest)].map((v) => v.toString(16).padStart(2, '0')).join('');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const attempt = await supabaseAdmin.rpc('consume_admin_login_attempt', { _ip_hash: ipHash });
    if (attempt.error || !attempt.data) return { ok: false as const, error: LOGIN_ERROR };
    const secret = process.env['TURNSTILE_SECRET_KEY'];
    const siteKey = process.env['TURNSTILE_SITE_KEY'];
    // Staged until both real keys are present. No test keys or fake CAPTCHA success.
    if (siteKey) {
      if (!secret) return { ok: false as const, error: LOGIN_ERROR };
      try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST', body: new URLSearchParams({ secret, response: data.captchaToken }), signal: AbortSignal.timeout(10000),
        });
        const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
        if (!response.ok || !result.success || result.hostname !== getRequestUrl().hostname || result.action !== 'admin-login') return { ok: false as const, error: LOGIN_ERROR };
      } catch { return { ok: false as const, error: LOGIN_ERROR }; }
    }
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) return { ok: false as const, error: LOGIN_ERROR };
    const auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const signed = await auth.auth.signInWithPassword({ email: data.email, password: data.password });
    if (signed.error || !signed.data.user || !signed.data.session) return { ok: false as const, error: LOGIN_ERROR };
    // Pre-MFA identity is not privileged access; has_role only grants it after TOTP.
    const roles = await supabaseAdmin.from('user_roles').select('user_id').eq('user_id', signed.data.user.id).eq('role', 'gestionnaire').maybeSingle();
    if (roles.error || !roles.data) {
      await auth.auth.signOut();
      return { ok: false as const, error: LOGIN_ERROR };
    }
    return { ok: true as const, access_token: signed.data.session.access_token, refresh_token: signed.data.session.refresh_token };
  });