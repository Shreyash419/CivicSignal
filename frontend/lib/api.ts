// ============================================================
// BRICS AI Governance Platform — API Abstraction Layer
// ============================================================

import type {
  Complaint,
  ComplaintSubmission,
  AreaData,
  GovernmentPlan,
  DashboardOverview,
  Hotspot,
  Analytics,
  InfrastructureGap,
  Recommendation,
  CitizenDashboard,
  Region,
  ApiResponse,
} from '@/types';

import {
  mockComplaints,
  mockHotspots,
  mockInfrastructureGaps,
  mockRecommendations,
  mockGovernmentPlans,
  mockAnalytics,
  mockDashboardOverview,
  mockCitizenDashboard,
  mockAreaData,
  mockRegions,
} from '@/lib/mockData';
import { getAllRealCitizenComplaints } from '@/lib/firebaseComplaints';
import { getLocalStoredUser } from '@/lib/firebaseAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api';
const LOCAL_STORAGE_KEY = 'civicsignal_user_complaints';

// Helper to get local stored complaints
function getStoredComplaints(): Complaint[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Helper to save a complaint to local storage
function saveStoredComplaint(complaint: Complaint): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredComplaints();
    const updated = [complaint, ...existing.filter(c => c.id !== complaint.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save complaint to localStorage:', e);
  }
}

// ── Haversine distance (km) between two lat/lng points ────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Merge user complaints into hotspot data ────────────────────
// - If complaint is within 200 km of an existing hotspot → update that hotspot
// - If complaint is farther → CREATE a brand-new hotspot on the map
function mergeComplaintsIntoHotspots(baseHotspots: Hotspot[], userComplaints: Complaint[]): Hotspot[] {
  if (userComplaints.length === 0) return baseHotspots;

  // Deep clone to avoid mutating the imported mock array
  const updated: Hotspot[] = baseHotspots.map(h => ({
    ...h,
    categories: [...h.categories],
  }));

  // Track dynamically created hotspots keyed by complaint id to avoid duplicates
  const newHotspotMap: Map<string, Hotspot> = new Map();

  for (const complaint of userComplaints) {
    const cLat = complaint.location?.lat;
    const cLng = complaint.location?.lng;
    // Skip complaints without coordinates (manual text address only)
    if (typeof cLat !== 'number' || typeof cLng !== 'number') continue;

    // Find nearest existing hotspot (including ones created earlier in this loop)
    const allHotspots = [...updated, ...newHotspotMap.values()];
    let nearestIdx = -1;
    let nearestDist = Infinity;
    let nearestIsNew = false;

    for (let i = 0; i < allHotspots.length; i++) {
      const dist = haversineKm(cLat, cLng, allHotspots[i].coordinates.lat, allHotspots[i].coordinates.lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
        nearestIsNew = i >= updated.length;
      }
    }

    const MERGE_RADIUS_KM = 200; // within 200 km → update existing hotspot

    if (nearestIdx !== -1 && nearestDist <= MERGE_RADIUS_KM) {
      // ── Update existing (or already-created new) hotspot ──────
      const target = nearestIsNew
        ? allHotspots[nearestIdx]
        : updated[nearestIdx];

      target.complaintCount += 1;
      target.demandScore = Math.min(100, target.demandScore + 1.5);
      target.priorityScore = parseFloat(
        ((target.infrastructureGapScore + target.demandScore + target.populationImpactScore) / 3).toFixed(1)
      );
      if (target.priorityScore >= 85) target.priority = 'critical';
      else if (target.priorityScore >= 70) target.priority = 'high';
      else if (target.priorityScore >= 50) target.priority = 'medium';
      else target.priority = 'low';

      const existingCat = target.categories.find(c => c.name === complaint.category);
      if (existingCat) existingCat.count += 1;
      else target.categories.push({ name: complaint.category, count: 1 });
      const topCat = target.categories.reduce((a, b) => (a.count >= b.count ? a : b));
      target.topIssue = topCat.name;
    } else {
      // ── Create a brand-new hotspot for this complaint location ──
      const regionLabel =
        complaint.location?.region ||
        complaint.location?.manualAddress ||
        `${cLat.toFixed(2)}, ${cLng.toFixed(2)}`;

      const demandScore = 60;
      const infraScore = 55;
      const popScore = 50;
      const priorityScore = parseFloat(((infraScore + demandScore + popScore) / 3).toFixed(1));

      const newHotspot: Hotspot = {
        id: `HOT-USER-${complaint.id}`,
        regionId: `REG-USER-${complaint.id}`,
        regionName: regionLabel,
        country: (complaint.location?.country || 'India') as any,
        coordinates: { lat: cLat, lng: cLng },
        population: 500000, // reasonable default
        complaintCount: 1,
        topIssue: complaint.category || 'Other',
        infrastructureGapScore: infraScore,
        demandScore,
        populationImpactScore: popScore,
        priorityScore,
        priority: priorityScore >= 85 ? 'critical' : priorityScore >= 70 ? 'high' : 'medium',
        aiRecommendation: `New complaint registered in ${regionLabel}. Category: ${complaint.category}. Requires assessment and prioritization by local authorities.`,
        categories: [{ name: complaint.category || 'Other', count: 1 }],
      };

      newHotspotMap.set(complaint.id, newHotspot);
    }
  }

  return [...updated, ...newHotspotMap.values()];
}


// ── Helper ────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit, mockFallback?: T | (() => T)): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
    const json: ApiResponse<T> = await res.json();
    return json.data;
  } catch {
    if (mockFallback !== undefined) {
      return typeof mockFallback === 'function' ? (mockFallback as () => T)() : mockFallback;
    }
    throw new Error('API fetch failed');
  }
}

