'use client';

import { Phone, PhoneOff, User, Settings, LogOut } from 'lucide-react';
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
    <header className="h-[10vh] bg-white border-b-2 border-gray-200 px-6 flex items-center justify-between shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Phone className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          ContextHub
        </h1>
      </div>
      
      {/* Call Status */}
      <div className="flex items-center gap-4">
        {isCallActive ? (
          <div className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-red-700">LIVE CALL ({callDuration})</span>
              {customerName && (
                <span className="text-sm text-red-600">{customerName} • {customerPhone}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            <span className="font-medium text-green-700">Online - Ready for calls</span>
          </div>
        )}
      </div>
      
      {/* Agent Profile */}
      <div className="relative">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">{agentName}</p>
            <p className="text-xs text-gray-500">Support Agent</p>
          </div>
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
