const express = require('express');
const router = express.Router();
const {
  getShopItems,
  getShopItem,
  createShopItem,
  updateShopItem,
  deleteShopItem,
} = require('../controllers/shopController');
const { protect, authorize } = require('../middleware/auth');
const { uploadShopImage } = require('../utils/uploadMiddleware');

// Public routes
router.get('/', getShopItems);
router.get('/:id', getShopItem);

// Admin only routes
router.post('/', protect, authorize('admin'), uploadShopImage, createShopItem);
router.put('/:id', protect, authorize('admin'), uploadShopImage, updateShopItem);
router.delete('/:id', protect, authorize('admin'), deleteShopItem);

module.exports = router;
