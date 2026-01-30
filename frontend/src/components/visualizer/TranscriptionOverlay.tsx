
import React, { useRef, useEffect } from 'react';
import { User, Bot } from 'lucide-react';
import { TranscriptionEntry } from '@/types';

interface TranscriptionOverlayProps {
    transcription: TranscriptionEntry[];
    isPlaying: boolean;
}

const COLORS = {
    white: '#F9FAFB',
    mint: '#C1FCD3',
    cyan: '#96E1D9',
    darkBlue: '#0A1045'
};

const TranscriptionOverlay: React.FC<TranscriptionOverlayProps> = ({ transcription, isPlaying }) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to keep latest messages visible
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [transcription]);

    if (transcription.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 z-20 overflow-y-auto scrollbar-hide flex flex-col gap-4 pointer-events-auto"
            style={{
                maxHeight: '300px', // Roughly space for 2-3 messages
                maskImage: 'linear-gradient(to bottom, transparent, black 30%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%)'
            }}
        >
            {transcription.filter(t => t.speaker === 'customer').map((entry, index) => {
                const isAgent = entry.speaker === 'agent';
                return (
                    <div
                        key={index}
                        className={`
                flex items-center gap-4 px-6 py-4 rounded-[2rem] shadow-xl border border-white/20 transition-all duration-500
                animate-in fade-in slide-in-from-bottom-4 shrink-0
                ${isAgent ? 'self-end ml-auto' : 'self-start mr-auto'}
            `}
                        style={{
                            maxWidth: '85%',
                            background: isAgent
                                ? `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`
                                : `linear-gradient(135deg, ${COLORS.white}, #E5E7EB)`,
                            color: COLORS.darkBlue
                        }}
                    >
                        <div className={`
                flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center
                shadow-sm
            `}
                            style={{
                                backgroundColor: isAgent ? 'rgba(255,255,255,0.3)' : COLORS.darkBlue,
                                color: isAgent ? COLORS.darkBlue : COLORS.white
                            }}
                        >
                            {isAgent ? <Bot size={20} /> : <User size={20} />}
                        </div>

                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black tracking-widest uppercase opacity-70">
                                    {isAgent ? 'YOU' : 'CUSTOMER'}
                                </span>
                                <span className="text-[9px] font-mono opacity-50">
                                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-sm font-bold leading-relaxed opacity-90">
                                {entry.text}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TranscriptionOverlay;
