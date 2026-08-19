'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { getHotspots } from '@/lib/api';
import type { Hotspot, Priority } from '@/types';
import { getPriorityBadgeClass, getCountryFlag, getPriorityDot } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Filter, X, Users, AlertTriangle, Brain, RefreshCw } from 'lucide-react';

// Dynamic import for Leaflet (SSR disabled)
const RealWorldMap = dynamic(() => import('@/components/maps/RealWorldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-xl bg-slate-100 animate-pulse flex items-center justify-center border border-slate-200">
      <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
        Loading Live World Map...
      </div>
    </div>
  ),
});

const COUNTRIES = ['all', 'India', 'Brazil', 'Russia', 'China', 'South Africa'];
const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];

const priorityColor: Record<string, string> = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#CA8A04',
  low: '#16A34A',
};

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('all');
  const [priority, setPriority] = useState('all');
  const [category, setCategory] = useState('all');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  const fetchHotspots = useCallback(() => {
    getHotspots({ country, priority, category })
      .then((data) => {
        setHotspots(data);
        if (selectedHotspot) {
          const updated = data.find((h) => h.id === selectedHotspot.id);
          if (updated) setSelectedHotspot(updated);
        }
      })
      .catch((err) => console.error('Failed to fetch hotspots:', err))
      .finally(() => setLoading(false));
  }, [country, priority, category, selectedHotspot]);

  // Initial fetch and auto-polling every 4s for real-time complaint updates
  useEffect(() => {
    setLoading(true);
    fetchHotspots();
    const interval = setInterval(fetchHotspots, 4000);
    return () => clearInterval(interval);
  }, [country, priority, category]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>
            Real-Time Demand Hotspot Map
          </h1>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Live geospatial intelligence across world regions powered by real-time citizen complaints
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--foreground-muted)' }} />
          <span className="text-sm font-medium mr-2" style={{ color: 'var(--foreground-muted)' }}>
            Filter:
          </span>

          {/* Country */}
          <div className="flex gap-1 flex-wrap">
            {COUNTRIES.map((c) => (
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
          {PRIORITIES.map((p) => (
            <button
              key={p}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                priority === p ? 'ring-2' : 'hover:bg-slate-50'
              )}
              style={
                priority === p
                  ? {
                      background: priorityColor[p] + '15',
                      borderColor: priorityColor[p],
                      color: priorityColor[p],
                    }
                  : { borderColor: 'transparent' }
              }
              onClick={() => setPriority(priority === p ? 'all' : p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real World Map Container */}
        <div className="lg:col-span-2">
          <RealWorldMap
            hotspots={hotspots}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={setSelectedHotspot}
          />
        </div>

        {/* Hotspot List / Detail Panel */}
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 520 }}>
          {selectedHotspot ? (
            <div className="card animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
                    {getCountryFlag(selectedHotspot.country)} {selectedHotspot.country}
                  </p>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
                    {selectedHotspot.regionName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedHotspot(null)}
                  className="p-1 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                {[
                  { label: 'Citizen Demand', value: selectedHotspot.demandScore },
                  { label: 'Infrastructure Deficit', value: selectedHotspot.infrastructureGapScore },
                  { label: 'Population Impact', value: selectedHotspot.populationImpactScore },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-500">{item.label}</span>
                      <span className="text-xs font-bold text-slate-800">{item.value}/100</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-blue-600"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg border mb-4 bg-blue-50/70 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-900">AI Priority Score</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-blue-700">
                      {selectedHotspot.priorityScore.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500">/100</span>
                  </div>
                </div>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${getPriorityBadgeClass(
                    selectedHotspot.priority
                  )}`}
                >
                  {selectedHotspot.priority}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-purple-50 border border-purple-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Brain className="w-3.5 h-3.5 text-purple-600" />
                  <p className="text-xs font-bold text-purple-700">AI Recommendation Plan</p>
                </div>
                <p className="text-xs leading-relaxed text-purple-900">
                  {selectedHotspot.aiRecommendation}
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {(selectedHotspot.population / 1000000).toFixed(1)}M citizens
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  {selectedHotspot.complaintCount.toLocaleString()} complaints
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1 px-1">
                <p className="text-xs font-semibold text-slate-500">
                  {hotspots.length} ACTIVE HOTSPOTS
                </p>
                <span className="text-[10px] text-slate-400">Click to focus on map</span>
              </div>
              {hotspots.map((hotspot) => (
                <button
                  key={hotspot.id}
                  className="w-full text-left card hover:shadow-md hover:border-blue-300 transition-all py-3 px-3.5 group"
                  onClick={() => setSelectedHotspot(hotspot)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`priority-dot ${getPriorityDot(hotspot.priority)}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-slate-800 group-hover:text-blue-600 transition-colors">
                          {getCountryFlag(hotspot.country)} {hotspot.regionName}
                        </p>
                        <p className="text-xs truncate text-slate-500">
                          {hotspot.topIssue} · {hotspot.complaintCount.toLocaleString()} complaints
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0 ml-2 text-blue-600">
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
