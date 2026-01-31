const storeService = require('../services/store.service');

class StoreController {
  
  /**
   * Get store for owner (defaults to generic if no auth for now, or expects ownerId in query)
   */
  async getStore(req, res) {
    try {
      const { ownerId } = req.query;
      // In production, get ownerId from req.user
      const store = await storeService.getStore(ownerId || 'default-agent');
      res.json(store);
    } catch (error) {
      console.error('Error fetching store:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update store details
   */
  async updateStore(req, res) {
    try {
      const { ownerId } = req.query; // Auth middleware would handle this
      const updates = req.body;
      const store = await storeService.updateStoreGeneric(ownerId || 'default-agent', updates);
      res.json(store);
    } catch (error) {
      console.error('Error updating store:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Add product
   */
  async addProduct(req, res) {
    try {
      const { ownerId } = req.query;
      const productData = req.body;
      const store = await storeService.addProduct(ownerId || 'default-agent', productData);
      res.json(store);
    } catch (error) {
      console.error('Error adding product:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete product (simple index based or ID based if I add IDs to products)
   * Products array in Mongoose has _id by default for subdocuments
   */
  async deleteProduct(req, res) {
    try {
      const { ownerId } = req.query;
      const { productId } = req.params;
      
      const store = await storeService.getStore(ownerId || 'default-agent');
      store.products = store.products.filter(p => p._id.toString() !== productId);
      await store.save();
      
      res.json(store);
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new StoreController();
