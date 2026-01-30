const groqService = require('../services/groq.service');
const conversationService = require('../services/conversation.service');
const customerService = require('../services/customer.service');

class AIController {
  // Get AI suggestions for a conversation
  async getSuggestions(req, res) {
    try {
      const { conversationId, lastMessage, history } = req.body;
      
      let customer = null;
      
      // Get customer context if we have a conversation
      if (conversationId) {
        const conversation = await conversationService.findById(conversationId);
        if (conversation && conversation.customerId) {
          customer = conversation.customerId;
        }
      }
      
      const context = {
        history: history || [],
        lastMessage: lastMessage || '',
        customer: customer ? {
          name: customer.name,
          status: customer.status,
          metadata: customer.metadata,
          alerts: customer.alerts
        } : null
      };
      
      const result = await groqService.generateSuggestions(context);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Get suggestions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Analyze sentiment
  async analyzeSentiment(req, res) {
    try {
      const { text, conversationId } = req.body;
      
      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Text is required'
        });
      }
      
      const result = await groqService.analyzeSentiment(text);
      
      // Update conversation AI analysis if provided
      if (conversationId) {
        await conversationService.updateAIAnalysis(conversationId, {
          sentiment: result.sentiment,
          sentimentScore: result.score,
          emotion: result.emotion
        });
      }
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Analyze sentiment error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Detect intent
  async detectIntent(req, res) {
    try {
      const { text, conversationId } = req.body;
      
      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Text is required'
        });
      }
      
      const result = await groqService.detectIntent(text);
      
      // Update conversation AI analysis if provided
      if (conversationId) {
        await conversationService.updateAIAnalysis(conversationId, {
          intent: result.intent,
          intentConfidence: result.confidence,
          urgency: result.urgency
        });
      }
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Detect intent error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Generate call summary
  async generateSummary(req, res) {
    try {
      const { conversationId } = req.params;
      
      const conversation = await conversationService.findById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }
      
      if (!conversation.transcription || conversation.transcription.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No transcription available'
        });
      }
      
      const summary = await groqService.generateSummary(conversation.transcription);
      
      // Save summary to conversation
      await conversationService.findById(conversationId);
      conversation.summary = { auto: summary };
      await conversation.save();
      
      res.json({
        success: true,
        data: { summary }
      });
      
    } catch (error) {
      console.error('Generate summary error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Process transcription (called from WebSocket or API)
  async processTranscription(req, res) {
    try {
      const { conversationId, speaker, text } = req.body;
      
      if (!conversationId || !speaker || !text) {
        return res.status(400).json({
          success: false,
          error: 'conversationId, speaker, and text are required'
        });
      }
      
      // Add transcription to conversation
      await conversationService.addTranscription(conversationId, speaker, text);
      
      // Analyze if it's a customer message
      if (speaker === 'customer') {
        const [sentiment, intent] = await Promise.all([
          groqService.analyzeSentiment(text),
          groqService.detectIntent(text)
        ]);
        
        await conversationService.updateAIAnalysis(conversationId, {
          sentiment: sentiment.sentiment,
          sentimentScore: sentiment.score,
          emotion: sentiment.emotion,
          intent: intent.intent,
          intentConfidence: intent.confidence,
          urgency: intent.urgency
        });
        
        // Emit to dashboard
        const io = req.app.get('io');
        if (io) {
          io.emit('transcription:update', {
            conversationId,
            speaker,
            text,
            timestamp: new Date(),
            sentiment,
            intent
          });
        }
      }
      
      res.json({
        success: true,
        message: 'Transcription processed'
      });
      
    } catch (error) {
      console.error('Process transcription error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AIController();
