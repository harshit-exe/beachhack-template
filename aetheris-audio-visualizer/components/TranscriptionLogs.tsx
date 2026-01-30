
import React, { useState, useEffect } from 'react';
import { User, Cpu } from 'lucide-react';

interface Log {
  id: string;
  name: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const CONVERSATION: { name: string; role: 'user' | 'ai'; text: string }[] = [
  { name: "Terminal", role: 'user', text: "Requesting audio synchronization..." },
  { name: "Aetheris", role: 'ai', text: "Spectral bridge established. Deforming mesh active." },
  { name: "Terminal", role: 'user', text: "Increase vertex sensitivity in the mid-range." },
  { name: "Aetheris", role: 'ai', text: "Calibration updated. FFT smoothing reduced to 0.12ms." },
  { name: "Terminal", role: 'user', text: "System visual output stable. Signal clear." },
  { name: "Aetheris", role: 'ai', text: "Monitoring neural pathways. Visualizer operational." },
];

const TranscriptionLogs: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    if (!isPlaying) {
      setLogs([]);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      const item = CONVERSATION[index % CONVERSATION.length];
      
      const newLog: Log = {
        id: Math.random().toString(36).substr(2, 9),
        ...item,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setLogs((prev) => [...prev.slice(-1), newLog]);
      index++;
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  if (logs.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-lg mx-auto pointer-events-none">
      {logs.map((log) => (
        <div 
          key={log.id}
          className={`
            flex items-center gap-5 px-7 py-5 rounded-[2rem] shadow-xl border transition-all duration-1000
            animate-in fade-in slide-in-from-bottom-8
            ${log.role === 'ai' 
              ? 'bg-blue-50/80 border-blue-100 backdrop-blur-2xl' 
              : 'bg-white/80 border-slate-100 backdrop-blur-xl'
            }
          `}
        >
          <div className={`
            flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center
            ${log.role === 'ai' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
              : 'bg-slate-100 text-slate-500'
            }
          `}>
            {log.role === 'ai' ? <Cpu size={20} /> : <User size={20} />}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className={`text-[10px] font-black tracking-widest uppercase ${log.role === 'ai' ? 'text-blue-600' : 'text-slate-400'}`}>
                {log.name}
              </span>
              <span className="text-[9px] text-slate-300 font-mono">
                {log.timestamp}
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${log.role === 'ai' ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
              {log.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TranscriptionLogs;