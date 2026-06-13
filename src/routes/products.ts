import { Router, Request, Response } from 'express';
import { store } from '../store';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ products: Array.from(store.products.values()) });
});

export default router;
