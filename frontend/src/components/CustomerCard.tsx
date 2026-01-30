'use client';

import { 
  User, 
  Phone, 
  Star, 
  Wallet, 
  Calendar, 
  AlertTriangle, 
  Lightbulb,
  Crown,
  UserPlus,
  AlertCircle,
  Building,
  Clock,
  FileText
} from 'lucide-react';
import { Customer } from '@/types';

interface CustomerCardProps {
  customer: Customer | null;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'vip':
      return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white';
    case 'active':
      return 'bg-[#81d8d0] text-[#0a1128]';
    case 'new':
      return 'bg-[#0a1128] text-[#81d8d0]';
    case 'churned':
      return 'bg-slate-400 text-white';
    case 'blocked':
      return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
    default:
      return 'bg-slate-500 text-white';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'vip':
      return <Crown className="w-3 h-3" />;
    case 'new':
      return <UserPlus className="w-3 h-3" />;
    case 'blocked':
      return <AlertCircle className="w-3 h-3" />;
    default:
      return null;
  }
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { 
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getTimeAgo(date: Date | string | undefined): string {
  if (!date) return 'Never';
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return formatDate(date);
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  if (!customer) {
    return (
      <div className="h-[15vh] bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center justify-center">
        <p className="text-slate-400">No customer selected</p>
      </div>
    );
  }

  const initials = customer.name 
    ? customer.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : customer.phoneNumber.slice(-2);

  const hasNotes = customer.metadata?.notes;
  const hasScheduledMeeting = customer.metadata?.scheduledMeeting;
  const hasCompany = customer.metadata?.company;
  const hasAlerts = customer.alerts && customer.alerts.length > 0;
  const hasInsights = customer.insights && customer.insights.length > 0;

  return (
    <div className="h-[15vh] bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-full p-4 flex gap-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[#0a1128] to-slate-700 rounded-xl flex items-center justify-center text-[#81d8d0] text-lg font-bold shadow-lg">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-[#0a1128]">
                {customer.name || 'New Customer'}
              </h2>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${getStatusColor(customer.status)}`}>
                {getStatusIcon(customer.status)}
                {customer.status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {customer.phoneNumber}
              </span>
              {hasCompany && (
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  {customer.metadata?.company}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Since: {formatDate(customer.metadata?.firstContactDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 px-6 border-l border-slate-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xl font-bold text-[#0a1128]">
              <Phone className="w-4 h-4 text-[#81d8d0]" />
              {customer.metadata?.totalCalls || 0}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Calls</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xl font-bold text-[#0a1128]">
              <Star className="w-4 h-4 text-amber-400" />
              {customer.metadata?.averageRating?.toFixed(1) || '0.0'}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Rating</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xl font-bold text-[#0a1128]">
              <Wallet className="w-4 h-4 text-emerald-500" />
              ₹{(customer.metadata?.lifetimeValue || 0).toLocaleString()}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">LTV</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#0a1128]">
              {getTimeAgo(customer.metadata?.lastContactDate)}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Last Contact</p>
          </div>
        </div>

        {/* Previous Context & Insights */}
        <div className="flex-1 flex flex-col gap-2 px-4 border-l border-slate-100 overflow-hidden">
          {/* Previous call notes - most important! */}
          {hasNotes && (
            <div className="flex items-start gap-2 bg-[#81d8d0]/10 px-3 py-2 rounded-lg border border-[#81d8d0]/30">
              <FileText className="w-4 h-4 text-[#0a1128] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#0a1128] uppercase tracking-wider">Previous Notes:</p>
                <p className="text-sm text-[#0a1128] line-clamp-1">{customer.metadata?.notes}</p>
              </div>
            </div>
          )}
          
          {/* Scheduled meeting */}
          {hasScheduledMeeting && (
            <div className="flex items-start gap-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
              <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Meeting:</p>
                <p className="text-sm text-emerald-800 line-clamp-1">{customer.metadata?.scheduledMeeting}</p>
              </div>
            </div>
          )}
          
          {/* Alerts */}
          {hasAlerts && (
            <div className="flex items-start gap-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 line-clamp-1">
                {customer.alerts![customer.alerts!.length - 1].message}
              </p>
            </div>
          )}
          
          {/* Insights */}
          {hasInsights && (
            <div className="flex items-start gap-2 bg-[#0a1128]/5 px-3 py-2 rounded-lg border border-[#0a1128]/10">
              <Lightbulb className="w-4 h-4 text-[#0a1128] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#0a1128] line-clamp-1">
                {customer.insights![customer.insights!.length - 1].description}
              </p>
            </div>
          )}
          
          {/* Empty state */}
          {!hasNotes && !hasScheduledMeeting && !hasAlerts && !hasInsights && (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              First time caller - no previous context
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
