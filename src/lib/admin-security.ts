import { z } from 'zod';

export const ADMIN_SESSION_SECONDS = 7 * 24 * 60 * 60;
export const LOGIN_WINDOW_SECONDS = 15 * 60;
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_ERROR = 'Connexion impossible. Vérifiez vos informations ou réessayez plus tard.';
export const PRIVATE_ADMIN_PATH = '/gestion-cycy';
export const sessionIsCurrent = (createdAt: string, now = Date.now()) => {
  const started = Date.parse(createdAt);
  return Number.isFinite(started) && started <= now && now - started < ADMIN_SESSION_SECONDS * 1000;
};

const id = z.string().uuid();
const text = z.string().trim().min(1).max(200);
const path = z.string().max(250).regex(/^[a-zA-Z0-9][a-zA-Z0-9/_\-.]*$/).refine((v) => !v.includes('..'));
const product = z.object({ name: text, category_id: id.nullable(), price: z.number().int().nonnegative(), compare_at_price: z.number().int().nonnegative().nullable(), stock: z.number().int().nonnegative(), description: z.string().max(10000).nullable(), is_active: z.boolean(), images: z.array(path).max(20) }).strict();
const category = z.object({ name: text, slug: text, sort_order: z.number().int(), description: z.string().max(5000).nullable(), is_public: z.boolean(), image_url: path.nullable() }).strict();
const promotion = z.object({ code: text, discount_percent: z.number().int().min(1).max(90), description: z.string().max(5000).nullable(), ends_at: z.string().datetime().nullable(), is_active: z.boolean() }).strict();
export const adminWriteSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('product-save'), id: id.optional(), row: product }),
  z.object({ kind: z.literal('stock'), id, stock: z.number().int().nonnegative() }),
  z.object({ kind: z.literal('category-save'), id: id.optional(), row: category.partial() }),
  z.object({ kind: z.literal('promotion-save'), id: id.optional(), row: promotion.partial() }),
  z.object({ kind: z.literal('order-status'), id, status: z.enum(['en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee']) }),
  z.object({ kind: z.literal('delete'), id, table: z.enum(['products', 'categories', 'promotions']) }),
]);
export const imagePathsSchema = z.array(path).min(1).max(20);
export const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(256), captchaToken: z.string().min(1).max(4096) });