import React from 'react';
import { Activity, AlertTriangle, Thermometer, MessageCircle } from 'lucide-react';

interface SentimentMatrixProps {
  sentimentScore: number;
  urgency: 'low' | 'medium' | 'high';
  pace: 'slow' | 'normal' | 'fast';
  topic: string;
}

export default function SentimentMatrix({ 
  sentimentScore = 0, 
  urgency = 'low', 
  pace = 'normal',
  topic = 'General'
}: SentimentMatrixProps) {

  // Helper to determine mood label and color
  const getMood = (score: number) => {
    if (score >= 2) return { label: 'Ecstatic', color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
    if (score > 0) return { label: 'Positive', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (score === 0) return { label: 'Neutral', color: 'text-slate-400', bg: 'bg-slate-400/10' };
    if (score >= -2) return { label: 'Frustrated', color: 'text-rose-400', bg: 'bg-rose-400/10' };
    return { label: 'Angry', color: 'text-rose-600', bg: 'bg-rose-600/10' };
  };
  
  // Debug log to verify updates
  console.log('Mood Matrix Render:', { sentimentScore, urgency, pace, topic });

  const mood = getMood(sentimentScore);

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      {/* 1. Mood */}
      <div className={`rounded-xl p-3 flex flex-col justify-between border border-slate-100/50 ${mood.bg} transition-colors duration-500`}>
        <div className="flex items-center gap-1.5 text-slate-500/80 mb-1">
           <Activity size={12} />
           <span className="text-[10px] font-bold uppercase tracking-wider">Mood</span>
        </div>
        <p className={`text-lg font-bold ${mood.color} truncate leading-none tracking-tight`}>{mood.label}</p>
      </div>

      {/* 2. Urgency */}
      <div className={`rounded-xl p-3 flex flex-col justify-between border border-slate-100/50 ${
          urgency === 'high' ? 'bg-rose-500/10' : urgency === 'medium' ? 'bg-amber-500/10' : 'bg-slate-500/5'
      } transition-colors duration-500`}>
        <div className="flex items-center gap-1.5 text-slate-500/80 mb-1">
           <AlertTriangle size={12} />
           <span className="text-[10px] font-bold uppercase tracking-wider">Urgency</span>
        </div>
        <p className={`text-lg font-bold truncate leading-none tracking-tight ${
            urgency === 'high' ? 'text-rose-500' :
            urgency === 'medium' ? 'text-amber-500' : 'text-slate-400'
        }`}>
            {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
        </p>
      </div>

      {/* 3. Pace */}
      <div className="rounded-xl p-3 flex flex-col justify-between border border-slate-100/50 bg-indigo-500/5">
        <div className="flex items-center gap-1.5 text-slate-500/80 mb-1">
           <Thermometer size={12} />
           <span className="text-[10px] font-bold uppercase tracking-wider">Pace</span>
        </div>
        <p className="text-sm font-bold text-indigo-400 truncate leading-none mt-1">
            {pace.charAt(0).toUpperCase() + pace.slice(1)}
        </p>
      </div>

      {/* 4. Topic */}
      <div className="rounded-xl p-3 flex flex-col justify-between border border-slate-100/50 bg-slate-500/5">
        <div className="flex items-center gap-1.5 text-slate-500/80 mb-1">
           <MessageCircle size={12} />
           <span className="text-[10px] font-bold uppercase tracking-wider">Topic</span>
        </div>
        <p className="text-sm font-medium text-slate-500 line-clamp-1 leading-none mt-1">
            {topic}
        </p>
      </div>
    </div>
  );
}
