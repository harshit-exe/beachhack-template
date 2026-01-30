# ContextHub API Documentation

## Base URL
```
Production (via ngrok): https://YOUR_NGROK_URL.ngrok.io
Local Development: http://localhost:5001
```

> **Note**: Replace `YOUR_NGROK_URL` with the actual ngrok URL when testing.

---

## Authentication
Currently no authentication required. CORS is configured to allow requests from the frontend.

---

## REST API Endpoints

### Health Check

#### GET `/api/health`
Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-30T12:00:00.000Z"
}
```

---

### Customers API

#### GET `/api/customers`
Get all customers (paginated).

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64abc123...",
      "phoneNumber": "+919922041218",
      "name": "Harsh Sharma",
      "email": "harsh@example.com",
      "status": "vip",
      "metadata": {
        "totalCalls": 5,
        "lifetimeValue": 15000,
        "averageRating": 4.5,
        "lastContactDate": "2026-01-30T10:00:00.000Z",
        "company": "TechCorp",
        "notes": "Interested in enterprise plan",
        "scheduledMeeting": "Monday 3 PM"
      },
      "alerts": [],
      "insights": []
    }
  ]
}
```

---

#### GET `/api/customers/:customerId`
Get a single customer by ID.

**Response:**
```json
{
  "success": true,
  "data": { /* Customer object */ }
}
```

---

#### GET `/api/customers/phone/:phone`
Get customer by phone number.

**Example:** `GET /api/customers/phone/+919922041218`

---

#### GET `/api/customers/search`
Search customers by name or email.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |

**Example:** `GET /api/customers/search?q=harsh`

---

#### GET `/api/customers/:customerId/history`
Get call history for a customer.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Max conversations to return |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "conv123...",
      "channel": "phone",
      "createdAt": "2026-01-30T10:00:00.000Z",
      "summary": { "auto": "Customer inquired about pricing" },
      "resolution": { "status": "resolved" },
      "rating": 5
    }
  ]
}
```

---

#### POST `/api/customers`
Create a new customer.

**Request Body:**
```json
{
  "phoneNumber": "+919876543210",
  "name": "New Customer",
  "email": "new@example.com",
  "status": "new"
}
```

---

#### PUT `/api/customers/:customerId`
Update a customer.

**Request Body:** (partial update supported)
```json
{
  "name": "Updated Name",
  "metadata": {
    "notes": "Updated notes"
  }
}
```

---

#### DELETE `/api/customers/:customerId`
Soft delete a customer.

---

### Calls API

#### GET `/api/calls/active`
Get all currently active calls.

---

#### GET `/api/calls/:callId`
Get details of a specific call.

---

#### POST `/api/calls/:callId/end`
End a call.

**Request Body:**
```json
{
  "notes": "Call summary notes"
}
```

---

### AI API

#### POST `/api/ai/suggest`
Get AI-powered response suggestions.

**Request Body:**
```json
{
  "conversationId": "conv123",
  "lastMessage": "Customer's last message",
  "history": [
    { "speaker": "customer", "text": "Hello" },
    { "speaker": "agent", "text": "Hi, how can I help?" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      { "text": "I can help you with that...", "confidence": 0.9 }
    ],
    "recommendedActions": ["Create ticket", "Schedule callback"]
  }
}
```

---

#### POST `/api/ai/sentiment`
Analyze sentiment of text.

**Request Body:**
```json
{
  "text": "I'm very frustrated with this issue",
  "conversationId": "conv123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sentiment": "negative",
    "score": -0.7,
    "emotion": "frustrated"
  }
}
```

---

#### POST `/api/ai/intent`
Detect intent from text.

**Request Body:**
```json
{
  "text": "I want to cancel my subscription",
  "conversationId": "conv123"
}
```

---

#### GET `/api/ai/summary/:conversationId`
Get AI-generated summary of a conversation.

---

### Twilio Webhooks

> These are called by Twilio, not the frontend.

| Endpoint | Description |
|----------|-------------|
| `POST /api/twilio/voice` | Incoming call webhook |
| `POST /api/twilio/status` | Call status updates |
| `POST /api/twilio/join-call` | Dial agent to join conference |
| `POST /api/twilio/forward-to-ai` | Forward call to AI agent |

#### POST `/api/twilio/join-call`
Dial the agent's phone to join an active call.

**Request Body:**
```json
{
  "callId": "call123",
  "conferenceName": "call-call123"
}
```

---

#### POST `/api/twilio/forward-to-ai`
Forward the call to ElevenLabs AI agent.

**Request Body:**
```json
{
  "callId": "call123",
  "callSid": "CA...",
  "customer": { /* Customer object */ }
}
```

---

## WebSocket Events

Connect to: `ws://YOUR_NGROK_URL.ngrok.io` or `ws://localhost:5001`

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `agent:online` | `{ agentId: string }` | Agent goes online |
| `agent:offline` | `{ agentId: string }` | Agent goes offline |
| `call:join` | `{ callId: string }` | Join a call room |
| `call:leave` | `{ callId: string }` | Leave a call room |
| `call:answer` | `{ callId: string, agentId: string }` | Answer incoming call |
| `ai:suggest` | `{ conversationId, history, lastMessage, customer }` | Request AI suggestions |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `call:incoming` | `{ callId, callSid, conferenceName, customer }` | New incoming call |
| `call:answered` | `{ callId, agentId }` | Call was answered |
| `call:ended` | `{ callId }` | Call ended |
| `transcription:update` | `{ conversationId, speaker, text, timestamp, sentiment }` | Real-time transcription |
| `ai:suggestion` | `{ conversationId, suggestions, sentiment, recommendedActions }` | AI suggestions ready |
| `agent:status` | `{ agentId, status }` | Agent status change |

---

## Customer Object Schema

```typescript
interface Customer {
  _id: string;
  phoneNumber: string;           // Required, unique
  name?: string;
  email?: string;
  status: 'new' | 'active' | 'vip' | 'churned' | 'blocked';
  
  metadata: {
    totalCalls: number;
    lifetimeValue: number;
    averageRating: number;
    lastContactDate?: Date;
    firstContactDate?: Date;
    company?: string;
    notes?: string;               // Previous call notes
    scheduledMeeting?: string;    // Upcoming meeting info
  };
  
  alerts: Array<{
    type: 'warning' | 'info' | 'critical';
    message: string;
    createdAt: Date;
  }>;
  
  insights: Array<{
    category: string;
    description: string;
    confidence: number;
  }>;
}
```

---

## Example: Frontend Integration

```typescript
// Connect to WebSocket
import { io } from 'socket.io-client';

const socket = io('https://YOUR_NGROK_URL.ngrok.io');

// Go online
socket.emit('agent:online', { agentId: 'agent-001' });

// Listen for incoming calls
socket.on('call:incoming', (data) => {
  console.log('Incoming call:', data);
  // Show incoming call modal
});

// Listen for transcription
socket.on('transcription:update', (data) => {
  console.log('New transcription:', data.text);
});

// Answer a call
socket.emit('call:answer', { callId: data.callId, agentId: 'agent-001' });
```

---

## Environment Variables (Frontend)

```env
NEXT_PUBLIC_API_URL=https://YOUR_NGROK_URL.ngrok.io
```
