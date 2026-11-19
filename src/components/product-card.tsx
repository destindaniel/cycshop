import { Link } from '@tanstack/react-router';
import { ImageOff } from 'lucide-react';
import { formatPrice, type ProductWithUrls } from '@/lib/shop-data';

export function ProductCard({ product }: { product: ProductWithUrls }) {
  const img = product.imageUrls[0];
  return (
    <Link to="/produit/$slug" params={{ slug: product.slug }} className="product-card">
      <div className="product-photo">{img ? <img src={img} alt={product.name} loading="lazy" /> : <ImageOff aria-hidden />}<span className="product-cta">Voir le produit</span>{product.stock === 0 && <span className="product-badge">Épuisé</span>}{product.compare_at_price && product.compare_at_price > product.price && product.stock > 0 && <span className="product-badge">Promo</span>}</div>
      <h3>{product.name}</h3>
      <p><strong>{formatPrice(product.price)}</strong>{product.compare_at_price && product.compare_at_price > product.price && <s>{formatPrice(product.compare_at_price)}</s>}</p>
    </Link>
  );
}
