const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
  getSuggestedUsers,
  updateProfilePicture,
  getAllUsers,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { uploadProfilePicture, handleMulterError } = require('../utils/uploadMiddleware');

// Admin routes (must be before /:username to avoid conflict)
router.get('/all', protect, authorize('admin'), getAllUsers);

// Suggested users (must be before /:username to avoid conflict)
router.get('/suggested', protect, getSuggestedUsers);

// Public routes
router.get('/search', searchUsers);
router.get('/:username', getUserProfile);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

// Protected routes
router.post('/:userId/follow', protect, followUser);
router.delete('/:userId/follow', protect, unfollowUser);
router.put('/profile-picture', protect, uploadProfilePicture, handleMulterError, updateProfilePicture);

// Admin routes (delete user)
router.delete('/:userId', protect, authorize('admin'), deleteUser);

module.exports = router;
