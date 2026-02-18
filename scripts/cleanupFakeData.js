const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

let Community, ShopItem, CelestialEvent;
try {
  Community = require('../models/Community');
  ShopItem = require('../models/ShopItem');
  CelestialEvent = require('../models/CelestialEvent');
} catch (err) {
  console.log('Optional models not found, skipping...');
}

const cleanupFakeData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Connected');
    console.log('\n🧹 Starting cleanup of fake/test data...\n');

    // Get admin email from env
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@astronomylover.com';

    // Find all test/demo users (exclude admin)
    const testUsers = await User.find({
      $and: [
        { email: { $ne: adminEmail } },
        {
          $or: [
            { username: /test|demo|fake|sample|example/i },
            { email: /test|demo|fake|sample|example/i },
            { bio: /test|demo|fake/i }
          ]
        }
      ]
    });

    console.log(`📊 Found ${testUsers.length} test/demo users`);

    if (testUsers.length > 0) {
      const testUserIds = testUsers.map(u => u._id);
      
      // Delete posts by test users
      const deletedPosts = await Post.deleteMany({ author: { $in: testUserIds } });
      console.log(`🗑️  Deleted ${deletedPosts.deletedCount} posts by test users`);

      // Delete comments by test users
      const deletedComments = await Comment.deleteMany({ author: { $in: testUserIds } });
      console.log(`🗑️  Deleted ${deletedComments.deletedCount} comments by test users`);

      // Delete test users
      const deletedUsers = await User.deleteMany({ _id: { $in: testUserIds } });
      console.log(`🗑️  Deleted ${deletedUsers.deletedCount} test users`);
    }

    // Clean up orphaned comments (comments with no post)
    const orphanedComments = await Comment.deleteMany({
      post: { $exists: false }
    });
    console.log(`🗑️  Deleted ${orphanedComments.deletedCount} orphaned comments`);

    // Clean up posts with test content
    const testPosts = await Post.find({
      $or: [
        { content: /test|demo|fake|sample|Lorem ipsum/i },
        { tags: { $in: ['test', 'demo', 'fake', 'sample'] } }
      ]
    });

    if (testPosts.length > 0) {
      console.log(`📊 Found ${testPosts.length} test posts`);
      const deletedTestPosts = await Post.deleteMany({
        _id: { $in: testPosts.map(p => p._id) }
      });
      console.log(`🗑️  Deleted ${deletedTestPosts.deletedCount} test posts`);
    }

    // Clean up communities if model exists
    if (Community) {
      const testCommunities = await Community.find({
        $or: [
          { name: /test|demo|fake|sample/i },
          { description: /test|demo|fake/i }
        ]
      });
      if (testCommunities.length > 0) {
        const deletedCommunities = await Community.deleteMany({
          _id: { $in: testCommunities.map(c => c._id) }
        });
        console.log(`🗑️  Deleted ${deletedCommunities.deletedCount} test communities`);
      }
    }

    // Clean up shop items if model exists
    if (ShopItem) {
      const testShopItems = await ShopItem.find({
        $or: [
          { name: /test|demo|fake|sample/i },
          { description: /test|demo|fake/i }
        ]
      });
      if (testShopItems.length > 0) {
        const deletedShopItems = await ShopItem.deleteMany({
          _id: { $in: testShopItems.map(s => s._id) }
        });
        console.log(`🗑️  Deleted ${deletedShopItems.deletedCount} test shop items`);
      }
    }

    // Get final counts
    console.log('\n📊 Database Summary After Cleanup:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();
    const commentCount = await Comment.countDocuments();
    console.log(`👥 Users:    ${userCount}`);
    console.log(`📝 Posts:    ${postCount}`);
    console.log(`💬 Comments: ${commentCount}`);
    
    if (Community) {
      const communityCount = await Community.countDocuments();
      console.log(`🏘️  Communities: ${communityCount}`);
    }
    
    if (ShopItem) {
      const shopItemCount = await ShopItem.countDocuments();
      console.log(`🛒 Shop Items: ${shopItemCount}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Cleanup completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
};

// Run the cleanup
cleanupFakeData();
