import { randomUUID } from 'crypto';
import { Store, Order, DiscountCode } from '../types';
import { AppError } from '../errors';
import { clearCart } from './cartService';
import { generateCode, markCodeUsed } from './discountService';

interface CheckoutResult {
  order: Order;
  /** Present only when this order triggered the nth-order coupon. */
  couponGenerated?: Pick<DiscountCode, 'code' | 'discountPercent'>;
}

/**
 * Places an order for the user's current cart.
 *
 * Optionally applies a discount code. On every nth order (configured via
 * `N_TH_ORDER`), a new coupon is automatically generated for the customer
 * and returned in `couponGenerated`.
 *
 * @throws {AppError} 422 CART_EMPTY — cart has no items
 * @throws {AppError} 400 CODE_NOT_FOUND — discount code does not exist
 * @throws {AppError} 400 CODE_NOT_YOURS — code belongs to a different user
 * @throws {AppError} 400 CODE_ALREADY_USED — code was already redeemed
 */
export function checkout(store: Store, userId: string, discountCode?: string): CheckoutResult {
  const cart = store.carts.get(userId);
  if (!cart || cart.items.length === 0) {
    throw new AppError(422, 'CART_EMPTY', 'Cart is empty');
  }

  // Validate discount code upfront before mutating any state
  if (discountCode) {
    const dc = store.discountCodes.get(discountCode);
    if (!dc) throw new AppError(400, 'CODE_NOT_FOUND', 'Discount code not found');
    if (dc.userId !== userId) throw new AppError(400, 'CODE_NOT_YOURS', 'Discount code does not belong to you');
    if (dc.used) throw new AppError(400, 'CODE_ALREADY_USED', 'Discount code has already been used');
  }

  const subtotal = Math.round(
    cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
  ) / 100;

  let discountAmount = 0;
  if (discountCode) {
    const dc = store.discountCodes.get(discountCode)!;
    discountAmount = Math.round(subtotal * (dc.discountPercent / 100) * 100) / 100;
  }

  const total = Math.round((subtotal - discountAmount) * 100) / 100;
  const orderId = `ord-${randomUUID()}`;

  if (discountCode) {
    markCodeUsed(store, discountCode, orderId);
  }

  const order: Order = {
    id: orderId,
    userId,
    items: cart.items.map((i) => ({ ...i })),
    subtotal,
    discountCode,
    discountAmount,
    total,
    placedAt: new Date().toISOString(),
  };

  store.orders.push(order);
  clearCart(store, userId);

  // Auto-generate a coupon for the customer on every nth order
  let couponGenerated: Pick<DiscountCode, 'code' | 'discountPercent'> | undefined;
  if (store.orders.length % store.config.nthOrder === 0) {
    const newCode = generateCode(store, userId);
    couponGenerated = { code: newCode.code, discountPercent: newCode.discountPercent };
  }

  return { order, couponGenerated };
}
