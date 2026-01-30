# Technical Setup Guide: ContextHub
## Complete Configuration for Twilio, ElevenLabs, Groq AI & MongoDB

**Version:** 1.0  
**Date:** January 29, 2026

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Twilio Setup](#twilio-setup)
3. [Groq AI Setup](#groq-ai-setup)
4. [ElevenLabs Setup](#elevenlabs-setup)
5. [MongoDB Setup](#mongodb-setup)
6. [Backend Configuration](#backend-configuration)
7. [Frontend Configuration](#frontend-configuration)
8. [Testing the Setup](#testing-the-setup)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [ ] Twilio Account (Free trial available)
- [ ] Groq Cloud Account (Free tier available)
- [ ] ElevenLabs Account (Free credits available)
- [ ] MongoDB Atlas Account (Free tier available)
- [ ] GitHub Account (for version control)

### Development Tools
```bash
# Node.js 20+ and npm
node --version  # Should be v20+
npm --version

# MongoDB Compass (optional GUI)
# Download from: https://www.mongodb.com/products/compass

# ngrok (for local Twilio webhook testing)
npm install -g ngrok
```

---

## 1. Twilio Setup

### Step 1: Create Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Sign up with your email
3. Verify phone number
4. Get **Account SID** and **Auth Token** from console

### Step 2: Get a Phone Number
```bash
# In Twilio Console:
1. Navigate to Phone Numbers > Manage > Buy a number
2. Select country (India: +91 or USA: +1)
3. Choose number with Voice capability
4. Purchase (uses trial credits)
5. Save the phone number (e.g., +91XXXXXXXXXX)
```

### Step 3: Configure Voice Webhooks
```
Phone Number > Configure > Voice & Fax

A CALL COMES IN:
- Select: "Webhook"
- URL: https://YOUR_DOMAIN/api/twilio/voice
- Method: HTTP POST

CALL STATUS CHANGES:
- URL: https://YOUR_DOMAIN/api/twilio/status
- Method: HTTP POST
```

### Step 4: Enable Media Streams (for Real-time Audio)
```javascript
// Your webhook should return this TwiML:
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Start>
        <Stream url="wss://YOUR_DOMAIN/api/media-stream">
            <Parameter name="customParameter" value="someValue"/>
        </Stream>
    </Start>
    <Say>Please hold while we connect you to an agent.</Say>
    <Dial>
        <Number>AGENT_PHONE_NUMBER</Number>
    </Dial>
</Response>
```

### Step 5: Install Twilio SDK
```bash
npm install twilio
```

### Step 6: Twilio Backend Code

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

  // Handle incoming call webhook
  async handleIncomingCall(req, res) {
    const from = req.body.From;
    const callSid = req.body.CallSid;
    
    console.log(`Incoming call from ${from}, SID: ${callSid}`);
    
    // TwiML response to start media stream
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Start media stream for real-time audio
    const start = twiml.start();
    const stream = start.stream({
      url: `wss://${req.headers.host}/media-stream`,
    });
    stream.parameter({
      name: 'callSid',
      value: callSid
    });
    
    // Say something while connecting
    twiml.say('Please hold while we connect you to an agent.');
    
    // Dial to conference or queue
    twiml.dial().conference({
      startConferenceOnEnter: true,
      endConferenceOnExit: false,
      statusCallback: `https://${req.headers.host}/api/twilio/conference-status`,
      statusCallbackEvent: 'start end join leave'
    }, 'customer-support');
    
    res.type('text/xml');
    res.send(twiml.toString());
  }

  // Make outbound call
  async makeOutboundCall(to, agentPhone) {
    try {
      const call = await this.client.calls.create({
        from: this.phoneNumber,
        to: to,
        url: `https://YOUR_DOMAIN/api/twilio/outbound-twiml`,
        statusCallback: `https://YOUR_DOMAIN/api/twilio/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
      });
      
      return call;
    } catch (error) {
      console.error('Error making call:', error);
      throw error;
    }
  }

  // Send SMS
  async sendSMS(to, message) {
    try {
      const msg = await this.client.messages.create({
        from: this.phoneNumber,
        to: to,
        body: message
      });
      return msg;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  // Send WhatsApp message
  async sendWhatsApp(to, message) {
    try {
      const msg = await this.client.messages.create({
        from: `whatsapp:${this.phoneNumber}`,
        to: `whatsapp:${to}`,
        body: message
      });
      return msg;
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      throw error;
    }
  }

  // Get call recording
  async getRecording(callSid) {
    try {
      const recordings = await this.client.recordings.list({
        callSid: callSid
      });
      return recordings[0];
    } catch (error) {
      console.error('Error fetching recording:', error);
      throw error;
    }
  }
}

module.exports = new TwilioService();
```

### Step 7: WebSocket for Real-time Media Stream

**File: `backend/websocket/media-stream.js`**
```javascript
const WebSocket = require('ws');

function setupMediaStream(server) {
  const wss = new WebSocket.Server({ 
    server, 
    path: '/media-stream' 
  });

  wss.on('connection', (ws) => {
    console.log('Media stream connected');
    
    let callSid = null;
    
    ws.on('message', (message) => {
      const msg = JSON.parse(message);
      
      switch (msg.event) {
        case 'start':
          callSid = msg.start.callSid;
          console.log(`Stream started for call: ${callSid}`);
          break;
          
        case 'media':
          // msg.media.payload is base64 μ-law audio
          const audioChunk = Buffer.from(msg.media.payload, 'base64');
          
          // Send to Groq Whisper for transcription
          processAudioChunk(audioChunk, callSid);
          break;
          
        case 'stop':
          console.log(`Stream stopped for call: ${callSid}`);
          break;
      }
    });

    ws.on('close', () => {
      console.log('Media stream disconnected');
    });
  });
}

async function processAudioChunk(audioChunk, callSid) {
  // Convert μ-law to PCM 16kHz
  const pcmAudio = convertMuLawToPCM(audioChunk);
  
  // Send to Groq for transcription
  // Implementation in groq.service.js
}

function convertMuLawToPCM(muLawBuffer) {
  // μ-law to PCM conversion
  // Use library like 'alawmulaw' or implement manually
  const alawmulaw = require('alawmulaw');
  return alawmulaw.mulaw.decode(muLawBuffer);
}

module.exports = { setupMediaStream };
```

### Environment Variables for Twilio
```bash
# .env file
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+91XXXXXXXXXX
```

---

## 2. Groq AI Setup

### Step 1: Get Groq API Key
1. Go to https://console.groq.com
2. Sign up / Sign in
3. Navigate to API Keys section
4. Click "Create API Key"
5. Copy the key (starts with `gsk_...`)

### Step 2: Install Groq SDK
```bash
npm install groq-sdk
```

### Step 3: Groq Service Implementation

**File: `backend/services/groq.service.js`**
```javascript
const Groq = require('groq-sdk');
const fs = require('fs');

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.client = new Groq({ apiKey: this.apiKey });
  }

  // Speech-to-Text using Whisper Large V3
  async transcribeAudio(audioBuffer, language = 'en') {
    try {
      // Save buffer to temporary file (Groq requires file input)
      const tempFilePath = `/tmp/audio-${Date.now()}.wav`;
      fs.writeFileSync(tempFilePath, audioBuffer);
      
      const transcription = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-large-v3',
        language: language,
        response_format: 'json',
        temperature: 0.0
      });
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
      
      return transcription.text;
    } catch (error) {
      console.error('Groq transcription error:', error);
      throw error;
    }
  }

  // Generate AI suggestions using Llama 3
  async generateSuggestions(conversationContext) {
    try {
      const systemPrompt = `You are an AI assistant helping a customer support agent. 
Based on the conversation context, provide 2-3 helpful response suggestions that the agent can use.
Be concise, professional, and empathetic. Format as JSON array of suggestions.`;

      const userPrompt = `
Conversation History:
${conversationContext.history.map(msg => `${msg.speaker}: ${msg.text}`).join('\n')}

Customer Last Message: ${conversationContext.lastCustomerMessage}

Customer Profile:
- Name: ${conversationContext.customer.name}
- Status: ${conversationContext.customer.status}
- Previous Issues: ${conversationContext.customer.previousIssues.join(', ')}

Provide response suggestions in JSON format:
{
  "suggestions": [
    {
      "text": "suggested response",
      "type": "response",
      "confidence": 0.95
    }
  ]
}`;

      const completion = await this.client.chat.completions.create({
        model: 'llama-3.1-70b-versatile', // or 'mixtral-8x7b-32768'
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        stream: false
      });

      const responseText = completion.choices[0].message.content;
      
      // Parse JSON response
      const parsed = JSON.parse(responseText);
      return parsed.suggestions;
      
    } catch (error) {
      console.error('Groq suggestion error:', error);
      throw error;
    }
  }

  // Analyze sentiment
  async analyzeSentiment(text) {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.1-8b-instant', // Faster for sentiment
        messages: [
          {
            role: 'system',
            content: 'Analyze the sentiment of customer messages. Return JSON: {"sentiment": "positive/neutral/negative", "score": 0.0-1.0, "emotion": "happy/frustrated/angry/neutral"}'
          },
          {
            role: 'user',
            content: `Analyze sentiment: "${text}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 100
      });

      return JSON.parse(completion.choices[0].message.content);
      
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return { sentiment: 'neutral', score: 0.5, emotion: 'neutral' };
    }
  }

  // Detect customer intent
  async detectIntent(text) {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Classify customer intent into categories: "inquiry", "complaint", "request", "feedback", "billing", "technical", "general". Return JSON: {"intent": "category", "confidence": 0.0-1.0}'
          },
          {
            role: 'user',
            content: `Detect intent: "${text}"`
          }
        ],
        temperature: 0.2,
        max_tokens: 50
      });

      return JSON.parse(completion.choices[0].message.content);
      
    } catch (error) {
      console.error('Intent detection error:', error);
      return { intent: 'general', confidence: 0.5 };
    }
  }

  // Generate call summary
  async generateSummary(conversation) {
    try {
      const transcript = conversation.transcription
        .map(t => `${t.speaker}: ${t.text}`)
        .join('\n');

      const completion = await this.client.chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Summarize customer support conversations concisely. Include: issue, resolution, next steps. Keep under 100 words.'
          },
          {
            role: 'user',
            content: `Summarize this conversation:\n\n${transcript}`
          }
        ],
        temperature: 0.5,
        max_tokens: 200
      });

      return completion.choices[0].message.content;
      
    } catch (error) {
      console.error('Summary generation error:', error);
      throw error;
    }
  }

  // Real-time streaming transcription (for WebSocket)
  async transcribeStream(audioStream) {
    // Implementation for streaming audio transcription
    // Groq Whisper currently doesn't support streaming
    // Buffer audio and transcribe in chunks
  }
}

