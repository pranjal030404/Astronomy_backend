const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Connected');

    // Check if admin already exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@astronomylover.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('\n⚠️  Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Username:', existingAdmin.username);
      console.log('Role:', existingAdmin.role);
      
      // Update to admin if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✓ Updated existing user to admin role');
      }
      
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      username: process.env.ADMIN_USERNAME || 'admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin',
      bio: 'Super Administrator of Astronomy Lover platform',
      location: 'Earth 🌍',
      astronomyInterests: ['Deep Sky', 'Astrophotography', 'Galaxies', 'Nebulae'],
      isVerified: true,
    };

    const admin = await User.create(adminData);

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ', admin.email);
    console.log('👤 Username: ', admin.username);
    console.log('🔑 Password: ', adminData.password);
    console.log('👑 Role:     ', admin.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('   You can do this from the Settings page.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

// Run the seeder
seedAdmin();
