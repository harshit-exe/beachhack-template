const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: String,
  category: {
    type: String,
    default: 'General'
  },
  price: {
    type: Number,
    min: 0
  },
  inStock: {
    type: Boolean,
    default: true
  },
  tags: [String],
  imageUrl: String
}, { _id: true });

const storeSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    default: 'default-agent',
    index: true
  },
  name: {
    type: String,
    required: true,
    default: 'My Store'
  },
  agenda: {
    type: String,
    maxLength: 1000,
    description: "Daily goals, active promotions, or special focus for agents/AI"
  },
  products: [productSchema],
  
  settings: {
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' }
  }
}, {
  timestamps: true,
  collection: 'stores'
});

// Helper to get text representation of inventory for AI
storeSchema.methods.getInventoryText = function() {
  if (!this.products || this.products.length === 0) return "No products found in inventory.";
  
  return this.products
    .filter(p => p.inStock)
    .map(p => `- ${p.name} (${p.category}): ₹${p.price} | ${p.description || ''}`)
    .join('\n');
};

module.exports = mongoose.model('Store', storeSchema);
