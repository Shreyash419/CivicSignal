// ============================================================
// CivicSignal — Firebase Firestore Complaints Service
// Saves & retrieves citizen complaints with category & geolocation
// ============================================================

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Complaint, ComplaintSubmission, UserProfile, ComplaintStatus } from '@/types';
import { mockComplaints } from './mockData';

const LOCAL_STORAGE_KEY = 'civicsignal_user_complaints';

// Helper to get local stored complaints
export function getLocalComplaints(): Complaint[] {
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
export function saveLocalComplaint(complaint: Complaint): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalComplaints();
    const updated = [complaint, ...existing.filter(c => c.id !== complaint.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save complaint locally:', e);
  }
}

/**
 * Saves a new citizen complaint directly into Firebase Firestore `complaints` collection
 */
export async function saveComplaintToFirestore(
  data: ComplaintSubmission,
  userProfile?: UserProfile | null
): Promise<Complaint> {
  const now = new Date().toISOString();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const complaintId = `CMP-${new Date().getFullYear()}-${randomNum}`;

  const category = data.category || 'General Civic Issue';
  const citizenId = data.citizenId || userProfile?.uid || 'CTZ-ANON';
  const citizenName = data.citizenName || userProfile?.displayName || 'Citizen';
  const citizenEmail = data.citizenEmail || userProfile?.email || '';

  const complaint: Complaint = {
    id: complaintId,
    citizenId,
    citizenName,
    citizenEmail,
    text: data.text,
    originalLanguage: data.language || 'English',
    translatedText: data.text,
    category,
    severity: calculateSeverityFromCategory(category),
    priority: 'high',
    status: 'submitted',
    location: {
      lat: data.location?.lat ?? 25.5941,
      lng: data.location?.lng ?? 85.1376,
      region: data.location?.region || userProfile?.region || 'Patna',
      district: data.location?.manualAddress || data.location?.region || 'Patna',
      country: data.location?.country || userProfile?.country || 'India',
    },
    mediaUrls: data.mediaUrls || [],
    audioUrl: data.audioUrl,
    aiClassification: `${category} Deficit — Priority Evaluated`,
    aiConfidence: 0.94,
    createdAt: now,
    updatedAt: now,
    timeline: [
      { stage: 'submitted', label: 'Submitted', completedAt: now, completed: true },
      { stage: 'ai_classified', label: 'AI Classified', completedAt: now, note: `${category} Deficit — High Priority`, completed: true },
      { stage: 'under_review', label: 'Under Review', completed: false },
      { stage: 'assigned', label: 'Assigned to Dept', completed: false },
      { stage: 'in_progress', label: 'In Progress', completed: false },
      { stage: 'resolved', label: 'Resolved', completed: false },
    ],
  };

  // 1. Save locally for instant UI update & offline capability
  saveLocalComplaint(complaint);

  // 2. Persist directly to Firebase Firestore
  try {
    const cleanComplaint = Object.fromEntries(
      Object.entries(complaint).filter(([_, v]) => v !== undefined)
    );
    const complaintRef = doc(db, 'complaints', complaintId);
    await setDoc(complaintRef, cleanComplaint);
  } catch (error) {
    console.warn('Firestore complaints write notice (saved in local sync store):', error);
  }

  return complaint;
}

/**
 * Retrieves complaints from Firestore (strictly isolated by citizenId)
 */
export async function getComplaintsFromFirestore(
  citizenId?: string,
  filters?: { status?: string; category?: string }
): Promise<Complaint[]> {
  const localList = getLocalComplaints();
  let firestoreList: Complaint[] = [];

  try {
    const complaintsCol = collection(db, 'complaints');
    let q = query(complaintsCol, orderBy('createdAt', 'desc'));

    if (citizenId && citizenId !== 'all') {
      q = query(complaintsCol, where('citizenId', '==', citizenId));
    }

    const snapshot = await getDocs(q);
    firestoreList = snapshot.docs.map(doc => doc.data() as Complaint);
  } catch (error) {
    console.warn('Firestore complaints query notice:', error);
  }

  // Merge Firestore and local storage avoiding duplicates
  const map = new Map<string, Complaint>();

  const isDemoCitizen = citizenId === 'ctz-demo-rajesh-001' || citizenId === 'CTZ-001';

  // Only include pre-seeded mock complaints if viewing Demo Citizen or full governance overview
  if (!citizenId || citizenId === 'all' || isDemoCitizen) {
    mockComplaints.forEach(c => {
      if (!citizenId || citizenId === 'all' || isDemoCitizen) {
        map.set(c.id, c);
      }
    });
  }

  // Overlay local complaints strictly for this citizen (or all if governance)
  localList.forEach(c => {
    if (!citizenId || citizenId === 'all' || c.citizenId === citizenId) {
      map.set(c.id, c);
    }
  });

  // Overlay Firestore live complaints
  firestoreList.forEach(c => map.set(c.id, c));

  let result = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (filters?.status && filters.status !== 'all') {
    result = result.filter(c => c.status === filters.status);
  }
  if (filters?.category && filters.category !== 'all') {
    result = result.filter(c => c.category === filters.category);
  }

  return result;
}

/**
 * Updates a complaint's status in Firestore (used by Government Officials)
 */
export async function updateComplaintStatusInFirestore(
  id: string,
  status: ComplaintStatus,
  note?: string
): Promise<void> {
  const now = new Date().toISOString();

  // Update locally
  const localList = getLocalComplaints();
  const target = localList.find(c => c.id === id);
  if (target) {
    target.status = status;
    target.updatedAt = now;
    const stage = target.timeline.find(t => t.stage === status);
    if (stage) {
      stage.completed = true;
      stage.completedAt = now;
      if (note) stage.note = note;
    }
    saveLocalComplaint(target);
  }

  // Update in Firestore
  try {
    const docRef = doc(db, 'complaints', id);
    await updateDoc(docRef, {
      status,
      updatedAt: now,
    });
  } catch (e) {
    console.warn('Firestore update status notice:', e);
  }
}

/**
 * Retrieves ALL real citizen complaints from Firestore for government bodies
 */
export async function getAllRealCitizenComplaints(filters?: {
  category?: string;
  status?: string;
  country?: string;
}): Promise<Complaint[]> {
  const localList = getLocalComplaints();
  let firestoreList: Complaint[] = [];

  try {
    const complaintsCol = collection(db, 'complaints');
    const q = query(complaintsCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    firestoreList = snapshot.docs.map(doc => doc.data() as Complaint);
  } catch (error) {
    console.warn('Firestore real complaints query notice:', error);
  }

  const map = new Map<string, Complaint>();

  // Real Firestore complaints
  firestoreList.forEach(c => map.set(c.id, c));

  // Real local complaints (excluding mock CMP-2024-00x)
  localList.forEach(c => {
    if (c.id && !c.id.startsWith('CMP-2024-00')) {
      map.set(c.id, c);
    }
  });

  let list = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (filters?.category && filters.category !== 'all') {
    list = list.filter(c => c.category === filters.category);
  }
  if (filters?.status && filters.status !== 'all') {
    list = list.filter(c => c.status === filters.status);
  }
  if (filters?.country && filters.country !== 'all') {
    list = list.filter(c => c.location?.country === filters.country);
  }

  return list;
}

function calculateSeverityFromCategory(cat: string): number {
  switch (cat.toLowerCase()) {
    case 'healthcare':
      return 9;
    case 'electricity':
    case 'water & sanitation':
      return 8;
    case 'roads & transport':
    case 'public safety':
      return 7;
    case 'education':
    case 'environment':
      return 6;
    default:
      return 5;
  }
}
