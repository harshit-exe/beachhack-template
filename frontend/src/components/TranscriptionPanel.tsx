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
      return { color: '#16a34a', bg: '#dcfce7', label: '😊 Happy' };
    case 'negative':
      return { color: '#dc2626', bg: '#fee2e2', label: '😟 Frustrated' };
    default:
      return { color: '#6b7280', bg: '#f3f4f6', label: '😐 Neutral' };
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
    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          {isRecording ? (
            <>
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
              </span>
              <Mic className="w-6 h-6 text-red-500" />
              <span className="font-bold text-lg text-gray-900">Live Transcription</span>
            </>
          ) : (
            <>
              <MicOff className="w-6 h-6 text-gray-400" />
              <span className="font-bold text-lg text-gray-500">Not Recording</span>
            </>
          )}
        </div>
        
        {/* Sentiment Indicator */}
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
          style={{ backgroundColor: sentimentStyle.bg, color: sentimentStyle.color }}
        >
          {sentimentStyle.label}
        </div>
      </div>

      {/* Transcription Content - LARGER TEXT */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
        {transcription.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Headphones className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-lg">Waiting for conversation to start...</p>
            <p className="text-sm text-gray-300">Transcription will appear here in real-time</p>
          </div>
        ) : (
          transcription.map((entry, index) => (
            <div
              key={index}
              className={`rounded-xl p-4 transition-all duration-300 animate-fadeIn ${
                entry.speaker === 'customer' 
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 ml-0 mr-4' 
                  : entry.speaker === 'agent'
                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 ml-4 mr-0'
                  : 'bg-gray-50 border-l-4 border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  entry.speaker === 'customer' 
                    ? 'bg-blue-500' 
                    : entry.speaker === 'agent'
                    ? 'bg-green-500'
                    : 'bg-gray-400'
                }`}>
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className={`text-sm font-bold uppercase tracking-wide ${
                  entry.speaker === 'customer' 
                    ? 'text-blue-700' 
                    : entry.speaker === 'agent'
                    ? 'text-green-700'
                    : 'text-gray-600'
                }`}>
                  {entry.speaker === 'customer' ? 'Customer' : entry.speaker === 'agent' ? 'You' : 'System'}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {formatTime(entry.timestamp)}
                </span>
              </div>
              {/* LARGER TEXT for easy reading */}
              <p className="text-xl leading-relaxed text-gray-800 font-medium pl-11">
                {entry.text}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {transcription.length} message{transcription.length !== 1 ? 's' : ''}
        </span>
        {isRecording && (
          <span className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Listening...
          </span>
        )}
      </div>
    </div>
  );
}
