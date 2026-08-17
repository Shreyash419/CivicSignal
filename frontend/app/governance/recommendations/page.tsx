'use client';

import { useEffect, useState } from 'react';
import { getRecommendations } from '@/lib/api';
import type { Recommendation, Priority } from '@/types';
import { getPriorityBadgeClass, getCountryFlag } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Brain, Users, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Zap, Filter } from 'lucide-react';

const PRIORITIES: ('all' | Priority)[] = ['all', 'critical', 'high', 'medium', 'low'];
const COUNTRIES = ['all', 'India', 'Brazil', 'Russia', 'China', 'South Africa'];

const priorityColor: Record<string, string> = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#CA8A04',
  low: '#16A34A',
};

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const [expanded, setExpanded] = useState(false);
  const color = priorityColor[rec.priority];

  return (
    <div className="card hover:shadow-md transition-all" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span
              className={`badge border ${getPriorityBadgeClass(rec.priority)} uppercase text-xs font-black tracking-wider`}
              style={{ padding: '0.2rem 0.6rem' }}
            >
              {rec.priority} priority
            </span>
            <span className="badge" style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.7rem' }}>{rec.category}</span>
            {rec.aiGenerated && (
              <span className="badge" style={{ background: '#F5F3FF', color: '#7C3AED', fontSize: '0.7rem' }}>
                <Brain className="w-2.5 h-2.5" /> AI Generated
              </span>
            )}
          </div>
          <h3 className="font-bold text-base mb-1" style={{ color: 'var(--primary)' }}>{rec.title}</h3>
          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
            {getCountryFlag(rec.country)} {rec.regionName}, {rec.country}
          </p>
        </div>

        {/* Priority Score */}
        <div className="text-right flex-shrink-0">
          <div className="text-3xl font-black" style={{ color }}>{rec.priorityScore.toFixed(1)}</div>
          <div className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>Priority Score</div>
          <div className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
            {rec.confidence}% confidence
          </div>
        </div>
      </div>

      {/* Evidence */}
      <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--background)' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>📊 WHY IS THIS A PRIORITY?</p>
        <ul className="space-y-1">
          {rec.evidence.slice(0, expanded ? undefined : 3).map((e, i) => (
            <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--foreground)' }}>
              <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
              {e}
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendation */}
      <div className="mb-4 p-3 rounded-lg border" style={{ background: color + '06', borderColor: color + '30' }}>
        <p className="text-xs font-semibold mb-2" style={{ color }}>💡 RECOMMENDED ACTION</p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
          {expanded ? rec.recommendedAction : rec.recommendedAction.slice(0, 120) + (rec.recommendedAction.length > 120 ? '...' : '')}
        </p>
      </div>

      {expanded && (
        <div className="animate-fade-in space-y-3 mb-4">
          {/* Impact */}
          <div className="p-3 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <p className="text-xs font-semibold text-green-700 mb-1">🎯 EXPECTED IMPACT</p>
            <p className="text-sm text-green-800">{rec.expectedImpact}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            {rec.estimatedCost && (
              <div className="p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--foreground-muted)' }}>Estimated Cost</p>
                <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{rec.estimatedCost}</p>
              </div>
            )}
            {rec.timeframe && (
              <div className="p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--foreground-muted)' }}>Timeframe</p>
                <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{rec.timeframe}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--foreground-muted)' }}>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {(rec.affectedPopulation / 1000000).toFixed(1)}M affected
          </span>
          {rec.estimatedCost && !expanded && (
            <span className="font-medium" style={{ color: 'var(--foreground)' }}>{rec.estimatedCost}</span>
          )}
        </div>
        <button
          className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-blue-600"
          style={{ color: 'var(--accent)' }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Full analysis</>
          )}
        </button>
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [priority, setPriority] = useState<'all' | Priority>('all');
  const [country, setCountry] = useState('all');

  useEffect(() => {
    setLoading(true);
    getRecommendations({ country, priority })
      .then(setRecommendations)
      .finally(() => setLoading(false));
  }, [priority, country]);

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>AI Policy Recommendations</h1>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Explainable AI-generated recommendations with evidence, impact projections, and cost estimates
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
          <Brain className="w-3.5 h-3.5 text-purple-600" />
          <span className="text-xs font-semibold text-purple-700">{recommendations.length} Active Recommendations</span>
        </div>
      </div>

      {/* How AI works note */}
      <div className="p-4 rounded-xl border flex items-start gap-3" style={{ background: '#F5F3FF', borderColor: '#DDD6FE' }}>
        <Zap className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-purple-800">How recommendations are generated</p>
          <p className="text-xs text-purple-700 mt-0.5">
            Each recommendation is produced by combining citizen complaint patterns, geospatial population data, existing infrastructure coverage maps, and historical resolution data. Priority scores are multi-dimensional — not simply based on complaint volume.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--foreground-muted)' }} />

          {PRIORITIES.map(p => (
            <button
              key={p}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                priority === p ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              )}
              onClick={() => setPriority(p)}
            >
              {p === 'all' ? 'All Priorities' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}

          <div className="w-px h-4 bg-slate-200" />

          {COUNTRIES.slice(0, 4).map(c => (
            <button
              key={c}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                country === c ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-100'
              )}
              onClick={() => setCountry(c)}
            >
              {c === 'all' ? '🌐 All' : `${getCountryFlag(c)} ${c}`}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-64 rounded-xl" />)}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="card text-center py-12">
          <Brain className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="font-semibold" style={{ color: 'var(--foreground)' }}>No recommendations match your filters</p>
        </div>
      ) : (
        <div className="space-y-5">
          {recommendations.map(rec => <RecommendationCard key={rec.id} rec={rec} />)}
        </div>
      )}
    </div>
  );
}
