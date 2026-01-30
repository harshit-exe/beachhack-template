const twilioService = require('../services/twilio.service');
const customerService = require('../services/customer.service');
const conversationService = require('../services/conversation.service');
const groqService = require('../services/groq.service');
const elevenlabsService = require('../services/elevenlabs.service');
const Conversation = require('../models/Conversation');

class CallController {
  // Handle incoming call from Twilio webhook
  async handleIncoming(req, res) {
    try {
      const from = req.body.From;
      const callSid = req.body.CallSid;
      const to = req.body.To;
      const host = req.headers.host;
      
      console.log(`📞 Incoming call from ${from}, SID: ${callSid}`);
      
      // Find or create customer
      let customer = await customerService.findByPhone(from);
      const isNewCustomer = !customer;
      
      if (!customer) {
        customer = await customerService.createCustomer({
          phoneNumber: from,
          status: 'new'
        });
        console.log(`👤 New customer created: ${customer._id}`);
      } else {
        // Increment call count for existing customer
        await customerService.incrementCallCount(customer._id);
      }
      
      // Create conversation record
      const conversation = await conversationService.createConversation({
        customerId: customer._id,
        callSid,
        phoneNumber: from,
        direction: 'inbound'
      });
      
      console.log(`💬 Conversation created: ${conversation._id}`);
      
      // Store conference name for later use
      const conferenceName = `call-${conversation._id}`;
      
      // Emit to dashboard via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.emit('call:incoming', {
          callId: conversation._id,
          callSid: callSid,
          conferenceName: conferenceName,
          isNewCustomer: isNewCustomer,
          aiScreening: isNewCustomer && elevenlabsService.isConfigured(),
          customer: {
            _id: customer._id,
            name: customer.name || 'New Customer',
            phoneNumber: customer.phoneNumber,
            status: customer.status,
            email: customer.email,
            metadata: customer.metadata,
            alerts: customer.alerts,
            insights: customer.insights
          }
        });
      }
      
      let twiml;
      
      // Route based on customer status
      if (isNewCustomer && elevenlabsService.isConfigured()) {
        // NEW CUSTOMER: Route to AI for screening first
        console.log('🤖 Routing new customer to AI screening');
        const callbackUrl = `https://${host}/api/twilio/ai-screening-complete?conversationId=${conversation._id}&conference=${conferenceName}`;
        twiml = elevenlabsService.generateNewCustomerScreeningTwiml(customer, callbackUrl);
        
        // Notify dashboard that AI is screening
        if (io) {
          io.emit('call:ai-screening', {
            callId: conversation._id,
            status: 'screening',
            message: 'AI is collecting customer information'
          });
        }
      } else {
        // EXISTING CUSTOMER: Route directly to agent queue
        console.log('👤 Routing existing customer to agent');
        twiml = twilioService.handleIncomingCall(req, host, conversation._id);
      }
      
      res.type('text/xml');
      res.send(twiml);
      
    } catch (error) {
      console.error('❌ Call handling error:', error);
      res.status(500).send('Error processing call');
    }
  }

  // Handle call status updates from Twilio
  async handleStatus(req, res) {
    try {
      const { CallSid, CallStatus, CallDuration } = req.body;
      
      console.log(`📊 Call status update: ${CallSid} - ${CallStatus}`);
      
      if (CallStatus === 'completed' || CallStatus === 'failed' || CallStatus === 'busy' || CallStatus === 'no-answer') {
        const conversation = await conversationService.findByCallSid(CallSid);
        
        if (conversation) {
          // Generate summary if we have transcription
          let summary = null;
          if (conversation.transcription && conversation.transcription.length > 0) {
            try {
              summary = await groqService.generateSummary(conversation.transcription);
            } catch (err) {
              console.error('Summary generation failed:', err);
            }
          }
          
          await conversationService.endConversation(conversation._id, summary);
          
          // Emit call ended to dashboard
          const io = req.app.get('io');
          if (io) {
            io.emit('call:ended', {
              callId: conversation._id,
              callSid: CallSid,
              duration: CallDuration,
              summary
            });
          }
        }
      }
      
      res.sendStatus(200);
      
    } catch (error) {
      console.error('Status handling error:', error);
      res.sendStatus(500);
    }
  }

  // Get call details
  async getCallDetails(req, res) {
    try {
      const { callId } = req.params;
      const conversation = await conversationService.findById(callId);
      
      if (!conversation) {
        return res.status(404).json({ 
          success: false, 
          error: 'Conversation not found' 
        });
      }
      
      res.json({ 
        success: true, 
        data: conversation 
      });
      
    } catch (error) {
      console.error('Get call details error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get active calls
  async getActiveCalls(req, res) {
    try {
      const conversations = await conversationService.getActiveConversations();
      
      res.json({ 
        success: true, 
        data: conversations 
      });
      
    } catch (error) {
      console.error('Get active calls error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // End a call manually
  async endCall(req, res) {
    try {
      const { callId } = req.params;
      const { notes } = req.body;
      
      const conversation = await conversationService.markResolved(callId, notes);
      
      if (!conversation) {
        return res.status(404).json({ 
          success: false, 
          error: 'Conversation not found' 
        });
      }
      
      // Emit to dashboard
      const io = req.app.get('io');
      if (io) {
        io.emit('call:ended', {
          callId: conversation._id
        });
      }
      
      res.json({ 
        success: true, 
        data: conversation 
      });
      
    } catch (error) {
      console.error('End call error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new CallController();
