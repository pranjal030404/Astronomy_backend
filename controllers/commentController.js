const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @desc    Get comments for a post
// @route   GET /api/v1/posts/:postId/comments
// @access  Public
exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
      parentComment: null, // Only top-level comments
    })
      .populate('author', 'username profilePicture')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username profilePicture',
        },
      })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a comment
// @route   POST /api/v1/posts/:postId/comments
// @access  Private
exports.createComment = async (req, res, next) => {
  try {
    const { content, parentComment } = req.body;

    // Check if post exists
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Create comment
    const comment = await Comment.create({
      post: req.params.postId,
      author: req.user.id,
      content,
      parentComment: parentComment || null,
    });

    await comment.populate('author', 'username profilePicture');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a comment
// @route   PUT /api/v1/comments/:id
// @access  Private (owner only)
exports.updateComment = async (req, res, next) => {
  try {
    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check ownership
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment',
      });
    }

    comment.content = req.body.content;
    await comment.save();

    await comment.populate('author', 'username profilePicture');

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/v1/comments/:id
// @access  Private (owner only)
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check ownership
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
      });
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like a comment
// @route   POST /api/v1/comments/:id/like
// @access  Private
exports.likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if already liked
    const alreadyLiked = comment.likes.includes(req.user.id);

    if (alreadyLiked) {
      return res.status(400).json({
        success: false,
        message: 'You already liked this comment',
      });
    }

    comment.likes.push(req.user.id);
    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Comment liked',
      data: {
        likeCount: comment.likes.length,
        liked: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unlike a comment
// @route   DELETE /api/v1/comments/:id/like
// @access  Private
exports.unlikeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if not yet liked
    const likeIndex = comment.likes.indexOf(req.user.id);

    if (likeIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You have not liked this comment',
      });
    }

    comment.likes.splice(likeIndex, 1);
    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Comment unliked',
      data: {
        likeCount: comment.likes.length,
        liked: false,
      },
    });
  } catch (error) {
    next(error);
  }
};
