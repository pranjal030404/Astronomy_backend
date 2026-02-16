const { generateFeed } = require('../services/feedService');

// @desc    Get personalized feed
// @route   GET /api/v1/feed
// @access  Private
exports.getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const result = await generateFeed(req.user.id, { page, limit });

    res.status(200).json({
      success: true,
      count: result.posts.length,
      total: result.total,
      page: result.page,
      pages: result.pages,
      data: result.posts,
    });
  } catch (error) {
    console.error('Feed Controller Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching feed',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