module.exports = new GroqService();
```

### Environment Variables for Groq
```bash
# .env file
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Groq API Rate Limits (Free Tier)
- Whisper: 100 requests/day
- Llama models: 30 requests/minute
- Monitor usage at: https://console.groq.com/settings/billing

---

## 3. ElevenLabs Setup

### Step 1: Get ElevenLabs API Key
1. Go to https://elevenlabs.io
2. Sign up for account
3. Navigate to Profile → API Keys
4. Copy your API key

### Step 2: Install ElevenLabs SDK
```bash
npm install elevenlabs-node
```

### Step 3: ElevenLabs Service Implementation

**File: `backend/services/elevenlabs.service.js`**
```javascript
const { ElevenLabsClient } = require('elevenlabs-node');
const fs = require('fs');

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.client = new ElevenLabsClient({ apiKey: this.apiKey });
    
    // Default voice IDs (find more at elevenlabs.io/voice-library)
    this.voices = {
      'rachel': 'voice_id_rachel',  // Professional female
      'adam': 'voice_id_adam',      // Professional male
      'daniel': 'voice_id_daniel',  // Calm male
      'elli': 'voice_id_elli'       // Friendly female
    };
  }

  // Text-to-Speech
  async textToSpeech(text, voiceName = 'rachel') {
    try {
      const voiceId = this.voices[voiceName];
      
      const audio = await this.client.textToSpeech({
        voiceId: voiceId,
        text: text,
        modelId: 'eleven_multilingual_v2', // Supports multiple languages
        voiceSettings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      });

      return audio; // Returns audio buffer
      
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw error;
    }
  }

  // Generate audio file
  async generateAudioFile(text, outputPath, voiceName = 'rachel') {
    try {
      const audioBuffer = await this.textToSpeech(text, voiceName);
      fs.writeFileSync(outputPath, audioBuffer);
      return outputPath;
      
    } catch (error) {
      console.error('Audio file generation error:', error);
      throw error;
    }
  }

  // Stream TTS for real-time playback
  async streamTextToSpeech(text, voiceName = 'rachel') {
    try {
      const voiceId = this.voices[voiceName];
      
      const stream = await this.client.textToSpeechStream({
        voiceId: voiceId,
        text: text,
        modelId: 'eleven_turbo_v2', // Faster model for streaming
        voiceSettings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      });

      return stream; // Returns readable stream
      
    } catch (error) {
      console.error('ElevenLabs streaming error:', error);
      throw error;
    }
  }

  // For IVR / Voice Bot
  async generateIVRMessage(message) {
    try {
      const audio = await this.textToSpeech(
        message,
        'rachel' // Use consistent voice for IVR
      );
      
      // Save to temporary file for Twilio
      const tempPath = `/tmp/ivr-${Date.now()}.mp3`;
      fs.writeFileSync(tempPath, audio);
      
      return tempPath;
      
    } catch (error) {
      console.error('IVR message generation error:', error);
      throw error;
    }
  }

  // Get available voices
  async getAvailableVoices() {
    try {
      const voices = await this.client.getVoices();
      return voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }
}

module.exports = new ElevenLabsService();
```

