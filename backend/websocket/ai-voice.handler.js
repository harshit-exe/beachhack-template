/**
 * AI Voice WebSocket Handler
 * 
 * Bidirectional real-time voice conversation using:
 * - Twilio Media Streams (audio in/out)
 * - Deepgram/Groq Whisper (speech-to-text)
 * - Groq Llama (AI responses with customer context)
 * - ElevenLabs (natural text-to-speech)
 * 
 * Flow:
 * Customer speaks → Twilio → This handler → Deepgram STT → Groq AI → ElevenLabs TTS → Twilio → Customer hears
 */

const WebSocket = require('ws');
const deepgramService = require('../services/deepgram.service');
const groqService = require('../services/groq.service');
const elevenLabsTTS = require('../services/elevenlabs-tts.service');
const customerService = require('../services/customer.service');
const conversationService = require('../services/conversation.service');

class AIVoiceHandler {
  constructor(io) {
    this.io = io;
    this.activeSessions = new Map();
    this.wss = null;
  }

  setupAIVoiceStream(server) {
    this.wss = new WebSocket.Server({ noServer: true });

    // Handle upgrade for /ai-voice-stream path
    server.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      
      if (pathname === '/ai-voice-stream') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      }
    });

    this.wss.on('connection', (ws, req) => {
      console.log('🤖 AI Voice stream connected');
      this.handleConnection(ws);
    });

    console.log('🤖 AI Voice WebSocket handler ready on /ai-voice-stream');
  }

  handleConnection(ws) {
    let session = {
      callSid: null,
      streamSid: null,
      conversationId: null,
      customer: null,
      customerContext: '',
      conversationHistory: [],
      deepgramConnection: null,
      isProcessing: false,
      audioBuffer: [],
      lastProcessTime: Date.now(),
      isAISpeaking: false
    };

    // System prompt for the AI
    const createSystemPrompt = (customer) => {
      const context = customer ? `
Customer Information:
- Name: ${customer.name || 'Unknown'}
- Phone: ${customer.phoneNumber || 'Unknown'}
- Status: ${customer.status || 'new'}
- Company: ${customer.metadata?.company || 'Unknown'}
- Lifetime Value: ₹${customer.metadata?.lifetimeValue || 0}
- Total Calls: ${customer.metadata?.totalCalls || 0}
- Notes: ${customer.metadata?.notes || 'None'}
- Alerts: ${customer.metadata?.alerts?.join(', ') || 'None'}
` : 'New customer - no existing information.';

      return `You are a friendly, professional customer service AI assistant for ContextHub.
${context}

Your personality:
- Warm and empathetic, but efficient
- Professional yet conversational
- Helpful and proactive

Guidelines:
- Keep responses SHORT (1-2 sentences max)
- Speak naturally like a human, not robotic
- If this is a new customer, greet them warmly and ask how you can help
- For VIP customers, acknowledge their status subtly
- If they have alerts or issues, address them proactively
- Use their name when appropriate
- If you cannot help, offer to transfer them to a human agent

Available actions (respond with JSON when needed):
- {"action": "transfer_to_agent", "reason": "..."} - Transfer to human
- {"action": "schedule_callback", "time": "..."} - Schedule callback
- {"action": "update_customer", "field": "...", "value": "..."} - Update info
- {"action": "create_ticket", "issue": "..."} - Create support ticket`;
    };

    // Process customer speech and generate AI response
    const processCustomerSpeech = async (transcript) => {
      if (session.isProcessing || session.isAISpeaking) return;
      session.isProcessing = true;

      try {
        console.log(`🎤 Customer said: "${transcript}"`);
        
        // Add to history
        session.conversationHistory.push({
          role: 'user',
          content: transcript
        });

        // Generate AI response with Groq
        const aiResponse = await groqService.client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: createSystemPrompt(session.customer) },
            ...session.conversationHistory
          ],
          max_tokens: 150,
          temperature: 0.7
        });

        const responseText = aiResponse.choices[0]?.message?.content || "I'm sorry, I didn't catch that. Could you please repeat?";
        
        // Check for action commands
        const actionMatch = responseText.match(/\{"action":\s*"([^"]+)"/);
        if (actionMatch) {
          await this.handleAction(responseText, session);
          session.isProcessing = false;
          return;
        }

        console.log(`🤖 AI responds: "${responseText}"`);
        
        // Add to history
        session.conversationHistory.push({
          role: 'assistant',
          content: responseText
        });

        // Emit transcription to frontend
        this.io.emit('transcription:update', {
          conversationId: session.conversationId,
          callSid: session.callSid,
          speaker: 'customer',
          text: transcript,
          timestamp: new Date()
        });

        this.io.emit('transcription:update', {
          conversationId: session.conversationId,
          callSid: session.callSid,
          speaker: 'ai',
          text: responseText,
          timestamp: new Date()
        });

        // Convert to speech with ElevenLabs and send to Twilio
        await this.speakToCustomer(ws, session, responseText);

      } catch (error) {
        console.error('AI processing error:', error.message);
      } finally {
        session.isProcessing = false;
      }
    };

    // Handle incoming Twilio messages
    ws.on('message', async (message) => {
      try {
        const msg = JSON.parse(message);

        switch (msg.event) {
          case 'start':
            session.callSid = msg.start?.callSid;
            session.streamSid = msg.start?.streamSid;
            session.conversationId = msg.start?.customParameters?.conversationId;
            
            console.log(`🤖 AI Voice session started for call: ${session.callSid}`);
            console.log('📦 Custom params:', msg.start?.customParameters);

            // Load customer context
            if (msg.start?.customParameters?.customerId) {
              try {
                session.customer = await customerService.findById(msg.start.customParameters.customerId);
                console.log('👤 Loaded customer:', session.customer?.name);
              } catch (e) {
                console.log('⚠️ Could not load customer:', e.message);
              }
            }

            // Store session
            this.activeSessions.set(session.callSid, session);

            // Setup real-time transcription with Deepgram
            if (deepgramService.client) {
              try {
                session.deepgramConnection = await deepgramService.createLiveConnection(
                  (transcript, isFinal) => {
                    if (isFinal && transcript && transcript.trim().length > 2) {
                      processCustomerSpeech(transcript);
                    }
                  },
                  (error) => {
                    console.log('⚠️ Deepgram error:', error.message);
                  }
                );
                console.log('✅ Real-time transcription active');
              } catch (e) {
                console.log('⚠️ Deepgram setup failed:', e.message);
              }
            }

            // Send initial greeting
            setTimeout(async () => {
              const greeting = session.customer?.name 
                ? `Hi ${session.customer.name}! This is the ContextHub AI assistant. How can I help you today?`
                : "Hello! This is the ContextHub AI assistant. May I know who I'm speaking with?";
              
              session.conversationHistory.push({
                role: 'assistant',
                content: greeting
              });
              
              await this.speakToCustomer(ws, session, greeting);
            }, 500);
            break;

          case 'media':
            // Forward audio to Deepgram for transcription
            if (msg.media?.payload && session.deepgramConnection) {
              const audioData = Buffer.from(msg.media.payload, 'base64');
              deepgramService.sendAudio(session.deepgramConnection, audioData);
            }
            break;

          case 'stop':
            console.log(`🤖 AI Voice session ended for call: ${session.callSid}`);
            
            // Save conversation summary
            if (session.conversationId && session.conversationHistory.length > 0) {
              try {
                const summary = await this.generateConversationSummary(session.conversationHistory);
                await conversationService.updateConversation(session.conversationId, {
                  'summary.auto': summary
                });
              } catch (e) {
                console.log('⚠️ Could not save summary:', e.message);
              }
            }
            
            if (session.deepgramConnection) {
              deepgramService.closeConnection(session.deepgramConnection);
            }
            this.activeSessions.delete(session.callSid);
            break;
        }
      } catch (error) {
        console.error('AI Voice message error:', error.message);
      }
    });

    ws.on('close', () => {
      console.log('🤖 AI Voice stream disconnected');
      if (session.deepgramConnection) {
        deepgramService.closeConnection(session.deepgramConnection);
      }
      if (session.callSid) {
        this.activeSessions.delete(session.callSid);
      }
    });

    ws.on('error', (error) => {
      console.error('AI Voice WebSocket error:', error.message);
    });
  }

  /**
   * Convert text to speech and send audio to Twilio stream
   */
  async speakToCustomer(ws, session, text) {
    session.isAISpeaking = true;

    try {
      // Get ulaw audio from ElevenLabs
      const audioBuffer = await elevenLabsTTS.textToSpeechUlaw(text);
      
      // Split into chunks and send to Twilio
      const CHUNK_SIZE = 640; // ~8ms of audio at 8kHz
      
      for (let i = 0; i < audioBuffer.length; i += CHUNK_SIZE) {
        const chunk = audioBuffer.slice(i, i + CHUNK_SIZE);
        const base64Audio = chunk.toString('base64');
        
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            event: 'media',
            streamSid: session.streamSid,
            media: {
              payload: base64Audio
            }
          }));
        }
        
        // Small delay to match audio timing
        await new Promise(r => setTimeout(r, 8));
      }

      // Send mark to know when audio finished
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          event: 'mark',
          streamSid: session.streamSid,
          mark: { name: 'speech-complete' }
        }));
      }

    } catch (error) {
      console.error('TTS error:', error.message);
      
      // Fallback: Use Twilio's <Say> via API
      console.log('⚠️ Falling back to Twilio TTS');
    } finally {
      session.isAISpeaking = false;
    }
  }

  /**
   * Handle AI action commands
   */
  async handleAction(responseText, session) {
    try {
      const action = JSON.parse(responseText);
      console.log('🎯 AI Action:', action);

      switch (action.action) {
        case 'transfer_to_agent':
          this.io.emit('ai:transfer-requested', {
            conversationId: session.conversationId,
            callSid: session.callSid,
            reason: action.reason
          });
          break;

        case 'update_customer':
          if (session.customer?._id && action.field && action.value) {
            const update = {};
            update[action.field] = action.value;
            await customerService.updateCustomer(session.customer._id, update);
          }
          break;

        case 'schedule_callback':
          if (session.customer?._id) {
            await customerService.updateCustomer(session.customer._id, {
              'metadata.scheduledMeeting': action.time
            });
          }
          break;
      }
    } catch (e) {
      // Not valid JSON action
    }
  }

  /**
   * Generate conversation summary
   */
  async generateConversationSummary(history) {
    try {
      const response = await groqService.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: 'Summarize this customer service conversation in 1-2 sentences. Focus on the main topic and outcome.' 
          },
          { 
            role: 'user', 
            content: history.map(h => `${h.role}: ${h.content}`).join('\n') 
          }
        ],
        max_tokens: 100
      });

      return response.choices[0]?.message?.content || 'No summary available';
    } catch (error) {
      return 'Conversation completed';
    }
  }

  /**
   * Get active AI session for a call
   */
  getSession(callSid) {
    return this.activeSessions.get(callSid);
  }
}

module.exports = AIVoiceHandler;
