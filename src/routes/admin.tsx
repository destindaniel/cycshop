import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { checkManager } from '@/hooks/use-auth';
import { canEnterAdmin } from '@/lib/admin-access';

// Session lives in browser storage, so the gate runs client-side; RLS enforces every write server-side.
export const Route = createFileRoute('/admin')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Administration | CYCY shop' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  beforeLoad: async ({ location }) => {
    if (location.pathname === '/admin/login') return;
    const { data } = await supabase.auth.getUser();
    const isManager = data.user ? await checkManager(data.user.id) : false;
    if (!canEnterAdmin({ hasSession: !!data.user, isManager })) throw redirect({ to: '/compte' });
  },
  component: () => <Outlet />,
});
