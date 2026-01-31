const express = require('express');
const router = express.Router();
const callController = require('../controllers/call.controller');
const customerController = require('../controllers/customer.controller');
const aiController = require('../controllers/ai.controller');

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Call routes
router.get('/calls/active', callController.getActiveCalls.bind(callController));
router.get('/calls/:callId', callController.getCallDetails.bind(callController));
router.post('/calls/:callId/end', callController.endCall.bind(callController));

// Customer routes
router.get('/customers', customerController.getAllCustomers.bind(customerController));
router.get('/customers/search', customerController.searchCustomers.bind(customerController));
router.get('/customers/phone/:phone', customerController.getCustomerByPhone.bind(customerController));
router.get('/customers/:customerId', customerController.getCustomerById.bind(customerController));
router.post('/customers', customerController.createCustomer.bind(customerController));
router.put('/customers/:customerId', customerController.updateCustomer.bind(customerController));
router.delete('/customers/:customerId', customerController.deleteCustomer.bind(customerController));
router.get('/customers/:customerId/history', customerController.getCustomerHistory.bind(customerController));

// AI routes
router.post('/ai/suggest', aiController.getSuggestions.bind(aiController));
router.post('/ai/sentiment', aiController.analyzeSentiment.bind(aiController));
router.post('/ai/intent', aiController.detectIntent.bind(aiController));
router.post('/ai/transcription', aiController.processTranscription.bind(aiController));
router.get('/ai/summary/:conversationId', aiController.generateSummary.bind(aiController));

// Store routes
const storeController = require('../controllers/store.controller');
router.get('/store', storeController.getStore.bind(storeController));
router.put('/store', storeController.updateStore.bind(storeController));
router.post('/store/products', storeController.addProduct.bind(storeController));
router.delete('/store/products/:productId', storeController.deleteProduct.bind(storeController));

// Dashboard routes
const dashboardController = require('../controllers/dashboard.controller');
router.get('/dashboard/stats', dashboardController.getDashboardStats.bind(dashboardController));

module.exports = router;
