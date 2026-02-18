const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const setupAdminPermissions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Connected\n');

    // Check if admin exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@astronomylover.com';
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      console.log('⚠️  No admin user found. Creating admin account...\n');
      
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

      admin = await User.create(adminData);
      console.log('✅ Admin user created successfully!\n');
    } else if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save();
      console.log('✅ User role updated to admin!\n');
    } else {
      console.log('✅ Admin user already exists!\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 ADMIN LOGIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:    ${admin.email}`);
    console.log(`👤 Username: ${admin.username}`);
    console.log(`🔑 Password: ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
    console.log(`👑 Role:     ${admin.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✨ ADMIN PERMISSIONS - FULL CONTROL ✨');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Delete ANY post (even if not yours)');
    console.log('✅ Edit ANY post (even if not yours)');
    console.log('✅ Delete ANY comment (even if not yours)');
    console.log('✅ Edit ANY comment (even if not yours)');
    console.log('✅ Delete ANY user account');
    console.log('✅ View ALL users (Admin Page)');
    console.log('✅ Create/Edit/Delete shop items');
    console.log('✅ Full access to ALL content on the platform');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🚀 HOW TO USE ADMIN POWERS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Go to: http://localhost:5173/login');
    console.log(`2. Login with: ${admin.email}`);
    console.log(`3. Password: ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
    console.log('4. Go to: http://localhost:5173/admin (Admin Dashboard)');
    console.log('5. Manage users, posts, and shop items');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⚠️  SECURITY NOTES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('• Change the admin password after first login');
    console.log('• Admin can delete/edit content from any user');
    console.log('• Use admin powers responsibly');
    console.log('• Keep admin credentials secure');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📊 DATABASE STATISTICS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    console.log(`👥 Total Users: ${totalUsers}`);
    console.log(`👑 Admin Users: ${adminUsers}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Run setup
setupAdminPermissions();
