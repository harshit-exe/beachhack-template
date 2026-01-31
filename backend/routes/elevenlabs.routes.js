/**
 * ElevenLabs Conversational Agent Webhook Endpoints
 * 
 * These endpoints are called by the ElevenLabs Conversational AI agent
 * to fetch customer context, update data, and trigger actions.
 * 
 * Configure these as "Tools" in your ElevenLabs agent dashboard.
 */

const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Conversation = require('../models/Conversation');

// Store active call context (for ElevenLabs to retrieve without phone param)
const activeCallContext = new Map();

// Helper to set active call context (called before forwarding to ElevenLabs)
router.setActiveCallContext = (phoneNumber, customerData) => {
  console.log('📋 Setting active call context for:', phoneNumber);
  activeCallContext.set('latest', {
    phone: phoneNumber,
    customer: customerData,
    timestamp: Date.now()
  });
  // Also store by phone for backup lookup
  activeCallContext.set(phoneNumber, {
    phone: phoneNumber,
    customer: customerData,
    timestamp: Date.now()
  });
};

/**
 * GET /api/elevenlabs/current-caller
 * 
 * Returns context for the CURRENT active caller
 * No parameters needed - uses the most recently forwarded call
 * 
 * ElevenLabs Tool Configuration:
 * - Name: get_current_caller
 * - Description: Get the current caller's information. Call this FIRST at conversation start.
 * - Method: GET
 * - No parameters needed
 */
router.get('/current-caller', async (req, res) => {
  try {
    // Get the most recently forwarded call context
    const latestContext = activeCallContext.get('latest');
    
    if (!latestContext || Date.now() - latestContext.timestamp > 60000) {
      // Context older than 60 seconds or not found
      return res.json({
        success: false,
        is_new_customer: true,
        message: "No active caller context found",
        greeting_suggestion: "Hello! I'm your AI assistant. How can I help you today?"
      });
    }

    const customer = latestContext.customer;
    
    if (!customer) {
      return res.json({
        success: true,
        is_new_customer: true,
        phone: latestContext.phone,
        greeting_suggestion: "Hello! Welcome to ContextHub. May I know your name?",
        context: "New customer - be welcoming and collect their name."
      });
    }

    // Fetch recent conversations for history context
    let conversationHistory = [];
    try {
      const recentConvos = await Conversation.find({ customer: customer._id })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('summary createdAt')
        .lean();
      
      conversationHistory = recentConvos.map(c => c.summary?.auto || c.summary?.agent).filter(Boolean);
    } catch (e) {
      console.log('⚠️ Could not fetch conversation history');
    }

    console.log(`📱 ElevenLabs: Current caller context - ${customer.name} (${latestContext.phone})`);
    
    // Build comprehensive context for AI
    const contextParts = [];
    contextParts.push(`Customer: ${customer.name || 'Unknown'}`);
    contextParts.push(`Status: ${customer.status || 'new'}`);
    contextParts.push(`Total calls: ${customer.metadata?.totalCalls || 0}`);
    
    if (customer.metadata?.notes) {
      contextParts.push(`Previous notes: ${customer.metadata.notes}`);
    }
    
    if (customer.metadata?.scheduledMeeting) {
      contextParts.push(`Scheduled meeting: ${customer.metadata.scheduledMeeting}`);
    }
    
    if (conversationHistory.length > 0) {
      contextParts.push(`Recent call summaries: ${conversationHistory.join(' | ')}`);
    }
    
    if (customer.status === 'vip') {
      contextParts.push(`VIP customer with lifetime value ₹${customer.metadata?.lifetimeValue || 0}`);
    }

    res.json({
      success: true,
      is_new_customer: false,
      customer: {
        name: customer.name || 'Unknown',
        phone: customer.phoneNumber || latestContext.phone,
        email: customer.email || null,
        status: customer.status || 'active',
        total_calls: customer.metadata?.totalCalls || 0,
        notes: customer.metadata?.notes || null,
        scheduled_meeting: customer.metadata?.scheduledMeeting || null,
        last_contact: customer.metadata?.lastContactDate || null,
        lifetime_value: customer.metadata?.lifetimeValue || 0
      },
      conversation_history: conversationHistory,
      greeting_suggestion: customer.name 
        ? `Hi ${customer.name}! Great to hear from you again. How can I help you today?`
        : "Hello! How can I assist you today?",
      context: contextParts.join('. ')
    });

  } catch (error) {
    console.error('Current caller context error:', error);
    res.json({
      success: false,
      error: error.message,
      greeting_suggestion: "Hello! How can I help you today?"
    });
  }
});

