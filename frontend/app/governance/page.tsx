'use client';

import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  AlertTriangle, CheckCircle, Activity, Users, TrendingUp, TrendingDown,
  MapPin, ArrowRight, Zap, Globe,
} from 'lucide-react';
import { getDashboardOverview, getHotspots, getAnalytics } from '@/lib/api';
import type { DashboardOverview, Hotspot, Analytics } from '@/types';
import { getPriorityBadgeClass, getPriorityDot, getCountryFlag, formatNumber } from '@/lib/utils';
import Link from 'next/link';

const PIE_COLORS = ['#2563EB', '#EA580C', '#16A34A', '#7C3AED', '#0891B2', '#65A30D', '#94A3B8'];

import dynamic from 'next/dynamic';

const RealWorldMap = dynamic(() => import('@/components/maps/RealWorldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] rounded-xl bg-slate-100 animate-pulse flex items-center justify-center border border-slate-200">
      <div className="text-sm font-medium text-slate-500">Loading Live World Map...</div>
    </div>
  ),
});

function KPICard({
  label, value, icon: Icon, color, change, sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  change?: number;
  sub?: string;
}) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-xl" style={{ background: color + '15' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>{value}</div>
      <div className="text-sm font-medium" style={{ color: 'var(--foreground-muted)' }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>{sub}</div>}
    </div>
  );
}

export default function GovernanceOverview() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardOverview(), getHotspots(), getAnalytics()])
      .then(([ov, hs, an]) => { setOverview(ov); setHotspots(hs); setAnalytics(an); })
      .finally(() => setLoading(false));
  }, []);

  const topRegions = hotspots.slice(0, 6);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>Governance Overview</h1>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            BRICS-wide citizen feedback intelligence · Real-time analytics
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: '#BFDBFE', background: '#EFF6FF' }}>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Live · 5 countries connected</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)
        ) : (
          <>
            <KPICard
              label="Total Complaints"
              value={formatNumber(overview!.totalComplaints)}
              icon={FileTextIcon}
              color="#2563EB"
              change={overview!.complaintsChange}
              sub="Across all BRICS nations"
            />
            <KPICard
              label="High Priority Issues"
              value={formatNumber(overview!.highPriorityIssues)}
              icon={AlertTriangle}
              color="#DC2626"
              sub="Require immediate action"
            />
            <KPICard
              label="Resolution Rate"
              value={`${overview!.resolutionRate}%`}
              icon={CheckCircle}
              color="#16A34A"
              change={overview!.resolutionChange}
              sub="Complaints closed"
            />
            <KPICard
              label="Infrastructure Gap Index"
              value={overview!.infrastructureGapIndex}
              icon={Activity}
              color="#EA580C"
              sub="Composite gap score"
            />
            <KPICard
              label="Citizen Satisfaction"
              value={`${overview!.citizenSatisfaction}%`}
              icon={Users}
              color="#7C3AED"
              sub="Based on resolved cases"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hotspot Map */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ color: 'var(--primary)' }}>Demand Hotspot Map</h2>
            <Link href="/governance/hotspots" className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              Full map <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="skeleton h-[340px] rounded-xl" />
          ) : (
            <RealWorldMap hotspots={hotspots} selectedHotspot={null} onSelectHotspot={() => {}} />
          )}
        </div>

        {/* Issue Distribution */}
        <div className="card">
          <h2 className="font-semibold mb-5" style={{ color: 'var(--primary)' }}>Issue Distribution</h2>
          {loading || !analytics ? (
            <div className="skeleton h-60 rounded-xl" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={analytics.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {analytics.categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown) => [
                      `${Number(v).toLocaleString()}`,
                      'Complaints'
                    ]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {analytics.categoryBreakdown.slice(0, 5).map((item, i) => (
                  <div key={item.category} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-xs flex-1 truncate" style={{ color: 'var(--foreground-muted)' }}>{item.category}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Priority Regions Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold" style={{ color: 'var(--primary)' }}>Priority Regions</h2>
          <Link href="/governance/hotspots" className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--accent)' }}>
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Region', 'Main Issue', 'Demand', 'Gap Score', 'Priority Score'].map(h => (
                  <th key={h} className="text-left py-3 px-2 text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="py-3 px-2"><div className="skeleton h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : (
                topRegions.map(hotspot => (
                  <tr key={hotspot.id} className="border-b hover:bg-slate-50 transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className={`priority-dot ${getPriorityDot(hotspot.priority)}`} />
                        <div>
                          <p className="font-medium text-xs" style={{ color: 'var(--foreground)' }}>{hotspot.regionName}</p>
                          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{getCountryFlag(hotspot.country)} {hotspot.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="badge" style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.7rem' }}>
                        {hotspot.topIssue}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 score-bar">
                          <div className="score-bar-fill bg-blue-500" style={{ width: `${hotspot.demandScore}%` }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{hotspot.demandScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 score-bar">
                          <div className={`score-bar-fill ${hotspot.infrastructureGapScore >= 80 ? 'bg-red-500' : hotspot.infrastructureGapScore >= 60 ? 'bg-orange-500' : 'bg-yellow-500'}`}
                            style={{ width: `${hotspot.infrastructureGapScore}%` }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{hotspot.infrastructureGapScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`badge border ${getPriorityBadgeClass(hotspot.priority)}`} style={{ fontSize: '0.7rem' }}>
                        {hotspot.priorityScore.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FileTextIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
