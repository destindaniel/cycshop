import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CartLine } from '@/lib/shop-data';

type Cart = { lines: CartLine[]; add: (id: string, qty?: number) => void; setQty: (id: string, qty: number) => void; remove: (id: string) => void; clear: () => void; count: number };
const CartContext = createContext<Cart | null>(null);
const KEY = 'cycy-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => { try { const raw = localStorage.getItem(KEY); if (raw) setLines(JSON.parse(raw) as CartLine[]); } catch { /* ignore */ } }, []);
  const save = (next: CartLine[]) => { setLines(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  const value: Cart = {
    lines,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    add: (id, qty = 1) => { const ex = lines.find((l) => l.productId === id); save(ex ? lines.map((l) => l.productId === id ? { ...l, quantity: l.quantity + qty } : l) : [...lines, { productId: id, quantity: qty }]); },
    setQty: (id, qty) => save(qty < 1 ? lines.filter((l) => l.productId !== id) : lines.map((l) => l.productId === id ? { ...l, quantity: qty } : l)),
    remove: (id) => save(lines.filter((l) => l.productId !== id)),
    clear: () => save([]),
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() { const c = useContext(CartContext); if (!c) throw new Error('CartProvider manquant'); return c; }
