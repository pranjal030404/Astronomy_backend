/**
 * clearSeededData.js
 * Removes ALL data injected by the seeder:
 *   - Fake users (emails ending in @example.com)
 *   - All posts and comments by those users
 *   - All communities  (every community was seeded)
 *   - All shop items   (every shop item was seeded)
 *   - All celestial events (every event was seeded)
 *
 * Preserves: admin account, any real registered users, and their content.
 *
 * Usage:
 *   node scripts/clearSeededData.js           -- dry run (shows counts only)
 *   node scripts/clearSeededData.js --confirm -- actually deletes
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Community = require('../models/Community');
const ShopItem = require('../models/ShopItem');
const CelestialEvent = require('../models/CelestialEvent');

const DRY_RUN = !process.argv.includes('--confirm');

const line = '━'.repeat(50);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ MongoDB Connected');
  console.log(DRY_RUN ? '\n🔍 DRY RUN — no data will be deleted\n' : '\n🗑  DELETING seeded data...\n');

  // ── 1. Seeded fake users (all use @example.com) ──────────────
  const fakeUsers = await User.find({ email: /@example\.com$/i }).select('_id username email');
  const fakeUserIds = fakeUsers.map(u => u._id);
  console.log(`👤 Fake users found: ${fakeUsers.length}`);
  fakeUsers.forEach(u => console.log(`   • ${u.username} <${u.email}>`));

  // ── 2. Posts by fake users ────────────────────────────────────
  const postsCount = await Post.countDocuments({ author: { $in: fakeUserIds } });
  console.log(`\n📝 Posts by fake users: ${postsCount}`);

  // ── 3. Comments by fake users ────────────────────────────────
  const commentsCount = await Comment.countDocuments({ author: { $in: fakeUserIds } });
  console.log(`💬 Comments by fake users: ${commentsCount}`);

  // ── 4. All communities ────────────────────────────────────────
  const communitiesCount = await Community.countDocuments();
  console.log(`\n🏘  Communities (all seeded): ${communitiesCount}`);

  // ── 5. All shop items ─────────────────────────────────────────
  const shopCount = await ShopItem.countDocuments();
  console.log(`🛒 Shop items (all seeded): ${shopCount}`);

  // ── 6. All celestial events ───────────────────────────────────
  const eventsCount = await CelestialEvent.countDocuments();
  console.log(`🌠 Celestial events (all seeded): ${eventsCount}`);

  if (DRY_RUN) {
    console.log(`\n${line}`);
    console.log('ℹ  Re-run with --confirm to actually delete:\n');
    console.log('   node scripts/clearSeededData.js --confirm\n');
    await mongoose.disconnect();
    process.exit(0);
  }

  // ── Perform deletions ─────────────────────────────────────────
  const deletedComments = await Comment.deleteMany({ author: { $in: fakeUserIds } });
  console.log(`\n✅ Deleted ${deletedComments.deletedCount} comments`);

  const deletedPosts = await Post.deleteMany({ author: { $in: fakeUserIds } });
  console.log(`✅ Deleted ${deletedPosts.deletedCount} posts`);

  const deletedUsers = await User.deleteMany({ email: /@example\.com$/i });
  console.log(`✅ Deleted ${deletedUsers.deletedCount} fake users`);

  const deletedCommunities = await Community.deleteMany({});
  console.log(`✅ Deleted ${deletedCommunities.deletedCount} communities`);

  const deletedShop = await ShopItem.deleteMany({});
  console.log(`✅ Deleted ${deletedShop.deletedCount} shop items`);

  const deletedEvents = await CelestialEvent.deleteMany({});
  console.log(`✅ Deleted ${deletedEvents.deletedCount} celestial events`);

  // ── Summary ───────────────────────────────────────────────────
  console.log(`\n${line}`);
  console.log('📊 Remaining data:');
  console.log(`   👥 Users:            ${await User.countDocuments()}`);
  console.log(`   📝 Posts:            ${await Post.countDocuments()}`);
  console.log(`   💬 Comments:         ${await Comment.countDocuments()}`);
  console.log(`   🏘  Communities:     ${await Community.countDocuments()}`);
  console.log(`   🛒 Shop items:       ${await ShopItem.countDocuments()}`);
  console.log(`   🌠 Celestial events: ${await CelestialEvent.countDocuments()}`);
  console.log(`${line}\n`);
  console.log('✅ All seeded data removed.\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
