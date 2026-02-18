const Post = require('../models/Post');
const User = require('../models/User');

// Import Community model if it exists
let Community;
try {
  Community = require('../models/Community');
} catch (err) {
  console.warn('Community model not found in feedService');
}

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
    
    let postsQuery = Post.find(query)
      .select('author content images likes comments tags visibility community createdAt')
      .populate('author', 'username profilePicture')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    // Only populate community if model exists
    if (Community) {
      postsQuery = postsQuery.populate('community', 'name slug');
    }
    
    posts = await postsQuery;

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
