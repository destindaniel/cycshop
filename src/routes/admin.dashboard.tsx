import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { BarChart3, Boxes, FolderTree, LayoutDashboard, LogOut, Package, Percent, ShoppingCart, UserCog, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { canEnterAdmin } from '@/lib/admin-access';
import { pageHead } from '@/lib/storefront';
import { AccountSettings, Categories, Customers, OrdersTable, Overview, Products, Promotions, Stats, Stocks } from '@/components/admin/admin-sections';

const tabs = [
  { id: 'apercu', label: 'Vue d’ensemble', icon: LayoutDashboard }, { id: 'produits', label: 'Produits', icon: Package },
  { id: 'categories', label: 'Catégories', icon: FolderTree }, { id: 'commandes', label: 'Commandes', icon: ShoppingCart },
  { id: 'clients', label: 'Clients', icon: Users }, { id: 'stocks', label: 'Stocks', icon: Boxes },
  { id: 'promotions', label: 'Promotions', icon: Percent }, { id: 'statistiques', label: 'Statistiques', icon: BarChart3 },
  { id: 'compte', label: 'Mon compte', icon: UserCog },
] as const;
type Tab = (typeof tabs)[number]['id'];

export const Route = createFileRoute('/admin/dashboard')({
  head: () => ({ ...pageHead('Tableau de bord administrateur', 'Gestion privée des produits, stocks et commandes de CYCY shop.'), meta: [...pageHead('Tableau de bord administrateur', 'Gestion privée des produits, stocks et commandes de CYCY shop.').meta, { name: 'robots', content: 'noindex, nofollow' }] }),
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => { const t = s['tab']; return tabs.some((x) => x.id === t) ? { tab: t as Tab } : {}; },
  component: Dashboard,
});

function Dashboard() {
  const { tab = 'apercu' } = Route.useSearch(); const navigate = useNavigate(); const queryClient = useQueryClient(); const { user, isManager, assuranceLevel, loading } = useAuth();
  // Second lock: the route gate already blocks non-managers, but the panel never renders without a confirmed manager session.
  const allowed = canEnterAdmin({ hasSession: !!user, isManager, assuranceLevel });
  useEffect(() => { if (!loading && !allowed) void navigate({ to: '/compte', replace: true }); }, [loading, allowed, navigate]);
  if (loading) return <main className="admin-main"><p className="text-sm text-muted-foreground">Vérification de l’accès…</p></main>;
  if (!allowed) return null;
  const current = tabs.find((t) => t.id === tab) ?? tabs[0];
  return <div className="admin-shell"><aside className="admin-side"><p className="logo">CYCY<span> admin</span></p>{tabs.map((t) => <Button variant="ghost" key={t.id} className={t.id === tab ? 'active justify-start' : 'justify-start'} onClick={() => navigate({ to: '/admin/dashboard', search: { tab: t.id } })}><t.icon size={16} />{t.label}</Button>)}<Button variant="ghost" className="md:mt-auto justify-start" onClick={async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: '/compte', replace: true }); }}><LogOut size={16} />Déconnexion</Button></aside><main className="admin-main"><h1>{current.label}</h1>
    {tab === 'apercu' && <Overview />}{tab === 'produits' && <Products />}{tab === 'categories' && <Categories />}{tab === 'commandes' && <OrdersTable />}{tab === 'clients' && <Customers />}{tab === 'stocks' && <Stocks />}{tab === 'promotions' && <Promotions />}{tab === 'statistiques' && <Stats />}{tab === 'compte' && <AccountSettings email={user?.email ?? ''} />}
  </main></div>;
}
