import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, checkManager } from '@/hooks/use-auth';
import { pageHead } from '@/lib/storefront';

export const Route = createFileRoute('/compte')({ head: () => pageHead('Connexion administrateur', 'Accès réservé à la gestion de la boutique CYCY shop.'), component: AccountPage });

function AccountPage() {
  const { user, isManager, loading } = useAuth();
  if (loading) return <main className="wrap section"><p className="text-sm text-muted-foreground">Chargement…</p></main>;
  return user && isManager ? <AdminAccount email={user.email ?? ''} /> : <AdminLogin />;
}

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) { setBusy(false); toast.error('E-mail ou mot de passe incorrect.'); return; }
    if (!(await checkManager(data.user.id))) { await supabase.auth.signOut(); setBusy(false); toast.error('Ce compte n’a pas accès à l’administration.'); return; }
    navigate({ to: '/admin/dashboard' });
  };
  return <main className="wrap"><div className="form-panel"><h1>Connexion administrateur</h1><p className="text-sm text-muted-foreground">Accès réservé à la gestion de la boutique.</p><form className="form-stack" onSubmit={submit}><label>E-mail<Input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Mot de passe<Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label><Button type="submit" disabled={busy}>Se connecter</Button></form></div></main>;
}

function AdminAccount({ email }: { email: string }) {
  return <main className="wrap account-page"><div className="flex items-end justify-between gap-4 flex-wrap"><div><p className="overline">Espace administrateur</p><h1 className="font-display text-4xl">Mon compte</h1><p className="text-sm text-muted-foreground mt-2">{email}</p></div><div className="flex items-center gap-3"><Button variant="outline" onClick={() => supabase.auth.signOut()}>Se déconnecter</Button><Button asChild variant="outline"><Link to="/admin/dashboard">Administration</Link></Button></div></div></main>;
}
