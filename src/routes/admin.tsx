import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { pageHead } from '@/lib/storefront';
export const Route = createFileRoute('/admin')({
  ssr: false,
  head: () => ({ meta: [...pageHead('Ancien accès administrateur', 'Accès privé CYCY shop.').meta, { name: 'robots', content: 'noindex, nofollow' }] }),
  beforeLoad: ({ location }) => { throw redirect({ to: location.pathname === '/admin/login' ? '/compte' : '/gestion-cycy' }); },
  component: () => <Outlet />,
});
