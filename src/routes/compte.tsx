import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { formatPrice, statusLabels, withImageUrls } from '@/lib/shop-data';
import { ProductCard } from '@/components/product-card';
import { pageHead } from '@/lib/storefront';

export const Route = createFileRoute('/compte')({ head: () => pageHead('Mon compte', 'Votre espace client CYCY shop : commandes et favoris.'), component: AccountPage });

function AccountPage() {
  const { user, loading } = useAuth();
  if (loading) return <main className="wrap section"><p className="text-sm text-muted-foreground">Chargement…</p></main>;
  return user ? <Account userId={user.id} email={user.email ?? ''} /> : <AuthForm />;
}

function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === 'login') { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; }
      else if (mode === 'signup') { const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/compte`, data: { full_name: name } } }); if (error) throw error; if (!data.session) toast.success('Vérifiez votre boîte e-mail pour confirmer votre compte.'); }
      else { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); if (error) throw error; toast.success('Un lien de réinitialisation vous a été envoyé.'); }
    } catch (err) { toast.error(err instanceof Error && err.message.includes('Invalid login') ? 'E-mail ou mot de passe incorrect.' : 'L’opération a échoué. Réessayez.'); }
    finally { setBusy(false); }
  };
  return <main className="wrap"><div className="form-panel"><h1>{mode === 'login' ? 'Connexion' : mode === 'signup' ? 'Créer un compte' : 'Mot de passe oublié'}</h1><p className="text-sm text-muted-foreground">Suivez vos commandes et retrouvez vos favoris.</p><form className="form-stack" onSubmit={submit}>{mode === 'signup' && <label>Nom complet<Input required value={name} onChange={(e) => setName(e.target.value)} /></label>}<label>E-mail<Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>{mode !== 'reset' && <label>Mot de passe<Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></label>}<Button type="submit" disabled={busy}>{mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'Créer mon compte' : 'Envoyer le lien'}</Button></form><div className="flex flex-col gap-2 mt-5 text-xs">{mode !== 'login' && <button className="underline text-left" onClick={() => setMode('login')}>J’ai déjà un compte</button>}{mode !== 'signup' && <button className="underline text-left" onClick={() => setMode('signup')}>Créer un compte client</button>}{mode !== 'reset' && <button className="underline text-left" onClick={() => setMode('reset')}>Mot de passe oublié ?</button>}</div></div></main>;
}

function Account({ userId, email }: { userId: string; email: string }) {
  const { data: orders = [] } = useQuery({ queryKey: ['my-orders', userId], queryFn: async () => { const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('user_id', userId).order('created_at', { ascending: false }); if (error) throw error; return data; } });
  const { data: favorites = [] } = useQuery({ queryKey: ['favorites', userId], queryFn: async () => { const { data, error } = await supabase.from('favorites').select('products(*)').eq('user_id', userId); if (error) throw error; return withImageUrls(data.flatMap((f) => f.products ? [f.products] : []).filter((p) => p.is_active)); } });
  return <main className="wrap account-page"><div className="flex items-end justify-between gap-4 flex-wrap"><div><p className="overline">Espace client</p><h1 className="font-display text-4xl">Mon compte</h1><p className="text-sm text-muted-foreground mt-2">{email}</p></div><Button variant="outline" onClick={() => supabase.auth.signOut()}>Se déconnecter</Button></div>
  <section className="account-card"><h2>Mes commandes</h2>{orders.length === 0 ? <p className="text-sm text-muted-foreground">Aucune commande pour le moment. <Link className="underline" to="/boutique">Découvrir la boutique</Link></p> : <div className="flex flex-col gap-4">{orders.map((o) => <div key={o.id} className="border-t pt-4 text-sm"><div className="flex justify-between gap-3 flex-wrap"><strong>Commande du {new Date(o.created_at).toLocaleDateString('fr-FR')}</strong><span className="text-muted-foreground">{statusLabels[o.status]}</span></div><ul className="mt-2 text-muted-foreground">{o.order_items.map((i) => <li key={i.id}>{i.quantity} × {i.product_name} — {formatPrice(i.unit_price)}</li>)}</ul><p className="mt-2">Total : <strong>{formatPrice(o.total)}</strong> · paiement à la livraison</p></div>)}</div>}</section>
  <section className="account-card"><h2>Mes favoris</h2>{favorites.length === 0 ? <p className="text-sm text-muted-foreground">Aucun favori enregistré.</p> : <div className="product-grid">{favorites.map((p) => <ProductCard key={p.id} product={p} />)}</div>}</section></main>;
}
