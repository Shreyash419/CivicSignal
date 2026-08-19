import { Router, Request, Response } from 'express';
import { database } from '../db/firestore';
import { geminiService } from '../services/gemini';
import { Complaint, ComplaintSubmission } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

import { geocodeLocation } from '../services/geocoding';

export const complaintsRouter = Router();

// POST /api/complaints - Submit new complaint
complaintsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body: ComplaintSubmission = req.body;
    if (!body.text || !body.category) {
      return res.status(400).json({
        success: false,
        message: 'text and category are required',
        timestamp: new Date().toISOString(),
      });
    }

    const aiResult = await geminiService.classifyComplaint(body.text, body.language || 'en', body.category);
    const complaintId = `CMP-2024-${uuidv4().substring(0, 4).toUpperCase()}`;
    const now = new Date().toISOString();

    // Geocode location if exact lat/lng is missing
    const locationQuery = body.location?.manualAddress || body.location?.region || body.text;
    let lat = body.location?.lat;
    let lng = body.location?.lng;
    let regionDisplayName = body.location?.region || 'Patna';

    if (typeof lat !== 'number' || typeof lng !== 'number' || (lat === 25.5941 && lng === 85.1376 && body.location?.manualAddress)) {
      const geocoded = await geocodeLocation(locationQuery, body.location?.country || 'India');
      lat = geocoded.lat;
      lng = geocoded.lng;
      regionDisplayName = geocoded.displayName;
    }

    const newComplaint: Complaint = {
      id: complaintId,
      citizenId: 'CTZ-001', // Authenticated/default citizen
      text: body.text,
      originalLanguage: body.language || 'English',
      translatedText: aiResult.translatedText,
      category: aiResult.category,
      severity: aiResult.severity,
      priority: aiResult.priority,
      status: 'submitted',
      location: {
        lat,
        lng,
        region: regionDisplayName,
        district: body.location?.manualAddress || regionDisplayName,
        country: body.location?.country || 'India',
        manualAddress: body.location?.manualAddress,
      },
      mediaUrls: body.mediaUrls || [],
      audioUrl: body.audioUrl,
      aiClassification: aiResult.aiClassification,
      aiConfidence: aiResult.aiConfidence,
      createdAt: now,
      updatedAt: now,
      timeline: [
        { stage: 'submitted', label: 'Submitted', completedAt: now, completed: true },
        {
          stage: 'ai_classified',
          label: 'AI Classified',
          completedAt: now,
          note: `${aiResult.aiClassification} (${Math.round(aiResult.aiConfidence * 100)}% confidence)`,
          completed: true,
        },
        { stage: 'under_review', label: 'Under Review', completed: false },
        { stage: 'assigned', label: 'Assigned', completed: false },
        { stage: 'in_progress', label: 'In Progress', completed: false },
        { stage: 'resolved', label: 'Resolved', completed: false },
      ],
    };

    await database.saveComplaint(newComplaint);

    return res.status(201).json({
      success: true,
      data: { id: complaintId, complaint: newComplaint },
      message: 'Complaint submitted and AI-classified successfully',
      timestamp: now,
    });
  } catch (error: any) {
    console.error('Error submitting complaint:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/complaints/my - Get complaints for citizen
complaintsRouter.get('/my', async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;
    const complaints = await database.getComplaints({
      citizenId: 'CTZ-001',
      status: status as string,
      category: category as string,
    });

    return res.json({
      success: true,
      data: complaints,
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

// GET /api/complaints - Get all complaints
complaintsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;
    const complaints = await database.getComplaints({
      status: status as string,
      category: category as string,
    });

    return res.json({
      success: true,
      data: complaints,
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

// GET /api/complaints/:id - Get single complaint
complaintsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const complaint = await database.getComplaintById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
        data: null,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      data: complaint,
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

// PATCH /api/complaints/:id/status - Update status
complaintsRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;
    const updated = await database.updateComplaintStatus(id, status);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      data: updated,
      message: 'Complaint status updated',
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
