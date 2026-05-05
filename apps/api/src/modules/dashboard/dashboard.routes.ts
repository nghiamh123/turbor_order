import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service.js';
import type { DashboardPeriod } from '@turboorder/shared';

const router = Router();

router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as DashboardPeriod) || 'month';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const data = await dashboardService.getOverview(period, startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export const dashboardRoutes = router;
