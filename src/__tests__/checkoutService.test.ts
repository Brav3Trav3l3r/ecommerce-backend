import { resetStore, store } from '../store';
import { seedProducts } from '../seed';
import { addItem } from '../services/cartService';
import { generateCode } from '../services/discountService';
import { checkout } from '../services/checkoutService';

beforeEach(() => {
  resetStore();
  seedProducts();
  store.config.nthOrder = 5;
  store.config.discountPercent = 10;
});

describe('checkout', () => {
  it('places order from non-empty cart with correct subtotal and total', () => {
    addItem(store, 'u1', 'p1', 2); // 2 * 29.99 = 59.98
    const { order } = checkout(store, 'u1');
    expect(order.userId).toBe('u1');
    expect(order.subtotal).toBe(59.98);
    expect(order.discountAmount).toBe(0);
    expect(order.total).toBe(59.98);
    expect(order.id).toMatch(/^ord-/);
  });

  it('throws 422 if cart is empty', () => {
    expect(() => checkout(store, 'u1')).toThrow(
      expect.objectContaining({ statusCode: 422, code: 'CART_EMPTY' })
    );
  });

  it('applies valid discount code and computes discountAmount correctly', () => {
    addItem(store, 'u1', 'p1', 2); // subtotal 59.98, 10% = 5.998 -> 6.00 rounded
    const { code } = generateCode(store, 'u1');
    const { order } = checkout(store, 'u1', code);
    expect(order.discountCode).toBe(code);
    expect(order.discountAmount).toBe(6.00);
    expect(order.total).toBe(53.98);
  });

  it('throws 400 CODE_NOT_FOUND for unknown code', () => {
    addItem(store, 'u1', 'p1', 1);
    expect(() => checkout(store, 'u1', 'DISC-UNKNOWN1')).toThrow(
      expect.objectContaining({ statusCode: 400, code: 'CODE_NOT_FOUND' })
    );
  });

  it('throws 400 CODE_NOT_YOURS for code belonging to another user', () => {
    addItem(store, 'u1', 'p1', 1);
    const { code } = generateCode(store, 'u2');
    expect(() => checkout(store, 'u1', code)).toThrow(
      expect.objectContaining({ statusCode: 400, code: 'CODE_NOT_YOURS' })
    );
  });

  it('throws 400 CODE_ALREADY_USED for already-used code', () => {
    addItem(store, 'u1', 'p1', 1);
    const { code } = generateCode(store, 'u1');
    store.discountCodes.get(code)!.used = true;
    expect(() => checkout(store, 'u1', code)).toThrow(
      expect.objectContaining({ statusCode: 400, code: 'CODE_ALREADY_USED' })
    );
  });

  it('clears the cart after successful checkout', () => {
    addItem(store, 'u1', 'p1', 1);
    checkout(store, 'u1');
    expect(store.carts.get('u1')?.items).toHaveLength(0);
  });

  it('marks discount code as used after successful checkout', () => {
    addItem(store, 'u1', 'p1', 1);
    const { code } = generateCode(store, 'u1');
    const { order } = checkout(store, 'u1', code);
    const dc = store.discountCodes.get(code)!;
    expect(dc.used).toBe(true);
    expect(dc.usedInOrderId).toBe(order.id);
  });

  it('triggers nth-order code generation on the 5th order', () => {
    for (let i = 0; i < 4; i++) {
      addItem(store, 'u1', 'p1', 1);
      checkout(store, 'u1');
    }
    addItem(store, 'u1', 'p1', 1);
    const { couponGenerated } = checkout(store, 'u1');
    expect(couponGenerated).toBeDefined();
    expect(couponGenerated?.code).toMatch(/^DISC-[A-Z0-9]{8}$/);
    expect(couponGenerated?.discountPercent).toBe(10);
  });

  it('does not trigger nth-order code generation on a non-nth order', () => {
    addItem(store, 'u1', 'p1', 1);
    const { couponGenerated } = checkout(store, 'u1');
    expect(couponGenerated).toBeUndefined();
  });

  it('returns couponGenerated in the response on nth order', () => {
    for (let i = 0; i < 4; i++) {
      addItem(store, 'u1', 'p1', 1);
      checkout(store, 'u1');
    }
    addItem(store, 'u1', 'p1', 1);
    const { couponGenerated } = checkout(store, 'u1');
    expect(couponGenerated).toMatchObject({ code: expect.stringMatching(/^DISC-/), discountPercent: 10 });
  });
});
