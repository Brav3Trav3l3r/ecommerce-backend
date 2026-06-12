import { Router, Request, Response, NextFunction } from 'express';
import { store } from '../store';
import { getStats, adminGenerateCode } from '../services/adminService';
import { AppError } from '../errors';

const router = Router();

/**
 * Admin auth middleware — all routes in this router require the
 * `X-Admin-Key` header to match `config.adminKey`.
 * Returns 401 UNAUTHORIZED on mismatch or missing header.
 */
router.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.headers['x-admin-key'] !== store.config.adminKey) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Invalid or missing admin key'));
  }
  next();
});

/**
 * POST /api/admin/discount/generate — manually generates a discount code for
 * a user when the nth-order condition is satisfied.
 *
 * Body: `{ userId: string }`
 *
 * Returns 201 with the created `DiscountCode` object.
 */
router.post('/discount/generate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body as { userId: string };
    const code = adminGenerateCode(store, userId);
    res.status(201).json({ data: code });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/stats — returns aggregate store statistics: total items
 * purchased, revenue, discounts given, and a full discount code breakdown.
 */
router.get('/stats', (_req: Request, res: Response) => {
  res.json({ data: getStats(store) });
});

export default router;
