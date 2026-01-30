'use client';

import { Phone, PhoneOff, User, Settings, LogOut, Shield, Bell, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  isCallActive: boolean;
  callStartTime?: Date;
  customerName?: string;
  customerPhone?: string;
  agentName?: string;
  onEndCall?: () => void;
}

export default function Header({ 
  isCallActive, 
  callStartTime,
  customerName,
  customerPhone,
  agentName = 'Agent'
}: HeaderProps) {
  const [callDuration, setCallDuration] = useState('00:00');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!isCallActive || !callStartTime) {
      setCallDuration('00:00');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
      const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
      const seconds = (diff % 60).toString().padStart(2, '0');
      setCallDuration(`${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCallActive, callStartTime]);

  return (
    <header className="h-14 border-b border-slate-100 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#0a1128] rounded-xl flex items-center justify-center shadow-lg">
          <Shield size={16} className="text-[#81d8d0]" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#0a1128]">
            ContextHub
          </h1>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            AI Customer Intelligence
          </p>
        </div>
      </div>
      
      {/* Call Status */}
      <div className="flex items-center gap-4">
        {isCallActive ? (
          <div className="flex items-center gap-3 bg-[#0a1128] px-4 py-2 rounded-xl">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-[#81d8d0] rounded-full wave-bar"
                  style={{ height: '8px' }}
                />
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#81d8d0] uppercase tracking-wider">
                LIVE • {callDuration}
              </span>
              {customerName && (
                <span className="text-[10px] text-white/70">
                  {customerName} • {customerPhone}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-[#81d8d0]/10 px-4 py-2 rounded-xl border border-[#81d8d0]/30">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#81d8d0]"></span>
            <span className="text-xs font-semibold text-[#0a1128]">Ready for calls</span>
          </div>
        )}
      </div>
      
      {/* Right Side Actions */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-300 hover:text-[#0a1128] transition-colors relative">
            <Bell size={16} />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white" />
          </button>
          <button className="p-2 text-slate-300 hover:text-[#0a1128] transition-colors">
            <Activity size={16} />
          </button>
        </div>
        
        <div className="h-6 w-px bg-slate-100" />
        
        {/* Agent Profile */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 hover:bg-slate-50 px-2 py-1.5 rounded-xl transition-colors group"
          >
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-bold text-[#0a1128]">{agentName}</span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Support Agent</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0a1128] to-slate-800 flex items-center justify-center font-bold text-[10px] text-[#81d8d0] border border-white shadow-md group-hover:scale-105 transition-transform">
              {agentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-slide-in">
              <button className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                <Settings className="w-4 h-4 text-slate-400" />
                Settings
              </button>
              <button className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
