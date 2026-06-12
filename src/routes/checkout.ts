import { Router, Request, Response, NextFunction } from 'express';
import { store } from '../store';
import { checkout } from '../services/checkoutService';

const router = Router();

/**
 * POST /api/checkout — places an order from the user's current cart.
 *
 * Body: `{ discountCode?: string }`
 *
 * Returns 201 with the placed order. If this was the nth order, the response
 * also includes `couponGenerated` with the new discount code.
 */
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { discountCode } = req.body as { discountCode?: string };
    const result = checkout(store, req.userId!, discountCode);
    res.status(201).json({ data: { ...result.order, couponGenerated: result.couponGenerated } });
  } catch (err) {
    next(err);
  }
});

export default router;
