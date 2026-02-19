/**
 * fixImagePaths.js
 * One-time migration: updates existing posts/users whose image URLs
 * are stored as /uploads/filename instead of /uploads/posts/filename
 * (or /uploads/profiles/filename for avatars).
 *
 * Usage: node scripts/fixImagePaths.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

const FLAT_URL = /^\/uploads\/([^/]+)$/; // matches /uploads/foo.jpg (no subfolder)

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ MongoDB Connected\n');

  // ── Fix post image URLs ──────────────────────────────────────
  const posts = await Post.find({ 'images.0': { $exists: true } });
  let postFixed = 0;

  for (const post of posts) {
    let changed = false;
    post.images = post.images.map(img => {
      if (FLAT_URL.test(img.url)) {
        const filename = img.url.replace('/uploads/', '');
        img.url = `/uploads/posts/${filename}`;
        changed = true;
      }
      return img;
    });
    if (changed) {
      await post.save();
      postFixed++;
      console.log(`📝 Fixed post ${post._id}`);
    }
  }
  console.log(`✅ Posts fixed: ${postFixed}`);

  // ── Fix user profile picture URLs ────────────────────────────
  const users = await User.find({ profilePicture: FLAT_URL });
  let userFixed = 0;

  for (const user of users) {
    if (FLAT_URL.test(user.profilePicture)) {
      const filename = user.profilePicture.replace('/uploads/', '');
      user.profilePicture = `/uploads/profiles/${filename}`;
      await user.save();
      userFixed++;
      console.log(`👤 Fixed user ${user.username}`);
    }
  }
  console.log(`✅ Users fixed: ${userFixed}`);

  await mongoose.disconnect();
  console.log('\n✅ Migration complete.');
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
