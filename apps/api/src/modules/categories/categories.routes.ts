import { Router } from 'express';
import { Category } from '../../models/index.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

/** GET /categories — list all categories (small dataset, no pagination) */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
});

/** POST /categories — create category */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category.toObject() });
  } catch (error) { next(error); }
});

export const categoryRoutes = router;
