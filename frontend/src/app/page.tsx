'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import Header from '@/components/Header';
import CustomerCard from '@/components/CustomerCard';
import TranscriptionPanel from '@/components/TranscriptionPanel';
import AISuggestionsPanel from '@/components/AISuggestionsPanel';
import InteractionHistory from '@/components/InteractionHistory';
import QuickActions from '@/components/QuickActions';
import IncomingCallModal from '@/components/IncomingCallModal';
import { 
  IncomingCall, 
  Customer, 
  TranscriptionEntry, 
  AISuggestion,
  Conversation
} from '@/types';
import { customersApi, aiApi } from '@/lib/api';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const AGENT_ID = 'demo-agent-001';

export default function Dashboard() {
  // Socket connection
  const { 
    isConnected, 
    goOnline,
    answerCall,
    onIncomingCall, 
    onTranscriptionUpdate,
    onAISuggestion,
    onCallEnded
  } = useSocket();
  
  // State
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<IncomingCall | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [recommendedActions, setRecommendedActions] = useState<string[]>([]);
  const [currentSentiment, setCurrentSentiment] = useState<'positive' | 'neutral' | 'negative'>('neutral');
  const [callStartTime, setCallStartTime] = useState<Date | undefined>();
  const [history, setHistory] = useState<Conversation[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isDialing, setIsDialing] = useState(false);
  const [dialStatus, setDialStatus] = useState<string>('');

  // Go online when socket connected
  useEffect(() => {
    if (isConnected) {
      goOnline(AGENT_ID);
    }
  }, [isConnected, goOnline]);

  // Subscribe to socket events
  useEffect(() => {
    const unsubIncoming = onIncomingCall?.((data: any) => {
      console.log('📞 Incoming call:', data);
      setIncomingCall({
        ...data,
        conferenceName: data.conferenceName || `call-${data.callId}`
      });
    });

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
      unsubIncoming?.();
      unsubTranscription?.();
      unsubSuggestions?.();
      unsubEnded?.();
    };
  }, [onIncomingCall, onTranscriptionUpdate, onAISuggestion, onCallEnded]);

  // Fetch customer history when customer changes
  useEffect(() => {
    if (customer?._id) {
      customersApi.getHistory(customer._id)
        .then(res => {
          if (res.data.success) {
            setHistory(res.data.data);
          }
        })
        .catch(console.error);
    }
  }, [customer?._id]);

  // Handle answering call - dial agent's phone to join conference
  const handleAnswerCall = useCallback(async () => {
    if (!incomingCall) return;
    
    setActiveCall(incomingCall);
    setCustomer(incomingCall.customer);
    setCallStartTime(new Date());
    setTranscription([]);
    setSuggestions([]);
    setRecommendedActions([]);
    setCurrentSentiment('neutral');
    setIncomingCall(null);
    
    // Notify backend
    answerCall(incomingCall.callId, AGENT_ID);
    
    // Dial agent's phone to join conference
    setIsDialing(true);
    setDialStatus('Calling your phone...');
    
    try {
      const conferenceName = incomingCall.conferenceName || `call-${incomingCall.callId}`;
      await axios.post(`${API_URL}/api/twilio/join-call`, {
        callId: incomingCall.callId,
        conferenceName
      });
      setDialStatus('Ringing your phone - answer to join call!');
    } catch (error: any) {
      console.error('Failed to dial agent:', error);
      setDialStatus('Failed to call your phone: ' + (error.response?.data?.error || error.message));
    }
  }, [incomingCall, answerCall]);

  // Handle declining call
  const handleDeclineCall = () => {
    setIncomingCall(null);
  };

  // Handle sending call to AI (ElevenLabs)
  const handleSendToAI = useCallback(async () => {
    if (!incomingCall) return;
    
    try {
      // Forward call to AI agent
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
  }, [incomingCall]);

  // Handle ending call
  const handleEndCall = useCallback(() => {
    setActiveCall(null);
    setCallStartTime(undefined);
    setIsDialing(false);
    setDialStatus('');
  }, []);

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action);
  };

  // Handle using a suggestion
  const handleUseSuggestion = (text: string) => {
    console.log('Using suggestion:', text);
  };

  // Refresh AI suggestions
  const handleRefreshSuggestions = async () => {
    if (!activeCall || transcription.length === 0) return;
    
    setIsSuggestionsLoading(true);
    
    try {
      const res = await aiApi.getSuggestions({
        conversationId: activeCall.callId,
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

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header - 10vh */}
      <Header 
        isCallActive={!!activeCall}
        callStartTime={callStartTime}
        customerName={customer?.name}
        customerPhone={customer?.phoneNumber}
        agentName="Demo Agent"
        onEndCall={handleEndCall}
      />
      
      {/* Call Status Bar */}
      {activeCall && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Volume2 className="w-5 h-5 animate-pulse" />
            <div>
              <span className="font-medium">
                {isDialing ? dialStatus : 'Connected - Talk on your phone!'}
              </span>
              <p className="text-sm text-white/80">
                Real-time transcription and AI suggestions are active
              </p>
            </div>
          </div>
          <button
            onClick={handleEndCall}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
            End Call
          </button>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {customer ? (
          <>
            {/* Customer Card - 15vh */}
            <CustomerCard customer={customer} />
            
            {/* Transcription and AI Panels - Flexible height */}
            <div className="flex gap-4 flex-1 min-h-0">
              <TranscriptionPanel 
                transcription={transcription}
                isRecording={!!activeCall}
                currentSentiment={currentSentiment}
              />
              <AISuggestionsPanel 
                suggestions={suggestions}
                recommendedActions={recommendedActions}
                isLoading={isSuggestionsLoading}
                onUseSuggestion={handleUseSuggestion}
                onRefresh={handleRefreshSuggestions}
              />
            </div>
            
            {/* Interaction History - 20vh */}
            <InteractionHistory 
              history={history}
              onViewDetails={(id) => console.log('View details:', id)}
            />
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Ready for Calls</h2>
              <p className="text-gray-500 mb-6">
                {isConnected 
                  ? 'Waiting for incoming calls...'
                  : 'Connecting to server...'}
              </p>
              
              {/* Status indicator */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></span>
                {isConnected ? 'Connected' : 'Connecting...'}
              </div>
              
              <p className="mt-4 text-sm text-gray-500">
                When you answer a call, your phone (+919922041218) will ring.<br/>
                Answer it to talk with the customer.
              </p>
            </div>
          </div>
        )}
      </main>
      
      {/* Quick Actions - 10vh (only when customer is selected) */}
      {customer && (
        <QuickActions 
          isCallActive={!!activeCall}
          onAction={handleQuickAction}
          onEndCall={handleEndCall}
        />
      )}

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
