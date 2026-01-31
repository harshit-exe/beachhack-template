'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Phone, 
  Star, 
  Calendar,
  MessageCircle,
  UserCheck,
  Bot,
  PhoneOff,
  Gift,
  FileText,
  Clock,
  Mic,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Zap,
  Heart
} from 'lucide-react';

// Dynamic import for the visualizer
const VisualizerScene = dynamic(() => import('./VisualizerScene'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-20 h-20 rounded-full bg-slate-100 animate-pulse" />
    </div>
  )
});

interface CustomerContext {
  name: string;
  phone: string;
  status: string;
  notes: string | null;
  totalCalls: number;
  scheduledMeeting: string | null;
  lifetimeValue: number;
  keyPoints?: string[];
  intents?: string[];
  churnRisk?: 'low' | 'medium' | 'high';
  engagementScore?: number;
  nextBestAction?: string;
  keyDates?: Array<{ label: string; date: string; description: string }>;
  preferences?: {
    delivery?: string;
    likes?: string[];
    dislikes?: string[];
    channel?: string;
    notes?: string;
  };
  conversationSummaries?: Array<{
    date: Date;
    summary: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    keyTopics?: string[];
    value?: number;
  }>;
}

interface TranscriptEntry {
  speaker: 'customer' | 'agent' | 'ai' | 'system';
  text: string;
  timestamp: Date;
}

interface CallVisualizerProps {
  isActive: boolean;
  isAIHandling?: boolean;
  customer?: CustomerContext | null;
  aiSuggestions?: Array<{ type: string; text: string }>;
  callDuration?: string;
  currentSpeaker?: 'customer' | 'agent' | 'ai' | null;
  transcripts?: TranscriptEntry[];
  onReclaimCall?: () => void;
  onTransferToAI?: () => void;
  onEndCall?: () => void;
}

