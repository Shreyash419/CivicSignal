// ============================================================
// CivicSignal — Firebase Auth & User Profile Service
// ============================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserProfile, UserRole, Country } from '@/types';

const LOCAL_USER_KEY = 'civicsignal_authenticated_user';

// Built-in Demo Profiles for immediate 1-click evaluation
export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  citizen: {
    uid: 'ctz-demo-rajesh-001',
    email: 'rajesh.kumar@citizen.brics.org',
    displayName: 'Rajesh Kumar',
    role: 'citizen',
    region: 'Patna',
    country: 'India',
    phoneNumber: '+91 98765 43210',
    avatarUrl: '',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  government: {
    uid: 'gov-demo-elena-001',
    email: 'elena.rossi@governance.brics.gov',
    displayName: 'Dr. Elena Rossi',
    role: 'government',
    department: 'Urban Infrastructure & Public Works',
    designation: 'Chief Regional Officer',
    badgeNumber: 'BRICS-GOV-9842',
    region: 'National Oversight Board',
    country: 'India',
    phoneNumber: '+91 11 2309 4500',
    avatarUrl: '',
    createdAt: new Date('2023-09-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

// ── Local Storage Helpers ─────────────────────────────────────
export function getLocalStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalStoredUser(profile: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (profile) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  } catch (e) {
    console.warn('Failed to update local user storage:', e);
  }
}

// ── Firestore Profile Management ──────────────────────────────
export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', profile.uid);
    // Strip undefined properties to avoid Firestore setDoc errors
    const cleanProfile = Object.fromEntries(
      Object.entries({
        ...profile,
        updatedAt: new Date().toISOString(),
      }).filter(([_, v]) => v !== undefined)
    );
    await setDoc(userDocRef, cleanProfile, { merge: true });
  } catch (error) {
    console.warn('Firestore user profile save notice (will persist locally):', error);
  } finally {
    saveLocalStoredUser(profile);
  }
}

export async function getUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      saveLocalStoredUser(data);
      return data;
    }
  } catch (error) {
    console.warn('Firestore profile fetch notice:', error);
  }
  return getLocalStoredUser();
}

// ── Authentication Actions ────────────────────────────────────

export interface RegisterUserData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  country: Country;
  region?: string;
  phoneNumber?: string;
  department?: string;
  designation?: string;
  badgeNumber?: string;
}

/**
 * Register a new Citizen or Government Official
 * Creates Firebase Auth record + persists full profile to Firestore `/users/{uid}`
 */
export async function registerUser(data: RegisterUserData): Promise<UserProfile> {
  const now = new Date().toISOString();

  try {
    // 1. Create auth user in Firebase
    const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const firebaseUser = userCred.user;

    // 2. Set Firebase Auth display name
    await updateProfile(firebaseUser, {
      displayName: data.displayName,
    });

    // 3. Build comprehensive profile
    const profile: UserProfile = {
      uid: firebaseUser.uid,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      country: data.country,
      region: data.region || 'National',
      phoneNumber: data.phoneNumber || '',
      department: data.department,
      designation: data.designation,
      badgeNumber: data.badgeNumber,
      createdAt: now,
      updatedAt: now,
    };

    // 4. Save to Firestore collection `users`
    await saveUserProfileToFirestore(profile);
    return profile;
  } catch (error: any) {
    // Handle offline / emulator / simulation registration fallback
    if (error.code === 'auth/network-request-failed' || error.code === 'auth/api-key-not-valid' || error.code === 'auth/invalid-api-key') {
      const fallbackUid = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const fallbackProfile: UserProfile = {
        uid: fallbackUid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        country: data.country,
        region: data.region || 'National',
        phoneNumber: data.phoneNumber || '',
        department: data.department,
        designation: data.designation,
        badgeNumber: data.badgeNumber,
        createdAt: now,
        updatedAt: now,
      };
      saveLocalStoredUser(fallbackProfile);
      return fallbackProfile;
    }
    throw error;
  }
}

/**
 * Sign in existing Citizen or Government Official
 * Authenticates with Firebase Auth and retrieves role and profile from Firestore
 */
export async function loginUser(email: string, password: string): Promise<UserProfile> {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCred.user;

    // Fetch profile from Firestore
    const existing = await getUserProfileFromFirestore(firebaseUser.uid);
    if (existing) {
      return existing;
    }

    // If Firestore document didn't exist, create an initial one
    const fallbackProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || email,
      displayName: firebaseUser.displayName || email.split('@')[0],
      role: email.includes('gov') || email.includes('admin') ? 'government' : 'citizen',
      country: 'India',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveUserProfileToFirestore(fallbackProfile);
    return fallbackProfile;
  } catch (error: any) {
    // Fallback support if API key is not connected to live Firebase yet
    if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid' || error.code === 'auth/network-request-failed') {
      const isGov = email.includes('gov') || email.includes('official') || email.includes('admin');
      const mockProfile: UserProfile = {
        uid: `user-offline-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        displayName: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        role: isGov ? 'government' : 'citizen',
        department: isGov ? 'Public Infrastructure & Civic Affairs' : undefined,
        designation: isGov ? 'Senior Governance Officer' : undefined,
        badgeNumber: isGov ? `BRICS-ID-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
        region: 'Patna',
        country: 'India',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveLocalStoredUser(mockProfile);
      return mockProfile;
    }
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('SignOut warning:', e);
  } finally {
    saveLocalStoredUser(null);
  }
}

/**
 * Instant Demo Login for Citizen
 */
export function loginAsDemoCitizen(): UserProfile {
  const profile = DEMO_PROFILES.citizen;
  saveLocalStoredUser(profile);
  return profile;
}

/**
 * Instant Demo Login for Government Official
 */
export function loginAsDemoGovernment(): UserProfile {
  const profile = DEMO_PROFILES.government;
  saveLocalStoredUser(profile);
  return profile;
}
