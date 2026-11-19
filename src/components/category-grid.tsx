import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { categories } from '@/lib/storefront';
export function CategoryGrid(){return <div className="category-grid">{categories.map(c=><Link className="category" key={c.slug} to="/categories/$slug" params={{slug:c.slug}}><div className="category-photo"><img src={c.image} alt={c.name} loading="lazy"/></div><div className="category-info"><h3>{c.name}</h3><ArrowUpRight/></div><p>{c.description}</p></Link>)}</div>}
