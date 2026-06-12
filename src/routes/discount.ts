import { Router, Request, Response, NextFunction } from 'express';
import { store } from '../store';
import { validateCode } from '../services/discountService';

const router = Router();

/**
 * POST /api/discount/validate — checks whether a discount code is valid for
 * the requesting user.
 *
 * Body: `{ code: string }`
 *
 * Returns `{ valid: true, discountPercent }` or `{ valid: false, reason }`.
 * Does NOT consume the code — use it at checkout to apply it.
 */
router.post('/validate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body as { code: string };
    res.json({ data: validateCode(store, req.userId!, code) });
  } catch (err) {
    next(err);
  }
});

export default router;
