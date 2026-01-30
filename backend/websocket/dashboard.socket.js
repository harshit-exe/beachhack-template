const groqService = require('../services/groq.service');
const conversationService = require('../services/conversation.service');

function setupDashboardSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Agent goes online
    socket.on('agent:online', (data) => {
      console.log(`👤 Agent online: ${data.agentId}`);
      socket.join(`agent:${data.agentId}`);
      socket.agentId = data.agentId;
      
      // Broadcast agent status
      io.emit('agent:status', {
        agentId: data.agentId,
        status: 'online'
      });
    });
    
    // Agent goes offline
    socket.on('agent:offline', (data) => {
      console.log(`👤 Agent offline: ${data.agentId}`);
      socket.leave(`agent:${data.agentId}`);
      
      io.emit('agent:status', {
        agentId: data.agentId,
        status: 'offline'
      });
    });
    
    // Agent joins a call room
    socket.on('call:join', (data) => {
      console.log(`📞 Agent ${socket.agentId} joined call: ${data.callId}`);
      socket.join(`call:${data.callId}`);
    });
    
    // Agent leaves a call room
    socket.on('call:leave', (data) => {
      console.log(`📞 Agent left call: ${data.callId}`);
      socket.leave(`call:${data.callId}`);
    });
    
    // Request AI suggestions
    socket.on('ai:suggest', async (data) => {
      try {
        const { conversationId, history, lastMessage, customer } = data;
        
        const result = await groqService.generateSuggestions({
          history: history || [],
          lastMessage: lastMessage || '',
          customer: customer || null
        });
        
        socket.emit('ai:suggestion', {
          conversationId,
          suggestions: result.suggestions || [],
          sentiment: result.sentiment,
          recommendedActions: result.recommendedActions || []
        });
        
      } catch (error) {
        console.error('AI suggestion error:', error);
        socket.emit('ai:error', { error: error.message });
      }
    });
    
    // Process transcription update
    socket.on('transcription:add', async (data) => {
      try {
        const { conversationId, speaker, text } = data;
        
        // Save to database
        await conversationService.addTranscription(conversationId, speaker, text);
        
        // Analyze if customer message
        if (speaker === 'customer') {
          const sentiment = await groqService.analyzeSentiment(text);
          
          await conversationService.updateAIAnalysis(conversationId, {
            sentiment: sentiment.sentiment,
            sentimentScore: sentiment.score,
            emotion: sentiment.emotion
          });
          
          // Broadcast to all clients in the call room
          io.to(`call:${conversationId}`).emit('transcription:update', {
            conversationId,
            speaker,
            text,
            timestamp: new Date(),
            sentiment
          });
          
          // Also broadcast to all connected clients (for demo purposes)
          io.emit('transcription:update', {
            conversationId,
            speaker,
            text,
            timestamp: new Date(),
            sentiment
          });
          
        } else {
          // Just broadcast agent message
          io.emit('transcription:update', {
            conversationId,
            speaker,
            text,
            timestamp: new Date()
          });
        }
        
      } catch (error) {
        console.error('Transcription processing error:', error);
      }
    });
    
    // Answer call
    socket.on('call:answer', async (data) => {
      try {
        const { callId, agentId } = data;
        
        // Don't assign agentId to DB since it's not a valid ObjectId
        // Just emit the event for frontend tracking
        io.emit('call:answered', {
          callId,
          agentId
        });
        
      } catch (error) {
        console.error('Call answer error:', error);
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      
      if (socket.agentId) {
        io.emit('agent:status', {
          agentId: socket.agentId,
          status: 'offline'
        });
      }
    });
  });
}

module.exports = { setupDashboardSocket };
