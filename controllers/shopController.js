const ShopItem = require('../models/ShopItem');

// @desc    Get all shop items
// @route   GET /api/v1/shop
// @access  Public
exports.getShopItems = async (req, res, next) => {
  try {
    const { category, search, inStock, sort = '-createdAt' } = req.query;
    
    // Build query
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (inStock === 'true') {
      query.inStock = true;
    }
    
    const items = await ShopItem.find(query)
      .populate('createdBy', 'username')
      .sort(sort);
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single shop item
// @route   GET /api/v1/shop/:id
// @access  Public
exports.getShopItem = async (req, res, next) => {
  try {
    const item = await ShopItem.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Shop item not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create shop item (Admin only)
// @route   POST /api/v1/shop
// @access  Private/Admin
exports.createShopItem = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;
    
    // Handle image upload
    if (req.file) {
      req.body.image = req.file.path;
      req.body.imagePublicId = req.file.filename;
    }
    
    const item = await ShopItem.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Shop item created successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update shop item (Admin only)
// @route   PUT /api/v1/shop/:id
// @access  Private/Admin
exports.updateShopItem = async (req, res, next) => {
  try {
    let item = await ShopItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Shop item not found',
      });
    }
    
    // Handle new image upload
    if (req.file) {
      // Delete old image from Cloudinary
      if (item.imagePublicId) {
        const cloudinary = require('../config/cloudinary').cloudinary;
        await cloudinary.uploader.destroy(item.imagePublicId);
      }
      
      req.body.image = req.file.path;
      req.body.imagePublicId = req.file.filename;
    }
    
    item = await ShopItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    res.status(200).json({
      success: true,
      message: 'Shop item updated successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete shop item (Admin only)
// @route   DELETE /api/v1/shop/:id
// @access  Private/Admin
exports.deleteShopItem = async (req, res, next) => {
  try {
    const item = await ShopItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Shop item not found',
      });
    }
    
    // Delete from Cloudinary if image exists
    if (item.imagePublicId) {
      const cloudinary = require('../config/cloudinary').cloudinary;
      await cloudinary.uploader.destroy(item.imagePublicId);
    }
    
    await item.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Shop item deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
