import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PackageOpen } from 'lucide-react';
import { categoriesQuery, productsQuery } from '@/lib/shop-data';
import { ProductCard } from '@/components/product-card';

export function CatalogPage({ title = 'La boutique', query = '', category, promotions = false }: { title?: string; query?: string; category?: string; promotions?: boolean }) {
  const [selected, setSelected] = useState(category ?? 'all');
  const [sort, setSort] = useState('new');
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: products = [], isLoading } = useQuery(productsQuery);
  const list = useMemo(() => {
    const catId = cats.find((c) => c.slug === selected)?.id;
    const q = query.trim().toLowerCase();
    const filtered = products.filter((p) => (selected === 'all' || p.category_id === catId) && (!q || p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)) && (!promotions || (p.compare_at_price ?? 0) > p.price));
    return [...filtered].sort((a, b) => sort === 'asc' ? a.price - b.price : sort === 'desc' ? b.price - a.price : b.created_at.localeCompare(a.created_at));
  }, [products, cats, selected, sort, query, promotions]);
  return <main className="wrap"><div className="page-heading"><div className="breadcrumbs">Accueil / {title}</div><h1>{title}</h1><p>{promotions ? 'Une belle occasion de vous faire plaisir.' : 'Des essentiels sélectionnés avec soin, pour chaque envie.'}</p></div><div className="catalog-layout"><aside className="filters"><h3>Catégories</h3><div>{[{ slug: 'all', name: 'Tout voir' }, ...cats].map((c) => <label className="filter-option" key={c.slug}><input type="radio" name="category" checked={selected === c.slug} onChange={() => setSelected(c.slug)} />{c.name}</label>)}</div></aside><section><div className="catalog-toolbar"><span>{query ? `Recherche : « ${query} » · ` : ''}{list.length} produit{list.length > 1 ? 's' : ''}</span><select aria-label="Trier les produits" value={sort} onChange={(e) => setSort(e.target.value)}><option value="new">Les plus récents</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option></select></div>{isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : list.length ? <div className="product-grid">{list.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <div className="empty-state"><PackageOpen size={38} /><h3>{query ? 'Aucun produit trouvé' : promotions ? 'Les belles offres arrivent bientôt' : 'Notre sélection se prépare'}</h3><p>{query ? 'Essayez un autre terme ou découvrez nos univers.' : 'Aucun produit n’est encore proposé dans cette sélection.'}</p></div>}</section></div></main>;
}
