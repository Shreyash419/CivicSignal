'use client';

import { useEffect, useState } from 'react';
import { Building, Calendar, MapPin, CheckCircle, Clock, Lightbulb, AlertCircle } from 'lucide-react';
import { getGovernmentPlans } from '@/lib/api';
import type { GovernmentPlan, ProjectStatus } from '@/types';
import { getCountryFlag } from '@/lib/utils';
import { cn } from '@/lib/utils';

const statusConfig: Record<ProjectStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  planned: { label: 'Planned', color: '#2563EB', bg: '#EFF6FF', icon: Clock },
  in_progress: { label: 'In Progress', color: '#EA580C', bg: '#FFF7ED', icon: AlertCircle },
  completed: { label: 'Completed', color: '#16A34A', bg: '#F0FDF4', icon: CheckCircle },
  recommended: { label: 'AI Recommended', color: '#7C3AED', bg: '#F5F3FF', icon: Lightbulb },
};

const filterTabs: { value: 'all' | ProjectStatus; label: string }[] = [
  { value: 'all', label: 'All Projects' },
  { value: 'in_progress', label: 'Active' },
  { value: 'planned', label: 'Planned' },
  { value: 'completed', label: 'Completed' },
  { value: 'recommended', label: 'AI Recommended' },
];

export default function CitizenPlansPage() {
  const [plans, setPlans] = useState<GovernmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | ProjectStatus>('all');

  useEffect(() => {
    getGovernmentPlans('REG-001')
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeFilter === 'all' ? plans : plans.filter(p => p.status === activeFilter);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--primary)' }}>Government Plans</h1>
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          Existing, planned, and recommended projects in your area
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeFilter === tab.value
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            )}
            onClick={() => setActiveFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-36 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Building className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="font-semibold" style={{ color: 'var(--foreground)' }}>No projects found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(plan => {
            const config = statusConfig[plan.status];
            const StatusIcon = config.icon;
            return (
              <div key={plan.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className="badge border"
                        style={{ background: config.bg, color: config.color, borderColor: config.color + '40', fontSize: '0.7rem' }}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                      <span className="badge" style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.7rem' }}>
                        {plan.category}
                      </span>
                      {plan.status === 'recommended' && (
                        <span className="badge" style={{ background: '#F5F3FF', color: '#7C3AED', fontSize: '0.7rem' }}>
                          🤖 AI Generated
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--primary)' }}>{plan.name}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{plan.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                    <MapPin className="w-3 h-3" />
                    {getCountryFlag(plan.country)} {plan.regionName}, {plan.country}
                  </div>
                  {plan.expectedCompletion && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      <Calendar className="w-3 h-3" />
                      Expected: {new Date(plan.expectedCompletion).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}
                    </div>
                  )}
                  {plan.estimatedBudget && (
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                      💰 {plan.estimatedBudget}
                    </div>
                  )}
                  {plan.beneficiaries && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      👥 {(plan.beneficiaries / 1000000).toFixed(1)}M beneficiaries
                    </div>
                  )}
                </div>

                {/* Demand vs Investment */}
                {plan.alignmentGap !== undefined && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Citizen Demand</span>
                          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{plan.citizenDemandScore}%</span>
                        </div>
                        <div className="score-bar">
                          <div className="score-bar-fill bg-blue-500" style={{ width: `${plan.citizenDemandScore}%` }} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Government Investment</span>
                          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{plan.governmentInvestmentScore}%</span>
                        </div>
                        <div className="score-bar">
                          <div className="score-bar-fill bg-green-500" style={{ width: `${plan.governmentInvestmentScore}%` }} />
                        </div>
                      </div>
                    </div>
                    {plan.alignmentGap > 20 && (
                      <p className="text-xs mt-2 font-medium text-orange-600">
                        ⚠️ High demand, low investment gap detected (+{plan.alignmentGap} points)
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
