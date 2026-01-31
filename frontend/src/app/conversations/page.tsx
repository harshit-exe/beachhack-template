'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import IncomingCallModal from '@/components/IncomingCallModal';
import { Conversation, IncomingCall } from '@/types';
import { 
  Home, 
  MessageSquare, 
  Settings, 
  Shield, 
  Phone,
  Search,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
  PhoneIncoming,
  PhoneOutgoing,
  Mail,
  Star
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const AGENT_ID = 'demo-agent-001';

export default function ConversationsPage() {
  const router = useRouter();
  const { isConnected, goOnline, answerCall, onIncomingCall } = useSocket();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  // Stats
  const stats = {
    total: conversations.length,
    resolved: conversations.filter(c => c.resolution?.status === 'resolved').length,
    pending: conversations.filter(c => c.resolution?.status === 'pending').length,
    escalated: conversations.filter(c => c.resolution?.status === 'escalated').length
  };

  useEffect(() => {
    if (isConnected) goOnline(AGENT_ID);
  }, [isConnected, goOnline]);

  useEffect(() => {
    const unsubIncoming = onIncomingCall?.((data: any) => {
      setIncomingCall({ ...data, conferenceName: data.conferenceName || `call-${data.callId}` });
    });
    return () => unsubIncoming?.();
  }, [onIncomingCall]);

  // Fetch conversations (using calls endpoint as proxy)
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // For demo, create mock data since we don't have a conversations list endpoint
        const mockConversations: Conversation[] = [
          
          {
            _id: '3',
            customer: { _id: 'c3', phoneNumber: '+919876543212', name: 'Amit Kumar', status: 'new' } as any,
            channel: 'phone',
            status: 'completed',
            resolution: { status: 'escalated', notes: 'Technical issue escalated' },
            summary: { auto: 'Service outage reported in Mumbai region' },
            rating: 2,
            createdAt: new Date(Date.now() - 10800000),
            updatedAt: new Date()
          }
        ];
        setConversations(mockConversations);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter(conv => {
    if (statusFilter === 'all') return true;
    return conv.resolution?.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      resolved: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle size={12} /> },
      pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock size={12} /> },
      escalated: { bg: 'bg-rose-100', text: 'text-rose-700', icon: <AlertTriangle size={12} /> }
    };
    const style = styles[status] || styles.pending;
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${style.bg} ${style.text}`}>
        {style.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  const handleAnswerCall = async () => {
    if (!incomingCall) return;
    sessionStorage.setItem('activeCall', JSON.stringify(incomingCall));
    answerCall(incomingCall.callId, AGENT_ID);
    router.push(`/interaction/${incomingCall.callId}`);
    setIncomingCall(null);
  };

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-14 bg-[#0a1128] flex flex-col items-center py-4">
        <div className="w-9 h-9 bg-[#81d8d0]/20 rounded-xl flex items-center justify-center mb-8">
          <Shield size={18} className="text-[#81d8d0]" />
        </div>
        <nav className="flex flex-col items-center gap-4 flex-1">
          <NavIcon icon={<Home size={18} />} href="/" />
          <NavIcon icon={<MessageSquare size={18} />} active href="/conversations" />
          <NavIcon icon={<Users size={18} />} href="/customers" />
          <NavIcon icon={<Phone size={18} />} href="/calls" />
        </nav>
        <NavIcon icon={<Settings size={18} />} href="/settings" />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6">
          <span className="text-slate-900 font-semibold">Conversations</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Search size={14} className="text-slate-400" />
              <span className="text-slate-400 text-sm">Search</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#0a1128] flex items-center justify-center text-[#81d8d0] text-xs font-bold">
              JD
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Calls" value={stats.total} icon={<Phone size={18} />} color="bg-blue-500" />
            <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle size={18} />} color="bg-emerald-500" />
            <StatCard label="Pending" value={stats.pending} icon={<Clock size={18} />} color="bg-amber-500" />
            <StatCard label="Escalated" value={stats.escalated} icon={<AlertTriangle size={18} />} color="bg-rose-500" />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            <Filter size={14} className="text-slate-400" />
            {['all', 'resolved', 'pending', 'escalated'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status ? 'bg-[#0a1128] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Conversations List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-[#81d8d0] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConversations.map(conv => (
                <div
                  key={conv._id}
                  className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-lg hover:border-[#81d8d0] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0a1128] to-slate-700 flex items-center justify-center text-[#81d8d0] font-bold">
                        {conv.customer?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{conv.customer?.name || 'Unknown'}</h3>
                          <span className="text-slate-400 text-sm">•</span>
                          <span className="text-slate-500 text-sm">{conv.customer?.phoneNumber}</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{conv.summary?.auto || 'No summary'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {conv.rating && (
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={14} className={s <= conv.rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                          ))}
                        </div>
                      )}
                      {getStatusBadge(conv.resolution?.status || 'pending')}
                      <span className="text-sm text-slate-400">{formatTime(conv.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <IncomingCallModal
        call={incomingCall}
        onAnswer={handleAnswerCall}
        onDecline={() => setIncomingCall(null)}
        onSendToAI={async () => {
          if (!incomingCall) return;
          // Store call data with AI handling flag
          sessionStorage.setItem('activeCall', JSON.stringify({
            ...incomingCall,
            aiHandling: true
          }));
          await axios.post(`${API_URL}/api/twilio/ai-voice/start`, { 
            callSid: incomingCall.callSid, 
            customer: incomingCall.customer,
            conversationId: incomingCall.callId 
          });
          router.push(`/interaction/${incomingCall.callId}`);
          setIncomingCall(null);
        }}
      />
    </div>
  );
}

function NavIcon({ icon, active = false, href }: { icon: React.ReactNode; active?: boolean; href?: string }) {
  const router = useRouter();
  return (
    <button 
      onClick={() => href && router.push(href)}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
        active ? 'bg-[#81d8d0]/20 text-[#81d8d0]' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
      }`}
    >
      {icon}
    </button>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