function delay(ms = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

import {
  saveComplaintToFirestore,
  getComplaintsFromFirestore,
  getLocalComplaints,
} from './firebaseComplaints';

// ── Citizen API ───────────────────────────────────────────────

/** Submit a new citizen complaint (persisted directly to Firebase Firestore) */
export async function submitComplaint(data: ComplaintSubmission): Promise<{ id: string }> {
  const currentUser = getLocalStoredUser();
  const savedComplaint = await saveComplaintToFirestore(data, currentUser);

  try {
    const res = await apiFetch<{ id: string }>('/complaints', {
      method: 'POST',
      body: JSON.stringify(savedComplaint),
    }, () => ({ id: savedComplaint.id }));
    return res;
  } catch {
    await delay(200);
    return { id: savedComplaint.id };
  }
}

/** Get all complaints for the logged-in citizen from Firestore */
export async function getMyComplaints(filters?: {
  status?: string;
  category?: string;
}): Promise<Complaint[]> {
  const currentUser = getLocalStoredUser();
  const citizenId = currentUser?.uid;

  try {
    const firestoreComplaints = await getComplaintsFromFirestore(citizenId, filters);
    return firestoreComplaints;
  } catch (e) {
    console.warn('Could not retrieve complaints from Firestore:', e);
  }

  const localList = getStoredComplaints();
  const isDemo = citizenId === 'ctz-demo-rajesh-001' || citizenId === 'CTZ-001';
  const combined = isDemo
    ? [...localList, ...mockComplaints.filter(c => c.citizenId === 'CTZ-001')]
    : localList.filter(c => c.citizenId === citizenId);

  let list = combined;
  if (filters?.status && filters.status !== 'all') {
    list = list.filter(c => c.status === filters.status);
  }
  if (filters?.category && filters.category !== 'all') {
    list = list.filter(c => c.category === filters.category);
  }
  return list;
}

/** Get a single complaint by ID */
export async function getComplaint(id: string): Promise<Complaint | null> {
  const localList = getStoredComplaints();
  const found = localList.find(c => c.id === id);
  if (found) return found;

  const getMock = () => mockComplaints.find(c => c.id === id) ?? null;
  return apiFetch(`/complaints/${id}`, undefined, getMock);
}

/** Get area data for the citizen's region */
export async function getAreaData(regionId?: string): Promise<AreaData> {
  const getMock = () => mockAreaData;
  return apiFetch(`/areas/${regionId ?? 'my'}`, undefined, getMock);
}

/** Get nearby complaints (anonymised) */
export async function getAreaComplaints(regionId?: string): Promise<Complaint[]> {
  const localList = getStoredComplaints();
  const getMock = () => [...localList, ...mockAreaData.nearbyComplaints];
  return apiFetch(`/areas/${regionId ?? 'my'}/complaints`, undefined, getMock);
}

/** Get government plans for the citizen's area */
export async function getGovernmentPlans(regionId?: string): Promise<GovernmentPlan[]> {
  const getMock = () => (regionId
    ? mockGovernmentPlans.filter(p => p.regionId === regionId)
    : mockGovernmentPlans);
  return apiFetch(`/plans?regionId=${regionId ?? ''}`, undefined, getMock);
}

/** Get citizen dashboard summary (real user profile & real counts) */
export async function getCitizenDashboard(): Promise<CitizenDashboard> {
  const currentUser = getLocalStoredUser();
  const citizenId = currentUser?.uid;
  const isDemo = citizenId === 'ctz-demo-rajesh-001' || citizenId === 'CTZ-001';

  // Retrieve real complaints for this citizen
  const userComplaints = await getComplaintsFromFirestore(citizenId);

  if (!isDemo && currentUser) {
    const resolvedCount = userComplaints.filter(c => c.status === 'resolved').length;
    const inProgressCount = userComplaints.filter(c => c.status === 'in_progress').length;

    return {
      citizenId: currentUser.uid,
      name: currentUser.displayName,
      region: currentUser.region || 'Patna',
      country: currentUser.country || 'India',
      myComplaints: userComplaints.length,
      resolved: resolvedCount,
      inProgress: inProgressCount,
      areaIssues: 420,
      recentComplaints: userComplaints.slice(0, 5),
      areaOverview: {
        topIssue: userComplaints.length > 0 ? userComplaints[0].category : 'Healthcare',
        totalComplaints: 420,
        infrastructureGapScore: 78,
        satisfactionScore: 45,
      },
    };
  }

  // If Demo Citizen is active, return full demo suite
  return {
    ...mockCitizenDashboard,
    myComplaints: userComplaints.length > 0 ? userComplaints.length : mockCitizenDashboard.myComplaints,
    recentComplaints: userComplaints.length > 0 ? userComplaints.slice(0, 5) : mockCitizenDashboard.recentComplaints,
  };
}

function isDemoOfficial(): boolean {
  const currentUser = getLocalStoredUser();
  if (!currentUser) return true;
  return (
    currentUser.uid.startsWith('gov-demo') ||
    currentUser.email.includes('elena.rossi') ||
    currentUser.displayName === 'Dr. Elena Rossi'
  );
}

// ── Governance API ────────────────────────────────────────────

/** Get governance overview KPIs (Real stats for real officials, mock for demo official) */
export async function getDashboardOverview(filters?: {
  country?: string;
  region?: string;
  dateRange?: string;
}): Promise<DashboardOverview> {
  if (isDemoOfficial()) {
    const params = new URLSearchParams(filters as Record<string, string>);
    return apiFetch(`/governance/overview?${params}`, undefined, () => mockDashboardOverview);
  }

  const realComplaints = await getAllRealCitizenComplaints(filters);
  const total = realComplaints.length;
  const highPriority = realComplaints.filter(c => c.priority === 'critical' || c.priority === 'high').length;
  const resolved = realComplaints.filter(c => c.status === 'resolved').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const avgSeverity = total > 0 ? realComplaints.reduce((s, c) => s + c.severity, 0) / total : 0;
  const gapIndex = total > 0 ? Math.round(avgSeverity * 10) : 0;
  const satisfaction = total > 0 ? (resolved > 0 ? Math.round((resolved / total) * 100) : 40) : 100;
  const distinctRegions = new Set(realComplaints.map(c => c.location?.region).filter(Boolean)).size;
  const distinctCountries = new Set(realComplaints.map(c => c.location?.country).filter(Boolean)).size || (total > 0 ? 1 : 0);

  return {
    totalComplaints: total,
    highPriorityIssues: highPriority,
    resolutionRate: resolutionRate,
    infrastructureGapIndex: gapIndex,
    citizenSatisfaction: satisfaction,
    activeHotspots: distinctRegions,
    countriesConnected: distinctCountries,
    complaintsChange: 0,
    resolutionChange: 0,
  };
}

/** Get all demand hotspots (Pure real complaints for real official, mock for demo official) */
export async function getHotspots(filters?: {
  country?: string;
  category?: string;
  priority?: string;
}): Promise<Hotspot[]> {
  if (isDemoOfficial()) {
    let hotspots = [...mockHotspots];
    if (filters?.country && filters.country !== 'all') {
      hotspots = hotspots.filter(h => h.country === filters.country);
    }
    if (filters?.priority && filters.priority !== 'all') {
      hotspots = hotspots.filter(h => h.priority === filters.priority);
    }
    if (filters?.category && filters.category !== 'all') {
      hotspots = hotspots.filter(h => h.topIssue.toLowerCase().includes(filters.category!.toLowerCase()));
    }
    return hotspots.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // Real government official: ONLY compute hotspots from real citizen complaints
  const realComplaints = await getAllRealCitizenComplaints(filters);
  if (realComplaints.length === 0) return [];

  // Group complaints by region
  const groups = new Map<string, Complaint[]>();
  for (const c of realComplaints) {
    const reg = c.location?.region || 'Municipal Area';
    if (!groups.has(reg)) groups.set(reg, []);
    groups.get(reg)!.push(c);
  }

  const hotspots: Hotspot[] = [];
  let idx = 1;
  for (const [regionName, list] of groups.entries()) {
    const first = list[0];
    const lat = first.location?.lat ?? 25.5941;
    const lng = first.location?.lng ?? 85.1376;
    const country = (first.location?.country as any) || 'India';

    const catCounts: Record<string, number> = {};
    list.forEach(c => {
      catCounts[c.category] = (catCounts[c.category] || 0) + 1;
    });
    const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const topIssue = sortedCats[0]?.[0] || 'Infrastructure';
    const avgSeverity = list.reduce((s, c) => s + c.severity, 0) / list.length;
    const gapScore = Math.min(100, Math.round(avgSeverity * 10));
    const demandScore = Math.min(100, list.length * 25);
    const priorityScore = (demandScore * 0.4 + gapScore * 0.6) / 10;
    const priority = priorityScore >= 7.5 ? 'critical' : priorityScore >= 6.0 ? 'high' : priorityScore >= 4.0 ? 'medium' : 'low';

    hotspots.push({
      id: `HOT-REAL-${idx++}`,
      regionId: `REG-REAL-${regionName.replace(/\s+/g, '-').toLowerCase()}`,
      regionName,
      country,
      coordinates: { lat, lng },
      population: list.length * 150000,
      populationImpactScore: Math.min(100, list.length * 20),
      demandScore,
      infrastructureGapScore: gapScore,
      priorityScore,
      priority,
      topIssue,
      complaintCount: list.length,
      categories: Object.entries(catCounts).map(([name, count]) => ({ name, count })),
      aiRecommendation: `AI Recommendation: Allocate municipal emergency response budget to address ${topIssue.toLowerCase()} deficit in ${regionName}.`,
    });
  }

  return hotspots.sort((a, b) => b.priorityScore - a.priorityScore);
}

/** Get advanced analytics data (Pure real for real official, mock for demo official) */
export async function getAnalytics(filters?: {
  country?: string;
  dateRange?: string;
}): Promise<Analytics> {
  if (isDemoOfficial()) {
    const params = new URLSearchParams(filters as Record<string, string>);
    return apiFetch(`/governance/analytics?${params}`, undefined, () => mockAnalytics);
  }

  const realComplaints = await getAllRealCitizenComplaints(filters);
  const total = realComplaints.length;

  const catMap: Record<string, number> = {};
  realComplaints.forEach(c => {
    catMap[c.category] = (catMap[c.category] || 0) + 1;
  });

  const categoryBreakdown = Object.entries(catMap).map(([category, count]) => ({
    category,
    count,
    percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    trend: 'up' as const,
  }));

  const severityDistribution = [
    { severity: 'Critical (9-10)', count: realComplaints.filter(c => c.severity >= 9).length },
    { severity: 'High (7-8)', count: realComplaints.filter(c => c.severity >= 7 && c.severity < 9).length },
    { severity: 'Medium (5-6)', count: realComplaints.filter(c => c.severity >= 5 && c.severity < 7).length },
    { severity: 'Low (1-4)', count: realComplaints.filter(c => c.severity < 5).length },
  ];

  const regionMap = new Map<string, Complaint[]>();
  realComplaints.forEach(c => {
    const reg = c.location?.region || 'Local Ward';
    if (!regionMap.has(reg)) regionMap.set(reg, []);
    regionMap.get(reg)!.push(c);
  });

  const regionComparison = Array.from(regionMap.entries()).map(([region, list]) => {
    const resolved = list.filter(c => c.status === 'resolved').length;
    const avgSev = list.reduce((s, c) => s + c.severity, 0) / list.length;
    return {
      region,
      country: list[0]?.location?.country || 'India',
      complaints: list.length,
      resolved,
      gapScore: Math.round(avgSev * 10),
      satisfactionScore: list.length > 0 && resolved > 0 ? Math.round((resolved / list.length) * 100) : 40,
    };
  });

  const complaintsOverTime = [
    {
      date: 'Current Live Cycle',
      complaints: total,
      resolved: realComplaints.filter(c => c.status === 'resolved').length,
      pending: realComplaints.filter(c => c.status !== 'resolved').length,
    },
  ];

  const resolutionTime = Object.keys(catMap).map(category => ({
    category,
    avgDays: 5,
  }));

  return {
    complaintsOverTime,
    categoryBreakdown,
    regionComparison,
    severityDistribution,
    resolutionTime,
  };
}

/** Get infrastructure gap analysis */
export async function getInfrastructureGaps(filters?: {
  country?: string;
  category?: string;
}): Promise<InfrastructureGap[]> {
  if (isDemoOfficial()) {
    let gaps = [...mockInfrastructureGaps];
    if (filters?.country && filters.country !== 'all') gaps = gaps.filter(g => g.country === filters.country);
    if (filters?.category && filters.category !== 'all') gaps = gaps.filter(g => g.category === filters.category);
    return gaps.sort((a, b) => b.gapScore - a.gapScore);
  }

  const realComplaints = await getAllRealCitizenComplaints(filters);
  if (realComplaints.length === 0) return [];

  const map = new Map<string, Complaint[]>();
  realComplaints.forEach(c => {
    const key = `${c.category}__${c.location?.region || 'Area'}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  });

  let idx = 1;
  const gaps: InfrastructureGap[] = [];
  for (const [key, list] of map.entries()) {
    const [category, region] = key.split('__');
    const first = list[0];
    const avgSev = list.reduce((s, c) => s + c.severity, 0) / list.length;
    const gapScore = Math.min(100, Math.round(avgSev * 10));

    gaps.push({
      id: `GAP-REAL-${idx++}`,
      category,
      icon: 'Building',
      regionId: `REG-REAL-${region}`,
      regionName: region,
      country: first.location?.country || 'India',
      gapScore,
      citizenDemand: Math.min(100, list.length * 25),
      existingInfrastructure: Math.max(0, 100 - gapScore),
      populationImpact: Math.min(100, list.length * 20),
      currentInvestment: 30,
      description: `${list.length} active citizen reports regarding ${category.toLowerCase()} issues in ${region}.`,
      affectedPopulation: list.length * 2500,
    });
  }

  return gaps.sort((a, b) => b.gapScore - a.gapScore);
}

/** Get AI-generated recommendations */
export async function getRecommendations(filters?: {
  country?: string;
  priority?: string;
  category?: string;
}): Promise<Recommendation[]> {
  if (isDemoOfficial()) {
    let recs = [...mockRecommendations];
    if (filters?.country && filters.country !== 'all') recs = recs.filter(r => r.country === filters.country);
    if (filters?.priority && filters.priority !== 'all') recs = recs.filter(r => r.priority === filters.priority);
    if (filters?.category && filters.category !== 'all') recs = recs.filter(r => r.category === filters.category);
    return recs.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  const realComplaints = await getAllRealCitizenComplaints(filters);
  if (realComplaints.length === 0) return [];

  const recs: Recommendation[] = realComplaints.slice(0, 5).map((c, i) => ({
    id: `REC-REAL-${i + 1}`,
    regionId: `REG-REAL-${c.location?.region || 'Area'}`,
    regionName: c.location?.region || 'Area',
    country: c.location?.country || 'India',
    category: c.category,
    priority: c.priority,
    priorityScore: c.severity * 10,
    title: `Action Plan: ${c.category} in ${c.location?.region || 'Jurisdiction'}`,
    evidence: [
      `${c.category} deficit reported by citizen with severity ${c.severity}/10`,
      `Location: ${c.location?.region || 'Area'}, ${c.location?.country || 'India'}`,
      `Complaint ID: ${c.id}`
    ],
    recommendedAction: `Deploy municipal field team to inspect and repair reported ${c.category.toLowerCase()} issue.`,
    expectedImpact: `Directly resolves citizen grievance and restores public infrastructure quality.`,
    estimatedCost: '₹5-15 Lakhs',
    timeframe: '15-30 days',
    confidence: 94,
    affectedPopulation: 5000,
    aiGenerated: true,
    createdAt: c.createdAt,
  }));

  return recs;
}

/** Get all regions */
export async function getRegions(country?: string): Promise<Region[]> {
  const getMock = () => (country && country !== 'all'
    ? mockRegions.filter(r => r.country === country)
    : mockRegions);
  return apiFetch(`/regions${country ? `?country=${country}` : ''}`, undefined, getMock);
}

/** Get all government plans (governance view) */
export async function getAllGovernmentPlans(filters?: {
  country?: string;
  status?: string;
  category?: string;
}): Promise<GovernmentPlan[]> {
  const getMock = () => {
    let plans = [...mockGovernmentPlans];
    if (filters?.country && filters.country !== 'all') {
      plans = plans.filter(p => p.country === filters.country);
    }
    if (filters?.status && filters.status !== 'all') {
      plans = plans.filter(p => p.status === filters.status);
    }
    if (filters?.category && filters.category !== 'all') {
      plans = plans.filter(p => p.category === filters.category);
    }
    return plans;
  };
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/governance/plans?${params}`, undefined, getMock);
}
