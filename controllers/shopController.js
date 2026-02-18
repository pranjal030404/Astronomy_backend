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
        console.log('✅ Copied shop item image to client public:', clientPublicPath);
      } catch (err) {
        console.error('⚠️  Failed to copy to client public:', err.message);
      }
      
      req.body.image = `/uploads/${req.file.filename}`;
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
      // Delete old image from local storage
      if (item.imagePublicId) {
        const fs = require('fs');
        const path = require('path');
        
        // Delete from server/uploads
        const serverPath = path.join(__dirname, '../uploads/shop', item.imagePublicId);
        if (fs.existsSync(serverPath)) {
          fs.unlinkSync(serverPath);
          console.log('🗑️  Deleted old image from server:', serverPath);
        }
        
        // Delete from client/public/uploads
        const clientPath = path.join(__dirname, '../../client/public/uploads', item.imagePublicId);
        if (fs.existsSync(clientPath)) {
          fs.unlinkSync(clientPath);
          console.log('🗑️  Deleted old image from client:', clientPath);
        }
      }
      
      // Copy new image to client public folder
      const fs = require('fs');
      const path = require('path');
      const clientPublicPath = path.join(__dirname, '../../client/public/uploads', req.file.filename);
      
      try {
        const clientUploadsDir = path.join(__dirname, '../../client/public/uploads');
        if (!fs.existsSync(clientUploadsDir)) {
          fs.mkdirSync(clientUploadsDir, { recursive: true });
        }
        fs.copyFileSync(req.file.path, clientPublicPath);
        console.log('✅ Copied new image to client public:', clientPublicPath);
      } catch (err) {
        console.error('⚠️  Failed to copy to client public:', err.message);
      }
      
      req.body.image = `/uploads/${req.file.filename}`;
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
    
    // Delete from local storage if image exists
    if (item.imagePublicId) {
      const fs = require('fs');
      const path = require('path');
      
      // Delete from server/uploads
      const serverPath = path.join(__dirname, '../uploads/shop', item.imagePublicId);
      if (fs.existsSync(serverPath)) {
        fs.unlinkSync(serverPath);
        console.log('🗑️  Deleted from server:', serverPath);
      }
      
      // Delete from client/public/uploads
      const clientPath = path.join(__dirname, '../../client/public/uploads', item.imagePublicId);
      if (fs.existsSync(clientPath)) {
        fs.unlinkSync(clientPath);
        console.log('🗑️  Deleted from client:', clientPath);
      }
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
