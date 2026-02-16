const Post = require('../models/Post');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// @desc    Create a new post
// @route   POST /api/v1/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { content, astronomyData, tags, visibility, community } = req.body;

    // Validate that at least content or images exist
    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Post must have either content or at least one image',
      });
    }

    // Process uploaded images
    const images = req.files?.map(file => ({
      url: file.path,
      publicId: file.filename,
      width: file.width,
      height: file.height,
    })) || [];

    // Parse astronomyData if it's a string
    let parsedAstronomyData = astronomyData;
    if (typeof astronomyData === 'string') {
      try {
        parsedAstronomyData = JSON.parse(astronomyData);
      } catch (e) {
        parsedAstronomyData = {};
      }
    }

    // Parse tags if it's a string
    let parsedTags = tags;
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    const post = await Post.create({
      author: req.user.id,
      content,
      images,
      astronomyData: parsedAstronomyData,
      tags: parsedTags,
      visibility: visibility || 'public',
      community: community || null,
    });

    await post.populate('author', 'username profilePicture');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts (with filters and pagination)
// @route   GET /api/v1/posts
// @access  Public
exports.getPosts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      author,
      community,
      tag,
      search,
    } = req.query;

    // Build query
    const query = { visibility: 'public' };

    if (author) query.author = author;
    if (community) query.community = community;
    if (tag) query.tags = tag;
    
    // Search in content and astronomy object name
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { 'astronomyData.objectName': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const posts = await Post.find(query)
      .populate('author', 'username profilePicture')
      .populate('community', 'name slug')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/v1/posts/:id
// @access  Public
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profilePicture bio')
      .populate('community', 'name slug')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profilePicture',
        },
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update post
// @route   PUT /api/v1/posts/:id
// @access  Private (owner only)
exports.updatePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check ownership
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post',
      });
    }

    const { content, astronomyData, tags, visibility } = req.body;

    post = await Post.findByIdAndUpdate(
      req.params.id,
      { content, astronomyData, tags, visibility },
      { new: true, runValidators: true }
    ).populate('author', 'username profilePicture');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/v1/posts/:id
// @access  Private (owner only)
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check ownership
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
      });
    }

    // Delete images from Cloudinary
    if (post.images && post.images.length > 0) {
      for (const image of post.images) {
        try {
          await cloudinary.uploader.destroy(image.publicId);
        } catch (err) {
          console.error('Error deleting image from Cloudinary:', err);
        }
      }
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like a post
// @route   POST /api/v1/posts/:id/like
// @access  Private
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if already liked
    const alreadyLiked = post.likes.includes(req.user.id);

    if (alreadyLiked) {
      return res.status(400).json({
        success: false,
        message: 'You already liked this post',
      });
    }

    post.likes.push(req.user.id);
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post liked',
      data: {
        likeCount: post.likes.length,
        liked: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unlike a post
// @route   DELETE /api/v1/posts/:id/like
// @access  Private
exports.unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if not yet liked
    const likeIndex = post.likes.indexOf(req.user.id);

    if (likeIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You have not liked this post',
      });
    }

    post.likes.splice(likeIndex, 1);
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post unliked',
      data: {
        likeCount: post.likes.length,
        liked: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts by user
// @route   GET /api/v1/posts/user/:userId
// @access  Public
exports.getUserPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'username profilePicture')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Post.countDocuments({ author: req.params.userId });

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};
