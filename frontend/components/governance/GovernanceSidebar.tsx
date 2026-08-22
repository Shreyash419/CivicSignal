'use client';

// ============================================================
// CivicSignal — Governance Sidebar with Official Auth State
// ============================================================

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Globe,
  LayoutDashboard,
  MapPin,
  BarChart3,
  Activity,
  Lightbulb,
  Building,
  FileText,
  Bell,
  ChevronDown,
  Menu,
  X,
  Search,
  LogOut,
  LogIn,
  ShieldCheck,
  BadgeCheck,
  Inbox,
  Lock,
  Sparkles,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const sidebarItems = [
  { href: '/governance', label: 'Overview', icon: LayoutDashboard },
  { href: '/governance/complaints', label: 'Citizen Complaints', icon: Inbox },
  { href: '/governance/hotspots', label: 'Demand Hotspots', icon: MapPin },
  { href: '/governance/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/governance/infrastructure', label: 'Infrastructure', icon: Activity },
  { href: '/governance/recommendations', label: 'AI Recommendations', icon: Lightbulb },
  { href: '/governance/plans', label: 'Government Plans', icon: Building },
];

export default function GovernanceSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, role, logout, demoLogin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [country, setCountry] = useState('All Countries');

  const handleLogout = async () => {
    await logout();
    router.push('/login?role=government');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'GO';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r sticky top-0 h-screen overflow-y-auto"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--primary)' }}>BRICS AI Platform</p>
              <p className="text-xs flex items-center gap-1 font-semibold text-indigo-600">
                <ShieldCheck className="w-3 h-3" />
                Governance Portal
              </p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
          <p className="section-label px-2 mb-3">Governance Navigation</p>
          <div className="space-y-0.5">
            {sidebarItems.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={cn('sidebar-link', active && 'active')}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                  {item.label === 'AI Recommendations' && (
                    <span className="ml-auto px-1.5 py-0.5 rounded text-xs font-bold text-white" style={{ background: '#7C3AED' }}>AI</span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="section-label px-2 mb-3">Citizen Voice</p>
            <Link href="/citizen" className="sidebar-link">
              <FileText className="w-4 h-4" />
              Citizen Feedback Portal
            </Link>
          </div>
        </nav>

        {/* Official User Profile Box */}
        <div className="px-3 pb-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          {userProfile ? (
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-indigo-700 shadow-sm">
                  {getInitials(userProfile.displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-slate-900">{userProfile.displayName}</p>
                  <p className="text-[10px] text-indigo-700 font-semibold truncate flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                    {userProfile.designation || 'Ministry Official'}
                  </p>
                </div>
              </div>

              {userProfile.department && (
                <p className="text-[10px] text-slate-600 bg-white p-1.5 rounded-md border border-slate-100 mb-2 truncate">
                  🏢 {userProfile.department}
                </p>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Firestore Synced
                </span>
                <button
                  onClick={handleLogout}
                  className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/80 text-center">
              <p className="text-xs font-semibold text-indigo-900 mb-1">Official Access</p>
              <p className="text-[11px] text-indigo-700 mb-3">Sign in with official credentials</p>
              <Link
                href="/login?role=government"
                className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In as Official
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col border-r overflow-y-auto z-10"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>BRICS AI Governance</span>
              </Link>
              <button onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5" style={{ color: 'var(--foreground-muted)' }} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4">
              {sidebarItems.map(item => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className={cn('sidebar-link', active && 'active')} onClick={() => setMobileOpen(false)}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <Link href="/citizen" className="sidebar-link" onClick={() => setMobileOpen(false)}>
                  <FileText className="w-4 h-4" />
                  Citizen Portal
                </Link>
              </div>
            </nav>
            {userProfile && (
              <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-bold text-slate-900">{userProfile.displayName}</p>
                <p className="text-[11px] text-slate-500 mb-2">{userProfile.designation || 'Government Official'}</p>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-600 font-semibold flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderColor: 'var(--border)' }}>
          <div className="px-4 sm:px-6 h-14 flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-slate-50 mr-1" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
            </button>

            {/* Country Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>Focus:</span>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg border bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                {['All Countries', 'India', 'Brazil', 'Russia', 'China', 'South Africa'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Firebase Live
              </div>

              <button className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <Bell className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Content with Government Body Authorization Gate */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {!userProfile || userProfile.role !== 'government' ? (
            <div className="max-w-2xl mx-auto my-12 p-8 card border-2 border-indigo-100 shadow-xl rounded-2xl bg-white text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 mx-auto flex items-center justify-center mb-5 shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Official Clearance Required
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-3 mb-2">
                Government Body Portal Access
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6 leading-relaxed">
                This section gives municipal administrators and ministry officers real-time access to the live citizen complaints dataset, geospatial deficit hotspots, and AI-generated infrastructure recommendations.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/login?role=government"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In with Official Account
                </Link>
                <button
                  type="button"
                  onClick={() => demoLogin('government')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  One-Click Demo Official (Dr. Elena Rossi)
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Are you a citizen reporting a civic issue?</span>
                <Link href="/citizen" className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  Citizen Portal <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
