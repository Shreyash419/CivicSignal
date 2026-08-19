import { Router, Request, Response } from 'express';
import { database } from '../db/firestore';

export const analyticsRouter = Router();

// GET /api/governance/analytics
analyticsRouter.get('/governance/analytics', async (req: Request, res: Response) => {
  try {
    const { country, dateRange } = req.query;
    const analytics = await database.getAnalytics({
      country: country as string,
      dateRange: dateRange as string,
    });

    return res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/governance/infrastructure
analyticsRouter.get('/governance/infrastructure', async (req: Request, res: Response) => {
  try {
    const { country, category } = req.query;
    const gaps = await database.getInfrastructureGaps({
      country: country as string,
      category: category as string,
    });

    return res.json({
      success: true,
      data: gaps,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
