const express = require('express');
const router = express.Router();
const callController = require('../controllers/call.controller');
const twilioService = require('../services/twilio.service');
const elevenlabsService = require('../services/elevenlabs.service');
const customerService = require('../services/customer.service');
const conversationService = require('../services/conversation.service');

// Store the ngrok URL when webhook is called
let lastKnownHost = null;

/**
 * Generate AI suggestions for the dashboard based on customer context
 */
function generateAISuggestions(customer, recentConversations) {
  const suggestions = [];
  
  if (!customer) {
    suggestions.push({
      type: 'info',
      text: 'New customer - collect name and purpose of call'
    });
    return suggestions;
  }
  
  // VIP handling
  if (customer.status === 'vip') {
    suggestions.push({
      type: 'priority',
      text: `VIP Customer - Lifetime value: ₹${customer.metadata?.lifetimeValue || 0}`
    });
  }
  
  // Check for notes/previous context
  if (customer.metadata?.notes) {
    suggestions.push({
      type: 'context',
      text: `Previous notes: ${customer.metadata.notes}`
    });
  }
  
  // Check for scheduled meetings
  if (customer.metadata?.scheduledMeeting) {
    suggestions.push({
      type: 'reminder',
      text: `Scheduled: ${customer.metadata.scheduledMeeting}`
    });
  }
  
  // Check for alerts
  if (customer.alerts && customer.alerts.length > 0) {
    customer.alerts
      .filter(a => !a.acknowledged)
      .forEach(alert => {
        suggestions.push({
          type: 'alert',
          text: `[${alert.type?.toUpperCase()}] ${alert.message}`
        });
      });
  }
  
  // Recent conversation context
  if (recentConversations && recentConversations.length > 0) {
    const lastConvo = recentConversations[0];
    if (lastConvo.summary?.auto || lastConvo.summary?.agent) {
      suggestions.push({
        type: 'history',
        text: `Last call: ${lastConvo.summary?.auto || lastConvo.summary?.agent}`
      });
    }
  }
  
  // Call count context
  if (customer.metadata?.totalCalls > 5) {
    suggestions.push({
      type: 'info',
      text: `Frequent caller (${customer.metadata.totalCalls} calls)`
    });
  }
  
  return suggestions;
}

// Twilio webhooks - these come from ngrok so we can capture the host
router.post('/voice', (req, res, next) => {
  // Capture the ngrok host from incoming Twilio webhook
  lastKnownHost = req.headers.host;
  callController.handleIncoming(req, res, next);
});

router.post('/status', callController.handleStatus.bind(callController));

// Agent connects from browser (Twilio Client SDK)
router.post('/agent-connect', (req, res) => {
  const twiml = twilioService.handleAgentConnect(req);
  res.type('text/xml');
  res.send(twiml);
});

// Agent joins conference via phone
router.post('/agent-join', (req, res) => {
  const conferenceName = req.query.conference || 'customer-support';
  const twiml = twilioService.getAgentJoinTwiml(conferenceName);
  res.type('text/xml');
  res.send(twiml);
});

