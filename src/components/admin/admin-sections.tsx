import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ImageOff, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { BUCKET, formatPrice, slugify, statusLabels, withImageUrls, type Category, type OrderStatus, type ProductWithUrls } from '@/lib/shop-data';

const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : 'Opération impossible.');

export const adminProducts = { queryKey: ['admin', 'products'], queryFn: async () => { const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }); if (error) throw error; return withImageUrls(data); } };
const adminCategories = { queryKey: ['admin', 'categories'], queryFn: async () => { const { data, error } = await supabase.from('categories').select('*').order('sort_order'); if (error) throw error; return data; } };
export const adminOrders = { queryKey: ['admin', 'orders'], queryFn: async () => { const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }); if (error) throw error; return data; } };

function useRefresh() { const qc = useQueryClient(); return () => Promise.all([qc.invalidateQueries({ queryKey: ['admin'] }), qc.invalidateQueries({ queryKey: ['products'] }), qc.invalidateQueries({ queryKey: ['product'] }), qc.invalidateQueries({ queryKey: ['categories'] })]); }

export function Overview() {
  const { data: products = [] } = useQuery(adminProducts); const { data: orders = [] } = useQuery(adminOrders);
  const revenue = orders.filter((o) => o.status === 'livree').reduce((s, o) => s + o.total, 0);
  return <><div className="stat-grid"><Stat label="Commandes en attente" value={String(orders.filter((o) => o.status === 'en_attente').length)} /><Stat label="Chiffre d’affaires livré" value={formatPrice(revenue)} /><Stat label="Produits actifs" value={String(products.filter((p) => p.is_active).length)} /><Stat label="Stocks faibles (≤ 3)" value={String(products.filter((p) => p.stock <= 3).length)} /></div><h2 className="font-display text-xl mt-8 mb-3">Dernières commandes</h2><OrdersTable limit={5} /></>;
}
function Stat({ label, value }: { label: string; value: string }) { return <div className="stat"><span>{label}</span><strong>{value}</strong></div>; }

type Draft = { id?: string; name: string; category_id: string; price: string; compare_at_price: string; stock: string; description: string; is_active: boolean; images: string[] };
const emptyDraft: Draft = { name: '', category_id: '', price: '', compare_at_price: '', stock: '0', description: '', is_active: true, images: [] };

export function Products() {
  const { data: products = [], isLoading } = useQuery(adminProducts); const { data: cats = [] } = useQuery(adminCategories);
  const [draft, setDraft] = useState<Draft | null>(null); const refresh = useRefresh();
  const remove = useMutation({ mutationFn: async (p: ProductWithUrls) => { const { error } = await supabase.from('products').delete().eq('id', p.id); if (error) throw error; if (p.images.length) await supabase.storage.from(BUCKET).remove(p.images); }, onSuccess: async () => { await refresh(); toast.success('Produit supprimé'); }, onError: fail });
  return <><div className="flex justify-between items-center mb-4 gap-3"><p className="text-sm text-muted-foreground">{products.length} produit(s)</p><Button onClick={() => setDraft(emptyDraft)}><Plus />Ajouter un produit</Button></div>
  {isLoading ? <p className="text-sm">Chargement…</p> : <div className="table-scroll"><table className="admin-table"><thead><tr><th></th><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>Statut</th><th></th></tr></thead><tbody>{products.length === 0 && <tr><td colSpan={7} className="text-center text-muted-foreground py-8">Aucun produit. Ajoutez votre premier article.</td></tr>}{products.map((p) => <tr key={p.id}><td>{p.imageUrls[0] ? <img className="thumb" src={p.imageUrls[0]} alt="" /> : <div className="thumb grid place-items-center"><ImageOff size={14} /></div>}</td><td>{p.name}</td><td>{cats.find((c) => c.id === p.category_id)?.name ?? '—'}</td><td>{formatPrice(p.price)}</td><td>{p.stock}</td><td>{p.is_active ? 'En ligne' : 'Masqué'}</td><td className="whitespace-nowrap"><Button size="icon" variant="ghost" aria-label="Modifier" onClick={() => setDraft({ id: p.id, name: p.name, category_id: p.category_id ?? '', price: String(p.price), compare_at_price: p.compare_at_price ? String(p.compare_at_price) : '', stock: String(p.stock), description: p.description ?? '', is_active: p.is_active, images: p.images })}><Pencil /></Button><Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => { if (confirm(`Supprimer « ${p.name} » ?`)) remove.mutate(p); }}><Trash2 /></Button></td></tr>)}</tbody></table></div>}
  {draft && <ProductDialog draft={draft} cats={cats} urls={products.find((p) => p.id === draft.id)?.imageUrls ?? []} onClose={() => setDraft(null)} />}</>;
}

