import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Truck, BadgeCheck, Headphones, Sparkles, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryGrid } from '@/components/category-grid';
import { ProductCard } from '@/components/product-card';
import { Reveal, Stagger, StaggerItem, useHeroMotion } from '@/components/motion-kit';
import { pageHead } from '@/lib/storefront';
import { productsQuery, publicCategoriesQuery } from '@/lib/shop-data';
import hero from '@/assets/cycy-hero.webp.asset.json';
import accessories from '@/assets/cycy-accessoires.webp.asset.json';

export const Route = createFileRoute('/')({ head: () => ({ meta: [...pageHead('Votre boutique à Brazzaville', 'Découvrez les univers de CYCY shop : mode, électronique, beauté et accessoires à Brazzaville.').meta, { property: 'og:image', content: hero.url }, { name: 'twitter:image', content: hero.url }] }), component: Index });

const benefits = [
  { icon: Truck, title: 'À vos côtés à Brazzaville', text: 'Livraison et paiement à la réception' },
  { icon: BadgeCheck, title: 'Le goût de la qualité', text: 'Des essentiels choisis avec soin' },
  { icon: Headphones, title: 'Une attention personnelle', text: 'Votre satisfaction, notre priorité' },
];

function Index() {
  const heroRef = useHeroMotion();
  const { data: products = [] } = useQuery(productsQuery);
  const picks = products.slice(0, 6);
  const { data: cats } = useQuery(publicCategoriesQuery);
  return (
    <main>
      <section className="hero" ref={heroRef}>
        <img className="hero-image" src={hero.url} alt="Sélection élégante de sac chocolat, casque audio, sneakers et accessoires crème" fetchPriority="high" />
        <div className="hero-veil" aria-hidden />
        <div className="wrap hero-content">
          <div className="eyebrow hero-fade">Brazzaville · L’essentiel, autrement</div>
          <h1><span className="line-mask"><span className="hero-line">CYCY <em>shop.</em></span></span></h1>
          <p className="hero-subtitle hero-fade">Le style. La qualité.<br />Vos envies, réunies.</p>
          <p className="hero-description hero-fade">Mode, technologie et petits coups de cœur : des essentiels choisis pour votre quotidien.</p>
          <div className="hero-buttons hero-fade">
            <Button asChild size="lg" className="btn-lux"><Link to="/boutique">Découvrir la boutique<ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="link" className="hero-secondary"><Link to="/categories">Explorer les univers<ArrowRight aria-hidden /></Link></Button>
          </div>
          <div className="hero-note hero-fade"><Truck size={16} aria-hidden /> Paiement à la livraison à Brazzaville</div>
        </div>
        <div className="hero-caption">Une sélection. Mille envies.</div>
      </section>

      <section className="benefits">
        <Stagger className="wrap benefit-grid">
          {benefits.map((b) => <StaggerItem key={b.title}><div className="benefit"><span className="benefit-icon"><b.icon /></span><div><h3>{b.title}</h3><p>{b.text}</p></div></div></StaggerItem>)}
        </Stagger>
      </section>

      <section className="wrap section">
        <Reveal className="section-heading"><div><p className="overline">À chaque envie, son univers</p><h2>Les univers CYCY<span className="heading-dot">.</span></h2></div><Link to="/categories" className="link-lux">Tout explorer<ArrowRight size={14} /></Link></Reveal>
        <CategoryGrid />
      </section>

      <section className="marquee" aria-hidden><div className="marquee-track">{Array.from({ length: 2 }).map((_, i) => <span key={i}>{(cats ?? []).map((c) => <span key={c.slug}>{c.name} <Sparkles size={18} /></span>)}Brazzaville <Sparkles size={18} /> </span>)}</div></section>

      <section className="wrap section">
        <Reveal className="section-heading"><div><p className="overline">La sélection CYCY</p><h2>Vos prochains coups de cœur</h2></div><Link to="/boutique" className="link-lux">Voir la boutique<ArrowRight size={14} /></Link></Reveal>
        {picks.length ? (
          <Stagger className="product-grid">{picks.map((p) => <StaggerItem key={p.id}><ProductCard product={p} /></StaggerItem>)}</Stagger>
        ) : (
          <Reveal className="empty-state"><PackageOpen size={32} /><h3>De belles découvertes se préparent</h3><p>Notre catalogue ouvrira bientôt.<br />En attendant, explorez les univers de CYCY shop.</p></Reveal>
        )}
      </section>

      <section className="editorial">
        <div className="editorial-media"><img src={accessories.url} alt="Sac élégant en cuir chocolat et lunettes de soleil" loading="lazy" /></div>
        <Reveal className="editorial-copy"><div className="eyebrow mb-5">Les détails font le style</div><h2>L’élégance n’a pas besoin<br />d’en faire trop.</h2><p>Une belle pièce. Un détail juste. Un essentiel qui vous accompagne. Trouvez votre signature dans notre univers accessoires.</p><Button asChild variant="secondary" size="lg" className="btn-lux"><Link to="/categories/$slug" params={{ slug: 'accessoires' }}>Explorer les accessoires<ArrowRight /></Link></Button></Reveal>
      </section>
    </main>
  );
}
