const Conversation = require('../models/Conversation');
const Customer = require('../models/Customer');

class ConversationService {
  // Create new conversation
  async createConversation(data) {
    const conversation = new Conversation({
      customerId: data.customerId,
      agentId: data.agentId || null,
      channel: data.channel || 'phone',
      status: 'active',
      callDetails: {
        callSid: data.callSid,
        phoneNumber: data.phoneNumber,
        direction: data.direction || 'inbound',
        startTime: new Date()
      },
      transcription: [],
      aiAnalysis: {
        sentiment: 'neutral',
        urgency: 'medium'
      }
    });
    
    return await conversation.save();
  }

  // Find conversation by ID
  async findById(conversationId) {
    return await Conversation.findById(conversationId)
      .populate('customerId');
  }

  // Find conversation by call SID
  async findByCallSid(callSid) {
    return await Conversation.findOne({ 'callDetails.callSid': callSid })
      .populate('customerId');
  }

  // Add transcription entry
  async addTranscription(conversationId, speaker, text, confidence = 1.0) {
    return await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $push: {
          transcription: {
            speaker,
            text,
            timestamp: new Date(),
            confidence
          }
        }
      },
      { new: true }
    );
  }

  // Update AI analysis
  async updateAIAnalysis(conversationId, analysis) {
    return await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          'aiAnalysis.sentiment': analysis.sentiment,
          'aiAnalysis.sentimentScore': analysis.sentimentScore,
          'aiAnalysis.intent': analysis.intent,
          'aiAnalysis.intentConfidence': analysis.intentConfidence,
          'aiAnalysis.urgency': analysis.urgency,
          'aiAnalysis.topics': analysis.topics || [],
          'aiAnalysis.keywords': analysis.keywords || []
        },
        $push: {
          'aiAnalysis.sentimentHistory': {
            timestamp: new Date(),
            score: analysis.sentimentScore,
            emotion: analysis.emotion
          }
        }
      },
      { new: true }
    );
  }

  // End conversation
  async endConversation(conversationId, summary = null) {
    const updateData = {
      status: 'completed',
      'callDetails.endTime': new Date()
    };
    
    if (summary) {
      updateData['summary.auto'] = summary;
    }
    
    const conversation = await Conversation.findById(conversationId);
    if (conversation && conversation.callDetails.startTime) {
      const duration = Math.round(
        (new Date() - conversation.callDetails.startTime) / 1000
      );
      updateData['callDetails.duration'] = duration;
    }
    
    return await Conversation.findByIdAndUpdate(
      conversationId,
      { $set: updateData },
      { new: true }
    );
  }

  // Assign agent to conversation
  async assignAgent(conversationId, agentId) {
    return await Conversation.findByIdAndUpdate(
      conversationId,
      { $set: { agentId } },
      { new: true }
    );
  }

  // Get active conversations
  async getActiveConversations() {
    return await Conversation.find({ status: 'active' })
      .populate('customerId')
      .sort({ createdAt: -1 });
  }

  // Get conversation history for customer
  async getCustomerHistory(customerId, limit = 10) {
    return await Conversation.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // Mark as resolved
  async markResolved(conversationId, notes = null) {
    return await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          status: 'completed',
          'resolution.status': 'resolved',
          'resolution.resolvedAt': new Date(),
          'resolution.notes': notes
        }
      },
      { new: true }
    );
  }

  // Add rating
  async addRating(conversationId, rating, feedback = null) {
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          rating,
          feedback
        }
      },
      { new: true }
    );
    
    // Update customer average rating
    if (conversation && conversation.customerId) {
      const customerConversations = await Conversation.find({
        customerId: conversation.customerId,
        rating: { $exists: true, $ne: null }
      });
      
      const avgRating = customerConversations.reduce((sum, c) => sum + c.rating, 0) 
        / customerConversations.length;
      
      await Customer.findByIdAndUpdate(conversation.customerId, {
        $set: { 'metadata.averageRating': Math.round(avgRating * 10) / 10 }
      });
    }
    
    return conversation;
  }
}

module.exports = new ConversationService();
