'use client';

import { useEffect, useState } from 'react';
import { getAllGovernmentPlans } from '@/lib/api';
import type { GovernmentPlan, ProjectStatus } from '@/types';
import { getCountryFlag } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Building, AlertTriangle, CheckCircle, Clock, Lightbulb, Calendar, TrendingUp, TrendingDown, Filter } from 'lucide-react';

const STATUS_FILTERS: ('all' | ProjectStatus)[] = ['all', 'in_progress', 'planned', 'completed', 'recommended'];
const COUNTRIES = ['all', 'India', 'Brazil', 'Russia', 'China', 'South Africa'];

const statusConfig: Record<ProjectStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  planned: { label: 'Planned', color: '#2563EB', bg: '#EFF6FF', icon: Clock },
  in_progress: { label: 'Active', color: '#EA580C', bg: '#FFF7ED', icon: AlertTriangle },
  completed: { label: 'Completed', color: '#16A34A', bg: '#F0FDF4', icon: CheckCircle },
  recommended: { label: 'AI Recommended', color: '#7C3AED', bg: '#F5F3FF', icon: Lightbulb },
};

export default function GovernancePlansPage() {
  const [plans, setPlans] = useState<GovernmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'all' | ProjectStatus>('all');
  const [country, setCountry] = useState('all');

  useEffect(() => {
    setLoading(true);
    getAllGovernmentPlans({ status, country })
      .then(setPlans)
      .finally(() => setLoading(false));
  }, [status, country]);

  // Separate high mismatch plans
  const mismatched = plans.filter(p => (p.alignmentGap ?? 0) > 30);

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>Government Plans</h1>
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          Monitor existing projects and identify mismatches between citizen demand and government investment
        </p>
      </div>

      {/* Mismatch alert */}
      {mismatched.length > 0 && (
        <div className="p-4 rounded-xl border" style={{ background: '#FFF7ED', borderColor: '#FED7AA' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-orange-800">Demand-Investment Mismatches Detected</p>
              <p className="text-xs text-orange-700 mt-0.5 mb-3">
                {mismatched.length} project area{mismatched.length > 1 ? 's have' : ' has'} high citizen demand but low government investment — these may require budget reallocation.
              </p>
              <div className="flex flex-wrap gap-2">
                {mismatched.map(p => (
                  <span key={p.id} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: '#FED7AA', color: '#9A3412' }}>
                    {getCountryFlag(p.country)} {p.regionName} · {p.category} (+{p.alignmentGap} gap)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--foreground-muted)' }} />
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  status === s ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                )}
                onClick={() => setStatus(s)}
              >
                {s === 'all' ? 'All Projects' : statusConfig[s as ProjectStatus].label}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          {COUNTRIES.map(c => (
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

      {/* Stats row */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(['in_progress', 'planned', 'completed', 'recommended'] as ProjectStatus[]).map(s => {
            const count = plans.filter(p => p.status === s).length;
            const cfg = statusConfig[s];
            const Icon = cfg.icon;
            return (
              <div key={s} className="card flex items-center gap-3">
                <div className="p-2 rounded-lg flex-shrink-0" style={{ background: cfg.bg }}>
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: 'var(--primary)' }}>{count}</p>
                  <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{cfg.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plans */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="card text-center py-12">
          <Building className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="font-semibold" style={{ color: 'var(--foreground)' }}>No projects match your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => {
            const cfg = statusConfig[plan.status];
            const StatusIcon = cfg.icon;
            const hasMismatch = (plan.alignmentGap ?? 0) > 20;
            const hasInvestmentSurplus = (plan.alignmentGap ?? 0) < -10;
            return (
              <div key={plan.id} className={cn('card hover:shadow-md transition-all', hasMismatch && 'border-orange-200')}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className="badge border"
                        style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color + '50', fontSize: '0.7rem' }}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      <span className="badge" style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.7rem' }}>{plan.category}</span>
                      {plan.status === 'recommended' && (
                        <span className="badge" style={{ background: '#F5F3FF', color: '#7C3AED', fontSize: '0.7rem' }}>🤖 AI Suggested</span>
                      )}
                      {hasMismatch && (
                        <span className="badge" style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', fontSize: '0.7rem' }}>
                          ⚠️ High Demand Gap
                        </span>
                      )}
                      {hasInvestmentSurplus && (
                        <span className="badge" style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', fontSize: '0.7rem' }}>
                          ✓ Over-invested
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base mb-1" style={{ color: 'var(--primary)' }}>{plan.name}</h3>
                    <p className="text-sm mb-3" style={{ color: 'var(--foreground-muted)' }}>{plan.description}</p>

                    <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      <span>{getCountryFlag(plan.country)} {plan.regionName}, {plan.country}</span>
                      {plan.expectedCompletion && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(plan.expectedCompletion).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {plan.estimatedBudget && <span className="font-medium" style={{ color: 'var(--foreground)' }}>💰 {plan.estimatedBudget}</span>}
                      {plan.beneficiaries && <span>👥 {(plan.beneficiaries / 1000000).toFixed(1)}M beneficiaries</span>}
                    </div>
                  </div>

                  {/* Demand vs Investment visual */}
                  <div className="w-full sm:w-48 flex-shrink-0">
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--foreground-muted)' }}>Demand vs Investment</p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Citizen Demand</span>
                          <span className="text-xs font-bold text-blue-700">{plan.citizenDemandScore}%</span>
                        </div>
                        <div className="score-bar">
                          <div className="score-bar-fill bg-blue-500" style={{ width: `${plan.citizenDemandScore}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Govt Investment</span>
                          <span className="text-xs font-bold text-green-700">{plan.governmentInvestmentScore}%</span>
                        </div>
                        <div className="score-bar">
                          <div className="score-bar-fill bg-green-500" style={{ width: `${plan.governmentInvestmentScore}%` }} />
                        </div>
                      </div>
                      {plan.alignmentGap !== undefined && (
                        <div className={cn(
                          'flex items-center gap-1 text-xs font-semibold mt-1',
                          hasMismatch ? 'text-orange-600' : hasInvestmentSurplus ? 'text-green-600' : 'text-slate-500'
                        )}>
                          {hasMismatch
                            ? <><TrendingUp className="w-3 h-3" /> +{plan.alignmentGap} demand gap</>
                            : hasInvestmentSurplus
                            ? <><TrendingDown className="w-3 h-3" /> {plan.alignmentGap} (over-invested)</>
                            : '✓ Well aligned'
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
