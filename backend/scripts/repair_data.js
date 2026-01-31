const mongoose = require('mongoose');
const Customer = require('../models/Customer');

const MONGODB_URI = 'mongodb://localhost:27017/contexthub';

async function repairData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const phone = '+918104475493';
    
    // Find and update
    const result = await Customer.findOneAndUpdate(
      { phoneNumber: phone },
      {
        $set: {
          name: "Stella",
          status: "vip",
          "metadata.notes": "Birthday gift for mom. Looking for a white color vehicle.",
          "metadata.lifetimeValue": 25000,
          "metadata.totalSpent": 25000,
          "preferences.likes": ["White", "Red"],
          "preferences.dislikes": [],
          "generatedProfile": {
            type: "VIP Gifter",
            description: "High-value customer planning a birthday surprise. Prefers premium options and specific colors (White/Red)."
          }
        },
        $addToSet: {
          tags: "vip"
        }
      },
      { new: true, upsert: true }
    );

    console.log('✨ Customer Data Repaired:', result);

  } catch (error) {
    console.error('❌ Repair failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected');
    process.exit(0);
  }
}

repairData();
