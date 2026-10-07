require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const User = require('../src/models/User');

// Admin email
const ADMIN_EMAIL = 'rajadityaraj005@gmail.com';

// Firebase UID passed from command line
const firebaseUID = process.argv[2];

if (!firebaseUID) {
  console.error('');
  console.error('❌ Firebase UID is required.');
  console.error('');
  console.error('Usage:');
  console.error('node scripts/ensureAdmin.js YOUR_FIREBASE_ADMIN_UID');
  console.error('');
  process.exit(1);
}

(async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGO_URI);

    console.log('✅ MongoDB connected successfully');
    console.log(`📧 Admin email: ${ADMIN_EMAIL}`);
    console.log(`🔥 Firebase UID: ${firebaseUID}`);

    const user = await User.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        name: 'FoodBridge Admin',
        email: ADMIN_EMAIL,
        firebaseUID: firebaseUID,
        role: 'admin',
        isVerified: true,
        verificationStatus: 'verified',
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log('');
    console.log('========================================');
    console.log('✅ ADMIN SETUP SUCCESSFUL');
    console.log('========================================');
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`🔑 Role: ${user.role}`);
    console.log(`🔥 Firebase UID: ${user.firebaseUID}`);
    console.log(`✔️ Verified: ${user.isVerified}`);
    console.log(`✔️ Status: ${user.verificationStatus}`);
    console.log('========================================');
    console.log('');

    await mongoose.disconnect();

    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('');
    console.error('❌ Admin setup failed:', error.message);
    console.error('');

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    process.exit(1);
  }
})();