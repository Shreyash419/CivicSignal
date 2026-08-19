import { Router, Request, Response } from 'express';
import { database } from '../db/firestore';

export const regionsRouter = Router();

// GET /api/regions
regionsRouter.get('/regions', async (req: Request, res: Response) => {
  try {
    const { country } = req.query;
    const regions = await database.getRegions(country as string);
    return res.json({
      success: true,
      data: regions,
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

// GET /api/areas/:regionId
regionsRouter.get('/areas/:regionId', async (req: Request, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.regionId) ? req.params.regionId[0] : req.params.regionId;
    const regionId = rawId === 'my' ? undefined : rawId;
    const areaData = await database.getAreaData(regionId);
    return res.json({
      success: true,
      data: areaData,
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

// GET /api/areas/:regionId/complaints
regionsRouter.get('/areas/:regionId/complaints', async (req: Request, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.regionId) ? req.params.regionId[0] : req.params.regionId;
    const regionId = rawId === 'my' ? undefined : rawId;
    const areaData = await database.getAreaData(regionId);
    return res.json({
      success: true,
      data: areaData.nearbyComplaints,
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
