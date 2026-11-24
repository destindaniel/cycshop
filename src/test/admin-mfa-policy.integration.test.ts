import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import type { Database } from '@/integrations/supabase/types';

// Run against a disposable manager whose MFA enforcement was activated by the
// test operator. Never supply an owner's token or an administrator service key.
const url = process.env['TEST_MFA_URL'];
const key = process.env['TEST_MFA_PUBLIC_KEY'];
const token = process.env['TEST_MFA_AAL1_TOKEN'];
const userId = process.env['TEST_MFA_USER_ID'];

describe.skipIf(!url || !key || !token || !userId)('Activated manager MFA database protection', () => {
  let cachedClient: ReturnType<typeof createClient<Database>> | undefined;
  const client = () => {
    if (!url || !key || !token) throw new Error('Test session is required');
    cachedClient ??= createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
    return cachedClient;
  };

  it('refuses privileged role access for an activated manager at aal1', async () => {
    if (!userId) throw new Error('Disposable user ID is required');
    const result = await client().rpc('has_role', { _user_id: userId, _role: 'gestionnaire' });
    expect(result.error).toBeNull();
    expect(result.data).toBe(false);
  });

  it('rejects a direct category creation without a verified second factor', async () => {
    const result = await client().from('categories').insert({ name: 'MFA denial test', slug: `mfa-denial-${crypto.randomUUID()}` });
    expect(result.error?.code).toBe('42501');
  });

  it('rejects a direct product image upload without a verified second factor', async () => {
    const result = await client().storage.from('products-images').upload(`mfa-denial-${crypto.randomUUID()}.png`, new Uint8Array([137, 80, 78, 71]), { contentType: 'image/png' });
    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
  });

  it('rejects MFA activation with a password-only session', async () => {
    const result = await client().rpc('activate_admin_mfa');
    expect(result.error?.code).toBe('42501');
  });

  it('does not allow browser credentials to remove the persistent obligation', async () => {
    if (!userId) throw new Error('Disposable user ID is required');
    await client().from('admin_mfa_enforcement').delete().eq('user_id', userId);
    // RLS may return an empty success rather than an error for filtered deletes.
    // What matters is that the activation still exists afterwards.
    const remaining = await client().from('admin_mfa_enforcement').select('user_id').eq('user_id', userId);
    expect(remaining.error).toBeNull();
    expect(remaining.data).toEqual([{ user_id: userId }]);
  });
});