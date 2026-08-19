import * as admin from 'firebase-admin';
import {
  Complaint,
  Region,
  Hotspot,
  InfrastructureGap,
  Recommendation,
  GovernmentPlan,
  Analytics,
  DashboardOverview,
  CitizenDashboard,
  AreaData,
} from '../models/types';
import {
  initialComplaints,
  initialRegions,
  initialHotspots,
  initialInfrastructureGaps,
  initialRecommendations,
  initialGovernmentPlans,
  initialAnalytics,
  initialDashboardOverview,
} from '../seed/initialData';

// Timeout helper so calls never hang
function withTimeout<T>(promise: Promise<T>, timeoutMs = 1500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Firestore timeout')), timeoutMs);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// In-Memory fallback store for maximum reliability
class MemoryStore {
  complaints: Map<string, Complaint> = new Map();
  regions: Map<string, Region> = new Map();
  hotspots: Map<string, Hotspot> = new Map();
  gaps: Map<string, InfrastructureGap> = new Map();
  recommendations: Map<string, Recommendation> = new Map();
  plans: Map<string, GovernmentPlan> = new Map();

  constructor() {
    this.seed();
  }

  seed() {
    initialComplaints.forEach((c) => this.complaints.set(c.id, { ...c }));
    initialRegions.forEach((r) => this.regions.set(r.id, { ...r }));
    initialHotspots.forEach((h) => this.hotspots.set(h.id, { ...h }));
    initialInfrastructureGaps.forEach((g) => this.gaps.set(g.id, { ...g }));
    initialRecommendations.forEach((r) => this.recommendations.set(r.id, { ...r }));
    initialGovernmentPlans.forEach((p) => this.plans.set(p.id, { ...p }));
  }
}

const memoryStore = new MemoryStore();
let db: admin.firestore.Firestore | null = null;
let isFirestoreAvailable = false;
let hasSeededFirestore = false;

// Only initialize live Firestore if emulator or GCP project is configured
if (process.env.FIRESTORE_EMULATOR_HOST || process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: process.env.GCLOUD_PROJECT || 'civicsignal-app',
      });
    }
    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
    isFirestoreAvailable = true;
  } catch (error) {
    console.warn('Firebase Admin initialized in local memory mode:', error);
  }
}

export async function ensureFirestoreSeeded(): Promise<void> {
  if (!db || !isFirestoreAvailable || hasSeededFirestore) return;
  try {
    const snap = await withTimeout(db.collection('complaints').limit(1).get(), 1000);
    if (snap.empty) {
      console.log('⚡ Seeding initial data into Firestore...');
      const batch = db.batch();
      
      initialComplaints.forEach((c) => {
        const docRef = db!.collection('complaints').doc(c.id);
        batch.set(docRef, c);
      });

      initialRegions.forEach((r) => {
        const docRef = db!.collection('regions').doc(r.id);
        batch.set(docRef, r);
      });

      initialHotspots.forEach((h) => {
        const docRef = db!.collection('hotspots').doc(h.id);
        batch.set(docRef, h);
      });

      initialInfrastructureGaps.forEach((g) => {
        const docRef = db!.collection('infrastructure_gaps').doc(g.id);
        batch.set(docRef, g);
      });

      initialRecommendations.forEach((r) => {
        const docRef = db!.collection('recommendations').doc(r.id);
        batch.set(docRef, r);
      });

      initialGovernmentPlans.forEach((p) => {
        const docRef = db!.collection('government_plans').doc(p.id);
        batch.set(docRef, p);
      });

      await batch.commit();
      console.log('✅ Firestore seeded successfully!');
    }
    hasSeededFirestore = true;
  } catch (err) {
    console.warn('Firestore not reachable, using fast in-memory store.');
    isFirestoreAvailable = false;
  }
}

// ── Database Operations ───────────────────────────────────────────

