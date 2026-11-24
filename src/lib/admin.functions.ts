import { createMiddleware, createServerFn } from '@tanstack/react-start';
import { setResponseHeader, setResponseStatus } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { adminWriteSchema, imagePathsSchema } from '@/lib/admin-security';
import { slugify } from '@/lib/shop-data';

function definedPatch<T extends object>(row: T) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined)) as { [K in keyof T]?: Exclude<T[K], undefined> };
}

const requireManager = createMiddleware({ type: 'function' })
  .middleware([requireSupabaseAuth])
  .server(async ({ context, next }) => {
    setResponseHeader('Cache-Control', 'no-store');
    const { data: identity, error } = await context.supabase.auth.getUser();
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'gestionnaire' });
    if (error || identity.user?.id !== context.userId || role.error || role.data !== true) {
      setResponseStatus(403);
      throw new Error('403 — Accès refusé. Reconnectez-vous et vérifiez votre code de sécurité.');
    }
    return next();
  });

export const verifyAdminSession = createServerFn({ method: 'POST' })
  .middleware([requireManager]).handler(({ context }) => ({ userId: context.userId }));

export const getAdminData = createServerFn({ method: 'POST' })
  .middleware([requireManager]).handler(async ({ context }) => {
    const db = context.supabase;
    const [products, categories, orders, profiles, promotions, audit] = await Promise.all([
      db.from('products').select('*').order('created_at', { ascending: false }),
      db.from('categories').select('*').order('sort_order'),
      db.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
      db.from('profiles').select('*').order('created_at', { ascending: false }),
      db.from('promotions').select('*').order('created_at', { ascending: false }),
      db.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    if ([products, categories, orders, profiles, promotions, audit].some((r) => r.error)) throw new Error('Les données ne peuvent pas être chargées.');
    const rows = products.data ?? [];
    const paths = [...new Set([...rows.flatMap((p) => p.images), ...(categories.data ?? []).flatMap((c) => c.image_url && !c.image_url.startsWith('http') ? [c.image_url] : [])])];
    const signed = paths.length ? await db.storage.from('products-images').createSignedUrls(paths, 600) : null;
    if (signed?.error) throw new Error('Les photos ne peuvent pas être chargées.');
    const urls: Record<string, string> = {};
    for (const image of signed?.data ?? []) if (image.path && image.signedUrl) urls[image.path] = image.signedUrl;
    return {
      products: rows.map((p) => ({ ...p, imageUrls: p.images.flatMap((path) => urls[path] ? [urls[path]] : []) })),
      categories: categories.data ?? [], orders: orders.data ?? [], profiles: profiles.data ?? [],
      promotions: promotions.data ?? [], audit: audit.data ?? [], urls,
    };
  });

export const writeAdminData = createServerFn({ method: 'POST' })
  .middleware([requireManager]).inputValidator((input: unknown) => adminWriteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    let result;
    switch (data.kind) {
      case 'product-save':
        result = data.id ? await db.from('products').update(data.row).eq('id', data.id).select('id').single()
          : await db.from('products').insert({ ...data.row, slug: `${slugify(data.row.name)}-${crypto.randomUUID().slice(0, 8)}` }).select('id').single();
        break;
      case 'stock': result = await db.from('products').update({ stock: data.stock }).eq('id', data.id).select('id').single(); break;
      case 'category-save':
        if (!data.id && (!data.row.name || !data.row.slug)) throw new Error('Nom et identifiant requis.');
        result = data.id ? await db.from('categories').update(definedPatch(data.row)).eq('id', data.id).select('id').single()
          : await db.from('categories').insert({ ...definedPatch(data.row), name: data.row.name ?? '', slug: data.row.slug ?? '' }).select('id').single();
        break;
      case 'promotion-save':
        if (!data.id && (!data.row.code || !data.row.discount_percent)) throw new Error('Code et réduction requis.');
        result = data.id ? await db.from('promotions').update(definedPatch(data.row)).eq('id', data.id).select('id').single()
          : await db.from('promotions').insert({ ...definedPatch(data.row), code: data.row.code ?? '', discount_percent: data.row.discount_percent ?? 1 }).select('id').single();
        break;
      case 'order-status': result = await db.from('orders').update({ status: data.status }).eq('id', data.id).select('id').single(); break;
      case 'delete': {
        // Capture paths server-side before deleting; never trust a browser-supplied deletion list.
        const product = data.table === 'products' ? await db.from('products').select('images').eq('id', data.id).single() : null;
        const category = data.table === 'categories' ? await db.from('categories').select('image_url').eq('id', data.id).single() : null;
        if (product?.error || category?.error) throw new Error('Élément introuvable.');
        result = await db.from(data.table).delete().eq('id', data.id).select('id').single();
        if (!result.error) {
          const paths = product?.data?.images ?? (category?.data?.image_url && !category.data.image_url.startsWith('http') ? [category.data.image_url] : []);
          if (paths.length) {
            const removed = await db.storage.from('products-images').remove(paths);
            if (removed.error) throw new Error('Élément supprimé, mais certaines photos n’ont pas pu être retirées.');
            for (const path of paths) {
              const log = await db.rpc('record_admin_image_action', { _operation: 'DELETE', _path: path });
              if (log.error) throw new Error('La suppression ne peut pas être journalisée.');
            }
          }
        }
        break;
      }
    }
    if (result.error) throw new Error('La modification a été refusée. Vérifiez les valeurs et les liens avec les autres éléments.');
    return { ok: true };
  });

export const uploadAdminImage = createServerFn({ method: 'POST' })
  .middleware([requireManager]).inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error('Fichier requis.');
    const file = input.get('file');
    if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Photo JPG, PNG ou WebP requise (5 Mo maximum).');
    return input;
  }).handler(async ({ data, context }) => {
    const file = data.get('file');
    if (!(file instanceof File)) throw new Error('Fichier requis.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const valid = file.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : file.type === 'image/png' ? [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v)
      : new TextDecoder().decode(bytes.slice(0,4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP';
    if (!valid) throw new Error('Format de photo invalide.');
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const path = `${crypto.randomUUID()}.${ext}`;
    const result = await context.supabase.storage.from('products-images').upload(path, bytes, { contentType: file.type });
    if (result.error) throw new Error('Envoi de la photo impossible.');
    const log = await context.supabase.rpc('record_admin_image_action', { _operation: 'UPLOAD', _path: path });
    if (log.error) {
      await context.supabase.storage.from('products-images').remove([path]);
      throw new Error('Envoi annulé : journalisation impossible.');
    }
    return { path };
  });

export const removeAdminImages = createServerFn({ method: 'POST' })
  .middleware([requireManager]).inputValidator((input: unknown) => imagePathsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const removed = await context.supabase.storage.from('products-images').remove(data);
    if (removed.error) throw new Error('Suppression des photos impossible.');
    for (const path of data) {
      const log = await context.supabase.rpc('record_admin_image_action', { _operation: 'DELETE', _path: path });
      if (log.error) throw new Error('La suppression ne peut pas être journalisée.');
    }
    return { ok: true };
  });