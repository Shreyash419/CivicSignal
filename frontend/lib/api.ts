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

// ── Citizen API ───────────────────────────────────────────────

/** Submit a new citizen complaint */
export async function submitComplaint(data: ComplaintSubmission): Promise<{ id: string }> {
  const complaintId = `CMP-2024-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const now = new Date().toISOString();

  const newComplaint: Complaint = {
    id: complaintId,
    citizenId: 'CTZ-001',
    text: data.text,
    originalLanguage: data.language || 'English',
    translatedText: data.text,
    category: data.category || 'General',
    severity: 7,
    priority: 'high',
    status: 'submitted',
    location: {
      lat: data.location?.lat ?? 25.5941,
      lng: data.location?.lng ?? 85.1376,
      region: data.location?.region || 'Patna',
      district: data.location?.manualAddress || data.location?.region || 'Patna',
      country: data.location?.country || 'India',
    },
    mediaUrls: data.mediaUrls || [],
    aiClassification: `${data.category || 'Civic'} Issue — Auto Prioritized`,
    aiConfidence: 0.92,
    createdAt: now,
    updatedAt: now,
    timeline: [
      { stage: 'submitted', label: 'Submitted', completedAt: now, completed: true },
      { stage: 'ai_classified', label: 'AI Classified', completedAt: now, note: `${data.category || 'Civic'} Issue — High Priority`, completed: true },
      { stage: 'under_review', label: 'Under Review', completed: false },
      { stage: 'assigned', label: 'Assigned', completed: false },
      { stage: 'in_progress', label: 'In Progress', completed: false },
      { stage: 'resolved', label: 'Resolved', completed: false },
    ],
  };

  // Always save locally so citizen sees it immediately
  saveStoredComplaint(newComplaint);
  mockComplaints.unshift(newComplaint);

  try {
    const res = await apiFetch<{ id: string }>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    }, () => ({ id: complaintId }));
    return res;
  } catch {
    await delay(300);
    return { id: complaintId };
  }
}

/** Get all complaints for the logged-in citizen */
export async function getMyComplaints(filters?: {
  status?: string;
  category?: string;
}): Promise<Complaint[]> {
  const localList = getStoredComplaints();
  // Merge local complaints with mock complaints, avoiding duplicates
  const ids = new Set(localList.map(c => c.id));
  const combined = [...localList, ...mockComplaints.filter(c => c.citizenId === 'CTZ-001' && !ids.has(c.id))];

  const getMock = () => {
    let list = combined;
    if (filters?.status && filters.status !== 'all') {
      list = list.filter(c => c.status === filters.status);
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter(c => c.category === filters.category);
    }
    return list;
  };

  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/complaints/my?${params}`, undefined, getMock);
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

/** Get citizen dashboard summary */
export async function getCitizenDashboard(): Promise<CitizenDashboard> {
  const localList = getStoredComplaints();
  const totalCount = mockCitizenDashboard.myComplaints + localList.length;

  const getMock = () => ({
    ...mockCitizenDashboard,
    myComplaints: totalCount,
    recentComplaints: [...localList, ...mockCitizenDashboard.recentComplaints].slice(0, 5),
  });

  return apiFetch('/citizen/dashboard', undefined, getMock);
}

// ── Governance API ────────────────────────────────────────────

/** Get governance overview KPIs */
export async function getDashboardOverview(filters?: {
  country?: string;
  region?: string;
  dateRange?: string;
}): Promise<DashboardOverview> {
  const getMock = () => mockDashboardOverview;
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/governance/overview?${params}`, undefined, getMock);
}

/** Get all demand hotspots with optional filters — merged with user-registered complaints */
export async function getHotspots(filters?: {
  country?: string;
  category?: string;
  priority?: string;
}): Promise<Hotspot[]> {
  const getMock = () => {
    // Start with base hotspots, then overlay user complaints
    const userComplaints = getStoredComplaints();
    let hotspots = mergeComplaintsIntoHotspots([...mockHotspots], userComplaints);

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
  };
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/governance/hotspots?${params}`, undefined, getMock);
}

/** Get advanced analytics data */
export async function getAnalytics(filters?: {
  country?: string;
  dateRange?: string;
}): Promise<Analytics> {
  const getMock = () => mockAnalytics;
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/governance/analytics?${params}`, undefined, getMock);
}

/** Get infrastructure gap analysis */
export async function getInfrastructureGaps(filters?: {
  country?: string;
  category?: string;
}): Promise<InfrastructureGap[]> {
  const getMock = () => {
    let gaps = [...mockInfrastructureGaps];
    if (filters?.country && filters.country !== 'all') {
      gaps = gaps.filter(g => g.country === filters.country);
    }
    if (filters?.category && filters.category !== 'all') {
      gaps = gaps.filter(g => g.category === filters.category);
    }
    return gaps.sort((a, b) => b.gapScore - a.gapScore);
  };
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/governance/infrastructure?${params}`, undefined, getMock);
}

/** Get AI-generated recommendations */
export async function getRecommendations(filters?: {
  country?: string;
  priority?: string;
  category?: string;
}): Promise<Recommendation[]> {
  const getMock = () => {
    let recs = [...mockRecommendations];
    if (filters?.country && filters.country !== 'all') {
      recs = recs.filter(r => r.country === filters.country);
    }
    if (filters?.priority && filters.priority !== 'all') {
      recs = recs.filter(r => r.priority === filters.priority);
    }
    if (filters?.category && filters.category !== 'all') {
      recs = recs.filter(r => r.category === filters.category);
    }
    return recs.sort((a, b) => b.priorityScore - a.priorityScore);
  };
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/governance/recommendations?${params}`, undefined, getMock);
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
