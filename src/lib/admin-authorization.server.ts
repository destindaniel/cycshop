type Checks = { currentUser: () => Promise<string | null>; managerRole: () => Promise<boolean> };

/** Identity is revalidated before any role check or private operation. */
export async function authorizeManager(expectedUserId: string, checks: Checks) {
  if (await checks.currentUser() !== expectedUserId) return false;
  return checks.managerRole();
}