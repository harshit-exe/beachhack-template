const twilio = require('twilio');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.agentPhoneNumber = process.env.AGENT_PHONE_NUMBER;
    
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
    } else {
      console.warn('⚠️ Twilio credentials not configured');
    }
  }

  // Handle incoming call webhook - returns TwiML
  handleIncomingCall(req, host, conversationId) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    // Start media stream for real-time transcription
    const start = twiml.start();
    const stream = start.stream({
      url: `wss://${host}/media-stream`,
      track: 'inbound_track' // Customer's voice only
    });
    
    // Pass conversationId as custom parameter
    if (conversationId) {
      stream.parameter({ name: 'conversationId', value: conversationId });
    }
    
    // Greeting message
    twiml.say({
      voice: 'Polly.Aditi',
      language: 'en-IN'
    }, 'Thank you for calling ContextHub. Please hold while we connect you to an agent.');
    
    // Dial to conference - unique room per call
    const conferenceName = `call-${conversationId || req.body.CallSid}`;
    const dial = twiml.dial();
    dial.conference({
      startConferenceOnEnter: true,
      endConferenceOnExit: true,
      waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical',
      statusCallback: `https://${host}/api/twilio/conference-status`,
      statusCallbackEvent: 'start end join leave'
    }, conferenceName);
    
    return twiml.toString();
  }

  // TwiML for agent joining from browser (Twilio Client)
  handleAgentConnect(req) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    const conferenceName = req.body.conferenceName || req.query.conference;
    
    if (conferenceName) {
      twiml.say({
        voice: 'Polly.Aditi',
        language: 'en-IN'
      }, 'Connecting you to the customer now.');
      
      const dial = twiml.dial();
      dial.conference({
        startConferenceOnEnter: true,
        endConferenceOnExit: true
      }, conferenceName);
    } else {
      twiml.say('No conference specified.');
    }
    
    return twiml.toString();
  }

  // Add agent to conference by calling their phone
  async addAgentToConference(conferenceName, host) {
    if (!this.client) throw new Error('Twilio not configured');
    if (!this.agentPhoneNumber) throw new Error('Agent phone number not configured');
    
    try {
      const twimlUrl = `https://${host}/api/twilio/agent-join?conference=${encodeURIComponent(conferenceName)}`;
      
      const call = await this.client.calls.create({
        from: this.phoneNumber,
        to: this.agentPhoneNumber,
        url: twimlUrl,
        statusCallback: `https://${host}/api/twilio/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
      });
      
      console.log(`📞 Calling agent at ${this.agentPhoneNumber} to join conference`);
      return call;
    } catch (error) {
      console.error('Error calling agent:', error);
      throw error;
    }
  }

  // TwiML for agent to join conference via phone
  getAgentJoinTwiml(conferenceName) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    twiml.say({
      voice: 'Polly.Aditi',
      language: 'en-IN'
    }, 'Connecting you to the customer.');
    
    const dial = twiml.dial();
    dial.conference({
      startConferenceOnEnter: true,
      endConferenceOnExit: true
    }, conferenceName);
    
    return twiml.toString();
  }

  // Make outbound call
  async makeOutboundCall(to, webhookUrl) {
    if (!this.client) throw new Error('Twilio not configured');
    
    try {
      const call = await this.client.calls.create({
        from: this.phoneNumber,
        to: to,
        url: webhookUrl,
        statusCallback: `${webhookUrl}/status`,
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
    if (!this.client) throw new Error('Twilio not configured');
    
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
    if (!this.client) throw new Error('Twilio not configured');
    
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
    if (!this.client) throw new Error('Twilio not configured');
    
    try {
      const recordings = await this.client.recordings.list({
        callSid: callSid
      });
      return recordings[0] || null;
    } catch (error) {
      console.error('Error fetching recording:', error);
      throw error;
    }
  }
}

module.exports = new TwilioService();
