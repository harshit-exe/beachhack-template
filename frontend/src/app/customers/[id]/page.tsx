'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import IncomingCallModal from '@/components/IncomingCallModal';
import { Customer, Conversation, IncomingCall } from '@/types';
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
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  PhoneCall,
  FileText
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const AGENT_ID = 'demo-agent-001';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  
  const { isConnected, goOnline, answerCall, onIncomingCall } = useSocket();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  useEffect(() => {
    if (isConnected) goOnline(AGENT_ID);
  }, [isConnected, goOnline]);

  useEffect(() => {
    const unsubIncoming = onIncomingCall?.((data: any) => {
      setIncomingCall({ ...data, conferenceName: data.conferenceName || `call-${data.callId}` });
    });
    return () => unsubIncoming?.();
  }, [onIncomingCall]);

  // Fetch customer
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await customersApi.getById(customerId);
        if (res.data.success) {
          setCustomer(res.data.data);
        }
        // Fetch history
        const historyRes = await customersApi.getHistory(customerId);
        if (historyRes.data.success) {
          setConversations(historyRes.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch customer:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [customerId]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      vip: { bg: 'bg-amber-100', text: 'text-amber-700' },
      active: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      new: { bg: 'bg-blue-100', text: 'text-blue-700' },
      churned: { bg: 'bg-slate-100', text: 'text-slate-500' },
      blocked: { bg: 'bg-rose-100', text: 'text-rose-700' }
    };
    const style = styles[status] || styles.active;
    return (
      <span className={`px-3 py-1.5 rounded-lg text-sm font-bold uppercase ${style.bg} ${style.text}`}>
        {status === 'vip' && <Crown size={14} className="inline mr-1" />}
        {status}
      </span>
    );
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-IN', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  const handleAnswerCall = async () => {
    if (!incomingCall) return;
    sessionStorage.setItem('activeCall', JSON.stringify(incomingCall));
    answerCall(incomingCall.callId, AGENT_ID);
    router.push(`/interaction/${incomingCall.callId}`);
    setIncomingCall(null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#81d8d0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-amber-400 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900">Customer not found</h2>
          <button onClick={() => router.push('/customers')} className="mt-4 text-[#81d8d0] font-medium">
            ← Back to Customers
          </button>
        </div>
      </div>
    );
  }

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
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/customers')} className="text-slate-400 hover:text-slate-600">
              <ArrowLeft size={20} />
            </button>
            <span className="text-slate-900 font-semibold">Customer Details</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 flex items-center gap-2">
              <Edit size={14} /> Edit
            </button>
            <button className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 flex items-center gap-2">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Customer Header Card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0a1128] to-slate-700 flex items-center justify-center text-[#81d8d0] font-bold text-2xl">
                    {customer.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-bold text-slate-900">{customer.name || 'Unknown'}</h1>
                      {getStatusBadge(customer.status)}
                    </div>
                    <p className="text-slate-500">{customer.metadata?.company || 'No company'}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-[#81d8d0] text-[#0a1128] rounded-xl font-semibold flex items-center gap-2 hover:bg-[#6bc4bc] transition-colors">
                  <PhoneCall size={16} /> Call Customer
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Info */}
              <div className="col-span-2 space-y-6">
                {/* Contact Info */}
                <div className="bg-white rounded-xl border border-slate-100 p-5">
                  <h3 className="font-semibold text-slate-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Phone size={18} className="text-[#81d8d0]" />
                      <div>
                        <p className="text-xs text-slate-400 uppercase">Phone</p>
                        <p className="text-slate-900 font-medium">{customer.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Mail size={18} className="text-[#81d8d0]" />
                      <div>
                        <p className="text-xs text-slate-400 uppercase">Email</p>
                        <p className="text-slate-900 font-medium">{customer.email || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {customer.metadata?.notes && (
                  <div className="bg-white rounded-xl border border-slate-100 p-5">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <FileText size={16} /> Notes
                    </h3>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{customer.metadata.notes}</p>
                  </div>
                )}

                {/* Interaction History */}
                <div className="bg-white rounded-xl border border-slate-100 p-5">
                  <h3 className="font-semibold text-slate-900 mb-4">Call History</h3>
                  {conversations.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Phone size={32} className="mx-auto opacity-50 mb-2" />
                      <p>No call history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conversations.slice(0, 5).map((conv, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#0a1128] flex items-center justify-center text-[#81d8d0]">
                              <Phone size={16} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{conv.summary?.auto || 'Call'}</p>
                              <p className="text-sm text-slate-400">{formatDate(conv.createdAt)}</p>
                            </div>
                          </div>
                          {conv.resolution?.status === 'resolved' ? (
                            <CheckCircle size={18} className="text-emerald-500" />
                          ) : (
                            <Clock size={18} className="text-amber-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Stats */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-100 p-5">
                  <h3 className="font-semibold text-slate-900 mb-4">Statistics</h3>
                  <div className="space-y-4">
                    <StatRow icon={<Phone size={16} />} label="Total Calls" value={customer.metadata?.totalCalls || 0} />
                    <StatRow icon={<Star size={16} />} label="Avg Rating" value={`${customer.metadata?.averageRating?.toFixed(1) || '0.0'}/5`} />
                    <StatRow icon={<Wallet size={16} />} label="Lifetime Value" value={`₹${(customer.metadata?.lifetimeValue || 0).toLocaleString()}`} />
                    <StatRow icon={<Calendar size={16} />} label="First Contact" value={formatDate(customer.metadata?.firstContactDate)} />
                    <StatRow icon={<Clock size={16} />} label="Last Contact" value={formatDate(customer.metadata?.lastContactDate)} />
                  </div>
                </div>

                {/* Tags */}
                {customer.tags && customer.tags.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-100 p-5">
                    <h3 className="font-semibold text-slate-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {customer.tags.map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scheduled Meeting */}
                {customer.metadata?.scheduledMeeting && (
                  <div className="bg-[#81d8d0]/10 rounded-xl border border-[#81d8d0]/30 p-5">
                    <h3 className="font-semibold text-[#0a1128] mb-2 flex items-center gap-2">
                      <Calendar size={16} /> Scheduled Meeting
                    </h3>
                    <p className="text-slate-700">{customer.metadata.scheduledMeeting}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <IncomingCallModal
        call={incomingCall}
        onAnswer={handleAnswerCall}
        onDecline={() => setIncomingCall(null)}
        onSendToAI={async () => {
          if (!incomingCall) return;
          await axios.post(`${API_URL}/api/twilio/forward-to-ai`, { callId: incomingCall.callId, callSid: incomingCall.callSid, customer: incomingCall.customer });
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

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
