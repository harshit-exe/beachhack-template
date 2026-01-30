const url = require('url');
const WebSocket = require('ws');
const deepgramService = require('../services/deepgram.service');
const groqService = require('../services/groq.service');
const conversationService = require('../services/conversation.service');
const customerService = require('../services/customer.service');

class MediaStreamHandler {
  constructor(io) {
    this.io = io;
    this.activeStreams = new Map();
    this.wss = null;
  }

  setupMediaStream(server) {
    this.wss = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      
      if (pathname === '/media-stream') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      }
    });

    this.wss.on('connection', (ws, req) => {
      console.log('🎙️ Twilio media stream connected');
      
      let conversationId = null;
      let callSid = null;
      let deepgramConnection = null;
      let useGroqFallback = false;
      let audioBuffer = [];
      let transcriptionHistory = [];
      let lastProcessTime = Date.now();
      
      const BUFFER_DURATION_MS = 5000;
      const MIN_AUDIO_BYTES = 20000;

      const processWithGroq = async () => {
        if (audioBuffer.length === 0) return;
        
        const audioToProcess = Buffer.concat(audioBuffer);
        audioBuffer = [];
        lastProcessTime = Date.now();
        
        if (audioToProcess.length < MIN_AUDIO_BYTES) return;
        if (!this.hasAudioContent(audioToProcess)) return;
        
        try {
          const wavBuffer = this.mulawToWav(audioToProcess);
          const context = transcriptionHistory.slice(-3).join('. ');
          const transcript = await groqService.transcribeAudioWithPrompt(wavBuffer, context);
          
          if (transcript && this.isValidTranscript(transcript)) {
            this.emitTranscript(transcript, conversationId, callSid, transcriptionHistory);
          }
        } catch (error) {
          console.error('Groq transcription error:', error.message);
        }
      };

      ws.on('message', async (message) => {
        try {
          const msg = JSON.parse(message);

          switch (msg.event) {
            case 'start':
              callSid = msg.start?.callSid;
              conversationId = msg.start?.customParameters?.conversationId;
              console.log(`📞 Stream started for call: ${callSid}`);
              console.log('📦 Custom params:', msg.start?.customParameters);
              
              // Try Deepgram
              if (deepgramService.client) {
                try {
                  deepgramConnection = await deepgramService.createLiveConnection(
                    (transcript, isFinal) => {
                      if (!transcript || transcript.trim().length < 3) return;
                      this.emitTranscript(transcript, conversationId, callSid, transcriptionHistory);
                    },
                    (error) => {
                      console.log('⚠️ Deepgram error, switching to Groq');
                      useGroqFallback = true;
                      deepgramConnection = null;
                    }
                  );
                  console.log('✅ Using Deepgram for transcription');
                } catch (e) {
                  console.log('⚠️ Deepgram failed, using Groq Whisper:', e.message);
                  useGroqFallback = true;
                }
              } else {
                console.log('📝 Using Groq Whisper for transcription');
                useGroqFallback = true;
              }
              
              this.activeStreams.set(callSid, { ws, conversationId });
              break;

            case 'media':
              if (msg.media?.payload) {
                const audioData = Buffer.from(msg.media.payload, 'base64');
                
                if (deepgramConnection && !useGroqFallback) {
                  deepgramService.sendAudio(deepgramConnection, audioData);
                } else {
                  audioBuffer.push(audioData);
                  if (Date.now() - lastProcessTime >= BUFFER_DURATION_MS) {
                    processWithGroq();
                  }
                }
              }
              break;

            case 'stop':
              console.log(`📞 Stream stopped for call: ${callSid}`);
              if (deepgramConnection) deepgramService.closeConnection(deepgramConnection);
              if (useGroqFallback && audioBuffer.length > 0) await processWithGroq();
              
              // Extract and save customer details from conversation
              console.log(`📊 Transcription history (${transcriptionHistory.length} items):`, transcriptionHistory);
              if (transcriptionHistory.length > 0 && conversationId) {
                console.log('🔍 Starting customer details extraction...');
                try {
                  await this.extractAndSaveCustomerDetails(transcriptionHistory, conversationId);
                } catch (err) {
                  console.error('❌ Extraction error:', err.message);
                }
              } else {
                console.log('⚠️ Skipping extraction - history:', transcriptionHistory.length, 'convId:', conversationId);
              }
              
              this.activeStreams.delete(callSid);
              break;
          }
        } catch (error) {
          console.error('Media stream error:', error.message);
        }
      });

      ws.on('close', () => {
        console.log('🎙️ Media stream disconnected');
        if (deepgramConnection) deepgramService.closeConnection(deepgramConnection);
        if (callSid) this.activeStreams.delete(callSid);
      });

      ws.on('error', (error) => console.error('WebSocket error:', error.message));
    });

    console.log('🎙️ Media stream WebSocket handler ready on /media-stream');
  }

  emitTranscript(transcript, conversationId, callSid, history) {
    console.log(`📝 Customer: "${transcript}"`);
    history.push(transcript);
    if (history.length > 15) history.shift();
    
    if (conversationId) {
      conversationService.addTranscription(conversationId, 'customer', transcript).catch(() => {});
    }
    
    this.io.emit('transcription:update', {
      conversationId,
      callSid,
      speaker: 'customer',
      text: transcript,
      timestamp: new Date()
    });
    
    this.generateSuggestions(transcript, history, conversationId);
  }

  async generateSuggestions(transcript, history, conversationId) {
    try {
      const suggestions = await groqService.generateSuggestions({
        lastMessage: transcript,
        history: history.map(text => ({ speaker: 'customer', text }))
      });
      
      if (suggestions) {
        this.io.emit('ai:suggestion', {
          conversationId,
          suggestions: suggestions.suggestions || [],
          recommendedActions: suggestions.recommendedActions || []
        });
      }
    } catch (error) {
      console.error('AI suggestion error:', error.message);
    }
  }

  // Extract customer details from conversation and save to database
  async extractAndSaveCustomerDetails(transcriptionHistory, conversationId) {
    try {
      console.log('🤖 Calling Groq to extract customer details...');
      const details = await groqService.extractCustomerDetails(transcriptionHistory);
      console.log('📋 Extraction result:', details);
      
      if (details) {
        // Get conversation to find customer
        const conversation = await conversationService.findById(conversationId);
        console.log('📞 Conversation found:', !!conversation, 'CustomerId:', conversation?.customerId);
        
        if (conversation && conversation.customerId) {
          const updates = {};
          
          if (details.name) updates.name = details.name;
          if (details.email) updates.email = details.email;
          if (details.company) updates['metadata.company'] = details.company;
          if (details.purpose) updates['metadata.notes'] = details.purpose;
          if (details.scheduledMeeting) {
            updates['metadata.scheduledMeeting'] = details.scheduledMeeting;
          }
          
          console.log('📝 Updates to apply:', updates);
          
          if (Object.keys(updates).length > 0) {
            const customerId = conversation.customerId._id || conversation.customerId;
            await customerService.updateCustomer(customerId, updates);
            console.log('💾 Customer details saved successfully!');
          } else {
            console.log('⚠️ No updates to apply');
          }
        } else {
          console.log('⚠️ No conversation or customerId found');
        }
      } else {
        console.log('⚠️ No details extracted from conversation');
      }
    } catch (error) {
      console.error('Failed to extract/save customer details:', error);
    }
  }

  hasAudioContent(buffer) {
    let energy = 0;
    const samples = Math.min(buffer.length, 4000);
    for (let i = 0; i < samples; i++) {
      energy += Math.abs(this.mulawDecode(buffer[i]));
    }
    return (energy / samples) > 150;
  }

  isValidTranscript(text) {
    if (!text) return false;
    const cleaned = text.trim().toLowerCase();
    if (cleaned.length < 5) return false;
    const hallucinations = ['thank you', 'thanks', 'bye', 'goodbye', 'okay', 'ok', 'you'];
    return !hallucinations.includes(cleaned) && cleaned.split(' ').length >= 3;
  }

  mulawToWav(mulawBuffer) {
    const pcmBuffer = Buffer.alloc(mulawBuffer.length * 2);
    for (let i = 0; i < mulawBuffer.length; i++) {
      pcmBuffer.writeInt16LE(this.mulawDecode(mulawBuffer[i]), i * 2);
    }
    const wavHeader = Buffer.alloc(44);
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(pcmBuffer.length + 36, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16);
    wavHeader.writeUInt16LE(1, 20);
    wavHeader.writeUInt16LE(1, 22);
    wavHeader.writeUInt32LE(8000, 24);
    wavHeader.writeUInt32LE(16000, 28);
    wavHeader.writeUInt16LE(2, 32);
    wavHeader.writeUInt16LE(16, 34);
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(pcmBuffer.length, 40);
    return Buffer.concat([wavHeader, pcmBuffer]);
  }

  mulawDecode(mulaw) {
    const BIAS = 33;
    mulaw = ~mulaw;
    const sign = mulaw & 0x80;
    const exp = (mulaw >> 4) & 0x07;
    const mant = mulaw & 0x0F;
    let sample = ((mant << 3) + BIAS) << exp;
    sample -= BIAS;
    return sign ? -sample : sample;
  }
}

module.exports = MediaStreamHandler;
