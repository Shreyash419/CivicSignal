// ============================================================
// BRICS AI Governance Platform — TypeScript Interfaces
// ============================================================

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type ComplaintStatus = 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'rejected';
export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'recommended';
export type Country = 'India' | 'Brazil' | 'Russia' | 'China' | 'South Africa';

// ── Complaint ────────────────────────────────────────────────
export interface Location {
  lat: number;
  lng: number;
  region: string;
  district?: string;
  country: Country;
  manualAddress?: string;
}

export interface Complaint {
  id: string;
  citizenId: string;
  citizenName?: string;
  citizenEmail?: string;
  text: string;
  originalLanguage?: string;
  translatedText?: string;
  category: string;
  severity: number; // 1-10
  priority: Priority;
  status: ComplaintStatus;
  location: Location;
  mediaUrls?: string[];
  audioUrl?: string;
  aiClassification?: string;
  aiConfidence?: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  timeline: ComplaintTimelineEvent[];
}

export interface ComplaintTimelineEvent {
  stage: string;
  label: string;
  completedAt?: string;
  note?: string;
  completed: boolean;
}

// ── Region / Hotspot ─────────────────────────────────────────
export interface Region {
  id: string;
  name: string;
  country: Country;
  population: number;
  totalComplaints: number;
  resolvedComplaints: number;
  resolutionRate: number;
  infrastructureScore: number; // 0-100 (higher = better infra)
  satisfactionScore: number; // 0-100
  topIssue: string;
  coordinates: { lat: number; lng: number };
  priority: Priority;
}

export interface Hotspot {
  id: string;
  regionId: string;
  regionName: string;
  country: Country;
  coordinates: { lat: number; lng: number };
  population: number;
  complaintCount: number;
  topIssue: string;
  infrastructureGapScore: number; // 0-100 (higher = bigger gap)
  demandScore: number; // 0-100
  populationImpactScore: number; // 0-100
  priorityScore: number; // composite 0-100
  priority: Priority;
  aiRecommendation: string;
  categories: { name: string; count: number }[];
}

// ── Infrastructure ───────────────────────────────────────────
export interface InfrastructureGap {
  id: string;
  category: string;
  icon: string;
  regionId: string;
  regionName: string;
  country: Country;
  gapScore: number; // 0-100 (higher = bigger gap)
  citizenDemand: number; // 0-100
  existingInfrastructure: number; // 0-100 (higher = more infra)
  populationImpact: number; // 0-100
  currentInvestment: number; // 0-100
  description: string;
  affectedPopulation: number;
}

// ── Recommendation ───────────────────────────────────────────
export interface Recommendation {
  id: string;
  regionId: string;
  regionName: string;
  country: Country;
  category: string;
  priority: Priority;
  priorityScore: number; // 0-100
  title: string;
  evidence: string[];
  recommendedAction: string;
  expectedImpact: string;
  estimatedCost?: string;
  timeframe?: string;
  confidence: number; // 0-100
  affectedPopulation: number;
  aiGenerated: boolean;
  createdAt: string;
}

// ── Government Plan ──────────────────────────────────────────
export interface GovernmentPlan {
  id: string;
  name: string;
  category: string;
  country: Country;
  regionId: string;
  regionName: string;
  status: ProjectStatus;
  priority: Priority;
  description: string;
  estimatedBudget?: string;
  expectedCompletion?: string;
  startDate?: string;
  citizenDemandScore: number; // how much citizens want this
  governmentInvestmentScore: number; // how much is being invested
  alignmentGap?: number; // demand - investment (positive = underinvested)
  location: { lat: number; lng: number };
  beneficiaries?: number;
}

// ── Analytics ────────────────────────────────────────────────
export interface AnalyticsDataPoint {
  date: string;
  complaints: number;
  resolved: number;
  pending: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface RegionComparison {
  region: string;
  country: Country;
  complaints: number;
  resolved: number;
  gapScore: number;
  satisfactionScore: number;
}

export interface Analytics {
  complaintsOverTime: AnalyticsDataPoint[];
  categoryBreakdown: CategoryBreakdown[];
  regionComparison: RegionComparison[];
  severityDistribution: { severity: string; count: number }[];
  resolutionTime: { category: string; avgDays: number }[];
}

// ── Dashboard Overview ───────────────────────────────────────
export interface DashboardOverview {
  totalComplaints: number;
  highPriorityIssues: number;
  resolutionRate: number;
  infrastructureGapIndex: number;
  citizenSatisfaction: number;
  activeHotspots: number;
  countriesConnected: number;
  complaintsChange: number; // percentage change
  resolutionChange: number;
}

// ── Citizen Dashboard ─────────────────────────────────────────
export interface CitizenDashboard {
  citizenId: string;
  name: string;
  region: string;
  country: Country;
  myComplaints: number;
  resolved: number;
  inProgress: number;
  areaIssues: number;
  recentComplaints: Complaint[];
  areaOverview: {
    topIssue: string;
    totalComplaints: number;
    infrastructureGapScore: number;
    satisfactionScore: number;
  };
}

// ── Area Data ──────────────────────────────────────────────────
export interface AreaData {
  region: Region;
  issueBreakdown: { category: string; percentage: number; count: number }[];
  nearbyComplaints: Complaint[];
  infrastructureGaps: InfrastructureGap[];
  governmentPlans: GovernmentPlan[];
}

// ── Complaint Submission ───────────────────────────────────────
export interface ComplaintSubmission {
  text: string;
  category: string;
  location: {
    lat?: number;
    lng?: number;
    region: string;
    country: Country;
    manualAddress?: string;
  };
  mediaUrls?: string[];
  audioUrl?: string;
  language?: string;
  citizenId?: string;
  citizenName?: string;
  citizenEmail?: string;
}

// ── Authentication & Users ─────────────────────────────────────
export type UserRole = 'citizen' | 'government';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phoneNumber?: string;
  region?: string;
  country: Country;
  department?: string; // Government department (e.g. Roads, Healthcare, Water & Sanitation)
  designation?: string; // Official title (e.g. District Officer, Chief Engineer)
  badgeNumber?: string; // Official Gov / Badge ID
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ── API Response wrapper ──────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

