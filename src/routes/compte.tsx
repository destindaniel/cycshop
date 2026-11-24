import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, checkManager } from '@/hooks/use-auth';
import { pageHead } from '@/lib/storefront';
import { AdminMfa } from '@/components/admin/admin-mfa';

export const Route = createFileRoute('/compte')({ head: () => { const head = pageHead('Connexion administrateur', 'Accès privé et double vérification pour la gestion de CYCY shop.'); return { meta: [...head.meta, { name: 'robots', content: 'noindex, nofollow' }] }; }, component: AccountPage });

function AccountPage() {
  const { user, isManager, loading } = useAuth();
  return <main className="min-h-dvh bg-background px-5 py-12 grid place-items-center"><section className="w-full max-w-sm space-y-8"><p className="text-xl font-semibold text-primary">CYCY shop</p>{loading ? <p role="status" className="text-sm text-muted-foreground">Chargement…</p> : user && isManager ? <AdminMfa /> : <AdminLogin />}</section></main>;
}

function AdminLogin() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) { toast.error('E-mail ou mot de passe incorrect.'); return; }
      if (!(await checkManager(data.user.id))) { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); toast.error('Ce compte n’a pas accès à l’administration.'); return; }
      setPassword('');
      // AuthProvider exposes the second-factor step, not the dashboard.
    } catch { toast.error('Connexion impossible. Vérifiez votre connexion et réessayez.'); }
    finally { setBusy(false); }
  };
  return <div><h1 className="text-2xl font-semibold">Connexion administrateur</h1><form className="form-stack" onSubmit={submit}><label>E-mail<Input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Mot de passe<Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label><Button type="submit" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</Button></form></div>;
}
