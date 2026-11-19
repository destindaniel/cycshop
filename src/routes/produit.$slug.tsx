import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Heart, ImageOff, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatPrice, productQuery } from '@/lib/shop-data';
import { pageHead } from '@/lib/storefront';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/produit/$slug')({
  head: () => pageHead('Produit', 'Découvrez ce produit chez CYCY shop à Brazzaville.'),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const [active, setActive] = useState(0);
  const cart = useCart();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: fav } = useQuery({ queryKey: ['favorite', product?.id, user?.id], enabled: !!user && !!product, queryFn: async () => { const { data } = await supabase.from('favorites').select('id').eq('product_id', product!.id).maybeSingle(); return data; } });
  if (isLoading) return <main className="wrap section"><p className="text-sm text-muted-foreground">Chargement…</p></main>;
  if (!product) return <main className="wrap section"><div className="empty-state"><h3>Produit introuvable</h3><p>Ce produit n’est plus disponible.</p><Button asChild className="mt-4"><Link to="/boutique">Retour à la boutique</Link></Button></div></main>;
  const toggleFav = async () => {
    if (!user) { toast('Connectez-vous à votre compte pour enregistrer vos favoris.'); return; }
    if (fav) await supabase.from('favorites').delete().eq('id', fav.id); else await supabase.from('favorites').insert({ product_id: product.id, user_id: user.id });
    await qc.invalidateQueries({ queryKey: ['favorite'] }); await qc.invalidateQueries({ queryKey: ['favorites'] });
  };
  const img = product.imageUrls[active];
  return <main className="wrap product-page"><div className="product-gallery"><div className="product-photo large">{img ? <img src={img} alt={product.name} /> : <ImageOff aria-hidden />}</div>{product.imageUrls.length > 1 && <div className="thumbs">{product.imageUrls.map((u, i) => <button key={u} onClick={() => setActive(i)} className={i === active ? 'active' : ''} aria-label={`Image ${i + 1}`}><img src={u} alt="" /></button>)}</div>}</div><div className="product-info"><div className="breadcrumbs"><Link to="/boutique">Boutique</Link> / {product.name}</div><h1>{product.name}</h1><p className="price"><strong>{formatPrice(product.price)}</strong>{product.compare_at_price && product.compare_at_price > product.price && <s>{formatPrice(product.compare_at_price)}</s>}</p><p className="stock">{product.stock > 0 ? `${product.stock} en stock` : 'Épuisé'}</p>{product.description && <p className="description">{product.description}</p>}<div className="flex gap-3 mt-6"><Button size="lg" disabled={product.stock === 0} onClick={() => { const inCart = cart.lines.find((l) => l.productId === product.id)?.quantity ?? 0; if (inCart >= product.stock) { toast.error('Stock maximal atteint dans votre panier.'); return; } cart.add(product.id); toast.success('Ajouté au panier'); }}><ShoppingBag />Ajouter au panier</Button><Button size="lg" variant="outline" onClick={toggleFav} aria-label="Favori"><Heart fill={fav ? 'currentColor' : 'none'} /></Button></div><p className="text-xs text-muted-foreground mt-5">Paiement à la livraison à Brazzaville.</p></div></main>;
}
