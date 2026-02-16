const Post = require('../models/Post');
const User = require('../models/User');

// Generate personalized feed for a user
exports.generateFeed = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    // Validate userId
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get user's following list
    const user = await User.findById(userId).select('following');
    
    if (!user) {
      throw new Error('User not found');
    }

    // If user is not following anyone, show all public posts
    const followingIds = user.following || [];

    // Build query - show posts from followed users OR public posts
    let query = {};
    
    if (followingIds.length > 0) {
      query = {
        $or: [
          { author: { $in: followingIds } },
          { visibility: 'public' },
        ],
      };
    } else {
      // If not following anyone, just show public posts
      query = { visibility: 'public' };
    }

    // Get posts with try-catch for populate
    let posts = [];
    try {
      posts = await Post.find(query)
        .populate({
          path: 'author',
          select: 'username profilePicture',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'community',
          select: 'name slug',
          options: { strictPopulate: false }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    } catch (populateError) {
      console.error('Populate error, trying without community:', populateError.message);
      // Try without community populate if it fails
      posts = await Post.find(query)
        .populate({
          path: 'author',
          select: 'username profilePicture'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    }

    // Count total for pagination
    const total = await Post.countDocuments(query);

    return {
      posts: posts || [],
      total: total || 0,
      page: parseInt(page),
      pages: total > 0 ? Math.ceil(total / limit) : 0,
    };
  } catch (error) {
    console.error('Feed Service Error:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};
