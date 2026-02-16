const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      enum: ['telescopes', 'cameras', 'accessories', 'books', 'software', 'other'],
    },
    image: {
      type: String,
      required: [true, 'Please add an image'],
    },
    imagePublicId: {
      type: String, // Cloudinary public ID for deletion
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    reviews: {
      type: Number,
      default: 0,
      min: [0, 'Reviews cannot be negative'],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
shopItemSchema.index({ category: 1, inStock: 1 });
shopItemSchema.index({ featured: 1 });

module.exports = mongoose.model('ShopItem', shopItemSchema);
