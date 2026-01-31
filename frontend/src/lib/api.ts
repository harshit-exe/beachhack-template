import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Calls API
export const callsApi = {
    getDetails: (callId: string) => api.get(`/api/calls/${callId}`),
    getActive: () => api.get('/api/calls/active'),
    endCall: (callId: string, notes?: string) =>
        api.post(`/api/calls/${callId}/end`, { notes })
};

// Customers API
export const customersApi = {
    getAll: (page = 1, limit = 20) =>
        api.get(`/api/customers?page=${page}&limit=${limit}`),
    getById: (customerId: string) => api.get(`/api/customers/${customerId}`),
    getByPhone: (phone: string) => api.get(`/api/customers/phone/${phone}`),
    search: (query: string) => api.get(`/api/customers/search?q=${query}`),
    getHistory: (customerId: string, limit = 10) =>
        api.get(`/api/customers/${customerId}/history?limit=${limit}`),
    update: (customerId: string, data: Record<string, unknown>) =>
        api.put(`/api/customers/${customerId}`, data),
    create: (data: Record<string, unknown>) => api.post('/api/customers', data)
};

// AI API
export const aiApi = {
    getSuggestions: (data: {
        conversationId?: string;
        lastMessage?: string;
        history?: { speaker: string; text: string }[];
    }) => api.post('/api/ai/suggest', data),

    analyzeSentiment: (text: string, conversationId?: string) =>
        api.post('/api/ai/sentiment', { text, conversationId }),

    detectIntent: (text: string, conversationId?: string) =>
        api.post('/api/ai/intent', { text, conversationId }),

    getSummary: (conversationId: string) =>
        api.get(`/api/ai/summary/${conversationId}`)
};
