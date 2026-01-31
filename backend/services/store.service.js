const Store = require('../models/Store');

class StoreService {
  /**
   * Get store for a specific owner/agent
   * If none exists, creates a default one
   */
  async getStore(ownerId) {
    let store = await Store.findOne({ ownerId });
    
    // Sample products for seeding
    const sampleProducts = [
      {
        name: 'Red Rose Bouquet',
        category: 'Flowers',
        price: 450,
        description: 'Beautiful arrangement of 12 fresh red roses',
        inStock: true,
        tags: ['romantic', 'anniversary', 'birthday']
      },
      {
        name: 'White Lily Arrangement',
        category: 'Flowers',
        price: 550,
        description: 'Elegant white lilies in a glass vase',
        inStock: true,
        tags: ['sympathy', 'wedding', 'elegant']
      },
      {
        name: 'Mixed Seasonal Bouquet',
        category: 'Flowers',
        price: 350,
        description: 'Colorful mix of seasonal flowers',
        inStock: true,
        tags: ['cheerful', 'gift', 'budget-friendly']
      },
      {
        name: 'Orchid Plant',
        category: 'Plants',
        price: 800,
        description: 'Premium potted orchid that lasts for months',
        inStock: true,
        tags: ['premium', 'long-lasting', 'corporate']
      },
      {
        name: 'Sunflower Bundle',
        category: 'Flowers',
        price: 300,
        description: 'Bright and cheerful sunflower bundle',
        inStock: true,
        tags: ['cheerful', 'summer', 'bright']
      }
    ];
    
    if (!store) {
      // Create default store with sample products
      store = await Store.create({
        ownerId,
        name: 'ContextHub Flower Shop',
        agenda: 'Provide excellent customer service. Upsell premium bouquets. Collect customer preferences.',
        products: sampleProducts
      });
      console.log('🏪 Created default store with sample products');
    } else if (!store.products || store.products.length === 0) {
      // Seed existing empty store with sample products
      store.products = sampleProducts;
      store.name = store.name || 'ContextHub Flower Shop';
      store.agenda = store.agenda || 'Provide excellent customer service.';
      await store.save();
      console.log('🏪 Seeded existing store with sample products');
    }
    
    return store;
  }

  /**
   * Get store by ID
   */
  async getStoreById(storeId) {
    return await Store.findById(storeId);
  }

  /**
   * Add product to store
   */
  async addProduct(ownerId, productData) {
    const store = await this.getStore(ownerId);
    store.products.push(productData);
    await store.save();
    return store;
  }

  /**
   * Update store settings/agenda
   */
  async updateStoreGeneric(ownerId, updates) {
    const store = await this.getStore(ownerId);
    if (updates.name) store.name = updates.name;
    if (updates.agenda) store.agenda = updates.agenda;
    if (updates.settings) store.settings = { ...store.settings, ...updates.settings };
    
    await store.save();
    return store;
  }

  /**
   * Get formatted inventory text for AI prompt
   */
  async getInventoryForAI(ownerId) {
    const store = await this.getStore(ownerId);
    return store.getInventoryText();
  }
}

module.exports = new StoreService();
