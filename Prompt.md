# Claude Code Implementation Prompt
## Complete Backend & Frontend for ContextHub AI Customer Intelligence Platform

---

## 🎯 PROJECT OVERVIEW

Build a complete AI-powered customer support platform called "ContextHub" that enables agents to provide personalized support with real-time AI assistance. The system should:

1. Receive calls via Twilio and display customer info instantly
2. Transcribe conversations in real-time using Groq Whisper
3. Provide AI-powered response suggestions using Groq LLM
4. Store all interactions in MongoDB
5. Display everything in a beautiful agent dashboard

---

## 📁 PROJECT STRUCTURE TO CREATE

```
contexthub/
├── backend/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── environment.js       # Environment config
│   ├── models/
│   │   ├── Customer.js          # Customer schema
│   │   ├── Conversation.js      # Conversation schema
│   │   ├── Agent.js             # Agent schema
│   │   └── AISuggestion.js      # AI suggestion schema
│   ├── services/
│   │   ├── twilio.service.js    # Twilio integration
│   │   ├── groq.service.js      # Groq AI integration
│   │   ├── elevenlabs.service.js # ElevenLabs TTS
│   │   ├── customer.service.js  # Customer CRUD
│   │   └── conversation.service.js # Conversation management
│   ├── controllers/
│   │   ├── call.controller.js   # Call handling logic
│   │   ├── customer.controller.js # Customer endpoints
│   │   ├── ai.controller.js     # AI endpoints
│   │   └── auth.controller.js   # Authentication
│   ├── routes/
│   │   ├── api.routes.js        # Main API routes
│   │   ├── twilio.routes.js     # Twilio webhooks
│   │   └── customer.routes.js   # Customer routes
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT authentication
│   │   └── error.middleware.js  # Error handling
│   ├── websocket/
│   │   ├── media-stream.js      # Twilio media stream WebSocket
│   │   └── dashboard.socket.js  # Real-time dashboard updates
│   ├── utils/
│   │   ├── audio.utils.js       # Audio processing
│   │   └── logger.utils.js      # Logging utility
│   ├── .env                     # Environment variables
│   ├── .env.example             # Example env file
│   ├── server.js                # Main server file
│   └── package.json             # Dependencies
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Main dashboard page
│   │   │   ├── layout.tsx       # Root layout
│   │   │   └── globals.css      # Global styles
│   │   ├── components/
│   │   │   ├── Header.tsx       # Header component
│   │   │   ├── CustomerCard.tsx # Customer info card
│   │   │   ├── TranscriptionPanel.tsx # Live transcription
│   │   │   ├── AISuggestionsPanel.tsx # AI suggestions
│   │   │   ├── InteractionHistory.tsx # Past interactions
│   │   │   ├── QuickActions.tsx # Action buttons
│   │   │   └── IncomingCallModal.tsx # Incoming call modal
│   │   ├── hooks/
│   │   │   ├── useSocket.ts     # WebSocket hook
│   │   │   ├── useCall.ts       # Call management hook
│   │   │   └── useCustomer.ts   # Customer data hook
│   │   ├── lib/
│   │   │   ├── api.ts           # API client
│   │   │   └── socket.ts        # Socket.io client
│   │   └── types/
│   │       └── index.ts         # TypeScript types
│   ├── public/
│   │   └── assets/              # Images, icons
│   ├── .env.local               # Frontend env vars
│   ├── next.config.js           # Next.js config
│   ├── tailwind.config.js       # Tailwind config
│   ├── tsconfig.json            # TypeScript config
│   └── package.json             # Dependencies
│
└── README.md                    # Project documentation
```

---

## 🔧 STEP 1: Backend Setup

### 1.1 Initialize Backend Project

```bash
mkdir contexthub && cd contexthub
mkdir backend && cd backend
npm init -y

# Install all dependencies
npm install express mongoose dotenv cors socket.io twilio groq-sdk ws alawmulaw jsonwebtoken bcryptjs
npm install --save-dev nodemon
```

### 1.2 Create Environment Configuration

**File: `backend/.env`**
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

