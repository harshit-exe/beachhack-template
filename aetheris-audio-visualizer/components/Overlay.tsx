
import React from 'react';
import { Mic, Upload, Activity, Layers } from 'lucide-react';
import TranscriptionLogs from './TranscriptionLogs';

interface OverlayProps {
  isPlaying: boolean;
  onMicStart: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Overlay: React.FC<OverlayProps> = ({ isPlaying, onMicStart, onFileUpload }) => {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-10 pointer-events-none select-none">
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/10">
              <Layers size={18} className="text-blue-500" />
            </div>
            <h1 className="text-xl font-bold tracking-[0.2em] text-slate-900 uppercase flex items-center gap-2">
              AETHERIS <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            </h1>
          </div>
          <p className="text-slate-400 text-[9px] font-black tracking-[0.4em] uppercase ml-1">
            Neural Signal Processor v4.0.2
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           {isPlaying && (
             <div className="flex items-center gap-4 bg-white/60 backdrop-blur-xl px-5 py-2.5 rounded-full border border-blue-100 shadow-sm">
               <span className="text-[10px] text-blue-600 font-bold tracking-widest animate-pulse uppercase">Sync Active</span>
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
             </div>
           )}
        </div>
      </div>

      {/* Main Interaction Center */}
      {!isPlaying && (
        <div className="self-center flex flex-col items-center gap-8 pointer-events-auto max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="w-full bg-white/60 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white flex flex-col items-center gap-10 text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
            <div className="space-y-4">
              <h2 className="text-3xl font-light text-slate-900 tracking-tight">System Initialization</h2>
              <p className="text-slate-500 text-sm leading-relaxed px-4 font-medium">
                Connect your interface to visualize multi-frequency spectral data through high-dimensional mesh deformation.
              </p>
            </div>
            
            <div className="flex flex-col w-full gap-4">
              <button 
                onClick={onMicStart}
                className="w-full bg-blue-600 text-white py-5 px-8 rounded-full font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
              >
                <Mic size={18} />
                Connect Audio Source
              </button>
              
              <label className="w-full bg-slate-50 border border-slate-200 text-slate-600 py-5 px-8 rounded-full font-semibold hover:bg-white transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-[0.98]">
                <Upload size={18} />
                Upload Dataset
                <input type="file" className="hidden" accept="audio/*" onChange={onFileUpload} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Active Visualizer Feedback */}
      <div className="absolute bottom-48 left-1/2 -translate-x-1/2 w-full px-12 pointer-events-none">
        <TranscriptionLogs isPlaying={isPlaying} />
      </div>

      {/* Footer / Status Bar */}
      <div className="flex justify-between items-end">
        <div className="flex gap-12 items-center">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Signal Amplitude</span>
            <div className="flex gap-1 h-6 items-end">
              {[...Array(16)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 rounded-full bg-blue-500 transition-all duration-300 ${isPlaying ? '' : 'opacity-10'}`}
                  style={{ 
                    height: isPlaying ? `${20 + Math.random() * 80}%` : '15%',
                    transitionDelay: `${i * 0.03}s`
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="hidden lg:flex gap-10 border-l border-slate-200 pl-10">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-slate-400 font-black tracking-widest">Core Topology</span>
              <span className="text-sm font-mono text-slate-800 mt-1">Luminance-v4</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-slate-400 font-black tracking-widest">Response</span>
              <span className="text-sm font-mono text-slate-800 mt-1">Cold-Sync</span>
            </div>
          </div>
        </div>

        {isPlaying && (
          <div className="pointer-events-auto">
             <button 
               onClick={() => window.location.reload()}
               className="flex items-center gap-3 px-7 py-3.5 bg-white/80 hover:bg-red-50 backdrop-blur-xl rounded-full border border-slate-200 text-slate-400 hover:text-red-500 transition-all group shadow-sm"
             >
               <Activity size={16} className="group-hover:rotate-90 transition-transform" />
               <span className="text-[10px] font-black uppercase tracking-widest">Terminate Core</span>
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overlay;