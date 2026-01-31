const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

class GroqService {
  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.client = new Groq({ apiKey });
    } else {
      console.warn('⚠️ Groq API key not configured');
    }
  }

  // Speech-to-Text using Whisper Large V3
  async transcribeAudio(audioBuffer, language = 'en') {
    if (!this.client) throw new Error('Groq not configured');
    
    try {
      const tempFilePath = path.join('/tmp', `audio-${Date.now()}.wav`);
      fs.writeFileSync(tempFilePath, audioBuffer);
      
      const transcription = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-large-v3',
        language: language,
        response_format: 'json',
        temperature: 0.0
      });
      
      fs.unlinkSync(tempFilePath);
      return transcription.text;
    } catch (error) {
      console.error('Groq transcription error:', error);
      throw error;
    }
  }

  // Speech-to-Text with context prompt for better accuracy
  async transcribeAudioWithPrompt(audioBuffer, contextPrompt = '') {
    if (!this.client) throw new Error('Groq not configured');
    
    try {
      const tempFilePath = path.join('/tmp', `audio-${Date.now()}.wav`);
      fs.writeFileSync(tempFilePath, audioBuffer);
      
      const transcription = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-large-v3-turbo',
        language: 'en',
        response_format: 'json',
        temperature: 0.0,
        prompt: contextPrompt ? `Previous context: ${contextPrompt}. Continue transcribing:` : undefined
      });
      
      fs.unlinkSync(tempFilePath);
      return transcription.text;
    } catch (error) {
      console.error('Groq transcription error:', error.message);
      return null;
    }
  }

  // Generate AI suggestions using Llama 3
  async generateSuggestions(context) {
    if (!this.client) throw new Error('Groq not configured');
    
    try {
      const systemPrompt = `You are an AI assistant helping a customer support agent. 
Based on the conversation context, provide 2-3 helpful response suggestions that the agent can use.
Be concise, professional, and empathetic. Always return valid JSON.`;

      const historyText = context.history && context.history.length > 0 
        ? context.history.map(msg => `${msg.speaker}: ${msg.text}`).join('\n')
        : 'No previous messages';

      const userPrompt = `
Conversation History:
${historyText}

Customer Last Message: ${context.lastMessage || 'N/A'}

Customer Info:
- Name: ${context.customer?.name || 'Unknown'}
- Status: ${context.customer?.status || 'new'}
- Total Calls: ${context.customer?.metadata?.totalCalls || 0}
- Key Context: ${context.customer?.metadata?.keyPoints?.join('. ') || 'None'}
- Preferences: ${context.customer?.preferences?.likes?.length ? 'Likes: ' + context.customer.preferences.likes.join(', ') : 'None'}
- Notes: ${context.customer?.metadata?.notes || 'None'}

Store Inventory (Available Products):
${context.inventory || 'No inventory data available.'}

INSTRUCTIONS:
1. Cross-reference Customer Preferences with Store Inventory.
2. If the customer likes a color (e.g., White), recommend specific matching products from the inventory (e.g., "White Lily Arrangement").
3. Be specific with product names and prices if relevant.
4. If no perfect match, suggest the closest alternative.

Provide response suggestions in this exact JSON format:
{
  "suggestions": [
    {
      "text": "Your suggested response here",
      "type": "response",
      "confidence": 0.9
    }
  ],
  "sentiment": "positive/neutral/negative",
  "recommendedActions": ["action1", "action2"]
}`;

      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const responseText = completion.choices[0].message.content;
      return JSON.parse(responseText);
      
    } catch (error) {
      console.error('Groq suggestion error:', error);
      return {
        suggestions: [
          { text: 'How can I help you today?', type: 'response', confidence: 0.5 }
        ],
        sentiment: 'neutral',
        recommendedActions: []
      };
    }
  }

  // Analyze sentiment
  async analyzeSentiment(text) {
    if (!this.client) {
      return { sentiment: 'neutral', score: 0.5, emotion: 'neutral' };
    }
    
    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Analyze the sentiment of customer messages. Return only valid JSON with no additional text.'
          },
          {
            role: 'user',
            content: `Analyze the sentiment of this text and return JSON: {"sentiment": "positive/neutral/negative", "score": 0.0-1.0, "emotion": "happy/frustrated/angry/neutral/confused"}

Text: "${text}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(completion.choices[0].message.content);
      
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return { sentiment: 'neutral', score: 0.5, emotion: 'neutral' };
    }
  }

  // Detect customer intent
  async detectIntent(text) {
    if (!this.client) {
      return { intent: 'general', confidence: 0.5 };
    }
    
    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Classify customer intent. Return only valid JSON.'
          },
          {
            role: 'user',
            content: `Classify the intent of this customer message. Return JSON: {"intent": "inquiry/complaint/request/feedback/billing/technical/general", "confidence": 0.0-1.0, "urgency": "low/medium/high/critical"}

Message: "${text}"`
          }
        ],
        temperature: 0.2,
        max_tokens: 100,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(completion.choices[0].message.content);
      
    } catch (error) {
      console.error('Intent detection error:', error);
      return { intent: 'general', confidence: 0.5, urgency: 'medium' };
    }
  }

  // Generate call summary
  async generateSummary(transcription) {
    if (!this.client) return 'Summary generation unavailable';
    
    try {
      const transcript = transcription
        .map(t => `${t.speaker}: ${t.text}`)
        .join('\n');

      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Summarize customer support conversations concisely. Include: main issue, resolution status, and next steps. Keep under 100 words.'
          },
          {
            role: 'user',
            content: `Summarize this conversation:\n\n${transcript}`
          }
        ],
        temperature: 0.5,
        max_tokens: 200
      });

      return completion.choices[0].message.content;
      
    } catch (error) {
      console.error('Summary generation error:', error);
      throw error;
    }
  }

  // Extract customer details from conversation
  async extractCustomerDetails(transcriptionHistory) {
    if (!this.client || transcriptionHistory.length === 0) {
      return null;
    }
    
    try {
      const conversationText = transcriptionHistory.join('\n');
      
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `Extract customer information from conversation transcripts. 
Return ONLY a valid JSON object. 
- Use null (not string "null") if information is not found.
- Be smart about dates: "fifteen Feb" -> "Feb 15th".
- Infer events from context: "annual seat" likely means "anniversary" in a gift context.
- Extract preferences clearly.`
          },
          {
            role: 'user',
            content: `Extract customer details from this conversation:

${conversationText}

Return JSON in this exact format:
{
  "name": "Full name or null",
  "email": "Email or null",
  "company": "Company or null",
  "purpose": "Purpose or null",
  "scheduledMeeting": "Meeting date/time or null",
  "preferences": "Preferences (likes, colors, events) or null"
}`
          }
        ],
        temperature: 0.1,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      
      // Only return if we found something useful
      if (result.name || result.email || result.company || result.purpose) {
        console.log('📋 Extracted customer details:', result);
        return result;
      }
      
      return null;
      
    } catch (error) {
      console.error('Customer details extraction error:', error.message);
      return null;
    }
  }
}

module.exports = new GroqService();
