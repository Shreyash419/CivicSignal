import { Router, Request, Response } from 'express';
import { database } from '../db/firestore';

export const recommendationsRouter = Router();

// GET /api/governance/recommendations
recommendationsRouter.get('/governance/recommendations', async (req: Request, res: Response) => {
  try {
    const { country, priority, category } = req.query;
    const recommendations = await database.getRecommendations({
      country: country as string,
      priority: priority as string,
      category: category as string,
    });

    return res.json({
      success: true,
      data: recommendations,
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
