import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Truck, BadgeCheck, Headphones, ArrowUpRight, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryGrid } from '@/components/category-grid';
import { ProductCard } from '@/components/product-card';
import { Reveal, Stagger, StaggerItem, useHeroMotion } from '@/components/motion-kit';
import { pageHead } from '@/lib/storefront';
import { productsQuery } from '@/lib/shop-data';
import hero from '@/assets/cycy-editorial-scene.webp.asset.json';
import accessories from '@/assets/cycy-accessoires.webp.asset.json';

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
        <img className="hero-image" src={hero.url} alt="Élégance contemporaine : tenue crème, sac chocolat et essentiels du quotidien" fetchPriority="high" />
        <div className="hero-veil" aria-hidden />
        <div className="wrap hero-content">
          <p className="eyebrow hero-fade">La boutique · Brazzaville</p>
          <h1><span className="line-mask"><span className="hero-line">CYCY <em>shop.</em></span></span></h1>
          <p className="hero-subtitle hero-fade">L’art de choisir.<br /><em>Le plaisir de trouver.</em></p>
          <p className="hero-description hero-fade">La mode, la beauté, la technologie.<br />Vos envies ont trouvé leur adresse.</p>
          <div className="hero-buttons hero-fade">
            <Button asChild size="lg" className="btn-lux"><Link to="/boutique">Explorer la boutique<ArrowUpRight aria-hidden /></Link></Button>
          </div>
        </div>
        <div className="hero-bottom wrap"><span>Des essentiels. Une signature.</span><Link to="/categories">Découvrir nos univers<ArrowRight size={16} aria-hidden /></Link></div>
      </section>

      <section className="benefits">
        <Stagger className="wrap benefit-grid">
          {benefits.map((b) => <StaggerItem key={b.title}><div className="benefit"><span className="benefit-icon"><b.icon /></span><div><h3>{b.title}</h3><p>{b.text}</p></div></div></StaggerItem>)}
        </Stagger>
      </section>

      <section className="wrap section univers-section">
        <Reveal className="section-heading"><div><p className="overline">01 / Les univers</p><h2>À chaque envie,<br /><em>son univers.</em></h2></div><Link to="/categories" className="link-lux">Tout explorer<ArrowRight size={14} /></Link></Reveal>
        <CategoryGrid />
      </section>

      <section className="selection-section"><div className="wrap section">
        <Reveal className="section-heading"><div><p className="overline">02 / La sélection</p><h2>À découvrir.<br /><em>À aimer.</em></h2></div><Link to="/boutique" className="link-lux">Voir la boutique<ArrowRight size={14} /></Link></Reveal>
        {picks.length ? (
          <Stagger className="product-grid">{picks.map((p) => <StaggerItem key={p.id}><ProductCard product={p} /></StaggerItem>)}</Stagger>
        ) : (
          <Reveal className="empty-state"><PackageOpen size={32} /><h3>De belles découvertes se préparent</h3><p>Notre catalogue ouvrira bientôt.<br />En attendant, explorez les univers de CYCY shop.</p></Reveal>
        )}
      </div></section>

      <section className="editorial">
        <img className="editorial-image" src={accessories.url} alt="Sac en cuir chocolat et accessoires soigneusement assortis" loading="lazy" />
        <div className="editorial-shade" aria-hidden />
        <Reveal className="wrap editorial-copy"><p className="overline">La signature CYCY</p><h2>Le détail qui<br /><em>change tout.</em></h2><p>Un sac, une touche, une allure.<br />L’élégance se glisse dans les détails.</p><Button asChild variant="secondary" size="lg" className="btn-lux"><Link to="/categories/$slug" params={{ slug: 'accessoires' }}>Les accessoires<ArrowUpRight aria-hidden /></Link></Button></Reveal>
      </section>
    </main>
  );
}