### Environment Variables for ElevenLabs
```bash
# .env file
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### ElevenLabs Free Tier Limits
- 10,000 characters/month free
- Monitor at: https://elevenlabs.io/subscription

---

## 4. MongoDB Setup

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Choose "Shared" (Free tier)
4. Select cloud provider (AWS recommended)
5. Choose region closest to you

### Step 2: Create Database
```
1. Click "Build a Database"
2. Choose M0 Sandbox (Free)
3. Name: contexthub-db
4. Create database
```

### Step 3: Configure Network Access
```
1. Security → Network Access
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add specific IPs only
4. Confirm
```

### Step 4: Create Database User
```
1. Security → Database Access
2. Click "Add New Database User"
3. Username: contexthub_admin
4. Password: [Generate strong password]
5. Database User Privileges: Read and write to any database
6. Add User
```

### Step 5: Get Connection String
```
1. Deployment → Database
2. Click "Connect"
3. Choose "Connect your application"
4. Copy connection string:
   mongodb+srv://contexthub_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
5. Replace <password> with your actual password
```

### Step 6: Install MongoDB Driver
```bash
npm install mongodb mongoose
```

### Step 7: MongoDB Connection Setup

**File: `backend/config/database.js`**
```javascript
const mongoose = require('mongoose');

async function connectDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'contexthub'
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

