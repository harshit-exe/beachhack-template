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
      return <Phone className="w-4 h-4" />;
    case 'email':
      return <Mail className="w-4 h-4" />;
    case 'whatsapp':
    case 'chat':
      return <MessageSquare className="w-4 h-4" />;
    default:
      return <Phone className="w-4 h-4" />;
  }
}

function getChannelColor(channel: string) {
  switch (channel) {
    case 'phone':
      return 'bg-blue-100 text-blue-600';
    case 'email':
      return 'bg-green-100 text-green-600';
    case 'whatsapp':
      return 'bg-emerald-100 text-emerald-600';
    case 'chat':
      return 'bg-purple-100 text-purple-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function getResolutionBadge(status: string) {
  switch (status) {
    case 'resolved':
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
          <CheckCircle className="w-3 h-3" />
          Resolved
        </span>
      );
    case 'pending':
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case 'escalated':
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
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
          className={star <= rating ? 'text-amber-400' : 'text-gray-300'}
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
    <div className="h-[20vh] bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-600" />
          <h3 className="font-semibold text-gray-900">PAST INTERACTIONS</h3>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border rounded-lg px-2 py-1 bg-white"
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
            <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm border rounded-lg pl-8 pr-3 py-1 w-40"
            />
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-4 h-full">
          {filteredHistory.length === 0 ? (
            <div className="flex items-center justify-center w-full text-gray-400">
              No past interactions found
            </div>
          ) : (
            filteredHistory.map((conv) => (
              <div
                key={conv._id}
                onClick={() => onViewDetails?.(conv._id)}
                className="min-w-[320px] bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col gap-2"
              >
                {/* Channel and Date */}
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getChannelColor(conv.channel)}`}>
                    {getChannelIcon(conv.channel)}
                    {conv.channel.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(conv.createdAt)} at {formatTime(conv.createdAt)}
                  </span>
                </div>

                {/* Summary */}
                <p className="text-sm text-gray-700 line-clamp-2">
                  {conv.summary?.auto || 'No summary available'}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    {getResolutionBadge(conv.resolution?.status || 'pending')}
                    {conv.callDetails?.duration && (
                      <span className="text-xs text-gray-500">
                        Duration: {formatDuration(conv.callDetails.duration)}
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
