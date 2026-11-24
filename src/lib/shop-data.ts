import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { signActiveProductImages } from '@/lib/product-images.functions';
import { signPublicCategoryImages } from '@/lib/category-images.functions';
import type { Database } from '@/integrations/supabase/types';

export type Product = Database['public']['Tables']['products']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type ProductWithUrls = Product & { imageUrls: string[] };

export const BUCKET = 'products-images';
export const statusLabels: Record<OrderStatus, string> = {
  en_attente: 'En attente', confirmee: 'Confirmée', en_preparation: 'En préparation',
  expediee: 'Expédiée', livree: 'Livrée', annulee: 'Annulée',
};

export function formatPrice(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;
}

export function slugify(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Storefront signing: the server signs only images of active products, with a short lifetime. */
async function withPublicImageUrls(products: Product[]): Promise<ProductWithUrls[]> {
  const signed = products.some((p) => p.images.length) ? await signActiveProductImages().catch(() => ({} as Record<string, string>)) : {};
  return products.map((p) => ({ ...p, imageUrls: p.images.map((path) => signed[path]).filter((u): u is string => !!u) }));
}

export const categoriesQuery = queryOptions({
  queryKey: ['categories'],
  queryFn: async () => {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (error) throw error;
    return data;
  },
});

export const productsQuery = queryOptions({
  queryKey: ['products', 'public'],
  queryFn: async () => {
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false });
    if (error) throw error;
    return withPublicImageUrls(data);
  },
});

export const productQuery = (slug: string) => queryOptions({
  queryKey: ['product', slug],
  queryFn: async () => {
    const { data, error } = await supabase.from('products').select('*').eq('slug', slug).eq('is_active', true).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const [withUrls] = await withPublicImageUrls([data]);
    return withUrls ?? null;
  },
});

export type CartLine = { productId: string; quantity: number };

/** Mirrors place_order: subtotal from current prices, promo percent rounded down. */
export function computeTotals(lines: { price: number; quantity: number }[], discountPercent = 0) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const discount = Math.floor((subtotal * discountPercent) / 100);
  return { subtotal, discount, total: subtotal - discount };
}

export type PublicCategory = { slug: string; name: string; description: string | null; imageUrl: string | null };
/** Live categories for the storefront; image_url holds a storage path signed for display. */
export const publicCategoriesQuery = queryOptions({
  queryKey: ['categories', 'public'],
  queryFn: async (): Promise<PublicCategory[]> => {
    const { data, error } = await supabase.from('categories').select('*').eq('is_public', true).order('sort_order');
    if (error) throw error;
    const hasStored = data.some((c) => !!c.image_url && !c.image_url.startsWith('http'));
    const signed = hasStored ? await signPublicCategoryImages().catch(() => ({} as Record<string, string>)) : {};
    const map = new Map<string, string>(Object.entries(signed));
    return data.map((c) => ({ slug: c.slug, name: c.name, description: c.description, imageUrl: c.image_url ? (c.image_url.startsWith('http') ? c.image_url : map.get(c.image_url) ?? null) : null }));
  },
});
