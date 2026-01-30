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
      return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
    case 'new':
      return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    case 'churned':
      return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    case 'blocked':
      return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
    default:
      return 'bg-gray-500 text-white';
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
      <div className="h-[15vh] bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex items-center justify-center">
        <p className="text-gray-500">No customer selected</p>
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
    <div className="h-[15vh] bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="h-full p-4 flex gap-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {customer.name || 'New Customer'}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(customer.status)}`}>
                {getStatusIcon(customer.status)}
                {customer.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {customer.phoneNumber}
              </span>
              {hasCompany && (
                <span className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {customer.metadata?.company}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Since: {formatDate(customer.metadata?.firstContactDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 px-6 border-l border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-blue-600">
              <Phone className="w-5 h-5" />
              {customer.metadata?.totalCalls || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total Calls</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-500">
              <Star className="w-5 h-5" />
              {customer.metadata?.averageRating?.toFixed(1) || '0.0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Rating</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
              <Wallet className="w-5 h-5" />
              ₹{(customer.metadata?.lifetimeValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">LTV</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              {getTimeAgo(customer.metadata?.lastContactDate)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Last Contact</p>
          </div>
        </div>

        {/* Previous Context & Insights */}
        <div className="flex-1 flex flex-col gap-2 px-4 border-l border-gray-200 overflow-hidden">
          {/* Previous call notes - most important! */}
          {hasNotes && (
            <div className="flex items-start gap-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
              <FileText className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-purple-700">Previous Call Notes:</p>
                <p className="text-sm text-purple-800 line-clamp-1">{customer.metadata?.notes}</p>
              </div>
            </div>
          )}
          
          {/* Scheduled meeting */}
          {hasScheduledMeeting && (
            <div className="flex items-start gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              <Clock className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-700">Scheduled Meeting:</p>
                <p className="text-sm text-green-800 line-clamp-1">{customer.metadata?.scheduledMeeting}</p>
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
            <div className="flex items-start gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 line-clamp-1">
                {customer.insights![customer.insights!.length - 1].description}
              </p>
            </div>
          )}
          
          {/* Empty state */}
          {!hasNotes && !hasScheduledMeeting && !hasAlerts && !hasInsights && (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              First time caller - no previous context
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
