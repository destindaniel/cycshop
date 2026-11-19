import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { computeTotals, formatPrice, productsQuery } from '@/lib/shop-data';
import { pageHead } from '@/lib/storefront';

export const Route = createFileRoute('/commande')({ head: () => pageHead('Commande', 'Finalisez votre commande CYCY shop avec paiement à la livraison.'), component: Checkout });

function Checkout() {
  const { user, loading } = useAuth(); const cart = useCart(); const qc = useQueryClient();
  const { data: products = [] } = useQuery(productsQuery);
  const [form, setForm] = useState({ name: '', phone: '', city: 'Brazzaville', district: '', line: '', notes: '', promo: '' });
  const [busy, setBusy] = useState(false); const [done, setDone] = useState<string | null>(null);
  const lines = cart.lines.flatMap((l) => { const p = products.find((x) => x.id === l.productId); return p ? [{ ...l, product: p, price: p.price }] : []; });
  const totals = computeTotals(lines);
  if (done) return <main className="wrap"><div className="form-panel"><h1>Merci pour votre commande</h1><p className="text-sm text-muted-foreground leading-relaxed">Votre commande est enregistrée. Notre équipe vous contactera pour confirmer la livraison ; vous réglerez à la réception.</p><Button asChild className="mt-6"><Link to="/compte">Suivre mes commandes</Link></Button></div></main>;
  if (loading) return <main className="wrap section"><p className="text-sm text-muted-foreground">Chargement…</p></main>;
  if (!user) return <main className="wrap"><div className="form-panel"><h1>Connectez-vous</h1><p className="text-sm text-muted-foreground">Un compte client est nécessaire pour passer commande et la suivre.</p><Button asChild className="mt-6"><Link to="/compte">Se connecter ou créer un compte</Link></Button></div></main>;
  if (!lines.length) return <main className="wrap"><div className="form-panel"><h1>Panier vide</h1><Button asChild className="mt-6"><Link to="/boutique">Découvrir la boutique</Link></Button></div></main>;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { data, error } = await supabase.rpc('place_order', { _items: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })), _customer_name: form.name, _customer_phone: form.phone, _city: form.city, _district: form.district, _line: form.line, _notes: form.notes, _promo_code: form.promo });
    setBusy(false);
    if (error) { toast.error(error.message.includes('Stock') || error.message.includes('promo') || error.message.includes('indisponible') ? error.message : 'La commande n’a pas pu être enregistrée.'); return; }
    cart.clear(); await qc.invalidateQueries({ queryKey: ['products'] }); setDone(data);
  };
  return <main className="wrap"><div className="page-heading"><h1>Finaliser la commande</h1><p>Paiement à la livraison · Brazzaville et environs</p></div><div className="catalog-layout" style={{ gridTemplateColumns: 'minmax(0,1fr) 340px' }}><form className="form-stack" onSubmit={submit}><label>Nom complet<Input required value={form.name} onChange={set('name')} /></label><label>Téléphone<Input required type="tel" value={form.phone} onChange={set('phone')} placeholder="+242 06 000 00 00" /></label><label>Ville<Input required value={form.city} onChange={set('city')} /></label><label>Quartier<Input value={form.district} onChange={set('district')} /></label><label>Adresse de livraison<Input required value={form.line} onChange={set('line')} /></label><label>Instructions (facultatif)<Textarea value={form.notes} onChange={set('notes')} /></label><label>Code promo (facultatif)<Input value={form.promo} onChange={set('promo')} /></label><Button type="submit" size="lg" disabled={busy}>{busy ? 'Enregistrement…' : 'Confirmer la commande'}</Button></form><aside className="account-card h-fit"><h2>Récapitulatif</h2>{lines.map((l) => <p key={l.productId} className="flex justify-between gap-3 text-sm py-1"><span className="truncate">{l.quantity} × {l.product.name}</span><span>{formatPrice(l.price * l.quantity)}</span></p>)}<p className="flex justify-between border-t mt-3 pt-3"><span>Sous-total</span><strong>{formatPrice(totals.subtotal)}</strong></p><p className="text-xs text-muted-foreground mt-2">Une éventuelle réduction est appliquée à la validation.</p></aside></div></main>;
}