module.exports = { connectDatabase };
```

### Environment Variables for MongoDB
```bash
# .env file
MONGODB_URI=mongodb+srv://contexthub_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

---

## 5. Backend Configuration

### Project Structure
```
backend/
├── config/
│   ├── database.js
│   └── environment.js
├── models/
│   ├── Customer.js
│   ├── Conversation.js
│   ├── Agent.js
│   └── AISuggestion.js
├── services/
│   ├── twilio.service.js
│   ├── groq.service.js
│   ├── elevenlabs.service.js
│   └── customer.service.js
├── controllers/
│   ├── call.controller.js
│   ├── customer.controller.js
│   └── ai.controller.js
├── routes/
│   ├── api.routes.js
│   ├── twilio.routes.js
│   └── customer.routes.js
├── websocket/
│   ├── media-stream.js
│   └── dashboard.socket.js
├── middleware/
│   ├── auth.middleware.js
│   └── error.middleware.js
├── utils/
│   ├── audio.utils.js
│   └── logger.utils.js
├── .env
├── .env.example
├── server.js
└── package.json
```

### Complete .env.example
```bash
# Server
NODE_ENV=development
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/contexthub

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+91XXXXXXXXXX

# Groq AI
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Redis (Optional for caching)
REDIS_URL=redis://localhost:6379
```

### Main Server File

**File: `backend/server.js`**
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { connectDatabase } = require('./config/database');
const { setupMediaStream } = require('./websocket/media-stream');

