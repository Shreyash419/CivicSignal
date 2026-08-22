// ============================================================
// CivicSignal — Firebase Client Initialization & Utilities
// ============================================================

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyB2Tu0x_50yNH0cKuVmMbIf9pNxQqnS-kg',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'civicsignal-dpi.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'civicsignal-dpi',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'civicsignal-dpi.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '508561902223',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:508561902223:web:9c0773f55ddedcf841fefa',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-BCQE69P2CC',
};

// Check if Firebase has a valid user-supplied production config or demo mode
export function isFirebaseConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey;
  return Boolean(
    apiKey &&
    apiKey !== 'AIzaSyDemoDummyKeyForCivicSignalDPIPlatform001' &&
    apiKey !== 'your-api-key' &&
    apiKey.length > 10
  );
}

// Initialize Firebase App safely (singleton)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn('Firebase initialization notice:', error);
  // Re-attempt with basic config if error occurs
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig, 'civicsignal-app');
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
export default app;
