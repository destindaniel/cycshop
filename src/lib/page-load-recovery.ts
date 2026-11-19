const recoveryKey = 'cycy:page-load-recovery';
const retryWindow = 60_000;

export function isPageModuleError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk .+ failed/i.test(error.message);
}

// Retry an outdated page bundle once, without creating a reload loop when offline.
export function recoverPageModule(error: unknown, storage: Pick<Storage, 'getItem' | 'setItem'>, reload: () => void, now = Date.now()): boolean {
  if (!isPageModuleError(error)) return false;
  try {
    const previous = storage.getItem(recoveryKey);
    if (previous !== null && now - Number(previous) < retryWindow) return false;
    storage.setItem(recoveryKey, String(now));
    reload();
    return true;
  } catch {
    return false;
  }
}