'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { href: '/governance', label: 'Overview', icon: LayoutDashboard },
  { href: '/governance/hotspots', label: 'Demand Hotspots', icon: MapPin },
  { href: '/governance/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/governance/infrastructure', label: 'Infrastructure', icon: Activity },
  { href: '/governance/recommendations', label: 'AI Recommendations', icon: Lightbulb },
  { href: '/governance/plans', label: 'Government Plans', icon: Building },
];

export default function GovernanceSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [country, setCountry] = useState('All Countries');

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r sticky top-0 h-screen overflow-y-auto"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--primary)' }}>BRICS AI Platform</p>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Governance</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
          <p className="section-label px-2 mb-3">Navigation</p>
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
            <p className="section-label px-2 mb-3">Portal</p>
            <Link href="/citizen" className="sidebar-link">
              <FileText className="w-4 h-4" />
              Citizen Portal
            </Link>
          </div>
        </nav>

        {/* User */}
        <div className="px-3 pb-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'var(--primary)' }}>
              MO
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>Ministry Official</p>
              <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>India · Admin</p>
            </div>
          </div>
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
            </nav>
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

            {/* Filters */}
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="relative">
                <select
                  className="appearance-none text-xs font-medium pl-3 pr-7 py-2 rounded-lg border cursor-pointer transition-all hover:bg-slate-50"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface)' }}
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                >
                  <option>All Countries</option>
                  <option>🇮🇳 India</option>
                  <option>🇧🇷 Brazil</option>
                  <option>🇷🇺 Russia</option>
                  <option>🇨🇳 China</option>
                  <option>🇿🇦 South Africa</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-muted)' }} />
              </div>
              <div className="relative hidden sm:block">
                <select className="appearance-none text-xs font-medium pl-3 pr-7 py-2 rounded-lg border cursor-pointer hover:bg-slate-50 transition-all"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface)' }}>
                  <option>All Regions</option>
                  <option>Bihar</option>
                  <option>Uttar Pradesh</option>
                  <option>Eastern Cape</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-muted)' }} />
              </div>
              <div className="relative hidden md:block">
                <select className="appearance-none text-xs font-medium pl-3 pr-7 py-2 rounded-lg border cursor-pointer hover:bg-slate-50 transition-all"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface)' }}>
                  <option>Last 90 days</option>
                  <option>Last 30 days</option>
                  <option>Last 6 months</option>
                  <option>Last year</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-muted)' }} />
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <Bell className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--primary)' }}>MO</div>
                <span className="text-xs font-medium hidden sm:block" style={{ color: 'var(--foreground)' }}>Ministry</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
