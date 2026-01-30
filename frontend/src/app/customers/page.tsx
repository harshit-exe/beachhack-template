'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import IncomingCallModal from '@/components/IncomingCallModal';
import { Customer, IncomingCall } from '@/types';
import { customersApi } from '@/lib/api';
import { 
  Home, 
  MessageSquare, 
  Settings, 
  Shield, 
  Phone,
  Search,
  Users,
  Mail,
  Star,
  Wallet,
  Crown,
  UserPlus,
  AlertCircle,
  ChevronRight,
  Filter
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const AGENT_ID = 'demo-agent-001';

export default function CustomersPage() {
  const router = useRouter();
  const { isConnected, goOnline, answerCall, onIncomingCall } = useSocket();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  // Go online
  useEffect(() => {
    if (isConnected) {
      goOnline(AGENT_ID);
    }
  }, [isConnected, goOnline]);

  // Listen for incoming calls
  useEffect(() => {
    const unsubIncoming = onIncomingCall?.((data: any) => {
      setIncomingCall({
        ...data,
        conferenceName: data.conferenceName || `call-${data.callId}`
      });
    });
    return () => unsubIncoming?.();
  }, [onIncomingCall]);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await customersApi.getAll(1, 100);
        if (res.data.success) {
          setCustomers(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchQuery || 
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phoneNumber.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      vip: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Crown size={10} /> },
      active: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: null },
      new: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <UserPlus size={10} /> },
      churned: { bg: 'bg-slate-100', text: 'text-slate-500', icon: null },
      blocked: { bg: 'bg-rose-100', text: 'text-rose-700', icon: <AlertCircle size={10} /> }
    };
    const style = styles[status] || styles.active;
    return (
      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${style.bg} ${style.text}`}>
        {style.icon}
        {status}
      </span>
    );
  };

  const handleAnswerCall = async () => {
    if (!incomingCall) return;
    sessionStorage.setItem('activeCall', JSON.stringify(incomingCall));
    answerCall(incomingCall.callId, AGENT_ID);
    router.push(`/interaction/${incomingCall.callId}`);
    setIncomingCall(null);
  };

  const handleDeclineCall = () => setIncomingCall(null);

  const handleSendToAI = async () => {
    if (!incomingCall) return;
    try {
      // Store call data with AI handling flag for monitoring
      sessionStorage.setItem('activeCall', JSON.stringify({
        ...incomingCall,
        aiHandling: true
      }));
      
      await axios.post(`${API_URL}/api/twilio/ai-voice/start`, {
        callSid: incomingCall.callSid,
        customer: incomingCall.customer,
        conversationId: incomingCall.callId
      });
      
      // Navigate to interaction page to monitor
      router.push(`/interaction/${incomingCall.callId}`);
      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to forward to AI:', error);
    }
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
          <NavIcon icon={<MessageSquare size={18} />} href="/conversations" />
          <NavIcon icon={<Users size={18} />} active href="/customers" />
          <NavIcon icon={<Phone size={18} />} href="/calls" />
        </nav>
        <NavIcon icon={<Settings size={18} />} href="/settings" />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6">
          <span className="text-slate-900 font-semibold">Customers</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none w-48"
              />
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#0a1128] flex items-center justify-center text-[#81d8d0] text-xs font-bold">
              JD
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <span className="text-sm text-slate-500">Status:</span>
            </div>
            {['all', 'vip', 'active', 'new', 'churned'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status 
                    ? 'bg-[#0a1128] text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
            <span className="ml-auto text-sm text-slate-400">
              {filteredCustomers.length} customers
            </span>
          </div>

          {/* Customer Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-[#81d8d0] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Users size={48} className="mb-4 opacity-50" />
              <p>No customers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map(customer => (
                <div
                  key={customer._id}
                  onClick={() => router.push(`/customers/${customer._id}`)}
                  className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-lg hover:border-[#81d8d0] transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0a1128] to-slate-700 flex items-center justify-center text-[#81d8d0] font-bold">
                        {customer.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{customer.name || 'Unknown'}</h3>
                        <p className="text-sm text-slate-400">{customer.phoneNumber}</p>
                      </div>
                    </div>
                    {getStatusBadge(customer.status)}
                  </div>

                  <div className="space-y-2 mb-4">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Mail size={12} />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-900 font-semibold">
                        <Phone size={12} className="text-[#81d8d0]" />
                        {customer.metadata?.totalCalls || 0}
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase">Calls</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-900 font-semibold">
                        <Star size={12} className="text-amber-400" />
                        {customer.metadata?.averageRating?.toFixed(1) || '0.0'}
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase">Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-900 font-semibold">
                        <Wallet size={12} className="text-emerald-500" />
                        ₹{((customer.metadata?.lifetimeValue || 0) / 1000).toFixed(0)}k
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase">LTV</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end mt-3 text-[#81d8d0] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details <ChevronRight size={14} />
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
        onDecline={handleDeclineCall}
        onSendToAI={handleSendToAI}
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
