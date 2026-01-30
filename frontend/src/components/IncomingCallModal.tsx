'use client';

import { Phone, PhoneOff, User, Clock, AlertTriangle, Bot, Building, Star, Mail } from 'lucide-react';
import { IncomingCall } from '@/types';

interface IncomingCallModalProps {
  call: IncomingCall | null;
  onAnswer: () => void;
  onDecline: () => void;
  onSendToAI?: () => void;
}

export default function IncomingCallModal({ 
  call, 
  onAnswer, 
  onDecline,
  onSendToAI 
}: IncomingCallModalProps) {
  if (!call) return null;

  const customer = call.customer;
  const isNewCustomer = customer.status === 'new';
  const isVIP = customer.status === 'vip';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0a1128]/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-slide-in">
        {/* Header with ringing animation */}
        <div className={`px-6 py-8 text-center ${isVIP ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-[#0a1128]'}`}>
          <div className="relative inline-block">
            {/* Pulse rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="absolute inline-flex h-20 w-20 rounded-full bg-[#81d8d0]/30 animate-ping"></span>
              <span className="absolute inline-flex h-16 w-16 rounded-full bg-[#81d8d0]/40 animate-ping" style={{ animationDelay: '0.2s' }}></span>
            </div>
            
            {/* Phone icon */}
            <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Phone className="w-10 h-10 text-[#81d8d0]" />
            </div>
          </div>
          
          <h2 className="mt-4 text-2xl font-bold text-white">Incoming Call</h2>
          {isVIP && (
            <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full">
              <Star className="w-4 h-4" />
              VIP Customer
            </span>
          )}
        </div>

        {/* Customer Info */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white text-xl font-bold ${
              isVIP ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-[#0a1128] to-slate-700'
            }`}>
              {customer.name 
                ? customer.name.split(' ').map(n => n[0]).join('').toUpperCase()
                : <User className="w-8 h-8" />}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#0a1128]">
                {customer.name || 'New Customer'}
              </h3>
              <p className="text-slate-500">{customer.phoneNumber}</p>
              {isNewCustomer && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-[#81d8d0]/20 text-[#0a1128] text-xs font-semibold rounded-full">
                  <User className="w-3 h-3" />
                  First Time Caller
                </span>
              )}
            </div>
          </div>

          {/* Customer Details for returning customers */}
          {!isNewCustomer && (
            <div className="space-y-2 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.metadata?.company && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>{customer.metadata.company}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Last contact: {customer.metadata?.lastContactDate 
                  ? new Date(customer.metadata.lastContactDate).toLocaleDateString()
                  : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>Total calls: {customer.metadata?.totalCalls || 0}</span>
              </div>
              
              {/* Previous Call Notes - highlighted */}
              {customer.metadata?.notes && (
                <div className="mt-2 p-3 bg-[#81d8d0]/10 border border-[#81d8d0]/30 rounded-lg">
                  <p className="text-xs font-bold text-[#0a1128] mb-1">📋 Previous Call Context:</p>
                  <p className="text-sm text-[#0a1128]">{customer.metadata.notes}</p>
                </div>
              )}
              
              {/* Scheduled Meeting */}
              {customer.metadata?.scheduledMeeting && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-xs font-bold text-emerald-700 mb-1">📅 Scheduled Meeting:</p>
                  <p className="text-sm text-emerald-800">{customer.metadata.scheduledMeeting}</p>
                </div>
              )}
              
              {/* Alerts */}
              {customer.alerts && customer.alerts.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{customer.alerts[customer.alerts.length - 1].message}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons - 3 options */}
          <div className="space-y-3">
            {/* Primary: Answer */}
            <button
              onClick={onAnswer}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#81d8d0] text-[#0a1128] rounded-xl font-bold hover:bg-[#6bc4bc] transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              <Phone className="w-5 h-5" />
              Answer Call
            </button>
            
            {/* Secondary actions */}
            <div className="flex gap-3">
              <button
                onClick={onDecline}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
              >
                <PhoneOff className="w-5 h-5" />
                Decline
              </button>
              {onSendToAI && (
                <button
                  onClick={onSendToAI}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0a1128] text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                >
                  <Bot className="w-5 h-5" />
                  Send to AI
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