const CallVisualizer: React.FC<CallVisualizerProps> = ({
  isActive,
  isAIHandling = false,
  customer,
  aiSuggestions,
  callDuration = '00:00',
  transcripts = [],
  onReclaimCall,
  onTransferToAI,
  onEndCall
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [latestMessage, setLatestMessage] = useState<TranscriptEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'context' | 'store' | 'history'>('context');
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const prevLengthRef = useRef(0);

  // Fetch store data on mount
  useEffect(() => {
    fetch('http://localhost:5001/api/store')
      .then(res => res.json())
      .then(data => setStoreProducts(data.products || []))
      .catch(err => console.error('Failed to load store products', err));
  }, []);

  useEffect(() => {
    if (transcripts.length > prevLengthRef.current) {
      setLatestMessage(transcripts[transcripts.length - 1]);
      setAudioLevel(1.0);
      prevLengthRef.current = transcripts.length;
    }
  }, [transcripts]);

  useEffect(() => {
    if (audioLevel > 0.15) {
      const decay = setInterval(() => setAudioLevel(prev => Math.max(0.1, prev - 0.05)), 80);
      return () => clearInterval(decay);
    }
  }, [audioLevel]);

  useEffect(() => {
    if (!isActive) return;
    const pulse = setInterval(() => {
      if (audioLevel < 0.2) setAudioLevel(0.25);
    }, 2500);
    return () => clearInterval(pulse);
  }, [isActive, audioLevel]);

  const renderContextTab = () => (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* 1. Vital Context Grid (Enhanced) */}
      <div className="grid grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Intent + Key Points */}
        <div className="flex flex-col gap-4">
          
          {/* Intent Card - Critical */}
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Star size={80} className="text-amber-500" />
            </div>
            <p className="text-amber-700 text-xs font-bold tracking-[0.2em] uppercase mb-2">Current Intent</p>
            <p className="text-amber-950 text-xl font-serif font-medium leading-snug">
              {customer?.notes?.split('.')[0] || 'Analyzing conversation...'}
            </p>
             {customer?.intents && (
              <div className="flex flex-wrap gap-2 mt-4">
                {customer.intents.map((intent: string) => (
                  <span key={intent} className="px-3 py-1 bg-white/60 text-amber-800 rounded-lg text-xs font-bold uppercase border border-amber-200 shadow-sm">
                    {intent}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* NEW: Key Context Points */}
          <div className="bg-white rounded-2xl p-5 border border-indigo-50 shadow-sm flex-1 bg-gradient-to-br from-white to-slate-50">
             <div className="flex items-center gap-2 mb-3">
               <FileText size={14} className="text-indigo-500" />
               <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase">Smart Context</p>
             </div>
             {customer?.keyPoints && customer.keyPoints.length > 0 ? (
               <ul className="space-y-2">
                 {customer.keyPoints.map((point: string, idx: number) => (
                   <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 leading-snug">
                     <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                     {point}
                   </li>
                 ))}
               </ul>
             ) : (
               <p className="text-slate-400 text-sm italic">Listening for key details...</p>
             )}
          </div>
        </div>

        {/* Dynamic Insights Grid */}
        <div className="grid grid-cols-2 gap-4">
           {/* Event */}
           <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
              <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase">Upcoming Event</p>
              {customer?.keyDates && customer.keyDates.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 text-indigo-900 font-semibold text-lg mt-1">
                    <Calendar size={18} className="text-indigo-500" />
                    {customer.keyDates[0].label}
                  </div>
                  <p className="text-slate-500 text-sm font-medium">{customer.keyDates[0].description}</p>
                </div>
              ) : (
                <p className="text-slate-300 text-sm">No events</p>
              )}
           </div>

           {/* Next Action */}
           <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 shadow-sm flex flex-col justify-between">
              <p className="text-emerald-600/70 text-[10px] font-bold tracking-[0.2em] uppercase">Recommended Action</p>
              <div className="mt-1">
                 <p className="text-emerald-900 font-medium leading-snug text-sm">
                   {customer?.nextBestAction || 'Listen & Empathize'}
                 </p>
              </div>
           </div>

           {/* Preferences (Full Width) */}
           <div className="col-span-2 bg-slate-50 rounded-2xl p-4 border border-slate-100">
             <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">Preferences</p>
             <div className="flex flex-wrap gap-2">
               {customer?.preferences?.likes?.map((like: string) => (
                 <span key={like} className="px-2.5 py-1 bg-white text-slate-700 rounded-md text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-1.5">
                   <Heart size={10} className="text-rose-400 fill-rose-400" /> {like}
                 </span>
               ))}
               {customer?.preferences?.delivery && (
                 <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold border border-indigo-100 shadow-sm flex items-center gap-1.5">
                   <Zap size={10} className="text-indigo-500 fill-indigo-500" /> {customer.preferences.delivery}
                 </span>
               )}
               {!customer?.preferences && <span className="text-slate-400 text-xs">Identifying...</span>}
             </div>
           </div>
        </div>
      </div>

      {/* 2. LIVE INTELLIGENCE FEED (Expanded) */}
      <div className="flex-1 bg-white rounded-2xl border-2 border-indigo-50 shadow-lg shadow-indigo-100/50 overflow-hidden flex flex-col">
        <div className="p-4 bg-indigo-50/30 border-b border-indigo-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
               <Bot size={20} />
             </div>
             <div>
               <p className="text-indigo-900 font-bold text-sm tracking-wide">AI COPILOT</p>
               <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider">Live Guidance</p>
             </div>
          </div>
          <div className="flex gap-4">
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Sentiment</p>
                <p className="text-emerald-600 font-bold text-sm">Positive (85%)</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Risk</p>
                <p className="text-slate-600 font-bold text-sm">Low</p>
             </div>
          </div>
        </div>
        
        <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-gradient-to-b from-white to-slate-50/30">
           {/* Fallback if empty */}
           {(!aiSuggestions || aiSuggestions.length === 0) && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 py-8">
                 <Mic size={32} className="mb-3 animate-pulse text-indigo-300" />
                 <p className="text-sm font-bold uppercase tracking-widest text-indigo-300">Listening to conversation...</p>
              </div>
           )}

           {/* Suggestions */}
           {aiSuggestions && aiSuggestions.map((suggestion, idx) => {
              const isAlert = suggestion.type === 'alert' || suggestion.type === 'priority';
              return (
                <div key={idx} className={`group relative pl-4 animate-in slide-in-from-bottom-2 duration-500`}>
                   {/* Decorative Line */}
                   <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-full ${isAlert ? 'bg-rose-400' : 'bg-indigo-300 group-hover:bg-indigo-500 transition-colors'}`}></div>
                   
                   <div className="py-1">
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-60 ${isAlert ? 'text-rose-600' : 'text-slate-500'}`}>
                        {isAlert ? 'Critical Recommendation' : 'Suggested Response'}
                      </p>
                      <p className={`text-base font-medium leading-relaxed ${isAlert ? 'text-rose-900' : 'text-slate-700 group-hover:text-slate-900 transition-colors'}`}>
                        {/* Highlighted Text Rendering */}
                        {(() => {
                           const text = suggestion.text;
                           // Regex for Price (₹550), Colors, and Key Terms
                           const parts = text.split(/(\₹[\d,]+(?:\.\d{2})?|\b(?:White Lily Arrangement|White|Red|Blue|Green|Yellow|Pink|Purple|Orange|Black|Silver|Gold|Birthday|Mom's|Mother's|Anniversary|Premium|Express Delivery)\b)/gi);
                           
                           return (
                             <span>
                               {parts.map((part, i) => {
                                 // Price Styling
                                 if (/^₹[\d,]+(?:\.\d{2})?$/.test(part)) {
                                   return <span key={i} className="font-bold text-emerald-700 bg-emerald-100/50 px-1.5 rounded-md mx-0.5 border border-emerald-200/50">{part}</span>;
                                 }
                                 // Keyword Styling
                                 if (/^(White Lily Arrangement|White|Red|Blue|Green|Yellow|Pink|Purple|Orange|Black|Silver|Gold|Birthday|Mom's|Mother's|Anniversary|Premium|Express Delivery)$/i.test(part)) {
                                   return <span key={i} className="font-bold text-indigo-700 bg-indigo-100/50 px-1.5 rounded-md mx-0.5 border border-indigo-200/50">{part}</span>;
                                 }
                                 return part;
                               })}
                             </span>
                           );
                        })()}
                      </p>
                   </div>
                </div>
              );
           })}
        </div>
      </div>
    </div>
  );

  const renderStoreTab = () => (
    <div className="flex-1 flex flex-col gap-4 animate-in fade-in duration-300 overflow-hidden">
      <div className="flex items-center justify-between">
         <p className="text-slate-400 text-[10px] font-semibold tracking-[0.2em] uppercase">Boutique Inventory</p>
         <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{storeProducts.length} items available</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {storeProducts.map((product: any) => (
          <div key={product._id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition-all bg-white group cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{product.name}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{product.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase rounded-md tracking-wider">
                    {product.category}
                  </span>
                  {product.tags && product.tags.map((tag:string) => (
                    <span key={tag} className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase rounded-md tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold text-slate-900">₹{product.price}</p>
                {product.inStock ? (
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide flex items-center justify-end gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Stock
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wide mt-1">Sold Out</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="flex-1 flex flex-col gap-4 animate-in fade-in duration-300 overflow-hidden">
       <div className="flex items-center justify-between">
         <p className="text-slate-400 text-[10px] font-semibold tracking-[0.2em] uppercase">Journey & Timeline</p>
         <div className="text-xs text-slate-500">Last contact: <span className="text-slate-900 font-medium">Today</span></div>
       </div>
       
       <div className="flex-1 overflow-y-auto pr-2 relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200"></div>

          <div className="space-y-6 pl-0">
             {customer?.conversationSummaries && customer.conversationSummaries.length > 0 ? (
                // Use REAL history + injected mock history
                customer.conversationSummaries.map((convo: any, i:number) => (
                  <div key={i} className="relative pl-8 group">
                     {/* Timeline Dot */}
                     <div className={`absolute left-[9px] top-4 w-1.5 h-1.5 rounded-full border-2 border-white ring-1 ring-slate-300 z-10 ${convo.sentiment === 'negative' ? 'bg-rose-500' : convo.sentiment === 'positive' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                     
                     <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                           {new Date(convo.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                         </span>
                         {convo.value && (
                            <span className="text-xs font-mono font-medium text-emerald-600">+ ₹{convo.value}</span>
                         )}
                       </div>
                       <p className="text-sm text-slate-800 leading-snug">{convo.summary}</p>
                       {convo.keyTopics && (
                         <div className="mt-3 flex gap-2">
                           {convo.keyTopics.map((tag:string) => (
                             <span key={tag} className="text-[9px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 font-medium uppercase tracking-wide">
                               #{tag.toLowerCase()}
                             </span>
                           ))}
                         </div>
                       )}
                     </div>
                  </div>
                ))
             ) : (
                <div className="text-center py-10 text-slate-400">
                  <p>No history records found.</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );

  // Stats for Header
  const ltv = customer?.lifetimeValue || 0;
  const calls = customer?.totalCalls || 0;
  // Format LTV: 25000 -> 25K
  const ltvFormatted = ltv > 1000 ? `${(ltv/1000).toFixed(ltv % 1000 === 0 ? 0 : 1)}K` : ltv;

  return (
    <div className="h-full bg-white rounded-3xl p-6 flex gap-6 border border-slate-100 shadow-2xl shadow-slate-200/50">
      
      {/* LEFT: Globe + Controls (30%) - Dark Mode */}
      <div className="w-[30%] flex flex-col bg-slate-950 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-6 opacity-60">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
             <span className="text-[10px] font-bold uppercase tracking-widest">Live Feed</span>
           </div>
           <span className="text-xs font-mono opacity-80">{callDuration}</span>
        </div>

        {/* Visualizer */}
        <div className="flex-1 flex items-center justify-center relative my-4">
           <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full"></div>
           <div className="w-48 h-48">
              <VisualizerScene audioLevel={audioLevel} isActive={isActive} />
           </div>
        </div>

        {/* Transcription Snippet */}
        <div className="min-h-[100px] mb-6">
           {latestMessage ? (
              <div className="fade-in">
                 <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    {latestMessage.speaker}
                 </p>
                 <p className="text-lg font-light leading-snug text-slate-100">
                   "{latestMessage.text}"
                 </p>
              </div>
           ) : (
             <div className="text-center opacity-30">
               <p className="text-sm">Waiting for speech...</p>
             </div>
           )}
        </div>

        {/* Controls */}
        <div className="space-y-3 mt-auto">
          {isAIHandling ? (
            <button onClick={onReclaimCall} className="w-full py-3 rounded-xl bg-white text-slate-950 text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors">
              Take Control
            </button>
          ) : (
            <button onClick={onTransferToAI} className="w-full py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/50">
              Activate AI Agent
            </button>
          )}
          <div className="flex gap-2">
             <button onClick={onEndCall} className="flex-1 py-3 rounded-xl bg-slate-800/50 hover:bg-rose-900/30 text-rose-300 text-xs font-bold uppercase tracking-widest transition-colors">
               Disconnect
             </button>
          </div>
        </div>
      </div>

      {/* RIGHT: High-Density Context (70%) */}
      <div className="w-[70%] flex flex-col gap-6">
        
        {/* Header: Customer Vital Stats */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
           <div className="flex items-center gap-4">
              <div className="w-12 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-serif italic text-xl">
                 {customer?.name?.substring(0,1) || 'C'}
              </div>
              <div>
                 <h1 className="text-2xl font-serif text-slate-900 leading-none mb-1">{customer?.name || 'Unknown Caller'}</h1>
                 <p className="text-xs text-slate-400 font-medium tracking-wide flex gap-2">
                   {customer?.phone}
                   {customer?.status === 'vip' && <span className="text-amber-500 flex items-center gap-1">★ VIP Client</span>}
                   {customer?.churnRisk === 'low' && <span className="text-emerald-500 flex items-center gap-1">• Safe</span>}
                 </p>
              </div>
           </div>
           
           <div className="flex gap-8">
              <div className="text-right">
                 <p className="text-2xl font-light text-slate-900 font-serif">₹{ltvFormatted}</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lifetime Value</p>
              </div>
              <div className="text-right">
                 <p className="text-2xl font-light text-slate-900 font-serif">{calls}</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Orders</p>
              </div>
              <div className="text-right">
                 <p className="text-2xl font-light text-slate-900 font-serif">{storeProducts.length}</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Products</p>
              </div>
           </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6">
          {[
            { id: 'context', label: 'Analysis & Intent' },
            { id: 'store', label: 'Catalog' },
            { id: 'history', label: 'History' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
           {activeTab === 'context' && renderContextTab()}
           {activeTab === 'store' && renderStoreTab()}
           {activeTab === 'history' && renderHistoryTab()}
        </div>

      </div>
    </div>
  );
};

export default CallVisualizer;
