const mongoose = require('mongoose');
const Customer = require('../models/Customer');
require('dotenv').config({ path: '../.env' }); // Adjust path to reach .env in backend root

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contexthub';

async function updateKeyPoints() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const phone = '+918104475493';
    
    // Explicitly set the key points as requested
    const keyPoints = [
      "Mom's birthday on 3 Feb",
      "She likes white colour"
    ];

    const result = await Customer.findOneAndUpdate(
      { phoneNumber: phone },
      {
        $set: {
          "metadata.keyPoints": keyPoints
        }
      },
      { new: true }
    );

    if (result) {
      console.log('✨ Key Points Updated Successfully:', result.metadata.keyPoints);
      console.log('📄 Full Document (Partial):', {
        name: result.name,
        keyPoints: result.metadata.keyPoints,
        preferences: result.preferences
      });
    } else {
      console.log('❌ Customer not found');
    }

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected');
    process.exit(0);
  }
}

updateKeyPoints();
