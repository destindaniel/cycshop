import { describe, expect, it, vi } from 'vitest';
import { authorizeManager } from '@/lib/admin-authorization.server';

describe('Server authorization before administrative actions', () => {
  it('allows a revalidated manager, not a browser claim', async () => {
    const checks = { currentUser: vi.fn(async () => 'manager-id'), managerRole: vi.fn(async () => true) };
    expect(await authorizeManager('manager-id', checks)).toBe(true);
    expect(checks.currentUser).toHaveBeenCalledOnce();
    expect(checks.managerRole).toHaveBeenCalledOnce();
    expect(checks.currentUser.mock.invocationCallOrder[0]).toBeLessThan(checks.managerRole.mock.invocationCallOrder[0] ?? 0);
  });
  it('refuses invalid or mismatched JWT identities before even checking the role', async () => {
    for (const identity of [null, 'other-user']) {
      const role = vi.fn(async () => true);
      expect(await authorizeManager('manager-id', { currentUser: async () => identity, managerRole: role })).toBe(false);
      expect(role).not.toHaveBeenCalled();
    }
  });
  it('refuses clients, missing MFA, expired sessions and revoked factors when the database denies the role', async () => {
    expect(await authorizeManager('manager-id', { currentUser: async () => 'manager-id', managerRole: async () => false })).toBe(false);
  });
});