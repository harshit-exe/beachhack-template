'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSocket } from '@/hooks/useSocket';
import { 
  Customer, 
  TranscriptionEntry, 
  AISuggestion,
  IncomingCall
} from '@/types';
import { customersApi, aiApi } from '@/lib/api';
import { 
  Home, 
  MessageSquare, 
  Settings, 
  Shield, 
  Phone, 
  PhoneOff,
  Mail,
  Mic,
  Send,
  CheckCircle,
  Clock,
  Sparkles,
  Gift,
  ArrowLeft,
  Search,
  Users,
  Bot,
  UserCheck
} from 'lucide-react';
import axios from 'axios';

// Dynamically import CallVisualizer to avoid SSR issues with Three.js
const CallVisualizer = dynamic(
  () => import('@/components/visualizer/CallVisualizer'),
  { ssr: false }
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const AGENT_ID = 'demo-agent-001';

export default function InteractionPage() {
  const params = useParams();
  const router = useRouter();
  const callId = params.id as string;
  
  const { 
    isConnected,
    onTranscriptionUpdate,
    onAISuggestion,
    onCallEnded,
    onAIVoiceActive
  } = useSocket();
  
  // State
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [recommendedActions, setRecommendedActions] = useState<string[]>([]);
  const [currentSentiment, setCurrentSentiment] = useState<'positive' | 'neutral' | 'negative'>('neutral');
  const [callStartTime, setCallStartTime] = useState<Date>(new Date());
  const [callDuration, setCallDuration] = useState('00:00');
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isDialing, setIsDialing] = useState(false);
  const [dialStatus, setDialStatus] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [isMockCall, setIsMockCall] = useState(false);
  const [aiHandlingCall, setAiHandlingCall] = useState(false);
  const [callSid, setCallSid] = useState<string>('');
  const [conferenceName, setConferenceName] = useState<string>('');
  const chatRef = useRef<HTMLDivElement>(null);
  
  // AI Context from backend (for dashboard display)
  const [aiContext, setAiContext] = useState<{
    customerContext?: {
      name: string;
      phone: string;
      status: string;
      notes: string | null;
      keyPoints?: string[];
      totalCalls: number;
      scheduledMeeting: string | null;
      lifetimeValue: number;
    };
    recentConversations?: Array<{
      summary: string;
      date: string;
      status: string;
    }>;
    aiSuggestions?: Array<{
      type: string;
      text: string;
    }>;
  } | null>(null);

  // Mock conversation data for testing - Flower Boutique Scenario
  const MOCK_CONVERSATION = [
    { speaker: 'agent' as const, text: "Welcome to The Rose Garden. How can I make your day beautiful?" },
    { speaker: 'customer' as const, text: "Hi, I need something really special for my mother's birthday in two days. It's urgent." },
    { speaker: 'agent' as const, text: "Happy birthday to her in advance! Do you have any specific flowers in mind?" },
    { speaker: 'customer' as const, text: "She loves white and red. Maybe something elegant? I want it to look premium." },
    { speaker: 'agent' as const, text: "We can create a stunning 'Crimson & Pearl' luxury bouquet with red velvet roses and white orchids." },
    { speaker: 'customer' as const, text: "That sounds perfect. Can you ensure it arrives by the morning of the 2nd?" },
  ];

  const MOCK_SUGGESTIONS: AISuggestion[] = [
    { text: "Suggest the 'Royal Jubilee' arrangement which features her favorite Red & White combination.", type: 'response', confidence: 0.98 },
    { text: "Offer 'Express Morning Delivery' service (₹500) to guarantee arrival by 10 AM on the 2nd.", type: 'action', confidence: 0.95 },
    { text: "Upsell: 'Would you like to add a handwritten note on premium cardstock?'", type: 'action', confidence: 0.90 },
  ];

  // Load call data from sessionStorage on mount
  useEffect(() => {
    const storedCall = sessionStorage.getItem('activeCall');
    const mockCallFlag = sessionStorage.getItem('isMockCall');
    
    if (storedCall) {
      const callData: IncomingCall & { aiHandling?: boolean } = JSON.parse(storedCall);
      setCustomer(callData.customer);
      setCallStartTime(new Date());
      setCallSid(callData.callSid);
      setConferenceName(callData.conferenceName || `call-${callData.callId}`);
      
      // Check if call was sent to AI from dashboard
      if (callData.aiHandling) {
        setAiHandlingCall(true);
        setDialStatus('🤖 AI is handling this call - Monitoring mode');
        setIsDialing(true);
        setTimeout(() => setIsDialing(false), 3000);
      } else if (mockCallFlag === 'true') {
        // This is a mock call - simulate conversation
        setIsMockCall(true);
        sessionStorage.removeItem('isMockCall');
        startMockConversation();
      } else {
        // Real call - dial agent's phone to join conference
        dialAgentPhone(callData);
      }
    } else {
      // No active call data, redirect to home
      router.push('/');
    }
  }, [router]);

  // Start mock conversation simulation
  const startMockConversation = () => {
    setIsDialing(true);
    setDialStatus('🧪 Mock Mode - Simulating conversation...');
    
    setTimeout(() => setIsDialing(false), 2000);
    
    // Add messages one by one with delays
    MOCK_CONVERSATION.forEach((msg, index) => {
      setTimeout(() => {
        setTranscription(prev => [...prev, {
          speaker: msg.speaker,
          text: msg.text,
          timestamp: new Date(),
          confidence: 1.0
        }]);
        
        // Update sentiment based on customer messages
        if (msg.speaker === 'customer' && (msg.text.includes('frustrated') || msg.text.includes('expected better'))) {
          setCurrentSentiment('negative');
        }
        
        // Add AI suggestions after a few messages
        if (index === 2) {
          setSuggestions(MOCK_SUGGESTIONS);
        }
      }, (index + 1) * 2500);
    });
  };

  // Dial agent phone
  const dialAgentPhone = async (callData: IncomingCall) => {
    setIsDialing(true);
    setDialStatus('Calling your phone...');
    
    try {
      const conferenceName = callData.conferenceName || `call-${callData.callId}`;
      await axios.post(`${API_URL}/api/twilio/join-call`, {
        callId: callData.callId,
        conferenceName
      });
      setDialStatus('Ringing your phone - answer to join!');
      setTimeout(() => setIsDialing(false), 3000);
    } catch (error: any) {
      console.error('Failed to dial agent:', error);
      setDialStatus('Failed: ' + (error.response?.data?.error || error.message));
    }
  };

  // Call duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
      const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
      const seconds = (diff % 60).toString().padStart(2, '0');
      setCallDuration(`${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStartTime]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [transcription]);

  // Subscribe to socket events
  useEffect(() => {
    const unsubTranscription = onTranscriptionUpdate?.((data: any) => {
      console.log('📝 Transcription update:', data);
      setTranscription(prev => [...prev, {
        speaker: data.speaker,
        text: data.text,
        timestamp: new Date(data.timestamp),
        confidence: 1.0
      }]);
      
      if (data.sentiment) {
        setCurrentSentiment(data.sentiment.sentiment);
      }
    });

    const unsubSuggestions = onAISuggestion?.((data: any) => {
      console.log('🤖 AI suggestion:', data);
      setIsSuggestionsLoading(false);
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
      if (data.recommendedActions) {
        setRecommendedActions(data.recommendedActions);
      }
    });

    const unsubEnded = onCallEnded?.((data: any) => {
      console.log('📞 Call ended:', data);
      handleEndCall();
    });
    
    // Listen for AI voice active context from backend
    const unsubAIActive = onAIVoiceActive?.((data: any) => {
      console.log('🤖 AI Voice Active with context:', data);
      if (data.callId === callId || data.conversationId === callId) {
        setAiContext({
          customerContext: data.customerContext,
          recentConversations: data.recentConversations,
          aiSuggestions: data.aiSuggestions
        });
        setAiHandlingCall(true);
      }
    });

    return () => {
      unsubTranscription?.();
      unsubSuggestions?.();
      unsubEnded?.();
      unsubAIActive?.();
    };
  }, [onTranscriptionUpdate, onAISuggestion, onCallEnded, onAIVoiceActive, callId]);

  // Fetch customer history
  useEffect(() => {
    if (customer?._id) {
      customersApi.getHistory(customer._id).catch(console.error);
    }
  }, [customer?._id]);

  const handleEndCall = useCallback(() => {
    sessionStorage.removeItem('activeCall');
    router.push('/');
  }, [router]);

  const handleUseSuggestion = (text: string) => {
    setMessageInput(text);
  };

  // Transfer call to AI
  const handleTransferToAI = async () => {
    if (isMockCall) {
      // Mock transfer
      setAiHandlingCall(true);
      setDialStatus('🤖 AI is now handling this call (mock mode)');
      setIsDialing(true);
      setTimeout(() => setIsDialing(false), 2000);
      return;
    }

    try {
      setIsDialing(true);
      setDialStatus('Transferring to AI (with your context)...');
      
      // Use hybrid AI voice endpoint (Groq logic + voice)
      await axios.post(`${API_URL}/api/twilio/ai-voice/start`, {
        callSid,
        customer,
        conversationId: callId
      });
      
      setAiHandlingCall(true);
      setDialStatus('🤖 AI is handling this call (with your customer data)');
      setTimeout(() => setIsDialing(false), 2000);
    } catch (error: any) {
      console.error('Failed to transfer to AI:', error);
      setDialStatus('Failed to transfer: ' + (error.response?.data?.error || error.message));
      setTimeout(() => setIsDialing(false), 3000);
    }
  };

  // Reclaim call from AI
  const handleReclaimFromAI = async () => {
    if (isMockCall) {
      // Mock reclaim
      setAiHandlingCall(false);
      setDialStatus('👤 You are now handling this call (mock mode)');
      setIsDialing(true);
      setTimeout(() => setIsDialing(false), 2000);
      return;
    }

    try {
      setIsDialing(true);
      setDialStatus('Taking call back from AI...');
      
      await axios.post(`${API_URL}/api/twilio/reclaim-from-ai`, {
        callId,
        callSid,
        conferenceName
      });
      
      setAiHandlingCall(false);
      setDialStatus('👤 You are now handling this call');
      setTimeout(() => setIsDialing(false), 2000);
    } catch (error: any) {
      console.error('Failed to reclaim from AI:', error);
      setDialStatus('Failed to reclaim: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRefreshSuggestions = async () => {
    if (transcription.length === 0) return;
    
    setIsSuggestionsLoading(true);
    
    try {
      const res = await aiApi.getSuggestions({
        conversationId: callId,
        lastMessage: transcription[transcription.length - 1]?.text,
        history: transcription.map(t => ({ speaker: t.speaker, text: t.text }))
      });
      
      if (res.data.success && res.data.data) {
        setSuggestions(res.data.data.suggestions || []);
        setRecommendedActions(res.data.data.recommendedActions || []);
      }
    } catch (error) {
      console.error('Failed to refresh suggestions:', error);
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getSentimentColor = () => {
    switch (currentSentiment) {
      case 'positive': return 'bg-emerald-500';
      case 'negative': return 'bg-rose-500';
      default: return 'bg-amber-500';
    }
  };

  const getSentimentLabel = () => {
    switch (currentSentiment) {
      case 'positive': return 'Happy';
      case 'negative': return 'Frustrated';
      default: return 'Neutral';
    }
  };

  if (!customer) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#81d8d0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading interaction...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-14 bg-[#0a1128] flex flex-col items-center py-4">
        <div className="w-9 h-9 bg-[#81d8d0]/20 rounded-xl flex items-center justify-center mb-8">
          <Shield size={18} className="text-[#81d8d0]" />
        </div>
        
        <nav className="flex flex-col items-center gap-4 flex-1">
          <NavIcon icon={<Home size={18} />} href="/" />
          <NavIcon icon={<MessageSquare size={18} />} active />
          <NavIcon icon={<Users size={18} />} />
          <NavIcon icon={<Phone size={18} />} />
        </nav>
        
        <div className="flex flex-col items-center gap-4">
          <NavIcon icon={<Settings size={18} />} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-slate-900 font-semibold">Dashboard</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500">Interaction</span>
          </div>
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

        {/* Call Visualizer - Shows for ALL call modes */}
        <div className="flex-1 overflow-hidden p-4">
          <CallVisualizer
            isActive={true}
            isAIHandling={aiHandlingCall}
            customer={{
              name: customer?.name || 'Customer',
              phone: customer?.phoneNumber || '',
              status: customer?.status || 'new',
              notes: customer?.metadata?.notes || aiContext?.customerContext?.notes || null,
              keyPoints: customer?.metadata?.keyPoints || aiContext?.customerContext?.keyPoints || [],
              totalCalls: customer?.metadata?.totalCalls || aiContext?.customerContext?.totalCalls || 0,
              scheduledMeeting: customer?.metadata?.scheduledMeeting || aiContext?.customerContext?.scheduledMeeting || null,
              lifetimeValue: customer?.metadata?.lifetimeValue || aiContext?.customerContext?.lifetimeValue || 0
            }}
            aiSuggestions={aiContext?.aiSuggestions || suggestions.map(s => ({ type: 'suggestion', text: s.text }))}
            callDuration={callDuration}
            currentSpeaker={transcription.length > 0 ? transcription[transcription.length - 1]?.speaker as any : null}
            transcripts={transcription}
            onTransferToAI={handleTransferToAI}
            onReclaimCall={handleReclaimFromAI}
            onEndCall={handleEndCall}
          />
        </div>
      </div>
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
