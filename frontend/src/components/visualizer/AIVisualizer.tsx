'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import AnimatedTranscript from './AnimatedTranscript';
import { Bot, Phone, User, Sparkles } from 'lucide-react';

// Dynamically import the 3D scene to avoid SSR issues
const VisualizerScene = dynamic(() => import('./VisualizerScene'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-[#81d8d0]/10">
      <div className="animate-pulse flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-[#81d8d0]/30" />
        <span className="text-xs text-slate-400">Loading visualizer...</span>
      </div>
    </div>
  )
});

interface TranscriptEntry {
  speaker: 'customer' | 'agent' | 'ai' | 'system';
  text: string;
  timestamp: Date;
}

interface CustomerContext {
  name: string;
  phone: string;
  status: string;
  notes: string | null;
  totalCalls: number;
  scheduledMeeting: string | null;
  lifetimeValue: number;
}

interface AIVisualizerProps {
  transcripts: TranscriptEntry[];
  isAIHandling: boolean;
  customer?: CustomerContext | null;
  aiSuggestions?: Array<{ type: string; text: string }>;
  recentConversations?: Array<{ summary: string; date: string }>;
  callDuration?: string;
  onReclaimCall?: () => void;
}

/**
 * AI Visualizer Component
 * Combines the 3D audio-reactive globe with animated transcripts
 * Takes 30% of the view with remaining space for context
 */
const AIVisualizer: React.FC<AIVisualizerProps> = ({
  transcripts,
  isAIHandling,
  customer,
  aiSuggestions,
  recentConversations,
  callDuration = '00:00',
  onReclaimCall
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const lastTranscriptRef = useRef<string>('');

  // Simulate audio level based on transcript activity
  useEffect(() => {
    const latestTranscript = transcripts[transcripts.length - 1];
    if (latestTranscript && latestTranscript.text !== lastTranscriptRef.current) {
      lastTranscriptRef.current = latestTranscript.text;
      
      // Pulse audio level when new transcript arrives
      setAudioLevel(0.8);
      const decay = setInterval(() => {
        setAudioLevel(prev => Math.max(0, prev - 0.05));
      }, 100);
      
      return () => clearInterval(decay);
    }
  }, [transcripts]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-[#81d8d0]/5">
      {/* Header Bar */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-sm font-semibold text-purple-700">AI Agent Active</span>
          </div>
          {customer?.name && (
            <span className="text-xs text-slate-400">
              Speaking with {customer.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-slate-700">{callDuration}</span>
          {onReclaimCall && (
            <button
              onClick={onReclaimCall}
              className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold hover:bg-emerald-200 transition-colors flex items-center gap-1.5"
            >
              <Phone size={12} />
              Reclaim
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Globe Visualizer (30%) */}
        <div className="w-[35%] relative flex flex-col">
          {/* 3D Globe */}
          <div className="flex-1 relative min-h-0">
            <VisualizerScene audioLevel={audioLevel} isActive={isAIHandling} />
            
            {/* AI Status Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-100">
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-purple-600" />
                <span className="text-xs font-medium text-slate-700">
                  {audioLevel > 0.3 ? 'Speaking...' : 'Listening...'}
                </span>
              </div>
            </div>
          </div>

          {/* Animated Transcript */}
          <div className="border-t border-slate-100 bg-white/50">
            <AnimatedTranscript 
              transcripts={transcripts} 
              isAIHandling={isAIHandling} 
            />
          </div>
        </div>

        {/* Right: Context Panel (70%) */}
        <div className="flex-1 border-l border-slate-100 bg-white overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Customer Context Header */}
            {customer && (
              <div className="bg-gradient-to-r from-[#0a1128] to-slate-800 rounded-xl p-4 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[#81d8d0] flex items-center justify-center text-[#0a1128] font-bold text-lg">
                    {customer.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{customer.name || 'Customer'}</h3>
                    <p className="text-slate-300 text-sm">{customer.phone}</p>
                  </div>
                  {customer.status === 'vip' && (
                    <span className="ml-auto px-2 py-1 bg-amber-500 text-xs font-bold rounded uppercase">VIP</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/10 rounded-lg p-2">
                    <p className="text-xs text-slate-300">Calls</p>
                    <p className="text-lg font-bold">{customer.totalCalls || 0}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <p className="text-xs text-slate-300">Value</p>
                    <p className="text-lg font-bold">₹{(customer.lifetimeValue || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <p className="text-xs text-slate-300">Status</p>
                    <p className="text-lg font-bold capitalize">{customer.status || 'New'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Previous Notes */}
            {customer?.notes && (
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-purple-600" />
                  <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wide">Previous Call Notes</h4>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{customer.notes}</p>
              </div>
            )}

            {/* Scheduled Meeting */}
            {customer?.scheduledMeeting && (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">📅 Scheduled Meeting</h4>
                <p className="text-emerald-800 text-sm">{customer.scheduledMeeting}</p>
              </div>
            )}

            {/* AI Suggestions */}
            {aiSuggestions && aiSuggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">AI Insights</h4>
                {aiSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg px-4 py-3 text-sm ${
                      suggestion.type === 'alert' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      suggestion.type === 'priority' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                      suggestion.type === 'context' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                      suggestion.type === 'history' ? 'bg-slate-50 text-slate-700 border border-slate-200' :
                      'bg-slate-50 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {suggestion.text}
                  </div>
                ))}
              </div>
            )}

            {/* Recent Conversations */}
            {recentConversations && recentConversations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Recent Call History</h4>
                {recentConversations.slice(0, 3).map((convo, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-slate-600 text-sm">{convo.summary}</p>
                    <p className="text-slate-400 text-[10px] mt-1">
                      {new Date(convo.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Live Transcript Log */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Live Transcript</h4>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 max-h-48 overflow-y-auto space-y-2">
                {transcripts.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">Waiting for conversation...</p>
                ) : (
                  transcripts.slice(-5).map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        entry.speaker === 'ai' ? 'bg-purple-100' :
                        entry.speaker === 'customer' ? 'bg-slate-200' : 'bg-[#81d8d0]/30'
                      }`}>
                        {entry.speaker === 'customer' ? <User size={10} /> : <Bot size={10} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600 truncate">{entry.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIVisualizer;
