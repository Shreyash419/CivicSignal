'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/citizen', label: 'Overview', icon: LayoutDashboard },
  { href: '/citizen/complain', label: 'Submit Complaint', icon: MessageSquarePlus },
  { href: '/citizen/complaints', label: 'My Complaints', icon: FileText },
  { href: '/citizen/area', label: 'My Area', icon: MapPin },
  { href: '/citizen/plans', label: 'Government Plans', icon: Building },
];

export default function CitizenNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
              <Link href="/governance" className="hidden md:block text-xs font-medium px-3 py-1.5 rounded-lg border transition-all hover:bg-slate-50" style={{ color: 'var(--foreground-muted)', borderColor: 'var(--border)' }}>
                Governance View
              </Link>
              <button className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <Bell className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--accent)' }}>
                  RK
                </div>
                <span className="text-sm font-medium hidden md:block" style={{ color: 'var(--foreground)' }}>Rajesh K.</span>
                <ChevronDown className="w-3.5 h-3.5 hidden md:block" style={{ color: 'var(--foreground-muted)' }} />
              </div>
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
            </div>
          </div>
        )}
      </header>
    </>
  );
}
