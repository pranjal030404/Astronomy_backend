const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getUserPosts,
  sharePost,
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadPostImages, handleMulterError } = require('../utils/uploadMiddleware');

// Public routes
router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPost);
router.get('/user/:userId', getUserPosts);

// Protected routes
router.post('/', protect, uploadPostImages, handleMulterError, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.delete('/:id/like', protect, unlikePost);
router.post('/:id/share', protect, sharePost);

module.exports = router;
