// Single source of truth for who may open the shop's administration area.
// Only the boutique manager (role checked in the database) gets in; clients and visitors never do.
export type AdminAccess = { hasSession: boolean; isManager: boolean; assuranceLevel: string | null };

export const canEnterAdmin = ({ hasSession, isManager, assuranceLevel }: AdminAccess) => hasSession && isManager && assuranceLevel === 'aal2';

export const isTotpCode = (code: string) => /^\d{6}$/.test(code);
