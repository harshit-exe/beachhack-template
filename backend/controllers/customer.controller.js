const customerService = require('../services/customer.service');
const conversationService = require('../services/conversation.service');

class CustomerController {
  // Get all customers
  async getAllCustomers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status;
      
      const filters = {};
      if (status) filters.status = status;
      
      const result = await customerService.getAllCustomers(page, limit, filters);
      
      res.json({
        success: true,
        data: result.customers,
        pagination: result.pagination
      });
      
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get customer by ID
  async getCustomerById(req, res) {
    try {
      const { customerId } = req.params;
      const customer = await customerService.findById(customerId);
      
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
      
      res.json({
        success: true,
        data: customer
      });
      
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get customer by phone
  async getCustomerByPhone(req, res) {
    try {
      const { phone } = req.params;
      const customer = await customerService.findByPhone(phone);
      
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
      
      res.json({
        success: true,
        data: customer
      });
      
    } catch (error) {
      console.error('Get customer by phone error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create new customer
  async createCustomer(req, res) {
    try {
      const customer = await customerService.createCustomer(req.body);
      
      res.status(201).json({
        success: true,
        data: customer
      });
      
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update customer
  async updateCustomer(req, res) {
    try {
      const { customerId } = req.params;
      const customer = await customerService.updateCustomer(customerId, req.body);
      
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
      
      // Emit update to dashboard
      const io = req.app.get('io');
      if (io) {
        io.emit('customer:updated', {
          customerId: customer._id,
          customer
        });
      }
      
      res.json({
        success: true,
        data: customer
      });
      
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Search customers
  async searchCustomers(req, res) {
    try {
      const { q } = req.query;
      
      if (!q || q.length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }
      
      const customers = await customerService.searchCustomers(q);
      
      res.json({
        success: true,
        data: customers
      });
      
    } catch (error) {
      console.error('Search customers error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get customer conversation history
  async getCustomerHistory(req, res) {
    try {
      const { customerId } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      
      const history = await conversationService.getCustomerHistory(customerId, limit);
      
      res.json({
        success: true,
        data: history
      });
      
    } catch (error) {
      console.error('Get customer history error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete customer (soft delete)
  async deleteCustomer(req, res) {
    try {
      const { customerId } = req.params;
      const customer = await customerService.deleteCustomer(customerId);
      
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
      
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new CustomerController();