// Import routes
const apiRoutes = require('./routes/api.routes');
const twilioRoutes = require('./routes/twilio.routes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Twilio webhooks need raw body
app.use('/api/twilio', express.raw({ type: 'application/xml' }));

// Routes
app.use('/api', apiRoutes);
app.use('/api/twilio', twilioRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Setup WebSocket for media streaming
setupMediaStream(server);

// Dashboard WebSocket events
io.on('connection', (socket) => {
  console.log('Agent connected:', socket.id);
  
  socket.on('agent:online', (data) => {
    console.log('Agent online:', data);
    socket.join(`agent:${data.agentId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Agent disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

### Package.json Dependencies
```json
{
  "name": "contexthub-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "socket.io": "^4.7.2",
    "twilio": "^4.19.0",
    "groq-sdk": "^0.3.0",
    "elevenlabs-node": "^1.0.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "ws": "^8.14.2",
    "alawmulaw": "^5.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0"
  }
}
```

---

## 6. Frontend Configuration

### Install Dependencies
```bash
cd frontend
npm install next react react-dom
npm install socket.io-client
npm install tailwindcss postcss autoprefixer
npm install @radix-ui/react-dialog @radix-ui/react-tabs
npm install lucide-react
npm install recharts
npm install zustand
```

### Environment Variables

**File: `frontend/.env.local`**
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
NEXT_PUBLIC_ENV=development
```

---

## 7. Testing the Setup

### Test 1: MongoDB Connection
```bash
node -e "require('./backend/config/database').connectDatabase()"
# Should print: ✅ MongoDB connected successfully
```

### Test 2: Twilio Webhook (Local Testing with ngrok)
```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start ngrok
ngrok http 5000

# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Update Twilio webhook URL to: https://abc123.ngrok.io/api/twilio/voice

# Call your Twilio number - should receive webhook
```

### Test 3: Groq AI Transcription
```bash
# Create test file: test-groq.js
const groqService = require('./backend/services/groq.service');
const fs = require('fs');

async function test() {
  const audioBuffer = fs.readFileSync('./test-audio.wav');
  const transcript = await groqService.transcribeAudio(audioBuffer);
  console.log('Transcript:', transcript);
}

test();
```

### Test 4: ElevenLabs TTS
```bash
# Create test file: test-elevenlabs.js
const elevenLabsService = require('./backend/services/elevenlabs.service');

async function test() {
  const audio = await elevenLabsService.textToSpeech(
    'Hello! This is a test of ElevenLabs text to speech.'
  );
  console.log('Audio generated, length:', audio.length);
}

test();
```

---

## 8. Troubleshooting

### Issue: Twilio webhooks not receiving
**Solutions:**
- Verify ngrok is running
- Check Twilio console logs
- Ensure webhook URL is HTTPS
- Verify phone number configuration

### Issue: Groq API rate limit
**Solutions:**
- Free tier: 100 requests/day
- Implement request caching
- Batch transcription requests
- Upgrade to paid tier if needed

### Issue: MongoDB connection timeout
**Solutions:**
- Check network access whitelist
- Verify credentials
- Test connection string in MongoDB Compass
- Check firewall settings

### Issue: Real-time latency too high
**Solutions:**
- Use Redis for caching
- Optimize database queries
- Implement connection pooling
- Consider edge deployment

### Issue: Audio quality poor
**Solutions:**
- Check Twilio audio codec settings
- Verify 16kHz PCM conversion
- Test with different microphones
- Adjust ElevenLabs voice settings

---

## 9. Deployment Checklist

### Before Going Live:
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] Twilio production number purchased
- [ ] Webhook URLs updated to production domain
- [ ] SSL certificate installed (Twilio requires HTTPS)
- [ ] API rate limits configured
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics tracking enabled
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Security audit performed

---

## 10. Useful Commands

```bash
# Start development
npm run dev

# Check MongoDB connection
mongosh "mongodb+srv://cluster.mongodb.net/" --username admin

# Test Twilio webhook locally
curl -X POST http://localhost:5000/api/twilio/voice \
  -d "From=+91XXXXXXXXXX&CallSid=test123"

# Monitor logs
tail -f logs/app.log

# Check API health
curl http://localhost:5000/health
```

---

## Support & Resources

### Documentation Links:
- Twilio: https://www.twilio.com/docs
- Groq: https://console.groq.com/docs
- ElevenLabs: https://elevenlabs.io/docs
- MongoDB: https://www.mongodb.com/docs

### Community Support:
- Twilio Community: https://support.twilio.com
- Stack Overflow: Tag questions with `twilio`, `groq-ai`, `mongodb`

---

**Last Updated:** January 29, 2026  
**Setup Time:** ~2-3 hours  
**Difficulty:** Intermediate

---

## END OF TECHNICAL SETUP GUIDE