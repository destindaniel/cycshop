import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, checkManager } from '@/hooks/use-auth';
import { pageHead } from '@/lib/storefront';
import { useEffect } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { adminLogin, getLoginProtection } from '@/lib/admin-login.functions';
import { LOGIN_ERROR } from '@/lib/admin-security';
import { Turnstile } from '@/components/admin/turnstile';

export const Route = createFileRoute('/compte')({ head: () => { const head = pageHead('Connexion administrateur', 'Accès privé et double vérification pour la gestion de CYCY shop.'); return { meta: [...head.meta, { name: 'robots', content: 'noindex, nofollow' }] }; }, component: AccountPage });

function AccountPage() {
  const { user, isManager, loading } = useAuth();
  return <main className="min-h-dvh bg-background px-5 py-12 grid place-items-center"><section className="w-full max-w-sm space-y-8"><p className="text-xl font-semibold text-primary">CYCY shop</p>{loading ? <p role="status" className="text-sm text-muted-foreground">Chargement…</p> : user && isManager ? <OpenAdmin /> : <AdminLogin />}</section></main>;
}

function AdminLogin() {
  const queryClient = useQueryClient();
  const login = useServerFn(adminLogin);
  const protection = useServerFn(getLoginProtection);
  const config = useQuery({ queryKey: ['login-protection'], queryFn: () => protection(), retry: false });
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const result = await login({ data: { email, password, captchaToken: captchaToken || 'not-configured' } });
      if (!result.ok) { toast.error(LOGIN_ERROR); return; }
      const { data, error } = await supabase.auth.setSession({ access_token: result.access_token, refresh_token: result.refresh_token });
      if (error || !data.user) { toast.error(LOGIN_ERROR); return; }
      if (!(await checkManager(data.user.id))) { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); toast.error(LOGIN_ERROR); return; }
      setPassword('');
      window.location.replace('/gestion-cycy');
    } catch { toast.error(LOGIN_ERROR); }
    finally { setBusy(false); setCaptchaToken(''); setCaptchaVersion((v) => v + 1); }
  };
  return <div><h1 className="text-2xl font-semibold">Connexion administrateur</h1><form className="form-stack" onSubmit={submit}><label>E-mail<Input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Mot de passe<Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>{config.data?.siteKey && <Turnstile key={captchaVersion} siteKey={config.data.siteKey} onToken={setCaptchaToken} />}<Button type="submit" disabled={busy || config.isPending || config.isError || (!!config.data?.siteKey && !captchaToken)}>{busy ? 'Connexion…' : 'Se connecter'}</Button></form></div>;
}

function OpenAdmin() {
  useEffect(() => { window.location.replace('/gestion-cycy'); }, []);
  return <p role="status" className="text-sm text-muted-foreground">Ouverture de l’administration…</p>;
}
