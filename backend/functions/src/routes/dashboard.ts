import { Router, Request, Response } from 'express';
import { database } from '../db/firestore';

export const dashboardRouter = Router();

// GET /api/governance/overview
dashboardRouter.get('/governance/overview', async (req: Request, res: Response) => {
  try {
    const { country, region, dateRange } = req.query;
    const overview = await database.getDashboardOverview({
      country: country as string,
      region: region as string,
      dateRange: dateRange as string,
    });

    return res.json({
      success: true,
      data: overview,
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

// GET /api/governance/hotspots
dashboardRouter.get('/governance/hotspots', async (req: Request, res: Response) => {
  try {
    const { country, priority, category } = req.query;
    const hotspots = await database.getHotspots({
      country: country as string,
      priority: priority as string,
      category: category as string,
    });

    return res.json({
      success: true,
      data: hotspots,
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

// GET /api/citizen/dashboard
dashboardRouter.get('/citizen/dashboard', async (req: Request, res: Response) => {
  try {
    const data = await database.getCitizenDashboard();
    return res.json({
      success: true,
      data,
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
