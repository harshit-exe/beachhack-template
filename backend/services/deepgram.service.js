const { createClient, LiveTranscriptionEvents } = require('@deepgram/sdk');

class DeepgramService {
  constructor() {
    this.apiKey = process.env.DEEPGRAM_API_KEY;
    this.client = null;
    
    if (this.apiKey && this.apiKey.length > 10) {
      try {
        this.client = createClient(this.apiKey);
        console.log('✅ Deepgram initialized');
      } catch (error) {
        console.warn('⚠️ Deepgram initialization failed:', error.message);
      }
    } else {
      console.warn('⚠️ Deepgram API key not configured');
    }
  }

  // Create a live transcription connection for real-time audio
  async createLiveConnection(onTranscript, onError) {
    if (!this.client) {
      throw new Error('Deepgram not configured');
    }

    try {
      const connection = this.client.listen.live({
        model: 'nova-2',  // Use standard nova-2 model
        language: 'en-IN',
        smart_format: true,
        punctuate: true,
        interim_results: false,
        keywords: ['Rahul', 'Sharma', 'Anniversary', 'Bouquet', 'Wife', 'Birthday', 'Gift'],
        endpointing: 300,  // 300ms silence = end of speech
        encoding: 'mulaw',
        sample_rate: 8000,
        channels: 1
      });

      // Wait for connection to be ready
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Deepgram connection timeout'));
        }, 5000);

        connection.on(LiveTranscriptionEvents.Open, () => {
          clearTimeout(timeout);
          console.log('🎙️ Deepgram live connection opened');
          resolve(connection);
        });

        connection.on(LiveTranscriptionEvents.Transcript, (data) => {
          const transcript = data.channel?.alternatives?.[0]?.transcript;
          if (transcript && transcript.trim()) {
            onTranscript(transcript, data.is_final);
          }
        });

        connection.on(LiveTranscriptionEvents.Error, (error) => {
          clearTimeout(timeout);
          console.error('Deepgram stream error:', error.message || error);
          if (onError) onError(error);
        });

        connection.on(LiveTranscriptionEvents.Close, () => {
          console.log('🎙️ Deepgram live connection closed');
        });
      });
    } catch (error) {
      console.error('Deepgram connection error:', error.message);
      throw error;
    }
  }

  // Send audio data to the live connection
  sendAudio(connection, audioBuffer) {
    try {
      if (connection && connection.getReadyState() === 1) {
        connection.send(audioBuffer);
      }
    } catch (error) {
      // Silently ignore send errors
    }
  }

  // Close a live connection
  closeConnection(connection) {
    try {
      if (connection) {
        connection.finish();
      }
    } catch (error) {
      // Silently ignore close errors
    }
  }
}

module.exports = new DeepgramService();
