'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Calendar, ChevronRight, Filter, UserCheck, Plus, Sparkles } from 'lucide-react';
import { getMyComplaints } from '@/lib/api';
import type { Complaint, ComplaintStatus, Priority } from '@/types';
import { getPriorityBadgeClass, getStatusColor, getStatusLabel, formatDate, getPriorityLabel, getTimeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

type FilterTab = 'all' | ComplaintStatus;

const filterTabs: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

function ComplaintDetailModal({ complaint, onClose }: { complaint: Complaint; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-mono font-semibold mb-1" style={{ color: 'var(--accent)' }}>{complaint.id}</p>
            <h2 className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{complaint.category}</h2>
          </div>
          <div className="flex gap-2">
            <span className={`badge border ${getStatusColor(complaint.status)}`}>{getStatusLabel(complaint.status)}</span>
            <span className={`badge border ${getPriorityBadgeClass(complaint.priority)}`}>{getPriorityLabel(complaint.priority)}</span>
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-6 p-3 rounded-lg" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
          {complaint.text}
        </p>

        {complaint.aiClassification && (
          <div className="p-3 rounded-lg border mb-6" style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>🤖 AI Classification</p>
            <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>{complaint.aiClassification}</p>
            {complaint.aiConfidence && (
              <p className="text-xs mt-1" style={{ color: '#3B82F6' }}>Confidence: {(complaint.aiConfidence * 100).toFixed(0)}%</p>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--primary)' }}>Progress Timeline</h3>
          <div className="space-y-0">
            {complaint.timeline.map((event, i) => (
              <div key={event.stage} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                    event.completed
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-slate-200 bg-white'
                  )}>
                    {event.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {i < complaint.timeline.length - 1 && (
                    <div className={cn('w-0.5 h-8 my-1', event.completed ? 'bg-blue-300' : 'bg-slate-100')} />
                  )}
                </div>
                <div className="pb-2 flex-1">
                  <p className={cn('text-sm font-medium', event.completed ? 'text-slate-800' : 'text-slate-400')}>
                    {event.label}
                  </p>
                  {event.completedAt && (
                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{formatDate(event.completedAt)}</p>
                  )}
                  {event.note && (
                    <p className="text-xs mt-0.5 italic" style={{ color: 'var(--foreground-muted)' }}>{event.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--foreground-muted)' }}>
            <MapPin className="w-3 h-3" />
            {complaint.location.region}, {complaint.location.country}
          </div>
          <div className="flex items-center gap-1.5 text-xs ml-auto" style={{ color: 'var(--foreground-muted)' }}>
            <Calendar className="w-3 h-3" />
            {formatDate(complaint.createdAt)}
          </div>
        </div>

        <button onClick={onClose} className="btn-secondary w-full mt-4">Close</button>
      </div>
    </div>
  );
}

export default function ComplaintsPage() {
  const { userProfile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    setLoading(true);
    getMyComplaints({ status: activeFilter })
      .then(setComplaints)
      .finally(() => setLoading(false));
  }, [activeFilter, userProfile]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>My Complaints</h1>
            {userProfile && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Firestore Synced
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            {userProfile
              ? `Showing complaints registered for ${userProfile.displayName} (${userProfile.email})`
              : 'Track and manage all your submitted complaints'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/citizen/complain"
            className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            File New Complaint
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--foreground-muted)' }} />
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
        <span className="text-sm ml-auto shrink-0" style={{ color: 'var(--foreground-muted)' }}>
          {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card">
              <div className="skeleton h-4 w-3/4 mb-3" />
              <div className="skeleton h-3 w-1/2 mb-2" />
              <div className="skeleton h-3 w-1/4" />
            </div>
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="card text-center py-12">
          <Filter className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>No complaints found</p>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Try a different filter or submit a new complaint.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map(complaint => (
            <button
              key={complaint.id}
              className="w-full text-left card hover:shadow-md hover:border-blue-200 transition-all group"
              onClick={() => setSelectedComplaint(complaint)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent)' }}>{complaint.id}</span>
                    <span className="badge" style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                      {complaint.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-2 line-clamp-2" style={{ color: 'var(--foreground)' }}>{complaint.text}</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      <MapPin className="w-3 h-3" />
                      {complaint.location.region}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      <Calendar className="w-3 h-3" />
                      {getTimeAgo(complaint.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`badge border ${getStatusColor(complaint.status)}`} style={{ fontSize: '0.7rem' }}>
                    {getStatusLabel(complaint.status)}
                  </span>
                  <span className={`badge border ${getPriorityBadgeClass(complaint.priority)}`} style={{ fontSize: '0.7rem' }}>
                    {getPriorityLabel(complaint.priority)}
                  </span>
                  <ChevronRight className="w-4 h-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedComplaint && (
        <ComplaintDetailModal complaint={selectedComplaint} onClose={() => setSelectedComplaint(null)} />
      )}
    </div>
  );
}
