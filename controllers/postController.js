const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Import Community model if it exists
let Community;
try {
  Community = require('../models/Community');
} catch (err) {
  console.warn('Community model not found, community features will be disabled');
}

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

    // Validate content is not just whitespace
    if (content && !content.trim() && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Post must have meaningful content or at least one image',
      });
    }

    // Process uploaded images
    const images = req.files?.map(file => {
      console.log('📸 Image uploaded:', file.filename, 'Size:', file.size, 'Path:', file.path);
      
      // Local storage - copy to client public folder too for Vite dev server
      const fs = require('fs');
      const path = require('path');
      const clientPublicPath = path.join(__dirname, '../../client/public/uploads', file.filename);
      
      try {
        // Ensure client public uploads directory exists
        const clientUploadsDir = path.join(__dirname, '../../client/public/uploads');
        if (!fs.existsSync(clientUploadsDir)) {
          fs.mkdirSync(clientUploadsDir, { recursive: true });
        }
        
        // Copy file to client public folder
        fs.copyFileSync(file.path, clientPublicPath);
        console.log('✅ Copied to client public:', clientPublicPath);
      } catch (err) {
        console.error('⚠️  Failed to copy to client public:', err.message);
      }
      
      return {
        url: `/uploads/${file.filename}`,
        publicId: file.filename,
        width: null,
        height: null,
      };
    }) || [];

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
    
    console.log('✅ Post created with', images.length, 'images');
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Delete local file
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../uploads', file.filename);
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    
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

    let postsQuery = Post.find(query)
      .select('author content images likes comments tags visibility community createdAt')
      .populate('author', 'username profilePicture')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    // Only populate community if model exists
    if (Community) {
      postsQuery = postsQuery.populate('community', 'name slug');
    }
    
    const posts = await postsQuery;

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
    let postQuery = Post.findById(req.params.id)
      .populate('author', 'username profilePicture bio')
      .populate({
        path: 'comments',
        options: { limit: 50, sort: { createdAt: -1 } },
        populate: {
          path: 'author',
          select: 'username profilePicture',
        },
      });
    
    // Only populate community if model exists
    if (Community) {
      postQuery = postQuery.populate('community', 'name slug');
    }
    
    const post = await postQuery;

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

    // Check ownership (or admin)
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
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

    // Check ownership (or admin)
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
      });
    }

    // Delete images from local storage
    if (post.images && post.images.length > 0) {
      const fs = require('fs');
      const path = require('path');
      
      for (const image of post.images) {
        try {
          // Delete from server/uploads
          const serverPath = path.join(__dirname, '../uploads/posts', image.publicId);
          if (fs.existsSync(serverPath)) {
            fs.unlinkSync(serverPath);
            console.log('🗑️  Deleted from server:', serverPath);
          }
          
          // Delete from client/public/uploads
          const clientPath = path.join(__dirname, '../../client/public/uploads', image.publicId);
          if (fs.existsSync(clientPath)) {
            fs.unlinkSync(clientPath);
            console.log('🗑️  Deleted from client:', clientPath);
          }
        } catch (err) {
          console.error('Error deleting image:', err);
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

// @desc    Share a post with another user (sends in-app notification)
// @route   POST /api/v1/posts/:id/share
// @access  Private
exports.sharePost = async (req, res, next) => {
  try {
    const { recipientUsername } = req.body;

    if (!recipientUsername) {
      return res.status(400).json({ success: false, message: 'Recipient username is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const recipient = await User.findOne({ username: recipientUsername.trim() });
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (recipient._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot share a post with yourself' });
    }

    // Avoid duplicate share notifications within 60 seconds
    const recentShare = await Notification.findOne({
      recipient: recipient._id,
      sender: req.user._id,
      post: post._id,
      type: 'share_post',
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    });

    if (recentShare) {
      return res.status(400).json({ success: false, message: 'You already shared this post with that user recently' });
    }

    await Notification.create({
      recipient: recipient._id,
      sender: req.user._id,
      type: 'share_post',
      post: post._id,
    });

    res.status(200).json({ success: true, message: `Post shared with ${recipient.username}` });
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
      .select('author content images likes comments tags visibility createdAt')
      .populate('author', 'username profilePicture')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

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
