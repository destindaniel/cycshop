import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Truck, BadgeCheck, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryGrid } from '@/components/category-grid';
import { ProductCard } from '@/components/product-card';
import { Reveal, Stagger, StaggerItem, useHeroMotion } from '@/components/motion-kit';
import { pageHead } from '@/lib/storefront';
import { productsQuery } from '@/lib/shop-data';
import hero from '@/assets/cycy-green-headphones.webp.asset.json';
import earbuds from '@/assets/cycy-green-earbuds.webp.asset.json';

export const Route = createFileRoute('/')({ head: () => ({ meta: [...pageHead('Votre boutique à Brazzaville', 'Découvrez les univers de CYCY shop : mode, électronique, beauté et accessoires à Brazzaville.').meta, ...(hero.url.startsWith('https://') ? [{ property: 'og:image', content: hero.url }, { name: 'twitter:image', content: hero.url }] : [])] }), component: Index });

const benefits = [
  { icon: Truck, title: 'À vos côtés à Brazzaville', text: 'Livraison et paiement à la réception' },
  { icon: BadgeCheck, title: 'Le goût de la qualité', text: 'Des essentiels choisis avec soin' },
  { icon: Headphones, title: 'Une attention personnelle', text: 'Votre satisfaction, notre priorité' },
];

function Index() {
  const heroRef = useHeroMotion();
  const { data: products = [] } = useQuery(productsQuery);
  const picks = products.slice(0, 4);
  return (
    <main className="home-page">
      <section className="hero" ref={heroRef}>
        <img className="hero-image" src={hero.url} alt="Casque vert profond et doré sur un socle, ambiance de la collection CYCY" fetchPriority="high" />
        <div className="hero-veil" aria-hidden />
        <div className="wrap hero-content">
          <p className="eyebrow hero-fade">VOTRE QUOTIDIEN, RÉINVENTÉ</p>
          <h1><span className="line-mask"><span className="hero-line">CYCY shop.</span></span></h1>
           <p className="hero-subtitle hero-fade">Un nouveau<br /><em>monde à vous.</em></p>
          <p className="hero-description hero-fade">Mode. Beauté. Technologie.<br />Les essentiels qui vous ressemblent.</p>
          <div className="hero-buttons hero-fade">
            <Button asChild size="lg" className="btn-lux"><Link to="/boutique">Découvrir la boutique<ArrowRight aria-hidden /></Link></Button>
          <Link to="/categories" className="hero-collection"><span><ArrowRight aria-hidden /></span><span>Nos collections<small>Explorer les univers</small></span></Link></div>
          <div className="hero-benefits hero-fade">{benefits.map((b) => <div className="benefit" key={b.title}><span className="benefit-icon"><b.icon /></span><div><h3>{b.title}</h3><p>{b.text}</p></div></div>)}</div>
        </div>
      </section>

      <section className="wrap section univers-section">
         <Reveal className="section-heading"><h2>Nos catégories</h2><span className="heading-rule" aria-hidden /><Link to="/categories" className="link-lux">Tout explorer<ArrowRight size={14} /></Link></Reveal>
        <CategoryGrid />
      </section>

      {picks.length > 0 && <section className="selection-section"><div className="wrap section"><Reveal className="section-heading"><h2>La sélection CYCY</h2><span className="heading-rule" aria-hidden /><Link to="/boutique" className="link-lux">Tous les produits<ArrowRight /></Link></Reveal><Stagger className="product-grid">{picks.map((p) => <StaggerItem key={p.id}><ProductCard product={p} /></StaggerItem>)}</Stagger></div></section>}

      <section className="editorial">
        <img className="editorial-image" src={earbuds.url} alt="Écouteurs blancs sur un socle vert, ambiance des essentiels électroniques" loading="lazy" />
        <div className="editorial-shade" aria-hidden />
        <Reveal className="editorial-copy"><p className="overline">LES ESSENTIELS</p><h2>Petit format.<br />Grand <em>style.</em></h2><p>Une nouvelle dimension à votre quotidien.</p><Button asChild variant="secondary" size="lg" className="btn-lux"><Link to="/boutique">Découvrir<ArrowRight aria-hidden /></Link></Button></Reveal>
      </section>
    </main>
  );
}