function ProductDialog({ draft: initial, cats, urls, onClose }: { draft: Draft; cats: Category[]; urls: string[]; onClose: () => void }) {
  const [d, setD] = useState(initial); const [files, setFiles] = useState<File[]>([]); const [busy, setBusy] = useState(false); const refresh = useRefresh();
  const urlFor = (path: string) => urls[initial.images.indexOf(path)];
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const f of files) { const path = `${crypto.randomUUID()}-${slugify(f.name.replace(/\.[^.]+$/, ''))}.${f.name.split('.').pop() ?? 'jpg'}`; const { error } = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type }); if (error) throw error; uploaded.push(path); }
      const row = { name: d.name.trim(), category_id: d.category_id || null, price: Number(d.price), compare_at_price: d.compare_at_price ? Number(d.compare_at_price) : null, stock: Number(d.stock), description: d.description || null, is_active: d.is_active, images: [...d.images, ...uploaded] };
      const res = d.id ? await supabase.from('products').update(row).eq('id', d.id) : await supabase.from('products').insert({ ...row, slug: `${slugify(row.name)}-${crypto.randomUUID().slice(0, 6)}` });
      if (res.error) throw res.error;
      const removed = initial.images.filter((i) => !d.images.includes(i)); if (removed.length) await supabase.storage.from(BUCKET).remove(removed);
      await refresh(); toast.success(d.id ? 'Produit mis à jour' : 'Produit ajouté'); onClose();
    } catch (err) { fail(err); } finally { setBusy(false); }
  };
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setD({ ...d, [k]: e.target.value });
  return <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogTitle>{d.id ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle><DialogDescription>Les changements apparaissent immédiatement dans la boutique.</DialogDescription><form className="form-stack" onSubmit={save}><label>Nom<Input required value={d.name} onChange={set('name')} /></label><label>Catégorie<select value={d.category_id} onChange={set('category_id')}><option value="">Sans catégorie</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label>Prix (FCFA)<Input required type="number" min={0} value={d.price} onChange={set('price')} /></label><label>Prix barré<Input type="number" min={0} value={d.compare_at_price} onChange={set('compare_at_price')} /></label></div><label>Stock<Input required type="number" min={0} value={d.stock} onChange={set('stock')} /></label><label>Description<Textarea rows={4} value={d.description} onChange={set('description')} /></label><div><p className="text-xs mb-2">Images</p><div className="flex flex-wrap gap-2">{d.images.map((path) => <div key={path} className="relative">{urlFor(path) ? <img className="thumb" style={{ width: 64, height: 64 }} src={urlFor(path)} alt="" /> : <div className="thumb" />}<button type="button" aria-label="Retirer l’image" className="absolute -top-2 -right-2 bg-card border rounded-full p-0.5" onClick={() => setD({ ...d, images: d.images.filter((i) => i !== path) })}><X size={12} /></button></div>)}</div><Input className="mt-2" type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /></div><label className="flex-row! items-center gap-3"><Switch checked={d.is_active} onCheckedChange={(v) => setD({ ...d, is_active: v })} />Visible dans la boutique</label><Button type="submit" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Button></form></DialogContent></Dialog>;
}

