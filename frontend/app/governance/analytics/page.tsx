'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie,
} from 'recharts';
import { getAnalytics } from '@/lib/api';
import type { Analytics } from '@/types';
import { getCountryFlag } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const PIE_COLORS = ['#2563EB', '#EA580C', '#16A34A', '#7C3AED', '#0891B2', '#65A30D', '#94A3B8'];
const SEVERITY_COLORS: Record<string, string> = {
  'Critical (9-10)': '#DC2626',
  'High (7-8)': '#EA580C',
  'Medium (5-6)': '#CA8A04',
  'Low (1-4)': '#16A34A',
};

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="mb-5">
        <h2 className="font-semibold" style={{ color: 'var(--primary)' }}>{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then(setAnalytics).finally(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-72 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>Analytics</h1>
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          Advanced data visualisation across categories, regions, and time periods
        </p>
      </div>

      {/* Complaints Over Time */}
      <ChartCard title="Complaints Over Time" subtitle="Monthly complaint volume and resolution trends">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={analytics.complaintsOverTime} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94A3B8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="complaints" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} name="Total Complaints" />
            <Line type="monotone" dataKey="resolved" stroke="#16A34A" strokeWidth={2} dot={{ r: 3, fill: '#16A34A' }} name="Resolved" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="pending" stroke="#EA580C" strokeWidth={1.5} dot={{ r: 3, fill: '#EA580C' }} name="Pending" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <ChartCard title="Category Distribution" subtitle="Issue types and trend directions">
          <div className="space-y-3">
            {analytics.categoryBreakdown.map((item, i) => (
              <div key={item.category} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-sm flex-1" style={{ color: 'var(--foreground)' }}>{item.category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 score-bar">
                    <div className="score-bar-fill" style={{ width: `${item.percentage}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  </div>
                  <span className="text-xs font-semibold w-8 text-right" style={{ color: 'var(--foreground)' }}>{item.percentage}%</span>
                  {item.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-red-500" />}
                  {item.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-green-500" />}
                  {item.trend === 'stable' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Severity Distribution */}
        <ChartCard title="Complaint Severity Distribution" subtitle="Breakdown by urgency level">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={analytics.severityDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={55}
                paddingAngle={4}
                dataKey="count"
                nameKey="severity"
              >
                {analytics.severityDistribution.map((item, i) => (
                  <Cell key={i} fill={SEVERITY_COLORS[item.severity] ?? '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: unknown) => [Number(v).toLocaleString(), 'Complaints']}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
              />
              <Legend
                formatter={(v) => <span style={{ fontSize: 12, color: '#475569' }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Region Comparison */}
        <ChartCard title="Region Comparison" subtitle="Complaints vs. gap score by region">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.regionComparison.slice(0, 6)} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="region"
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                formatter={(v: unknown, name: unknown) => [
                  name === 'complaints' ? Number(v).toLocaleString() : `${v}/100`,
                  name === 'complaints' ? 'Complaints' : 'Gap Score'
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="complaints" fill="#2563EB" radius={[4, 4, 0, 0]} name="Complaints" />
              <Bar dataKey="gapScore" fill="#EA580C" radius={[4, 4, 0, 0]} name="Gap Score" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Resolution Time */}
        <ChartCard title="Average Resolution Time" subtitle="Days to resolve by category">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.resolutionTime} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} unit=" days" />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#475569' }} width={110} />
              <Tooltip
                formatter={(v: unknown) => [`${v} days`, 'Avg. Resolution']}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
              />
              <Bar dataKey="avgDays" radius={[0, 6, 6, 0]} barSize={18}>
                {analytics.resolutionTime.map((item, i) => (
                  <Cell
                    key={i}
                    fill={item.avgDays > 35 ? '#DC2626' : item.avgDays > 25 ? '#EA580C' : item.avgDays > 15 ? '#CA8A04' : '#16A34A'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Region Satisfaction Table */}
      <div className="card">
        <h2 className="font-semibold mb-5" style={{ color: 'var(--primary)' }}>Region Performance Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Region', 'Country', 'Total Complaints', 'Resolved', 'Gap Score', 'Satisfaction'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analytics.regionComparison.map(row => (
                <tr key={row.region} className="border-b hover:bg-slate-50 transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-3 px-3 font-medium text-sm" style={{ color: 'var(--foreground)' }}>{row.region}</td>
                  <td className="py-3 px-3 text-sm">
                    <span style={{ color: 'var(--foreground-muted)' }}>{getCountryFlag(row.country)} {row.country}</span>
                  </td>
                  <td className="py-3 px-3 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.complaints.toLocaleString()}</td>
                  <td className="py-3 px-3 text-sm" style={{ color: '#16A34A', fontWeight: 500 }}>{row.resolved.toLocaleString()}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 score-bar">
                        <div className={`score-bar-fill ${row.gapScore >= 80 ? 'bg-red-500' : row.gapScore >= 60 ? 'bg-orange-500' : 'bg-yellow-500'}`}
                          style={{ width: `${row.gapScore}%` }} />
                      </div>
                      <span className="text-xs font-semibold">{row.gapScore}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-sm font-semibold ${row.satisfactionScore >= 60 ? 'text-green-600' : row.satisfactionScore >= 45 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {row.satisfactionScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
