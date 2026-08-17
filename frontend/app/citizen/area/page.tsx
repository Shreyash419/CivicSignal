'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, AlertTriangle, CheckCircle, Star, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { getAreaData } from '@/lib/api';
import type { AreaData } from '@/types';
import { getPriorityBadgeClass, getStatusLabel, getStatusColor, formatDate, getScoreBarColor, getScoreColor } from '@/lib/utils';

const BAR_COLORS = ['#2563EB', '#EA580C', '#16A34A', '#7C3AED'];

export default function AreaPage() {
  const [data, setData] = useState<AreaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAreaData().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const { region, issueBreakdown, nearbyComplaints, infrastructureGaps } = data;

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>My Area</h1>
        <p className="text-sm flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}>
          <MapPin className="w-3.5 h-3.5" />
          {region.name}, {region.country}
        </p>
      </div>

      {/* Area Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Population', value: (region.population / 1000000).toFixed(1) + 'M', icon: Users, color: '#2563EB' },
          { label: 'Total Complaints', value: region.totalComplaints.toLocaleString(), icon: AlertTriangle, color: '#EA580C' },
          { label: 'Resolution Rate', value: region.resolutionRate + '%', icon: CheckCircle, color: '#16A34A' },
          { label: 'Infrastructure Score', value: region.infrastructureScore + '/100', icon: Star, color: '#7C3AED' },
        ].map(item => (
          <div key={item.label} className="kpi-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg" style={{ background: item.color + '15' }}>
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>{item.value}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issue Breakdown Chart */}
        <div className="card">
          <h2 className="font-semibold mb-5" style={{ color: 'var(--primary)' }}>Most Reported Issues</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={issueBreakdown} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} width={80} />
              <Tooltip
                formatter={(v: unknown) => [`${v}%`, 'Share']}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
              />
              <Bar dataKey="percentage" radius={[0, 6, 6, 0]} barSize={20}>
                {issueBreakdown.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Infrastructure Gaps */}
        <div className="card">
          <h2 className="font-semibold mb-5" style={{ color: 'var(--primary)' }}>Infrastructure Gaps</h2>
          <div className="space-y-4">
            {infrastructureGaps.map(gap => (
              <div key={gap.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <span>{gap.icon}</span>
                    {gap.category}
                  </span>
                  <span className={`text-sm font-bold ${getScoreColor(gap.gapScore)}`}>
                    {gap.gapScore}/100
                  </span>
                </div>
                <div className="score-bar">
                  <div
                    className={`score-bar-fill ${getScoreBarColor(gap.gapScore)}`}
                    style={{ width: `${gap.gapScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-4" style={{ color: 'var(--foreground-muted)' }}>
            Higher gap score = greater infrastructure deficit
          </p>
        </div>
      </div>

      {/* Nearby Complaints */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--primary)' }}>Issues in Your Area</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
              Showing anonymised complaints from nearby citizens
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {nearbyComplaints.map(complaint => (
            <div key={complaint.id} className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="badge" style={{ background: '#EFF6FF', color: '#2563EB', fontSize: '0.7rem' }}>{complaint.category}</span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'var(--foreground)' }}>{complaint.text}</p>
                  <div className="flex gap-3 flex-wrap">
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}>
                      <MapPin className="w-3 h-3" />
                      {complaint.location.region}
                    </span>
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}>
                      <Calendar className="w-3 h-3" />
                      {formatDate(complaint.createdAt)}
                    </span>
                  </div>
                </div>
                <span className={`badge border ${getStatusColor(complaint.status)}`} style={{ fontSize: '0.7rem', flexShrink: 0 }}>
                  {getStatusLabel(complaint.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
