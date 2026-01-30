/**
 * ElevenLabs Conversational AI Bridge for Twilio
 * 
 * This handler bridges Twilio Media Streams with ElevenLabs Conversational AI.
 * 
 * Audio Formats:
 * - Twilio: µ-law 8kHz mono
 * - ElevenLabs: PCM 16-bit 16kHz mono
 */

const WebSocket = require('ws');
const axios = require('axios');

class ElevenLabsBridge {
  constructor(server) {
    this.wss = new WebSocket.Server({ noServer: true });
    this.agentId = process.env.ELEVENLABS_AGENT_ID;
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    
    this.setupWebSocket(server);
    
    if (this.agentId && this.apiKey) {
      console.log('🤖 ElevenLabs Conversational AI Bridge ready on /elevenlabs-stream');
    } else {
      console.log('⚠️ ElevenLabs Bridge not configured (missing AGENT_ID or API_KEY)');
    }
  }

  setupWebSocket(server) {
    server.on('upgrade', (request, socket, head) => {
      if (request.url === '/elevenlabs-stream') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      }
    });

    this.wss.on('connection', (twilioWs) => {
      console.log('📞 Twilio connected to ElevenLabs Bridge');
      this.handleTwilioConnection(twilioWs);
    });
  }

  async getSignedUrl() {
    try {
      const response = await axios.get(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${this.agentId}`,
        {
          headers: { 'xi-api-key': this.apiKey }
        }
      );
      return response.data.signed_url;
    } catch (error) {
      console.error('Failed to get ElevenLabs signed URL:', error.message);
      throw error;
    }
  }

  async handleTwilioConnection(twilioWs) {
    let elevenLabsWs = null;
    let streamSid = null;
    let callSid = null;
    let isConnected = false;
    
    try {
      // Get signed URL for ElevenLabs
      const signedUrl = await this.getSignedUrl();
      console.log('🔐 Got ElevenLabs signed URL');
      
      // Connect to ElevenLabs
      elevenLabsWs = new WebSocket(signedUrl);
      
      elevenLabsWs.on('open', () => {
        console.log('🎙️ Connected to ElevenLabs Conversational AI');
        isConnected = true;
      });

      elevenLabsWs.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleElevenLabsMessage(message, twilioWs, streamSid);
        } catch (e) {
          // Binary audio data from ElevenLabs
          if (data instanceof Buffer && streamSid && twilioWs.readyState === WebSocket.OPEN) {
            // ElevenLabs sends PCM 16-bit 16kHz, convert to µ-law 8kHz for Twilio
            const mulawAudio = this.convertToMulaw(data);
            
            twilioWs.send(JSON.stringify({
              event: 'media',
              streamSid: streamSid,
              media: {
                payload: mulawAudio.toString('base64')
              }
            }));
          }
        }
      });

      elevenLabsWs.on('error', (error) => {
        console.error('ElevenLabs WebSocket error:', error.message);
      });

      elevenLabsWs.on('close', (code, reason) => {
        console.log('🔴 ElevenLabs connection closed:', code, reason?.toString() || '');
        isConnected = false;
      });

    } catch (error) {
      console.error('Failed to connect to ElevenLabs:', error.message);
      return;
    }

    // Handle Twilio messages
    twilioWs.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.event) {
          case 'start':
            streamSid = data.start.streamSid;
            callSid = data.start.callSid;
            console.log('📞 Twilio stream started:', callSid);
            console.log('📦 Stream SID:', streamSid);
            break;
            
          case 'media':
            // Convert Twilio audio and forward to ElevenLabs
            if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN && isConnected) {
              const audioData = Buffer.from(data.media.payload, 'base64');
              
              // Convert µ-law 8kHz to PCM 16-bit (for ElevenLabs)
              const pcmData = this.mulawToPcm16(audioData);
              
              // Send as base64 encoded audio
              elevenLabsWs.send(JSON.stringify({
                user_audio_chunk: pcmData.toString('base64')
              }));
            }
            break;
            
          case 'stop':
            console.log('📞 Twilio stream stopped');
            if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
              elevenLabsWs.close();
            }
            break;
            
          case 'mark':
            // Mark event - audio playback completed
            break;
        }
      } catch (error) {
        console.error('Error processing Twilio message:', error.message);
      }
    });

    twilioWs.on('close', () => {
      console.log('📞 Twilio connection closed');
      if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
        elevenLabsWs.close();
      }
    });

    twilioWs.on('error', (error) => {
      console.error('Twilio WebSocket error:', error.message);
    });
  }

  handleElevenLabsMessage(message, twilioWs, streamSid) {
    switch (message.type) {
      case 'conversation_initiation_metadata':
        console.log('🎙️ ElevenLabs conversation initialized');
        break;
        
      case 'agent_response':
        if (message.agent_response_type === 'agent_response') {
          console.log('🤖 Agent:', message.agent_response?.substring(0, 100));
        }
        break;
        
      case 'user_transcript':
        console.log('👤 User (EL):', message.user_transcript?.substring(0, 100));
        break;
        
      case 'audio':
        // Audio response from agent - convert and send to Twilio
        if (message.audio_event?.audio_base_64 && twilioWs.readyState === WebSocket.OPEN && streamSid) {
          const pcmBuffer = Buffer.from(message.audio_event.audio_base_64, 'base64');
          const mulawBuffer = this.convertToMulaw(pcmBuffer);
          
          twilioWs.send(JSON.stringify({
            event: 'media',
            streamSid: streamSid,
            media: {
              payload: mulawBuffer.toString('base64')
            }
          }));
        }
        break;
        
      case 'interruption':
        console.log('🛑 Interruption detected');
        if (twilioWs.readyState === WebSocket.OPEN && streamSid) {
          twilioWs.send(JSON.stringify({
            event: 'clear',
            streamSid: streamSid
          }));
        }
        break;
        
      case 'ping':
        // Respond with pong
        break;
        
      case 'error':
        console.error('❌ ElevenLabs error:', message.error);
        break;
        
      default:
        if (message.type) {
          console.log('📨 ElevenLabs:', message.type);
        }
    }
  }

  // µ-law decoding table
  getMulawDecodeTable() {
    if (!this._mulawDecodeTable) {
      this._mulawDecodeTable = new Int16Array(256);
      const MULAW_BIAS = 33;
      
      for (let i = 0; i < 256; i++) {
        let mulaw = ~i;
        let sign = mulaw & 0x80;
        let exponent = (mulaw >> 4) & 0x07;
        let mantissa = mulaw & 0x0f;
        
        let sample = ((mantissa << 3) + MULAW_BIAS) << exponent;
        sample -= MULAW_BIAS;
        
        this._mulawDecodeTable[i] = sign ? -sample : sample;
      }
    }
    return this._mulawDecodeTable;
  }

  // Convert µ-law (Twilio 8kHz) to PCM 16-bit
  mulawToPcm16(mulawData) {
    const decodeTable = this.getMulawDecodeTable();
    const pcmData = Buffer.alloc(mulawData.length * 2);
    
    for (let i = 0; i < mulawData.length; i++) {
      const sample = decodeTable[mulawData[i]];
      pcmData.writeInt16LE(sample, i * 2);
    }
    
    return pcmData;
  }

  // Convert PCM 16-bit to µ-law (for Twilio)
  convertToMulaw(pcmData) {
    const MULAW_MAX = 0x1FFF;
    const MULAW_BIAS = 33;
    
    // Handle different input sizes
    const sampleCount = Math.floor(pcmData.length / 2);
    const mulawData = Buffer.alloc(sampleCount);
    
    for (let i = 0; i < sampleCount; i++) {
      let sample = pcmData.readInt16LE(i * 2);
      
      // Determine sign
      let sign = 0;
      if (sample < 0) {
        sign = 0x80;
        sample = -sample;
      }
      
      // Clip to max
      if (sample > MULAW_MAX) sample = MULAW_MAX;
      
      // Add bias
      sample += MULAW_BIAS;
      
      // Find exponent and mantissa
      let exponent = 7;
      let expMask = 0x4000;
      
      while ((sample & expMask) === 0 && exponent > 0) {
        exponent--;
        expMask >>= 1;
      }
      
      const mantissa = (sample >> (exponent + 3)) & 0x0f;
      const mulaw = ~(sign | (exponent << 4) | mantissa);
      
      mulawData[i] = mulaw & 0xff;
    }
    
    return mulawData;
  }
}

module.exports = ElevenLabsBridge;
