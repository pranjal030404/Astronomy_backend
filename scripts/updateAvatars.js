const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Function to update all user avatars
const updateAvatars = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users with cloudinary demo avatars
    const users = await User.find({
      profilePicture: { $regex: 'cloudinary.com/demo' }
    });

    console.log(`Found ${users.length} users with old avatar URLs`);

    // Update each user's avatar
    for (const user of users) {
      user.profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=8b5cf6&color=fff&size=200`;
      await user.save({ validateBeforeSave: false });
      console.log(`Updated avatar for ${user.username}`);
    }

    console.log('✅ All avatars updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating avatars:', error);
    process.exit(1);
  }
};

updateAvatars();
