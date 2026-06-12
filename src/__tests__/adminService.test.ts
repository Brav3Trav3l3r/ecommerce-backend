import { resetStore, store } from '../store';
import { seedProducts } from '../seed';
import { addItem } from '../services/cartService';
import { generateCode } from '../services/discountService';
import { checkout } from '../services/checkoutService';
import { getStats, adminGenerateCode } from '../services/adminService';

beforeEach(() => {
  resetStore();
  seedProducts();
  store.config.nthOrder = 5;
  store.config.discountPercent = 10;
});

describe('getStats', () => {
  it('returns zero counts on empty store', () => {
    const stats = getStats(store);
    expect(stats.totalOrders).toBe(0);
    expect(stats.totalItemsPurchased).toBe(0);
    expect(stats.totalRevenue).toBe(0);
    expect(stats.totalDiscountGiven).toBe(0);
    expect(stats.discountCodes.total).toBe(0);
  });

  it('aggregates totals correctly across multiple orders', () => {
    addItem(store, 'u1', 'p1', 2); // 2 * 29.99 = 59.98
    checkout(store, 'u1');

    addItem(store, 'u2', 'p2', 1); // 59.99
    checkout(store, 'u2');

    const stats = getStats(store);
    expect(stats.totalOrders).toBe(2);
    expect(stats.totalItemsPurchased).toBe(3);
    expect(stats.totalRevenue).toBe(119.97);
    expect(stats.totalDiscountGiven).toBe(0);
  });

  it('aggregates totalDiscountGiven correctly', () => {
    addItem(store, 'u1', 'p1', 2); // 59.98
    const { code } = generateCode(store, 'u1');
    checkout(store, 'u1', code); // 10% off = 6.00 discount

    const stats = getStats(store);
    expect(stats.totalDiscountGiven).toBe(6.00);
    expect(stats.totalRevenue).toBe(53.98);
  });

  it('lists discount codes with correct used/unused counts', () => {
    const { code } = generateCode(store, 'u1');
    generateCode(store, 'u2');

    addItem(store, 'u1', 'p1', 1);
    checkout(store, 'u1', code);

    const stats = getStats(store);
    expect(stats.discountCodes.total).toBe(2);
    expect(stats.discountCodes.used).toBe(1);
    expect(stats.discountCodes.unused).toBe(1);
  });
});

describe('adminGenerateCode', () => {
  it('generates a code when orders.length is a multiple of nthOrder', () => {
    for (let i = 0; i < 5; i++) {
      addItem(store, 'u1', 'p1', 1);
      store.config.nthOrder = 999;
      checkout(store, 'u1');
    }
    store.config.nthOrder = 5;

    const code = adminGenerateCode(store, 'u1');
    expect(code.code).toMatch(/^DISC-[A-Z0-9]{8}$/);
    expect(code.userId).toBe('u1');
  });

  it('throws 409 CONDITION_NOT_MET when orders.length is 0', () => {
    expect(() => adminGenerateCode(store, 'u1')).toThrow(
      expect.objectContaining({ statusCode: 409, code: 'CONDITION_NOT_MET' })
    );
  });

  it('throws 409 CONDITION_NOT_MET when orders.length is not a multiple of nthOrder', () => {
    addItem(store, 'u1', 'p1', 1);
    store.config.nthOrder = 999;
    checkout(store, 'u1');
    store.config.nthOrder = 5;

    expect(() => adminGenerateCode(store, 'u1')).toThrow(
      expect.objectContaining({ statusCode: 409, code: 'CONDITION_NOT_MET' })
    );
  });

  it('throws 409 CODE_ALREADY_EXISTS when user already has an unused code', () => {
    for (let i = 0; i < 5; i++) {
      addItem(store, 'u1', 'p1', 1);
      store.config.nthOrder = 999;
      checkout(store, 'u1');
    }
    store.config.nthOrder = 5;
    generateCode(store, 'u1'); // pre-existing unused code

    expect(() => adminGenerateCode(store, 'u1')).toThrow(
      expect.objectContaining({ statusCode: 409, code: 'CODE_ALREADY_EXISTS' })
    );
  });
});
