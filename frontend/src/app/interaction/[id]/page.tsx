'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Users
} from 'lucide-react';
import axios from 'axios';
import VisualizerScene from '@/components/visualizer/VisualizerScene';
import TranscriptionOverlay from '@/components/visualizer/TranscriptionOverlay';

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
    onCallEnded
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
  const chatRef = useRef<HTMLDivElement>(null);

  // Audio Visualizer State
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCustomerSpeaking, setIsCustomerSpeaking] = useState(false);

  // Monitor transcription changes to simulate audio for customer
  useEffect(() => {
    if (transcription.length > 0) {
      const lastEntry = transcription[transcription.length - 1];
      if (lastEntry.speaker === 'customer') {
        setIsCustomerSpeaking(true);
        // Stop speaking animation after 2 seconds (simulated processing time)
        const timer = setTimeout(() => setIsCustomerSpeaking(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [transcription]);

  // Initialize Audio Context on Mount
  useEffect(() => {
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audContext.createMediaStreamSource(stream);
        const analyserNode = audContext.createAnalyser();
        analyserNode.fftSize = 256;
        source.connect(analyserNode);

        setAudioContext(audContext);
        setAnalyser(analyserNode);
        setIsMicActive(true);
      } catch (err) {
        console.error('Error accessing microphone:', err);
      }
    };

    initAudio();

    return () => {
      audioContext?.close();
    };
  }, []);

  // Mock conversation data for testing
  const MOCK_CONVERSATION = [
    { speaker: 'agent' as const, text: "Hello, thank you for calling support. How can I help you today?" },
    { speaker: 'customer' as const, text: "Hi, I'm frustrated. My package is delayed again and it was supposed to be a birthday gift for tomorrow!" },
    { speaker: 'agent' as const, text: "I understand your frustration. Let me pull up the tracking details right now." },
    { speaker: 'customer' as const, text: "This is the second time this month. I'm a premium member and expected better service." },
    { speaker: 'agent' as const, text: "I sincerely apologize for this experience. I can see the delay is weather-related. As a Premium member, I can upgrade to priority delivery once it reaches the local hub." },
  ];

  const MOCK_SUGGESTIONS: AISuggestion[] = [
    { text: "I can see the delay is weather-related. As a Premium member, I can upgrade to priority delivery once it reaches the local hub.", type: 'response', confidence: 0.95 },
    { text: "Let me check if we can offer you a discount on your next order as compensation for the inconvenience.", type: 'response', confidence: 0.88 },
  ];

  // Load call data from sessionStorage on mount
  useEffect(() => {
    const storedCall = sessionStorage.getItem('activeCall');
    const mockCallFlag = sessionStorage.getItem('isMockCall');

    if (storedCall) {
      const callData: IncomingCall = JSON.parse(storedCall);
      setCustomer(callData.customer);
      setCallStartTime(new Date());

      if (mockCallFlag === 'true') {
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

    return () => {
      unsubTranscription?.();
      unsubSuggestions?.();
      unsubEnded?.();
    };
  }, [onTranscriptionUpdate, onAISuggestion, onCallEnded]);

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

        {/* Chat Interface */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-slate-50">
            {/* Customer Header */}
            <div className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleEndCall}
                  className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  {customer.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-semibold">{customer.name || 'Customer'}</span>
                    {customer.status === 'vip' && (
                      <span className="px-2 py-0.5 bg-[#81d8d0] text-[#0a1128] text-[10px] font-bold uppercase rounded">Premium</span>
                    )}
                  </div>
                  <span className="text-slate-400 text-xs">{customer.metadata?.company || 'Unknown Company'}</span>
                </div>
              </div>

              {/* Call Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-rose-500 text-sm font-medium">Live</span>
                </div>
                <span className="text-slate-900 font-mono text-lg font-semibold">{callDuration}</span>
                <button className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                  <Mic size={18} />
                </button>
                <button
                  onClick={handleEndCall}
                  className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500 hover:bg-rose-200"
                >
                  <PhoneOff size={18} />
                </button>
              </div>
            </div>

            {/* Dial Status */}
            {isDialing && (
              <div className="bg-[#0a1128] text-white px-6 py-2 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#81d8d0] animate-pulse"></span>
                {dialStatus}
              </div>
            )}

            {/* Full Screen Visualizer Container */}
            <div className="flex-1 relative bg-slate-50 overflow-hidden">
              {/* 3D Visualizer Layer (Background) */}
              <div className="absolute inset-0 z-0">
                <VisualizerScene analyser={analyser} isPlaying={isMicActive} isCustomerSpeaking={isCustomerSpeaking} />
              </div>

              {/* Floating Transcription Overlay */}
              <TranscriptionOverlay transcription={transcription} isPlaying={isMicActive} />

              {/* Top Left Status */}
              <div className="absolute top-6 left-6 z-20">
                <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${isMicActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isMicActive ? 'Live Audio Sync' : 'Microphone Inactive'}
                  </span>
                </div>
              </div>

              {/* Bottom Controls Bar - REMOVED as per request */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-30 pointer-events-none flex justify-center">
                {/* Only End Call button remains if needed, likely completely hidden based on 'only show customer chats' */}
                {/* keeping hidden for now or removing entirely. User said 'remove type message option'. */}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="w-72 bg-white border-l border-slate-100 flex flex-col overflow-hidden">
            {/* Customer Info */}
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Customer Info</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Mail size={14} className="text-slate-400" />
                  <span>{customer.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Phone size={14} className="text-slate-400" />
                  <span>{customer.phoneNumber}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-medium">Lifetime Value</p>
                  <p className="text-slate-900 font-bold text-lg">₹{(customer.metadata?.lifetimeValue || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-medium">Satisfaction</p>
                  <p className="text-emerald-500 font-bold text-lg">{customer.metadata?.averageRating?.toFixed(1) || '0.0'}/5</p>
                </div>
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-500" />
                  <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">AI Suggestions</h3>
                </div>
                <span className="text-emerald-500 text-[10px] font-semibold">Active</span>
              </div>

              <div className="space-y-3">
                {suggestions.length > 0 ? suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber-600 text-[10px] font-semibold">💬 Suggested Response</span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed mb-3">"{suggestion.text}"</p>
                    <button
                      onClick={() => handleUseSuggestion(suggestion.text)}
                      className="w-full py-2 bg-[#81d8d0]/20 text-[#0a1128] rounded-lg text-sm font-semibold hover:bg-[#81d8d0]/30 transition-colors border border-[#81d8d0]/30"
                    >
                      Use Response
                    </button>
                  </div>
                )) : (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber-600 text-[10px] font-semibold">💬 Suggested Response</span>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed mb-3">Listening for conversation...</p>
                    <button className="w-full py-2 bg-slate-100 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed">
                      Use Response
                    </button>
                  </div>
                )}

                {currentSentiment === 'negative' && (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift size={12} className="text-emerald-600" />
                      <span className="text-emerald-700 text-[10px] font-semibold">Retention Offer</span>
                    </div>
                    <p className="text-slate-700 text-sm">Offer ₹500 credit as compensation.</p>
                    <button className="w-full py-2 mt-3 bg-white text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors border border-slate-200">
                      Apply Credit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-100 space-y-2">
              <button className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                <CheckCircle size={16} />
                Resolve Issue
              </button>
              <button className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                <Clock size={14} />
                Create Follow-up
              </button>
            </div>
          </aside>
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
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${active
        ? 'bg-[#81d8d0]/20 text-[#81d8d0]'
        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
        }`}
    >
      {icon}
    </button>
  );
}
