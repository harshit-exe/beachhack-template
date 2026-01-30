'use client';

import { useEffect, useRef } from 'react';
import { Mic, MicOff, User, Headphones } from 'lucide-react';
import { TranscriptionEntry } from '@/types';

interface TranscriptionPanelProps {
  transcription: TranscriptionEntry[];
  isRecording: boolean;
  currentSentiment?: 'positive' | 'neutral' | 'negative';
  onPause?: () => void;
  onStop?: () => void;
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

function getSentimentStyle(sentiment: string | undefined) {
  switch (sentiment) {
    case 'positive':
      return { color: '#059669', bg: 'bg-emerald-50', border: 'border-emerald-200', label: '😊 Happy' };
    case 'negative':
      return { color: '#dc2626', bg: 'bg-rose-50', border: 'border-rose-200', label: '😟 Frustrated' };
    default:
      return { color: '#6b7280', bg: 'bg-slate-50', border: 'border-slate-200', label: '😐 Neutral' };
  }
}

export default function TranscriptionPanel({ 
  transcription,
  isRecording,
  currentSentiment = 'neutral',
  onPause,
  onStop
}: TranscriptionPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentimentStyle = getSentimentStyle(currentSentiment);

  // Auto-scroll to bottom when new transcription arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  return (
    <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#0a1128]">
        <div className="flex items-center gap-3">
          {isRecording ? (
            <>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-[#81d8d0] rounded-full wave-bar"
                    style={{ height: '8px' }}
                  />
                ))}
              </div>
              <span className="font-bold text-sm text-white uppercase tracking-wider">Live Transcription</span>
            </>
          ) : (
            <>
              <MicOff className="w-5 h-5 text-slate-400" />
              <span className="font-semibold text-sm text-slate-400">Not Recording</span>
            </>
          )}
        </div>
        
        {/* Sentiment Indicator */}
        <div 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${sentimentStyle.bg} ${sentimentStyle.border} border`}
          style={{ color: sentimentStyle.color }}
        >
          {sentimentStyle.label}
        </div>
      </div>

      {/* Transcription Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
        {transcription.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center">
              <Headphones className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-base font-medium">Waiting for conversation...</p>
            <p className="text-sm text-slate-300">Transcription will appear here in real-time</p>
          </div>
        ) : (
          transcription.map((entry, index) => (
            <div
              key={index}
              className={`rounded-xl p-4 transition-all duration-300 animate-slide-in ${
                entry.speaker === 'customer' 
                  ? 'bg-slate-50 border-l-4 border-[#0a1128] ml-0 mr-6' 
                  : entry.speaker === 'agent'
                  ? 'bg-[#81d8d0]/10 border-l-4 border-[#81d8d0] ml-6 mr-0'
                  : 'bg-slate-50 border-l-4 border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  entry.speaker === 'customer' 
                    ? 'bg-[#0a1128]' 
                    : entry.speaker === 'agent'
                    ? 'bg-[#81d8d0]'
                    : 'bg-slate-400'
                }`}>
                  <User className={`w-4 h-4 ${entry.speaker === 'agent' ? 'text-[#0a1128]' : 'text-white'}`} />
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  entry.speaker === 'customer' 
                    ? 'text-[#0a1128]' 
                    : entry.speaker === 'agent'
                    ? 'text-[#0a1128]'
                    : 'text-slate-600'
                }`}>
                  {entry.speaker === 'customer' ? 'Customer' : entry.speaker === 'agent' ? 'You' : 'System'}
                </span>
                <span className="text-[10px] text-slate-400 ml-auto font-medium">
                  {formatTime(entry.timestamp)}
                </span>
              </div>
              <p className="text-lg leading-relaxed text-[#0a1128] font-medium pl-10">
                {entry.text}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {transcription.length} message{transcription.length !== 1 ? 's' : ''}
        </span>
        {isRecording && (
          <span className="flex items-center gap-2 text-xs text-[#81d8d0] font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#81d8d0] animate-pulse"></span>
            Listening...
          </span>
        )}
      </div>
    </div>
  );
}
