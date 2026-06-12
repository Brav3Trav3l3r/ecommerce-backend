import { resetStore, store } from '../store';
import { seedProducts } from '../seed';
import { getCart, addItem, updateItem, removeItem, clearCart } from '../services/cartService';

beforeEach(() => {
  resetStore();
  seedProducts();
});

describe('getCart', () => {
  it('returns empty cart for unknown user', () => {
    const cart = getCart(store, 'u1');
    expect(cart.userId).toBe('u1');
    expect(cart.items).toEqual([]);
    expect(cart.subtotal).toBe(0);
  });
});

describe('addItem', () => {
  it('creates cart and adds product', () => {
    const cart = addItem(store, 'u1', 'p1', 1);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe('p1');
    expect(cart.items[0].quantity).toBe(1);
    expect(cart.subtotal).toBe(29.99);
  });

  it('increments quantity if product already in cart', () => {
    addItem(store, 'u1', 'p1', 1);
    const cart = addItem(store, 'u1', 'p1', 2);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
  });

  it('throws 404 if product not found', () => {
    expect(() => addItem(store, 'u1', 'nonexistent', 1)).toThrow(
      expect.objectContaining({ statusCode: 404, code: 'PRODUCT_NOT_FOUND' })
    );
  });

  it('throws 422 if quantity is zero', () => {
    expect(() => addItem(store, 'u1', 'p1', 0)).toThrow(
      expect.objectContaining({ statusCode: 422, code: 'INVALID_QUANTITY' })
    );
  });

  it('throws 422 if quantity is negative', () => {
    expect(() => addItem(store, 'u1', 'p1', -1)).toThrow(
      expect.objectContaining({ statusCode: 422, code: 'INVALID_QUANTITY' })
    );
  });

  it('throws 422 if quantity is not an integer', () => {
    expect(() => addItem(store, 'u1', 'p1', 1.5)).toThrow(
      expect.objectContaining({ statusCode: 422, code: 'INVALID_QUANTITY' })
    );
  });

  it('defaults quantity to 1 if omitted', () => {
    const cart = addItem(store, 'u1', 'p1');
    expect(cart.items[0].quantity).toBe(1);
  });
});

describe('updateItem', () => {
  it('sets quantity of an existing item', () => {
    addItem(store, 'u1', 'p1', 1);
    const cart = updateItem(store, 'u1', 'p1', 5);
    expect(cart.items[0].quantity).toBe(5);
  });

  it('removes item when quantity is 0', () => {
    addItem(store, 'u1', 'p1', 1);
    const cart = updateItem(store, 'u1', 'p1', 0);
    expect(cart.items).toHaveLength(0);
  });

  it('throws 404 if product is not in cart', () => {
    expect(() => updateItem(store, 'u1', 'p1', 2)).toThrow(
      expect.objectContaining({ statusCode: 404, code: 'ITEM_NOT_FOUND' })
    );
  });
});

describe('removeItem', () => {
  it('removes product from cart', () => {
    addItem(store, 'u1', 'p1', 1);
    addItem(store, 'u1', 'p2', 1);
    const cart = removeItem(store, 'u1', 'p1');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe('p2');
  });
});

describe('clearCart', () => {
  it('empties all items', () => {
    addItem(store, 'u1', 'p1', 2);
    addItem(store, 'u1', 'p2', 1);
    const cart = clearCart(store, 'u1');
    expect(cart.items).toHaveLength(0);
    expect(cart.subtotal).toBe(0);
  });
});
