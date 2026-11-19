import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { checkManager } from '@/hooks/use-auth';

export const Route = createFileRoute('/admin/login')({ component: AdminLogin });

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [reset, setReset] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    if (reset) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      setBusy(false); if (error) toast.error('Envoi impossible. Réessayez.'); else toast.success('Si ce compte existe, un lien de réinitialisation a été envoyé.');
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) { setBusy(false); toast.error('E-mail ou mot de passe incorrect.'); return; }
    if (!(await checkManager(data.user.id))) { await supabase.auth.signOut(); setBusy(false); toast.error('Ce compte n’a pas accès à l’administration.'); return; }
    navigate({ to: '/admin/dashboard' });
  };
  return <main className="min-h-screen grid place-items-center bg-primary px-4"><div className="form-panel w-full" style={{ margin: 0 }}><p className="logo">CYCY<span> shop</span></p><h1 className="mt-4">{reset ? 'Réinitialiser' : 'Espace gestionnaire'}</h1><p className="text-sm text-muted-foreground">Accès réservé à la gestion de la boutique.</p><form className="form-stack" onSubmit={submit}><label>E-mail<Input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>{!reset && <label>Mot de passe<Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>}<Button type="submit" disabled={busy}>{reset ? 'Envoyer le lien' : 'Se connecter'}</Button></form><button className="underline text-xs mt-5" onClick={() => setReset(!reset)}>{reset ? 'Retour à la connexion' : 'Mot de passe oublié ?'}</button></div></main>;
}