export const database = {
  // ── Complaints
  async getComplaints(filters?: { status?: string; category?: string; citizenId?: string }): Promise<Complaint[]> {
    if (db && isFirestoreAvailable) {
      try {
        let query: admin.firestore.Query = db.collection('complaints');
        if (filters?.citizenId) {
          query = query.where('citizenId', '==', filters.citizenId);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.where('status', '==', filters.status);
        }
        if (filters?.category && filters.category !== 'all') {
          query = query.where('category', '==', filters.category);
        }
        const snap = await withTimeout(query.get());
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Complaint);
        }
      } catch (err) {
        isFirestoreAvailable = false;
      }
    }

    // Memory store
    let list = Array.from(memoryStore.complaints.values());
    if (filters?.citizenId) {
      list = list.filter((c) => c.citizenId === filters.citizenId);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((c) => c.status === filters.status);
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter((c) => c.category === filters.category);
    }
    return list;
  },

  async getComplaintById(id: string): Promise<Complaint | null> {
    if (db && isFirestoreAvailable) {
      try {
        const doc = await withTimeout(db.collection('complaints').doc(id).get());
        if (doc.exists) {
          return doc.data() as Complaint;
        }
      } catch (err) {
        isFirestoreAvailable = false;
      }
    }
    return memoryStore.complaints.get(id) || null;
  },

  async saveComplaint(complaint: Complaint): Promise<Complaint> {
    if (db && isFirestoreAvailable) {
      try {
        await withTimeout(db.collection('complaints').doc(complaint.id).set(complaint));
      } catch (err) {
        isFirestoreAvailable = false;
      }
    }
    memoryStore.complaints.set(complaint.id, complaint);

    // Real-time Hotspot update or creation
    try {
      const regionName = complaint.location.region || 'Patna';
      const cLat = complaint.location.lat ?? 25.5941;
      const cLng = complaint.location.lng ?? 85.1376;

      let existingHotspot = Array.from(memoryStore.hotspots.values()).find((h) => {
        if (h.regionName.toLowerCase() === regionName.toLowerCase()) return true;
        // Check proximity (within ~30km)
        const dLat = Math.abs(h.coordinates.lat - cLat);
        const dLng = Math.abs(h.coordinates.lng - cLng);
        return dLat < 0.35 && dLng < 0.35;
      });

      if (existingHotspot) {
        existingHotspot.complaintCount += 1;
        const cat = existingHotspot.categories.find((c) => c.name.toLowerCase() === complaint.category.toLowerCase());
        if (cat) {
          cat.count += 1;
        } else {
          existingHotspot.categories.push({ name: complaint.category, count: 1 });
        }
        if (complaint.priority === 'critical') {
          existingHotspot.priority = 'critical';
          existingHotspot.priorityScore = Math.min(99.0, existingHotspot.priorityScore + 1.5);
        }
        memoryStore.hotspots.set(existingHotspot.id, existingHotspot);
      } else {
        const newHotspotId = `HOT-${String(memoryStore.hotspots.size + 1).padStart(3, '0')}`;
        const newHotspot: Hotspot = {
          id: newHotspotId,
          regionId: `REG-${newHotspotId}`,
          regionName: regionName,
          country: complaint.location.country || 'India',
          coordinates: {
            lat: cLat,
            lng: cLng,
          },
          population: 4500000,
          complaintCount: 1,
          topIssue: complaint.category,
          infrastructureGapScore: 78,
          demandScore: 82,
          populationImpactScore: 75,
          priorityScore: complaint.priority === 'critical' ? 88.5 : complaint.priority === 'high' ? 76.0 : 55.0,
          priority: complaint.priority,
          aiRecommendation: `Emergency infrastructure inspection and service deployment recommended for ${complaint.category} in ${regionName}.`,
          categories: [{ name: complaint.category, count: 1 }],
        };
        memoryStore.hotspots.set(newHotspotId, newHotspot);
      }
    } catch (e) {
      console.warn('Hotspot real-time update error:', e);
    }

    return complaint;
  },

  async updateComplaintStatus(id: string, status: Complaint['status']): Promise<Complaint | null> {
    const existing = await this.getComplaintById(id);
    if (!existing) return null;

    const updated: Complaint = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
      resolvedAt: status === 'resolved' ? new Date().toISOString() : existing.resolvedAt,
      timeline: [
        ...existing.timeline,
        {
          stage: status,
          label: status.replace('_', ' ').toUpperCase(),
          completedAt: new Date().toISOString(),
          completed: true,
        },
      ],
    };

    return this.saveComplaint(updated);
  },

  // ── Regions
  async getRegions(country?: string): Promise<Region[]> {
    if (db && isFirestoreAvailable) {
      try {
        let query: admin.firestore.Query = db.collection('regions');
        if (country && country !== 'all') {
          query = query.where('country', '==', country);
        }
        const snap = await withTimeout(query.get());
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Region);
        }
      } catch (err) {
        isFirestoreAvailable = false;
      }
    }
    let list = Array.from(memoryStore.regions.values());
    if (country && country !== 'all') {
      list = list.filter((r) => r.country === country);
    }
    return list;
  },

  async getRegionById(id: string): Promise<Region | null> {
    if (db && isFirestoreAvailable) {
      try {
        const doc = await withTimeout(db.collection('regions').doc(id).get());
        if (doc.exists) return doc.data() as Region;
      } catch (err) {
        isFirestoreAvailable = false;
      }
    }
    return memoryStore.regions.get(id) || null;
  },

  // ── Hotspots
  async getHotspots(filters?: { country?: string; priority?: string; category?: string }): Promise<Hotspot[]> {
    const allComplaints = Array.from(memoryStore.complaints.values());
    
    let list = Array.from(memoryStore.hotspots.values()).map((h) => {
      // Find complaints corresponding to this hotspot region
      const regionComplaints = allComplaints.filter(
        (c) => c.location.region.toLowerCase().includes(h.regionName.toLowerCase()) ||
               h.regionName.toLowerCase().includes(c.location.region.toLowerCase())
      );
      
      const dynamicCount = Math.max(h.complaintCount, regionComplaints.length > 0 ? h.complaintCount + regionComplaints.length : h.complaintCount);
      return {
        ...h,
        complaintCount: dynamicCount,
      };
    });

    if (filters?.country && filters.country !== 'all') {
      list = list.filter((h) => h.country === filters.country);
    }
    if (filters?.priority && filters.priority !== 'all') {
      list = list.filter((h) => h.priority === filters.priority);
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter((h) => h.topIssue.toLowerCase().includes(filters.category!.toLowerCase()));
    }
    return list.sort((a, b) => b.priorityScore - a.priorityScore);
  },

  // ── Infrastructure Gaps
  async getInfrastructureGaps(filters?: { country?: string; category?: string }): Promise<InfrastructureGap[]> {
    if (db && isFirestoreAvailable) {
      try {
        let query: admin.firestore.Query = db.collection('infrastructure_gaps');
        if (filters?.country && filters.country !== 'all') {
          query = query.where('country', '==', filters.country);
        }
        if (filters?.category && filters.category !== 'all') {
          query = query.where('category', '==', filters.category);
        }
        const snap = await withTimeout(query.get());
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as InfrastructureGap).sort((a, b) => b.gapScore - a.gapScore);
        }
      } catch (err) {
        isFirestoreAvailable = false;
      }
    }
    let list = Array.from(memoryStore.gaps.values());
    if (filters?.country && filters.country !== 'all') {
      list = list.filter((g) => g.country === filters.country);
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter((g) => g.category === filters.category);
    }
    return list.sort((a, b) => b.gapScore - a.gapScore);
  },

  // ── Recommendations
  async getRecommendations(filters?: { country?: string; priority?: string; category?: string }): Promise<Recommendation[]> {
    if (db && isFirestoreAvailable) {
      try {
        let query: admin.firestore.Query = db.collection('recommendations');
        if (filters?.country && filters.country !== 'all') {
          query = query.where('country', '==', filters.country);
        }
        if (filters?.priority && filters.priority !== 'all') {
          query = query.where('priority', '==', filters.priority);
        }
        if (filters?.category && filters.category !== 'all') {
          query = query.where('category', '==', filters.category);
        }
        const snap = await withTimeout(query.get());
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Recommendation).sort((a, b) => b.priorityScore - a.priorityScore);
        }
      } catch (err) {
        isFirestoreAvailable = false;
      }
    }
    let list = Array.from(memoryStore.recommendations.values());
    if (filters?.country && filters.country !== 'all') {
      list = list.filter((r) => r.country === filters.country);
    }
    if (filters?.priority && filters.priority !== 'all') {
      list = list.filter((r) => r.priority === filters.priority);
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter((r) => r.category === filters.category);
    }
    return list.sort((a, b) => b.priorityScore - a.priorityScore);
  },

  // ── Government Plans
  async getGovernmentPlans(filters?: { country?: string; status?: string; category?: string; regionId?: string }): Promise<GovernmentPlan[]> {
    if (db && isFirestoreAvailable) {
      try {
        let query: admin.firestore.Query = db.collection('government_plans');
        if (filters?.country && filters.country !== 'all') {
          query = query.where('country', '==', filters.country);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.where('status', '==', filters.status);
        }
        if (filters?.category && filters.category !== 'all') {
          query = query.where('category', '==', filters.category);
        }
        if (filters?.regionId) {
          query = query.where('regionId', '==', filters.regionId);
        }
        const snap = await withTimeout(query.get());
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as GovernmentPlan);
        }
      } catch (err) {
        isFirestoreAvailable = false;
      }
    }
    let list = Array.from(memoryStore.plans.values());
    if (filters?.country && filters.country !== 'all') {
      list = list.filter((p) => p.country === filters.country);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((p) => p.status === filters.status);
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter((p) => p.category === filters.category);
    }
    if (filters?.regionId) {
      list = list.filter((p) => p.regionId === filters.regionId);
    }
    return list;
  },

  // ── Analytics & Overview
  async getDashboardOverview(filters?: { country?: string; region?: string; dateRange?: string }): Promise<DashboardOverview> {
    return initialDashboardOverview;
  },

  async getAnalytics(filters?: { country?: string; dateRange?: string }): Promise<Analytics> {
    return initialAnalytics;
  },

  async getCitizenDashboard(citizenId: string = 'CTZ-001'): Promise<CitizenDashboard> {
    const complaints = await this.getComplaints({ citizenId });
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    const inProgress = complaints.filter((c) => c.status === 'in_progress').length;

    return {
      citizenId,
      name: 'Rajesh Kumar',
      region: 'Patna',
      country: 'India',
      myComplaints: complaints.length,
      resolved,
      inProgress,
      areaIssues: 420,
      recentComplaints: complaints,
      areaOverview: {
        topIssue: 'Healthcare',
        totalComplaints: 420,
        infrastructureGapScore: 91,
        satisfactionScore: 31,
      },
    };
  },

  async getAreaData(regionId?: string): Promise<AreaData> {
    const regions = await this.getRegions();
    const targetRegion = regions.find((r) => r.id === regionId) || regions[0];
    const plans = await this.getGovernmentPlans({ regionId: targetRegion?.id });
    const gaps = await this.getInfrastructureGaps();

    return {
      region: targetRegion,
      issueBreakdown: [
        { category: 'Healthcare', percentage: 42, count: 180 },
        { category: 'Roads', percentage: 31, count: 130 },
        { category: 'Water', percentage: 18, count: 78 },
        { category: 'Education', percentage: 9, count: 32 },
      ],
      nearbyComplaints: [
        {
          id: 'NEAR-001',
          citizenId: 'anon',
          text: 'Healthcare centre closed — no medicines available',
          category: 'Healthcare',
          severity: 8,
          priority: 'high',
          status: 'submitted',
          location: { lat: 25.596, lng: 85.14, region: targetRegion?.name || 'Patna', country: targetRegion?.country || 'India' },
          createdAt: '2024-11-17T09:00:00Z',
          updatedAt: '2024-11-17T09:00:00Z',
          timeline: [],
        },
        {
          id: 'NEAR-002',
          citizenId: 'anon',
          text: 'Main road has 20+ potholes causing accidents',
          category: 'Roads & Transport',
          severity: 7,
          priority: 'high',
          status: 'under_review',
          location: { lat: 25.59, lng: 85.135, region: targetRegion?.name || 'Patna', country: targetRegion?.country || 'India' },
          createdAt: '2024-11-15T14:00:00Z',
          updatedAt: '2024-11-16T10:00:00Z',
          timeline: [],
        },
      ],
      infrastructureGaps: gaps.slice(0, 4),
      governmentPlans: plans,
    };
  },
};
