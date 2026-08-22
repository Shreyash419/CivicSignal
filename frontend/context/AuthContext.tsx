'use client';

// ============================================================
// CivicSignal — Global Authentication Context & Provider
// Supports Citizen & Government Body roles + Firestore Sync
// ============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  loginUser,
  registerUser,
  logoutUser,
  loginAsDemoCitizen,
  loginAsDemoGovernment,
  getLocalStoredUser,
  getUserProfileFromFirestore,
  RegisterUserData,
} from '@/lib/firebaseAuth';
import type { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  register: (data: RegisterUserData) => Promise<UserProfile>;
  logout: () => Promise<void>;
  demoLogin: (role: UserRole) => UserProfile;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from local cached profile immediately to prevent layout shifts
  useEffect(() => {
    const cached = getLocalStoredUser();
    if (cached) {
      setUserProfile(cached);
    }
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const profile = await getUserProfileFromFirestore(fbUser.uid);
          if (profile) {
            setUserProfile(profile);
          }
        } catch (e) {
          console.warn('Could not sync user profile from Firestore:', e);
        }
      } else {
        // If not in Firebase Auth, check if local demo user is active
        const local = getLocalStoredUser();
        if (local && (local.uid.startsWith('ctz-demo') || local.uid.startsWith('gov-demo') || local.uid.startsWith('user-offline'))) {
          setUserProfile(local);
        } else {
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const profile = await loginUser(email, pass);
      setUserProfile(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterUserData) => {
    setLoading(true);
    try {
      const profile = await registerUser(data);
      setUserProfile(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (selectedRole: UserRole) => {
    const profile = selectedRole === 'government' ? loginAsDemoGovernment() : loginAsDemoCitizen();
    setUserProfile(profile);
    return profile;
  };

  const refreshProfile = async () => {
    if (userProfile?.uid) {
      const updated = await getUserProfileFromFirestore(userProfile.uid);
      if (updated) setUserProfile(updated);
    }
  };

  const role = userProfile?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        role,
        loading,
        login,
        register,
        logout,
        demoLogin,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
