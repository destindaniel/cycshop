import { describe, expect, it } from 'vitest';
import { computeTotals, formatPrice } from './shop-data';

describe('computeTotals', () => {
  it('applies the promotion percent rounded down', () => {
    expect(computeTotals([{ price: 15000, quantity: 2 }, { price: 3333, quantity: 1 }], 10)).toEqual({ subtotal: 33333, discount: 3333, total: 30000 });
  });
  it('has no discount without promotion', () => {
    expect(computeTotals([{ price: 5000, quantity: 3 }])).toEqual({ subtotal: 15000, discount: 0, total: 15000 });
  });
});
describe('formatPrice', () => { it('shows FCFA', () => { expect(formatPrice(25000).replace(/\s/g, ' ')).toBe('25 000 FCFA'); }); });
