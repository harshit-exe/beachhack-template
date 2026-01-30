const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const agentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  
  role: {
    type: String,
    enum: ['agent', 'supervisor', 'admin'],
    default: 'agent',
    index: true
  },
  
  status: {
    type: String,
    enum: ['online', 'offline', 'busy', 'away', 'break'],
    default: 'offline',
    index: true
  },
  
  phoneNumber: String,
  phoneExtension: String,
  
  departments: [{
    type: String,
    lowercase: true
  }],
  
  skills: [{
    name: String,
    proficiency: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  
  performance: {
    totalCalls: {
      type: Number,
      default: 0
    },
    averageHandleTime: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    resolutionRate: {
      type: Number,
      default: 0
    },
    activeCalls: {
      type: Number,
      default: 0
    }
  },
  
  settings: {
    autoAnswer: {
      type: Boolean,
      default: false
    },
    maxConcurrentCalls: {
      type: Number,
      default: 1
    },
    breakReminders: {
      type: Boolean,
      default: true
    },
    notificationPreferences: mongoose.Schema.Types.Mixed
  },
  
  lastLogin: Date

}, {
  timestamps: true,
  collection: 'agents'
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

// Update status method
agentSchema.methods.setStatus = async function(status) {
  this.status = status;
  return await this.save();
};

// Static to get online agents
agentSchema.statics.getOnlineAgents = function() {
  return this.find({ status: { $in: ['online', 'busy'] } });
};

module.exports = mongoose.model('Agent', agentSchema);
