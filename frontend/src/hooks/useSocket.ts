'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
    IncomingCall,
    TranscriptionUpdateEvent,
    CallEndedEvent,
    AISuggestionResponse
} from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5001';

export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socketInstance = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketInstance.on('connect', () => {
            setIsConnected(true);
            console.log('🔌 Connected to WebSocket');
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
            console.log('🔌 Disconnected from WebSocket');
        });

        socketInstance.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
        });

        socketRef.current = socketInstance;
        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    // Go online as an agent
    const goOnline = useCallback((agentId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('agent:online', { agentId });
        }
    }, []);

    // Go offline
    const goOffline = useCallback((agentId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('agent:offline', { agentId });
        }
    }, []);

    // Join a call room
    const joinCall = useCallback((callId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('call:join', { callId });
        }
    }, []);

    // Leave a call room
    const leaveCall = useCallback((callId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('call:leave', { callId });
        }
    }, []);

    // Answer a call
    const answerCall = useCallback((callId: string, agentId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('call:answer', { callId, agentId });
        }
    }, []);

    // Request AI suggestions
    const requestSuggestions = useCallback((data: {
        conversationId: string;
        history: { speaker: string; text: string }[];
        lastMessage: string;
        customer?: object;
    }) => {
        if (socketRef.current) {
            socketRef.current.emit('ai:suggest', data);
        }
    }, []);

    // Add transcription
    const addTranscription = useCallback((conversationId: string, speaker: string, text: string) => {
        if (socketRef.current) {
            socketRef.current.emit('transcription:add', { conversationId, speaker, text });
        }
    }, []);

    // Subscribe to incoming calls
    const onIncomingCall = useCallback((callback: (data: IncomingCall) => void) => {
        if (socketRef.current) {
            socketRef.current.on('call:incoming', callback);
            return () => {
                socketRef.current?.off('call:incoming', callback);
            };
        }
    }, []);

    // Subscribe to call answered
    const onCallAnswered = useCallback((callback: (data: { callId: string; agentId: string }) => void) => {
        if (socketRef.current) {
            socketRef.current.on('call:answered', callback);
            return () => {
                socketRef.current?.off('call:answered', callback);
            };
        }
    }, []);

    // Subscribe to transcription updates
    const onTranscriptionUpdate = useCallback((callback: (data: TranscriptionUpdateEvent) => void) => {
        if (socketRef.current) {
            socketRef.current.on('transcription:update', callback);
            return () => {
                socketRef.current?.off('transcription:update', callback);
            };
        }
    }, []);

    // Subscribe to AI suggestions
    const onAISuggestion = useCallback((callback: (data: AISuggestionResponse & { conversationId: string }) => void) => {
        if (socketRef.current) {
            socketRef.current.on('ai:suggestion', callback);
            return () => {
                socketRef.current?.off('ai:suggestion', callback);
            };
        }
    }, []);

    // Subscribe to AI voice active with context
    const onAIVoiceActive = useCallback((callback: (data: {
        callId: string;
        callSid: string;
        status: string;
        message: string;
        customerContext?: {
            name: string;
            phone: string;
            status: string;
            notes: string | null;
            totalCalls: number;
            scheduledMeeting: string | null;
            lifetimeValue: number;
        };
        recentConversations?: Array<{
            summary: string;
            date: string;
            status: string;
        }>;
        aiSuggestions?: Array<{
            type: string;
            text: string;
        }>;
    }) => void) => {
        if (socketRef.current) {
            socketRef.current.on('call:ai-voice-active', callback);
            return () => {
                socketRef.current?.off('call:ai-voice-active', callback);
            };
        }
    }, []);

    // Subscribe to call ended
    const onCallEnded = useCallback((callback: (data: CallEndedEvent) => void) => {
        if (socketRef.current) {
            socketRef.current.on('call:ended', callback);
            return () => {
                socketRef.current?.off('call:ended', callback);
            };
        }
    }, []);

    return {
        socket,
        isConnected,
        goOnline,
        goOffline,
        joinCall,
        leaveCall,
        answerCall,
        requestSuggestions,
        addTranscription,
        onIncomingCall,
        onCallAnswered,
        onTranscriptionUpdate,
        onAISuggestion,
        onAIVoiceActive,
        onCallEnded
    };
}
