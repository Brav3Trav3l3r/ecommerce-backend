import express, { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';
import cartRouter from './routes/cart';
import checkoutRouter from './routes/checkout';
import discountRouter from './routes/discount';
import adminRouter from './routes/admin';

/**
 * Creates and configures the Express application.
 *
 * Exported as a factory (no side effects at import time) so tests can spin up
 * a fresh app instance without starting the HTTP server.
 *
 * Route layout:
 * - `GET    /api/cart`                       — view cart
 * - `POST   /api/cart/items`                 — add item to cart
 * - `PUT    /api/cart/items/:productId`      — update item quantity
 * - `DELETE /api/cart/items/:productId`      — remove item
 * - `DELETE /api/cart`                       — clear cart
 * - `POST   /api/checkout`                   — place order
 * - `POST   /api/discount/validate`          — check a discount code
 * - `POST   /api/admin/discount/generate`    — admin: generate code
 * - `GET    /api/admin/stats`                — admin: store statistics
 */
export function createApp() {
  const app = express();

  app.use(express.json());

  // Validate X-User-Id and attach it to req.userId for downstream handlers
  const requireUserId = (req: Request, res: Response, next: NextFunction) => {
    const id = req.headers['x-user-id'];
    if (!id) {
      res.status(400).json({ error: { code: 'MISSING_USER_ID', message: 'X-User-Id header is required' } });
      return;
    }
    req.userId = Array.isArray(id) ? id[0] : id;
    next();
  };

  app.use('/api/cart', requireUserId, cartRouter);
  app.use('/api/checkout', requireUserId, checkoutRouter);
  app.use('/api/discount', requireUserId, discountRouter);
  app.use('/api/admin', adminRouter);

  // Global error handler — catches AppError and unexpected errors uniformly
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      console.error(`[ERROR] ${req.method} ${req.path} → ${err.statusCode} | ${err.code}: ${err.message}`);
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    console.error(`[ERROR] ${req.method} ${req.path} → 500 | INTERNAL_ERROR:`, err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  });

  return app;
}
