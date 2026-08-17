'use client';

import { useEffect, useState } from 'react';
import { getHotspots } from '@/lib/api';
import type { Hotspot, Priority } from '@/types';
import { getPriorityBadgeClass, getCountryFlag, getPriorityDot } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Filter, X, Users, AlertTriangle, Brain } from 'lucide-react';

const COUNTRIES = ['all', 'India', 'Brazil', 'Russia', 'China', 'South Africa'];
const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];
const CATEGORIES = ['all', 'Healthcare', 'Roads & Transport', 'Water & Sanitation', 'Education', 'Digital Connectivity'];

const positionMap: Record<string, { top: string; left: string }> = {
  'HOT-001': { top: '31%', left: '63.5%' },
  'HOT-002': { top: '27%', left: '65%' },
  'HOT-003': { top: '66%', left: '55%' },
  'HOT-004': { top: '53%', left: '31%' },
  'HOT-005': { top: '71%', left: '54%' },
  'HOT-006': { top: '51%', left: '35%' },
  'HOT-007': { top: '21%', left: '70%' },
  'HOT-008': { top: '31%', left: '76%' },
};

const priorityColor: Record<string, string> = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#CA8A04',
  low: '#16A34A',
};

const prioritySize: Record<string, number> = {
  critical: 30,
  high: 22,
  medium: 16,
  low: 12,
};

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('all');
  const [priority, setPriority] = useState('all');
  const [category, setCategory] = useState('all');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  useEffect(() => {
    setLoading(true);
    getHotspots({ country, priority, category })
      .then(setHotspots)
      .finally(() => setLoading(false));
  }, [country, priority, category]);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>Demand Hotspot Map</h1>
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          Interactive view of high-demand infrastructure regions across BRICS nations
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--foreground-muted)' }} />
          <span className="text-sm font-medium mr-2" style={{ color: 'var(--foreground-muted)' }}>Filter:</span>

          {/* Country */}
          <div className="flex gap-1 flex-wrap">
            {COUNTRIES.map(c => (
              <button
                key={c}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  country === c ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                )}
                onClick={() => setCountry(c)}
              >
                {c === 'all' ? 'All Countries' : `${getCountryFlag(c)} ${c}`}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Priority */}
          {PRIORITIES.map(p => (
            <button
              key={p}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                priority === p ? 'ring-2' : 'hover:bg-slate-50'
              )}
              style={priority === p ? {
                background: priorityColor[p] + '15',
                borderColor: priorityColor[p],
                color: priorityColor[p],
              } : { borderColor: 'transparent' }}
              onClick={() => setPriority(priority === p ? 'all' : p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="relative map-placeholder rounded-xl overflow-hidden" style={{ height: 460 }}>
            {/* SVG Background */}
            <div className="absolute inset-0 opacity-15">
              <svg width="100%" height="100%" viewBox="0 0 900 500" preserveAspectRatio="xMidYMid meet">
                <ellipse cx="210" cy="170" rx="80" ry="110" fill="#94A3B8" />
                <ellipse cx="230" cy="310" rx="62" ry="100" fill="#94A3B8" />
                <ellipse cx="420" cy="145" rx="55" ry="70" fill="#94A3B8" />
                <ellipse cx="435" cy="280" rx="62" ry="120" fill="#94A3B8" />
                <ellipse cx="620" cy="155" rx="130" ry="90" fill="#94A3B8" />
                <ellipse cx="700" cy="340" rx="48" ry="36" fill="#94A3B8" opacity="0.6" />
              </svg>
            </div>

            {/* Grid */}
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }} />

            <div className="absolute top-4 left-5">
              <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Global Infrastructure Demand Map</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                {hotspots.length} active hotspots · Hover to preview · Click to analyse
              </p>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-5 flex items-center gap-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.9)' }}>
              {[
                { label: '🔴 Critical', color: '#DC2626' },
                { label: '🟠 High', color: '#EA580C' },
                { label: '🟡 Medium', color: '#CA8A04' },
                { label: '🟢 Low', color: '#16A34A' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Hotspot dots */}
            {!loading && hotspots.map(hotspot => {
              const pos = positionMap[hotspot.id];
              if (!pos) return null;
              const size = prioritySize[hotspot.priority] ?? 14;
              const color = priorityColor[hotspot.priority] ?? '#94A3B8';
              const isSelected = selectedHotspot?.id === hotspot.id;
              return (
                <div
                  key={hotspot.id}
                  className="heatmap-dot cursor-pointer"
                  style={{
                    top: pos.top,
                    left: pos.left,
                    width: size,
                    height: size,
                    background: color,
                    opacity: isSelected ? 1 : 0.8,
                    boxShadow: isSelected
                      ? `0 0 0 6px ${color}50, 0 0 20px ${color}40`
                      : `0 0 0 ${size / 3}px ${color}30`,
                    zIndex: isSelected ? 10 : 1,
                    transform: `translate(-50%, -50%) ${isSelected ? 'scale(1.3)' : 'scale(1)'}`,
                  }}
                  onClick={() => setSelectedHotspot(hotspot === selectedHotspot ? null : hotspot)}
                />
              );
            })}

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Loading hotspots...</div>
              </div>
            )}
          </div>
        </div>

        {/* Hotspot List / Detail Panel */}
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 460 }}>
          {selectedHotspot ? (
            <div className="card animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
                    {getCountryFlag(selectedHotspot.country)} {selectedHotspot.country}
                  </p>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{selectedHotspot.regionName}</h3>
                </div>
                <button onClick={() => setSelectedHotspot(null)}>
                  <X className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                {[
                  { label: 'Healthcare Demand', value: selectedHotspot.demandScore },
                  { label: 'Infrastructure Gap', value: selectedHotspot.infrastructureGapScore },
                  { label: 'Population Impact', value: selectedHotspot.populationImpactScore },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{item.label}</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{item.value}</span>
                    </div>
                    <div className="score-bar">
                      <div className="score-bar-fill bg-blue-500" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg border mb-4" style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>Priority Score</span>
                  <span className="text-lg font-black" style={{ color: 'var(--accent)' }}>{selectedHotspot.priorityScore.toFixed(1)}</span>
                  <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>/100</span>
                </div>
                <span className={`badge border ${getPriorityBadgeClass(selectedHotspot.priority)}`} style={{ fontSize: '0.7rem' }}>
                  {selectedHotspot.priority.toUpperCase()}
                </span>
              </div>

              <div className="p-3 rounded-lg" style={{ background: '#F5F3FF' }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Brain className="w-3.5 h-3.5 text-purple-600" />
                  <p className="text-xs font-bold text-purple-700">AI Recommendation</p>
                </div>
                <p className="text-xs leading-relaxed text-purple-900">{selectedHotspot.aiRecommendation}</p>
              </div>

              <div className="flex gap-3 mt-4 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(selectedHotspot.population / 1000000).toFixed(1)}M people</span>
                <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{selectedHotspot.complaintCount.toLocaleString()} complaints</span>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>
                {hotspots.length} HOTSPOTS · Click a dot or row to analyse
              </p>
              {hotspots.map(hotspot => (
                <button
                  key={hotspot.id}
                  className="w-full text-left card hover:shadow-md hover:border-blue-200 transition-all py-3"
                  onClick={() => setSelectedHotspot(hotspot)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`priority-dot ${getPriorityDot(hotspot.priority)}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--primary)' }}>
                          {getCountryFlag(hotspot.country)} {hotspot.regionName}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>
                          {hotspot.topIssue} · {hotspot.complaintCount.toLocaleString()} complaints
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0 ml-2" style={{ color: 'var(--accent)' }}>
                      {hotspot.priorityScore.toFixed(1)}
                    </span>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
