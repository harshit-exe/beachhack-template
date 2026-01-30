'use client';

import { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Lightbulb, 
  Copy,
  Check,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { AISuggestion } from '@/types';

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[];
  recommendedActions: string[];
  isLoading?: boolean;
  onUseSuggestion?: (suggestion: string) => void;
  onRefresh?: () => void;
}

export default function AISuggestionsPanel({ 
  suggestions = [],
  recommendedActions = [],
  isLoading = false,
  onUseSuggestion,
  onRefresh
}: AISuggestionsPanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    if (onUseSuggestion) {
      onUseSuggestion(text);
    }
  };

  return (
    <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#0a1128]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#81d8d0] flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#0a1128]" />
          </div>
          <div>
            <span className="font-bold text-sm text-white block">AI Co-Pilot</span>
            <span className="text-[10px] text-white/60 uppercase tracking-wider">Real-time suggestions</span>
          </div>
        </div>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#81d8d0] text-[#0a1128] rounded-lg hover:bg-[#6bc4bc] transition-colors font-bold text-xs uppercase tracking-wider"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
        {/* Suggested Responses */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#81d8d0]" />
            <h3 className="text-xs font-bold text-[#0a1128] uppercase tracking-wider">Say This to Customer</h3>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="bg-[#81d8d0]/10 rounded-xl p-4 border border-[#81d8d0]/30 hover:border-[#81d8d0] hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-3.5 h-3.5 text-[#0a1128]" />
                        <span className="text-[10px] font-bold text-[#0a1128] uppercase tracking-wider">
                          Suggestion {index + 1}
                        </span>
                      </div>
                      <p className="text-base text-[#0a1128] font-medium leading-relaxed">
                        "{suggestion.text}"
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(suggestion.text, index)}
                      className="flex-shrink-0 px-4 py-2 bg-[#0a1128] text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-xl">
              <div className="w-14 h-14 rounded-xl bg-[#81d8d0]/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-[#81d8d0]" />
              </div>
              <p className="text-slate-500 text-base font-medium">Listening for conversation...</p>
              <p className="text-slate-400 text-sm mt-1">AI suggestions will appear here</p>
            </div>
          )}
        </div>

        {/* Smart Actions */}
        {recommendedActions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-[#0a1128] uppercase tracking-wider">Recommended Actions</h3>
            </div>
            <div className="space-y-3">
              {recommendedActions.map((action, index) => (
                <label 
                  key={index}
                  className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                >
                  <input type="checkbox" className="w-4 h-4 text-[#0a1128] rounded accent-[#0a1128]" />
                  <span className="text-sm text-[#0a1128] font-medium">{action}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
