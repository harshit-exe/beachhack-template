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
    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-gray-900 block">AI Co-Pilot</span>
            <span className="text-xs text-gray-500">Real-time suggestions</span>
          </div>
        </div>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Suggested Responses */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-bold text-gray-800">Say This to Customer</h3>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-5 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-bold text-purple-700">
                          Suggestion {index + 1}
                        </span>
                      </div>
                      {/* LARGER TEXT */}
                      <p className="text-lg text-gray-800 font-medium leading-relaxed">
                        "{suggestion.text}"
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(suggestion.text, index)}
                      className="flex-shrink-0 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-gray-500 text-lg">Listening for conversation...</p>
              <p className="text-gray-400 text-sm mt-1">AI suggestions will appear here</p>
            </div>
          )}
        </div>

        {/* Smart Actions */}
        {recommendedActions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-gray-800">Recommended Actions</h3>
            </div>
            <div className="space-y-3">
              {recommendedActions.map((action, index) => (
                <label 
                  key={index}
                  className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border-2 border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                >
                  <input type="checkbox" className="w-5 h-5 text-amber-600 rounded" />
                  <span className="text-base text-gray-800 font-medium">{action}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
