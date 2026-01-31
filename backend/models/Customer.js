const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  name: {
    type: String,
    trim: true,
    index: true
  },
  
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true
  },
  
  status: {
    type: String,
    enum: ['new', 'active', 'vip', 'churned', 'blocked'],
    default: 'new',
    index: true
  },
  
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  preferences: {
    communicationChannel: {
      type: String,
      enum: ['phone', 'email', 'whatsapp', 'chat', 'any'],
      default: 'any'
    },
    language: {
      type: String,
      default: 'en'
    },
    callbackTime: String,
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    doNotDisturb: {
      type: Boolean,
      default: false
    },
    likes: [String],
    dislikes: [String]
  },
  
  metadata: {
    totalCalls: {
      type: Number,
      default: 0,
      min: 0
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    lifetimeValue: {
      type: Number,
      default: 0,
      min: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    lastContactDate: Date,
    firstContactDate: Date,
    // New fields for extracted info
    company: String,
    notes: String,
    scheduledMeeting: String,
    preferredLanguage: {
      type: String,
      default: 'en'
    },
    
    // RICH CONTEXT FIELDS
    keyPoints: [String], // EXTRACTED KEY POINTS AS ARRAY
    
    keyDates: [{
      label: { type: String, required: true }, // e.g., "Wife's Birthday"
      date: { type: Date, required: true },
      description: String
    }],
    
    conversationSummaries: [{
      date: { type: Date, default: Date.now },
      summary: String,
      keyTopics: [String],
      sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
      actionItems: [String]
    }],
    
    generatedProfile: {
      type: String,
      description: "AI-generated profile summary (e.g., 'Price sensitive, likes roses')"
    }
  },
  
  alerts: [{
    type: {
      type: String,
      enum: ['warning', 'info', 'critical'],
      default: 'info'
    },
    message: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    acknowledged: {
      type: Boolean,
      default: false
    }
  }],
  
  insights: [{
    category: String,
    description: String,
    confidence: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  company: {
    name: String,
    industry: String,
    website: String
  },
  
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true,
  collection: 'customers'
});

// Indexes
customerSchema.index({ phoneNumber: 1 }, { unique: true });
customerSchema.index({ name: 'text', email: 'text' });
customerSchema.index({ status: 1, 'metadata.lastContactDate': -1 });

// Virtual for display name
customerSchema.virtual('displayName').get(function() {
  return this.name || this.phoneNumber;
});

// Static method to find by phone
customerSchema.statics.findByPhone = function(phoneNumber) {
  return this.findOne({ 
    phoneNumber: phoneNumber,
    isDeleted: false 
  });
};

// Pre-save middleware
customerSchema.pre('save', function(next) {
  if (this.isNew && !this.metadata.firstContactDate) {
    this.metadata.firstContactDate = new Date();
  }
  if (this.phoneNumber) {
    this.phoneNumber = this.phoneNumber.replace(/[^\d+]/g, '');
  }
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