FRONTEND_URL=http://localhost:3000
```

### 1.3 Create MongoDB Models

**File: `backend/models/Customer.js`**
```javascript
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: String,
  email: String,
  status: {
    type: String,
    enum: ['new', 'active', 'vip', 'churned'],
    default: 'new'
  },
  tags: [String],
  preferences: {
    communicationChannel: String,
    language: { type: String, default: 'en' },
    callbackTime: String,
    timezone: String
  },
  metadata: {
    totalCalls: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lifetimeValue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    lastContactDate: Date,
  },
  alerts: [{
    type: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
  customFields: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes for performance
customerSchema.index({ phoneNumber: 1 });
customerSchema.index({ name: 'text', email: 'text' }); // Text search

module.exports = mongoose.model('Customer', customerSchema);
```

**File: `backend/models/Conversation.js`**
```javascript
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  },
  channel: {
    type: String,
    enum: ['phone', 'whatsapp', 'email', 'chat'],
    default: 'phone'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  callDetails: {
    callSid: String,
    phoneNumber: String,
    direction: String,
    duration: Number,
    recordingUrl: String,
    startTime: Date,
    endTime: Date
  },
  transcription: [{
    speaker: String,
    text: String,
    timestamp: Date,
    confidence: Number
  }],
  aiAnalysis: {
    intent: String,
    sentiment: String,
    sentimentScore: Number,
    urgency: String,
    topics: [String],
    entities: {
      products: [String],
      orderNumbers: [String],
      dates: [String],
      amounts: [Number]
    }
  },
  summary: String,
  resolution: {
    status: String,
    notes: String,
    nextAction: String,
    followUpDate: Date
  },
  tags: [String],
  rating: Number
}, {
  timestamps: true
});

conversationSchema.index({ customerId: 1, createdAt: -1 });
conversationSchema.index({ 'callDetails.callSid': 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
```

**File: `backend/models/Agent.js`**
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const agentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['agent', 'supervisor', 'admin'],
    default: 'agent'
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'busy', 'away'],
    default: 'offline'
  },
  phoneExtension: String,
  departments: [String],
  skills: [String],
  performance: {
    totalCalls: { type: Number, default: 0 },
    averageHandleTime: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    resolutionRate: { type: Number, default: 0 },
    activeCalls: { type: Number, default: 0 }
  },
  settings: {
    autoAnswer: { type: Boolean, default: false },
    maxConcurrentCalls: { type: Number, default: 1 },
    breakReminders: { type: Boolean, default: true },
    notificationPreferences: mongoose.Schema.Types.Mixed
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Hash password before saving
agentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
agentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Agent', agentSchema);
```

### 1.4 Create Services

**File: `backend/services/twilio.service.js`**
```javascript
const twilio = require('twilio');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.client = twilio(this.accountSid, this.authToken);
  }

  handleIncomingCall(req, res) {
    const from = req.body.From;
    const callSid = req.body.CallSid;
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Start media stream
    const start = twiml.start();
    start.stream({
      url: `wss://${req.headers.host}/media-stream`
    });
    
    twiml.say('Please hold while we connect you to an agent.');
    
    twiml.dial().conference({
      startConferenceOnEnter: true,
      statusCallback: `https://${req.headers.host}/api/twilio/conference-status`
    }, 'customer-support');
    
    res.type('text/xml');
    res.send(twiml.toString());
  }

  async sendSMS(to, message) {
    try {
      return await this.client.messages.create({
        from: this.phoneNumber,
        to: to,
        body: message
      });
    } catch (error) {
      console.error('SMS error:', error);
      throw error;
    }
  }
}

module.exports = new TwilioService();
```

**File: `backend/services/groq.service.js`**
```javascript
const Groq = require('groq-sdk');
const fs = require('fs');

