const User = require('../models/User');
const Post = require('../models/Post');

// @desc    Get user profile
// @route   GET /api/v1/users/:username
// @access  Public
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's post count (faster than loading all posts)
    const postCount = await Post.countDocuments({ author: user._id });

    res.status(200).json({
      success: true,
      data: {
        ...user,
        postCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow a user
// @route   POST /api/v1/users/:userId/follow
// @access  Private
exports.followUser = async (req, res, next) => {
  try {
    const userToFollow = await User.findById(req.params.userId);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Can't follow yourself
    if (req.params.userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const currentUser = await User.findById(req.user.id);

    // Check if already following
    if (currentUser.following.includes(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user',
      });
    }

    // Add to following and followers
    currentUser.following.push(req.params.userId);
    userToFollow.followers.push(req.user.id);

    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({
      success: true,
      message: 'User followed successfully',
      data: {
        following: true,
        followerCount: userToFollow.followers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/v1/users/:userId/follow
// @access  Private
exports.unfollowUser = async (req, res, next) => {
  try {
    const userToUnfollow = await User.findById(req.params.userId);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const currentUser = await User.findById(req.user.id);

    // Check if not following
    if (!currentUser.following.includes(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not following this user',
      });
    }

    // Remove from following and followers
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== req.params.userId
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.user.id
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.status(200).json({
      success: true,
      message: 'User unfollowed successfully',
      data: {
        following: false,
        followerCount: userToUnfollow.followers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user followers
// @route   GET /api/v1/users/:userId/followers
// @access  Public
exports.getFollowers = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'username profilePicture bio');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      count: user.followers.length,
      data: user.followers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user following
// @route   GET /api/v1/users/:userId/following
// @access  Public
exports.getFollowing = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', 'username profilePicture bio');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      count: user.following.length,
      data: user.following,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/v1/users/search
// @access  Public
exports.searchUsers = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .select('username profilePicture bio')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get suggested users to follow
// @route   GET /api/v1/users/suggested
// @access  Private
exports.getSuggestedUsers = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const currentUser = await User.findById(req.user.id).select('following');

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: currentUser._id, $nin: currentUser.following },
        },
      },
      { $addFields: { followersCount: { $size: '$followers' } } },
      { $sort: { followersCount: -1 } },
      { $limit: parseInt(limit) },
      { $project: { username: 1, profilePicture: 1, bio: 1, followersCount: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile picture
// @route   PUT /api/v1/users/profile-picture
// @access  Private
exports.updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image',
      });
    }

    // Copy image to client public folder
    const fs = require('fs');
    const path = require('path');
    const clientPublicPath = path.join(__dirname, '../../client/public/uploads', req.file.filename);
    
    try {
      const clientUploadsDir = path.join(__dirname, '../../client/public/uploads');
      if (!fs.existsSync(clientUploadsDir)) {
        fs.mkdirSync(clientUploadsDir, { recursive: true });
      }
      fs.copyFileSync(req.file.path, clientPublicPath);
      console.log('✅ Copied profile picture to client public:', clientPublicPath);
    } catch (err) {
      console.error('⚠️  Failed to copy to client public:', err.message);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: `/uploads/${req.file.filename}` },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/v1/users/all
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('username email role createdAt isVerified profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await User.countDocuments({});

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/v1/users/:userId
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Don't allow admin to delete themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    // Delete all posts by this user
    await Post.deleteMany({ author: user._id });

    // Remove user from followers/following of other users
    await User.updateMany(
      { followers: user._id },
      { $pull: { followers: user._id } }
    );
    await User.updateMany(
      { following: user._id },
      { $pull: { following: user._id } }
    );

    // Delete the user
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
