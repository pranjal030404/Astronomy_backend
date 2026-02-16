// Script to set a user as admin
// Run this in your MongoDB shell or use this with your database connection

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

const setUserAsAdmin = async (emailOrUsername) => {
  try {
    await connectDB();

    const User = require('../models/User');

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    // Update user role to admin
    user.role = 'admin';
    await user.save();

    console.log('✅ User successfully set as admin!');
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Role:', user.role);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

// Get email/username from command line arguments
const identifier = process.argv[2];

if (!identifier) {
  console.log('Usage: node setAdmin.js <email_or_username>');
  console.log('Example: node setAdmin.js admin@example.com');
  console.log('Example: node setAdmin.js johndoe');
  process.exit(1);
}

setUserAsAdmin(identifier);
