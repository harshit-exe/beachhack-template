/**
 * ElevenLabs Text-to-Speech Service
 * 
 * Provides high-quality natural voice synthesis for phone calls.
 * Uses WebSocket streaming for real-time audio output.
 */

const axios = require('axios');
const WebSocket = require('ws');

class ElevenLabsTTSService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    // Natural, professional voice options:
    // - Rachel: EXAVITQu4vr4xnSDxMaL (American female, clear)
    // - Drew: 29vD33N1CtxCmqQRPOHJ (American male, professional)
    // - Aria: 9BWtsMINqrJLrRacOk9x (Indian English female)
    // - Sarah: EXAVITQu4vr4xnSDxMaL (American female, friendly)
    this.voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
    this.modelId = 'eleven_turbo_v2'; // Fast, good quality
    
    if (this.apiKey) {
      console.log('✅ ElevenLabs TTS configured with voice:', this.voiceId);
    } else {
      console.log('⚠️ ElevenLabs TTS not configured (needs ELEVENLABS_API_KEY)');
    }
  }

  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Convert text to speech and return audio buffer
   * Returns MP3 audio that can be converted to mulaw for Twilio
   */
  async textToSpeech(text) {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs not configured');
    }

    try {
      const response = await axios({
        method: 'POST',
        url: `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        data: {
          text: text,
          model_id: this.modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        },
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('ElevenLabs TTS error:', error.message);
      throw error;
    }
  }

  /**
   * Stream text to speech via WebSocket for real-time output
   * Returns a WebSocket connection that emits audio chunks
   */
  createStreamingConnection(onAudioChunk, onComplete, onError) {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs not configured');
    }

    const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream-input?model_id=${this.modelId}&output_format=ulaw_8000`;
    
    const ws = new WebSocket(wsUrl, {
      headers: {
        'xi-api-key': this.apiKey
      }
    });

    ws.on('open', () => {
      console.log('🔊 ElevenLabs streaming connection opened');
      
      // Send BOS (beginning of stream) message
      ws.send(JSON.stringify({
        text: ' ',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        },
        xi_api_key: this.apiKey
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.audio) {
          // Audio chunk received (base64 encoded)
          const audioBuffer = Buffer.from(message.audio, 'base64');
          onAudioChunk(audioBuffer);
        }
        
        if (message.isFinal) {
          onComplete?.();
        }
      } catch (e) {
        // Binary audio data
        onAudioChunk(data);
      }
    });

    ws.on('error', (error) => {
      console.error('ElevenLabs stream error:', error.message);
      onError?.(error);
    });

    ws.on('close', () => {
      console.log('🔊 ElevenLabs streaming connection closed');
      onComplete?.();
    });

    return {
      sendText: (text) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ text }));
        }
      },
      flush: () => {
        if (ws.readyState === WebSocket.OPEN) {
          // Send EOS (end of stream) to flush
          ws.send(JSON.stringify({ text: '' }));
        }
      },
      close: () => {
        ws.close();
      }
    };
  }

  /**
   * Convert text to speech with ulaw output for Twilio
   * This format is compatible with Twilio Media Streams
   */
  async textToSpeechUlaw(text) {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs not configured');
    }

    try {
      const response = await axios({
        method: 'POST',
        url: `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}?output_format=ulaw_8000`,
        headers: {
          'Accept': 'audio/basic',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        data: {
          text: text,
          model_id: this.modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        },
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('ElevenLabs TTS (ulaw) error:', error.message);
      throw error;
    }
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getVoices() {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs not configured');
    }

    try {
      const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return response.data.voices.map(v => ({
        id: v.voice_id,
        name: v.name,
        labels: v.labels,
        preview: v.preview_url
      }));
    } catch (error) {
      console.error('Failed to get voices:', error.message);
      return [];
    }
  }
}

module.exports = new ElevenLabsTTSService();
