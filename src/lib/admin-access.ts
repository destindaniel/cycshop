// Single source of truth for who may open the shop's administration area.
// Only the boutique manager (role checked in the database) gets in; clients and visitors never do.
export type AdminAccess = { hasSession: boolean; isManager: boolean; assuranceLevel: string | null };

export const canEnterAdmin = ({ hasSession, isManager }: AdminAccess) => hasSession && isManager;

export const isTotpCode = (code: string) => /^\d{6}$/.test(code);

// Set only after a successful password login in this tab; cleared when the tab/browser closes.
export const ADMIN_UNLOCK_KEY = 'cycy-admin-unlocked';