/**
 * GET /api/elevenlabs/customer-context
 * 
 * ElevenLabs Tool Configuration:
 * - Name: get_customer_context
 * - Description: Get customer information including name, status, history, notes, and alerts. 
 *   Call this at the start of conversation to personalize responses.
 * - Method: GET
 * - URL: https://your-ngrok-url/api/elevenlabs/customer-context
 * - Query params: phone (required) - Customer's phone number
 */
router.get('/customer-context', async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.json({
        success: false,
        message: "No phone number provided",
        customer: null,
        is_new_customer: true,
        greeting_suggestion: "Hello! Welcome to ContextHub. I'm your AI assistant. May I know your name?"
      });
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    
    // Find customer
    const customer = await Customer.findOne({
      phoneNumber: { $regex: cleanPhone }
    });

    if (!customer) {
      return res.json({
        success: true,
        is_new_customer: true,
        phone: phone,
        customer: null,
        greeting_suggestion: "Hello! Welcome to ContextHub. I'm your AI assistant. May I know your name so I can help you better?",
        context: "This is a new customer. Be warm and welcoming. Ask for their name and how you can help."
      });
    }

    // Format customer context for AI
    const context = {
      success: true,
      is_new_customer: false,
      customer: {
        id: customer._id,
        name: customer.name || 'Unknown',
        phone: customer.phoneNumber,
        email: customer.email || null,
        status: customer.status || 'active',
        company: customer.metadata?.company || null,
        lifetime_value: customer.metadata?.lifetimeValue || 0,
        total_calls: customer.metadata?.totalCalls || 0,
        average_rating: customer.metadata?.averageRating || 0,
        notes: customer.metadata?.notes || null,
        alerts: customer.metadata?.alerts || [],
        scheduled_meeting: customer.metadata?.scheduledMeeting || null,
        tags: customer.tags || [],
        last_contact: customer.metadata?.lastContactDate || null
      },
      greeting_suggestion: customer.name 
        ? `Hi ${customer.name}! Great to hear from you again. How can I help you today?`
        : "Hello! How can I assist you today?",
      context: buildContextString(customer)
    };

    console.log(`📱 ElevenLabs: Customer context requested for ${phone} - Found: ${customer.name}`);
    res.json(context);

  } catch (error) {
    console.error('Customer context error:', error);
    res.json({
      success: false,
      error: error.message,
      is_new_customer: true,
      greeting_suggestion: "Hello! How can I help you today?"
    });
  }
});

/**
 * POST /api/elevenlabs/update-customer
 * 
 * ElevenLabs Tool Configuration:
 * - Name: update_customer_info
 * - Description: Update customer information when they provide new details like name, email, company, or notes during conversation.
 * - Method: POST
 * - URL: https://your-ngrok-url/api/elevenlabs/update-customer
 * - Body: { phone, name?, email?, company?, notes? }
 */
