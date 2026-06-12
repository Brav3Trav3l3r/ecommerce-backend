import { resetStore, store } from '../store';
import { generateCode, validateCode, markCodeUsed } from '../services/discountService';

beforeEach(() => {
  resetStore();
  store.config.discountPercent = 10;
});

describe('generateCode', () => {
  it('returns a code matching DISC-[A-Z0-9]{8}', () => {
    const code = generateCode(store, 'u1');
    expect(code.code).toMatch(/^DISC-[A-Z0-9]{8}$/);
  });

  it('stores the code tied to userId', () => {
    const code = generateCode(store, 'u1');
    expect(store.discountCodes.has(code.code)).toBe(true);
    expect(store.discountCodes.get(code.code)?.userId).toBe('u1');
  });

  it('sets used to false and correct discountPercent', () => {
    const code = generateCode(store, 'u1');
    expect(code.used).toBe(false);
    expect(code.discountPercent).toBe(10);
  });
});

describe('validateCode', () => {
  it('returns valid: true for an unused code owned by the user', () => {
    const { code } = generateCode(store, 'u1');
    const result = validateCode(store, 'u1', code);
    expect(result).toEqual({ valid: true, discountPercent: 10 });
  });

  it('returns valid: false with CODE_NOT_FOUND for unknown code', () => {
    const result = validateCode(store, 'u1', 'DISC-XXXXXXXX');
    expect(result).toEqual({ valid: false, reason: 'CODE_NOT_FOUND' });
  });

  it('returns valid: false with CODE_NOT_YOURS for wrong user', () => {
    const { code } = generateCode(store, 'u1');
    const result = validateCode(store, 'u2', code);
    expect(result).toEqual({ valid: false, reason: 'CODE_NOT_YOURS' });
  });

  it('returns valid: false with CODE_ALREADY_USED for used code', () => {
    const { code } = generateCode(store, 'u1');
    markCodeUsed(store, code, 'ord-123');
    const result = validateCode(store, 'u1', code);
    expect(result).toEqual({ valid: false, reason: 'CODE_ALREADY_USED' });
  });
});

describe('markCodeUsed', () => {
  it('sets used: true and usedInOrderId', () => {
    const { code } = generateCode(store, 'u1');
    markCodeUsed(store, code, 'ord-abc');
    const dc = store.discountCodes.get(code);
    expect(dc?.used).toBe(true);
    expect(dc?.usedInOrderId).toBe('ord-abc');
  });
});