// Add agent to conference via API call (dial phone)
router.post('/join-call', async (req, res) => {
  try {
    const { callId, conferenceName } = req.body;
    
    // Use the ngrok host captured from Twilio webhook, or fall back to env
    const host = lastKnownHost || process.env.NGROK_URL?.replace('https://', '') || req.headers.host;
    
    if (!host || host.includes('localhost')) {
      return res.status(400).json({ 
        success: false, 
        error: 'No public URL available. Make sure ngrok is running and a call has been received first.' 
      });
    }
    
    const confName = conferenceName || `call-${callId}`;
    await twilioService.addAgentToConference(confName, host);
    
    res.json({ success: true, message: 'Calling agent to join conference' });
  } catch (error) {
    console.error('Join call error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Conference status callback
router.post('/conference-status', (req, res) => {
  console.log('Conference status:', req.body);
  res.sendStatus(200);
});

// Forward call to ElevenLabs AI Agent (agent transfers to AI)
router.post('/forward-to-ai', async (req, res) => {
  try {
    const { callId, callSid, customer } = req.body;
    
    let twiml;
    if (elevenlabsService.isConfigured()) {
      // Generate TwiML to stream to ElevenLabs AI with "transfer" context
      twiml = elevenlabsService.generateStreamToAITwiml(customer, 'transfer');
      console.log('📤 Call forwarded to ElevenLabs AI:', callSid);
    } else {
      // Fallback: Put customer on hold
      twiml = elevenlabsService.generateHoldTwiml();
      console.log('📤 Customer put on hold (ElevenLabs not configured):', callSid);
    }
    
    // Update the call with new TwiML
    await twilioService.client.calls(callSid).update({
      twiml: twiml
    });
    
    // Emit to dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('call:ai-handling', {
        callId: callId,
        status: 'ai-active',
        message: 'AI is now handling this call'
      });
    }
    
    res.json({ 
      success: true, 
      message: elevenlabsService.isConfigured() ? 'Call forwarded to AI agent' : 'Customer put on hold',
      aiEnabled: elevenlabsService.isConfigured()
    });
  } catch (error) {
    console.error('Forward to AI error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI screening complete - route customer to agent
router.post('/ai-screening-complete', async (req, res) => {
  try {
    const { conversationId, conference } = req.query;
    const { SpeechResult, Digits } = req.body; // Data from Twilio gather
    
    const host = lastKnownHost || req.headers.host;
    
    console.log('🤖 AI screening complete for:', conversationId);
    console.log('📝 Collected info:', { SpeechResult, Digits });
    
    // Update customer with collected info if available
    if (SpeechResult) {
      const conversation = await conversationService.findById(conversationId);
      if (conversation && conversation.customerId) {
        // Try to extract name and purpose from speech
        await customerService.updateCustomer(conversation.customerId, {
          'metadata.screeningNotes': SpeechResult,
          'metadata.lastScreeningDate': new Date()
        });
      }
    }
    
    // Emit to dashboard that screening is done
    const io = req.app.get('io');
    if (io) {
      io.emit('call:screening-complete', {
        callId: conversationId,
        collectedInfo: SpeechResult || null,
        message: 'Customer info collected, routing to agent'
      });
    }
    
    // Generate TwiML to connect customer to agent conference
    const twiml = elevenlabsService.generatePostScreeningTwiml(conference, host, {
      name: SpeechResult ? 'valued customer' : 'there'
    });
    
    res.type('text/xml');
    res.send(twiml);
    
  } catch (error) {
    console.error('AI screening complete error:', error);
    // Fallback - just connect to conference
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    twiml.say({ voice: 'Polly.Amy' }, 'Connecting you to an agent now.');
    const dial = twiml.dial();
    dial.conference(req.query.conference || 'support');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Transfer call from AI back to human agent
router.post('/ai-to-agent', async (req, res) => {
  try {
    const { callId, callSid, conferenceName } = req.body;
    
    const host = lastKnownHost || req.headers.host;
    
    if (!host || host.includes('localhost')) {
      return res.status(400).json({ 
        success: false, 
        error: 'No public URL available' 
      });
    }
    
    console.log('🔄 Transferring call from AI to agent:', callSid);
    
    // Generate TwiML to join agent conference
    const confName = conferenceName || `call-${callId}`;
    const twiml = elevenlabsService.generateHandoffToAgentTwiml(confName, host);
    
    // Update the call with new TwiML
    await twilioService.client.calls(callSid).update({
      twiml: twiml
    });
    
    // Emit to dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('call:ai-handoff', {
        callId: callId,
        status: 'pending-agent',
        message: 'AI is transferring call to agent'
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Call transferred from AI to agent conference'
    });
    
  } catch (error) {
    console.error('AI to agent transfer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Take call back from AI (agent reclaims the call)
router.post('/reclaim-from-ai', async (req, res) => {
  try {
    const { callId, callSid, conferenceName } = req.body;
    
    const host = lastKnownHost || req.headers.host;
    
    console.log('🎯 Agent reclaiming call from AI:', callSid);
    
    const confName = conferenceName || `call-${callId}`;
    
    // Generate TwiML to rejoin agent conference
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    twiml.say({ voice: 'Polly.Amy' }, 
      'Your agent is back. Thank you for your patience.'
    );
    
    const dial = twiml.dial();
    dial.conference({
      beep: false,
      waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.guitars',
      startConferenceOnEnter: true,
      endConferenceOnExit: false
    }, confName);
    
    // Update the call
    await twilioService.client.calls(callSid).update({
      twiml: twiml.toString()
    });
    
    // Emit to dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('call:agent-reclaimed', {
        callId: callId,
        status: 'agent-active',
        message: 'Agent has taken back the call'
      });
    }
    
    res.json({ success: true, message: 'Agent reclaimed the call' });
    
  } catch (error) {
    console.error('Reclaim from AI error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================
// AI VOICE CONVERSATION ROUTES - ElevenLabs Conversational Agent
// =============================================

// Store conversation state per call (in production, use Redis)
const aiConversations = new Map();

// Start AI voice conversation using ElevenLabs Conversational Agent
router.post('/ai-voice/start', async (req, res) => {
  try {
    const { callSid, customer, conversationId } = req.body;
    const host = lastKnownHost || req.headers.host;
    
    // Check if ElevenLabs Conversational Agent is configured
    if (!elevenlabsService.isConfigured()) {
      // Fallback to hold music
      const VoiceResponse = require('twilio').twiml.VoiceResponse;
      const twiml = new VoiceResponse();
      twiml.say({ voice: 'Polly.Aditi' }, 'Please hold while we connect you to an agent.');
      twiml.play({ loop: 5 }, 'http://com.twilio.sounds.music.s3.amazonaws.com/MARKOVICHAMP-B8.mp3');
      
      await twilioService.client.calls(callSid).update({ twiml: twiml.toString() });
      return res.json({ success: true, message: 'Customer on hold (ElevenLabs not configured)' });
    }
    
    // Store conversation state
    aiConversations.set(callSid, {
      customer,
      conversationId,
      startTime: new Date()
    });
    
    // Check if call is still active before updating
    try {
      const call = await twilioService.client.calls(callSid).fetch();
      if (call.status !== 'in-progress' && call.status !== 'ringing') {
        console.log('⚠️ Call not active, status:', call.status);
        return res.json({ success: false, error: 'Call has ended', status: call.status });
      }
    } catch (fetchError) {
      console.log('⚠️ Could not fetch call status:', fetchError.message);
      return res.json({ success: false, error: 'Call not found or ended' });
    }
    
    // Generate TwiML to stream call to ElevenLabs Conversational Agent
    // This connects to our ElevenLabs Bridge which handles audio conversion
    
    // IMPORTANT: Store customer context BEFORE forwarding so ElevenLabs webhook can retrieve it
    const elevenlabsRoutes = require('./elevenlabs.routes');
    if (elevenlabsRoutes.setActiveCallContext) {
      elevenlabsRoutes.setActiveCallContext(customer?.phoneNumber, customer);
    }
    
    const twiml = await elevenlabsService.generateStreamToAITwiml(customer, 'support', host);
    
    // Update call with ElevenLabs streaming TwiML
    await twilioService.client.calls(callSid).update({ twiml });
    
    console.log('🤖 ElevenLabs Bridge connecting call:', callSid);
    console.log('📱 Customer:', customer?.name || 'Unknown');
    console.log('🔗 Bridge URL: wss://' + host + '/elevenlabs-stream');
    
    // Emit to dashboard with FULL customer context
    const io = req.app.get('io');
    if (io) {
      // Get recent conversations for this customer
      let recentConversations = [];
      try {
        const Conversation = require('../models/Conversation');
        recentConversations = await Conversation.find({ 
          customer: customer?._id 
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('summary createdAt status')
        .lean();
      } catch (e) {
        console.log('⚠️ Could not fetch conversations:', e.message);
      }

      io.emit('call:ai-voice-active', {
        callId: conversationId,
        callSid,
        status: 'ai-voice-active',
        message: 'ElevenLabs AI Agent is handling this call',
        // Include full customer context for dashboard
        customerContext: {
          name: customer?.name || 'Unknown',
          phone: customer?.phoneNumber,
          status: customer?.status || 'new',
          email: customer?.email || null,
          company: customer?.metadata?.company || null,
          totalCalls: customer?.metadata?.totalCalls || 0,
          notes: customer?.metadata?.notes || null,
          lastContact: customer?.metadata?.lastContactDate || null,
          lifetimeValue: customer?.metadata?.lifetimeValue || 0,
          alerts: customer?.alerts || [],
          tags: customer?.tags || [],
          scheduledMeeting: customer?.metadata?.scheduledMeeting || null
        },
        // Include recent conversation summaries
        recentConversations: recentConversations.map(c => ({
          summary: c.summary?.auto || c.summary?.agent || 'No summary',
          date: c.createdAt,
          status: c.status
        })),
        // AI suggestions based on context
        aiSuggestions: generateAISuggestions(customer, recentConversations)
      });
    }
    
    res.json({ success: true, message: 'ElevenLabs AI Agent started' });
    
  } catch (error) {
    console.error('AI voice start error:', error);
    
    // Handle specific Twilio errors
    if (error.code === 21220) {
      return res.json({ success: false, error: 'Call has ended or is not active' });
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle speech gather callback
router.post('/ai-voice/gather', async (req, res) => {
  try {
    const { callSid } = req.query;
    const { SpeechResult, Confidence } = req.body;
    const host = lastKnownHost || req.headers.host;
    const aiVoiceService = require('../services/aivoice.service');
    
    console.log(`🎤 Customer said: "${SpeechResult}" (confidence: ${Confidence})`);
    
    // Get conversation state
    const convState = aiConversations.get(callSid);
    if (!convState) {
      // No state, redirect to agent
      const VoiceResponse = require('twilio').twiml.VoiceResponse;
      const twiml = new VoiceResponse();
      twiml.say({ voice: 'Polly.Aditi' }, 'Let me connect you with an agent.');
      twiml.dial().conference('support');
      res.type('text/xml');
      return res.send(twiml.toString());
    }
    
    // Add customer message to history
    convState.history.push({
      speaker: 'customer',
      text: SpeechResult,
      timestamp: new Date()
    });
    
    // Generate AI response using Groq with full context
    const aiResponse = await aiVoiceService.generateResponse(
      convState.customer,
      convState.history,
      SpeechResult
    );
    
    // Add AI response to history
    convState.history.push({
      speaker: 'agent',
      text: aiResponse,
      timestamp: new Date()
    });
    
    // Emit transcription to dashboard
    const io = req.app.get('io');
    if (io && convState.conversationId) {
      io.emit('transcription:update', {
        conversationId: convState.conversationId,
        entries: [
          { speaker: 'customer', text: SpeechResult, timestamp: new Date() },
          { speaker: 'agent', text: aiResponse, timestamp: new Date() }
        ]
      });
    }
    
    // Check if AI wants to transfer
    const shouldTransfer = aiResponse.toLowerCase().includes('connect you with') ||
                          aiResponse.toLowerCase().includes('transfer') ||
                          aiResponse.toLowerCase().includes('human agent');
    
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    if (shouldTransfer) {
      // AI decided to transfer to agent
      twiml.say({ voice: 'Polly.Aditi' }, aiResponse);
      twiml.say({ voice: 'Polly.Aditi' }, 'Please hold while I connect you.');
      
      const confName = `call-${convState.conversationId}`;
      twiml.dial().conference({
        beep: true,
        waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.guitars'
      }, confName);
      
      // Cleanup
      aiConversations.delete(callSid);
      
      if (io) {
        io.emit('call:ai-handoff', {
          callId: convState.conversationId,
          status: 'pending-agent',
          message: 'AI transferred call to agent'
        });
      }
    } else {
      // Continue conversation
      const gatherUrl = `https://${host}/api/twilio/ai-voice/gather?callSid=${callSid}`;
      const gather = twiml.gather({
        input: 'speech',
        action: gatherUrl,
        timeout: 8,
        speechTimeout: 'auto',
        language: 'en-IN'
      });
      
      gather.say({ voice: 'Polly.Aditi' }, aiResponse);
      
      // If no input
      twiml.redirect(`https://${host}/api/twilio/ai-voice/no-input?callSid=${callSid}`);
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('AI gather error:', error);
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    twiml.say({ voice: 'Polly.Aditi' }, 'I apologize for the technical difficulty. Let me connect you with an agent.');
    twiml.dial().conference('support');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Handle no input timeout
router.post('/ai-voice/no-input', async (req, res) => {
  const { callSid } = req.query;
  const host = lastKnownHost || req.headers.host;
  
  const convState = aiConversations.get(callSid);
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  
  const gatherUrl = `https://${host}/api/twilio/ai-voice/gather?callSid=${callSid}`;
  const gather = twiml.gather({
    input: 'speech',
    action: gatherUrl,
    timeout: 10,
    speechTimeout: 'auto',
    language: 'en-IN'
  });
  
  gather.say({ voice: 'Polly.Aditi' }, 
    "I'm still here. Take your time, and let me know how I can help you."
  );
  
  // After another timeout, offer to connect to agent
  twiml.say({ voice: 'Polly.Aditi' }, 
    "It seems we're having connection issues. Let me transfer you to an agent."
  );
  
  if (convState) {
    const confName = `call-${convState.conversationId}`;
    twiml.dial().conference(confName);
    aiConversations.delete(callSid);
  } else {
    twiml.dial().conference('support');
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

module.exports = router;
