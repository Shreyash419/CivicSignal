import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Priority, ComplaintStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low': return 'text-green-600 bg-green-50 border-green-200';
  }
}

export function getPriorityDot(priority: Priority): string {
  switch (priority) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
  }
}

export function getPriorityBadgeClass(priority: Priority): string {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-700 border border-red-200';
    case 'high': return 'bg-orange-100 text-orange-700 border border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    case 'low': return 'bg-green-100 text-green-700 border border-green-200';
  }
}

export function getStatusColor(status: ComplaintStatus): string {
  switch (status) {
    case 'submitted': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'under_review': return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'in_progress': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
    case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
  }
}

export function getStatusLabel(status: ComplaintStatus): string {
  switch (status) {
    case 'submitted': return 'Submitted';
    case 'under_review': return 'Under Review';
    case 'in_progress': return 'In Progress';
    case 'resolved': return 'Resolved';
    case 'rejected': return 'Rejected';
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-red-600';
  if (score >= 60) return 'text-orange-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-green-600';
}

export function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-red-500';
  if (score >= 60) return 'bg-orange-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    India: '🇮🇳',
    Brazil: '🇧🇷',
    Russia: '🇷🇺',
    China: '🇨🇳',
    'South Africa': '🇿🇦',
  };
  return flags[country] ?? '🌐';
}

export function getPriorityLabel(priority: Priority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
