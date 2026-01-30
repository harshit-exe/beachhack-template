require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { connectDatabase } = require('./config/database');
const { setupDashboardSocket } = require('./websocket/dashboard.socket');
const MediaStreamHandler = require('./websocket/media-stream.handler');
const AIVoiceHandler = require('./websocket/ai-voice.handler');
const ElevenLabsBridge = require('./websocket/elevenlabs-bridge.handler');

// Import models to register them with Mongoose
require('./models/Customer');
require('./models/Conversation');
require('./models/Agent');

// Import routes
const twilioRoutes = require('./routes/twilio.routes');
const apiRoutes = require('./routes/api.routes');
const elevenlabsRoutes = require('./routes/elevenlabs.routes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// API Routes
app.use('/api/twilio', twilioRoutes);
app.use('/api/elevenlabs', elevenlabsRoutes);
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ContextHub API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      calls: '/api/calls',
      customers: '/api/customers',
      ai: '/api/ai'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Setup WebSocket handlers
setupDashboardSocket(io);

// Setup Media Stream handler for real-time transcription
const mediaStreamHandler = new MediaStreamHandler(io);

// Setup AI Voice handler for ElevenLabs-powered conversations
const aiVoiceHandler = new AIVoiceHandler(io);

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 ContextHub Backend Server                        ║
║                                                       ║
║   Server running on: http://localhost:${PORT}           ║
║   WebSocket ready on: ws://localhost:${PORT}            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
      
      // Setup media stream after server is listening
      mediaStreamHandler.setupMediaStream(server);
      
      // Setup ElevenLabs Conversational AI Bridge
      const elevenLabsBridge = new ElevenLabsBridge(server);
      console.log('🎤 ElevenLabs Conversational AI Bridge ready on /elevenlabs-stream');
      
      // Setup AI voice stream
      aiVoiceHandler.setupAIVoiceStream(server);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
