import { describe, expect, it, vi } from 'vitest';
import { recoverPageModule } from '@/lib/page-load-recovery';

describe('Page module recovery', () => {
  it('reloads a missing account page bundle only once within a minute', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    const reload = vi.fn();
    const error = new TypeError('Failed to fetch dynamically imported module: https://example.test/assets/compte-old.js');
    expect(recoverPageModule(error, storage, reload, 100_000)).toBe(true);
    expect(recoverPageModule(error, storage, reload, 100_001)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(recoverPageModule(error, storage, reload, 160_000)).toBe(true);
  });

  it('does not reload for a rejected login or another application error', () => {
    const reload = vi.fn();
    expect(recoverPageModule(new Error('Invalid login credentials'), sessionStorage, reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('keeps the retry screen available when storage is blocked', () => {
    const reload = vi.fn();
    const storage = { getItem: () => { throw new Error('Storage blocked'); }, setItem: vi.fn() };
    expect(recoverPageModule(new Error('Importing a module script failed'), storage, reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});