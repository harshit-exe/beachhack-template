'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Phone, 
  Star, 
  Calendar,
  MessageCircle,
  UserCheck,
  Bot,
  PhoneOff,
  Gift,
  FileText,
  Clock,
  Mic,
  ArrowRight
} from 'lucide-react';

const VisualizerScene = dynamic(() => import('./VisualizerScene'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-20 h-20 rounded-full bg-slate-100 animate-pulse" />
    </div>
  )
});

interface CustomerContext {
  name: string;
  phone: string;
  status: string;
  notes: string | null;
  totalCalls: number;
  scheduledMeeting: string | null;
  lifetimeValue: number;
}

interface TranscriptEntry {
  speaker: 'customer' | 'agent' | 'ai' | 'system';
  text: string;
  timestamp: Date;
}

interface CallVisualizerProps {
  isActive: boolean;
  isAIHandling?: boolean;
  customer?: CustomerContext | null;
  aiSuggestions?: Array<{ type: string; text: string }>;
  callDuration?: string;
  currentSpeaker?: 'customer' | 'agent' | 'ai' | null;
  transcripts?: TranscriptEntry[];
  onReclaimCall?: () => void;
  onTransferToAI?: () => void;
  onEndCall?: () => void;
}

const CallVisualizer: React.FC<CallVisualizerProps> = ({
  isActive,
  isAIHandling = false,
  customer,
  aiSuggestions,
  callDuration = '00:00',
  transcripts = [],
  onReclaimCall,
  onTransferToAI,
  onEndCall
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [latestMessage, setLatestMessage] = useState<TranscriptEntry | null>(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (transcripts.length > prevLengthRef.current) {
      setLatestMessage(transcripts[transcripts.length - 1]);
      setAudioLevel(1.0);
      prevLengthRef.current = transcripts.length;
    }
  }, [transcripts]);

  useEffect(() => {
    if (audioLevel > 0.15) {
      const decay = setInterval(() => setAudioLevel(prev => Math.max(0.1, prev - 0.05)), 80);
      return () => clearInterval(decay);
    }
  }, [audioLevel]);

  useEffect(() => {
    if (!isActive) return;
    const pulse = setInterval(() => {
      if (audioLevel < 0.2) setAudioLevel(0.25);
    }, 2500);
    return () => clearInterval(pulse);
  }, [isActive, audioLevel]);

  return (
    <div className="h-full bg-white rounded-3xl p-8 flex gap-8">
      
      {/* LEFT: Globe + Voice (35%) */}
      <div className="w-[35%] flex flex-col">
        
        {/* Globe Card - Minimal */}
        <div className="flex-1 bg-slate-950 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
          
          {/* Globe */}
          <div className="w-full max-w-[180px] aspect-square">
            <VisualizerScene audioLevel={audioLevel} isActive={isActive} />
          </div>
          
          {/* Timer */}
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-xs font-medium tracking-[0.2em] uppercase mb-1">
              {isAIHandling ? 'AI Handling' : 'Live Call'}
            </p>
            <p className="text-white text-4xl font-extralight tracking-tight font-mono">
              {callDuration}
            </p>
          </div>

          {/* Transcript */}
          <div className="mt-6 w-full">
            {latestMessage ? (
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-slate-500 text-[10px] font-medium tracking-[0.15em] uppercase mb-2">
                  {latestMessage.speaker === 'customer' ? 'Customer says' : 'Agent says'}
                </p>
                <p className="text-white text-base font-light leading-relaxed">
                  "{latestMessage.text}"
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-4">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-6 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
                <span className="text-slate-500 text-sm">Listening...</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-3">
          {isAIHandling ? (
            <button onClick={onReclaimCall} className="w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-medium tracking-wide hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
              <UserCheck size={18} />
              Take Over Call
            </button>
          ) : (
            <button onClick={onTransferToAI} className="w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-medium tracking-wide hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
              <Bot size={18} />
              Transfer to AI
            </button>
          )}
          
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Gift, label: 'Offer' },
              { icon: FileText, label: 'Note' },
              { icon: Clock, label: 'Callback' },
              { icon: PhoneOff, label: 'End', onClick: onEndCall },
            ].map(({ icon: Icon, label, onClick }) => (
              <button key={label} onClick={onClick} className="py-3 rounded-xl border border-slate-200 hover:border-slate-900 transition-colors flex flex-col items-center gap-1.5">
                <Icon size={16} className="text-slate-600" />
                <span className="text-[10px] font-medium text-slate-500">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Context (65%) */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Customer Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-4xl font-extralight text-slate-900 tracking-tight">
                {customer?.name || 'Customer'}
              </h1>
              {customer?.status === 'vip' && (
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold tracking-wide flex items-center gap-1">
                  <Star size={10} /> VIP
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm font-light tracking-wide">{customer?.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-extralight text-slate-900 tracking-tighter">
              ₹{((customer?.lifetimeValue || 0) / 1000).toFixed(0)}K
            </p>
            <p className="text-slate-400 text-[10px] font-medium tracking-[0.15em] uppercase mt-1">Lifetime Value</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-12 py-6 border-y border-slate-100">
          <div>
            <p className="text-4xl font-extralight text-slate-900">{customer?.totalCalls || 0}</p>
            <p className="text-slate-400 text-[10px] font-medium tracking-[0.15em] uppercase mt-1">Total Calls</p>
          </div>
          <div>
            <p className="text-2xl font-light text-slate-900 capitalize">{customer?.status || 'New'}</p>
            <p className="text-slate-400 text-[10px] font-medium tracking-[0.15em] uppercase mt-1">Status</p>
          </div>
          <div>
            <p className="text-2xl font-light text-slate-900">{isAIHandling ? 'AI Agent' : 'You'}</p>
            <p className="text-slate-400 text-[10px] font-medium tracking-[0.15em] uppercase mt-1">Handler</p>
          </div>
        </div>

        {/* Context Cards */}
        <div className="grid grid-cols-2 gap-6">
          {/* Notes */}
          <div className="py-5">
            <p className="text-slate-400 text-[10px] font-semibold tracking-[0.2em] uppercase mb-3">Last Request</p>
            <p className={`text-xl font-light leading-relaxed ${customer?.notes ? 'text-slate-900' : 'text-slate-300'}`}>
              {customer?.notes || 'No previous request'}
            </p>
          </div>

          {/* Meeting */}
          <div className="py-5">
            <p className="text-slate-400 text-[10px] font-semibold tracking-[0.2em] uppercase mb-3">Scheduled Meeting</p>
            <p className={`text-xl font-light ${customer?.scheduledMeeting ? 'text-slate-900' : 'text-slate-300'}`}>
              {customer?.scheduledMeeting || 'None scheduled'}
            </p>
          </div>
        </div>

        {/* AI Insights */}
        <div className="flex-1 bg-slate-50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-400 text-[10px] font-semibold tracking-[0.2em] uppercase">AI Insights</p>
            <span className="flex items-center gap-2 text-slate-400 text-xs">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Active
            </span>
          </div>
          
          <div className="space-y-3">
            {/* Build insights array and always render */}
            {(() => {
              const insights = [];

              // Real-time AI Suggestions (High Priority)
              if (aiSuggestions && aiSuggestions.length > 0) {
                aiSuggestions.forEach((suggestion, idx) => {
                  const isAlert = suggestion.type === 'alert' || suggestion.type === 'priority';
                  insights.push(
                    <div key={`ai-${idx}`} className={`flex items-center gap-4 p-3 rounded-xl mb-2 ${isAlert ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                      <Bot size={18} className={isAlert ? "text-rose-500" : "text-emerald-500"} />
                      <div>
                        <p className={`font-medium ${isAlert ? "text-rose-900" : "text-emerald-900"}`}>
                          {isAlert ? 'Alert' : 'AI Suggestion'}
                        </p>
                        <p className={`text-sm font-medium mt-0.5 ${isAlert ? "text-rose-700" : "text-emerald-700"}`}>
                          {suggestion.text}
                        </p>
                      </div>
                    </div>
                  );
                });
              }
              
              // Notes insight
              if (customer?.notes) {
                insights.push(
                  <div key="notes" className="flex items-center justify-between group cursor-pointer hover:bg-white rounded-xl p-3 transition-colors">
                    <div className="flex items-center gap-4">
                      <MessageCircle size={18} className="text-slate-400" />
                      <div>
                        <p className="text-slate-900 font-medium">Previous Request</p>
                        <p className="text-slate-500 text-sm font-light mt-0.5">"{customer.notes}"</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </div>
                );
              }
              
              // VIP insight
              if (customer?.status === 'vip') {
                insights.push(
                  <div key="vip" className="flex items-center gap-4 p-3">
                    <Star size={18} className="text-slate-400" />
                    <div>
                      <p className="text-slate-900 font-medium">VIP Customer</p>
                      <p className="text-slate-500 text-sm font-light mt-0.5">Prioritize and offer premium support</p>
                    </div>
                  </div>
                );
              }
              
              // Returning customer
              if (customer?.totalCalls && customer.totalCalls > 1) {
                insights.push(
                  <div key="returning" className="flex items-center gap-4 p-3">
                    <Phone size={18} className="text-slate-400" />
                    <div>
                      <p className="text-slate-900 font-medium">Returning Customer</p>
                      <p className="text-slate-500 text-sm font-light mt-0.5">{customer.totalCalls} calls — reference history</p>
                    </div>
                  </div>
                );
              }
              
              // Scheduled meeting
              if (customer?.scheduledMeeting) {
                insights.push(
                  <div key="meeting" className="flex items-center gap-4 p-3">
                    <Calendar size={18} className="text-slate-400" />
                    <div>
                      <p className="text-slate-900 font-medium">Meeting Scheduled</p>
                      <p className="text-slate-500 text-sm font-light mt-0.5">{customer.scheduledMeeting}</p>
                    </div>
                  </div>
                );
              }
              
              // New customer fallback
              if (insights.length === 0 || (!customer?.notes && customer?.totalCalls && customer.totalCalls <= 1)) {
                insights.push(
                  <div key="new" className="flex items-center gap-4 p-3">
                    <Bot size={18} className="text-slate-400" />
                    <div>
                      <p className="text-slate-900 font-medium">New Customer</p>
                      <p className="text-slate-500 text-sm font-light mt-0.5">Introduce services and collect details</p>
                    </div>
                  </div>
                );
              }
              
              // Always show listening if empty
              if (insights.length === 0) {
                insights.push(
                  <div key="listening" className="flex items-center gap-3 text-slate-400 p-3">
                    <Mic size={16} className="animate-pulse" />
                    <p className="text-sm font-light">Listening for context...</p>
                  </div>
                );
              }
              
              return insights;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallVisualizer;
