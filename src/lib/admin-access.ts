// Single source of truth for who may open the shop's administration area.
// Only the boutique manager (role checked in the database) gets in; clients and visitors never do.
export type AdminAccess = { hasSession: boolean; isManager: boolean };

export const canEnterAdmin = ({ hasSession, isManager }: AdminAccess) => hasSession && isManager;
