// Customer Types
export interface CustomerAlert {
    type: 'warning' | 'info' | 'critical';
    message: string;
    createdAt: Date;
    acknowledged: boolean;
}

export interface CustomerInsight {
    category: string;
    description: string;
    confidence: number;
    createdAt: Date;
}

export interface CustomerMetadata {
    totalCalls: number;
    totalSpent: number;
    lifetimeValue: number;
    averageRating: number;
    lastContactDate?: Date;
    firstContactDate?: Date;
    company?: string;
    notes?: string;
    scheduledMeeting?: string;
    preferredLanguage?: string;
}

export interface Customer {
    _id: string;
    phoneNumber: string;
    name?: string;
    email?: string;
    status: 'new' | 'active' | 'vip' | 'churned' | 'blocked';
    tags: string[];
    preferences: {
        communicationChannel: string;
        language: string;
        callbackTime?: string;
        timezone: string;
    };
    metadata: CustomerMetadata;
    alerts: CustomerAlert[];
    insights: CustomerInsight[];
    createdAt: Date;
    updatedAt: Date;
}

// Transcription Types
export interface TranscriptionEntry {
    speaker: 'agent' | 'customer' | 'system';
    text: string;
    timestamp: Date;
    confidence?: number;
}

// AI Analysis Types
export interface SentimentAnalysis {
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    emotion: string;
}

export interface AIAnalysis {
    intent?: string;
    intentConfidence?: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
    sentimentScore?: number;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    topics?: string[];
    keywords?: string[];
}

// AI Suggestion Types
export interface AISuggestion {
    text: string;
    type: 'response' | 'action' | 'knowledge';
    confidence: number;
}

export interface AISuggestionResponse {
    suggestions: AISuggestion[];
    sentiment?: string;
    recommendedActions?: string[];
}

// Conversation Types
export interface CallDetails {
    callSid: string;
    phoneNumber: string;
    direction: 'inbound' | 'outbound';
    duration: number;
    recordingUrl?: string;
    startTime: Date;
    endTime?: Date;
}

export interface Resolution {
    status: 'resolved' | 'pending' | 'escalated' | 'unresolved';
    resolvedAt?: Date;
    resolutionTime?: number;
    notes?: string;
    nextAction?: string;
    followUpDate?: Date;
}

export interface Conversation {
    _id: string;
    customerId: Customer | string;
    agentId?: string;
    channel: 'phone' | 'whatsapp' | 'email' | 'chat' | 'sms';
    status: 'active' | 'completed' | 'abandoned' | 'transferred';
    callDetails: CallDetails;
    transcription: TranscriptionEntry[];
    aiAnalysis: AIAnalysis;
    summary?: {
        auto?: string;
        manual?: string;
        keyPoints?: string[];
    };
    resolution: Resolution;
    tags: string[];
    rating?: number;
    feedback?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Incoming Call Types
export interface IncomingCall {
    callId: string;
    callSid: string;
    conferenceName?: string;
    customer: Customer;
}

// Agent Types
export interface Agent {
    _id: string;
    name: string;
    email: string;
    role: 'agent' | 'supervisor' | 'admin';
    status: 'online' | 'offline' | 'busy' | 'away' | 'break';
}

// Socket Event Types
export interface TranscriptionUpdateEvent {
    conversationId: string;
    speaker: 'agent' | 'customer' | 'system';
    text: string;
    timestamp: Date;
    sentiment?: SentimentAnalysis;
}

export interface CallEndedEvent {
    callId: string;
    callSid?: string;
    duration?: number;
    summary?: string;
}
