const User = require('../models/User');
const Post = require('../models/Post');
const Community = require('../models/Community');

// @desc    Get platform statistics
// @route   GET /api/v1/stats
// @access  Public
exports.getStats = async (req, res, next) => {
  try {
    // Get counts
    const [
      communityCount,
      userCount,
      postCount,
      totalMembers,
      totalImages
    ] = await Promise.all([
      Community.countDocuments(),
      User.countDocuments(),
      Post.countDocuments(),
      Community.aggregate([
        { $project: { memberCount: { $size: '$members' } } },
        { $group: { _id: null, total: { $sum: '$memberCount' } } }
      ]),
      Post.aggregate([
        { $project: { imageCount: { $size: { $ifNull: ['$images', []] } } } },
        { $group: { _id: null, total: { $sum: '$imageCount' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        communities: communityCount,
        users: userCount,
        posts: postCount,
        totalMembers: totalMembers[0]?.total || 0,
        totalImages: totalImages[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
