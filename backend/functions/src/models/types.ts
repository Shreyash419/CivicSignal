export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type ComplaintStatus = 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'rejected';
export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'recommended';
export type Country = 'India' | 'Brazil' | 'Russia' | 'China' | 'South Africa';

export interface Location {
  lat?: number;
  lng?: number;
  region: string;
  district?: string;
  country: Country;
  manualAddress?: string;
}

export interface ComplaintTimelineEvent {
  stage: string;
  label: string;
  completedAt?: string;
  note?: string;
  completed: boolean;
}

export interface Complaint {
  id: string;
  citizenId: string;
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

export interface Region {
  id: string;
  name: string;
  country: Country;
  population: number;
  totalComplaints: number;
  resolvedComplaints: number;
  resolutionRate: number;
  infrastructureScore: number;
  satisfactionScore: number;
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
  infrastructureGapScore: number;
  demandScore: number;
  populationImpactScore: number;
  priorityScore: number;
  priority: Priority;
  aiRecommendation: string;
  categories: { name: string; count: number }[];
}

export interface InfrastructureGap {
  id: string;
  category: string;
  icon: string;
  regionId: string;
  regionName: string;
  country: Country;
  gapScore: number;
  citizenDemand: number;
  existingInfrastructure: number;
  populationImpact: number;
  currentInvestment: number;
  description: string;
  affectedPopulation: number;
}

export interface Recommendation {
  id: string;
  regionId: string;
  regionName: string;
  country: Country;
  category: string;
  priority: Priority;
  priorityScore: number;
  title: string;
  evidence: string[];
  recommendedAction: string;
  expectedImpact: string;
  estimatedCost?: string;
  timeframe?: string;
  confidence: number;
  affectedPopulation: number;
  aiGenerated: boolean;
  createdAt: string;
}

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
  citizenDemandScore: number;
  governmentInvestmentScore: number;
  alignmentGap?: number;
  location: { lat: number; lng: number };
  beneficiaries?: number;
}

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

export interface DashboardOverview {
  totalComplaints: number;
  highPriorityIssues: number;
  resolutionRate: number;
  infrastructureGapIndex: number;
  citizenSatisfaction: number;
  activeHotspots: number;
  countriesConnected: number;
  complaintsChange: number;
  resolutionChange: number;
}

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

export interface AreaData {
  region: Region;
  issueBreakdown: { category: string; percentage: number; count: number }[];
  nearbyComplaints: Complaint[];
  infrastructureGaps: InfrastructureGap[];
  governmentPlans: GovernmentPlan[];
}

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
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}