router.post('/update-customer', async (req, res) => {
  try {
    const { phone, name, email, company, notes } = req.body;
    
    if (!phone) {
      return res.json({ success: false, message: "Phone number required" });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    
    // Find or create customer
    let customer = await Customer.findOne({
      phoneNumber: { $regex: cleanPhone }
    });

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (company) updates['metadata.company'] = company;
    if (notes) updates['metadata.notes'] = notes;

    if (customer) {
      customer = await Customer.findByIdAndUpdate(
        customer._id,
        { $set: updates },
        { new: true }
      );
      console.log(`📝 ElevenLabs: Updated customer ${customer.name}`);
    } else {
      customer = await Customer.create({
        phoneNumber: phone,
        name: name || 'Unknown',
        email: email,
        status: 'new',
        metadata: {
          company: company,
          notes: notes,
          firstContactDate: new Date()
        }
      });
      console.log(`📝 ElevenLabs: Created new customer ${customer.name}`);
    }

    res.json({
      success: true,
      message: `Customer ${name || 'info'} updated successfully`,
      customer_id: customer._id
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.json({ success: false, error: error.message });
  }
});

/**
 * POST /api/elevenlabs/transfer-to-agent
 * 
 * ElevenLabs Tool Configuration:
 * - Name: transfer_to_human_agent
 * - Description: Transfer the call to a human agent. Use when customer explicitly requests human help, 
 *   has a complex issue, or when you cannot resolve their request.
 * - Method: POST
 * - URL: https://your-ngrok-url/api/elevenlabs/transfer-to-agent
 * - Body: { phone, reason, priority? }
 */
router.post('/transfer-to-agent', async (req, res) => {
  try {
    const { phone, reason, priority, call_sid } = req.body;
    
    console.log(`🔀 ElevenLabs: Transfer requested - Phone: ${phone}, Reason: ${reason}`);
    
    // Emit socket event for frontend to show transfer request
    const io = req.app.get('io');
    if (io) {
      io.emit('ai:transfer-requested', {
        phone,
        callSid: call_sid,
        reason: reason || 'Customer requested human agent',
        priority: priority || 'normal',
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: "Transfer request sent to available agents. Please let the customer know an agent will be with them shortly.",
      action: "transfer_initiated"
    });

  } catch (error) {
    console.error('Transfer error:', error);
    res.json({ success: false, error: error.message });
  }
});

/**
 * POST /api/elevenlabs/schedule-callback
 * 
 * ElevenLabs Tool Configuration:
 * - Name: schedule_callback
 * - Description: Schedule a callback for the customer at a specific time. Use when customer wants to be called back later.
 * - Method: POST
 * - URL: https://your-ngrok-url/api/elevenlabs/schedule-callback
 * - Body: { phone, datetime, notes? }
 */
router.post('/schedule-callback', async (req, res) => {
  try {
    const { phone, datetime, notes } = req.body;
    
    if (!phone || !datetime) {
      return res.json({ success: false, message: "Phone and datetime required" });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    
    const customer = await Customer.findOneAndUpdate(
      { phoneNumber: { $regex: cleanPhone } },
      { 
        $set: { 
          'metadata.scheduledMeeting': datetime,
          'metadata.callbackNotes': notes || 'Callback scheduled by AI'
        }
      },
      { new: true }
    );

    console.log(`📅 ElevenLabs: Callback scheduled for ${phone} at ${datetime}`);

    res.json({
      success: true,
      message: `Callback scheduled for ${datetime}`,
      customer_name: customer?.name
    });

  } catch (error) {
    console.error('Schedule callback error:', error);
    res.json({ success: false, error: error.message });
  }
});

/**
 * POST /api/elevenlabs/create-ticket
 * 
 * ElevenLabs Tool Configuration:
 * - Name: create_support_ticket
 * - Description: Create a support ticket for issues that need follow-up. Use for technical issues, complaints, or complex requests.
 * - Method: POST
 * - URL: https://your-ngrok-url/api/elevenlabs/create-ticket
 * - Body: { phone, issue, priority?, category? }
 */
router.post('/create-ticket', async (req, res) => {
  try {
    const { phone, issue, priority, category } = req.body;
    
    const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;
    
    console.log(`🎫 ElevenLabs: Ticket created - ${ticketId}: ${issue}`);

    // Emit to frontend
    const io = req.app.get('io');
    if (io) {
      io.emit('ticket:created', {
        ticketId,
        phone,
        issue,
        priority: priority || 'medium',
        category: category || 'general',
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: `Support ticket ${ticketId} created successfully`,
      ticket_id: ticketId
    });

  } catch (error) {
    console.error('Create ticket error:', error);
    res.json({ success: false, error: error.message });
  }
});

/**
 * POST /api/elevenlabs/end-conversation
 * 
 * ElevenLabs Tool Configuration:
 * - Name: end_conversation
 * - Description: Mark the conversation as complete and save a summary. Call when conversation is ending.
 * - Method: POST
 * - URL: https://your-ngrok-url/api/elevenlabs/end-conversation
 * - Body: { phone, summary, outcome?, rating? }
 */
router.post('/end-conversation', async (req, res) => {
  try {
    const { phone, summary, outcome, rating } = req.body;
    
    console.log(`📞 ElevenLabs: Conversation ended - ${phone}: ${summary}`);

    // Update customer's last contact
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    await Customer.findOneAndUpdate(
      { phoneNumber: { $regex: cleanPhone } },
      { 
        $set: { 
          'metadata.lastContactDate': new Date(),
          'metadata.lastCallSummary': summary
        },
        $inc: { 'metadata.totalCalls': 1 },
        $push: {
          conversationSummaries: {
            date: new Date(),
            summary: summary,
            sentiment: outcome === 'positive' ? 'positive' : 'neutral', // Simple inference
            keyTopics: [] // Could be extracted
          }
        }
      }
    );

    res.json({
      success: true,
      message: "Conversation logged successfully"
    });

  } catch (error) {
    console.error('End conversation error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Helper function to build context string for AI
function buildContextString(customer) {
  const parts = [];
  
  if (customer.status === 'vip') {
    parts.push(`This is a VIP customer with lifetime value ₹${customer.metadata?.lifetimeValue || 0}. Provide premium service.`);
  }
  
  if (customer.metadata?.alerts?.length) {
    parts.push(`ALERTS: ${customer.metadata.alerts.join(', ')}`);
  }
  
  if (customer.metadata?.notes) {
    parts.push(`Previous notes: ${customer.metadata.notes}`);
  }
  
  if (customer.metadata?.scheduledMeeting) {
    parts.push(`Has scheduled meeting: ${customer.metadata.scheduledMeeting}`);
  }
  
  if (customer.status === 'churned') {
    parts.push(`This customer previously churned. Be extra attentive and try to understand their concerns.`);
  }
  
  return parts.join(' ') || 'Standard customer, no special context.';
}

/**
 * GET /api/elevenlabs/store-inventory
 * 
 * ElevenLabs Tool Configuration:
 * - Name: get_store_inventory
 * - Description: Get the list of available products, prices, and store agenda. Use this when customer asks what you have in stock or about specific products.
 * - Method: GET
 * - URL: https://your-ngrok-url/api/elevenlabs/store-inventory
 * - No parameters required
 */
router.get('/store-inventory', async (req, res) => {
  try {
    const StoreService = require('../services/store.service');
    // Assuming single store for now or could take owner_id
    const store = await StoreService.getStore(null);
    
    // Format for AI consumption
    const inventoryText = store.getInventoryText();
    const agenda = store.agenda || "No specific agenda today.";
    
    const context = {
      success: true,
      store_name: store.name,
      agenda: agenda,
      inventory_summary: inventoryText,
      products: store.products.filter(p => p.inStock).map(p => ({
        name: p.name,
        price: p.price,
        category: p.category,
        description: p.description
      }))
    };
    
    console.log(`🏪 ElevenLabs: Store inventory requested.`);
    res.json(context);
    
  } catch (error) {
    console.error('Store inventory error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Also allow POST for tool compatibility
router.post('/store-inventory', async (req, res) => {
  // Same logic as GET
  try {
    const StoreService = require('../services/store.service');
    const store = await StoreService.getStore(null);
    
    const inventoryText = store.getInventoryText();
    const agenda = store.agenda || "No specific agenda today.";
    
    const context = {
      success: true,
      store_name: store.name,
      agenda: agenda,
      inventory_summary: inventoryText,
      products: store.products.filter(p => p.inStock).map(p => ({
        name: p.name,
        price: p.price,
        category: p.category,
        description: p.description
      }))
    };
    
    console.log(`🏪 ElevenLabs: Store inventory requested (POST).`);
    res.json(context);
  } catch (error) {
    console.error('Store inventory error:', error);
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
