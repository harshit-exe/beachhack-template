'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import IncomingCallModal from '@/components/IncomingCallModal';
import { IncomingCall } from '@/types';
import { 
  Home, 
  MessageSquare, 
  Settings, 
  Shield, 
  Phone,
  Search,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const AGENT_ID = 'demo-agent-001';

export default function DashboardHome() {
  const router = useRouter();
  const { 
    isConnected, 
    goOnline,
    answerCall,
    onIncomingCall
  } = useSocket();
  
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  // Go online when socket connected
  useEffect(() => {
    if (isConnected) {
      goOnline(AGENT_ID);
    }
  }, [isConnected, goOnline]);

  // Subscribe to incoming calls
  useEffect(() => {
    const unsubIncoming = onIncomingCall?.((data: any) => {
      console.log('📞 Incoming call:', data);
      setIncomingCall({
        ...data,
        conferenceName: data.conferenceName || `call-${data.callId}`
      });
    });

    return () => {
      unsubIncoming?.();
    };
  }, [onIncomingCall]);

  // Handle answering call - navigate to interaction page
  const handleAnswerCall = async () => {
    if (!incomingCall) return;
    
    // Store call data in sessionStorage for the interaction page
    sessionStorage.setItem('activeCall', JSON.stringify(incomingCall));
    
    // Notify backend
    answerCall(incomingCall.callId, AGENT_ID);
    
    // Navigate to interaction page
    router.push(`/interaction/${incomingCall.callId}`);
    setIncomingCall(null);
  };

  const handleDeclineCall = () => {
    setIncomingCall(null);
  };

  const handleSendToAI = async () => {
    if (!incomingCall) return;
    
    try {
      await axios.post(`${API_URL}/api/twilio/forward-to-ai`, {
        callId: incomingCall.callId,
        callSid: incomingCall.callSid,
        customer: incomingCall.customer
      });
      
      console.log('📤 Call forwarded to AI agent');
      setIncomingCall(null);
    } catch (error: any) {
      console.error('Failed to forward to AI:', error);
      alert('Failed to forward call to AI: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Left Sidebar - Navigation */}
      <aside className="w-14 bg-[#0a1128] flex flex-col items-center py-4">
        <div className="w-9 h-9 bg-[#81d8d0]/20 rounded-xl flex items-center justify-center mb-8">
          <Shield size={18} className="text-[#81d8d0]" />
        </div>
        
        <nav className="flex flex-col items-center gap-4 flex-1">
          <NavIcon icon={<Home size={18} />} active href="/" />
          <NavIcon icon={<MessageSquare size={18} />} href="/conversations" />
          <NavIcon icon={<Users size={18} />} href="/customers" />
          <NavIcon icon={<Phone size={18} />} href="/calls" />
        </nav>
        
        <div className="flex flex-col items-center gap-4">
          <NavIcon icon={<Settings size={18} />} href="/settings" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-slate-900 font-semibold">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors">
              <Search size={14} className="text-slate-400" />
              <span className="text-slate-400 text-sm">Search</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#0a1128] flex items-center justify-center text-[#81d8d0] text-xs font-bold">
              JD
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard 
              label="Today's Calls" 
              value="12" 
              icon={<Phone size={18} />}
              trend="+3 from yesterday"
              color="bg-blue-500"
            />
            <StatCard 
              label="Avg Handle Time" 
              value="4:32" 
              icon={<Clock size={18} />}
              trend="-12s improvement"
              color="bg-emerald-500"
            />
            <StatCard 
              label="Customer Satisfaction" 
              value="4.8" 
              icon={<TrendingUp size={18} />}
              trend="+0.2 this week"
              color="bg-amber-500"
            />
            <StatCard 
              label="Active Customers" 
              value="156" 
              icon={<Users size={18} />}
              trend="+8 new today"
              color="bg-purple-500"
            />
          </div>

          {/* Ready for Calls Section */}
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-24 h-24 rounded-2xl bg-[#0a1128] flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Shield size={40} className="text-[#81d8d0]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready for Calls</h2>
              <p className="text-slate-500 mb-6">
                {isConnected ? 'Waiting for incoming calls...' : 'Connecting to server...'}
              </p>
              
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
                isConnected ? 'bg-[#81d8d0]/20 text-[#0a1128]' : 'bg-amber-100 text-amber-700'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-[#81d8d0]' : 'bg-amber-500 animate-pulse'}`}></span>
                <span className="font-semibold text-sm">{isConnected ? 'Connected' : 'Connecting...'}</span>
              </div>
              
              <p className="mt-6 text-sm text-slate-400">
                When you answer a call, you'll be redirected to the interaction page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Call Modal */}
      <IncomingCallModal
        call={incomingCall}
        onAnswer={handleAnswerCall}
        onDecline={handleDeclineCall}
        onSendToAI={handleSendToAI}
      />
    </div>
  );
}

// Nav Icon Component
function NavIcon({ icon, active = false, href }: { icon: React.ReactNode; active?: boolean; href?: string }) {
  const router = useRouter();
  
  return (
    <button 
      onClick={() => href && router.push(href)}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
        active 
          ? 'bg-[#81d8d0]/20 text-[#81d8d0]' 
          : 'text-white/40 hover:text-white/70 hover:bg-white/5'
      }`}
    >
      {icon}
    </button>
  );
}

// Stat Card Component
function StatCard({ label, value, icon, trend, color }: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  trend: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-slate-500 text-sm mt-1">{label}</p>
      <p className="text-emerald-500 text-xs mt-2 font-medium">{trend}</p>
    </div>
  );
}
