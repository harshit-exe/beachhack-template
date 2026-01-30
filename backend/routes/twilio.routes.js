const express = require('express');
const router = express.Router();
const callController = require('../controllers/call.controller');
const twilioService = require('../services/twilio.service');

// Store the ngrok URL when webhook is called
let lastKnownHost = null;

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

// Forward call to ElevenLabs AI Agent
router.post('/forward-to-ai', async (req, res) => {
  try {
    const { callId, callSid, customer } = req.body;
    
    // Get ElevenLabs service
    const elevenlabsService = require('../services/elevenlabs.service');
    
    let twiml;
    if (elevenlabsService.isConfigured()) {
      // Generate TwiML to stream to ElevenLabs AI
      twiml = elevenlabsService.generateStreamToAITwiml(customer);
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

module.exports = router;
