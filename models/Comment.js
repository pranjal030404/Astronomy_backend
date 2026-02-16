const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Comment cannot be empty'],
    maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    trim: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  }],
  isEdited: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
CommentSchema.index({ post: 1, createdAt: -1 });
CommentSchema.index({ author: 1 });
CommentSchema.index({ parentComment: 1 });

// Virtual for like count
CommentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for reply count
CommentSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Update the updatedAt timestamp before saving
CommentSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.isEdited = true;
    this.updatedAt = Date.now();
  }
  next();
});

// Add comment ID to post's comments array after save
CommentSchema.post('save', async function() {
  const Post = mongoose.model('Post');
  
  // If it's a top-level comment, add to post
  if (!this.parentComment) {
    await Post.findByIdAndUpdate(this.post, {
      $addToSet: { comments: this._id },
    });
  } else {
    // If it's a reply, add to parent comment's replies
    const Comment = mongoose.model('Comment');
    await Comment.findByIdAndUpdate(this.parentComment, {
      $addToSet: { replies: this._id },
    });
  }
});

// Remove comment ID from post's comments array before remove
CommentSchema.pre('remove', async function(next) {
  const Post = mongoose.model('Post');
  const Comment = mongoose.model('Comment');
  
  // Remove from post or parent comment
  if (!this.parentComment) {
    await Post.findByIdAndUpdate(this.post, {
      $pull: { comments: this._id },
    });
  } else {
    await Comment.findByIdAndUpdate(this.parentComment, {
      $pull: { replies: this._id },
    });
  }
  
  // Delete all replies to this comment
  await Comment.deleteMany({ parentComment: this._id });
  
  next();
});

module.exports = mongoose.model('Comment', CommentSchema);
