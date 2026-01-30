'use client';

import { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { Conversation } from '@/types';

interface InteractionHistoryProps {
  history: Conversation[];
  onViewDetails?: (conversationId: string) => void;
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case 'phone':
      return <Phone className="w-3.5 h-3.5" />;
    case 'email':
      return <Mail className="w-3.5 h-3.5" />;
    case 'whatsapp':
    case 'chat':
      return <MessageSquare className="w-3.5 h-3.5" />;
    default:
      return <Phone className="w-3.5 h-3.5" />;
  }
}

function getChannelColor(channel: string) {
  switch (channel) {
    case 'phone':
      return 'bg-[#0a1128] text-[#81d8d0]';
    case 'email':
      return 'bg-emerald-100 text-emerald-700';
    case 'whatsapp':
      return 'bg-emerald-100 text-emerald-700';
    case 'chat':
      return 'bg-[#81d8d0]/20 text-[#0a1128]';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function getResolutionBadge(status: string) {
  switch (status) {
    case 'resolved':
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
          <CheckCircle className="w-3 h-3" />
          Resolved
        </span>
      );
    case 'pending':
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case 'escalated':
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
          <AlertTriangle className="w-3 h-3" />
          Escalated
        </span>
      );
    default:
      return null;
  }
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function renderStars(rating: number | undefined) {
  if (!rating) return null;
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <span 
          key={star} 
          className={star <= rating ? 'text-amber-400' : 'text-slate-200'}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function InteractionHistory({ 
  history = [],
  onViewDetails 
}: InteractionHistoryProps) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = history.filter(conv => {
    if (filter !== 'all' && conv.channel !== filter) return false;
    if (searchQuery && conv.summary?.auto && !conv.summary.auto.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="h-[20vh] bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#0a1128]" />
          <h3 className="text-xs font-bold text-[#0a1128] uppercase tracking-wider">Past Interactions</h3>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs font-medium border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-[#0a1128] focus:outline-none focus:border-[#81d8d0]"
            >
              <option value="all">All Channels</option>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="chat">Chat</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs font-medium border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 w-36 focus:outline-none focus:border-[#81d8d0]"
            />
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
        <div className="flex gap-4 p-4 h-full">
          {filteredHistory.length === 0 ? (
            <div className="flex items-center justify-center w-full text-slate-400 text-sm">
              No past interactions found
            </div>
          ) : (
            filteredHistory.map((conv) => (
              <div
                key={conv._id}
                onClick={() => onViewDetails?.(conv._id)}
                className="min-w-[300px] bg-slate-50 rounded-xl border border-slate-100 p-4 hover:shadow-md hover:border-[#81d8d0] transition-all cursor-pointer flex flex-col gap-2"
              >
                {/* Channel and Date */}
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getChannelColor(conv.channel)}`}>
                    {getChannelIcon(conv.channel)}
                    {conv.channel}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {formatDate(conv.createdAt)} at {formatTime(conv.createdAt)}
                  </span>
                </div>

                {/* Summary */}
                <p className="text-sm text-[#0a1128] line-clamp-2 font-medium">
                  {conv.summary?.auto || 'No summary available'}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    {getResolutionBadge(conv.resolution?.status || 'pending')}
                    {conv.callDetails?.duration && (
                      <span className="text-[10px] font-medium text-slate-400">
                        {formatDuration(conv.callDetails.duration)}
                      </span>
                    )}
                  </div>
                  {renderStars(conv.rating)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
