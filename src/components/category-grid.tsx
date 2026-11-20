import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { categories as editorial } from '@/lib/storefront';
import { publicCategoriesQuery } from '@/lib/shop-data';
import { Stagger, StaggerItem } from '@/components/motion-kit';
import hero from '@/assets/cycy-hero.webp.asset.json';

export function CategoryGrid() {
  const { data } = useQuery(publicCategoriesQuery);
  const list = data ?? editorial.map((c) => ({ slug: c.slug, name: c.name, description: c.description, imageUrl: c.image }));
  return <Stagger className="category-grid">{list.map((c, i) => {
    const img = c.imageUrl ?? editorial.find((e) => e.slug === c.slug)?.image ?? hero.url;
    return <StaggerItem key={c.slug}><Link className="category" to="/categories/$slug" params={{ slug: c.slug }}><div className="category-photo"><img src={img} alt={c.name} loading="lazy" /><span className="category-num">{String(i + 1).padStart(2, '0')}</span></div><div className="category-info"><h3>{c.name}</h3><ArrowUpRight /></div><p>{c.description}</p></Link></StaggerItem>;
  })}</Stagger>;
}
