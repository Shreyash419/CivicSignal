// ============================================================
// BRICS AI Governance Platform — API Abstraction Layer
// 
// All backend communication goes through this file.
// Replace mockData imports with real fetch calls when backend is ready.
// Backend base URL is controlled via NEXT_PUBLIC_API_URL env var.
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
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true' ? true : false; // Live by default, fallback if offline

// ── Helper ────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
    const json: ApiResponse<T> = await res.json();
    return json.data;
  } catch (err) {
    console.warn(`[API] Fetch failed for ${path}, using mock fallback:`, err);
    throw err;
  }
}

function delay(ms = 400): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Citizen API ───────────────────────────────────────────────

/** Submit a new citizen complaint */
export async function submitComplaint(data: ComplaintSubmission): Promise<{ id: string }> {
  if (USE_MOCK) {
    await delay(800);
    const id = `CMP-2024-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    return { id };
  }
  return apiFetch('/complaints', { method: 'POST', body: JSON.stringify(data) });
}

/** Get all complaints for the logged-in citizen */
export async function getMyComplaints(filters?: {
  status?: string;
  category?: string;
}): Promise<Complaint[]> {
  if (USE_MOCK) {
    await delay(400);
    let complaints = mockComplaints.filter(c => c.citizenId === 'CTZ-001');
    if (filters?.status && filters.status !== 'all') {
      complaints = complaints.filter(c => c.status === filters.status);
    }
    if (filters?.category && filters.category !== 'all') {
      complaints = complaints.filter(c => c.category === filters.category);
    }
    return complaints;
  }
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/complaints/my?${params}`);
}

/** Get a single complaint by ID */
export async function getComplaint(id: string): Promise<Complaint | null> {
  if (USE_MOCK) {
    await delay(300);
    return mockComplaints.find(c => c.id === id) ?? null;
  }
  return apiFetch(`/complaints/${id}`);
}

/** Get area data for the citizen's region */
export async function getAreaData(regionId?: string): Promise<AreaData> {
  if (USE_MOCK) {
    await delay(400);
    return mockAreaData;
  }
  return apiFetch(`/areas/${regionId ?? 'my'}`);
}

/** Get nearby complaints (anonymised) */
export async function getAreaComplaints(regionId?: string): Promise<Complaint[]> {
  if (USE_MOCK) {
    await delay(350);
    return mockAreaData.nearbyComplaints;
  }
  return apiFetch(`/areas/${regionId ?? 'my'}/complaints`);
}

/** Get government plans for the citizen's area */
export async function getGovernmentPlans(regionId?: string): Promise<GovernmentPlan[]> {
  if (USE_MOCK) {
    await delay(400);
    return regionId
      ? mockGovernmentPlans.filter(p => p.regionId === regionId)
      : mockGovernmentPlans;
  }
  return apiFetch(`/plans?regionId=${regionId ?? ''}`);
}

/** Get citizen dashboard summary */
export async function getCitizenDashboard(): Promise<CitizenDashboard> {
  if (USE_MOCK) {
    await delay(400);
    return mockCitizenDashboard;
  }
  return apiFetch('/citizen/dashboard');
}

// ── Governance API ────────────────────────────────────────────

/** Get governance overview KPIs */
export async function getDashboardOverview(filters?: {
  country?: string;
  region?: string;
  dateRange?: string;
}): Promise<DashboardOverview> {
  if (USE_MOCK) {
    await delay(500);
    return mockDashboardOverview;
  }
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/governance/overview?${params}`);
}

/** Get all demand hotspots with optional filters */
export async function getHotspots(filters?: {
  country?: string;
  category?: string;
  priority?: string;
}): Promise<Hotspot[]> {
  if (USE_MOCK) {
    await delay(400);
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
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/governance/hotspots?${params}`);
}

/** Get advanced analytics data */
export async function getAnalytics(filters?: {
  country?: string;
  dateRange?: string;
}): Promise<Analytics> {
  if (USE_MOCK) {
    await delay(500);
    return mockAnalytics;
  }
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/governance/analytics?${params}`);
}

/** Get infrastructure gap analysis */
export async function getInfrastructureGaps(filters?: {
  country?: string;
  category?: string;
}): Promise<InfrastructureGap[]> {
  if (USE_MOCK) {
    await delay(400);
    let gaps = [...mockInfrastructureGaps];
    if (filters?.country && filters.country !== 'all') {
      gaps = gaps.filter(g => g.country === filters.country);
    }
    if (filters?.category && filters.category !== 'all') {
      gaps = gaps.filter(g => g.category === filters.category);
    }
    return gaps.sort((a, b) => b.gapScore - a.gapScore);
  }
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/governance/infrastructure?${params}`);
}

/** Get AI-generated recommendations */
export async function getRecommendations(filters?: {
  country?: string;
  priority?: string;
  category?: string;
}): Promise<Recommendation[]> {
  if (USE_MOCK) {
    await delay(500);
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
  }
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/governance/recommendations?${params}`);
}

/** Get all regions */
export async function getRegions(country?: string): Promise<Region[]> {
  if (USE_MOCK) {
    await delay(300);
    return country && country !== 'all'
      ? mockRegions.filter(r => r.country === country)
      : mockRegions;
  }
  return apiFetch(`/regions${country ? `?country=${country}` : ''}`);
}

/** Get all government plans (governance view) */
export async function getAllGovernmentPlans(filters?: {
  country?: string;
  status?: string;
  category?: string;
}): Promise<GovernmentPlan[]> {
  if (USE_MOCK) {
    await delay(400);
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
  }
  const params = new URLSearchParams(filters as Record<string, string>);
  return apiFetch(`/governance/plans?${params}`);
}
