/**
 * ElevenLabs Conversational AI Service
 * 
 * For phone integration with Twilio, ElevenLabs uses WebSocket streaming.
 * The agent handles the conversation via real-time audio streaming.
 * 
 * Customer context is passed via:
 * 1. Stream parameters (basic info)
 * 2. First message prompt (full context for existing customers)
 */

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.agentId = process.env.ELEVENLABS_AGENT_ID;
    
    if (this.apiKey && this.agentId) {
      console.log('✅ ElevenLabs AI Agent configured');
    } else {
      console.log('ℹ️ ElevenLabs AI Agent not configured (needs ELEVENLABS_AGENT_ID)');
    }
  }

  isConfigured() {
    return !!(this.apiKey && this.agentId);
  }

  /**
   * Get WebSocket URL for ElevenLabs Conversational AI
   */
  getWebSocketUrl() {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs Agent not configured');
    }
    return `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`;
  }

  /**
   * Get signed WebSocket URL for ElevenLabs (required for Twilio streams)
   */
  async getSignedUrl() {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs Agent not configured');
    }

    try {
      const axios = require('axios');
      const response = await axios.get(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${this.agentId}`,
        {
          headers: {
            'xi-api-key': this.apiKey
          }
        }
      );
      
      console.log('🔐 Got ElevenLabs signed URL');
      return response.data.signed_url;
    } catch (error) {
      console.error('Failed to get signed URL:', error.message);
      throw error;
    }
  }

  /**
   * Build rich context string for the AI agent
   * This gives the AI full knowledge about the customer
   */
  buildCustomerContext(customer = {}) {
    const context = [];
    
    // Basic info
    context.push(`Customer Name: ${customer.name || 'Unknown'}`);
    context.push(`Phone: ${customer.phoneNumber || 'Unknown'}`);
    context.push(`Status: ${customer.status || 'new'}`);
    
    // Metadata
    if (customer.metadata) {
      if (customer.metadata.company) {
        context.push(`Company: ${customer.metadata.company}`);
      }
      if (customer.metadata.totalCalls) {
        context.push(`Previous Calls: ${customer.metadata.totalCalls}`);
      }
      if (customer.metadata.lifetimeValue) {
        context.push(`Lifetime Value: ₹${customer.metadata.lifetimeValue}`);
      }
      if (customer.metadata.averageRating) {
        context.push(`Satisfaction Rating: ${customer.metadata.averageRating}/5`);
      }
      if (customer.metadata.notes) {
        context.push(`Agent Notes: ${customer.metadata.notes}`);
      }
      if (customer.metadata.scheduledMeeting) {
        context.push(`Scheduled Meeting: ${customer.metadata.scheduledMeeting}`);
      }
    }
    
    // Email
    if (customer.email) {
      context.push(`Email: ${customer.email}`);
    }
    
    // Tags
    if (customer.tags && customer.tags.length > 0) {
      context.push(`Tags: ${customer.tags.join(', ')}`);
    }
    
    // Alerts
    if (customer.alerts && customer.alerts.length > 0) {
      const activeAlerts = customer.alerts.filter(a => !a.acknowledged);
      if (activeAlerts.length > 0) {
        context.push(`⚠️ Active Alerts: ${activeAlerts.map(a => a.message).join('; ')}`);
      }
    }
    
    // Insights
    if (customer.insights && customer.insights.length > 0) {
      context.push(`Insights: ${customer.insights.map(i => i.description).join('; ')}`);
    }
    
    return context.join('\n');
  }

  /**
   * Generate TwiML to connect call to ElevenLabs Conversational AI
   * 
   * Two modes:
   * 1. ELEVENLABS_PHONE_NUMBER set: Forward to ElevenLabs-connected number (recommended)
   * 2. No phone number: Use WebSocket bridge (experimental)
   */
  async generateStreamToAITwiml(customerInfo = {}, context = 'general', host = '') {
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    const isVIP = customerInfo.status === 'vip';
    const isReturning = (customerInfo.metadata?.totalCalls || 0) > 1;

    // Personalized greeting before transfer
    let greeting;
    if (context === 'transfer') {
      greeting = isVIP 
        ? `I'm transferring you to our AI assistant, ${customerInfo.name || 'valued customer'}.`
        : 'I\'m transferring you to our AI assistant.';
    } else {
      greeting = isReturning
        ? `Hello ${customerInfo.name || 'there'}! Connecting you to our AI assistant.`
        : 'Welcome! Connecting you to our AI assistant.';
    }
    
    twiml.say({ voice: 'Polly.Amy' }, greeting);
    
    // Check if we have an ElevenLabs-connected phone number (RECOMMENDED)
    const elevenLabsPhone = process.env.ELEVENLABS_PHONE_NUMBER;
    
    if (elevenLabsPhone) {
      // Forward to ElevenLabs-connected Twilio number
      // IMPORTANT: Pass original caller ID so ElevenLabs can look up customer
      console.log('📞 Forwarding to ElevenLabs number:', elevenLabsPhone);
      console.log('📱 Original caller:', customerInfo.phoneNumber);
      
      const dial = twiml.dial({
        // Use ORIGINAL caller ID so ElevenLabs sees who's really calling
        callerId: customerInfo.phoneNumber || process.env.TWILIO_PHONE_NUMBER,
        timeout: 30,
        answerOnBridge: true
      });
      dial.number(elevenLabsPhone);
      
    } else {
      // Fallback: Use WebSocket bridge (experimental)
      console.log('🔗 Using WebSocket bridge (set ELEVENLABS_PHONE_NUMBER for better reliability)');
      
      const ngrokHost = host || process.env.NGROK_URL?.replace('https://', '') || 'localhost:5001';
      const bridgeUrl = `wss://${ngrokHost}/elevenlabs-stream`;
      
      const connect = twiml.connect();
      const stream = connect.stream({
        url: bridgeUrl,
        name: 'elevenlabs-bridge'
      });
      
      // Pass customer context as stream parameters
      stream.parameter({ name: 'customer_name', value: customerInfo.name || 'Customer' });
      stream.parameter({ name: 'customer_phone', value: customerInfo.phoneNumber || '' });
      stream.parameter({ name: 'customer_status', value: customerInfo.status || 'new' });
      stream.parameter({ name: 'is_vip', value: isVIP ? 'true' : 'false' });
      stream.parameter({ name: 'context', value: context });
    }

    return twiml.toString();
  }

  /**
   * Generate TwiML for new customer AI screening
   * AI collects name, purpose of call, and other info before routing to agent
   */
  generateNewCustomerScreeningTwiml(customerInfo = {}, callbackUrl, host, conversationId) {
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    // Start local media stream for dashboard transcription
    if (host && conversationId) {
      const start = twiml.start();
      const stream = start.stream({
        url: `wss://${host}/media-stream`,
        track: 'inbound_track'
      });
      stream.parameter({ name: 'conversationId', value: conversationId });
    }

    // Friendly greeting for new customers
    twiml.say({ voice: 'Polly.Amy' }, 
      'Welcome to ContextHub support! I\'m your AI assistant and I\'ll help connect you with the right person.'
    );
    
    if (this.isConfigured()) {
      // Connect to ElevenLabs for AI screening
      const connect = twiml.connect({
        action: callbackUrl
      });
      const stream = connect.stream({
        url: this.getWebSocketUrl(),
        name: 'elevenlabs-screening'
      });
      
      // Pass screening context
      stream.parameter({ name: 'mode', value: 'screening' });
      stream.parameter({ name: 'customer_phone', value: customerInfo.phoneNumber || '' });
      stream.parameter({ name: 'purpose', value: 'collect_info' });
      stream.parameter({ name: 'is_new_customer', value: 'true' });
      stream.parameter({ name: 'instructions', value: 'Ask for customer name and the purpose of their call. Be friendly and professional.' });
    } else {
      // Fallback: gather info via speech
      const gather = twiml.gather({
        input: 'speech',
        action: callbackUrl,
        timeout: 10,
        speechTimeout: 'auto',
        language: 'en-IN'
      });
      
      gather.say({ voice: 'Polly.Amy' }, 
        'May I have your name and briefly know how I can help you today?'
      );
      
      twiml.say({ voice: 'Polly.Amy' }, 
        'No worries, let me connect you with an agent.'
      );
      twiml.redirect(callbackUrl);
    }

    return twiml.toString();
  }

  /**
   * Generate TwiML to transfer call from AI back to human agent
   */
  generateHandoffToAgentTwiml(conferenceName, host) {
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    twiml.say({ voice: 'Polly.Amy' }, 
      'I\'m now connecting you with a human agent who can assist you further. Please hold.'
    );
    
    const dial = twiml.dial();
    dial.conference({
      beep: false,
      waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.guitars',
      startConferenceOnEnter: true,
      endConferenceOnExit: false,
      statusCallback: `https://${host}/api/twilio/conference-status`,
      statusCallbackEvent: 'start end join leave'
    }, conferenceName);

    return twiml.toString();
  }

  /**
   * Generate TwiML for hold message (fallback when AI not available)
   */
  generateHoldTwiml() {
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    twiml.say({ voice: 'Polly.Amy' }, 
      'Thank you for calling. All our agents are currently busy. Please hold and someone will be with you shortly.'
    );
    
    twiml.play({ loop: 10 }, 'http://com.twilio.sounds.music.s3.amazonaws.com/MARKOVICHAMP-B8.mp3');
    
    return twiml.toString();
  }

  /**
   * Generate TwiML for when screening is complete
   */
  generatePostScreeningTwiml(conferenceName, host, collectedInfo = {}) {
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    const customerName = collectedInfo.name || 'there';
    
    twiml.say({ voice: 'Polly.Amy' }, 
      `Thank you ${customerName}. I'm now connecting you with an available agent who can assist you.`
    );
    
    const dial = twiml.dial();
    dial.conference({
      beep: true,
      waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.guitars',
      startConferenceOnEnter: true,
      endConferenceOnExit: false,
      statusCallback: `https://${host}/api/twilio/conference-status`,
      statusCallbackEvent: 'start end join leave'
    }, conferenceName);

    return twiml.toString();
  }
}

module.exports = new ElevenLabsService();
