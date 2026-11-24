import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { getAdminAssurance } from '@/lib/admin-session';
import { checkManager } from '@/hooks/use-auth';
import { redirect } from '@tanstack/react-router';
import { useAdminData } from '@/hooks/use-admin-data';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { BarChart3, Boxes, FolderTree, LayoutDashboard, LogOut, Package, Percent, ShoppingCart, UserCog, Users, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { canEnterAdmin } from '@/lib/admin-access';
import { pageHead } from '@/lib/storefront';
import { AccountSettings, AuditLog, Categories, Customers, OrdersTable, Overview, Products, Promotions, Stats, Stocks } from '@/components/admin/admin-sections';

const tabs = [
  { id: 'apercu', label: 'Vue d’ensemble', icon: LayoutDashboard }, { id: 'produits', label: 'Produits', icon: Package },
  { id: 'categories', label: 'Catégories', icon: FolderTree }, { id: 'commandes', label: 'Commandes', icon: ShoppingCart },
  { id: 'clients', label: 'Clients', icon: Users }, { id: 'stocks', label: 'Stocks', icon: Boxes },
  { id: 'promotions', label: 'Promotions', icon: Percent }, { id: 'statistiques', label: 'Statistiques', icon: BarChart3 },
  { id: 'journal', label: 'Journal', icon: ShieldCheck },
  { id: 'compte', label: 'Mon compte', icon: UserCog },
] as const;
type Tab = (typeof tabs)[number]['id'];

export const Route = createFileRoute('/gestion-cycy')({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    const isManager = data.user ? await checkManager(data.user.id) : false;
    const assuranceLevel = data.user ? await getAdminAssurance() : null;
    if (!canEnterAdmin({ hasSession: !!data.user, isManager, assuranceLevel })) throw redirect({ to: '/compte' });
  },
  head: () => ({ ...pageHead('Tableau de bord administrateur', 'Gestion privée des produits, stocks et commandes de CYCY shop.'), meta: [...pageHead('Tableau de bord administrateur', 'Gestion privée des produits, stocks et commandes de CYCY shop.').meta, { name: 'robots', content: 'noindex, nofollow' }] }),
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => { const t = s['tab']; return tabs.some((x) => x.id === t) ? { tab: t as Tab } : {}; },
  component: Dashboard,
});

function Dashboard() {
  const { tab = 'apercu' } = Route.useSearch(); const navigate = useNavigate(); const queryClient = useQueryClient(); const { user, isManager, assuranceLevel, loading } = useAuth();
  // Second lock: the route gate already blocks non-managers, but the panel never renders without a confirmed manager session.
  const allowed = canEnterAdmin({ hasSession: !!user, isManager, assuranceLevel });
  const serverAccess = useAdminData('audit');
  if (loading) return <main className="admin-main"><p className="text-sm text-muted-foreground">Vérification de l’accès…</p></main>;
  if (!allowed || serverAccess.isError) return <main className="admin-main"><h1>403 · Accès refusé</h1><p role="alert">Reconnectez-vous et vérifiez votre code de sécurité.</p><Button onClick={async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: '/compte', replace: true }); }}>Se reconnecter</Button></main>;
  if (serverAccess.isPending) return <main className="admin-main"><p role="status">Vérification de l’accès…</p></main>;
  const current = tabs.find((t) => t.id === tab) ?? tabs[0];
  return <div className="admin-shell"><aside className="admin-side"><p className="logo">CYCY<span> admin</span></p>{tabs.map((t) => <Button variant="ghost" key={t.id} className={t.id === tab ? 'active justify-start' : 'justify-start'} onClick={() => navigate({ to: '/gestion-cycy', search: { tab: t.id } })}><t.icon size={16} />{t.label}</Button>)}<Button variant="ghost" className="md:mt-auto justify-start" onClick={async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: '/compte', replace: true }); }}><LogOut size={16} />Déconnexion</Button></aside><main className="admin-main"><h1>{current.label}</h1>
    {tab === 'apercu' && <Overview />}{tab === 'produits' && <Products />}{tab === 'categories' && <Categories />}{tab === 'commandes' && <OrdersTable />}{tab === 'clients' && <Customers />}{tab === 'stocks' && <Stocks />}{tab === 'promotions' && <Promotions />}{tab === 'statistiques' && <Stats />}{tab === 'journal' && <AuditLog />}{tab === 'compte' && <AccountSettings email={user?.email ?? ''} />}
  </main></div>;
}
