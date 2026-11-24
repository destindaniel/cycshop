import { act, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { useAdminData } from '@/hooks/use-admin-data';

const state = vi.hoisted(() => ({ search: '', fetch: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({ useRouterState: ({ select }: { select: (value: { location: { searchStr: string } }) => unknown }) => select({ location: { searchStr: state.search } }) }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock('@/lib/admin.functions', () => ({ getAdminData: state.fetch, writeAdminData: vi.fn(), uploadAdminImage: vi.fn(), removeAdminImages: vi.fn(), changeAdminPassword: vi.fn() }));

describe('Screen-level server revalidation', () => {
  it('rechecks every screen, blocks stale data after a refusal, and does not refetch forever as children mount', async () => {
    state.search = '';
    state.fetch.mockReset().mockResolvedValue({ products: [], categories: [], orders: [], profiles: [], promotions: [], audit: [], urls: {} });
    let exposed = false;
    function Child() { useAdminData('products'); return null; }
    function Screen() {
      const access = useAdminData('audit', true);
      exposed = !access.isPending && !access.isFetching && !access.isError;
      return exposed ? <Child /> : null;
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = () => <QueryClientProvider client={client}><Screen /></QueryClientProvider>;
    const screen = render(view());
    await waitFor(() => expect(exposed).toBe(true));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });
    expect(state.fetch).toHaveBeenCalledTimes(1);
    state.search = '?tab=produits'; screen.rerender(view());
    await waitFor(() => expect(state.fetch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(exposed).toBe(true));
    state.fetch.mockRejectedValueOnce(new Error('403 — Accès refusé'));
    state.search = ''; screen.rerender(view());
    await waitFor(() => expect(state.fetch).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(exposed).toBe(false));
    screen.unmount(); client.clear();
  });
});