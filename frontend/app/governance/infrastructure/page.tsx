'use client';

import { useEffect, useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { getInfrastructureGaps } from '@/lib/api';
import type { InfrastructureGap } from '@/types';
import { getCountryFlag, getScoreColor, getScoreBarColor } from '@/lib/utils';
import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const COUNTRIES = ['all', 'India', 'Brazil', 'Russia', 'China', 'South Africa'];

export default function InfrastructurePage() {
  const [gaps, setGaps] = useState<InfrastructureGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('all');
  const [selectedGap, setSelectedGap] = useState<InfrastructureGap | null>(null);

  useEffect(() => {
    setLoading(true);
    getInfrastructureGaps({ country }).then(data => {
      setGaps(data);
      setSelectedGap(data[0] ?? null);
    }).finally(() => setLoading(false));
  }, [country]);

  const radarData = selectedGap
    ? [
        { metric: 'Demand', value: selectedGap.citizenDemand },
        { metric: 'Infrastructure', value: selectedGap.existingInfrastructure },
        { metric: 'Population', value: selectedGap.populationImpact },
        { metric: 'Investment', value: selectedGap.currentInvestment },
        { metric: 'Gap Score', value: selectedGap.gapScore },
      ]
    : [];

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>Infrastructure Gap Analysis</h1>
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          Infrastructure deficit analysis by category — high complaint volume alone does not determine priority
        </p>
      </div>

      {/* Priority note */}
      <div className="p-4 rounded-xl border flex items-start gap-3" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Priority is multi-dimensional</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Gap score is calculated from citizen demand, existing infrastructure coverage, population impact, and current investment level — not just complaint volume. A high-complaint region with existing infrastructure may have lower priority than a low-complaint region with critical gaps.
          </p>
        </div>
      </div>

      {/* Country filter */}
      <div className="flex gap-2 flex-wrap">
        {COUNTRIES.map(c => (
          <button
            key={c}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-medium transition-all',
              country === c ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
            )}
            onClick={() => setCountry(c)}
          >
            {c === 'all' ? 'All Countries' : `${getCountryFlag(c)} ${c}`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gap Cards */}
        <div className="lg:col-span-2 space-y-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-xl" />)
            : gaps.map(gap => (
              <button
                key={gap.id}
                className={cn(
                  'w-full text-left card hover:shadow-md transition-all border-2',
                  selectedGap?.id === gap.id ? 'border-blue-400' : 'border-transparent hover:border-blue-200'
                )}
                onClick={() => setSelectedGap(gap)}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{gap.icon}</span>
                    <div>
                      <h3 className="font-semibold text-base" style={{ color: 'var(--primary)' }}>{gap.category}</h3>
                      <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                        {getCountryFlag(gap.country)} {gap.regionName} · {(gap.affectedPopulation / 1000000).toFixed(1)}M affected
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black ${getScoreColor(gap.gapScore)}`}>{gap.gapScore}</p>
                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Gap Score</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  {[
                    { label: 'Citizen Demand', value: gap.citizenDemand, color: 'bg-blue-500' },
                    { label: 'Existing Infra.', value: gap.existingInfrastructure, color: 'bg-green-500' },
                    { label: 'Population Impact', value: gap.populationImpact, color: 'bg-purple-500' },
                    { label: 'Current Investment', value: gap.currentInvestment, color: 'bg-slate-400' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{item.label}</span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{item.value}</span>
                      </div>
                      <div className="score-bar">
                        <div className={`score-bar-fill ${item.color}`} style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{gap.description}</p>

                {gap.gapScore >= 80 && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs font-medium text-red-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Critical gap — immediate action recommended
                  </div>
                )}
              </button>
            ))}
        </div>

        {/* Detail Radar */}
        <div className="space-y-4">
          {selectedGap && (
            <div className="card animate-fade-in">
              <h3 className="font-semibold mb-1" style={{ color: 'var(--primary)' }}>Multi-Dimensional Analysis</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--foreground-muted)' }}>{selectedGap.category} — {selectedGap.regionName}</p>

              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#475569' }} />
                  <Radar dataKey="value" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>

              <div className="space-y-2 mt-2">
                <div className="p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>Gap Score</span>
                    <span className={`text-sm font-black ${getScoreColor(selectedGap.gapScore)}`}>{selectedGap.gapScore}/100</span>
                  </div>
                  <div className="score-bar">
                    <div className={`score-bar-fill ${getScoreBarColor(selectedGap.gapScore)}`} style={{ width: `${selectedGap.gapScore}%` }} />
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{selectedGap.description}</p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="card" style={{ background: 'var(--primary)' }}>
            <h3 className="font-semibold text-white mb-3 text-sm">Gap Score Formula</h3>
            <div className="space-y-2">
              {[
                { label: 'Citizen Demand', weight: '35%', icon: '📊' },
                { label: 'Population Impact', weight: '30%', icon: '👥' },
                { label: 'Infrastructure Deficit', weight: '25%', icon: '🏗️' },
                { label: 'Investment Gap', weight: '10%', icon: '💰' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-blue-100">{item.icon} {item.label}</span>
                  <span className="font-semibold text-white">{item.weight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
