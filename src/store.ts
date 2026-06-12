import 'dotenv/config';
import { Store } from './types';

function createStore(): Store {
  return {
    products: new Map(),
    carts: new Map(),
    orders: [],
    discountCodes: new Map(),
    config: {
      nthOrder: parseInt(process.env.N_TH_ORDER ?? '5', 10),
      discountPercent: parseInt(process.env.DISCOUNT_PERCENT ?? '10', 10),
      adminKey: process.env.ADMIN_KEY ?? 'admin-secret',
    },
  };
}

export const store: Store = createStore();

// Reinitialises all state — used in tests to get a clean slate between runs
export function resetStore(): void {
  store.products.clear();
  store.carts.clear();
  store.orders.length = 0;
  store.discountCodes.clear();
  store.config = {
    nthOrder: parseInt(process.env.N_TH_ORDER ?? '5', 10),
    discountPercent: parseInt(process.env.DISCOUNT_PERCENT ?? '10', 10),
    adminKey: process.env.ADMIN_KEY ?? 'admin-secret',
  };
}
