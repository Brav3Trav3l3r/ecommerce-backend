import { Router, Request, Response, NextFunction } from 'express';
import { store } from '../store';
import { getCart, addItem, updateItem, removeItem, clearCart } from '../services/cartService';

const router = Router();

/** GET /api/cart — returns the current cart with computed subtotal. */
router.get('/', (req: Request, res: Response) => {
  res.json({ data: getCart(store, req.userId!) });
});

/**
 * POST /api/cart/items — adds a product to the cart.
 * Body: `{ productId: string, quantity?: number }`
 */
router.post('/items', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body as { productId: string; quantity?: number };
    res.json({ data: addItem(store, req.userId!, productId, quantity) });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/cart/items/:productId — sets quantity of an existing item.
 * Passing quantity=0 removes the item.
 * Body: `{ quantity: number }`
 */
router.put('/items/:productId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity } = req.body as { quantity: number };
    res.json({ data: updateItem(store, req.userId!, req.params.productId as string, quantity) });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/cart/items/:productId — removes a single item from the cart. */
router.delete('/items/:productId', (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: removeItem(store, req.userId!, req.params.productId as string) });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/cart — clears all items from the cart. */
router.delete('/', (req: Request, res: Response) => {
  res.json({ data: clearCart(store, req.userId!) });
});

export default router;
