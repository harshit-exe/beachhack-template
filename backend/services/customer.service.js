const Customer = require('../models/Customer');

// Mock data for testing - this simulates existing customers
const MOCK_CUSTOMERS = {
  '+919922041218': {
    name: 'Harsh Sharma',
    email: 'harsh@example.com',
    status: 'vip',
    tags: ['premium', 'enterprise-inquiry'],
    metadata: {
      totalCalls: 5,
      lastContactDate: new Date('2026-01-28'),
      firstContactDate: new Date('2025-12-15'),
      lifetimeValue: 15000,
      notes: 'Premium customer, interested in enterprise plan. Previous call about API integration.',
      preferredLanguage: 'English',
      company: 'TechCorp Solutions'
    },
    alerts: [
      { type: 'info', message: 'Interested in upgrading to Enterprise plan', createdAt: new Date() }
    ],
    insights: [
      { category: 'purchase_intent', description: 'High interest in premium features', confidence: 0.9 }
    ]
  },
  '+918104475493': {
    name: 'Rahul Patel',
    email: 'rahul.p@gmail.com',
    status: 'active',
    tags: ['returning'],
    metadata: {
      totalCalls: 2,
      lastContactDate: new Date('2026-01-25'),
      firstContactDate: new Date('2026-01-20'),
      notes: 'Asked about pricing and features'
    }
  }
};

class CustomerService {
  // Find customer by phone number (checks mock data first)
  async findByPhone(phoneNumber) {
    const normalizedPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Check mock data first
    const mockData = MOCK_CUSTOMERS[normalizedPhone];
    if (mockData) {
      // Check if exists in DB, if not create it
      let customer = await Customer.findOne({ 
        phoneNumber: normalizedPhone,
        isDeleted: false 
      });
      
      if (!customer) {
        customer = new Customer({
          phoneNumber: normalizedPhone,
          ...mockData
        });
        await customer.save();
      }
      return customer;
    }
    
    return await Customer.findOne({ 
      phoneNumber: normalizedPhone,
      isDeleted: false 
    });
  }

  // Find customer by ID
  async findById(customerId) {
    return await Customer.findById(customerId);
  }

  // Create new customer
  async createCustomer(data) {
    const customer = new Customer({
      phoneNumber: data.phoneNumber,
      name: data.name || null,
      email: data.email || null,
      status: data.status || 'new',
      tags: data.tags || [],
      metadata: {
        firstContactDate: new Date(),
        lastContactDate: new Date(),
        totalCalls: 0
      }
    });
    return await customer.save();
  }

  // Update customer
  async updateCustomer(customerId, updates) {
    return await Customer.findByIdAndUpdate(
      customerId,
      { $set: updates },
      { new: true, runValidators: true }
    );
  }

  // Increment call count
  async incrementCallCount(customerId) {
    return await Customer.findByIdAndUpdate(
      customerId,
      {
        $inc: { 'metadata.totalCalls': 1 },
        $set: { 'metadata.lastContactDate': new Date() }
      },
      { new: true }
    );
  }

  // Add alert to customer
  async addAlert(customerId, type, message) {
    return await Customer.findByIdAndUpdate(
      customerId,
      {
        $push: {
          alerts: {
            type,
            message,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );
  }

  // Add insight to customer
  async addInsight(customerId, category, description, confidence = 0.8) {
    return await Customer.findByIdAndUpdate(
      customerId,
      {
        $push: {
          insights: {
            category,
            description,
            confidence,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );
  }

  // Update customer status
  async updateStatus(customerId, status) {
    return await Customer.findByIdAndUpdate(
      customerId,
      { $set: { status } },
      { new: true }
    );
  }

  // Get all customers with pagination
  async getAllCustomers(page = 1, limit = 20, filters = {}) {
    const query = { isDeleted: false, ...filters };
    
    const customers = await Customer.find(query)
      .sort({ 'metadata.lastContactDate': -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await Customer.countDocuments(query);
    
    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Search customers
  async searchCustomers(searchTerm) {
    return await Customer.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phoneNumber: { $regex: searchTerm, $options: 'i' } }
      ],
      isDeleted: false
    }).limit(10);
  }

  // Get VIP customers
  async getVIPCustomers() {
    return await Customer.find({
      status: 'vip',
      isDeleted: false
    }).sort({ 'metadata.lifetimeValue': -1 });
  }

  // Soft delete customer
  async deleteCustomer(customerId) {
    return await Customer.findByIdAndUpdate(
      customerId,
      { $set: { isDeleted: true } },
      { new: true }
    );
  }
}

module.exports = new CustomerService();
