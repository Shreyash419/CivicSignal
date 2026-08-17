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

// Simplified interactive map placeholder
function DemandHotspotMap({ hotspots }: { hotspots: Hotspot[] }) {
  const [hovered, setHovered] = useState<Hotspot | null>(null);

  // Place dots at approximate positions on a world map container
  const positionMap: Record<string, { top: string; left: string }> = {
    'HOT-001': { top: '28%', left: '63%' },
    'HOT-002': { top: '25%', left: '64%' },
    'HOT-003': { top: '65%', left: '55%' },
    'HOT-004': { top: '52%', left: '32%' },
    'HOT-005': { top: '70%', left: '54%' },
    'HOT-006': { top: '50%', left: '35%' },
    'HOT-007': { top: '20%', left: '68%' },
    'HOT-008': { top: '30%', left: '74%' },
  };

  const prioritySize: Record<string, number> = {
    critical: 26,
    high: 20,
    medium: 14,
    low: 10,
  };

  const priorityColor: Record<string, string> = {
    critical: '#DC2626',
    high: '#EA580C',
    medium: '#CA8A04',
    low: '#16A34A',
  };

  return (
    <div className="relative map-placeholder rounded-xl overflow-hidden" style={{ height: 340 }}>
      {/* SVG world map background (simplified grid) */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
          {/* Simplified continent shapes */}
          {/* Americas */}
          <ellipse cx="200" cy="150" rx="70" ry="100" fill="#94A3B8" opacity="0.5" />
          <ellipse cx="220" cy="280" rx="55" ry="90" fill="#94A3B8" opacity="0.5" />
          {/* Europe/Africa */}
          <ellipse cx="400" cy="130" rx="45" ry="60" fill="#94A3B8" opacity="0.5" />
          <ellipse cx="410" cy="250" rx="55" ry="100" fill="#94A3B8" opacity="0.5" />
          {/* Asia */}
          <ellipse cx="570" cy="140" rx="110" ry="80" fill="#94A3B8" opacity="0.5" />
          {/* Australia */}
          <ellipse cx="640" cy="300" rx="40" ry="30" fill="#94A3B8" opacity="0.4" />
        </svg>
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(rgba(148,163,184,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      <div className="absolute top-3 left-4">
        <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>BRICS Demand Hotspots</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>Live priority view · Click to explore</p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-4 flex items-center gap-3">
        {[
          { label: 'Critical', color: '#DC2626' },
          { label: 'High', color: '#EA580C' },
          { label: 'Medium', color: '#CA8A04' },
          { label: 'Low', color: '#16A34A' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
            <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Hotspot dots */}
      {hotspots.map(hotspot => {
        const pos = positionMap[hotspot.id];
        if (!pos) return null;
        const size = prioritySize[hotspot.priority] ?? 14;
        const color = priorityColor[hotspot.priority] ?? '#94A3B8';
        return (
          <div
            key={hotspot.id}
            className="heatmap-dot"
            style={{
              top: pos.top,
              left: pos.left,
              width: size,
              height: size,
              background: color,
              opacity: 0.85,
              boxShadow: `0 0 0 ${size / 3}px ${color}30`,
            }}
            onMouseEnter={() => setHovered(hotspot)}
            onMouseLeave={() => setHovered(null)}
          />
        );
      })}

      {/* Tooltip */}
      {hovered && (() => {
        const pos = positionMap[hovered.id];
        const topNum = parseFloat(pos?.top ?? '50');
        const tooltipTop = topNum > 60 ? `${topNum - 30}%` : `${topNum + 5}%`;
        const leftNum = parseFloat(pos?.left ?? '50');
        const tooltipLeft = leftNum > 65 ? `${leftNum - 30}%` : `${leftNum + 3}%`;
        return (
          <div
            className="absolute z-10 pointer-events-none"
            style={{ top: tooltipTop, left: tooltipLeft }}
          >
            <div className="card p-3 shadow-lg min-w-[180px] animate-fade-in">
              <p className="font-semibold text-xs mb-1" style={{ color: 'var(--primary)' }}>
                {getCountryFlag(hovered.country)} {hovered.regionName}
              </p>
              <p className="text-xs mb-1.5" style={{ color: 'var(--foreground-muted)' }}>Top issue: {hovered.topIssue}</p>
              <div className="flex items-center justify-between">
                <span className={`badge border text-xs ${getPriorityBadgeClass(hovered.priority)}`}>
                  {hovered.priority}
                </span>
                <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{hovered.priorityScore.toFixed(1)}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

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
          {loading ? <div className="skeleton h-[340px] rounded-xl" /> : <DemandHotspotMap hotspots={hotspots} />}
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
