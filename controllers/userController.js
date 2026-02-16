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
      .populate('following', 'username profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's post count
    const postCount = await Post.countDocuments({ author: user._id });

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
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

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: req.file.path },
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
