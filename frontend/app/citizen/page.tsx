'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  MapPin,
  ArrowRight,
  TrendingUp,
  Activity,
  MessageSquarePlus,
} from 'lucide-react';
import { getCitizenDashboard } from '@/lib/api';
import type { CitizenDashboard } from '@/types';
import { getPriorityBadgeClass, getStatusColor, getStatusLabel, formatDate, getTimeAgo, getPriorityLabel } from '@/lib/utils';

function KPICard({ label, value, icon: Icon, color, sub }: { label: string; value: number | string; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: color + '15' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>{value}</div>
      <div className="text-sm font-medium" style={{ color: 'var(--foreground-muted)' }}>{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>{sub}</div>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="kpi-card">
      <div className="skeleton h-8 w-8 rounded-lg mb-3" />
      <div className="skeleton h-7 w-16 mb-2" />
      <div className="skeleton h-4 w-24" />
    </div>
  );
}

import { useAuth } from '@/context/AuthContext';

export default function CitizenDashboardPage() {
  const { userProfile } = useAuth();
  const [dashboard, setDashboard] = useState<CitizenDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCitizenDashboard()
      .then(setDashboard)
      .finally(() => setLoading(false));
  }, [userProfile]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = userProfile?.displayName || dashboard?.name || 'Citizen';
  const userRegion = userProfile?.region || dashboard?.region || 'Patna';
  const userCountry = userProfile?.country || dashboard?.country || 'India';

  return (
    <div className="animate-fade-in space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>
            {greeting}, {displayName} 👋
          </h1>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Here is what is happening in your area — <span className="font-medium">{userRegion}, {userCountry}</span>
          </p>
        </div>
        <Link href="/citizen/complain" className="btn-primary shrink-0">
          <MessageSquarePlus className="w-4 h-4" />
          Report an Issue
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading || !dashboard ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KPICard label="My Complaints" value={dashboard.myComplaints} icon={FileText} color="#2563EB" sub="Total submitted" />
            <KPICard label="Resolved" value={dashboard.resolved} icon={CheckCircle} color="#16A34A" sub="Successfully closed" />
            <KPICard label="In Progress" value={dashboard.inProgress} icon={Clock} color="#EA580C" sub="Being actioned" />
            <KPICard label="Area Issues" value={dashboard.areaIssues.toLocaleString()} icon={AlertTriangle} color="#DC2626" sub="In your region" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Complaints */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-base" style={{ color: 'var(--primary)' }}>Recent Complaints</h2>
            <Link href="/citizen/complaints" className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all" style={{ color: 'var(--accent)' }}>
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                  <div className="skeleton h-4 w-3/4 mb-2" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : !dashboard || dashboard.recentComplaints.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed rounded-xl border-slate-200">
              <MessageSquarePlus className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-800 mb-1">No complaints submitted yet</p>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                You haven&apos;t filed any complaints yet. Report an issue in your area to track it live with AI classification.
              </p>
              <Link href="/citizen/complain" className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 shadow-sm">
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Report Your First Issue
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.recentComplaints.map(complaint => (
                <Link
                  key={complaint.id}
                  href={`/citizen/complaints`}
                  className="block p-4 rounded-xl border hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-mono font-semibold" style={{ color: 'var(--accent)' }}>{complaint.id}</span>
                        <span className="badge" style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>{complaint.category}</span>
                      </div>
                      <p className="text-sm truncate mb-2" style={{ color: 'var(--foreground)' }}>{complaint.text}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                          <MapPin className="w-3 h-3" />
                          {complaint.location.region}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{getTimeAgo(complaint.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`badge border ${getStatusColor(complaint.status)}`} style={{ fontSize: '0.7rem' }}>
                        {getStatusLabel(complaint.status)}
                      </span>
                      <span className={`badge border ${getPriorityBadgeClass(complaint.priority)}`} style={{ fontSize: '0.7rem' }}>
                        {getPriorityLabel(complaint.priority)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Area Overview */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <h2 className="font-semibold text-base" style={{ color: 'var(--primary)' }}>Area Overview</h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--foreground-muted)' }}>Top Issue in Area</p>
                  <p className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>{dashboard?.areaOverview.topIssue}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--foreground-muted)' }}>Total Area Complaints</p>
                  <p className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>{dashboard?.areaOverview.totalComplaints.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>Infrastructure Gap</p>
                    <span className="text-xs font-bold text-red-600">{dashboard?.areaOverview.infrastructureGapScore}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-bar-fill bg-red-500" style={{ width: `${dashboard?.areaOverview.infrastructureGapScore}%` }} />
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>Satisfaction Score</p>
                    <span className="text-xs font-bold text-orange-600">{dashboard?.areaOverview.satisfactionScore}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-bar-fill bg-orange-400" style={{ width: `${dashboard?.areaOverview.satisfactionScore}%` }} />
                  </div>
                </div>
              </div>
            )}

            <Link href="/citizen/area" className="flex items-center gap-1 text-sm font-medium mt-4" style={{ color: 'var(--accent)' }}>
              View full area report <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick actions */}
          <div className="card">
            <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--primary)' }}>Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/citizen/complain" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                <MessageSquarePlus className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Report a new issue</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
              </Link>
              <Link href="/citizen/plans" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Government plans</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