class GroqService {
  constructor() {
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  async transcribeAudio(audioBuffer) {
    try {
      const tempFile = `/tmp/audio-${Date.now()}.wav`;
      fs.writeFileSync(tempFile, audioBuffer);
      
      const transcription = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-large-v3',
        response_format: 'json',
        temperature: 0.0
      });
      
      fs.unlinkSync(tempFile);
      return transcription.text;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  async generateSuggestions(context) {
    try {
      const prompt = `
You are an AI assistant for customer support. Based on this conversation, provide 2-3 helpful response suggestions.

Context:
${context.history.map(m => `${m.speaker}: ${m.text}`).join('\n')}

Last customer message: ${context.lastMessage}

Respond with JSON: { "suggestions": [{ "text": "...", "type": "response" }] }
`;

      const completion = await this.client.chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      return JSON.parse(completion.choices[0].message.content).suggestions;
    } catch (error) {
      console.error('Suggestion error:', error);
      return [];
    }
  }

  async analyzeSentiment(text) {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{
          role: 'user',
          content: `Analyze sentiment of: "${text}". Return JSON: {"sentiment": "positive/neutral/negative", "score": 0-1}`
        }],
        temperature: 0.3
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      return { sentiment: 'neutral', score: 0.5 };
    }
  }
}

module.exports = new GroqService();
```

**File: `backend/services/customer.service.js`**
```javascript
const Customer = require('../models/Customer');

class CustomerService {
  async findByPhone(phoneNumber) {
    return await Customer.findOne({ phoneNumber });
  }

  async createCustomer(data) {
    const customer = new Customer(data);
    return await customer.save();
  }

  async updateCustomer(customerId, updates) {
    return await Customer.findByIdAndUpdate(
      customerId,
      { $set: updates },
      { new: true }
    );
  }

  async incrementCallCount(customerId) {
    return await Customer.findByIdAndUpdate(
      customerId,
      {
        $inc: { 'metadata.totalCalls': 1 },
        $set: { 'metadata.lastContactDate': new Date() }
      },
      { new: true }
    );
  }
}

module.exports = new CustomerService();
```

### 1.5 Create Controllers

**File: `backend/controllers/call.controller.js`**
```javascript
const twilioService = require('../services/twilio.service');
const customerService = require('../services/customer.service');
const Conversation = require('../models/Conversation');

class CallController {
  async handleIncoming(req, res) {
    try {
      const from = req.body.From;
      const callSid = req.body.CallSid;
      
      // Find or create customer
      let customer = await customerService.findByPhone(from);
      if (!customer) {
        customer = await customerService.createCustomer({
          phoneNumber: from,
          status: 'new'
        });
      }
      
      // Create conversation record
      const conversation = new Conversation({
        customerId: customer._id,
        channel: 'phone',
        callDetails: {
          callSid,
          phoneNumber: from,
          direction: 'inbound',
          startTime: new Date()
        }
      });
      await conversation.save();
      
      // Emit to dashboard
      const io = req.app.get('io');
      io.emit('call:incoming', {
        callId: conversation._id,
        customer: customer,
        callSid: callSid
      });
      
      // Return TwiML
      twilioService.handleIncomingCall(req, res);
      
    } catch (error) {
      console.error('Call handling error:', error);
      res.status(500).send('Error processing call');
    }
  }