export function Categories() {
  const { data: cats = [] } = useQuery(adminCategories); const refresh = useRefresh(); const [name, setName] = useState('');
  const add = async (e: React.FormEvent) => { e.preventDefault(); const { error } = await supabase.from('categories').insert({ name: name.trim(), slug: slugify(name), sort_order: cats.length + 1 }); if (error) { fail(error); return; } setName(''); await refresh(); toast.success('Catégorie ajoutée'); };
  const update = async (id: string, patch: Partial<Category>) => { const { error } = await supabase.from('categories').update(patch).eq('id', id); if (error) { fail(error); return; } await refresh(); };
  const del = async (c: Category) => { if (!confirm(`Supprimer « ${c.name} » ? Les produits resteront sans catégorie.`)) return; const { error } = await supabase.from('categories').delete().eq('id', c.id); if (error) { fail(error); return; } await refresh(); };
  return <><form onSubmit={add} className="flex gap-3 mb-4 max-w-md"><Input required placeholder="Nouvelle catégorie" value={name} onChange={(e) => setName(e.target.value)} /><Button type="submit"><Plus />Ajouter</Button></form><div className="table-scroll"><table className="admin-table"><thead><tr><th>Photo</th><th>Nom</th><th>Description</th><th>Publique</th><th></th></tr></thead><tbody>{cats.map((c) => <tr key={c.id}><td><CategoryPhoto c={c} onSaved={refresh} /></td><td><Input defaultValue={c.name} onBlur={(e) => { if (e.target.value !== c.name) void update(c.id, { name: e.target.value }); }} /></td><td><Input defaultValue={c.description ?? ''} onBlur={(e) => { if (e.target.value !== (c.description ?? '')) void update(c.id, { description: e.target.value }); }} /></td><td><Switch checked={c.is_public} onCheckedChange={(v) => void update(c.id, { is_public: v })} /></td><td><Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => void del(c)}><Trash2 /></Button></td></tr>)}</tbody></table></div></>;
}

function CategoryPhoto({ c, onSaved }: { c: Category; onSaved: () => Promise<unknown> }) {
  const [busy, setBusy] = useState(false);
  const { data: url } = useQuery({ queryKey: ['admin', 'category-photo', c.image_url], enabled: !!c.image_url, queryFn: async () => { const { data } = await supabase.storage.from(BUCKET).createSignedUrl(c.image_url!, 3600); return data?.signedUrl ?? null; } });
  const upload = async (f: File) => {
    setBusy(true);
    try {
      const path = `categories/${c.slug}-${crypto.randomUUID().slice(0, 8)}.${f.name.split('.').pop() ?? 'jpg'}`;
      const up = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type }); if (up.error) throw up.error;
      const { error } = await supabase.from('categories').update({ image_url: path }).eq('id', c.id); if (error) throw error;
      if (c.image_url && !c.image_url.startsWith('http')) await supabase.storage.from(BUCKET).remove([c.image_url]);
      await onSaved(); toast.success('Photo de catégorie enregistrée');
    } catch (err) { fail(err); } finally { setBusy(false); }
  };
  return <label className="cursor-pointer block" title="Changer la photo">{url ? <img className="thumb" src={url} alt="" /> : <div className="thumb grid place-items-center"><ImageOff size={14} /></div>}<input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} /><span className="text-[10px] text-muted-foreground">{busy ? 'Envoi…' : 'Changer'}</span></label>;
}

