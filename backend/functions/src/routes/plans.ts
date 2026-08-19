import { Router, Request, Response } from 'express';
import { database } from '../db/firestore';

export const plansRouter = Router();

// GET /api/plans
plansRouter.get('/plans', async (req: Request, res: Response) => {
  try {
    const { country, status, category, regionId } = req.query;
    const plans = await database.getGovernmentPlans({
      country: country as string,
      status: status as string,
      category: category as string,
      regionId: regionId as string,
    });

    return res.json({
      success: true,
      data: plans,
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

// GET /api/governance/plans
plansRouter.get('/governance/plans', async (req: Request, res: Response) => {
  try {
    const { country, status, category, regionId } = req.query;
    const plans = await database.getGovernmentPlans({
      country: country as string,
      status: status as string,
      category: category as string,
      regionId: regionId as string,
    });

    return res.json({
      success: true,
      data: plans,
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
