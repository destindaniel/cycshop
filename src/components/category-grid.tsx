import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { categories } from '@/lib/storefront';
import { Stagger, StaggerItem } from '@/components/motion-kit';
export function CategoryGrid() {
  return <Stagger className="category-grid">{categories.map((c, i) => <StaggerItem key={c.slug}><Link className="category" to="/categories/$slug" params={{ slug: c.slug }}><div className="category-photo"><img src={c.image} alt={c.name} loading="lazy" /><span className="category-num">0{i + 1}</span></div><div className="category-info"><h3>{c.name}</h3><ArrowUpRight /></div><p>{c.description}</p></Link></StaggerItem>)}</Stagger>;
}
