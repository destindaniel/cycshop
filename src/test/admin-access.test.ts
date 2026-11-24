import { describe, expect, it } from "vitest";

import { canEnterAdmin, isTotpCode } from "@/lib/admin-access";

describe("Admin access", () => {
  it("opens only for a signed-in manager with verified MFA", () => {
    expect(canEnterAdmin({ hasSession: true, isManager: true, assuranceLevel: 'aal2' })).toBe(true);
  });

  it("stays closed for a signed-in client and for anyone not signed in", () => {
    expect(canEnterAdmin({ hasSession: true, isManager: false, assuranceLevel: 'aal2' })).toBe(false);
    expect(canEnterAdmin({ hasSession: false, isManager: false, assuranceLevel: 'aal2' })).toBe(false);
    expect(canEnterAdmin({ hasSession: false, isManager: true, assuranceLevel: 'aal2' })).toBe(false);
  });
  it("rejects a manager without a second factor even when signed in", () => {
    expect(canEnterAdmin({ hasSession: true, isManager: true, assuranceLevel: 'aal1' })).toBe(false);
    expect(canEnterAdmin({ hasSession: true, isManager: true, assuranceLevel: null })).toBe(false);
  });
  it("accepts exactly six digits for a TOTP code", () => {
    expect(isTotpCode('123456')).toBe(true);
    for (const code of ['12345', '1234567', 'abcdef', ' 123456', '１２３４５６']) expect(isTotpCode(code)).toBe(false);
  });
});
