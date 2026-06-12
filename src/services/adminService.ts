import { Store, DiscountCode } from '../types';
import { AppError } from '../errors';
import { generateCode } from './discountService';

interface AdminStats {
  totalItemsPurchased: number;
  totalRevenue: number;
  totalDiscountGiven: number;
  totalOrders: number;
  discountCodes: {
    total: number;
    used: number;
    unused: number;
    codes: DiscountCode[];
  };
}

/**
 * Returns aggregate store statistics: revenue, items purchased, discounts
 * given, and a full breakdown of all discount codes.
 */
export function getStats(store: Store): AdminStats {
  const codes = Array.from(store.discountCodes.values());
  const used = codes.filter((c) => c.used).length;

  return {
    totalItemsPurchased: store.orders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    ),
    totalRevenue: Math.round(store.orders.reduce((sum, o) => sum + o.total, 0) * 100) / 100,
    totalDiscountGiven: Math.round(store.orders.reduce((sum, o) => sum + o.discountAmount, 0) * 100) / 100,
    totalOrders: store.orders.length,
    discountCodes: {
      total: codes.length,
      used,
      unused: codes.length - used,
      codes,
    },
  };
}

/**
 * Manually generates a discount code for the given user via the admin API.
 *
 * The nth-order condition must be satisfied (total orders must be a non-zero
 * multiple of `config.nthOrder`) and the user must not already hold an unused
 * code.
 *
 * @throws {AppError} 409 CONDITION_NOT_MET — nth-order condition not satisfied
 * @throws {AppError} 409 CODE_ALREADY_EXISTS — user already has an unused code
 */
export function adminGenerateCode(store: Store, userId: string): DiscountCode {
  const { orders, config, discountCodes } = store;

  if (orders.length === 0 || orders.length % config.nthOrder !== 0) {
    throw new AppError(409, 'CONDITION_NOT_MET', 'nth-order condition is not currently satisfied');
  }

  const existingUnused = Array.from(discountCodes.values()).find(
    (c) => c.userId === userId && !c.used
  );
  if (existingUnused) {
    throw new AppError(409, 'CODE_ALREADY_EXISTS', 'User already has an unused discount code');
  }

  return generateCode(store, userId);
}
