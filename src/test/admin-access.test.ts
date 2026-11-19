import { describe, expect, it } from "vitest";

import { canEnterAdmin } from "@/lib/admin-access";

describe("Admin access", () => {
  it("opens only for a signed-in manager", () => {
    expect(canEnterAdmin({ hasSession: true, isManager: true })).toBe(true);
  });

  it("stays closed for a signed-in client and for anyone not signed in", () => {
    expect(canEnterAdmin({ hasSession: true, isManager: false })).toBe(false);
    expect(canEnterAdmin({ hasSession: false, isManager: false })).toBe(false);
    expect(canEnterAdmin({ hasSession: false, isManager: true })).toBe(false);
  });
});
