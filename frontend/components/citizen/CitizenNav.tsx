'use client';

// ============================================================
// CivicSignal — Citizen Navigation Bar with Auth Integration
// ============================================================

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Globe,
  LayoutDashboard,
  MessageSquarePlus,
  FileText,
  MapPin,
  Building,
  Bell,
  User,
  ChevronDown,
  Menu,
  X,
  LogOut,
  LogIn,
  Shield,
  UserCheck,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/citizen', label: 'Overview', icon: LayoutDashboard },
  { href: '/citizen/complain', label: 'Submit Complaint', icon: MessageSquarePlus },
  { href: '/citizen/complaints', label: 'My Complaints', icon: FileText },
  { href: '/citizen/area', label: 'My Area', icon: MapPin },
  { href: '/citizen/plans', label: 'Government Plans', icon: Building },
];

export default function CitizenNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, role, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    await logout();
    router.push('/login?role=citizen');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold" style={{ color: 'var(--primary)', lineHeight: 1.2 }}>BRICS AI Platform</p>
                <p className="text-xs" style={{ color: 'var(--foreground-muted)', lineHeight: 1.2 }}>Citizen Portal</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map(item => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      active
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <Link href="/governance" className="hidden md:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all hover:bg-slate-50" style={{ color: 'var(--foreground-muted)', borderColor: 'var(--border)' }}>
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                Governance View
              </Link>

              <button className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <Bell className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User Profile / Auth Button */}
              {userProfile ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ background: userProfile.role === 'government' ? '#4F46E5' : 'var(--accent)' }}>
                      {getInitials(userProfile.displayName)}
                    </div>
                    <div className="text-left hidden md:block">
                      <span className="text-xs font-semibold block leading-tight text-slate-900 truncate max-w-[110px]">
                        {userProfile.displayName}
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-none">
                        {userProfile.region || userProfile.country}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 hidden md:block text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200 p-2 z-50 animate-scale-in">
                      <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-900 truncate">{userProfile.displayName}</span>
                          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider', userProfile.role === 'government' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700')}>
                            {userProfile.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{userProfile.email}</p>
                        <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Firebase Firestore Active
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <Link
                          href="/citizen/complaints"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4 text-slate-400" />
                          My Registered Issues
                        </Link>
                        <Link
                          href="/governance"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <Building className="w-4 h-4 text-slate-400" />
                          Switch to Governance Body
                        </Link>
                        <Link
                          href="/login?role=citizen"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <UserCheck className="w-4 h-4 text-slate-400" />
                          Switch Account / Login
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login?role=citizen"
                  className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Link>
              )}

              <button className="lg:hidden p-2 rounded-lg hover:bg-slate-50 transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="w-5 h-5" style={{ color: 'var(--foreground)' }} /> : <Menu className="w-5 h-5" style={{ color: 'var(--foreground)' }} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {navItems.map(item => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      active
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              {!userProfile && (
                <Link
                  href="/login?role=citizen"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-blue-600 bg-blue-50/60"
                  onClick={() => setMobileOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In to Citizen Portal
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
