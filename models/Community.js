const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a community name'],
    unique: true,
    trim: true,
    minlength: [3, 'Community name must be at least 3 characters'],
    maxlength: [50, 'Community name cannot exceed 50 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  coverImage: {
    type: String,
    default: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=400&fit=crop',
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  rules: [{
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  }],
  category: {
    type: String,
    required: true,
    enum: [
      'Deep Sky Objects',
      'Planetary Imaging',
      'Astrophotography',
      'Solar System',
      'Wide Field',
      'Equipment & Gear',
      'Beginners',
      'Image Processing',
      'Observing',
      'General Discussion',
      'Other',
    ],
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  requireApproval: {
    type: Boolean,
    default: false,
  },
  pendingMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  bannedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  postCount: {
    type: Number,
    default: 0,
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

// Indexes (name and slug already have unique:true which creates indexes)
CommunitySchema.index({ category: 1 });
CommunitySchema.index({ members: 1 });
CommunitySchema.index({ name: 'text', description: 'text' });

// Virtual for member count
CommunitySchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for posts in this community
CommunitySchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'community',
  justOne: false,
});

// Create slug from name before saving
CommunitySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  this.updatedAt = Date.now();
  next();
});

// Add admin to members and moderators on creation
CommunitySchema.pre('save', function(next) {
  if (this.isNew) {
    this.members.push(this.admin);
    this.moderators.push(this.admin);
  }
  next();
});

module.exports = mongoose.model('Community', CommunitySchema);
