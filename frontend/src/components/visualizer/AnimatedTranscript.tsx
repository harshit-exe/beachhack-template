'use client';

import React, { useState, useEffect } from 'react';
import { User, Bot } from 'lucide-react';

interface TranscriptEntry {
  speaker: 'customer' | 'agent' | 'ai' | 'system';
  text: string;
  timestamp: Date;
}

interface AnimatedTranscriptProps {
  transcripts: TranscriptEntry[];
  isAIHandling?: boolean;
}

/**
 * Animated Transcript Display
 * Shows transcription text that fades in/out, one at a time
 * Designed to sit below the AI visualizer globe
 */
const AnimatedTranscript: React.FC<AnimatedTranscriptProps> = ({ 
  transcripts, 
  isAIHandling = false 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Get the latest transcript
  const latestTranscript = transcripts[transcripts.length - 1];

  // Auto-cycle through transcripts when multiple exist
  useEffect(() => {
    if (transcripts.length === 0) return;
    
    // Show latest for 4 seconds, then fade
    setCurrentIndex(transcripts.length - 1);
    setIsVisible(true);
    
    const fadeTimer = setTimeout(() => {
      if (transcripts.length > 1) {
        setIsVisible(false);
      }
    }, 4000);

    return () => clearTimeout(fadeTimer);
  }, [transcripts.length]);

  if (transcripts.length === 0 || !latestTranscript) {
    return (
      <div className="flex flex-col items-center justify-center py-4 px-6">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
          <span>{isAIHandling ? 'AI is listening...' : 'Listening...'}</span>
        </div>
      </div>
    );
  }

  const isAI = latestTranscript.speaker === 'ai';
  const isCustomer = latestTranscript.speaker === 'customer';

  return (
    <div className="flex flex-col items-center justify-center py-4 px-6 min-h-[80px]">
      <div 
        className={`
          transition-all duration-500 ease-out max-w-md mx-auto
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}
      >
        {/* Speaker indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${isAI ? 'bg-purple-100 text-purple-600' : 
              isCustomer ? 'bg-slate-100 text-slate-600' : 
              'bg-[#81d8d0]/20 text-[#0a1128]'}
          `}>
            {isCustomer ? <User size={16} /> : <Bot size={16} />}
          </div>
          <span className={`
            text-[10px] font-bold uppercase tracking-wider
            ${isAI ? 'text-purple-600' : isCustomer ? 'text-slate-500' : 'text-[#0a1128]'}
          `}>
            {isAI ? 'AI Assistant' : isCustomer ? 'Customer' : 'Agent'}
          </span>
        </div>

        {/* Transcript text */}
        <p className={`
          text-center text-sm leading-relaxed font-medium
          ${isAI ? 'text-purple-800' : isCustomer ? 'text-slate-700' : 'text-[#0a1128]'}
        `}>
          "{latestTranscript.text}"
        </p>
      </div>

      {/* Transcript count indicator */}
      {transcripts.length > 1 && (
        <div className="flex items-center gap-1 mt-3">
          {transcripts.slice(-3).map((_, idx) => (
            <div 
              key={idx}
              className={`
                w-1.5 h-1.5 rounded-full transition-colors
                ${idx === transcripts.slice(-3).length - 1 ? 'bg-[#81d8d0]' : 'bg-slate-200'}
              `}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnimatedTranscript;
