const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
  updateProfilePicture,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadProfilePicture, handleMulterError } = require('../utils/uploadMiddleware');

// Public routes
router.get('/search', searchUsers);
router.get('/:username', getUserProfile);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

// Protected routes
router.post('/:userId/follow', protect, followUser);
router.delete('/:userId/follow', protect, unfollowUser);
router.put('/profile-picture', protect, uploadProfilePicture, handleMulterError, updateProfilePicture);

module.exports = router;