export function OrdersTable({ limit }: { limit?: number }) {
  const { data: orders = [] } = useQuery(adminOrders); const refresh = useRefresh(); const [open, setOpen] = useState<string | null>(null);
  const setStatus = async (id: string, status: OrderStatus) => { const { error } = await supabase.from('orders').update({ status }).eq('id', id); if (error) { fail(error); return; } await refresh(); toast.success('Statut mis à jour'); };
  const list = limit ? orders.slice(0, limit) : orders;
  return <div className="table-scroll"><table className="admin-table"><thead><tr><th>Date</th><th>Client</th><th>Téléphone</th><th>Total</th><th>Statut</th><th></th></tr></thead><tbody>{list.length === 0 && <tr><td colSpan={6} className="text-center text-muted-foreground py-8">Aucune commande pour le moment.</td></tr>}{list.map((o) => <><tr key={o.id}><td>{new Date(o.created_at).toLocaleString('fr-FR')}</td><td>{o.customer_name}</td><td>{o.customer_phone}</td><td>{formatPrice(o.total)}</td><td><select value={o.status} onChange={(e) => void setStatus(o.id, e.target.value as OrderStatus)}>{Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td><td><Button size="sm" variant="ghost" onClick={() => setOpen(open === o.id ? null : o.id)}>{open === o.id ? 'Fermer' : 'Détails'}</Button></td></tr>{open === o.id && <tr key={`${o.id}-d`}><td colSpan={6} className="bg-muted/50"><p><strong>Livraison :</strong> {o.shipping_line}{o.shipping_district ? `, ${o.shipping_district}` : ''}, {o.shipping_city}</p>{o.notes && <p><strong>Instructions :</strong> {o.notes}</p>}<ul className="mt-2">{o.order_items.map((i) => <li key={i.id}>{i.quantity} × {i.product_name} — {formatPrice(i.unit_price)}</li>)}</ul><p className="mt-2">Sous-total {formatPrice(o.subtotal)}{o.discount ? ` · Réduction ${formatPrice(o.discount)} (${o.promotion_code})` : ''} · Paiement à la livraison</p></td></tr>}</>)}</tbody></table></div>;
}

export function Customers() {
  const { data: profiles = [] } = useQuery({ queryKey: ['admin', 'profiles'], queryFn: async () => { const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }); if (error) throw error; return data; } });
  const { data: orders = [] } = useQuery(adminOrders);
  return <div className="table-scroll"><table className="admin-table"><thead><tr><th>Nom</th><th>E-mail</th><th>Inscription</th><th>Commandes</th><th>Total dépensé</th></tr></thead><tbody>{profiles.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground py-8">Aucun client inscrit.</td></tr>}{profiles.map((p) => { const mine = orders.filter((o) => o.user_id === p.id && o.status !== 'annulee'); return <tr key={p.id}><td>{p.full_name ?? '—'}</td><td>{p.email}</td><td>{new Date(p.created_at).toLocaleDateString('fr-FR')}</td><td>{mine.length}</td><td>{formatPrice(mine.reduce((s, o) => s + o.total, 0))}</td></tr>; })}</tbody></table></div>;
}

export function Stocks() {
  const { data: products = [] } = useQuery(adminProducts); const refresh = useRefresh();
  const save = async (id: string, stock: number) => { const { error } = await supabase.from('products').update({ stock }).eq('id', id); if (error) { fail(error); return; } await refresh(); toast.success('Stock mis à jour'); };
  return <div className="table-scroll"><table className="admin-table"><thead><tr><th>Produit</th><th>Stock actuel</th><th>Nouveau stock</th></tr></thead><tbody>{products.length === 0 && <tr><td colSpan={3} className="text-center text-muted-foreground py-8">Aucun produit.</td></tr>}{[...products].sort((a, b) => a.stock - b.stock).map((p) => <tr key={p.id}><td>{p.name}</td><td className={p.stock <= 3 ? 'text-destructive font-semibold' : ''}>{p.stock}</td><td><Input className="max-w-28" type="number" min={0} defaultValue={p.stock} onBlur={(e) => { const v = Number(e.target.value); if (v !== p.stock && v >= 0) void save(p.id, v); }} /></td></tr>)}</tbody></table></div>;
}

