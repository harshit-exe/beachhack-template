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
    ref: 'Agent',
    index: true
  },
  
  channel: {
    type: String,
    enum: ['phone', 'whatsapp', 'email', 'chat', 'sms'],
    default: 'phone',
    required: true,
    index: true
  },
  
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned', 'transferred'],
    default: 'active',
    index: true
  },
  
  callDetails: {
    callSid: {
      type: String,
      unique: true,
      sparse: true
    },
    phoneNumber: String,
    direction: {
      type: String,
      enum: ['inbound', 'outbound']
    },
    duration: {
      type: Number,
      default: 0,
      min: 0
    },
    recordingUrl: String,
    recordingSid: String,
    startTime: Date,
    endTime: Date
  },
  
  transcription: [{
    speaker: {
      type: String,
      enum: ['agent', 'customer', 'system'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  
  aiAnalysis: {
    intent: {
      type: String,
      enum: ['inquiry', 'complaint', 'request', 'feedback', 'billing', 'technical', 'general']
    },
    intentConfidence: {
      type: Number,
      min: 0,
      max: 1
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    },
    sentimentScore: {
      type: Number,
      min: 0,
      max: 1
    },
    sentimentHistory: [{
      timestamp: Date,
      score: Number,
      emotion: String
    }],
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    topics: [String],
    keywords: [String],
    entities: {
      products: [String],
      orderNumbers: [String],
      dates: [Date],
      amounts: [Number]
    }
  },
  
  summary: {
    auto: String,
    manual: String,
    keyPoints: [String]
  },
  
  resolution: {
    status: {
      type: String,
      enum: ['resolved', 'pending', 'escalated', 'unresolved'],
      default: 'pending'
    },
    resolvedAt: Date,
    resolutionTime: Number,
    notes: String,
    nextAction: String,
    followUpDate: Date
  },
  
  tags: [{
    type: String,
    lowercase: true
  }],
  
  category: String,
  subCategory: String,
  
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String

}, {
  timestamps: true,
  collection: 'conversations'
});

// Indexes
conversationSchema.index({ customerId: 1, createdAt: -1 });
conversationSchema.index({ agentId: 1, createdAt: -1 });
conversationSchema.index({ 'callDetails.callSid': 1 });
conversationSchema.index({ status: 1, createdAt: -1 });
conversationSchema.index({ 'aiAnalysis.sentiment': 1, createdAt: -1 });

// Virtual for duration in minutes
conversationSchema.virtual('durationInMinutes').get(function() {
  if (!this.callDetails.duration) return 0;
  return Math.round(this.callDetails.duration / 60);
});

// Method to add transcription
conversationSchema.methods.addTranscription = async function(speaker, text, confidence = 1.0) {
  this.transcription.push({
    speaker,
    text,
    timestamp: new Date(),
    confidence
  });
  return await this.save();
};

// Method to mark as resolved
conversationSchema.methods.markResolved = async function(notes) {
  this.status = 'completed';
  this.resolution.status = 'resolved';
  this.resolution.resolvedAt = new Date();
  if (notes) this.resolution.notes = notes;
  
  if (this.callDetails.startTime) {
    const diff = (this.resolution.resolvedAt - this.callDetails.startTime) / 1000 / 60;
    this.resolution.resolutionTime = Math.round(diff);
  }
  
  return await this.save();
};

// Static to get active conversations
conversationSchema.statics.getActive = function() {
  return this.find({ status: 'active' })
    .populate('customerId')
    .populate('agentId')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Conversation', conversationSchema);
