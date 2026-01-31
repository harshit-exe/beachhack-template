/**
 * AI Voice Conversation Service
 * 
 * Hybrid approach:
 * - Uses Groq (Llama) for conversation logic (full customer context)
 * - Uses ElevenLabs for high-quality text-to-speech
 * - Handles real-time phone conversations with customer data
 */

const Groq = require('groq-sdk');
const axios = require('axios');

class AIVoiceService {
  constructor() {
    // Groq for AI logic
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      this.groqClient = new Groq({ apiKey: groqKey });
      console.log('✅ Groq AI configured for voice conversations');
    }
    
    // ElevenLabs for TTS
    this.elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    this.elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah
    
    if (this.elevenLabsKey) {
      console.log('✅ ElevenLabs TTS configured');
    }
  }

  isConfigured() {
    return !!(this.groqClient && this.elevenLabsKey);
  }

  /**
   * Build conversation context from customer data
   */
  async buildSystemPrompt(customer, mode = 'general') {
    const isVIP = customer?.status === 'vip';
    const isReturning = (customer?.metadata?.totalCalls || 0) > 1;
    
    // Import here to avoid circular dep if any
    const StoreService = require('./store.service');
    // Assuming single-agent for now or finding first store
    const storeInventory = await StoreService.getInventoryForAI(null); 
    
    let basePrompt = `You are a helpful customer support AI assistant for ContextHub. 
You are speaking on the phone, so keep responses conversational and concise (2-3 sentences max).
Be warm, professional, and empathetic.`;

    // --- STORE CONTEXT ---
    basePrompt += `\n\n--- STORE / INVENTORY CONTEXT ---`;
    basePrompt += `\nAVAILABLE PRODUCTS:\n${storeInventory}`;
    
    // --- CUSTOMER CONTEXT ---
    if (customer) {
      basePrompt += `\n\n--- CUSTOMER CONTEXT ---`;
      basePrompt += `\nName: ${customer.name || 'Unknown'}`;
      basePrompt += `\nPhone: ${customer.phoneNumber}`;
      basePrompt += `\nStatus: ${customer.status || 'new'}${isVIP ? ' (VIP - treat with extra care)' : ''}`;
      
      // AI Profile
      if (customer.metadata?.generatedProfile) {
        basePrompt += `\nPROFILE: ${customer.metadata.generatedProfile}`;
      }
      
      // Key Dates
      if (customer.metadata?.keyDates && customer.metadata.keyDates.length > 0) {
        basePrompt += `\n\n📅 KEY DATES TO REMEMBER:`;
        customer.metadata.keyDates.forEach(d => {
          basePrompt += `\n- ${d.label}: ${new Date(d.date).toLocaleDateString()} (${d.description || ''})`;
        });
      }
      
      // Conversation Summaries (Context Memory)
      if (customer.metadata?.conversationSummaries && customer.metadata.conversationSummaries.length > 0) {
        basePrompt += `\n\n🧠 CONVERSATION HISTORY (Memory):`;
        // Take last 3 summaries
        const recentSummaries = customer.metadata.conversationSummaries
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3);
          
        recentSummaries.forEach(s => {
          basePrompt += `\n- [${new Date(s.date).toLocaleDateString()}]: ${s.summary}`;
        });
      }
      
      if (customer.metadata) {
        if (customer.metadata.scheduledMeeting) {
          basePrompt += `\n\n📅 UPCOMING MEETING: ${customer.metadata.scheduledMeeting}`;
        }
        if (customer.metadata.notes) {
          basePrompt += `\n\n📝 AGENT NOTES: ${customer.metadata.notes}`;
        }
      }
    }
    
    // Mode-specific instructions
    if (mode === 'screening') {
      basePrompt += `\n\n--- YOUR TASK ---
This is a NEW CUSTOMER. Your goal is to:
1. Greet them warmly
2. Ask for their name
3. Ask briefly about the purpose of their call
4. Let them know you'll connect them with an agent
Keep it natural and conversational. Don't sound robotic.`;
    } else if (mode === 'support') {
      basePrompt += `\n\n--- YOUR TASK ---
Help this customer. Use the AVAILABLE PRODUCTS list to answer questions about stock/prices.
Reference their history if relevant (e.g. "How was your wife's birthday?" if reliable date).
If you cannot resolve their issue, offer to connect them with a human agent.`;
    }
    
    return basePrompt;
  }

  /**
   * Generate AI response using Groq/Llama
   */
  async generateResponse(customer, conversationHistory, customerMessage) {
    if (!this.groqClient) {
      throw new Error('Groq not configured');
    }

    try {
      const systemPrompt = await this.buildSystemPrompt(customer, 'support');
      
      // Build message history
      const messages = [
        { role: 'system', content: systemPrompt }
      ];
      
      // Add conversation history
      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.forEach(msg => {
          messages.push({
            role: msg.speaker === 'customer' ? 'user' : 'assistant',
            content: msg.text
          });
        });
      }
      
      // Add current message
      messages.push({ role: 'user', content: customerMessage });

      const completion = await this.groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 150, // Keep responses short for phone
        stream: false
      });

      return completion.choices[0].message.content;
      
    } catch (error) {
      console.error('AI response generation error:', error);
      return "I apologize, I'm having trouble processing that. Let me connect you with an agent.";
    }
  }

  /**
   * Generate screening response for new customers
   */
  async generateScreeningResponse(customerMessage, collectedInfo = {}) {
    if (!this.groqClient) {
      throw new Error('Groq not configured');
    }

    try {
      const systemPrompt = `You are a friendly phone receptionist. Your goal is to:
1. If you haven't greeted yet, greet warmly and ask for their name
2. Once you have their name, ask briefly about the purpose of their call
3. Once you have both, thank them and say you'll connect them with an agent

Current collected info:
- Name: ${collectedInfo.name || 'Not collected yet'}
- Purpose: ${collectedInfo.purpose || 'Not collected yet'}

Keep responses very short (1-2 sentences). Be natural and conversational.`;

      const completion = await this.groqClient.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: customerMessage }
        ],
        temperature: 0.8,
        max_tokens: 80
      });

      return completion.choices[0].message.content;
      
    } catch (error) {
      console.error('Screening response error:', error);
      return "Thanks for calling! Let me connect you with an agent.";
    }
  }

  /**
   * Convert text to speech using ElevenLabs
   * Returns audio buffer
   */
  async textToSpeech(text) {
    if (!this.elevenLabsKey) {
      throw new Error('ElevenLabs not configured');
    }

    try {
      const response = await axios({
        method: 'POST',
        url: `https://api.elevenlabs.io/v1/text-to-speech/${this.elevenLabsVoiceId}`,
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsKey
        },
        data: {
          text: text,
          model_id: 'eleven_turbo_v2', // Fast, good quality
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          }
        },
        responseType: 'arraybuffer'
      });

      return response.data;
      
    } catch (error) {
      console.error('ElevenLabs TTS error:', error.message);
      throw error;
    }
  }

  /**
   * Convert text to speech and get URL for Twilio
   * Uses ElevenLabs streaming URL
   */
  getStreamingTTSUrl(text) {
    if (!this.elevenLabsKey) return null;
    
    const encodedText = encodeURIComponent(text);
    return `https://api.elevenlabs.io/v1/text-to-speech/${this.elevenLabsVoiceId}/stream?text=${encodedText}&model_id=eleven_turbo_v2&xi-api-key=${this.elevenLabsKey}`;
  }

  /**
   * Generate TwiML for AI response with our logic + ElevenLabs voice
   */
  generateAIResponseTwiml(responseText, gatherUrl) {
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    // Gather next input while playing AI response
    const gather = twiml.gather({
      input: 'speech',
      action: gatherUrl,
      timeout: 5,
      speechTimeout: 'auto',
      language: 'en-IN'
    });
    
    // Use AWS Polly for TTS (Twilio built-in, more reliable for phone)
    // ElevenLabs TTS via URL has latency issues with Twilio
    gather.say({ 
      voice: 'Polly.Aditi',  // Indian English voice
      language: 'en-IN'
    }, responseText);
    
    return twiml.toString();
  }

  /**
   * Generate initial greeting TwiML for AI call handling
   */
  generateAIGreetingTwiml(customer, gatherUrl, mode = 'support') {
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    const isVIP = customer?.status === 'vip';
    const name = customer?.name;
    
    let greeting;
    if (mode === 'screening') {
      greeting = "Hello! Welcome to ContextHub support. I'm an AI assistant. May I know your name please?";
    } else if (name) {
      greeting = isVIP 
        ? `Hello ${name}! It's great to hear from you. I'm your AI assistant with your complete history. How can I help you today?`
        : `Hello ${name}! I'm your AI assistant. How can I help you today?`;
    } else {
      greeting = "Hello! I'm your AI assistant. How can I help you today?";
    }
    
    const gather = twiml.gather({
      input: 'speech',
      action: gatherUrl,
      timeout: 8,
      speechTimeout: 'auto',
      language: 'en-IN'
    });
    
    gather.say({ 
      voice: 'Polly.Aditi',
      language: 'en-IN'
    }, greeting);
    
    // If no input, prompt again
    twiml.say({ voice: 'Polly.Aditi' }, "Are you still there? If you need assistance, please let me know.");
    twiml.redirect(gatherUrl.replace('/gather', '/no-input'));
    
    return twiml.toString();
  }
}

module.exports = new AIVoiceService();
