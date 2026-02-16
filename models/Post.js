const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  content: {
    type: String,
    maxlength: [5000, 'Content cannot exceed 5000 characters'],
    trim: true,
  },
  images: [{
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    width: Number,
    height: Number,
  }],
  astronomyData: {
    objectName: {
      type: String,
      trim: true,
    },
    objectType: {
      type: String,
      enum: ['Galaxy', 'Nebula', 'Planet', 'Star', 'Moon', 'Comet', 'Asteroid', 'Cluster', 'Other'],
    },
    coordinates: {
      ra: String,  // Right Ascension
      dec: String, // Declination
    },
    captureDate: Date,
    location: String,
    equipment: {
      telescope: String,
      camera: String,
      mount: String,
      filters: String,
    },
    shootingDetails: {
      iso: Number,
      exposure: String,
      focalLength: String,
      aperture: String,
      frames: Number,
      totalIntegration: String,
    },
    processing: {
      software: String,
      notes: String,
    },
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  }],
  tags: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public',
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
  },
  isPinned: {
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

// Indexes for performance
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ community: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ 'astronomyData.objectName': 'text', content: 'text' });

// Virtual for like count
PostSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
PostSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Update the updatedAt timestamp before saving
PostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Cascade delete comments when a post is deleted
PostSchema.pre('remove', async function(next) {
  await this.model('Comment').deleteMany({ post: this._id });
  next();
});

module.exports = mongoose.model('Post', PostSchema);
