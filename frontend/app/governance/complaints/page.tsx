'use client';

// ============================================================
// CivicSignal — Governance Citizen Complaints Dataset & Live Feed
// Real-time citizen complaints stream from Firebase Firestore
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Filter,
  Search,
  MapPin,
  Calendar,
  User,
  Mail,
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Volume2,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { getAllRealCitizenComplaints, updateComplaintStatusInFirestore } from '@/lib/firebaseComplaints';
import { mockComplaints } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';
import type { Complaint, ComplaintStatus, Country } from '@/types';
import {
  getPriorityBadgeClass,
  getStatusColor,
  getStatusLabel,
  formatDate,
  getTimeAgo,
  getPriorityLabel,
} from '@/lib/utils';
import { cn } from '@/lib/utils';

const categories = [
  'All',
  'Roads & Transport',
  'Healthcare',
  'Water & Sanitation',
  'Electricity',
  'Education',
  'Digital Connectivity',
  'Public Safety',
  'Environment',
  'Other',
];

const statusOptions: { value: ComplaintStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted (New)' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default function GovernanceComplaintsPage() {
  const { userProfile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const isDemo = !userProfile || userProfile.uid.startsWith('gov-demo') || userProfile.email.includes('elena.rossi') || userProfile.displayName === 'Dr. Elena Rossi';

  const fetchComplaints = async () => {
    try {
      if (isDemo) {
        // DEMO OFFICIAL: Display ONLY mock demo dataset
        let list = [...mockComplaints];
        if (selectedCategory !== 'All') {
          list = list.filter(c => c.category === selectedCategory);
        }
        if (selectedStatus !== 'all') {
          list = list.filter(c => c.status === selectedStatus);
        }
        if (selectedCountry !== 'All') {
          list = list.filter(c => c.location?.country === selectedCountry);
        }
        setComplaints(list);
      } else {
        // REAL GOVERNMENT OFFICIAL: Display ONLY live Firestore citizen dataset
        const data = await getAllRealCitizenComplaints({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          country: selectedCountry !== 'All' ? selectedCountry : undefined,
        });
        setComplaints(data);
      }
    } catch (e) {
      console.warn('Error fetching governance complaints dataset:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchComplaints();
  }, [selectedCategory, selectedStatus, selectedCountry, userProfile]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const handleStatusChange = async (id: string, newStatus: ComplaintStatus) => {
    setUpdatingId(id);
    try {
      await updateComplaintStatusInFirestore(id, newStatus, `Status updated by ${userProfile?.displayName || 'Municipal Official'}`);
      setUpdateMessage(`Complaint ${id} status updated to "${getStatusLabel(newStatus)}"`);
      setTimeout(() => setUpdateMessage(null), 3500);
      await fetchComplaints();
    } catch (e) {
      console.error('Failed to update complaint status:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter complaints by search query
  const filteredComplaints = complaints.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      c.text.toLowerCase().includes(q) ||
      (c.citizenName && c.citizenName.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q)) ||
      (c.location?.region && c.location.region.toLowerCase().includes(q))
    );
  });

  const totalSubmitted = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'submitted' || c.status === 'under_review').length;
  const inProgressCount = complaints.filter(c => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
              Citizen Complaints Dataset
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Firestore Inflow
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Real-time feed of categorized grievances submitted by verified citizens across municipal jurisdictions.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
          Refresh Dataset
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs font-medium mb-1 text-slate-500 uppercase tracking-wider">Total Complaints</p>
          <p className="text-2xl font-bold text-slate-900">{totalSubmitted}</p>
          <p className="text-[11px] text-blue-600 mt-1">Real Citizen Records</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium mb-1 text-slate-500 uppercase tracking-wider">Pending Action</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-[11px] text-amber-700 mt-1">Submitted / Under Review</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium mb-1 text-slate-500 uppercase tracking-wider">Active Work</p>
          <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
          <p className="text-[11px] text-blue-700 mt-1">Assigned to Field Teams</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium mb-1 text-slate-500 uppercase tracking-wider">Resolved</p>
          <p className="text-2xl font-bold text-emerald-600">{resolvedCount}</p>
          <p className="text-[11px] text-emerald-700 mt-1">Closed & Verified</p>
        </div>
      </div>

      {/* Update Message Notification */}
      {updateMessage && (
        <div className="p-3.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-scale-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{updateMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ID, citizen name, category, or issue description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-9 text-xs w-full"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="input-field text-xs md:w-44"
          >
            {statusOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Country Dropdown */}
          <select
            value={selectedCountry}
            onChange={e => setSelectedCountry(e.target.value)}
            className="input-field text-xs md:w-36"
          >
            {['All', 'India', 'Brazil', 'Russia', 'China', 'South Africa'].map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Countries' : c}</option>
            ))}
          </select>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          <span className="text-xs font-semibold text-slate-500 mr-1 shrink-0">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints List / Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-5">
              <div className="skeleton h-4 w-1/3 mb-3" />
              <div className="skeleton h-3 w-3/4 mb-2" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="card text-center py-16 px-4">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Real Citizen Complaints Match Filters</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            {complaints.length === 0
              ? 'No citizen complaints have been filed in Firestore yet. When a citizen submits a complaint from the citizen portal, it will instantly stream here.'
              : 'Try clearing your search query or selecting a different category/status filter.'}
          </p>
          <Link
            href="/citizen/complain"
            className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
          >
            File a Test Complaint as Citizen &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComplaints.map(complaint => (
            <div
              key={complaint.id}
              className="card p-5 hover:shadow-md transition-all border border-slate-200 rounded-xl bg-white"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-blue-700">
                      {complaint.id}
                    </span>
                    <span className="badge" style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: '0.75rem', fontWeight: 600 }}>
                      {complaint.category}
                    </span>
                    <span className={`badge border ${getPriorityBadgeClass(complaint.priority)}`} style={{ fontSize: '0.7rem' }}>
                      {getPriorityLabel(complaint.priority)} (Severity: {complaint.severity}/10)
                    </span>
                    {complaint.aiClassification && (
                      <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-100">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        AI: {complaint.aiClassification}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-900 mb-2 leading-relaxed">
                    {complaint.text}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1 font-medium text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{complaint.citizenName || 'Verified Citizen'}</span>
                    </div>

                    {complaint.citizenEmail && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{complaint.citizenEmail}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{complaint.location.region}, {complaint.location.country}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(complaint.createdAt)} ({getTimeAgo(complaint.createdAt)})</span>
                    </div>

                    {complaint.audioUrl && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                        <Volume2 className="w-3 h-3" /> Voice Attached
                      </span>
                    )}

                    {complaint.mediaUrls && complaint.mediaUrls.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">
                        <ImageIcon className="w-3 h-3" /> {complaint.mediaUrls.length} Photo(s)
                      </span>
                    )}
                  </div>
                </div>

                {/* Government Official Action Control */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Status:</span>
                    <select
                      value={complaint.status}
                      disabled={updatingId === complaint.id}
                      onChange={e => handleStatusChange(complaint.id, e.target.value as ComplaintStatus)}
                      className={cn(
                        'text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none transition-all',
                        getStatusColor(complaint.status)
                      )}
                    >
                      <option value="submitted">Submitted (New)</option>
                      <option value="under_review">Under Review</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  {updatingId === complaint.id && (
                    <span className="text-[11px] text-indigo-600 flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" /> Saving in Firestore...
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