  async getCallDetails(req, res) {
    try {
      const { callId } = req.params;
      const conversation = await Conversation.findById(callId)
        .populate('customerId')
        .populate('agentId');
      
      res.json({ success: true, data: conversation });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new CallController();
```

### 1.6 Create Routes

**File: `backend/routes/twilio.routes.js`**
```javascript
const express = require('express');
const router = express.Router();
const callController = require('../controllers/call.controller');

router.post('/voice', callController.handleIncoming);
router.post('/status', (req, res) => {
  console.log('Call status:', req.body);
  res.sendStatus(200);
});

module.exports = router;
```

**File: `backend/routes/api.routes.js`**
```javascript
const express = require('express');
const router = express.Router();
const callController = require('../controllers/call.controller');

router.get('/calls/:callId', callController.getCallDetails);

// Add more API routes here

module.exports = router;
```

### 1.7 Create Main Server

**File: `backend/server.js`**
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/twilio', require('./routes/twilio.routes'));
app.use('/api', require('./routes/api.routes'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Make io accessible
app.set('io', io);

// Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('agent:online', (data) => {
    socket.join(`agent:${data.agentId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
```

---

## 🎨 STEP 2: Frontend Setup

### 2.1 Initialize Next.js Project

```bash
cd ../
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install socket.io-client axios zustand lucide-react
```

### 2.2 Create API Client

**File: `frontend/src/lib/api.ts`**
```typescript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const callsApi = {
  getCallDetails: (callId: string) => api.get(`/api/calls/${callId}`),
};

export const customersApi = {
  getByPhone: (phone: string) => api.get(`/api/customers/phone/${phone}`),
};
```

### 2.3 Create Socket Hook

**File: `frontend/src/hooks/useSocket.ts`**
```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000');
    
    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
}
```

### 2.4 Create Dashboard Page

**File: `frontend/src/app/page.tsx`**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import Header from '@/components/Header';
import CustomerCard from '@/components/CustomerCard';
import TranscriptionPanel from '@/components/TranscriptionPanel';
import AISuggestionsPanel from '@/components/AISuggestionsPanel';
import InteractionHistory from '@/components/InteractionHistory';
import QuickActions from '@/components/QuickActions';
import IncomingCallModal from '@/components/IncomingCallModal';

export default function Dashboard() {
  const { socket, isConnected } = useSocket();
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit('agent:online', { agentId: '123' }); // Replace with real agent ID

    socket.on('call:incoming', (data) => {
      setIncomingCall(data);
    });

    socket.on('transcription:update', (data) => {
      // Handle real-time transcription
    });

    socket.on('ai:suggestion', (data) => {
      // Handle AI suggestions
    });

  }, [socket]);

  const handleAnswerCall = () => {
    setActiveCall(incomingCall);
    setCustomer(incomingCall.customer);
    setIncomingCall(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header isCallActive={!!activeCall} />
      
      {customer && (
        <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
          <CustomerCard customer={customer} />
          
          <div className="flex gap-3 flex-1">
            <TranscriptionPanel callId={activeCall?.callId} />
            <AISuggestionsPanel callId={activeCall?.callId} />
          </div>
          
          <InteractionHistory customerId={customer._id} />
          <QuickActions />
        </div>
      )}

      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAnswer={handleAnswerCall}
          onDecline={() => setIncomingCall(null)}
        />
      )}
    </div>
  );
}
```

### 2.5 Create Components

**File: `frontend/src/components/Header.tsx`**
```typescript
interface HeaderProps {
  isCallActive: boolean;
}

export default function Header({ isCallActive }: HeaderProps) {
  return (
    <header className="h-[10vh] bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-blue-600">ContextHub</h1>
      </div>
      
      {isCallActive && (
        <div className="flex items-center gap-2">
          <span className="animate-pulse w-3 h-3 bg-red-500 rounded-full"></span>
          <span className="font-medium">LIVE CALL (00:02:45)</span>
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Agent: John Doe</span>
      </div>
    </header>
  );
}
```

**Create remaining components following the UI design specifications...**

---

## ✅ IMPLEMENTATION CHECKLIST

Backend:
- [ ] Set up Express server with Socket.IO
- [ ] Configure MongoDB connection
- [ ] Create all Mongoose models
- [ ] Implement Twilio service for call handling
- [ ] Implement Groq service for AI features
- [ ] Create API routes and controllers
- [ ] Set up WebSocket for real-time updates
- [ ] Add authentication middleware

Frontend:
- [ ] Set up Next.js with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Create Socket.IO hook
- [ ] Build all dashboard components
- [ ] Implement real-time transcription display
- [ ] Create AI suggestions panel
- [ ] Add interaction history timeline
- [ ] Build quick actions bar

Integration:
- [ ] Test Twilio webhook receiving calls
- [ ] Verify real-time transcription pipeline
- [ ] Test AI suggestion generation
- [ ] Ensure WebSocket communication works
- [ ] Test customer profile creation/retrieval

---

## 🚀 RUNNING THE APPLICATION

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: ngrok (for Twilio webhooks)
ngrok http 5000
# Update Twilio webhook URL with ngrok URL
```

---

## 🎯 EXPECTED RESULT

When completed:
1. Call your Twilio number
2. Dashboard shows "Incoming Call" modal
3. Agent clicks "Answer"
4. Real-time transcription appears
5. AI suggestions generate automatically
6. All data saves to MongoDB
7. Beautiful, responsive UI with smooth animations

---

## END OF IMPLEMENTATION PROMPT

Use this prompt with Claude Code or any AI coding assistant to build the complete application!