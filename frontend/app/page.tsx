'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Globe } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (userProfile?.role === 'government') {
        router.replace('/governance');
      } else if (userProfile?.role === 'citizen') {
        router.replace('/citizen');
      } else {
        router.replace('/login');
      }
    }
  }, [userProfile, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-900">CivicSignal DPI</span>
      </div>
      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        Connecting to unified authentication portal...
      </div>
    </div>
  );
}
