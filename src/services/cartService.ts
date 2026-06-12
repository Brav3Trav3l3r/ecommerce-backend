import { Store, Cart } from '../types';
import { AppError } from '../errors';

function computeSubtotal(cart: Cart): number {
  return Math.round(
    cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
  ) / 100;
}

/**
 * Returns the current cart for a user, including a computed subtotal.
 * Returns an empty cart if the user has no existing cart.
 */
export function getCart(store: Store, userId: string): Cart & { subtotal: number } {
  const cart = store.carts.get(userId) ?? { userId, items: [], updatedAt: new Date().toISOString() };
  return { ...cart, subtotal: computeSubtotal(cart) };
}

/**
 * Adds a product to the user's cart.
 * If the product is already in the cart, its quantity is incremented.
 *
 * @throws {AppError} 404 PRODUCT_NOT_FOUND — product does not exist
 * @throws {AppError} 422 INVALID_QUANTITY — quantity is not a positive integer
 */
export function addItem(store: Store, userId: string, productId: string, quantity = 1): Cart & { subtotal: number } {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new AppError(422, 'INVALID_QUANTITY', 'quantity must be a positive integer');
  }

  const product = store.products.get(productId);
  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product ${productId} not found`);
  }

  const cart = store.carts.get(userId) ?? { userId, items: [], updatedAt: new Date().toISOString() };
  const existing = cart.items.find((i) => i.productId === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ productId, name: product.name, price: product.price, quantity });
  }

  cart.updatedAt = new Date().toISOString();
  store.carts.set(userId, cart);
  return { ...cart, subtotal: computeSubtotal(cart) };
}

/**
 * Sets the quantity of an existing cart item.
 * Passing quantity=0 removes the item from the cart.
 *
 * @throws {AppError} 404 ITEM_NOT_FOUND — product is not in the cart
 * @throws {AppError} 422 INVALID_QUANTITY — quantity is negative or non-integer
 */
export function updateItem(store: Store, userId: string, productId: string, quantity: number): Cart & { subtotal: number } {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new AppError(422, 'INVALID_QUANTITY', 'quantity must be a non-negative integer');
  }

  const cart = store.carts.get(userId) ?? { userId, items: [], updatedAt: new Date().toISOString() };
  const index = cart.items.findIndex((i) => i.productId === productId);

  if (index === -1) {
    throw new AppError(404, 'ITEM_NOT_FOUND', `Product ${productId} is not in the cart`);
  }

  if (quantity === 0) {
    cart.items.splice(index, 1);
  } else {
    cart.items[index].quantity = quantity;
  }

  cart.updatedAt = new Date().toISOString();
  store.carts.set(userId, cart);
  return { ...cart, subtotal: computeSubtotal(cart) };
}

/**
 * Removes a single product from the user's cart.
 * No-ops silently if the product is not present.
 */
export function removeItem(store: Store, userId: string, productId: string): Cart & { subtotal: number } {
  const cart = store.carts.get(userId) ?? { userId, items: [], updatedAt: new Date().toISOString() };
  cart.items = cart.items.filter((i) => i.productId !== productId);
  cart.updatedAt = new Date().toISOString();
  store.carts.set(userId, cart);
  return { ...cart, subtotal: computeSubtotal(cart) };
}

/**
 * Removes all items from the user's cart.
 */
export function clearCart(store: Store, userId: string): Cart & { subtotal: number } {
  const cart: Cart = { userId, items: [], updatedAt: new Date().toISOString() };
  store.carts.set(userId, cart);
  return { ...cart, subtotal: 0 };
}
