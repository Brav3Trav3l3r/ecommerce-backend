import crypto from 'crypto';
import { Store, DiscountCode } from '../types';

function generateCodeString(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return `DISC-${result}`;
}

/**
 * Creates a new discount code tied to the given user and stores it.
 * Retries up to 3 times on the rare chance of a code collision.
 */
export function generateCode(store: Store, userId: string): DiscountCode {
  let code = generateCodeString();
  let attempts = 0;
  while (store.discountCodes.has(code) && attempts < 3) {
    code = generateCodeString();
    attempts++;
  }

  const discount: DiscountCode = {
    code,
    userId,
    discountPercent: store.config.discountPercent,
    used: false,
    createdAt: new Date().toISOString(),
  };

  store.discountCodes.set(code, discount);
  return discount;
}

/**
 * Checks whether a discount code is valid for the given user.
 * Returns a discriminated union — callers should check `valid` before using `discountPercent`.
 */
export function validateCode(
  store: Store,
  userId: string,
  code: string
): { valid: true; discountPercent: number } | { valid: false; reason: string } {
  const discount = store.discountCodes.get(code);

  if (!discount) return { valid: false, reason: 'CODE_NOT_FOUND' };
  if (discount.userId !== userId) return { valid: false, reason: 'CODE_NOT_YOURS' };
  if (discount.used) return { valid: false, reason: 'CODE_ALREADY_USED' };

  return { valid: true, discountPercent: discount.discountPercent };
}

/**
 * Marks a discount code as used and records the order it was applied to.
 * Silent no-op if the code does not exist (should not happen in normal flow).
 */
export function markCodeUsed(store: Store, code: string, orderId: string): void {
  const discount = store.discountCodes.get(code);
  if (discount) {
    discount.used = true;
    discount.usedInOrderId = orderId;
  }
}