export function Promotions() {
  const { data: promos = [] } = useQuery({ queryKey: ['admin', 'promotions'], queryFn: async () => { const { data, error } = await supabase.from('promotions').select('*').order('created_at', { ascending: false }); if (error) throw error; return data; } });
  const refresh = useRefresh(); const [f, setF] = useState({ code: '', percent: '10', ends: '', description: '' });
  const add = async (e: React.FormEvent) => { e.preventDefault(); const { error } = await supabase.from('promotions').insert({ code: f.code.trim().toUpperCase(), discount_percent: Number(f.percent), description: f.description || null, ends_at: f.ends ? new Date(f.ends).toISOString() : null }); if (error) { fail(error); return; } setF({ code: '', percent: '10', ends: '', description: '' }); await refresh(); toast.success('Promotion créée'); };
  return <><form onSubmit={add} className="grid gap-3 sm:grid-cols-5 mb-5 items-end"><label className="text-xs flex flex-col gap-1">Code<Input required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></label><label className="text-xs flex flex-col gap-1">Réduction (%)<Input required type="number" min={1} max={90} value={f.percent} onChange={(e) => setF({ ...f, percent: e.target.value })} /></label><label className="text-xs flex flex-col gap-1">Fin (facultatif)<Input type="date" value={f.ends} onChange={(e) => setF({ ...f, ends: e.target.value })} /></label><label className="text-xs flex flex-col gap-1">Description<Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label><Button type="submit"><Plus />Créer</Button></form><p className="text-xs text-muted-foreground mb-3">Astuce : un prix barré sur un produit le fait aussi apparaître dans la page Promotions.</p><div className="table-scroll"><table className="admin-table"><thead><tr><th>Code</th><th>Réduction</th><th>Fin</th><th>Active</th><th></th></tr></thead><tbody>{promos.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground py-8">Aucune promotion.</td></tr>}{promos.map((p) => <tr key={p.id}><td>{p.code}</td><td>{p.discount_percent} %</td><td>{p.ends_at ? new Date(p.ends_at).toLocaleDateString('fr-FR') : '—'}</td><td><Switch checked={p.is_active} onCheckedChange={async (v) => { const { error } = await supabase.from('promotions').update({ is_active: v }).eq('id', p.id); if (error) fail(error); await refresh(); }} /></td><td><Button size="icon" variant="ghost" aria-label="Supprimer" onClick={async () => { const { error } = await supabase.from('promotions').delete().eq('id', p.id); if (error) fail(error); await refresh(); }}><Trash2 /></Button></td></tr>)}</tbody></table></div></>;
}

export function Stats() {
  const { data: orders = [] } = useQuery(adminOrders);
  const valid = orders.filter((o) => o.status !== 'annulee');
  const top = new Map<string, number>(); valid.forEach((o) => o.order_items.forEach((i) => top.set(i.product_name, (top.get(i.product_name) ?? 0) + i.quantity)));
  const months = new Map<string, number>(); valid.forEach((o) => { const k = new Date(o.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }); months.set(k, (months.get(k) ?? 0) + o.total); });
  return <><div className="stat-grid"><Stat label="Commandes (hors annulées)" value={String(valid.length)} /><Stat label="Montant total commandé" value={formatPrice(valid.reduce((s, o) => s + o.total, 0))} /><Stat label="Panier moyen" value={formatPrice(valid.length ? Math.round(valid.reduce((s, o) => s + o.total, 0) / valid.length) : 0)} /><Stat label="Commandes livrées" value={String(orders.filter((o) => o.status === 'livree').length)} /></div><div className="grid md:grid-cols-2 gap-5 mt-6"><div className="account-card"><h2>Meilleures ventes</h2>{top.size === 0 ? <p className="text-sm text-muted-foreground">Pas encore de ventes.</p> : [...top].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, q]) => <p key={n} className="flex justify-between text-sm py-1"><span>{n}</span><strong>{q}</strong></p>)}</div><div className="account-card"><h2>Par mois</h2>{months.size === 0 ? <p className="text-sm text-muted-foreground">Pas encore de ventes.</p> : [...months].map(([m, v]) => <p key={m} className="flex justify-between text-sm py-1"><span>{m}</span><strong>{formatPrice(v)}</strong></p>)}</div></div></>;
}

export function AccountSettings({ email }: { email: string }) {
  const [current, setCurrent] = useState(''); const [next, setNext] = useState(''); const [busy, setBusy] = useState(false);
  return <div className="account-card max-w-md"><h2>Mon compte</h2><p className="text-sm text-muted-foreground">{email}</p><form className="form-stack" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const { error } = await supabase.auth.updateUser({ password: next, current_password: current } as { password: string }); setBusy(false); if (error) { toast.error('Mot de passe actuel incorrect ou nouveau mot de passe refusé.'); return; } setCurrent(''); setNext(''); toast.success('Mot de passe modifié'); }}><label>Mot de passe actuel<Input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} /></label><label>Nouveau mot de passe<Input type="password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} /></label><Button type="submit" disabled={busy}>Modifier le mot de passe</Button></form></div>;
}
