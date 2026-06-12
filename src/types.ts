// Extends Express.Request so req.userId is available in all user-facing routes
// after the requireUserId middleware runs.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  total: number;
  placedAt: string;
}

export interface DiscountCode {
  code: string;
  userId: string;
  discountPercent: number;
  used: boolean;
  usedInOrderId?: string;
  createdAt: string;
}

export interface StoreConfig {
  nthOrder: number;
  discountPercent: number;
  adminKey: string;
}

export interface Store {
  products: Map<string, Product>;
  carts: Map<string, Cart>;
  orders: Order[];
  discountCodes: Map<string, DiscountCode>;
  config: StoreConfig;
}
