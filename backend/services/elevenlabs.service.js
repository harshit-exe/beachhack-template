/**
 * ElevenLabs Conversational AI Service
 * 
 * For phone integration with Twilio, ElevenLabs uses WebSocket streaming.
 * The agent handles the conversation via real-time audio streaming.
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
   * This is used with Twilio's <Connect><Stream> to send audio to ElevenLabs
   */
  getWebSocketUrl() {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs Agent not configured');
    }
    return `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`;
  }

  /**
   * Generate TwiML to stream call audio to ElevenLabs AI
   * Uses Twilio Media Streams to connect to ElevenLabs WebSocket
   */
  generateStreamToAITwiml(customerInfo = {}) {
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    // Brief greeting
    twiml.say({ voice: 'Polly.Amy' }, 
      'Connecting you to our AI assistant. One moment please.'
    );
    
    // Connect to ElevenLabs via WebSocket stream
    const connect = twiml.connect();
    const stream = connect.stream({
      url: this.getWebSocketUrl(),
      name: 'elevenlabs'
    });
    
    // Pass customer info as parameters to the stream
    stream.parameter({ name: 'customer_name', value: customerInfo.name || 'Customer' });
    stream.parameter({ name: 'customer_phone', value: customerInfo.phoneNumber || '' });
    stream.parameter({ name: 'customer_status', value: customerInfo.status || 'new' });

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
    
    // Play hold music
    twiml.play({ loop: 10 }, 'http://com.twilio.sounds.music.s3.amazonaws.com/MARKOVICHAMP-B8.mp3');
    
    return twiml.toString();
  }
}

module.exports = new ElevenLabsService();
