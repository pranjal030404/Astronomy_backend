const express = require('express');
const router = express.Router();
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// Comment routes (postId in URL handled by post routes)
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);
router.delete('/:id/like', protect, unlikeComment);

module.exports = router;
