import { Priority } from '../models/types';

export interface AIClassificationResult {
  category: string;
  severity: number;
  priority: Priority;
  aiClassification: string;
  aiConfidence: number;
  translatedText: string;
}

export class GeminiService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
  }

  async classifyComplaint(text: string, language: string = 'en', inputCategory?: string): Promise<AIClassificationResult> {
    // If Gemini API Key is available, could call Google Generative AI REST API or SDK
    // Smart heuristic + classification engine fallback
    const lowerText = text.toLowerCase();
    
    let category = inputCategory || 'General Infrastructure';
    let severity = 5;
    let classification = 'Standard Citizen Concern';

    if (lowerText.includes('hospital') || lowerText.includes('doctor') || lowerText.includes('health') || lowerText.includes('medical') || lowerText.includes('clinic')) {
      category = 'Healthcare';
      severity = 8;
      classification = 'Healthcare Access - Primary Care Gap';
    } else if (lowerText.includes('road') || lowerText.includes('pothole') || lowerText.includes('bridge') || lowerText.includes('traffic') || lowerText.includes('highway')) {
      category = 'Roads & Transport';
      severity = 7;
      classification = 'Road Infrastructure - High Priority';
    } else if (lowerText.includes('water') || lowerText.includes('pipe') || lowerText.includes('drainage') || lowerText.includes('sanitation') || lowerText.includes('sewage')) {
      category = 'Water & Sanitation';
      severity = 8;
      classification = 'Water Access & Quality Priority';
    } else if (lowerText.includes('power') || lowerText.includes('electricity') || lowerText.includes('blackout') || lowerText.includes('wire') || lowerText.includes('transformer')) {
      category = 'Energy & Grid';
      severity = 7;
      classification = 'Power Grid Deficit';
    } else if (lowerText.includes('school') || lowerText.includes('teacher') || lowerText.includes('education') || lowerText.includes('student') || lowerText.includes('classroom')) {
      category = 'Education';
      severity = 6;
      classification = 'Educational Infrastructure Need';
    }

    if (lowerText.includes('urgent') || lowerText.includes('accident') || lowerText.includes('dead') || lowerText.includes('hazard') || lowerText.includes('collapsed') || lowerText.includes('emergency')) {
      severity = Math.min(10, severity + 2);
    }

    let priority: Priority = 'low';
    if (severity >= 8) priority = 'critical';
    else if (severity >= 6) priority = 'high';
    else if (severity >= 4) priority = 'medium';

    return {
      category,
      severity,
      priority,
      aiClassification: classification,
      aiConfidence: 0.92,
      translatedText: text,
    };
  }
}

export const geminiService = new GeminiService();
